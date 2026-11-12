// Deploys dist/ to a Bunny Storage Zone and purges the Pull Zone in front of it.
// Uploads only files whose SHA-256 differs from what's stored, then purges the cache, then deletes stored files
// that are no longer in the build (last, so a page never links to something already gone).
// dist/404.html also goes to bunnycdn_errors/404.html, which Bunny serves as the 404 page.
//
// Env:
//   BUNNY_STORAGE_ZONE      storage zone name
//   BUNNY_STORAGE_PASSWORD  the zone's password (FTP & API Access > Password), not the account key
//   BUNNY_STORAGE_HOST      the zone region's API host, default storage.bunnycdn.com (Falkenstein);
//                           e.g. ny.storage.bunnycdn.com, la.storage.bunnycdn.com, uk.storage.bunnycdn.com
//   BUNNY_API_KEY           account API key, for the purge
//   BUNNY_PULLZONE_ID       pull zone id, for the purge
// Usage: node ops/deploy-bunny.mjs [--dry-run]
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
if (dryRun) {
  for (const [p] of uploads.slice(0, 20)) console.log(`  upload ${p}`);
  for (const p of deletes.slice(0, 20)) console.log(`  delete ${p}`);
  process.exit(0);
}

await pool(uploads, 8, async ([path, buf]) => {
  await bunny('PUT', path, buf, { 'Content-Type': 'application/octet-stream', Checksum: sha256(buf) });
});
console.log(`uploaded ${uploads.length}`);

if (process.env.BUNNY_API_KEY && process.env.BUNNY_PULLZONE_ID) {
  const res = await fetch(`https://api.bunny.net/pullzone/${process.env.BUNNY_PULLZONE_ID}/purgeCache`, {
    method: 'POST',
    headers: { AccessKey: process.env.BUNNY_API_KEY },
  });
  if (!res.ok) throw new Error(`purge: ${res.status} ${await res.text()}`);
  console.log('purged the pull zone cache');
} else console.warn('BUNNY_API_KEY or BUNNY_PULLZONE_ID not set; skipped the cache purge');

await pool(deletes, 8, (path) => bunny('DELETE', path));
console.log(`deleted ${deletes.length}`);
