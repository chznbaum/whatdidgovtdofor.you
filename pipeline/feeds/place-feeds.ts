// Feeds declared as data: each place's yaml lists its sources under `feeds` (see placeFeedSchema in
// src/lib/schema.ts), and this turns them into adapters. Bespoke national and state feeds stay in code.
import { join } from 'node:path';
import { CONTENT, idFromPath, listFiles, readYaml } from '../lib/content.ts';
import { acnjFeed } from './acnj.ts';
import { agendaCenterFeed } from './agendacenter.ts';
import { civicClerkFeed } from './civicclerk.ts';
import { hcmsFeed } from './hcms.ts';
import { laserficheFeed } from './laserfiche.ts';
import { minutesListFeed } from './minutes-list.ts';
import { legistarFeed } from './legistar.ts';
import { rssFeed } from './rss.ts';
import type { Feed } from './types.ts';
import { wordpressFeed } from './wordpress.ts';

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
              status: f.status ? new RegExp(f.status, 'i') : undefined,
              sponsors: f.sponsors,
              text: f.text,
            }),
          );
          break;
        case 'rss':
          out.push(
            rssFeed({
              id: f.id ?? `${place}-news`,
              description: `${p.name}: news releases${f.recaps ? ' and meeting recaps' : ''} (RSS)`,
              url: f.url,
              place,
              recaps: f.recaps ? new RegExp(f.recaps, 'i') : undefined,
            }),
          );
          break;
        case 'wordpress':
          out.push(
            wordpressFeed({
              id: f.id ?? `${place}-news`,
              description: `${p.name}: news releases and meeting recaps (WordPress)`,
              origin: f.url,
              place,
              recaps: f.recaps ? new RegExp(f.recaps, 'i') : undefined,
            }),
          );
          break;
        case 'civicclerk':
          out.push(
            civicClerkFeed({
              id: f.id ?? `${place}-council`,
              description: `${p.name}: meeting minutes (CivicClerk)`,
              tenant: f.tenant,
              category: f.category,
              place,
            }),
          );
          break;
        case 'agendacenter':
          out.push(
            agendaCenterFeed({
              id: f.id ?? `${place}-council`,
              description: `${p.name}: meeting ${f.file === 'minutes' ? 'minutes' : 'action agendas'} (CivicPlus Agenda Center)`,
              origin: f.url,
              category: f.category,
              file: f.file,
              place,
            }),
          );
          break;
        case 'laserfiche':
          out.push(
            laserficheFeed({
              id: f.id ?? `${place}-council`,
              description: `${p.name}: ${f.title.toLowerCase()} (Laserfiche WebLink)`,
              url: f.url,
              repo: f.repo,
              folder: f.folder,
              title: f.title,
              place,
            }),
          );
          break;
        case 'hcms':
          out.push(
            hcmsFeed({
              id: f.id ?? `${place}-council`,
              description: `${p.name}: meeting agenda actions (CivicPlus HCMS)`,
              page: f.page,
              category: f.category,
              files: new RegExp(f.files, 'i'),
              place,
            }),
          );
          break;
        case 'acnj':
          out.push(
            acnjFeed({
              id: f.id ?? `${place}-council`,
              description: `${p.name}: ${f.body} minutes and final agendas (meetings JSON)`,
              origin: f.url,
              body: f.body,
              place,
            }),
          );
          break;
        case 'minutes-list':
          out.push(
            minutesListFeed({
              id: f.id ?? `${place}-council`,
              description: `${p.name}: ${f.title} minutes`,
              url: f.url,
              pages: f.pages ?? 2,
              title: f.title,
              place,
              layout: f.layout,
              link: f.link ? new RegExp(f.link, 'i') : undefined,
              rows: f.rows ? new RegExp(f.rows, 'i') : undefined,
              delay: f.delay,
              lookback: f.lookback,
            }),
          );
          break;
        default:
          throw new Error(`${file}: unknown feed type ${f.type}`);
      }
    }
  }
  return out;
}
