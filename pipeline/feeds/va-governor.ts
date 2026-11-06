// Virginia Governor news releases, from the JSON file behind governor.virginia.gov/newsroom/news-releases/.
//   The file holds roughly the current administration's releases; we filter by date locally.
//   Executive orders are only posted as PDFs without dates, but each one gets a news release.
import type { Candidate, Feed } from './types.ts';
import { getJson, newest, plainText, slugify, truncate } from './util.ts';

const SITE = 'https://www.governor.virginia.gov';

export const vaGovernor: Feed = {
  id: 'va-governor',
  description: 'Virginia Governor news releases (governor.virginia.gov JSON feed)',
  async fetch({ since, limit }) {
    const releases: any[] = await getJson(`${SITE}/newsroom/news-releases/govnewsfeed.php/`);
    const out: Candidate[] = [];
    for (const r of releases) {
      // datecode is "YYYYMMDDhhmm"
      const code = String(r.datecode ?? '');
      const date = /^\d{8}/.test(code) ? `${code.slice(0, 4)}-${code.slice(4, 6)}-${code.slice(6, 8)}` : null;
      if (!date || date < since || !r.link) continue;
      const id = String(r.link).match(/name-(\d+)-en\.html/)?.[1] ?? slugify(r.link);
      out.push({
        key: `va-gov-${id}`,
        feed: 'va-governor',
        level: 'state',
        jurisdiction: 'va',
        kind: 'press-release',
        title: plainText(r.headline),
        date,
        url: new URL(r.link, SITE).href,
        summary: truncate(plainText(r.brief)) || undefined,
        extra: {
          tags: String(r.tags ?? '')
            .split(/,\s*/)
            .filter(Boolean),
        },
      });
    }
    return newest(out, limit);
  },
};
