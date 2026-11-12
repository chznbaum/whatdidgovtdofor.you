// One-off backfill of a place's CivicPlus meeting recaps from the News Flash archive, which reaches back further than
// the RSS feed (CivicPlus drops expired items from RSS). Uses the recap feed declared in the place's yaml, and the same
// candidate keys as that feed, so the daily run and the backfill never double up.
//   node pipeline/backfill-civicplus.ts --place hanover [--since 2024-05-01]
import './lib/env.ts';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { saveCandidates } from './feeds/index.ts';
import { civicPlusArticle } from './feeds/rss.ts';
import type { Candidate } from './feeds/types.ts';
import { getText, mapLimit, plainText, truncate } from './feeds/util.ts';
import { CONTENT, readYaml } from './lib/content.ts';

const { values } = parseArgs({ options: { place: { type: 'string' }, since: { type: 'string', default: '2019-01-01' } } });
const place = values.place;
if (!place) throw new Error('usage: node pipeline/backfill-civicplus.ts --place <id> [--since YYYY-MM-DD]');

const p = await readYaml(join(CONTENT, 'places', `${place}.yaml`));
const feed = (p.feeds ?? []).find((f: any) => f.type === 'rss' && f.recaps && /RSSFeed\.aspx/i.test(f.url));
if (!feed) throw new Error(`${place} has no CivicPlus RSS feed with recaps`);
const url = new URL(feed.url);
const cid = url.searchParams.get('CID')?.match(/(\d+)$/)?.[1];
if (!cid) throw new Error(`can't find the News Flash category in ${feed.url}`);
const recaps = new RegExp(feed.recaps, 'i');
const id = feed.id ?? `${place}-news`;

// The archive links each article with its title: CivicAlerts.aspx?AID=<n> on older sites, /m/newsflash/Home/Detail/<n>
// on redesigned ones.
const listing = await getText(`${url.origin}/CivicAlerts.aspx?CID=${cid}`);
const articles = new Map<string, string>();
for (const m of listing.matchAll(/href="[^"]*(?:CivicAlerts\.aspx\?AID=|\/newsflash\/Home\/Detail\/)(\d+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)) {
  const title = plainText(m[2]);
  if (title && recaps.test(title) && !articles.has(m[1])) articles.set(m[1], title);
}
console.log(`${place}: ${articles.size} recaps listed in category ${cid}`);
if (!articles.size) {
  const dump = join(tmpdir(), `civicplus-${place}-${cid}.html`);
  await writeFile(dump, listing);
  console.log(`no recap links found; the listing is in ${dump}`);
}

const found: Candidate[] = [];
await mapLimit([...articles], 2, async ([aid, title]) => {
  const link = `${url.origin}/CivicAlerts.aspx?aid=${aid}`;
  const { text, posted } = civicPlusArticle(await getText(link));
  if (!text || !posted || posted < values.since!) return;
  found.push({ key: `${id}-${aid}`, feed: id, level: 'local', jurisdiction: place, kind: 'recap', title, date: posted, url: link, summary: truncate(text), extra: { text } });
});
const { added } = await saveCandidates(found);
console.log(`${found.length} recaps since ${values.since} (${added} new); the next triage splits them into actions`);
