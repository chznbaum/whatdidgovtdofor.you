// Generic adapter for a CivicPlus Agenda Center (<origin>/AgendaCenter), where many Virginia localities post a
// governing body's agendas and, once approved, its minutes, as PDFs. Each meeting becomes one recap candidate, split
// into actions before triage: its minutes, or for a clerk who marks up the agenda with every item's outcome after the
// meeting (Suffolk's "action agenda", which replaces the agenda at the same address), that agenda once it shows
// outcomes. Minutes come weeks or months after a meeting, so the feed looks back six months; it downloads only meetings
// it doesn't have yet. CivicPlus sites ask crawlers to wait 10 seconds between requests (robots.txt), so this feed
// makes its requests one at a time with that pause.
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, get, getText, localDate, newest, pdfText, sleep, truncate } from './util.ts';

export type AgendaCenterOptions = {
  id: string;
  description: string;
  origin: string; // https://www.norfolk.gov
  category: number; // the body's Agenda Center category, the number ending its listing's address
  file: 'minutes' | 'agenda'; // read the minutes, or the agenda once the clerk has added outcomes
  place: string;
};

const CRAWL_DELAY = 10_000;
// An action agenda shows outcomes with tallies: "Approved 8-0", "was approved by a vote of 4-2".
const OUTCOME = /\b(approved|adopted|denied|carried|failed)\b[^\n]{0,40}?\b\d{1,2}\s*-\s*\d{1,2}\b/i;

const mdy = (d: string) => `${d.slice(5, 7)}/${d.slice(8, 10)}/${d.slice(0, 4)}`;

export function agendaCenterFeed(o: AgendaCenterOptions): Feed {
  return {
    id: o.id,
    description: o.description,
    lookback: 180,
    async fetch({ since, limit, known }) {
      const search = `${o.origin}/AgendaCenter/Search/?${new URLSearchParams({
        term: '',
        CIDs: `${o.category},`,
        startDate: mdy(since),
        endDate: mdy(localDate()),
        dateRange: '',
        dateSelector: '',
      })}`;
      const html = await getText(search);
      const out: Candidate[] = [];
      for (const [, row] of html.matchAll(/<tr[^>]*catAgendaRow[^>]*>([\s\S]*?)<\/tr>/g)) {
        const id = row.match(/name="_(\d{2})(\d{2})(\d{4})-(\d+)"/);
        if (!id) continue;
        const [, mm, dd, yyyy, n] = id;
        const date = `${yyyy}-${mm}-${dd}`;
        const key = `${o.id}-${n}`;
        const minutes = row.match(/class="minutes">\s*<a[^>]*href="([^"]+)"/)?.[1];
        if (date < since || known?.has(key) || (o.file === 'minutes' && !minutes)) continue;
        // The agenda link's text names the meeting: "City Council Agenda of October 27, 2026".
        const name = decodeEntities(row.match(/ViewFile\/Agenda\/_[\d-]+(?:\?html=true)?"[^>]*>\s*([^<]+?)\s*<\/a>/)?.[1] ?? '')
          .replace(/\s*\(PDF\)\s*$/i, '')
          .trim();
        const path = o.file === 'minutes' ? minutes! : `/AgendaCenter/ViewFile/Agenda/_${mm}${dd}${yyyy}-${n}`;
        out.push({
          key,
          feed: o.id,
          level: 'local',
          jurisdiction: o.place,
          kind: 'recap',
          title: o.file === 'minutes' ? `${name.replace(/\bAgenda\s+(of\s+)?/i, '') || `Meeting of ${date}`} minutes` : `${name || 'Agenda'} with outcomes`,
          date,
          url: new URL(path, o.origin).href,
        });
      }
      const recent = newest(out, limit);
      for (const c of recent) {
        await sleep(CRAWL_DELAY);
        let text = '';
        try {
          text = (await pdfText(new Uint8Array(await (await get(c.url)).arrayBuffer()))).trim();
        } catch (e) {
          // Without pdftotext nothing here can be read, so the feed fails; one bad file only skips its meeting.
          if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('pdftotext not found (brew install poppler)');
          console.warn(`[${o.id}] skipped ${c.url}: ${(e as Error).message}`);
        }
        // A scan without a text layer gives nothing to read; an agenda without outcomes isn't marked up yet.
        if (!text || (o.file === 'agenda' && !OUTCOME.test(text))) continue;
        Object.assign(c, { summary: truncate(text.replace(/\s+/g, ' ')), extra: { text } });
      }
      return recent.filter((c) => c.extra?.text);
    },
  };
}
