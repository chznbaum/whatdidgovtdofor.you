// New Jersey Governor: executive orders and news releases, from the plain tables on nj.gov (no RSS). Both paths change
// with each governor: orders are filed under the governor's number and name (057sherrill; numbering restarts at 1), and
// releases under the year. Bill signings are left to nj-laws, which has the Legislature's own record of each law.
// robots.txt allows /governor/ and /infobank/. Imperva sits in front of nj.gov; a challenge would fail the feed, and it
// isn't retried.
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, getText, mdyDate, newest, plainText, truncate } from './util.ts';

const SITE = 'https://www.nj.gov';
// The governors whose orders are read, newest first: 057sherrill took office Jan. 20, 2026.
const GOVERNORS = [{ path: '057sherrill', name: 'Mikie Sherrill', number: '057' }];

const cell = (html: string | undefined) => plainText(decodeEntities(html ?? '')).trim();
const rows = (html: string) => [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1]));

// The feed id avoids "-governor", which marks announcement feeds (run.ts): these orders are actions themselves.
export const njExecutiveOrders: Feed = {
  id: 'nj-executive-orders',
  description: "New Jersey governors' executive orders (nj.gov infobank)",
  async fetch({ since, limit, known }) {
    const out: Candidate[] = [];
    for (const g of GOVERNORS) {
      const html = await getText(`${SITE}/infobank/eo/${g.path}/approved/eo_archive.shtml`);
      for (const cells of rows(html)) {
        // Number | Description | Date Issued
        const number = cell(cells[0]);
        const date = mdyDate(cell(cells[2]));
        const key = `nj-eo-${g.number}-${number.toLowerCase().replace(/\W+/g, '-')}`;
        if (!number || !date || date < since || known?.has(key)) continue;
        const pdf = cells[0].match(/href="([^"]+)"/)?.[1];
        out.push({
          key,
          feed: 'nj-executive-orders',
          level: 'state',
          jurisdiction: 'nj',
          kind: 'executive-order',
          title: cell(cells[1]),
          date,
          url: pdf ? new URL(pdf, SITE).href : `${SITE}/infobank/eo/${g.path}/approved/eo_archive.shtml`,
          extra: { number: `Executive Order No. ${number}`, governor: g.name },
        });
      }
    }
    return newest(out, limit);
  },
};

// Releases the other feeds already cover, or that announce nothing done: bill signings (nj-laws), executive orders
// (nj-executive-orders) and statements.
const SKIP = new Set(['Bill Action', 'Executive Orders', 'Statements']);

export const njGovernor: Feed = {
  id: 'nj-governor',
  description: 'New Jersey Governor news releases (nj.gov news archive)',
  async fetch({ since, limit }) {
    const out: Candidate[] = [];
    for (let year = Number(since.slice(0, 4)); year <= new Date().getFullYear(); year++) {
      const html = await getText(`${SITE}/governor/news/${year}/approved/news_archive.shtml`);
      for (const cells of rows(html)) {
        // Title (with the category as data-meta, and a summary) | Posted on | Language | Category
        const href = cells[0]?.match(/<a href="([^"]+\.shtml)"/)?.[1];
        const date = mdyDate(cell(cells[1]));
        const category = cell(cells[3]);
        if (!href || !date || date < since || href.endsWith('-sp.shtml') || SKIP.has(category)) continue;
        out.push({
          key: `nj-gov-${href.match(/(\d{8}[a-z]*)\.shtml$/)?.[1] ?? href}`,
          feed: 'nj-governor',
          level: 'state',
          jurisdiction: 'nj',
          kind: 'press-release',
          title: cell(cells[0].match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1]),
          date,
          url: new URL(href, SITE).href,
          summary: truncate(cell(cells[0].match(/<p class="mt-2[^"]*">([\s\S]*?)<\/p>/)?.[1])) || undefined,
          extra: { category: category || undefined },
        });
      }
    }
    return newest(out, limit);
  },
};
