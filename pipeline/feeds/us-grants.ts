// Federal grant and award announcements that name one of our places (see places.ts for how names
// are matched). Candidates are federal (jurisdiction us) with `places` set to where the money goes.
// Sources checked 2026-11-12, using the feeds' own user agent:
//   FEMA: no RSS, but the press-release listing is a Drupal view filtered by location (New York,
//     Virginia) and date, so this reads it and each matching release's page. FEMA.gov only keeps
//     releases from Jan. 20, 2025 on (older ones are in its content archive).
//   HUD, NOAA, Labor, NEA: RSS with the full release text, newest 10 only (no paging), so history
//     builds up from daily runs.
//   Skipped: DOT (transportation.gov and every modal administration answer 403), EPA (its news
//     search and RSS sit behind an AWS WAF JavaScript challenge), USDA, HHS, Education, Commerce/EDA
//     and the Army Corps (403); energy.gov's RSS lists history pages, not releases; DOJ's is mostly
//     prosecutions ("Norfolk man sentenced for stealing relief funds"), which the filters below
//     would let through.
//   A state alone (New York, Virginia) counts only when the headline names it; a city or county
//   counts anywhere in the release.
import { namedPlaces } from './places.ts';
import type { Candidate, Feed } from './types.ts';
import { getText, longDate, mapLimit, newest, plainText, rfc822Date, rssItems, slugify, truncate } from './util.ts';

// Headlines that announce money awarded, not money on offer.
const AWARD = /\b(?:grants?|awards?|awarded|awarding|funding|funds?|invest(?:s|ed|ing|ments?)?|approves?|approved|delivers?|allocat\w+|obligat\w+)\b/i;
const MONEY = /\$\s?\d|\b(?:million|billion)\b|\bgrants?\b/i;
const NOT_YET = /\b(?:available|apply|applications?|accepting|opportunit(?:y|ies)|now open|webinar|deadline|proposed|notice of funding)\b/i;
const isAward = (title: string) => AWARD.test(title) && MONEY.test(title) && !NOT_YET.test(title);

type Release = { source: string; agency: string; id: string; title: string; date: string; url: string; text: string };

// The sentence around `at`: in these releases, usually one grant ("$5.2 million to the city of ...").
function sentence(text: string, at: number): string {
  const start = Math.max(text.lastIndexOf('. ', at) + 2, at - 300, 0);
  const end = text.indexOf('. ', at);
  return text.slice(start, end < 0 ? at + 300 : Math.min(end + 1, at + 300)).trim();
}

async function candidate(r: Release): Promise<Candidate | null> {
  const text = `${r.title}. ${r.text}`;
  const found = await namedPlaces(text);
  const places = found.local.length ? found.local : (await namedPlaces(r.title)).states;
  if (!places.length) return null;
  // Lead with the sentences that name our places; triage reads only the start of the summary.
  const mentions = [...new Set(found.local.map((id) => sentence(text, found.at[id])))].filter((s) => s !== `${r.title}.`);
  return {
    key: `us-grant-${r.source}-${r.id}`,
    feed: 'us-grants-news',
    level: 'federal',
    jurisdiction: 'us',
    places: places.sort(),
    kind: 'press-release',
    title: r.title,
    date: r.date,
    url: r.url,
    summary: truncate([...mentions, r.text].join(' … ')),
    extra: { agency: r.agency, mentions: mentions.length ? mentions : undefined },
  };
}

// --- FEMA ---------------------------------------------------------------------------------

const FEMA = 'https://www.fema.gov';
const FEMA_LOCATIONS = { '49220': 'New York', '49232': 'Virginia' }; // field_related_locations term ids

async function femaReleases(since: string): Promise<Release[]> {
  const rows: { path: string; title: string; date: string; summary: string }[] = [];
  for (let page = 0; ; page++) {
    const params = new URLSearchParams({ 'field_release_date_value[min]': since, page: String(page) });
    for (const id of Object.keys(FEMA_LOCATIONS)) params.append('field_related_locations_target_id[]', id);
    const html = await getText(`${FEMA}/about/news-multimedia/press-releases?${params}`);
    const found = html.split(/<div class="views-listing views-row">/).slice(1);
    for (const row of found) {
      const link = row.match(/list-view-title"><a href="(\/press-release\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const date = longDate(row.match(/<time [^>]*>([^<]*)<\/time>/)?.[1] ?? '');
      if (!link || !date) continue;
      const summary = plainText(row.match(/views-field-body"><div class="field-content">([\s\S]*?)<\/div>/)?.[1]);
      rows.push({ path: link[1], title: plainText(link[2]), date, summary });
    }
    if (!found.length || (rows.at(-1)?.date ?? '') < since) break;
  }

  const awards = rows.filter((r) => r.date >= since && isAward(r.title));
  return mapLimit(awards, 4, async (r) => {
    // The release text sits between the release date and the location tags.
    const html = await getText(FEMA + r.path);
    const start = html.indexOf('content-inner-container');
    const end = html.indexOf('field--name-field-related-locations', start);
    const text = start >= 0 && end > start ? plainText(html.slice(start, end)).replace(/^.*?Release Date:\s*\S+ \d+, \d{4}\s*/, '') : r.summary;
    return {
      source: 'fema',
      agency: 'FEMA',
      id: slugify(r.path.replace(/^\/press-release\//, '')),
      title: r.title,
      date: r.date,
      url: FEMA + r.path,
      text: text || r.summary,
    };
  });
}

// --- RSS (full text) ----------------------------------------------------------------------

const RSS = [
  { source: 'hud', agency: 'HUD', url: 'https://www.hud.gov/rss.xml' },
  { source: 'noaa', agency: 'NOAA', url: 'https://www.noaa.gov/rss.xml' },
  { source: 'dol', agency: 'Department of Labor', url: 'https://www.dol.gov/rss/releases.xml' },
  { source: 'nea', agency: 'National Endowment for the Arts', url: 'https://www.arts.gov/rss.xml' },
];

async function rssReleases(feed: (typeof RSS)[number], since: string): Promise<Release[]> {
  const out: Release[] = [];
  for (const item of rssItems(await getText(feed.url))) {
    const date = rfc822Date(item.pubDate);
    if (!date || date < since || !item.link || !isAward(item.title)) continue;
    const url = item.link.replace(/^http:/, 'https:');
    out.push({
      source: feed.source,
      agency: feed.agency,
      id: slugify(new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? url),
      title: item.title,
      date,
      url,
      text: plainText(item.description),
    });
  }
  return out;
}

export const usGrants: Feed = {
  id: 'us-grants-news',
  description: 'Federal grant and award announcements naming our places (FEMA, HUD, NOAA, DOL, NEA)',
  async fetch({ since, limit }) {
    const sources = [() => femaReleases(since), ...RSS.map((f) => () => rssReleases(f, since))];
    const releases: Release[] = [];
    // One agency's outage shouldn't hide the others' releases, but all of them failing is an error.
    const results = await Promise.allSettled(sources.map((s) => s()));
    for (const result of results) {
      if (result.status === 'fulfilled') releases.push(...result.value);
      else console.warn(`[us-grants-news] ${(result.reason as Error).message}`);
    }
    if (results.every((r) => r.status === 'rejected')) throw (results[0] as PromiseRejectedResult).reason;
    const out = (await Promise.all(releases.map(candidate))).filter((c): c is Candidate => c !== null);
    return newest(out, limit);
  },
};
