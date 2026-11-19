// Each action's list item on its own (/card/<slug>.html), for lists that load more cards than they render: the page
// filters the action index, then fetches the next batch of these. Rendered from the same component the lists use
// (ActionItem), so the markup matches; the styles come from the page, which renders some cards itself.
// The card's headline is an h2; a list whose cards are h3s changes the tag when it inserts one.
import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ActionItem from '../../components/ActionItem.astro';
import { entrySlug, getEntries, type Entry } from '../../lib/data.ts';

export async function getStaticPaths() {
  return (await getEntries()).map((entry) => ({ params: { slug: entrySlug(entry) }, props: { entry } }));
}

const container = await AstroContainer.create();

export const GET: APIRoute = async ({ props }) => {
  const html = await container.renderToString(ActionItem, { props: { entry: (props as { entry: Entry }).entry, heading: 'h2' } });
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
};
