// The action index: every action's slug and what the list pages filter it by, newest first (the order every list
// shows). Lists filter it in the browser, then load the matching cards a batch at a time; Pagefind handles text search.
// Compact on purpose (about 30 bytes an action, compressed): names are listed once, and each action refers to them by
// position. Places carry their parent, so a page can tell what's inside a state or region.
//   { "status": [...], "level": [...], "topic": [...],
//     "place": [[id, name, kind, parent position or -1], ...],
//     "actions": [[slug, status, level, [topics], [places]], ...] }
import type { APIRoute } from 'astro';
import { entryPlaceIds, entrySlug, getEntries, getPlacesMap } from '../lib/data.ts';
import { TOPICS } from '../lib/schema.ts';
import { GROUP } from '../lib/status.ts';

const STATUS = ['working', 'coming', 'threat', 'ended'] as const;
const LEVEL = ['federal', 'state', 'local'] as const;

export const GET: APIRoute = async () => {
  const entries = await getEntries();
  const places = [...(await getPlacesMap()).values()].sort((a, b) => a.id.localeCompare(b.id));
  const at = new Map(places.map((p, i) => [p.id, i]));
  const body = {
    status: STATUS,
    level: LEVEL,
    topic: TOPICS,
    place: places.map((p) => [p.id, p.data.name, p.data.kind, p.data.parent ? at.get(p.data.parent.id)! : -1]),
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
