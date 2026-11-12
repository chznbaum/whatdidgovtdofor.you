// Generic adapter for CivicClerk (https://<tenant>.api.civicclerk.com, OData, no key). Its agenda items carry no
// outcomes, so each meeting's published minutes, as plain text, become one recap candidate, split into actions
// before triage. Minutes appear about a month after a meeting; a run picks them up once they're posted.
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
    async fetch({ since, limit }) {
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
        if (!minutes || date < since) continue;
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
