// Generic adapter for a web page that lists a body's meetings with, once approved, a link to each one's minutes PDF.
// Each meeting's minutes become one recap candidate, split into actions before triage. Minutes are approved at the next
// meeting, weeks later, so the feed looks back four months (or more); it downloads only minutes it doesn't have yet.
//   - `table` layout: a row per meeting (the Metropolitan Council's and Union County's meeting tables).
//   - `blocks` layout: a line or box per meeting, split at <br>, paragraphs, divs and list items (Camden County's
//     "Commissioner Meeting (7/16/26) (AGENDA PACKET) (MINUTES)" lines; Camden's buttons, one per meeting).
// A meeting's date comes from its row ("11/12/2026", "7/16/26", "June 25, 2026"). Where the row gives only a month
// ("August 2026 Regular Meeting"), the date is read from the minutes themselves.
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, get, getTextIfExists, longDate, newest, pdfText, plainText, sleep, truncate } from './util.ts';

export type MinutesListOptions = {
  id: string;
  description: string;
  url: string; // the meeting list; older meetings are on ?page=2, ?page=3, ... "{year}" stands for a page per year
  pages: number; // how many list pages to read
  title: string; // the body, for candidate titles: "Metropolitan Council"
  place: string;
  layout?: 'table' | 'blocks';
  link?: RegExp; // the minutes link's text (default: "Minutes")
  rows?: RegExp; // only meetings whose row says this, e.g. "Regular Meeting" (not the agenda-setting session)
  delay?: number; // seconds between requests, for a robots.txt Crawl-delay (default 1)
  lookback?: number; // days (default 120): some clerks post minutes months late
};

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// The first full date in a piece of text: "7/16/26", "11/12/2026", "June 25, 2026".
function fullDate(s: string): string | null {
  const m = s.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/);
  const numeric = m ? `${m[3].length === 2 ? `20${m[3]}` : m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null;
  const long = longDate(s);
  if (!numeric || !long) return numeric ?? long;
  return s.indexOf(m![0]) < s.search(/[A-Z][a-z]{2,}\.?\s+\d{1,2},?\s+\d{4}/) ? numeric : long;
}

// "August 2026" -> the 1st, until the minutes give the day.
function monthDate(s: string): string | null {
  const m = s.match(/\b([A-Z][a-z]+)\s+(\d{4})\b/);
  const month = m ? MONTHS.indexOf(m[1].toLowerCase()) + 1 : 0;
  return month ? `${m![2]}-${String(month).padStart(2, '0')}-01` : null;
}

export function minutesListFeed(o: MinutesListOptions): Feed {
  const link = o.link ?? /Minutes/i;
  const delay = (o.delay ?? 1) * 1_000;
  const split = o.layout === 'blocks' ? /<br[^>]*>|<\/p>|<\/div>|<\/li>|<\/tr>/i : /<\/tr>/i;
  return {
    id: o.id,
    description: o.description,
    lookback: o.lookback ?? 120,
    async fetch({ since, limit, known }) {
      const out: (Candidate & { dateFromText?: boolean })[] = [];
      const years = o.url.includes('{year}') ? Array.from({ length: new Date().getFullYear() - Number(since.slice(0, 4)) + 1 }, (_, i) => Number(since.slice(0, 4)) + i) : [0];
      const lists = years.flatMap((year) => Array.from({ length: o.pages }, (_, i) => o.url.replace('{year}', String(year)) + (i ? `?page=${i + 1}` : '')));
      for (const [i, list] of lists.entries()) {
        if (i) await sleep(delay);
        const html = await getTextIfExists(list);
        if (html === null) continue; // next year's page isn't up yet
        for (const row of html.split(split)) {
          const minutes = [...row.matchAll(/<a[^>]*href="([^"]+)"[^>]*>((?:(?!<\/a>)[\s\S])*)<\/a>/g)].find(([, , text]) =>
            link.test(plainText(decodeEntities(text))),
          )?.[1];
          const text = plainText(decodeEntities(row)).trim();
          if (!minutes || (o.rows && !o.rows.test(text))) continue;
          const exact = fullDate(text);
          const date = exact ?? monthDate(text);
          // A month-only date stands for the whole month.
          if (!date || (exact ? date < since : date.slice(0, 7) < since.slice(0, 7))) continue;
          const url = new URL(decodeEntities(minutes), list).href;
          const file =
            url.match(/[0-9a-f]{8}-[0-9a-f-]{27}/i)?.[0] ??
            decodeURIComponent(url.split('/').pop()!.replace(/\.pdf$/i, ''))
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-');
          const key = `${o.id}-${file || date}`;
          if (known?.has(key) || out.some((c) => c.key === key)) continue;
          out.push({ key, feed: o.id, level: 'local', jurisdiction: o.place, kind: 'recap', title: `${o.title} minutes, ${date}`, date, url, dateFromText: !exact });
        }
      }
      const recent = newest(out, limit);
      for (const c of recent) {
        await sleep(delay);
        let text = '';
        try {
          text = (await pdfText(new Uint8Array(await (await get(c.url)).arrayBuffer()))).trim();
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('pdftotext not found (brew install poppler)');
          console.warn(`[${o.id}] skipped ${c.url}: ${(e as Error).message}`);
        }
        if (!text) continue;
        if (c.dateFromText) {
          const date = fullDate(text.slice(0, 3000));
          if (date) Object.assign(c, { date, title: `${o.title} minutes, ${date}` });
        }
        delete c.dateFromText;
        Object.assign(c, { summary: truncate(text.replace(/\s+/g, ' ')), extra: { text } });
      }
      return recent.filter((c) => c.extra?.text);
    },
  };
}
