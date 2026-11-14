// Florida governors' executive orders, from the Governor's paged table (www.flgov.com/eog/news/executive-orders,
// 25 a page, newest first): "#2026-228 amends Executive Order 26-227 – Emergency Management – 2026 Fall Flooding",
// dated, linking its PDF. Numbers restart each January ("EO 26-228"), so an order is keyed by year and number. Orders
// that reassign a case to another circuit's prosecutor are routine and dropped; emergencies, suspensions of local
// officials and the rest go to triage. robots.txt allows the pages for our reader; its signals against AI training
// don't apply (we don't train). Pages are read until one is older than `since`.
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, getTextIfExists, mdyDate, newest, plainText, sleep } from './util.ts';

const SITE = 'https://www.flgov.com';
// Case orders name a person: "assigns the 11th circuit to the 17th circuit re: ...", later "extends Executive Order 25-227
// re: Mordechai Brafman". Emergency-management extensions are kept.
const ROUTINE = /\bassigns? the (?:\w+ )*circuit\b|\breassign|^(?:amends|extends) Executive Order [\d-]+\s*re: (?!Emergency)/i;

// The feed id avoids "-governor", which marks announcement feeds (run.ts): these orders are actions themselves.
export const flExecutiveOrders: Feed = {
  id: 'fl-executive-orders',
  description: "Florida governors' executive orders (flgov.com)",
  async fetch({ since, limit, known }) {
    const out: Candidate[] = [];
    for (let page = 0; page < 20; page++) {
      if (page) await sleep(2_000);
      const html = await getTextIfExists(`${SITE}/eog/news/executive-orders?page=${page}`);
      let older = false;
      let rows = 0;
      for (const [, row] of html?.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g) ?? []) {
        const link = row.match(/<a[^>]*href="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/);
        const date = mdyDate(plainText(row.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)?.[1] ?? ''));
        if (!link || !date) continue;
        rows++;
        if (date < since) {
          older = true;
          continue;
        }
        const full = plainText(decodeEntities(link[2])).trim();
        const number = full.match(/#?(\d{4})-(\d+)/);
        const title = full.replace(/^#\d{4}-\d+\s*/, '');
        if (!number || ROUTINE.test(title)) continue;
        const key = `fl-eo-${number[1]}-${number[2]}`;
        if (known?.has(key)) continue;
        out.push({
          key,
          feed: 'fl-executive-orders',
          level: 'state',
          jurisdiction: 'fl',
          kind: 'executive-order',
          title,
          date,
          url: new URL(link[1], SITE).href,
          extra: { number: `Executive Order ${number[1].slice(2)}-${number[2]}` },
        });
      }
      if (older || !rows) break;
    }
    return newest(out, limit);
  },
};
