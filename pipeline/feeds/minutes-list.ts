// Generic adapter for a web page that lists a body's meetings, a row each, with the meeting date and, once approved, a
// "Minutes" link to a PDF (the Metropolitan Council's meeting list). Each meeting's minutes become one recap candidate,
// split into actions before triage. Minutes are approved at the next meeting, weeks later, so the feed looks back four
// months; it downloads only minutes it doesn't have yet, one request a second.
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, get, getText, mdyDate, newest, pdfText, plainText, sleep, truncate } from './util.ts';

export type MinutesListOptions = {
  id: string;
  description: string;
  url: string; // the meeting list; older meetings are on ?page=2, ?page=3, ...
  pages: number; // how many list pages to read
  title: string; // the body, for candidate titles: "Metropolitan Council"
  place: string;
};

export function minutesListFeed(o: MinutesListOptions): Feed {
  return {
    id: o.id,
    description: o.description,
    lookback: 120,
    async fetch({ since, limit, known }) {
      const out: Candidate[] = [];
      for (let page = 1; page <= o.pages; page++) {
        if (page > 1) await sleep(1_000);
        const html = await getText(page === 1 ? o.url : `${o.url}?page=${page}`);
        for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
          const date = mdyDate(plainText(decodeEntities(row.match(/<td[^>]*>([\s\S]*?)<\/td>/)?.[1] ?? '')).trim());
          const minutes = row.match(/<a[^>]*href="([^"]+)"[^>]*>(?:(?!<\/a>)[\s\S])*Minutes\s*<\/a>/)?.[1];
          if (!date || !minutes || date < since) continue;
          const url = new URL(decodeEntities(minutes), o.url).href;
          const key = `${o.id}-${url.match(/[0-9a-f]{8}-[0-9a-f-]{27}/i)?.[0] ?? date}`;
          if (known?.has(key)) continue;
          const title = `${o.title} minutes, ${date}`;
          out.push({ key, feed: o.id, level: 'local', jurisdiction: o.place, kind: 'recap', title, date, url });
        }
      }
      const recent = newest(out, limit);
      for (const c of recent) {
        await sleep(1_000);
        let text = '';
        try {
          text = (await pdfText(new Uint8Array(await (await get(c.url)).arrayBuffer()))).trim();
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('pdftotext not found (brew install poppler)');
          console.warn(`[${o.id}] skipped ${c.url}: ${(e as Error).message}`);
        }
        if (text) Object.assign(c, { summary: truncate(text.replace(/\s+/g, ' ')), extra: { text } });
      }
      return recent.filter((c) => c.extra?.text);
    },
  };
}
