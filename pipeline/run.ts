// The content pipeline. Feeds find candidate actions, one model drafts entries, and a model from a
// different company verifies them. Entries publish without human review; retract anything bad.
//
//   npm run pipeline -- feeds   [--since YYYY-MM-DD]
//   npm run pipeline -- triage  [--limit N] [--concurrency N]
//   npm run pipeline -- draft   [--limit N] [--min-impact 1-5] [--writer claude|codex] [--concurrency N] [keys...]
//   npm run pipeline -- verify  [--limit N] [--stale DAYS] [--concurrency N] [files...]
//   npm run pipeline -- retract <slug> [--reason "..."]
//   npm run pipeline -- all     [--since YYYY-MM-DD] [--limit N]
import './lib/env.ts';
import { existsSync } from 'node:fs';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { CONTENT, ROOT, idFromPath, listFiles, parseMarkdown, readAllEntries, readMarkdown, rel, writeMarkdown } from './lib/content.ts';
import { MODELS, TRIAGE_MODEL, otherProvider, providerOfModel, runLlm, type Provider } from './lib/llm.ts';
import {
  OFFICIALS_RULE,
  TRIAGE_SCHEMA,
  VERIFIER_SCHEMA,
  WRITER_SCHEMA,
  triagePrompt,
  verifierPrompt,
  writerPrompt,
  type TriageOutput,
  type VerifierOutput,
  type WriterOutput,
} from './prompts.ts';
import { validateEntry } from './validate.ts';

const CANDIDATES = join(ROOT, 'pipeline/state/candidates.json');
const DECISIONS = join(ROOT, 'pipeline/decisions.json'); // committed: what we did with each candidate key
const RETRACTED = join(ROOT, 'pipeline/retracted.json'); // committed: never re-add these
// News-release feeds announce actions that the law, rule and council feeds also carry.
const ANNOUNCEMENT_FEEDS = /(-mayor|-governor|-news)$/;

// Local calendar date (YYYY-MM-DD), so late-evening runs don't stamp tomorrow's date.
const today = () => new Date().toLocaleDateString('en-CA');

