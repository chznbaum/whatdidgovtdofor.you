// An address's feed, offered on /you: everything that reaches the address, from its local government up to the
// federal one, the same actions /you lists (any whose places include one of the address's). One feed per set of
// places an address can have (addressPlaceSets in src/lib/data.ts).
import type { APIRoute } from 'astro';
import { addressPlaceSets, entryPlaceIds, getEntries, getPlacesMap, placeTitle } from '../../../lib/data.ts';
import { addressFeedUrl, rss } from '../../../lib/feed.ts';

const RANK = ['town', 'city', 'county', 'region', 'state', 'country'];

export async function getStaticPaths() {
  return addressPlaceSets(await getPlacesMap()).map(({ key, ids }) => ({ params: { key }, props: { ids: [...ids] } }));
}

export const GET: APIRoute = async ({ params, props }) => {
  const ids = new Set((props as { ids: string[] }).ids);
  const places = await getPlacesMap();
  // Named for its most local place: "What government did for you in Norfolk, Va."
  const nearest = [...ids].map((id) => places.get(id)!).sort((a, b) => RANK.indexOf(a.data.kind) - RANK.indexOf(b.data.kind))[0];
  const title = nearest.id === 'us' ? 'What government did for you' : `What government did for you in ${placeTitle(nearest, places)}`;
  return rss({
    title: `${title} | whatdidgovtdofor.you`,
    page: '/you',
    feed: addressFeedUrl(params.key!),
    description: 'Everything on record that reaches your address, from your local government to the federal one.',
    entries: (await getEntries()).filter((e) => entryPlaceIds(e).some((p) => ids.has(p))),
  });
};
