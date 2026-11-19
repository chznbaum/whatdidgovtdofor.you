// RSS feed of actions, newest first, so people can follow along in a reader.
import type { APIRoute } from 'astro';
import { entryUrl, getEntries } from '../lib/data.ts';
import { SITE, absoluteUrl } from '../lib/url.ts';

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async () => {
  const items = (await getEntries()).slice(0, 50).map((e) => {
    const url = absoluteUrl(entryUrl(e));
    // Readers tell items apart by guid, so it keeps the form it had before URLs dropped the trailing slash
    // (that URL still works); a new form would show every item in the feed as new again.
    const guid = `${url}/`;
    return `    <item>
      <title>${escape(e.data.title)}</title>
      <link>${url}</link>
      <guid>${guid}</guid>
      <pubDate>${e.data.action.date.toUTCString()}</pubDate>
      <description>${escape(e.data.dek)}</description>
    </item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>What did government do for you?</title>
    <link>${SITE}</link>
    <description>Concrete things government did for people, who made them happen, and whether they still stand.</description>
    <language>en-us</language>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
