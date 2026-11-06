// Validates content against the shared schemas plus editorial rules Zod can't express.
// Usage: npm run validate [-- path/to/entry.md ...]
import { join } from 'node:path';
import { z } from 'astro/zod';
import { entrySchema, officialSchema, placeSchema, type Collection } from '../src/lib/schema.ts';
import { CONTENT, idFromPath, listFiles, loadIds, readMarkdown, readYaml, rel } from './lib/content.ts';

const ids = { officials: await loadIds('officials'), places: await loadIds('places') };

// A reference is a string id that must name an existing file in that collection.
const ref = (collection: Collection) =>
  z.string().refine((id) => ids[collection].has(id), { error: (i) => `unknown ${collection} id "${i.input}"` });

const schemas = { entries: entrySchema(ref), officials: officialSchema(ref), places: placeSchema(ref) };

type Problem = { file: string; message: string };

function zodProblems(file: string, error: z.ZodError): Problem[] {
  return error.issues.map((i) => ({ file, message: `${i.path.join('.') || '(root)'}: ${i.message}` }));
}

// Editorial rules from docs/content-guide.md that the schema alone doesn't enforce.
function editorialProblems(file: string, e: z.infer<(typeof schemas)['entries']>, body: string): Problem[] {
  const out: string[] = [];
  if (/[.!]$/.test(e.title)) out.push('title: no trailing period or exclamation point');
  if (e.status.state !== 'in-effect' && !e.status.note) out.push('status.note: required unless in-effect');
  if (e.status.state !== 'in-effect' && !e.status.source) out.push('status.source: required unless in-effect');
  for (const [i, v] of e.votes.entries()) {
    if (!v.by_party) continue;
    const tallies = Object.values(v.by_party);
    const tb = v.tie_breaker?.vote;
    const yes = tallies.reduce((n, t) => n + (t?.yes ?? 0), 0) + (tb === 'yes' ? 1 : 0);
    const no = tallies.reduce((n, t) => n + (t?.no ?? 0), 0) + (tb === 'no' ? 1 : 0);
    if (yes !== v.yes || no !== v.no) out.push(`votes.${i}.by_party: sums ${yes}-${no} don't match ${v.yes}-${v.no}`);
  }
  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < 60) out.push(`body: ${words} words; write 120–250`);
  return out.map((message) => ({ file, message }));
}

export async function validateEntry(file: string): Promise<Problem[]> {
  try {
    const { data, body } = await readMarkdown(file);
    const parsed = schemas.entries.safeParse(data);
    if (!parsed.success) return zodProblems(rel(file), parsed.error);
    return editorialProblems(rel(file), parsed.data, body);
  } catch (err) {
    return [{ file: rel(file), message: String(err) }];
  }
}

async function validateYaml(collection: 'officials' | 'places'): Promise<Problem[]> {
  const problems: Problem[] = [];
  for (const file of await listFiles(join(CONTENT, collection), '.yaml')) {
    const parsed = schemas[collection].safeParse(await readYaml(file));
    if (!parsed.success) problems.push(...zodProblems(rel(file), parsed.error));
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(idFromPath(file))) problems.push({ file: rel(file), message: 'id must be a lowercase slug' });
  }
  return problems;
}

if (import.meta.main) {
  const targets = process.argv.slice(2);
  const entryFiles = targets.length ? targets : await listFiles(join(CONTENT, 'entries'), '.md');
  const problems = [
    ...(targets.length ? [] : [...(await validateYaml('places')), ...(await validateYaml('officials'))]),
    ...(await Promise.all(entryFiles.map(validateEntry))).flat(),
  ];
  for (const p of problems) console.log(`${p.file}: ${p.message}`);
  console.log(problems.length ? `\n${problems.length} problem(s)` : `ok: ${entryFiles.length} entries valid`);
  process.exit(problems.length ? 1 : 0);
}
