// An official's feed: the actions credited to them, for officials with at least one.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getEntries, officialUrl, type Official } from '../../../lib/data.ts';
import { officialFeedUrl, rss } from '../../../lib/feed.ts';
import { nameWithParty } from '../../../lib/format.ts';

export async function getStaticPaths() {
  const entries = await getEntries();
  return (await getCollection('officials'))
    .filter((o) => entries.some((e) => e.data.credit.some((c) => c.official.id === o.id)))
    .map((official) => ({ params: { id: official.id }, props: { official } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { official } = props as { official: Official };
  const entries = (await getEntries()).filter((e) => e.data.credit.some((c) => c.official.id === official.id));
  return rss({
    title: `${nameWithParty(official.data)} | whatdidgovtdofor.you`,
    page: officialUrl(official.id),
    feed: officialFeedUrl(official.id),
    description: `What ${official.data.name} did for people.`,
    entries,
  });
};
