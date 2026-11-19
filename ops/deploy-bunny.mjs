// Deploys dist/ to a Bunny Storage Zone and purges the Pull Zone in front of it.
// Uploads only files whose SHA-256 differs from what's stored, sets the pull zone's browser-cache rules (BROWSER_CACHE
// below), purges the cache, then deletes stored files that are no longer in the build (last, so a page never links to
// something already gone). dist/404.html also goes to bunnycdn_errors/404.html, which Bunny serves as the 404 page.
//
// Env:
//   BUNNY_STORAGE_ZONE      storage zone name
//   BUNNY_STORAGE_PASSWORD  the zone's password (FTP & API Access > Password), not the account key
//   BUNNY_STORAGE_HOST      the zone region's API host, default storage.bunnycdn.com (Falkenstein);
//                           e.g. ny.storage.bunnycdn.com, la.storage.bunnycdn.com, uk.storage.bunnycdn.com
//   BUNNY_API_KEY           account API key, for the cache rules and the purge
//   BUNNY_PULLZONE_ID       pull zone id, for the cache rules and the purge
//   SITE_URL                the public site, checked after the purge; default https://whatdidgovtdofor.you
// Usage: node ops/deploy-bunny.mjs [--dry-run]   (a dry run lists the uploads, deletes and cache-rule changes)
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST = join(import.meta.dirname, '..', 'dist');
const dryRun = process.argv.includes('--dry-run');
const need = (k) => process.env[k] || (console.error(`missing ${k}`), process.exit(1));
const zone = need('BUNNY_STORAGE_ZONE');
const password = need('BUNNY_STORAGE_PASSWORD');
const host = process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
const base = `https://${host}/${zone}/`;
const ERRORS = 'bunnycdn_errors/';

// How long visitors' browsers may keep each kind of file, as Bunny edge rules (ActionType 16, Override Browser Cache
// Time, in seconds; the first matching rule wins, so the order matters). Bunny's own edge cache is purged on every
// deploy, so it can keep files as long as it likes; a browser can't be purged, so pages must be rechecked on every
// visit (a cheap 304 when unchanged, since Bunny sends Last-Modified) or a visitor sees yesterday's run for days.
// Rules this script manages carry a "[deploy]" description; the pull zone's other rules are left alone.
const BROWSER_CACHE = [
  // Bundled CSS and JS: the file name changes whenever the content does.
  { name: 'bundled assets', pattern: '*/_astro/*', seconds: 365 * 24 * 3600 },
  // Drawings and share images keep their file name when redrawn or regenerated, so a day at most.
  { name: 'portraits', pattern: '*/portraits/*', seconds: 24 * 3600 },
  { name: 'share images', pattern: '*/og/*', seconds: 24 * 3600 },
  // Everything else: pages, the feed, sitemaps, robots.txt, the address-lookup data.
  { name: 'pages and data', pattern: '*', seconds: 0 },
];
const MANAGED = '[deploy]';
const OVERRIDE_BROWSER_CACHE_TIME = 16; // EdgeRuleActionType
const URL_TRIGGER = 0; // TriggerTypes.Url
const MATCH_ANY = 0; // PatternMatchingTypes

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex').toUpperCase();

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(relative(DIST, p).split(sep).join('/'));
  }
  return out;
}

async function bunny(method, path, body, headers = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(base + path.split('/').map(encodeURIComponent).join('/'), {
      method,
      body,
      headers: { AccessKey: password, ...headers },
    });
    if (res.ok || (method === 'DELETE' && res.status === 404)) return res;
    if (attempt >= 3 || res.status < 500) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
}

// Everything stored, as path -> checksum (Bunny lists a SHA-256 for each object).
async function stored(dir = '') {
  const list = await (await bunny('GET', dir)).json();
  const out = new Map();
  for (const o of list) {
    const path = dir + o.ObjectName;
    if (o.IsDirectory) for (const [k, v] of await stored(`${path}/`)) out.set(k, v);
    else out.set(path, (o.Checksum ?? '').toUpperCase());
  }
  return out;
}

