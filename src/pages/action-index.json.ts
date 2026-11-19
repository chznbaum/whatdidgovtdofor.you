// The action index: every action's slug and what the list pages filter it by, newest first (the order every list
// shows). Lists filter it in the browser, then load the matching cards a batch at a time; Pagefind handles text search.
// Compact on purpose (about 30 bytes an action, compressed): names are listed once, and each action refers to them by
// position. Each place lists what's inside it (its counties and cities, a region's members), so "Where" can match an
// action in any of them.
//   { "status": [...], "level": [...], "topic": [...],
//     "place": [[id, name, kind, parent position or -1, [positions of the place and everything inside it]], ...],
//     "actions": [[slug, status, level, [topics], [places]], ...] }
import type { APIRoute } from 'astro';
import { entryPlaceIds, entrySlug, getEntries, getPlacesMap, placeAndDescendants } from '../lib/data.ts';
import { TOPICS } from '../lib/schema.ts';
import { GROUP } from '../lib/status.ts';

const STATUS = ['working', 'coming', 'threat', 'ended'] as const;
const LEVEL = ['federal', 'state', 'local'] as const;

export const GET: APIRoute = async () => {
  const entries = await getEntries();
  const map = await getPlacesMap();
  const places = [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
  const at = new Map(places.map((p, i) => [p.id, i]));
  const body = {
    status: STATUS,
    level: LEVEL,
    topic: TOPICS,
    place: places.map((p) => [
      p.id,
      p.data.name,
      p.data.kind,
      p.data.parent ? at.get(p.data.parent.id)! : -1,
      [...placeAndDescendants(p.id, map)].map((id) => at.get(id)!).sort((a, b) => a - b),
    ]),
    actions: entries.map((e) => [
      entrySlug(e),
      STATUS.indexOf(GROUP[e.data.status.state]),
      LEVEL.indexOf(e.data.level),
      e.data.topics.map((t) => TOPICS.indexOf(t)),
      entryPlaceIds(e).map((id) => at.get(id)!),
    ]),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
