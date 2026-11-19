// Builds the full-text search index (dist/pagefind) after the site is built; runs as `postbuild`.
// Pagefind returns results without a search term in the order pages were added, so they're added newest first, in
// the action index's order: a filtered list then comes back newest first with no sort, which would cost seconds once
// there are tens of thousands of actions. Only action pages are indexed; each marks what to read (data-pagefind-body,
// data-pagefind-ignore) and its filters (src/lib/search.ts).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as pagefind from 'pagefind';

const DIST = 'dist';
const start = Date.now();
const { actions } = JSON.parse(readFileSync(join(DIST, 'action-index.json'), 'utf8')) as { actions: [string, ...unknown[]][] };

const { index, errors } = await pagefind.createIndex({});
if (!index) throw new Error(`pagefind: ${errors.join('; ')}`);
for (const [slug] of actions) {
  const url = `/action/${slug}`;
  const added = await index.addHTMLFile({ url, content: readFileSync(join(DIST, 'action', slug, 'index.html'), 'utf8') });
  if (added.errors.length) throw new Error(`pagefind: ${url}: ${added.errors.join('; ')}`);
}
const written = await index.writeFiles({ outputPath: join(DIST, 'pagefind') });
if (written.errors.length) throw new Error(`pagefind: ${written.errors.join('; ')}`);
await pagefind.close();
console.log(`search index: ${actions.length} actions in ${((Date.now() - start) / 1000).toFixed(1)} s`);
