// A Granicus IQM2 meeting portal (<site>.iqm2.com): the calendar lists every body's meetings, each a "MeetingRow" whose
// title says when it met and which board ("Board: Atlanta City Council"), with links to its files; a minutes file
// (FileOpen.aspx?Type=15) is a recap, split into actions before triage. Atlanta's minutes give each item's sponsor,
// result, mover, seconder and named votes; Chatham County's an "ACTION OF THE BOARD" block per decision. IQM2's
// robots.txt asks 60 seconds between requests, so a run makes one calendar request plus one per new minutes file.
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, get, getText, longDate, newest, pdfText, plainText, sleep, truncate } from './util.ts';

export type Iqm2Options = { id: string; description: string; origin: string; board: RegExp; place: string };

const DELAY = 60_000;
const mdy = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}/${d.slice(0, 4)}`;

export function iqm2Feed(o: Iqm2Options): Feed {
  return {
    id: o.id,
    description: o.description,
    lookback: 120,
    async fetch({ since, limit, known }) {
      const today = new Date().toISOString().slice(0, 10);
      const html = await getText(`${o.origin}/Citizens/Calendar.aspx?From=${mdy(since)}&To=${mdy(today)}`);
      const out: Candidate[] = [];
      for (const row of html.split(/class="Row MeetingRow/).slice(1)) {
        const title = plainText(decodeEntities(row.match(/title="([^"]*)"/)?.[1] ?? ''));
        const minutes = row.match(/FileOpen\.aspx\?Type=15&(?:amp;)?ID=(\d+)/)?.[1];
        const date = longDate(title);
        if (!minutes || !date || date < since || !o.board.test(title)) continue;
        const key = `${o.id}-${minutes}`;
        if (known?.has(key)) continue;
        const meeting = title.match(/Type:\s*([^/]+?)\s*(?:\/|$)/)?.[1];
        out.push({
          key,
          feed: o.id,
          level: 'local',
          jurisdiction: o.place,
          kind: 'recap',
          title: `${title.match(/Board:\s*([^/]+?)\s*(?:\/|$)/)?.[1] ?? 'Meeting'}${meeting ? ` ${meeting.toLowerCase()}` : ''} minutes, ${date}`,
          date,
          url: `${o.origin}/Citizens/FileOpen.aspx?Type=15&ID=${minutes}&Inline=True`,
        });
      }
      const recent = newest(out, limit);
      for (const c of recent) {
        await sleep(DELAY);
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
