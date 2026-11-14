// Georgia governors' executive orders, from the Governor's page for each year (gov.georgia.gov/executive-action/
// executive-orders/<year>): a table of every order, numbered by the day it was issued and its place that day
// ("11.12.26.03"), so numbers never repeat across governors, with a link to its PDF and a one-line description. About
// 85% appoint or reappoint someone to a board or bench, and flag orders are lowered for a death; both are dropped here.
// The gas-tax suspensions sit inside "State of Emergency" orders, so emergencies are kept. robots.txt allows the pages.
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, getTextIfExists, newest, plainText, sleep } from './util.ts';

const SITE = 'https://gov.georgia.gov';
const ROUTINE = /^(?:Appointing|Reappointing|Lowering|Regarding the (?:re)?appointment)\b/i;

// The feed id avoids "-governor", which marks announcement feeds (run.ts): these orders are actions themselves.
export const gaExecutiveOrders: Feed = {
  id: 'ga-executive-orders',
  description: "Georgia governors' executive orders (gov.georgia.gov)",
  async fetch({ since, limit, known }) {
    const out: Candidate[] = [];
    for (let year = Number(since.slice(0, 4)); year <= new Date().getFullYear(); year++) {
      if (year > Number(since.slice(0, 4))) await sleep(1_000);
      const html = await getTextIfExists(`${SITE}/executive-action/executive-orders/${year}`);
      for (const [, row] of html?.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g) ?? []) {
        const link = row.match(/href="([^"]+)"[^>]*data-text="(\d{2})\.(\d{2})\.(\d{2})\.(\d+)"/);
        if (!link) continue;
        const [, href, mm, dd, yy, n] = link;
        const date = `20${yy}-${mm}-${dd}`;
        const key = `ga-eo-${date}-${n}`;
        const title = plainText(decodeEntities(row.match(/views-field-field-document-description[^>]*>([\s\S]*?)<\/td>/)?.[1] ?? '')).trim();
        if (!title || ROUTINE.test(title) || date < since || known?.has(key)) continue;
        out.push({
          key,
          feed: 'ga-executive-orders',
          level: 'state',
          jurisdiction: 'ga',
          kind: 'executive-order',
          title,
          date,
          url: new URL(href, SITE).href,
          extra: { number: `Executive Order ${mm}.${dd}.${yy}.${n}` },
        });
      }
    }
    return newest(out, limit);
  },
};
