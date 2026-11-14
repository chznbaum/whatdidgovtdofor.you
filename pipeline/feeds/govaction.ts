// Miami-Dade County's Board of County Commissioners, from the Clerk's own minutes pages (www.miamidade.gov/govaction/,
// built on Legistar, whose public API the county doesn't run). The board's minutes page lists every meeting in a
// <select> ("10/20/2026, DRAFT"); each meeting's minutes are one HTML page with a row per item: its type, sponsors,
// full title, and the action ("Adopted / Resolution R-862-26 / Mover: ... / Seconder: ... / Vote: 9 - 0 / Absent: ...").
// Each meeting is a recap, split into actions before triage. Minutes stay "DRAFT" for months, so a meeting is keyed by
// its id, not its status. The server already replaces some accented letters with "�" ("Garc�a"). No robots.txt; two
// seconds between requests.
import type { Candidate, Feed } from './types.ts';
import { blockText, decodeEntities, getText, mdyDate, newest, sleep, truncate } from './util.ts';

export type GovactionOptions = { id: string; description: string; origin: string; minute: string; body: string; place: string };

export function govactionFeed(o: GovactionOptions): Feed {
  return {
    id: o.id,
    description: o.description,
    lookback: 60,
    async fetch({ since, limit, known }) {
      const list = await getText(
        `${o.origin}/govaction/minutes.asp?Action=Minutes&Oper=DisplayMinute&Minute=${o.minute}&MinuteName=${encodeURIComponent(o.body).replace(/%20/g, '+')}`,
      );
      const out: Candidate[] = [];
      for (const [, value, label] of list.matchAll(/<option value="(\d+)"[^>]*>([^<]+)</g)) {
        const date = mdyDate(decodeEntities(label).trim());
        const key = `${o.id}-${value}`;
        if (!date || date < since || known?.has(key)) continue;
        out.push({
          key,
          feed: o.id,
          level: 'local',
          jurisdiction: o.place,
          kind: 'recap',
          title: `${o.body} minutes, ${date}`,
          date,
          url: `${o.origin}/govaction/commminute.asp?cmbmeetdate=${value}&file=false`,
        });
      }
      const recent = newest(out, limit);
      for (const c of recent) {
        await sleep(2_000);
        const text = blockText(await getText(c.url).catch(() => ''));
        // A meeting with nothing acted on yet (an agenda only) has no "Mover:" lines.
        if (/\bMover:/.test(text)) Object.assign(c, { summary: truncate(text.replace(/\s+/g, ' ')), extra: { text } });
      }
      return recent.filter((c) => c.extra?.text);
    },
  };
}
