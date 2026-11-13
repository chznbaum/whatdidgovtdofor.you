// Generic adapter for a CivicPlus HCMS ("Evolve") site, whose pages draw their content in the browser from
// content.civicplus.com with a guest token the page itself carries. The owner allowed reading that token the way a
// visitor's browser does (Nov 13, 2026); it's taken fresh from the page on every run and never stored. Portsmouth files
// each council meeting as an `agendasandminutes` item whose minutes files include, within days, an "Agenda Actions" PDF:
// the agenda with every item's outcome and tally. Each meeting's matching files become one recap candidate, split into
// actions before triage.
import type { Candidate, Feed } from './types.ts';
import { USER_AGENT, getText, localDate, newest, pdfText, sleep, truncate } from './util.ts';

export type HcmsOptions = {
  id: string;
  description: string;
  page: string; // a public page that lists the meetings, e.g. https://www.portsmouthva.gov/agendas-minutes
  category: string; // the body's category id ("City Council")
  files: RegExp; // which of a meeting's minutes files to read, by file name: /Agenda Actions/
  place: string;
};

const API = 'https://content.civicplus.com/api';
// An action agenda shows outcomes with tallies: "Adopted 6-0".
const OUTCOME = /\b(approved|adopted|denied|carried|failed)\b[^\n]{0,40}?\b\d{1,2}\s*-\s*\d{1,2}\b/i;

export function hcmsFeed(o: HcmsOptions): Feed {
  return {
    id: o.id,
    description: o.description,
    lookback: 60,
    async fetch({ since, limit, known }) {
      const html = await getText(o.page);
      const app = html.match(/hcmsReadOnlyConfiguration:\{[^}]*?appName:"([^"]+)"/)?.[1];
      const token = html.match(/hcmsClientToken:"(Bearer [^"]+)"/)?.[1];
      if (!app || !token) throw new Error(`no HCMS app or guest token on ${o.page}`);
      const query = new URLSearchParams({
        $top: '200',
        $orderby: 'data/DateandTime/iv desc',
        $filter: `data/DateandTime/iv ge ${since}T00:00:00Z`,
      });
      const res = await fetch(`${API}/content/${app}/agendasandminutes?${query}`, {
        headers: { 'user-agent': USER_AGENT, authorization: token },
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} listing ${app} agendas and minutes`);
      const out: Candidate[] = [];
      for (const item of ((await res.json()) as any).items ?? []) {
        const files: string[] = item.data?.MinutesFile?.iv ?? [];
        const when = item.data?.DateandTime?.iv;
        const key = `${o.id}-${item.id}`;
        if (!files.length || !when || known?.has(key) || !(item.categories ?? []).some((c: any) => c.id === o.category)) continue;
        const date = localDate(new Date(when));
        if (date < since) continue;
        out.push({
          key,
          feed: o.id,
          level: 'local',
          jurisdiction: o.place,
          kind: 'recap',
          title: `${String(item.data?.MeetingTitle?.iv ?? `Meeting of ${date}`).trim()}: agenda actions`,
          date,
          url: o.page,
          extra: { files: files.map((f) => `${API}/assets/${app}/${f}`) },
        });
      }
      const recent = newest(out, limit);
      for (const c of recent) {
        const texts: string[] = [];
        for (const url of c.extra!.files as string[]) {
          await sleep(1_000);
          const file = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(90_000) });
          const name = decodeURIComponent(file.headers.get('content-disposition')?.match(/filename\*=UTF-8''([^;]+)/)?.[1] ?? '');
          if (!file.ok || !o.files.test(name)) {
            await file.body?.cancel();
            continue;
          }
          const text = (await pdfText(new Uint8Array(await file.arrayBuffer()))).trim();
          if (OUTCOME.test(text)) {
            texts.push(text);
            c.url = url; // the actions file itself is the record
          }
        }
        if (texts.length) Object.assign(c, { summary: truncate(texts.join(' ').replace(/\s+/g, ' ')), extra: { text: texts.join('\n\n') } });
      }
      return recent.filter((c) => c.extra?.text);
    },
  };
}
