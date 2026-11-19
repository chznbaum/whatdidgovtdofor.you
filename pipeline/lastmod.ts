// Keeps src/data/lastmod.json: for every file a page is built from (entries, officials, places, portraits, the static
// pages and what they read), a short hash of its content and the date that content last changed. The sitemap's
// lastmod and the structured data's dateModified read it (src/lib/lastmod.ts), so a deploy needs no git history.
//
//   node pipeline/lastmod.ts             stamp: a new file, or one whose hash changed, gets today's date (runs before
//                                        every `npm run build`, as `prebuild`, so the pipeline's commits carry it)
//   node pipeline/lastmod.ts --check     fail if any file's hash doesn't match (CI: run the stamp and commit)
//   node pipeline/lastmod.ts --backfill  date files the record doesn't have yet from their last commit (one-time)
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs';

const MANIFEST = 'src/data/lastmod.json';
const TRACKED = [
  'src/content/**/*.md',
  'src/content/**/*.yaml',
  'public/portraits/*.webp',
  'src/pages/**/*.astro',
  'docs/content-guide.md',
  'src/data/get-involved.json',
];

type Stamp = { hash: string; date: string };

const args = new Set(process.argv.slice(2));
// The date in New York, where the site is run from, so a late-evening change isn't dated tomorrow.
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16);

const old: { [path: string]: Stamp } = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const files = TRACKED.flatMap((pattern) => globSync(pattern)).sort();

// --backfill: each file's last commit date, from one pass over the history (newest first, so the first sighting wins).
function lastCommits(): Map<string, string> {
  const dates = new Map<string, string>();
  const log = execFileSync('git', ['log', '--format=>%cs', '--name-only', 'HEAD', '--', ...TRACKED], {
    encoding: 'utf8',
    maxBuffer: 1 << 30,
  });
  let date = '';
  for (const line of log.split('\n')) {
    if (line.startsWith('>')) date = line.slice(1);
    else if (line && !dates.has(line)) dates.set(line, date);
  }
  return dates;
}
const committed = args.has('--backfill') ? lastCommits() : undefined;

const next: { [path: string]: Stamp } = {};
const changed: string[] = [];
for (const path of files) {
  const h = hash(path);
  const before = old[path];
  if (before && before.hash === h) next[path] = before;
  else {
    next[path] = { hash: h, date: (!before && committed?.get(path)) || today };
    changed.push(path);
  }
}
const removed = Object.keys(old).filter((path) => !(path in next));

if (args.has('--check')) {
  if (changed.length || removed.length) {
    console.error(`${MANIFEST} is out of date for ${changed.length + removed.length} file(s), e.g. ${[...changed, ...removed].slice(0, 5).join(', ')}.`);
    console.error('Run `node pipeline/lastmod.ts` (or `npm run build`, which runs it) and commit the result.');
    process.exit(1);
  }
  console.log(`${MANIFEST}: up to date (${files.length} files)`);
} else {
  // One file per line, sorted, so concurrent branches rarely touch the same line.
  const lines = Object.keys(next).map((path) => `  ${JSON.stringify(path)}: ${JSON.stringify(next[path])}`);
  writeFileSync(MANIFEST, `{\n${lines.join(',\n')}\n}\n`);
  console.log(`${MANIFEST}: ${changed.length} dated, ${removed.length} removed, ${files.length} files`);
}
