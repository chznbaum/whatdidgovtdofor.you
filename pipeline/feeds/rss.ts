// Generic adapter for a government news RSS 2.0 feed (CivicPlus News Flash, Craft CMS, ...).
//   CivicPlus feeds only list items that haven't expired, so run regularly and let the
//   candidates.json merge accumulate history.
import type { Candidate, Feed } from './types.ts';
import { getText, newest, plainText, rfc822Date, rssItems, slugify, truncate } from './util.ts';

export type RssOptions = {
  id: string;
  description: string;
  url: string;
  place: string;
  level?: Candidate['level'];
  kind?: Candidate['kind'];
};

// Stable per-item id: CivicPlus "?aid=123", else the link's last path segment.
function itemId(link: string): string {
  const aid = link.match(/[?&]aid=(\d+)/i);
  if (aid) return aid[1];
  try {
    const u = new URL(link);
    return slugify(u.pathname.split('/').filter(Boolean).at(-1) ?? u.hostname) || slugify(link);
  } catch {
    return slugify(link);
  }
}

export function rssFeed(o: RssOptions): Feed {
  return {
    id: o.id,
    description: o.description,
    async fetch({ since, limit }) {
      const items = rssItems(await getText(o.url));
      const out: Candidate[] = [];
      for (const item of items) {
        const date = rfc822Date(item.pubDate);
        if (!date || date < since || !item.title || !item.link) continue;
        out.push({
          key: `${o.id}-${itemId(item.link)}`,
          feed: o.id,
          level: o.level ?? 'local',
          jurisdiction: o.place,
          kind: o.kind ?? 'press-release',
          title: item.title,
          date,
          url: item.link,
          summary: truncate(plainText(item.description)) || undefined,
        });
      }
      return newest(out, limit);
    },
  };
}

// CivicPlus sites publish every News Flash category at the same path.
export const civicPlusNews = (place: string, origin: string, name: string): Feed =>
  rssFeed({
    id: `${place}-news`,
    description: `${name} city news (CivicPlus News Flash RSS)`,
    url: `${origin}/RSSFeed.aspx?ModID=1&CID=All-newsflash.xml`,
    place,
  });
