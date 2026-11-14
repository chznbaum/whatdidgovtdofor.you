// Runs every feed and collects candidates (raw government actions) for triage and drafting.
// Run: node pipeline/feeds/index.ts --since 2026-09-01 [--limit 50] [--feed us-laws,va-laws]
//   Writes pipeline/state/candidates.json, merged by key with what's already there.
// Env (shell or the repo-root .env): CONGRESS_API_KEY (optional; DEMO_KEY otherwise), NYSENATE_API_KEY, NYC_LEGISTAR_TOKEN.
import '../lib/env.ts';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ceremonialReason } from './ceremonial.ts';
import { mnExecutiveOrders } from './mn-executive-orders.ts';
import { mnLaws } from './mn-laws.ts';
import { njExecutiveOrders, njGovernor } from './nj-governor.ts';
import { njLaws } from './nj-laws.ts';
import { nyGovernor } from './ny-governor.ts';
import { nyLaws } from './ny-laws.ts';
import { nycLaws } from './nyc-laws.ts';
import { nycMayor } from './nyc-mayor.ts';
import { nycRules } from './nyc-rules.ts';
import { placeFeeds } from './place-feeds.ts';
import type { Candidate, Feed, FeedOptions } from './types.ts';
import { usExecutiveOrders } from './us-executive-orders.ts';
import { usGrants } from './us-grants.ts';
import { usLaws } from './us-laws.ts';
import { usRules } from './us-rules.ts';
import { localDate, today } from './util.ts';
import { vaGovernor } from './va-governor.ts';
import { vaLaws } from './va-laws.ts';

export const feeds: Feed[] = [
  usLaws,
  usExecutiveOrders,
  usRules,
  usGrants,
  nyLaws,
  nyGovernor,
  nycLaws,
  nycMayor,
  nycRules,
  vaLaws,
  vaGovernor,
  mnLaws,
  mnExecutiveOrders,
  njLaws,
  njExecutiveOrders,
  njGovernor,
  ...(await placeFeeds()), // city and county sources, declared in src/content/places/*.yaml
];

export type FeedResult = {
  feed: Feed;
  status: 'ok' | 'skipped' | 'failed';
  candidates: Candidate[]; // kept
  dropped: Candidate[]; // ceremonial
  error?: string;
};

// Run feeds in parallel; one failing (or missing its key) never sinks the rest.
export async function runFeeds(opts: FeedOptions, only: Feed[] = feeds): Promise<FeedResult[]> {
  const known = opts.known ?? new Set((await readCandidates()).map((c) => c.key));
  return Promise.all(
    only.map(async (feed): Promise<FeedResult> => {
      if (feed.needsKey && !process.env[feed.needsKey]) {
        console.warn(`[${feed.id}] skipped: set ${feed.needsKey} to enable`);
        return { feed, status: 'skipped', candidates: [], dropped: [] };
      }
      const back = feed.lookback ? localDate(new Date(Date.now() - feed.lookback * 864e5)) : opts.since;
      const since = back < opts.since ? back : opts.since;
      try {
        const all = (await feed.fetch({ ...opts, since, known })).filter((c) => c.date >= since);
        const dropped = all.filter((c) => ceremonialReason(c));
        return { feed, status: 'ok', candidates: all.filter((c) => !ceremonialReason(c)), dropped };
      } catch (e) {
        const error = (e as Error).message;
        console.warn(`[${feed.id}] failed: ${error}`);
        return { feed, status: 'failed', candidates: [], dropped: [], error };
      }
    }),
  );
}

export function dedupe(candidates: Candidate[]): Candidate[] {
  const byKey = new Map<string, Candidate>();
  for (const c of candidates) if (!byKey.has(c.key)) byKey.set(c.key, c);
  return [...byKey.values()];
}

export async function fetchAll(opts: FeedOptions): Promise<Candidate[]> {
  return dedupe((await runFeeds(opts)).flatMap((r) => r.candidates));
}

const STATE = new URL('../state/candidates.json', import.meta.url);

// Drop undefined fields so a sparser fetch (e.g. DEMO_KEY without summaries) doesn't erase richer data.
const defined = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

const readCandidates = (): Promise<Candidate[]> =>
  readFile(STATE, 'utf8')
    .then((text) => JSON.parse(text))
    .catch(() => []);

// Merge fresh candidates into candidates.json by key; keeps fields added downstream and `seen`.
export async function saveCandidates(fresh: Candidate[]): Promise<{ total: number; added: number }> {
  const existing = await readCandidates();
  const merged = new Map(existing.map((c) => [c.key, c]));
  const seen = today();
  let added = 0;
  for (const c of fresh) {
    const old = merged.get(c.key);
    if (!old) added++;
    merged.set(c.key, {
      ...old,
      ...defined(c),
      extra: old?.extra || c.extra ? { ...old?.extra, ...defined(c.extra ?? {}) } : undefined,
      seen: old?.seen ?? seen,
    } as Candidate);
  }
  const list = [...merged.values()].sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key));
  await mkdir(new URL('.', STATE), { recursive: true });
  await writeFile(STATE, JSON.stringify(list, null, 1) + '\n');
  return { total: list.length, added };
}

async function main() {
  const { values } = parseArgs({
    options: { since: { type: 'string' }, limit: { type: 'string' }, feed: { type: 'string' } },
  });
  const since = values.since ?? localDate(new Date(Date.now() - 30 * 864e5));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) throw new Error(`--since must be YYYY-MM-DD, got ${since}`);
  const limit = values.limit ? Number(values.limit) : undefined;
  const ids = values.feed?.split(',');
  const only = ids ? feeds.filter((f) => ids.includes(f.id)) : feeds;

  console.log(`Fetching ${only.length} feeds since ${since}${limit ? ` (limit ${limit} each)` : ''}\n`);
  const results = await runFeeds({ since, limit }, only);

  for (const r of results) {
    const counts =
      r.status === 'ok'
        ? `${r.candidates.length} candidates${r.dropped.length ? `, ${r.dropped.length} ceremonial dropped` : ''}`
        : r.status === 'skipped'
          ? `skipped (needs ${r.feed.needsKey})`
          : `FAILED: ${r.error}`;
    console.log(`${r.feed.id.padEnd(22)} ${counts}`);
    for (const c of r.candidates.slice(0, 3)) console.log(`    ${c.date}  ${c.title.slice(0, 100)}`);
  }

  const candidates = dedupe(results.flatMap((r) => r.candidates));
  const { total, added } = await saveCandidates(candidates);
  console.log(`\n${candidates.length} candidates (${added} new); ${total} in ${fileURLToPath(STATE)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
