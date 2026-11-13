// Generic adapter for a Laserfiche WebLink 11 archive (<server>/WebLink), where some clerks file each meeting's
// record as a scanned, OCR'd document. WebLink only answers its own browser app: a session cookie from a first page
// load, then JSON POSTs to list a folder and to read a page's text. The owner allowed these calls (Nov 13, 2026) for
// Virginia Beach, whose clerk files a "Summary of City Council Actions" for every meeting (each item's action and vote)
// a day or two after it, in a folder per year. Each summary becomes one recap candidate, split into actions before
// triage. Requests go one at a time with a pause; the feed reads only summaries it doesn't have yet.
import type { Candidate, Feed } from './types.ts';
import { USER_AGENT, newest, sleep, truncate } from './util.ts';

export type LaserficheOptions = {
  id: string;
  description: string;
  url: string; // https://edocs.vbgov.com/WebLink
  repo: string; // CityClerk
  folder: number; // the series' folder, holding one subfolder per year ("SUMMARIES 2026")
  title: string; // what a document is, for the candidate's title: "Summary of City Council actions"
  place: string;
};

const PAUSE = 1_000;

type Entry = { entryId: number; name: string; type: number; data: unknown[] };

// A WebLink session: cookies picked up while following its redirects (the first visit goes through CookieCheck.aspx).
async function session(start: string): Promise<string> {
  const jar = new Map<string, string>();
  let url = start;
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': USER_AGENT, cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') },
      signal: AbortSignal.timeout(60_000),
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const at = pair.indexOf('=');
      jar.set(pair.slice(0, at).trim(), pair.slice(at + 1).trim());
    }
    const next = res.headers.get('location');
    if (res.status < 300 || res.status >= 400 || !next) break;
    url = new URL(next, url).href;
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
}

export function laserficheFeed(o: LaserficheOptions): Feed {
  const post = async (cookie: string, service: string, body: object): Promise<any> => {
    await sleep(PAUSE);
    const res = await fetch(`${o.url}/${service}`, {
      method: 'POST',
      headers: { 'user-agent': USER_AGENT, 'content-type': 'application/json; charset=utf-8', cookie },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${o.url}/${service}`);
    const json: any = await res.json();
    return json.data ?? json;
  };
  const list = async (cookie: string, folderId: number): Promise<Entry[]> =>
    (
      await post(cookie, 'FolderListingService.aspx/GetFolderListing2', {
        repoName: o.repo,
        folderId,
        getNewListing: true,
        start: 0,
        end: 500,
        sortColumn: '',
        sortAscending: true,
      })
    ).results ?? [];

  return {
    id: o.id,
    description: o.description,
    lookback: 60,
    async fetch({ since, limit, known }) {
      const cookie = await session(`${o.url}/Browse.aspx?id=${o.folder}&dbid=0&repo=${o.repo}`);
      // Year folders from the one `since` falls in through this one.
      const years = (await list(cookie, o.folder)).filter((e) => e.type === 0 && Number(e.name.match(/\b(\d{4})\b/)?.[1]) >= Number(since.slice(0, 4)));
      const out: Candidate[] = [];
      for (const year of years) {
        for (const doc of await list(cookie, year.entryId)) {
          // Documents are named for the meeting date, MMDDYYYY.
          const m = doc.type === -2 && doc.name.match(/^(\d{2})(\d{2})(\d{4})$/);
          if (!m) continue;
          const date = `${m[3]}-${m[1]}-${m[2]}`;
          const key = `${o.id}-${doc.entryId}`;
          if (date < since || known?.has(key)) continue;
          out.push({
            key,
            feed: o.id,
            level: 'local',
            jurisdiction: o.place,
            kind: 'recap',
            title: `${o.title}, ${date}`,
            date,
            url: `${o.url}/DocView.aspx?id=${doc.entryId}&dbid=0&repo=${o.repo}`,
            extra: { pages: Number(doc.data?.[1]) || 1, entryId: doc.entryId },
          });
        }
      }
      const recent = newest(out, limit);
      for (const c of recent) {
        const pages: string[] = [];
        for (let p = 1; p <= (c.extra!.pages as number); p++) {
          const page = await post(cookie, 'DocumentService.aspx/GetTextHtmlForPage', {
            repoName: o.repo,
            documentId: c.extra!.entryId,
            pageNum: p,
            showAnn: false,
            searchUuid: '',
          });
          pages.push(String(page?.text ?? page ?? '').replace(/\r\n?/g, '\n'));
        }
        const text = pages.join('\n\n').trim();
        if (text) Object.assign(c, { summary: truncate(text.replace(/\s+/g, ' ')), extra: { ...c.extra, text } });
      }
      return recent.filter((c) => c.extra?.text); // an image-only document has no text to read
    },
  };
}
