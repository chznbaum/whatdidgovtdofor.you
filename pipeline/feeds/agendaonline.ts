// A Hyland OnBase Agenda Online portal (Tampa's: tampagov.hylandcloud.com/251agendaonline). Its meeting search page,
// fetched with a date range in the query as the search form itself does, carries the meetings as JSON ("Meetings":
// [{ID, Name, MeetingTypeName, IsMinutesAvailable, Time}]); a meeting's minutes are an HTML page (the meeting page's
// minutes tab: Documents/ViewAgenda?meetingId=<ID>&type=minutes&doctype=2) with every item's file number, title and
// "Motion: (Mover-Seconder) ... carried". Each meeting's minutes are a recap, split into actions before triage. They're
// "proposed" until approved at the next meeting, so a meeting is keyed by its id. No robots.txt; two seconds apart.
import type { Candidate, Feed } from './types.ts';
import { blockText, getText, newest, sleep, truncate } from './util.ts';

export type AgendaOnlineOptions = { id: string; description: string; url: string; types: RegExp; place: string };

// The JSON array that follows `label` in a page, by matching its brackets (strings can hold brackets too).
function jsonArray(page: string, label: string): string | null {
  const start = page.indexOf(label);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  for (let i = start + label.length; i < page.length; i++) {
    const ch = page[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) return page.slice(start + label.length, i + 1);
  }
  return null;
}

const mdy = (d: string) => encodeURIComponent(`${d.slice(5, 7)}/${d.slice(8, 10)}/${d.slice(0, 4)}`);

export function agendaOnlineFeed(o: AgendaOnlineOptions): Feed {
  return {
    id: o.id,
    description: o.description,
    lookback: 60,
    async fetch({ since, limit, known }) {
      const today = new Date().toISOString().slice(0, 10);
      const page = await getText(`${o.url}/Meetings/Search?dropid=11&dropsv=${mdy(since)}&dropev=${mdy(today)}`);
      const meetings: { ID: number; Name: string; MeetingTypeName: string; IsMinutesAvailable: boolean; Time: string }[] = JSON.parse(
        jsonArray(page, '"Meetings":') ?? '[]',
      );
      const out: Candidate[] = [];
      for (const m of meetings) {
        const date = m.Time.slice(0, 10);
        const key = `${o.id}-${m.ID}`;
        if (!m.IsMinutesAvailable || !o.types.test(m.MeetingTypeName) || date < since || known?.has(key)) continue;
        out.push({
          key,
          feed: o.id,
          level: 'local',
          jurisdiction: o.place,
          kind: 'recap',
          title: `${m.Name} minutes`,
          date,
          url: `${o.url}/Documents/ViewAgenda?meetingId=${m.ID}&type=minutes&doctype=2`,
        });
      }
      const recent = newest(out, limit);
      for (const c of recent) {
        await sleep(2_000);
        const text = blockText(await getText(c.url).catch(() => ''));
        if (/\bMotion\b/.test(text)) Object.assign(c, { summary: truncate(text.replace(/\s+/g, ' ')), extra: { text } });
      }
      return recent.filter((c) => c.extra?.text);
    },
  };
}
