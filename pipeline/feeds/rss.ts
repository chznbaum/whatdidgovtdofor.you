// Generic adapter for a government news RSS 2.0 feed (CivicPlus News Flash, Craft CMS, ...).
//   CivicPlus feeds only list items that haven't expired, so run regularly and let the
//   candidates.json merge accumulate history.
import type { Candidate, Feed } from './types.ts';
import { blockText, getText, longDate, mapLimit, newest, plainText, rfc822Date, rssItems, slugify, truncate } from './util.ts';

export type RssOptions = {
  id: string;
  description: string;
  url: string;
  place: string;
  level?: Candidate['level'];
  kind?: Candidate['kind'];
  recaps?: RegExp; // titles of meeting recaps (CivicPlus articles), kept with their full text to be split into actions
};

// A CivicPlus News Flash article's body and its "Posted on" date. The RSS pubDate isn't the posting date: CivicPlus
// re-stamps it whenever an item is edited.
export function civicPlusArticle(html: string): { text: string; posted: string | null } {
  const start = html.search(/<div[^>]*class="[^"]*\barticle-content\b/);
  let body = start >= 0 ? html.slice(start) : html;
  const end = body.search(/class="[^"]*\barticle-footer\b|Related News/);
  if (end > 0) body = body.slice(0, end);
  const posted = html.match(/Posted on ([A-Z][a-z]+ \d{1,2}, \d{4})/);
  return { text: blockText(body), posted: posted ? longDate(posted[1]) : null };
}

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
      if (o.recaps) {
        await mapLimit(out.filter((c) => o.recaps!.test(c.title)), 3, async (c) => {
          const html = await getText(c.url).catch(() => null); // a recap that won't load waits for the next run
          if (!html) return;
          const { text, posted } = civicPlusArticle(html);
          if (posted) c.date = posted;
          c.kind = 'recap';
          c.summary = truncate(text);
          c.extra = { text };
        });
        return newest(out.filter((c) => c.date >= since && (c.kind !== 'recap' || c.extra?.text)), limit);
      }
      return newest(out, limit);
    },
  };
}

