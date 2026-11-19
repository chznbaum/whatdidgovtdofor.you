// The sitemap: every page with the date it last changed (src/lib/lastmod.ts), so search engines recrawl what a day's
// run changed. The same dates are the structured data's dateModified. Top-level pages are found from src/pages, so a
// new one is listed without touching this file; the 404 page and redirects stay out.
import { readdirSync } from 'node:fs';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  entryDates,
  entryUrl,
  getEntries,
  getPlacesMap,
  officialModified,
  officialUrl,
  placeModified,
  placeUrl,
} from '../lib/data.ts';
import { fileDate, latest } from '../lib/lastmod.ts';
import { absoluteUrl } from '../lib/url.ts';

const day = (d: Date | undefined) => d?.toISOString().slice(0, 10);

export const GET: APIRoute = async () => {
  const entries = await getEntries();
  const places = await getPlacesMap();
  const officials = await getCollection('officials');
  const newest = latest(...entries.map((e) => entryDates(e).published));

  // What a top-level page reads besides its own file. Pages that list actions change when one is added.
  const reads: Record<string, (Date | undefined)[]> = {
    index: [newest],
    actions: [newest],
    you: [newest],
    'content-guide': [fileDate('docs/content-guide.md')],
    'your-turn': [fileDate('src/data/get-involved.json')],
  };
  const pages = readdirSync('src/pages')
    .filter((f) => f.endsWith('.astro') && f !== '404.astro')
    .map((f) => f.replace(/\.astro$/, ''))
    .map((name) => ({
      url: absoluteUrl(name === 'index' ? '/' : `/${name}`),
      modified: latest(fileDate(`src/pages/${name}.astro`), ...(reads[name] ?? [])),
    }));

  const urls = [
    ...pages,
    {
      url: absoluteUrl('/places'),
      modified: latest(fileDate('src/pages/places/index.astro'), newest, ...[...places.values()].map((p) => fileDate(p.filePath))),
    },
    ...entries.map((e) => ({ url: absoluteUrl(entryUrl(e)), modified: entryDates(e).modified })),
    ...officials.map((o) => ({ url: absoluteUrl(officialUrl(o.id)), modified: officialModified(o, entries) })),
    ...[...places.values()].map((p) => {
      const seated = officials.filter((o) => o.data.current && o.data.seat?.place.id === p.id);
      return { url: absoluteUrl(placeUrl(p.id)), modified: placeModified(p, entries, places, seated) };
    }),
  ].sort((a, b) => a.url.localeCompare(b.url));

  const body = urls
    .map(({ url, modified }) => `<url><loc>${url}</loc>${modified ? `<lastmod>${day(modified)}</lastmod>` : ''}</url>`)
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