async function readJson<T>(file: string, fallback: T): Promise<T> {
  return existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : fallback;
}
// Write to a temp file and rename, so an interrupted run never leaves half a file.
let writes = 0;
async function writeJson(file: string, data: unknown) {
  const tmp = `${file}.${process.pid}-${++writes}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 1) + '\n');
  await rename(tmp, file);
}

// promising: triage passed it and it waits to be drafted. impact: triage's 1-5 score for working people.
type Decision = {
  decision: 'promising' | 'drafted' | 'skip' | 'error';
  reason: string;
  date: string;
  impact?: number;
  file?: string;
  attempts?: number;
};
const MAX_ATTEMPTS = 3;
type Retraction = { slug: string; source_key?: string; title?: string; reason: string; date: string };

async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length) await fn(queue.shift()!);
    }),
  );
}

const existingEntries = readAllEntries;

async function writeOfficials(officials: { id: string; yaml: string }[]) {
  for (const o of officials) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(o.id)) continue;
    const file = join(CONTENT, 'officials', `${o.id}.yaml`);
    if (!existsSync(file)) await writeFile(file, o.yaml.trim() + '\n');
  }
}

// --- feeds ---------------------------------------------------------------

async function feeds(since: string) {
  const { fetchAll, saveCandidates } = await import('./feeds/index.ts');
  const found = await fetchAll({ since });
  const { total, added } = await saveCandidates(found); // merges, keeping `seen` and fields a sparser fetch lacks
  console.log(`feeds: ${found.length} candidates fetched (${added} new), ${total} known`);
}

// --- triage --------------------------------------------------------------

const TRIAGE_BATCH = 40;

// Keys that never need triage or drafting: already an entry, retracted, or decided.
async function settledKeys(decisions: Record<string, Decision>, retracted: Retraction[]) {
  const entries = await existingEntries();
  return new Set<string>([
    ...entries.map((e) => e.data.source_key).filter(Boolean),
    ...retracted.map((r) => r.source_key).filter((k): k is string => Boolean(k)),
    ...Object.keys(decisions),
  ]);
}

// Screens every candidate without a decision on the cheaper triage model, newest first, and records
// promising/skip with an impact score. decisions.json is saved after every batch.
async function triage({ limit, concurrency }: { limit: number; concurrency: number }) {
  const candidates = await readJson<any[]>(CANDIDATES, []);
  const decisions = await readJson<Record<string, Decision>>(DECISIONS, {});
  const retracted = await readJson<Retraction[]>(RETRACTED, []);
  const settled = await settledKeys(decisions, retracted);
  const fresh = candidates
    .filter((c) => !settled.has(c.key))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
  const batches = Array.from({ length: Math.ceil(fresh.length / TRIAGE_BATCH) }, (_, i) => fresh.slice(i * TRIAGE_BATCH, (i + 1) * TRIAGE_BATCH));
  console.log(`triage: ${fresh.length} new candidates in ${batches.length} batches with ${TRIAGE_MODEL}`);

  const provider = providerOfModel(TRIAGE_MODEL);
  let saving = Promise.resolve();
  let done = 0;
  await pool(batches, concurrency, async (batch) => {
    const started = Date.now();
    try {
      const prompt = await triagePrompt(batch);
      const { data } = await runLlm<TriageOutput>(provider, { prompt, schema: TRIAGE_SCHEMA, web: false, cwd: ROOT, model: TRIAGE_MODEL, timeoutMs: 10 * 60_000 });
      const byKey = new Map(data.results.map((r) => [r.key, r]));
      let promising = 0;
      for (const c of batch) {
        const r = byKey.get(c.key);
        if (!r) continue; // left for the next run
        if (r.decision === 'draft') promising++;
        decisions[c.key] = { decision: r.decision === 'draft' ? 'promising' : 'skip', reason: `triage: ${r.reason}`, impact: r.impact, date: today() };
      }
      console.log(`  batch ${++done}/${batches.length}: ${promising} promising of ${batch.length} (${Math.round((Date.now() - started) / 1000)}s)`);
    } catch (err) {
      console.log(`  batch ${++done}/${batches.length} failed: ${String(err).slice(0, 200)}`);
    }
    saving = saving.then(() => writeJson(DECISIONS, decisions));
    await saving;
  });
}

// --- draft ---------------------------------------------------------------

async function draft({ limit, writer, concurrency, keys }: { limit: number; writer: Provider; concurrency: number; keys: string[] }) {
  // Screen anything new first, so drafting only spends a full research call on plausible actions.
  await triage({ limit: Infinity, concurrency });

  const candidates = await readJson<any[]>(CANDIDATES, []);
  const decisions = await readJson<Record<string, Decision>>(DECISIONS, {});
  const retracted = await readJson<Retraction[]>(RETRACTED, []);
  const entries = await existingEntries();
  const taken = new Set([...entries.map((e) => e.data.source_key), ...retracted.map((r) => r.source_key)].filter(Boolean));
  // Promising candidates (at least minImpact), plus errors still under MAX_ATTEMPTS: highest impact first; within an
  // impact level the enacted action itself (laws, rules, orders, council votes) before announcements about it, so an
  // announcement drafted later sees the law's entry and is skipped as a duplicate; then newest.
  const announcement = (c: { feed?: string }) => (ANNOUNCEMENT_FEEDS.test(c.feed ?? '') ? 1 : 0);
  const queue = candidates
    .filter((c) => {
      const d = decisions[c.key];
      if (!d || taken.has(c.key) || (d.impact ?? 0) < minImpact || (keys.length && !keys.includes(c.key))) return false;
      return d.decision === 'promising' || (d.decision === 'error' && (d.attempts ?? 1) < MAX_ATTEMPTS);
    })
    .sort(
      (a, b) =>
        (decisions[b.key].impact ?? 0) - (decisions[a.key].impact ?? 0) || announcement(a) - announcement(b) || b.date.localeCompare(a.date),
    );
  const todo = queue.slice(0, limit);
  console.log(`draft: ${queue.length} promising candidates, drafting ${todo.length} with ${MODELS[writer]}`);

  const retractedSlugs = new Set(retracted.map((r) => r.slug));
  await pool(todo, concurrency, async (candidate) => {
    const record = (d: Omit<Decision, 'date'>) => {
      const prior = decisions[candidate.key];
      const attempts = (prior?.attempts ?? 0) + 1;
      decisions[candidate.key] = { ...d, impact: prior?.impact, date: today(), ...(d.decision === 'error' ? { attempts } : {}) };
      console.log(`  ${d.decision.padEnd(7)} ${candidate.key}: ${d.reason}`);
    };
    try {
      const prompt = await writerPrompt(candidate, MODELS[writer], writer === 'claude' ? 'claude-code' : 'codex-cli');
      let { data } = await runLlm<WriterOutput>(writer, { prompt, schema: WRITER_SCHEMA, web: true, cwd: ROOT });
      if (data.decision === 'skip' || !data.file || !data.slug) return record({ decision: 'skip', reason: data.reason });
      if (retractedSlugs.has(data.slug)) return record({ decision: 'skip', reason: `slug ${data.slug} was retracted` });

      const verification = { writer: { model: MODELS[writer], via: writer === 'claude' ? 'claude-code' : 'codex-cli', date: today() }, verdict: 'pending' };
      let file: string | undefined;

      // Parse, place, write, and validate a draft. YAML errors come back as problems so they get a repair round too.
      const materialize = async (out: WriterOutput): Promise<string[]> => {
        let doc;
        try {
          doc = parseMarkdown(out.file!);
        } catch (err) {
          return [`the frontmatter isn't valid YAML (${String(err).split('\n')[0]}); quote any value containing a colon`];
        }
        if (!file) {
          const level = ['federal', 'state', 'local'].includes(doc.data.level) ? doc.data.level : 'federal';
          const target = join(CONTENT, 'entries', level, `${data.slug}.md`);
          if (existsSync(target)) throw new Error(`${rel(target)} already exists`);
          file = target;
        }
        Object.assign(doc.data, { source_key: candidate.key, verification });
        await writeOfficials(out.new_officials);
        await writeMarkdown(file, doc);
        return (await validateEntry(file)).map((p) => p.message);
      };

      let problems = await materialize(data);
      if (problems.length) {
        // One repair round: show the writer its problems.
        const fix = `${prompt}\n\nYour previous draft had problems:\n${problems.map((p) => `- ${p}`).join('\n')}\n\n${OFFICIALS_RULE}\n\nPrevious draft:\n${data.file}\n\nReturn a corrected draft.`;
        const repaired = (await runLlm<WriterOutput>(writer, { prompt: fix, schema: WRITER_SCHEMA, web: false, cwd: ROOT })).data;
        if (repaired.file) problems = await materialize(repaired);
      }
      if (problems.length) {
        if (file && existsSync(file)) await rm(file);
        return record({ decision: 'error', reason: `invalid after repair: ${problems.join('; ')}` });
      }
      record({ decision: 'drafted', reason: data.reason, file: rel(file!) });
    } catch (err) {
      record({ decision: 'error', reason: String(err).slice(0, 300) });
    } finally {
      await writeJson(DECISIONS, decisions);
    }
  });
}

