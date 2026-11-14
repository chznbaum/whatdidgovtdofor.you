// Fetches official, public-domain portraits for officials who have one: the Congress bioguide portrait, or a
// named Wikimedia Commons file (e.g. a presidential or cabinet portrait). Saves pipeline/portraits/photos/<id>.jpg
// and records each one in sources.json the moment it's saved (other agents share that file, so it re-reads and
// merges one entry at a time). Skips ids that already have an entry.
// Usage: node pipeline/portraits/fetch-official.mjs <id>[=File:Commons_file_name.jpg] ...
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';

const here = import.meta.dirname;
const root = path.resolve(here, '../..');
const manifest = path.join(here, 'sources.json');
const UA = { 'User-Agent': 'whatdidgovtdofor.you portrait pipeline (+https://whatdidgovtdofor.you; places@whatdidgovtdofor.you)' };

const size = (file) => {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file]).toString();
  return [Number(out.match(/pixelWidth: (\d+)/)[1]), Number(out.match(/pixelHeight: (\d+)/)[1])];
};

// Through merge.py, which locks the file and re-reads it, so an agent writing at the same moment loses nothing.
function record(id, entry) {
  try {
    execFileSync('python3', [path.join(here, 'merge.py'), manifest, id, JSON.stringify(entry)], { stdio: 'pipe' });
    return true;
  } catch (e) {
    if (e.status === 2) return false; // already recorded
    throw e;
  }
}

async function commons(file) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(file)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json`;
  const page = Object.values((await (await fetch(api, { headers: UA })).json()).query.pages)[0];
  const info = page.imageinfo?.[0];
  if (!info) throw new Error(`no such Commons file: ${file}`);
  const meta = info.extmetadata ?? {};
  return {
    image: info.thumburl ?? info.url,
    page: info.descriptionurl,
    author: (meta.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim(),
    license: meta.LicenseShortName?.value ?? 'Public domain',
  };
}

for (const arg of process.argv.slice(2)) {
  const [id, file] = arg.split('=');
  const existing = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, 'utf8')) : {};
  if (existing[id]) {
    console.log(`${id}: already recorded, skipped`);
    continue;
  }
  const o = parse(fs.readFileSync(path.join(root, 'src/content/officials', `${id}.yaml`), 'utf8'));
  let src;
  if (file) {
    const c = await commons(file);
    src = { tier: 'official', page: c.page, image: c.image, publisher: `${c.author || 'U.S. government'}, via Wikimedia Commons`, license: c.license };
  } else if (o.ids?.bioguide) {
    const b = o.ids.bioguide;
    src = { tier: 'official', page: `https://bioguide.congress.gov/search/bio/${b}`, image: `https://unitedstates.github.io/images/congress/450x550/${b}.jpg`, publisher: 'U.S. Congress', license: 'Public domain' };
  } else {
    console.log(`${id}: no bioguide id and no Commons file given, skipped`);
    continue;
  }
  const r = await fetch(src.image, { headers: UA });
  if (!r.ok || !/image/.test(r.headers.get('content-type') ?? '')) {
    console.log(`${id}: download failed (${r.status})`);
    continue;
  }
  const out = path.join(here, 'photos', `${id}.jpg`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = out + '.download';
  fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
  execFileSync('sips', ['-s', 'format', 'jpeg', tmp, '--out', out]);
  fs.rmSync(tmp);
  const [width, height] = size(out);
  record(id, { ...src, width, height, notes: `${o.name}, ${o.office}` });
  console.log(`${id}: ${width}x${height} from ${src.publisher}`);
}
