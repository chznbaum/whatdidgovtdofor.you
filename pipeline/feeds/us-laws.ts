// Enacted federal laws from the Congress.gov API v3 (https://api.congress.gov).
//   One list request per Congress covers every law; sponsor + CRS summary lookups cost two more
//   requests per law, so they only run with a real CONGRESS_API_KEY (DEMO_KEY allows ~10/hour).
import type { Candidate, Feed } from './types.ts';
import { getJson, mapLimit, newest, plainText, today, truncate } from './util.ts';

const API = 'https://api.congress.gov/v3';

const BILL_PATH: Record<string, string> = {
  HR: 'house-bill',
  S: 'senate-bill',
  HJRES: 'house-joint-resolution',
  SJRES: 'senate-joint-resolution',
};

// The 119th Congress runs Jan 3, 2025 - Jan 3, 2027.
const congressFor = (date: string) => Math.floor((Number(date.slice(0, 4)) - 1789) / 2) + 1;

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const usLaws: Feed = {
  id: 'us-laws',
  description: 'Federal public and private laws (Congress.gov API)',
  async fetch({ since, limit }) {
    const key = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
    const auth = `api_key=${key}&format=json`;
    const out: Candidate[] = [];

    const first = congressFor(since);
    const last = congressFor(today());
    for (let congress = first; congress <= last; congress++) {
      let url: string | null = `${API}/law/${congress}?limit=250&${auth}`;
      while (url) {
        const page: any = await getJson(url);
        for (const bill of page.bills ?? []) {
          const law = bill.laws?.[0];
          const date = bill.latestAction?.actionDate;
          if (!law || !date || date < since) continue;
          const type = String(bill.type).toUpperCase();
          const isPrivate = /private/i.test(law.type ?? '');
          out.push({
            key: `us-${isPrivate ? 'privlaw' : 'law'}-${law.number}`,
            feed: 'us-laws',
            level: 'federal',
            jurisdiction: 'us',
            kind: 'law',
            title: bill.title,
            date,
            url: `https://www.congress.gov/bill/${ordinal(bill.congress)}-congress/${BILL_PATH[type] ?? 'house-bill'}/${bill.number}`,
            extra: {
              law: `${isPrivate ? 'Private Law' : 'Pub. L.'} ${law.number}`,
              bill: `${type === 'HR' ? 'H.R.' : type === 'S' ? 'S.' : type} ${bill.number}`,
              congress: bill.congress,
              latestAction: bill.latestAction,
              api: String(bill.url).replace(/\?.*$/, ''),
            },
          });
        }
        // The API's `next` link drops the key; re-add it.
        url = page.pagination?.next ? `${page.pagination.next}&${auth}` : null;
      }
    }

    const laws = newest(out, limit);
    if (key === 'DEMO_KEY') return laws;

    await mapLimit(laws, 4, async (c) => {
      const api = c.extra!.api as string;
      const [detail, summaries] = await Promise.all([
        getJson(`${api}?${auth}`).catch(() => null),
        getJson(`${api}/summaries?${auth}`).catch(() => null),
      ]);
      const sponsor = detail?.bill?.sponsors?.[0];
      if (sponsor) {
        c.extra!.sponsor = {
          name: sponsor.fullName,
          party: sponsor.party,
          state: sponsor.state,
          bioguide: sponsor.bioguideId,
        };
      }
      if (detail?.bill?.cosponsors?.count != null) c.extra!.cosponsors = detail.bill.cosponsors.count;
      const latest = (summaries?.summaries ?? [])
        .sort((a: any, b: any) => String(a.actionDate).localeCompare(String(b.actionDate)))
        .at(-1);
      if (latest?.text) c.summary = truncate(plainText(latest.text));
    });
    return laws;
  },
};