// --- verify --------------------------------------------------------------

async function verify({ limit, stale, concurrency, files }: { limit: number; stale?: number; concurrency: number; files: string[] }) {
  const cutoff = stale ? Date.now() - stale * 86_400_000 : undefined;
  const all = files.length ? await Promise.all(files.map(async (f) => ({ file: join(ROOT, f), ...(await readMarkdown(join(ROOT, f))) }))) : await existingEntries();
  const todo = all
    .filter((e) => files.length || e.data.verification?.verdict === 'pending' || (cutoff && new Date(e.data.status?.as_of).getTime() < cutoff))
    .slice(0, limit);
  console.log(`verify: ${todo.length} entries`);

  await pool(todo, concurrency, async (entry) => {
    const writerModel: string = entry.data.verification?.writer?.model ?? 'claude';
    const verifier = otherProvider(providerOfModel(writerModel));
    const original = await readFile(entry.file, 'utf8');
    const doc = parseMarkdown(original);
    const keep = { source_key: doc.data.source_key, verification: doc.data.verification };

    // Write a verifier's corrected file (keeping our bookkeeping fields) and return its validation problems.
    const applyCorrection = async (out: VerifierOutput) => {
      await writeOfficials(out.new_officials);
      const corrected = parseMarkdown(out.file!);
      Object.assign(corrected.data, keep);
      await writeMarkdown(entry.file, corrected);
      return validateEntry(entry.file);
    };

    try {
      const prompt = await verifierPrompt(rel(entry.file), original);
      let { data, model, via } = await runLlm<VerifierOutput>(verifier, { prompt, schema: VERIFIER_SCHEMA, web: true, cwd: ROOT });

      if (data.verdict === 'corrected' && data.file) {
        let problems = await applyCorrection(data);
        if (problems.length) {
          // One repair round, usually for officials referenced without a file in new_officials.
          const fix = `${prompt}\n\nYou returned verdict "corrected", but your corrected file failed validation:\n${problems.map((p) => `- ${p.message}`).join('\n')}\n\n${OFFICIALS_RULE}\n\nYour corrected file:\n${data.file}\n\nReturn verdict "corrected" with a valid file.`;
          const repaired = (await runLlm<VerifierOutput>(verifier, { prompt: fix, schema: VERIFIER_SCHEMA, web: false, cwd: ROOT })).data;
          if (repaired.file) {
            data = { ...repaired, problems: data.problems, notes: data.notes };
            problems = await applyCorrection(data);
          }
        }
        if (problems.length) {
          // A mechanical failure isn't a factual verdict: restore the original and leave it pending for the next run.
          await writeFile(entry.file, original);
          console.log(`  retry     ${rel(entry.file)}: correction invalid (${problems.map((p) => p.message).join('; ')})`);
          return;
        }
      }

      const final = parseMarkdown(await readFile(entry.file, 'utf8'));
      final.data.verification = {
        writer: keep.verification.writer,
        verifier: { model, via, date: today() },
        verdict: data.verdict,
        notes: data.verdict === 'fail' ? [data.notes, ...data.problems].join(' ') : data.notes,
      };
      await writeMarkdown(entry.file, final);
      console.log(`  ${data.verdict.padEnd(9)} ${rel(entry.file)} (${model})${data.problems.length ? `: ${data.problems.join(' | ').slice(0, 400)}` : ''}`);
    } catch (err) {
      await writeFile(entry.file, original);
      console.log(`  error     ${rel(entry.file)}: ${String(err).slice(0, 300)}`);
    }
  });
}