async function pool(items, n, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(n, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

const local = await walk(DIST);
// A guard against wiping the site from a broken or empty build.
if (local.length < 100 || !local.includes('index.html')) {
  console.error(`dist/ has ${local.length} files and ${local.includes('index.html') ? 'an' : 'no'} index.html; refusing to deploy`);
  process.exit(1);
}
const wanted = new Map(local.map((p) => [p, p]));
if (local.includes('404.html')) wanted.set(`${ERRORS}404.html`, '404.html');

const remote = await stored();
const uploads = [];
for (const [dest, src] of wanted) {
  const buf = await readFile(join(DIST, src));
  if (remote.get(dest) !== sha256(buf)) uploads.push([dest, buf]);
}
const deletes = [...remote.keys()].filter((p) => !wanted.has(p));
console.log(`${local.length} files built; ${uploads.length} to upload, ${deletes.length} to delete${dryRun ? ' (dry run)' : ''}`);

const apiKey = process.env.BUNNY_API_KEY;
const pullZone = process.env.BUNNY_PULLZONE_ID;
const api = async (method, path, body) => {
  const res = await fetch(`https://api.bunny.net/pullzone/${pullZone}${path}`, {
    method,
    headers: { AccessKey: apiKey, ...(body && { 'Content-Type': 'application/json' }) },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} /pullzone/${pullZone}${path}: ${res.status} ${await res.text()}`);
  return res;
};

// Make the pull zone's "[deploy]" edge rules match BROWSER_CACHE: update each by its description, add what's
// missing, delete what's no longer listed. Returns what it did (or would do, on a dry run).
async function syncCacheRules() {
  const zone = await (await api('GET', '')).json();
  const rules = zone.EdgeRules ?? [];
  const ours = rules.filter((r) => r.Description?.startsWith(MANAGED));
  const others = rules.filter((r) => !r.Description?.startsWith(MANAGED) && [16, 25, 26].includes(r.ActionType));
  if (others.length) console.warn(`note: ${others.length} other browser-cache rule(s) on the zone: ${others.map((r) => r.Description || r.Guid).join(', ')}`);
  const log = [];
  for (const [i, rule] of BROWSER_CACHE.entries()) {
    const description = `${MANAGED} browser cache: ${rule.name}`;
    const current = ours.find((r) => r.Description === description);
    const body = {
      ...(current && { Guid: current.Guid }),
      ActionType: OVERRIDE_BROWSER_CACHE_TIME,
      ActionParameter1: String(rule.seconds),
      ActionParameter2: '',
      Triggers: [{ Type: URL_TRIGGER, PatternMatches: [rule.pattern], PatternMatchingType: MATCH_ANY, Parameter1: '' }],
      TriggerMatchingType: MATCH_ANY,
      Description: description,
      Enabled: true,
      OrderIndex: i,
    };
    const same =
      current &&
      current.ActionType === body.ActionType &&
      current.ActionParameter1 === body.ActionParameter1 &&
      current.Enabled &&
      current.OrderIndex === i &&
      JSON.stringify(current.Triggers?.map((t) => t.PatternMatches)) === JSON.stringify([[rule.pattern]]);
    if (same) continue;
    log.push(`${current ? 'update' : 'add'} ${description} (${rule.pattern} → ${rule.seconds}s)`);
    if (!dryRun) await api('POST', '/edgerules/addOrUpdate', body);
  }
  for (const r of ours.filter((r) => !BROWSER_CACHE.some((b) => r.Description === `${MANAGED} browser cache: ${b.name}`))) {
    log.push(`delete ${r.Description}`);
    if (!dryRun) await api('DELETE', `/edgerules/${r.Guid}`);
  }
  return log;
}

if (dryRun) {
  for (const [p] of uploads.slice(0, 20)) console.log(`  upload ${p}`);
  for (const p of deletes.slice(0, 20)) console.log(`  delete ${p}`);
  if (apiKey && pullZone) {
    const changes = await syncCacheRules();
    console.log(changes.length ? changes.map((c) => `  ${c}`).join('\n') : '  cache rules: up to date');
  }
  process.exit(0);
}

await pool(uploads, 8, async ([path, buf]) => {
  await bunny('PUT', path, buf, { 'Content-Type': 'application/octet-stream', Checksum: sha256(buf) });
});
console.log(`uploaded ${uploads.length}`);

if (apiKey && pullZone) {
  // A failure here must not stop the purge, or the new upload would sit behind a stale cache: report it, finish the
  // deploy, and fail the run at the end.
  try {
    const changes = await syncCacheRules();
    console.log(changes.length ? `cache rules: ${changes.join('; ')}` : 'cache rules: up to date');
  } catch (err) {
    console.error(`::error::cache rules not updated: ${err.message}`);
    process.exitCode = 1;
  }
  await api('POST', '/purgeCache');
  console.log('purged the pull zone cache');

  // What a browser is actually told for a page, now that the cache is empty.
  const site = process.env.SITE_URL || 'https://whatdidgovtdofor.you';
  const cacheControl = (await fetch(`${site}/`, { method: 'HEAD' }).catch(() => undefined))?.headers.get('cache-control');
  const maxAge = Number(/max-age=(\d+)/.exec(cacheControl ?? '')?.[1] ?? 0);
  if (cacheControl === undefined || cacheControl === null) console.warn(`::warning::couldn't read ${site}/'s cache-control`);
  else if (maxAge > 300) console.warn(`::warning::${site}/ still tells browsers "${cacheControl}"; pages should be rechecked on every visit`);
  else console.log(`${site}/ cache-control: ${cacheControl}`);
} else console.warn('BUNNY_API_KEY or BUNNY_PULLZONE_ID not set; skipped the cache rules and the purge');

await pool(deletes, 8, (path) => bunny('DELETE', path));
console.log(`deleted ${deletes.length}`);
