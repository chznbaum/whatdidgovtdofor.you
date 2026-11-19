// The sitemap index robots.txt points to. One sitemap holds every page until there are 50,000 of them.
import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url.ts';

export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${absoluteUrl('/sitemap-0.xml')}</loc></sitemap></sitemapindex>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
