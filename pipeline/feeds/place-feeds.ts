// Feeds declared as data: each place's yaml lists its sources under `feeds` (see placeFeedSchema in
// src/lib/schema.ts), and this turns them into adapters. Bespoke national and state feeds stay in code.
import { join } from 'node:path';
import { CONTENT, idFromPath, listFiles, readYaml } from '../lib/content.ts';
import { legistarFeed } from './legistar.ts';
import { rssFeed } from './rss.ts';
import type { Feed } from './types.ts';

export async function placeFeeds(): Promise<Feed[]> {
  const out: Feed[] = [];
  for (const file of await listFiles(join(CONTENT, 'places'), '.yaml')) {
    const place = idFromPath(file);
    const p = await readYaml(file);
    for (const f of p.feeds ?? []) {
      switch (f.type) {
        case 'legistar':
          out.push(
            legistarFeed({
              id: f.id ?? `${place}-council`,
              description: `${p.name}: legislation passed (Legistar Web API)`,
              client: f.client,
              site: f.site,
              place,
              types: f.types,
              sponsors: f.sponsors,
              text: f.text,
            }),
          );
          break;
        case 'rss':
          out.push(rssFeed({ id: f.id ?? `${place}-news`, description: `${p.name}: news releases (RSS)`, url: f.url, place }));
          break;
        default:
          throw new Error(`${file}: unknown feed type ${f.type}`);
      }
    }
  }
  return out;
}