// --- retract -------------------------------------------------------------

async function retract(slug: string, reason: string) {
  const file = (await listFiles(join(CONTENT, 'entries'), '.md')).find((f) => idFromPath(f) === slug);
  if (!file) throw new Error(`no entry named ${slug}`);
  const { data } = await readMarkdown(file);
  const retracted = await readJson<Retraction[]>(RETRACTED, []);
  retracted.push({ slug, source_key: data.source_key, title: data.title, reason, date: today() });
  await writeJson(RETRACTED, retracted);
  await rm(file);
  console.log(`retracted ${rel(file)}; the pipeline won't add it again`);
}

// --- cli -----------------------------------------------------------------

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    since: { type: 'string', default: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10) },
    limit: { type: 'string' },
    writer: { type: 'string', default: 'claude' },
    concurrency: { type: 'string', default: '2' },
    'min-impact': { type: 'string', default: '0' },
    stale: { type: 'string' },
    reason: { type: 'string', default: 'Retracted by editor' },
  },
});
const [command, ...rest] = positionals;
const limit = values.limit ? Number(values.limit) : 10;
const concurrency = Number(values.concurrency);
const minImpact = Number(values['min-impact']);
const writer = values.writer === 'codex' ? 'codex' : 'claude';

switch (command) {
  case 'feeds':
    await feeds(values.since!);
    break;
  case 'triage':
    await triage({ limit: values.limit ? Number(values.limit) : Infinity, concurrency });
    break;
  case 'draft':
    await draft({ limit, writer, concurrency, keys: rest });
    break;
  case 'verify':
    await verify({ limit, stale: values.stale ? Number(values.stale) : undefined, concurrency, files: rest });
    break;
  case 'retract':
    if (!rest[0]) throw new Error('usage: retract <slug> [--reason "..."]');
    await retract(rest[0], values.reason!);
    break;
  case 'all':
    await feeds(values.since!);
    await draft({ limit, writer, concurrency, keys: [] });
    await verify({ limit: limit * 2, concurrency, files: [] });
    break;
  default:
    console.log('usage: npm run pipeline -- <feeds|triage|draft|verify|retract|all> [options]');
    process.exit(1);
}
