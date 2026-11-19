// A place's feed: what its page lists, the place itself, the places inside it and actions aimed at any of them
// (entriesWithin). The United States has none of its own: everything is inside it, so its page offers the site's feed.
import type { APIRoute } from 'astro';
import { entriesWithin, getEntries, getPlacesMap, placeTitle, placeUrl, type Place } from '../../../lib/data.ts';
import { placeFeedUrl, rss } from '../../../lib/feed.ts';

export async function getStaticPaths() {
  const places = await getPlacesMap();
  return [...places.values()].filter((p) => p.id !== 'us').map((place) => ({ params: { id: place.id }, props: { place } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { place } = props as { place: Place };
  const places = await getPlacesMap();
  const title = placeTitle(place, places);
  return rss({
    title: `${title} | whatdidgovtdofor.you`,
    page: placeUrl(place.id),
    feed: placeFeedUrl(place.id),
    description: `What government did for people in ${title}.`,
    entries: entriesWithin(place.id, await getEntries(), places),
  });
};
