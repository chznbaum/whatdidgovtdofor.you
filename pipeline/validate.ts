// Validates content against the shared schemas plus editorial rules Zod can't express.
// Usage: npm run validate [-- path/to/entry.md ...]
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { entrySchema, officialSchema, placeSchema, type Collection } from '../src/lib/schema.ts';
import { CONTENT, idFromPath, listFiles, loadIds, readMarkdown, readYaml, rel } from './lib/content.ts';

// Ids are reloaded on every call: the pipeline creates officials mid-run, and a stale list rejects them.
async function loadSchemas() {
  const ids = { officials: await loadIds('officials'), places: await loadIds('places') };
  // A reference is a string id that must name an existing file in that collection.
  const ref = (collection: Collection) =>
    z.string().refine((id) => ids[collection].has(id), { error: (i) => `unknown ${collection} id "${i.input}"` });
  const refs = { officials: ref('officials'), places: ref('places') };
  return { entries: entrySchema(refs), officials: officialSchema(refs), places: placeSchema(refs) };
}
type Schemas = Awaited<ReturnType<typeof loadSchemas>>;

type Problem = { file: string; message: string };

function zodProblems(file: string, error: z.ZodError): Problem[] {
  return error.issues.map((i) => ({ file, message: `${i.path.join('.') || '(root)'}: ${i.message}` }));
}

// Editorial rules from docs/content-guide.md that the schema alone doesn't enforce.
function editorialProblems(file: string, e: z.infer<Schemas['entries']>, body: string): Problem[] {
  const out: string[] = [];
  if (/[.!]$/.test(e.title)) out.push('title: no trailing period or exclamation point');
  const settled = e.status.state === 'in-effect' || e.status.state === 'delivered';
  if (!settled && !e.status.note) out.push('status.note: required unless in-effect or delivered');
  if (!settled && !e.status.source) out.push('status.source: required unless in-effect or delivered');
  for (const [i, v] of e.votes.entries()) {
    if (!v.by_party) continue;
    const tallies = Object.values(v.by_party);
    const tb = v.tie_breaker?.vote;
    const yes = tallies.reduce((n, t) => n + (t?.yes ?? 0), 0) + (tb === 'yes' ? 1 : 0);
    const no = tallies.reduce((n, t) => n + (t?.no ?? 0), 0) + (tb === 'no' ? 1 : 0);
    if (yes !== v.yes || no !== v.no) out.push(`votes.${i}.by_party: sums ${yes}-${no} don't match ${v.yes}-${v.no}`);
  }
  // Credit order is the byline: the people who did the work first, the signer last (see "credit" in the guide).
  const roles = e.credit.map((c) => c.role);
  if (roles.every((r) => r === 'signed')) out.push('credit: only the signer is credited; find who carried it');
  else if (roles.includes('signed') && roles.slice(roles.indexOf('signed')).some((r) => r !== 'signed')) out.push('credit: list `signed` last');
  const ids = e.credit.map((c) => JSON.stringify(c.official));
  if (new Set(ids).size !== ids.length) out.push('credit: an official appears twice; give them their one real role');
  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < 60) out.push(`body: ${words} words; write 120–250`);
  return out.map((message) => ({ file, message }));
}

export async function validateEntry(file: string, schemas?: Schemas): Promise<Problem[]> {
  try {
    const { data, body } = await readMarkdown(file);
    const parsed = (schemas ?? (await loadSchemas())).entries.safeParse(data);
    if (!parsed.success) return zodProblems(rel(file), parsed.error);
    return editorialProblems(rel(file), parsed.data, body);
  } catch (err) {
    return [{ file: rel(file), message: String(err) }];
  }
}

// Portrait rules from docs/design.md: the drawing ships with the site (its source photo never does; the site links
// to the page it came from), and "official portrait" is only claimed for an official government portrait (the
// Congress bioguide).
function portraitProblems(file: string, o: z.infer<Schemas['officials']>): Problem[] {
  const p = o.portrait;
  if (!p) return [];
  const out: string[] = [];
  const pub = join(import.meta.dirname, '..', 'public');
  for (const path of [p.image, p.image.replace(/\.webp$/, '-400.webp')])
    if (!existsSync(join(pub, path))) out.push(`portrait: ${path} is missing from public/`);
  if (p.kind === 'official' && !o.ids.bioguide) out.push('portrait.kind: "official" is only for a Congress bioguide portrait; use "photo"');
  if (o.kind === 'body') out.push('portrait: a body has no face; it is shown by name');
  return out.map((message) => ({ file, message }));
}

async function validateYaml(collection: 'officials' | 'places', schemas: Schemas): Promise<Problem[]> {
  const problems: Problem[] = [];
  for (const file of await listFiles(join(CONTENT, collection), '.yaml')) {
    const parsed = schemas[collection].safeParse(await readYaml(file));
    if (!parsed.success) problems.push(...zodProblems(rel(file), parsed.error));
    else if (collection === 'officials') problems.push(...portraitProblems(rel(file), parsed.data as z.infer<Schemas['officials']>));
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(idFromPath(file))) problems.push({ file: rel(file), message: 'id must be a lowercase slug' });
  }
  return problems;
}

if (import.meta.main) {
  const targets = process.argv.slice(2);
  const entryFiles = targets.length ? targets : await listFiles(join(CONTENT, 'entries'), '.md');
  const schemas = await loadSchemas();
  const problems = [
    ...(targets.length ? [] : [...(await validateYaml('places', schemas)), ...(await validateYaml('officials', schemas))]),
    ...(await Promise.all(entryFiles.map((f) => validateEntry(f, schemas)))).flat(),
  ];
  for (const p of problems) console.log(`${p.file}: ${p.message}`);
  console.log(problems.length ? `\n${problems.length} problem(s)` : `ok: ${entryFiles.length} entries valid`);
  process.exit(problems.length ? 1 : 0);
}
