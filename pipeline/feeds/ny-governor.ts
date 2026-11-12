// New York Governor press releases about signed legislation and the state budget, from the news
// listing at governor.ny.gov/news. Checked 2026-11-12: the site has no RSS or JSON (no Drupal
// JSON:API, no views feed), so this reads the server-rendered listing, which takes stable Drupal
// views filters: news type (75 = Press Release), a from-date, and 100 items per page. The site holds
// releases from 2020 on (Cuomo's from January 2020, then Hochul's), about 1,500 a year.
//   Most releases are events, visits, grants, and storm warnings; the ny-laws feed already carries
//   every signed bill. This keeps only releases that say a bill was signed (or a signed law took
//   effect) or that are about the enacted budget, and drops statements, Spanish translations,
//   media/transcript posts that duplicate a release, executive-budget proposals, and State of the
//   State proposals.
import type { Candidate, Feed } from './types.ts';
import { getText, longDate, mapLimit, newest, plainText, slugify, truncate } from './util.ts';

const SITE = 'https://www.governor.ny.gov';
const PRESS_RELEASE = '75'; // field_n_news_type term id
const PER_PAGE = 100;

// "Video, Audio, Photos & Rush Transcript: Governor Hochul Signs ..." repeats a press release.
const MEDIA = /^(?:b-roll|video|audio|photos?|rush transcript|remarks as prepared|live)\b[^:]{0,80}:/i;
const SIGNED =
  /\bsign(?:s|ed|ing)?\b[^.;:]{0,100}?\b(?:legislation|legislative|bills?|laws?)\b|\b(?:legislation|bills?|laws?)\b[^.;:]{0,60}?\b(?:signed|into law)\b/i;
const SIGNED_ACT = /\b[Ss]ign(?:s|ed|ing)?\b[^.;:]{0,100}?\bAct\b/; // "Signs Adult Survivors Act", not "act"
const IN_EFFECT = /\b(?:laws?|legislation|Act)\b[^.;:]{0,120}?\b(?:now in effect|takes? effect|goes into effect|went into effect|in effect)\b/i;
const BUDGET = /\bbudget\b/i;
const NOT_BUDGET =
  /\bexecutive budget\b|\b(?:on time|on|under|ahead of) (?:and (?:on|under) )?budget\b|\bbudget (?:director|office|division)\b|\bcongress\w*\b|\bfederal\b|\brepublican|\bwashington\b|\bbig ugly bill\b|\brall(?:y|ies)\b/i;
// Proposals and pleas, not actions.
const NOT = /\bpropos\w*|\bstate of the state\b|\bexecutive orders?\b|\bcalls? (?:on|for)\b|\burges?\b|\btechnical briefing\b/i;
// "Governor Hochul signed legislation ..." / "... as part of the FY 2025 Enacted Budget"
const DESCRIBES = /\b(?:signed|signs|signing)\b[^.;]{0,80}?\b(?:legislation|bills?|into law)\b|\benacted budget\b/i;

function qualifies(title: string, description: string, categories: string[]): boolean {
  if (categories.some((c) => /statement|español|state of the state/i.test(c))) return false;
  if (MEDIA.test(title) || NOT.test(title)) return false;
  return (
    SIGNED.test(title) ||
    SIGNED_ACT.test(title) ||
    IN_EFFECT.test(title) ||
    (BUDGET.test(title) && !NOT_BUDGET.test(title)) ||
    DESCRIBES.test(description)
  );
}

type Row = { path: string; title: string; date: string; description: string; categories: string[] };

// One `<div class="views-row">` per release.
function rows(html: string): Row[] {
  const out: Row[] = [];
  for (const row of html.split(/<div class="views-row">/).slice(1)) {
    const path = row.match(/class="content-title">\s*<a href="(\/news\/[^"?#]+)"/)?.[1];
    const title = plainText(row.match(/field--name-title[^>]*>([\s\S]*?)<\/span>/)?.[1]);
    const date = longDate(row.match(/class="content-dates">\s*<span[^>]*>([^<]*)/)?.[1] ?? '');
    if (!path || !title || !date) continue;
    out.push({
      path,
      title,
      date,
      description: plainText(row.match(/field--name-field-n-description[^>]*>([\s\S]*?)<\/div>/)?.[1]),
      categories: plainText(row.match(/class="content-category">([\s\S]*?)<\/div>/)?.[1])
        .split(/\s*,\s*/)
        .filter(Boolean),
    });
  }
  return out;
}

export const nyGovernor: Feed = {
  id: 'ny-governor',
  description: 'New York Governor press releases on signed legislation and the budget (governor.ny.gov news listing)',
  async fetch({ since, limit }) {
    const listing = async (page: number) => {
      const params = new URLSearchParams({
        [`field_n_news_type[${PRESS_RELEASE}]`]: PRESS_RELEASE,
        created_date_1: since,
        items_per_page: String(PER_PAGE),
        page: String(page),
      });
      const html = await getText(`${SITE}/news?${params}`);
      const total = Number(html.match(/<span class="count">(\d+)<\/span>/)?.[1] ?? 0);
      const found = rows(html);
      // A listing that reports results but yields no rows means the markup changed.
      if (total > page * PER_PAGE && !found.length) throw new Error(`no releases parsed from ${SITE}/news page ${page}`);
      return { found, total };
    };

    const first = await listing(0);
    const pages = Array.from({ length: Math.max(0, Math.ceil(first.total / PER_PAGE) - 1) }, (_, i) => i + 1);
    const rest = await mapLimit(pages, 4, async (page) => (await listing(page)).found);

    const out: Candidate[] = [];
    for (const r of [first.found, ...rest].flat()) {
      if (r.date < since || !qualifies(r.title, r.description, r.categories)) continue;
      out.push({
        key: `ny-gov-${slugify(r.path.replace(/^\/news\//, ''))}`,
        feed: 'ny-governor',
        level: 'state',
        jurisdiction: 'ny',
        kind: 'press-release',
        title: r.title,
        date: r.date,
        url: SITE + r.path,
        summary: truncate(r.description) || undefined,
      });
    }
    return newest(dedupeKeys(out), limit);
  },
};

// A release published mid-run shifts later pages by one, so the same row can appear twice.
const dedupeKeys = (cs: Candidate[]) => [...new Map(cs.map((c) => [c.key, c])).values()];
