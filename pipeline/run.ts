// The content pipeline. Feeds find candidate actions, one model drafts entries, and a model from a
// different company verifies them. Entries publish without human review; retract anything bad.
//
//   npm run pipeline -- feeds   [--since YYYY-MM-DD]
//   npm run pipeline -- draft   [--limit N] [--writer claude|codex] [--concurrency N]
//   npm run pipeline -- verify  [--limit N] [--stale DAYS] [--concurrency N] [files...]
//   npm run pipeline -- retract <slug> [--reason "..."]
//   npm run pipeline -- all     [--since YYYY-MM-DD] [--limit N]
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { CONTENT, ROOT, formatMarkdown, idFromPath, listFiles, parseMarkdown, readMarkdown, rel, writeMarkdown } from './lib/content.ts';
import { MODELS, otherProvider, providerOfModel, runLlm, type Provider } from './lib/llm.ts';
import { VERIFIER_SCHEMA, WRITER_SCHEMA, verifierPrompt, writerPrompt, type VerifierOutput, type WriterOutput } from './prompts.ts';
import { validateEntry } from './validate.ts';

const CANDIDATES = join(ROOT, 'pipeline/state/candidates.json');
const DECISIONS = join(ROOT, 'pipeline/decisions.json'); // committed: what we did with each candidate key
const RETRACTED = join(ROOT, 'pipeline/retracted.json'); // committed: never re-add these

const today = () => new Date().toISOString().slice(0, 10);

async function readJson<T>(file: string, fallback: T): Promise<T> {
  return existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : fallback;
}
const writeJson = (file: string, data: unknown) => writeFile(file, JSON.stringify(data, null, 1) + '\n');

type Decision = { decision: 'drafted' | 'skip' | 'error'; reason: string; date: string; file?: string };
type Retraction = { slug: string; source_key?: string; title?: string; reason: string; date: string };

async function pool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length) await fn(queue.shift()!);
    }),
  );
}

async function existingEntries() {
  return Promise.all(
    (await listFiles(join(CONTENT, 'entries'), '.md')).map(async (file) => ({ file, ...(await readMarkdown(file)) })),
  );
}

async function writeOfficials(officials: { id: string; yaml: string }[]) {
  for (const o of officials) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(o.id)) continue;
    const file = join(CONTENT, 'officials', `${o.id}.yaml`);
    if (!existsSync(file)) await writeFile(file, o.yaml.trim() + '\n');
  }
}

// --- feeds ---------------------------------------------------------------

async function feeds(since: string) {
  const { fetchAll } = await import('./feeds/index.ts');
  const found = await fetchAll({ since });
  const existing = await readJson<any[]>(CANDIDATES, []);
  const byKey = new Map(existing.map((c) => [c.key, c]));
  for (const c of found) byKey.set(c.key, c);
  await mkdir(join(ROOT, 'pipeline/state'), { recursive: true });
  await writeJson(CANDIDATES, [...byKey.values()]);
  console.log(`feeds: ${found.length} candidates fetched, ${byKey.size} known`);
}

// --- draft ---------------------------------------------------------------

