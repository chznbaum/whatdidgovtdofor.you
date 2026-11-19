// The RSS feeds: the whole site (/feed.xml), each place (/places/<id>/feed.xml: the place and what's inside it), each
// address's set of places (/you/feed/<key>.xml: everything that reaches it, offered on /you) and each official with
// actions on record (/officials/<id>/feed.xml). A feed says what's new on the site, so items are ordered by when an action was
// added, newest first, and each says when the government acted ("Federal law, October 2020") so a newly added
// older action reads as what it is.
import { getEntry } from 'astro:content';
import { entryDates, entryUrl, type Entry } from './data.ts';
import { actionLine } from './format.ts';
import { absoluteUrl } from './url.ts';

const ITEMS = 50;
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Newest added first; actions added the same day, newest action first.
const byAdded = (a: Entry, b: Entry) =>
  entryDates(b).published.getTime() - entryDates(a).published.getTime() || b.data.action.date.getTime() - a.data.action.date.getTime();

export async function rss(o: { title: string; page: string; feed: string; description: string; entries: Entry[] }): Promise<Response> {
  const entries = [...o.entries].sort(byAdded).slice(0, ITEMS);
  const items = await Promise.all(
    entries.map(async (e) => {
      const url = absoluteUrl(entryUrl(e));
      const place = (await getEntry(e.data.jurisdiction))!;
      const line = actionLine(e.data.action.type, e.data.action.date, place.id, place.data.name);
      // Readers tell items apart by guid, which keeps the form it had before URLs dropped the trailing slash (that
      // URL still works), so no item shows up as new again.
      return `    <item>
      <title>${escape(e.data.title)}</title>
      <link>${url}</link>
      <guid>${url}/</guid>
      <pubDate>${entryDates(e).published.toUTCString()}</pubDate>
      <description>${escape(`${line}. ${e.data.dek}`)}</description>
    </item>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(o.title)}</title>
    <link>${absoluteUrl(o.page)}</link>
    <atom:link href="${absoluteUrl(o.feed)}" rel="self" type="application/rss+xml" />
    <description>${escape(o.description)}</description>
    <language>en-us</language>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

export const placeFeedUrl = (id: string) => (id === 'us' ? '/feed.xml' : `/places/${id}/feed.xml`);
export const officialFeedUrl = (id: string) => `/officials/${id}/feed.xml`;
export const addressFeedUrl = (key: string) => `/you/feed/${key}.xml`;
