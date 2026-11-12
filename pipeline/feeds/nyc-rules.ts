// NYC agency rules adopted under the City Administrative Procedure Act, from the WordPress RSS feed
// of rules.cityofnewyork.us (the REST API needs a login; the feed doesn't). Checked 2026-11-12.
//   Every rule is one post, proposed or adopted; the feed adds <rule_status> (1 = adopted) and
//   <rule_adoption_date>, which despite its name holds the effective date. Neither the feed nor the
//   rule page gives the City Record adoption date, so adopted rules are dated by when they take
//   effect (usually 30 days after adoption, so it may be in the future).
//   Posts keep their proposal date and are ordered by it, and adoption can come two years later,
//   so every run reads all pages (about 14; the feed starts in mid-2020).
import type { Candidate, Feed } from './types.ts';
import { getTextIfExists, mdyDate, newest, plainText, rfc822Date, rssItems, slugify, truncate, xmlTag } from './util.ts';

const FEED = 'https://rules.cityofnewyork.us/feed/';

// "20261130" or "11/30/2026" -> "2026-11-30"; anything else (free text) -> null.
function effectiveDate(s: string): string | null {
  const ymd = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  return ymd ? `${ymd[1]}-${ymd[2]}-${ymd[3]}` : mdyDate(s);
}

export const nycRules: Feed = {
  id: 'nyc-rules',
  description: 'NYC agency rules adopted (rules.cityofnewyork.us RSS)',
  async fetch({ since, limit }) {
    const out: Candidate[] = [];
    for (let page = 1; ; page++) {
      const xml = await getTextIfExists(page === 1 ? FEED : `${FEED}?paged=${page}`);
      const items = xml ? rssItems(xml) : [];
      if (!items.length) break;
      for (const item of items) {
        if (xmlTag(item.xml, 'rule_status') !== '1' || !item.title || !item.link) continue;
        const posted = rfc822Date(item.pubDate);
        const effective = effectiveDate(xmlTag(item.xml, 'rule_adoption_date'));
        const date = effective ?? posted;
        if (!date || date < since) continue;

        // content:encoded is "Agency: <name> Rule Effective Date: <date> <adopted summary>";
        // rule_short_summary is the summary from when it was proposed.
        const content = plainText(xmlTag(item.xml, 'content:encoded'));
        const agency = content.match(/^Agency:\s*(.*?)\s*Rule Effective Date:/i)?.[1] || undefined;
        const adopted = content.replace(/^Agency:.*?Rule Effective Date:\s*(?:\d{2}-\d{2}-\d{4})?\s*/i, '');
        const proposed = plainText(xmlTag(item.xml, 'rule_short_summary'));
        const summary = adopted.length >= 200 ? adopted : [adopted, proposed].filter(Boolean).join(' ');

        out.push({
          key: `nyc-rule-${slugify(new URL(item.link).pathname.replace(/^\/rule\//, ''))}`,
          feed: 'nyc-rules',
          level: 'local',
          jurisdiction: 'nyc',
          kind: 'regulation',
          title: item.title,
          date,
          url: item.link,
          summary: truncate(agency && summary ? `${agency}: ${summary}` : summary || agency),
          extra: {
            agency: xmlTag(item.xml, 'agency_name') || undefined,
            agencyName: agency,
            effective: effective ?? undefined,
            posted: posted ?? undefined,
            emergency: /\bemergency (?:rules?|procedures?)\b/i.test(`${item.title} ${summary}`) || undefined,
          },
        });
      }
    }
    return newest(out, limit);
  },
};
