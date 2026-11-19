// What the list pages filter and search by. Two indexes carry the same facts about each action:
// - the action index (/action-index.json, src/pages/action-index.json.ts): every action's status, level, topics and
//   places, newest first, small enough to filter in the browser instantly at any size we'll reach;
// - Pagefind's full-text index (dist/pagefind, built after the site by pipeline/search.ts), whose filters come from
//   the hidden spans each action page writes from searchFilters().
import { entryPlaceIds, type Entry } from './data.ts';
import { GROUP } from './status.ts';

export const searchFilters = (e: Entry): [string, string][] => [
  ['status', GROUP[e.data.status.state]],
  ['level', e.data.level],
  ...e.data.topics.map((t): [string, string] => ['topic', t]),
  ...entryPlaceIds(e).map((p): [string, string] => ['place', p]),
];
