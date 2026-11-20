// Who a portrait run should draw next: people who stand on an action's cover with initials, most covers first.
// A cover shows the first credit, joined by the second when it has the same role and isn't the signer
// (coverCredits in src/lib/format.ts). Entries a verifier failed aren't on the site, so they don't count.
// Skips bodies, people who already have a portrait, and anyone sources.json marks `tier: none` or `hold`.
// Usage: node pipeline/portraits/scope.ts [count=50] [--held]
//   prints one line per person in the run-list format: id | name | office | party | bioguide= | url= | leads N, on M covers |
//   --held lists the skipped people (no photo, or on hold) with the reason instead.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CONTENT, ROOT, idFromPath, listFiles, readAllEntries, readYaml } from '../lib/content.ts';

const args = process.argv.slice(2);
const held = args.includes('--held');
const count = Number(args.find((a) => /^\d+$/.test(a)) ?? 50);

const sources: Record<string, { tier?: string; hold?: string; notes?: string }> = JSON.parse(
  await readFile(join(ROOT, 'pipeline/portraits/sources.json'), 'utf8'),
);
const officials = new Map<string, any>();
for (const file of await listFiles(join(CONTENT, 'officials'), '.yaml')) officials.set(idFromPath(file), await readYaml(file));

const leads = new Map<string, number>();
const covers = new Map<string, number>();
const bump = (m: Map<string, number>, id: string) => m.set(id, (m.get(id) ?? 0) + 1);
for (const { data } of await readAllEntries()) {
  if (data.verification?.verdict === 'fail') continue;
  const [first, second] = data.credit ?? [];
  if (!first) continue;
  bump(leads, first.official);
  bump(covers, first.official);
  if (second && second.role === first.role && second.role !== 'signed') bump(covers, second.official);
}

const rows = [...covers]
  .filter(([id]) => {
    const o = officials.get(id);
    return o && (o.kind ?? 'person') === 'person' && !o.portrait;
  })
  .map(([id, n]) => ({ id, o: officials.get(id), covers: n, leads: leads.get(id) ?? 0, src: sources[id] }))
  .sort((a, b) => b.covers - a.covers || b.leads - a.leads || a.id.localeCompare(b.id));

const skipReason = (r: (typeof rows)[number]) =>
  r.src?.hold ? `hold: ${r.src.hold}` : r.src?.tier === 'none' ? 'no photo found' : '';

if (held) {
  for (const r of rows.filter(skipReason)) console.log(`${r.id} | on ${r.covers} covers | ${skipReason(r)}`);
} else {
  const ready = rows.filter((r) => !skipReason(r));
  for (const r of ready.slice(0, count)) {
    const { o } = r;
    console.log(
      `${r.id} | ${o.name} | ${o.office} | ${o.party ?? ''} | bioguide=${o.ids?.bioguide ?? ''} | url=${o.url ?? ''} | leads ${r.leads}, on ${r.covers} covers | ${r.src ? 'photo on file' : ''}`,
    );
  }
  console.error(`${ready.length} people on initials on a cover (${rows.length - ready.length} more held or without a photo; --held lists them)`);
}
