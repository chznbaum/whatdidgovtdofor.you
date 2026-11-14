// Minnesota governors' executive orders, from the Legislative Reference Library's table
// (https://www.lrl.mn.gov/execorders/eoresults.aspx?gov=<id>): number, title, PDF, notes, and the dates signed and
// filed. The library lists governors by id; the two newest cover the current governor and, across an inauguration,
// the last one. The governor's own news releases sit behind a bot check, so they aren't read (the owner may ask the
// office); bill signings come from the Revisor (mn-laws).
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, getText, mdyDate, newest, plainText, sleep } from './util.ts';

const SITE = 'https://www.lrl.mn.gov/execorders';
const cell = (html: string | undefined) => plainText(decodeEntities(html ?? '')).trim();

// The feed id avoids "-governor", which marks announcement feeds (run.ts): these orders are actions themselves.
export const mnExecutiveOrders: Feed = {
  id: 'mn-executive-orders',
  description: "Minnesota governors' executive orders (Legislative Reference Library)",
  async fetch({ since, limit, known }) {
    const index = await getText(`${SITE}/`);
    const ids = [...new Set([...index.matchAll(/eoresults\.aspx\?gov=(\d+)"/g)].map((m) => Number(m[1])))].sort((a, b) => b - a).slice(0, 2);
    const out: Candidate[] = [];
    for (const id of ids) {
      await sleep(1_000);
      const html = await getText(`${SITE}/eoresults.aspx?gov=${id}`);
      for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
        const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
        if (cells.length < 9) continue;
        // Number | File number | PDF | Title | Notes | Date signed | Date filed | Related EO | Governor
        const number = cell(cells[0]);
        const date = mdyDate(cell(cells[5])) ?? mdyDate(cell(cells[6]));
        const key = `mn-eo-${number}`;
        if (!number || !date || date < since || known?.has(key)) continue;
        const notes = cell(cells[4]);
        out.push({
          key,
          feed: 'mn-executive-orders',
          level: 'state',
          jurisdiction: 'mn',
          kind: 'executive-order',
          title: cell(cells[3]),
          date,
          url: cells[2].match(/href="([^"]+)"/)?.[1] ?? `${SITE}/eoresults.aspx?gov=${id}`,
          summary: notes || undefined,
          extra: { number: `Executive Order ${number}`, governor: cell(cells[8]) || undefined, filed: mdyDate(cell(cells[6])) ?? undefined },
        });
      }
    }
    return newest(out, limit);
  },
};
