// NYC Mayor's Office press releases and executive orders, from the JSON endpoint behind
// nyc.gov/mayors-office/news (found in the page's newslisting script; no key).
//   Items have no description, so summaries are empty; titles carry the news.
import type { Candidate, Feed } from './types.ts';
import { getJson, longDate, newest, plainText, slugify, truncate } from './util.ts';

const API = 'https://www.nyc.gov/bin/nyc/articlesearch.json';

export const nycMayor: Feed = {
  id: 'nyc-mayor',
  description: "NYC Mayor's Office press releases and executive orders (nyc.gov article search JSON)",
  async fetch({ since, limit }) {
    const out: Candidate[] = [];
    for (let page = 1; ; page++) {
      const params = new URLSearchParams({
        pageSize: '100',
        currentPage: String(page),
        types: 'press-releases,executive-orders',
        fromDate: since,
      });
      const res: any = await getJson(`${API}?${params}`);
      for (const a of res.results ?? []) {
        const date = longDate(a.articleDate ?? '');
        if (!date || date < since || !a.link) continue;
        // "/mayors-office/news/2026/11/some-slug.html"; the .html form redirects to an internal host.
        const path = String(a.link).replace(/\.html$/, '');
        const eo = /^(emergency )?executive order\b/i.test(a.title);
        out.push({
          key: `nyc-mayor-${slugify(path.replace(/^\/mayors-office\/news\//, ''))}`,
          feed: 'nyc-mayor',
          level: 'local',
          jurisdiction: 'nyc',
          kind: eo ? 'executive-order' : 'press-release',
          title: plainText(a.title),
          date,
          url: `https://www.nyc.gov${path}`,
          summary: truncate(plainText(a.articleDesc)) || undefined,
        });
      }
      if (!res.totalPages || page >= res.totalPages || (limit && out.length >= limit)) break;
    }
    return newest(out, limit);
  },
};
