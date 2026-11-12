// Generic adapter for a government site's WordPress posts (REST API: <origin>/wp-json/wp/v2/posts). Posts are news
// releases; those whose title matches `recaps` are meeting recaps, kept with their full text to be split into
// actions before triage.
import type { Candidate, Feed } from './types.ts';
import { blockText, get, newest, plainText, truncate } from './util.ts';

export type WordpressOptions = {
  id: string;
  description: string;
  origin: string; // https://henrico.gov
  place: string;
  recaps?: RegExp; // titles of meeting recaps, e.g. /\brecap\b/i
};

export function wordpressFeed(o: WordpressOptions): Feed {
  return {
    id: o.id,
    description: o.description,
    async fetch({ since, limit }) {
      const posts: any[] = [];
      for (let page = 1; ; page++) {
        const url = `${o.origin}/wp-json/wp/v2/posts?${new URLSearchParams({
          after: `${since}T00:00:00`,
          per_page: '100',
          page: String(page),
          _fields: 'id,date,title,link,content',
        })}`;
        const res = await get(url);
        posts.push(...(await res.json()));
        if (page >= Number(res.headers.get('x-wp-totalpages') ?? 1)) break;
      }
      const out = posts.map((p): Candidate => {
        const title = plainText(p.title?.rendered);
        const recap = Boolean(o.recaps?.test(title));
        const text = blockText(p.content?.rendered);
        return {
          key: `${o.id}-${p.id}`,
          feed: o.id,
          level: 'local',
          jurisdiction: o.place,
          kind: recap ? 'recap' : 'press-release',
          title,
          date: String(p.date).slice(0, 10),
          url: p.link,
          summary: truncate(text),
          ...(recap ? { extra: { text } } : {}),
        };
      });
      return newest(out.filter((c) => c.title && c.date >= since), limit);
    },
  };
}

