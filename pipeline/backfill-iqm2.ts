// One-off backfill of a governing body's older meetings from a Granicus IQM2 portal (<client>.iqm2.com), for places
// that have since moved to another system (Goochland moved to CivicClerk on July 1, 2026). Fetches with the pipeline's
// own User-Agent, one page at a time, and only after checking robots.txt.
// Each meeting's Summary Minutes (a PDF listing every item with its RESULT, MOVER, SECONDER and roll call) becomes a
// recap candidate, which the next triage splits into actions.
//   node pipeline/backfill-iqm2.ts backfill --site https://goochlandcountyva.iqm2.com --place goochland --before 2026-07-01 [--since 2019-01-01] [--board "Board of Supervisors"]
//   node pipeline/backfill-iqm2.ts probe --site https://goochlandcountyva.iqm2.com --path /Citizens/Default.aspx
import './lib/env.ts';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs, promisify } from 'node:util';
import { saveCandidates } from './feeds/index.ts';
import { decodeEntities, get, getTextIfExists, longDate, truncate } from './feeds/util.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    site: { type: 'string' },
    path: { type: 'string', default: '/Citizens/Default.aspx' },
    place: { type: 'string' },
    board: { type: 'string', default: 'Board of Supervisors' },
    since: { type: 'string', default: '2019-01-01' },
    before: { type: 'string' },
  },
});
const site = URL.parse(values.site ?? '');
if (!site || !/^[a-z0-9-]+\.iqm2\.com$/.test(site.hostname)) throw new Error('--site must be an https://<client>.iqm2.com portal');

const pause = () => new Promise((r) => setTimeout(r, 1000));

// Disallowed path prefixes for every user agent ("User-agent: *").
async function disallowed(): Promise<string[]> {
  const robots = (await getTextIfExists(`${site.origin}/robots.txt`)) ?? '';
  const out: string[] = [];
  let applies = false;
  for (const line of robots.split(/\r?\n/)) {
    const [field, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (/^user-agent$/i.test(field.trim())) applies = value === '*';
    else if (applies && /^disallow$/i.test(field.trim()) && value) out.push(value);
  }
  return out;
}

const blocked = await disallowed();
const allowed = (path: string) => !blocked.some((prefix) => path.startsWith(prefix));
console.log(`robots.txt disallows for *: ${blocked.length ? blocked.join(', ') : 'nothing'}`);

// Raw bytes, so PDFs survive.
async function fetchBytes(path: string): Promise<Buffer> {
  if (!allowed(path)) throw new Error(`robots.txt disallows ${path}`);
  await pause();
  return Buffer.from(await (await get(`${site.origin}${path}`)).arrayBuffer());
}

const mdy = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}/${iso.slice(0, 4)}`;

// The body's meetings in [since, before), from the calendar, half a year per page.
async function meetings(since: string, before: string) {
  const out: { id: string; date: string; type: string }[] = [];
  for (let year = Number(since.slice(0, 4)); year <= Number(before.slice(0, 4)); year++) {
    for (const [from, to] of [[`${year}-01-01`, `${year}-06-30`], [`${year}-07-01`, `${year}-12-31`]]) {
      if (to < since || from >= before) continue;
      const html = (await fetchBytes(`/Citizens/Calendar.aspx?From=${mdy(from)}&To=${mdy(to)}`)).toString('utf8');
      for (const m of html.matchAll(/Detail_Meeting\.aspx\?ID=(\d+)" title="([^"]*)"\s*>([^<]+)<\/a>/g)) {
        const info = decodeEntities(m[2]);
        const date = longDate(m[3]);
        const board = info.match(/Board:\s*([^\r\n]+)/)?.[1].trim();
        const type = info.match(/Type:\s*([^\r\n]+)/)?.[1].trim() ?? 'Meeting';
        if (date && board === values.board && date >= since && date < before) out.push({ id: m[1], date, type });
      }
    }
  }
  return out;
}

async function pdfText(bytes: Buffer): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'iqm2-'));
  try {
    await writeFile(join(dir, 'minutes.pdf'), bytes);
    const { stdout } = await promisify(execFile)('pdftotext', ['-layout', join(dir, 'minutes.pdf'), '-'], { maxBuffer: 64 * 1024 * 1024 });
    return stdout;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

switch (positionals[0]) {
  case 'backfill': {
    const place = values.place;
    if (!place || !values.before) throw new Error('backfill needs --place and --before');
    const list = await meetings(values.since!, values.before);
    console.log(`${list.length} ${values.board} meetings from ${values.since} to ${values.before}`);
    let saved = 0;
    for (const m of list) {
      const detail = `/Citizens/Detail_Meeting.aspx?ID=${m.id}`;
      const html = (await fetchBytes(detail)).toString('utf8');
      // The meeting's own minutes are the "Summary Minutes" download; links in the agenda ("Minutes of Feb 25, 2026")
      // are earlier meetings' minutes up for approval.
      const file = html.match(/FileOpen\.aspx\?Type=15&(?:amp;)?ID=(\d+)[^>]*>\s*Summary Minutes\s*</)?.[1];
      if (!file) continue; // no minutes posted
      const text = (await pdfText(await fetchBytes(`/Citizens/FileOpen.aspx?Type=15&ID=${file}&Inline=True`))).trim();
      if (!text) continue; // a scan, not text
      // Saved one meeting at a time, so an interrupted run keeps what it fetched.
      await saveCandidates([
        {
          key: `${place}-council-iqm2-${m.id}`,
          feed: `${place}-council`,
          level: 'local',
          jurisdiction: place,
          kind: 'recap',
          title: `${values.board} ${m.type} minutes, ${m.date}`,
          date: m.date,
          url: `${site.origin}${detail}`,
          summary: truncate(text.replace(/\s+/g, ' ')),
          extra: { text },
        },
      ]);
      saved++;
      console.log(`  ${m.date} ${m.type}: ${Math.round(text.length / 1000)}k characters`);
    }
    console.log(`${saved} meetings with minutes saved; the next triage splits them into actions`);
    break;
  }
  case 'probe': {
    const bytes = await fetchBytes(values.path!);
    const ext = bytes.subarray(0, 5).toString() === '%PDF-' ? 'pdf' : 'html';
    const file = join(tmpdir(), `iqm2-${site.hostname}-${values.path!.replace(/[^a-z0-9]+/gi, '-')}.${ext}`);
    await writeFile(file, bytes);
    console.log(`${bytes.length} bytes from ${values.path} saved to ${file}`);
    break;
  }
  default:
    throw new Error('usage: node pipeline/backfill-iqm2.ts <backfill|probe> --site https://<client>.iqm2.com …');
}
