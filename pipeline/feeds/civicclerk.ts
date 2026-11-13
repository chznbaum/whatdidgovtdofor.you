// Generic adapter for CivicClerk (https://<tenant>.api.civicclerk.com, OData, no key). Its agenda items carry no
// outcomes, so each meeting's published minutes, as plain text, become one recap candidate, split into actions
// before triage. Minutes appear one to three months after a meeting, so the feed looks back four months and downloads
// only minutes it doesn't have yet.
import type { Candidate, Feed } from './types.ts';
import { getJson, getText, localDate, mapLimit, newest, truncate } from './util.ts';

export type CivicClerkOptions = {
  id: string;
  description: string;
  tenant: string; // chesterfieldcova
  category: number; // the governing body's event category, e.g. 26 = Board of Supervisors
  place: string;
};

export function civicClerkFeed(o: CivicClerkOptions): Feed {
  const api = `https://${o.tenant}.api.civicclerk.com/v1`;
  const file = (id: number, plainText: boolean) => `${api}/Meetings/GetMeetingFileStream(fileId=${id},plainText=${plainText})`;
  return {
    id: o.id,
    description: o.description,
    lookback: 120,
    async fetch({ since, limit, known }) {
      const events: any[] = [];
      let url: string | undefined = `${api}/Events?${new URLSearchParams({
        $filter: `categoryId eq ${o.category} and startDateTime ge ${since}T00:00:00Z`,
        $orderby: 'startDateTime desc',
      })}`;
      while (url) {
        const page: any = await getJson(url);
        events.push(...(page.value ?? []));
        url = page['@odata.nextLink'];
      }
      const out: Candidate[] = [];
      for (const e of events) {
        const minutes = (e.publishedFiles ?? []).find((f: any) => /minutes/i.test(f.type ?? ''));
        const date = localDate(new Date(e.startDateTime));
        if (!minutes || date < since || known?.has(`${o.id}-${e.id}`)) continue;
        out.push({
          key: `${o.id}-${e.id}`,
          feed: o.id,
          level: 'local',
          jurisdiction: o.place,
          kind: 'recap',
          title: `${e.eventName} minutes`,
          date,
          url: file(minutes.fileId, false),
          extra: { fileId: minutes.fileId },
        });
      }
      const recent = newest(out, limit);
      await mapLimit(recent, 2, async (c) => {
        const text = (await getText(file(c.extra!.fileId as number, true)).catch(() => '')).trim();
        if (text) Object.assign(c, { summary: truncate(text.replace(/\s+/g, ' ')), extra: { ...c.extra, text } });
      });
      return recent.filter((c) => c.extra?.text); // minutes that don't extract as text (scans) are left out
    },
  };
}
