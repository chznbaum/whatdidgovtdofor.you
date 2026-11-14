// New Jersey bills that became law, from the database the Legislature rebuilds every morning for each two-year session
// (https://pub.njleg.gov/leg-databases/<year>data/DB<year>_TEXT.zip, linked from www.njleg.state.nj.us/downloads):
// comma-separated text files of every bill, its history, its sponsors and the members. A bill's history says when the
// Governor approved it and its chapter ("P.L.2026, c.43."), which is the key: chapter numbers restart every calendar
// year, so January's lame-duck laws carry the old year's numbers. The history is checked rather than the bill row's own
// chapter field, which is sometimes left blank. Joint resolutions (P.L.2026, JR-3) name days and commissions and are
// left out. Then one call per new law to the JSON the bill page itself loads, for a link to the law's text: the bill
// page renders in the browser, and the chapter-law list and law text lag by months. robots.txt allows everything.
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { parseCsv } from '../lib/csv.ts';
import type { Candidate, Feed } from './types.ts';
import { get, getJson, mdyDate, newest, sleep, truncate } from './util.ts';

const SITE = 'https://www.njleg.state.nj.us';
const FILES = 'https://pub.njleg.gov';
const HOUSE: Record<string, string> = { A: 'Assembly', S: 'Senate' };

// The files a session's database holds, by name, decoded from Windows-1252.
async function database(session: number, names: string[]): Promise<Record<string, Record<string, string>[]> | null> {
  let res: Response;
  try {
    res = await get(`${FILES}/leg-databases/${session}data/DB${session}_TEXT.zip`);
  } catch (e) {
    if (/^404\b/.test((e as Error).message)) return null; // no session yet
    throw e;
  }
  const dir = await mkdtemp(join(tmpdir(), 'nj-laws-'));
  try {
    const zip = join(dir, 'db.zip');
    await writeFile(zip, new Uint8Array(await res.arrayBuffer()));
    const out: Record<string, Record<string, string>[]> = {};
    for (const name of names) {
      const { stdout } = await promisify(execFile)('unzip', ['-p', zip, `${name}.TXT`], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
      out[name] = parseCsv(new TextDecoder('windows-1252').decode(stdout));
    }
    return out;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// "A  " + "3497" -> "A3497"
const billId = (r: Record<string, string>) => `${r.BillType.trim()}${r.BillNumber.trim()}`;

async function sessionLaws(session: number, since: string, known?: Set<string>): Promise<Candidate[] | null> {
  const db = await database(session, ['MAINBILL', 'BILLHIST', 'BILLSPON', 'ROSTER']);
  if (!db) return null;
  const bills = new Map(db.MAINBILL.map((r) => [billId(r), r]));
  const history = Map.groupBy(db.BILLHIST, billId);
  const sponsors = Map.groupBy(
    db.BILLSPON.filter((s) => s.Type === 'P' && s.Status === 'A').sort((a, b) => Number(a.Sequence) - Number(b.Sequence)),
    billId,
  );
  // Sponsors are listed as "Onyema, Chigozie U."; the roster gives the house, party and district.
  const members = db.ROSTER.map((m) => ({ key: `${m.LastName}, ${m.Firstname}`, ...m })).sort((a, b) => b.key.length - a.key.length);
  const member = (name: string) => members.find((m) => name === m.key || name.startsWith(`${m.key} `));

  const out: Candidate[] = [];
  for (const h of db.BILLHIST) {
    if (!/^APP\b/.test(h.Action)) continue; // APP, or APP W/LIV for a budget with items struck
    const m = h.Comment.match(/P\.L\.\s*(\d{4}),\s*c\.\s*(\d+)/);
    const date = mdyDate(h.DateAction);
    if (!m || !date || date < since) continue;
    const key = `nj-pl${m[1]}-c${m[2]}`;
    if (known?.has(key)) continue;
    const bill = billId(h);
    const r = bills.get(bill);
    if (!r) continue;
    // Each house's final vote: the last passage in it ("PA" passed Assembly, "PS" Senate) with its tally.
    const votes: Record<string, string> = {};
    for (const step of history.get(bill) ?? [])
      if (/^P[AS]\b/.test(step.Action) && /^\(\d+-\d+/.test(step.Comment)) votes[HOUSE[step.Action[1]]] = `${step.Comment.replace(/[()]/g, '')} on ${mdyDate(step.DateAction)}`;
    const primes = (sponsors.get(bill) ?? []).map((s) => {
      const who = member(s.Sponsor);
      if (!who) return s.Sponsor;
      const [last, first] = s.Sponsor.split(', ');
      return `${who.House === 'S' ? 'Sen.' : 'Asm.'} ${first} ${last} (${who.Party}-${who.District})`;
    });
    const effective = mdyDate(r.EffectiveDate);
    out.push({
      key,
      feed: 'nj-laws',
      level: 'state',
      jurisdiction: 'nj',
      kind: 'law',
      title: r.Synopsis.replace(/\*+$/, '').trim(),
      date,
      url: `${SITE}/bill-search/${session}/${bill}`,
      summary: truncate([r.EfDateNote, effective && `Effective ${effective}.`].filter(Boolean).join(' ')),
      extra: {
        bill: bill.replace(/^([A-Z]+)(\d+)$/, '$1 $2'),
        companion: r.IdenticalBillNumber.replace(/\s*\(.*\)$/, '') || undefined,
        session: `${session}–${session + 1} session`,
        chapter: `P.L.${m[1]}, c.${m[2]}`,
        governorAction: /LIV/.test(h.Action) ? 'approved with line-item vetoes' : 'approved',
        primeSponsors: primes.length ? primes : undefined,
        votes: Object.keys(votes).length ? votes : undefined,
        effective: effective ?? undefined,
      },
    });
  }
  return out;
}

// The law's text: the chapter law once it's posted, else the last version of the bill.
async function complete(c: Candidate) {
  await sleep(1_000);
  const bill = (c.extra!.bill as string).replace(' ', '');
  const session = c.url.match(/\/bill-search\/(\d{4})\//)![1];
  const docs: { Description: string; HTML_Link?: string }[] = await getJson(`${SITE}/api/billDetail/billText/${bill}/${session}`).catch(() => []);
  const text = docs.filter((d) => d.HTML_Link).findLast((d) => /Law$/.test(d.Description)) ?? docs.filter((d) => d.HTML_Link).findLast((d) => /Introduced|Reprint|Substitute/.test(d.Description));
  if (text) c.extra!.text = `${FILES}${text.HTML_Link}`;
}

export const njLaws: Feed = {
  id: 'nj-laws',
  description: "New Jersey bills approved by the Governor (the Legislature's daily database)",
  async fetch({ since, limit, known }) {
    const out: Candidate[] = [];
    // Sessions start in even years and run to mid-January two years on, so January of an even year still reads the
    // session before.
    const year = Number(since.slice(0, 4));
    const first = year % 2 === 0 && since < `${year}-02-01` ? year - 2 : year - (year % 2);
    for (let session = first; session <= new Date().getFullYear(); session += 2) out.push(...((await sessionLaws(session, since, known)) ?? []));
    const recent = newest(out, limit);
    for (const c of recent) await complete(c);
    return recent;
  },
};