async function draft({ limit, writer, concurrency }: { limit: number; writer: Provider; concurrency: number }) {
  const candidates = await readJson<any[]>(CANDIDATES, []);
  const decisions = await readJson<Record<string, Decision>>(DECISIONS, {});
  const retracted = await readJson<Retraction[]>(RETRACTED, []);
  const entries = await existingEntries();
  const taken = new Set([
    ...entries.map((e) => e.data.source_key).filter(Boolean),
    ...retracted.map((r) => r.source_key).filter(Boolean),
    ...Object.keys(decisions),
  ]);
  const todo = candidates.filter((c) => !taken.has(c.key)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  console.log(`draft: ${todo.length} candidates with ${MODELS[writer]}`);

  const retractedSlugs = new Set(retracted.map((r) => r.slug));
  await pool(todo, concurrency, async (candidate) => {
    const record = (d: Omit<Decision, 'date'>) => {
      decisions[candidate.key] = { ...d, date: today() };
      console.log(`  ${d.decision.padEnd(7)} ${candidate.key}: ${d.reason}`);
    };
    try {
      const prompt = await writerPrompt(candidate, MODELS[writer], writer === 'claude' ? 'claude-code' : 'codex-cli');
      let { data } = await runLlm<WriterOutput>(writer, { prompt, schema: WRITER_SCHEMA, web: true, cwd: ROOT });
      if (data.decision === 'skip' || !data.file || !data.slug) return record({ decision: 'skip', reason: data.reason });
      if (retractedSlugs.has(data.slug)) return record({ decision: 'skip', reason: `slug ${data.slug} was retracted` });

      const doc = parseMarkdown(data.file);
      const level = ['federal', 'state', 'local'].includes(doc.data.level) ? doc.data.level : 'federal';
      const file = join(CONTENT, 'entries', level, `${data.slug}.md`);
      if (existsSync(file)) return record({ decision: 'skip', reason: `${rel(file)} already exists` });
      doc.data.source_key = candidate.key;
      doc.data.verification = { writer: { model: MODELS[writer], via: writer === 'claude' ? 'claude-code' : 'codex-cli', date: today() }, verdict: 'pending' };

      await writeOfficials(data.new_officials);
      await writeMarkdown(file, doc);
      let problems = await validateEntry(file);
      if (problems.length) {
        // One repair round: show the writer its validation errors.
        const fix = `${prompt}\n\nYour previous draft failed validation:\n${problems.map((p) => `- ${p.message}`).join('\n')}\n\nPrevious draft:\n${formatMarkdown(doc)}\n\nReturn a corrected draft.`;
        ({ data } = await runLlm<WriterOutput>(writer, { prompt: fix, schema: WRITER_SCHEMA, web: false, cwd: ROOT }));
        if (data.file) {
          const fixed = parseMarkdown(data.file);
          fixed.data.source_key = candidate.key;
          fixed.data.verification = doc.data.verification;
          await writeOfficials(data.new_officials);
          await writeMarkdown(file, fixed);
          problems = await validateEntry(file);
        }
      }
      if (problems.length) {
        await rm(file);
        return record({ decision: 'error', reason: `invalid after repair: ${problems.map((p) => p.message).join('; ')}` });
      }
      record({ decision: 'drafted', reason: data.reason, file: rel(file) });
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
    try {
      const prompt = await verifierPrompt(rel(entry.file), original);
      const { data, model, via } = await runLlm<VerifierOutput>(verifier, { prompt, schema: VERIFIER_SCHEMA, web: true, cwd: ROOT });
      let doc = parseMarkdown(original);
      let verdict = data.verdict;
      let notes = data.notes;

      if (verdict === 'corrected' && data.file) {
        await writeOfficials(data.new_officials);
        const corrected = parseMarkdown(data.file);
        corrected.data.source_key = doc.data.source_key;
        corrected.data.verification = doc.data.verification;
        await writeMarkdown(entry.file, corrected);
        const problems = await validateEntry(entry.file);
        if (problems.length) {
          // Keep the original wording but flag it, rather than publishing an invalid correction.
          verdict = 'fail';
          notes = `Verifier's correction failed validation (${problems.map((p) => p.message).join('; ')}). Problems found: ${data.problems.join(' ')}`;
        } else {
          doc = corrected;
        }
      }

      doc.data.verification = {
        writer: doc.data.verification.writer,
        verifier: { model, via, date: today() },
        verdict,
        notes,
      };
      if (verdict === 'fail' && data.problems.length) doc.data.verification.notes = `${notes} ${data.problems.join(' ')}`.trim();
      await writeMarkdown(entry.file, doc);
      console.log(`  ${verdict.padEnd(9)} ${rel(entry.file)} (${model})${data.problems.length ? `: ${data.problems.join(' | ').slice(0, 300)}` : ''}`);
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
    limit: { type: 'string', default: '10' },
    writer: { type: 'string', default: 'claude' },
    concurrency: { type: 'string', default: '2' },
    stale: { type: 'string' },
    reason: { type: 'string', default: 'Retracted by editor' },
  },
});
const [command, ...rest] = positionals;
const limit = Number(values.limit);
const concurrency = Number(values.concurrency);
const writer = values.writer === 'codex' ? 'codex' : 'claude';

switch (command) {
  case 'feeds':
    await feeds(values.since!);
    break;
  case 'draft':
    await draft({ limit, writer, concurrency });
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
    await draft({ limit, writer, concurrency });
    await verify({ limit: limit * 2, concurrency, files: [] });
    break;
  default:
    console.log('usage: npm run pipeline -- <feeds|draft|verify|retract|all> [options]');
    process.exit(1);
}
