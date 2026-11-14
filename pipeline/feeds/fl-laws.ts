// Florida's chapter laws. Laws of Florida (laws.flrules.org, the Department of State) lists every chapter of a year on
// one page, grouped by session ("Regular Session", "Special Session E"), with its bill ("S 984", "H 5001-E"); chapter
// numbers run through the calendar year across sessions, so `fl-<year>-<n>` is unique. For each new chapter, the
// Senate's page for the bill (www.flsenate.gov/Session/Bill/<session>/<number>, both chambers' bills) has the prime
// sponsor (after any committees that substituted it), the summary, effective date, floor votes, the Governor's approval
// and the other chamber's companion. Both sites ask 10 seconds between requests, and the Senate's throttles anyway (a
// 429 with a five-minute Retry-After, sometimes after a page or two), so a run reads at most MAX bill pages, 30 seconds
// apart. Once the Senate says to slow down, the rest come from their chapter PDFs on Laws of Florida instead: the act's
// title, the Governor's approval and the effective date, without sponsors or votes, which the writer looks up.
import { coveredPlaceNames } from './places.ts';
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, get, getText, longDate, mdyDate, newest, pdfText, plainText, sleep, truncate } from './util.ts';

const LAWS = 'http://laws.flrules.org';
const SENATE = 'https://www.flsenate.gov';
const MAX = 40;
const PDFS = 300; // chapter PDFs a run reads once the Senate is throttling (a first backfill is about 250 a year)

const text = (html: string | undefined) => plainText(decodeEntities(html ?? '')).replace(/\s+/g, ' ').trim();

export type Chapter = { year: number; n: string; bill: string; title: string; session: string; pdf: string };

// Every chapter on a year's page, with the Senate's session code for its bill: "2026", or "2026E" for Special Session E.
function chapters(html: string, year: number): Chapter[] {
  const out: Chapter[] = [];
  for (const table of html.split(/<table class="views-table/).slice(1)) {
    const letter = table.match(/<caption>\s*Special Session ([A-Z])\s*<\/caption>/)?.[1] ?? '';
    for (const [, row] of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const pdf = row.match(/href="(\/\d{4}\/(\d+))"/);
      if (!pdf) continue;
      out.push({
        year,
        n: pdf[2],
        bill: text(row.match(/field-billno-value">([\s\S]*?)<\/td>/)?.[1]),
        title: text(row.match(/field-title">([\s\S]*?)<\/td>/)?.[1]),
        session: `${year}${letter}`,
        pdf: `${LAWS}${pdf[1]}`,
      });
    }
  }
  return out;
}

// Committees that substitute a bill are listed before its sponsors: "Appropriations; Governmental Oversight and
// Accountability; DiCeglie". A committee has a committee word or more than three words; a member is a surname, maybe
// with an initial ("Rodriguez (A)").
const COMMITTEE = /Committee|Subcommittee|Appropriations|Rules|Finance|Fiscal|Judiciary|Commerce|Oversight|Affairs|Education|Health|Budget|Policy|Regulat|Environment|Transportation|Banking|Ethics|Criminal|Agriculture|Military|Insurance|Infrastructure|Utilities|Services/;

// The Senate's page for a chapter's bill: sponsor line, summary, votes, approval and companion.
export function parseBill(html: string, c: Chapter, url: string): Candidate {
  const head = html.match(/<h2>[^<]*<\/h2>\s*<p>\s*([A-Z ]*?)\s*<span>by<\/span>([\s\S]*?)<\/p>\s*<p class="width80">([\s\S]*?)<\/p>/);
  const [named, co] = (head?.[2] ?? '').split(/<span>\(CO-INTRODUCERS\)\s*<\/span>/).map((part) =>
    part.split(/<span>;\s*<\/span>/).map((t) => text(t)).filter(Boolean),
  );
  const committees = (named ?? []).filter((s) => COMMITTEE.test(s) || s.split(' ').length > 3);
  const sponsors = (named ?? []).filter((s) => !committees.includes(s));
  const chamber = /^S/.test(c.bill) ? 'Sen.' : 'Rep.';
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => text(m[1]));
  // Each chamber's last passage vote: "CS passed as amended; YEAS 109, NAYS 0".
  const votes: Record<string, string> = {};
  for (const r of rows) {
    const m = r.match(/^(\d{1,2}\/\d{1,2}\/\d{4}) (Senate|House)\b.*?passed[^;]*; YEAS (\d+),? NAYS (\d+)/);
    if (m) votes[m[2]] = `${m[3]}-${m[4]} on ${mdyDate(m[1])}`;
  }
  const approved = rows.find((r) => /Approved by Governor|Became Law without Governor/.test(r));
  const companion = rows.find((r) => /^[HS] \d+\b.*\b(Identical|Similar|Compare)\b/.test(r));
  const effective = text(html.match(/Effective Date:\s*<\/span>\s*<span>([^<]*)/)?.[1]);
  return {
    key: `fl-${c.year}-${c.n}`,
    feed: 'fl-laws',
    level: 'state',
    jurisdiction: 'fl',
    kind: 'law',
    title: c.title,
    date: (approved && mdyDate(approved)) || `${c.year}-01-01`,
    url,
    summary: truncate([text(head?.[3]), effective && `Effective ${effective}.`].filter(Boolean).join(' ')),
    extra: {
      bill: c.bill,
      chapter: `Laws of Florida, Chapter ${c.year}-${c.n}`,
      session: c.session,
      billType: head?.[1]?.trim() || undefined,
      sponsors: sponsors.length ? sponsors.map((s) => `${chamber} ${s}`) : undefined,
      coIntroducers: co?.length ? co : undefined,
      committees: committees.length ? committees : undefined,
      companion: companion?.replace(/\s*Last Action:.*$/, ''),
      votes: Object.keys(votes).length ? votes : undefined,
      approved: approved ? mdyDate(approved) ?? undefined : undefined,
      effective: (effective && mdyDate(effective)) || effective || undefined,
      text: c.pdf,
    },
  };
}

async function law(c: Chapter): Promise<Candidate | 'throttled' | null> {
  const number = c.bill.match(/(\d+)/)?.[1];
  if (!number) return null;
  const url = `${SENATE}/Session/Bill/${c.session}/${number}`;
  try {
    return parseBill(await getText(url), c, url);
  } catch (e) {
    if (/^429\b/.test((e as Error).message)) return 'throttled';
    throw e;
  }
}

// A chapter from its Laws of Florida PDF: "An act relating to ...", "This act shall take effect July 1, 2026.",
// "Approved by the Governor May 22, 2026."
async function fromChapter(c: Chapter): Promise<Candidate | null> {
  const text = await pdfText(new Uint8Array(await (await get(c.pdf)).arrayBuffer())).catch(() => '');
  const flat = text.replace(/\s+/g, ' ');
  const approved = longDate(flat.match(/Approved by the Governor ([A-Z][a-z]+\.? \d{1,2}, \d{4})/)?.[1] ?? '');
  if (!approved) return null;
  // The act's description runs to "Be It Enacted" (it holds periods: "amending s. 112.1816, F.S.").
  const act = flat.match(/(An act (?:relating to|for the relief of) [\s\S]*?)(?:; providing (?:for )?an effective date)?\.\s+(?:Be It Enacted|WHEREAS)/)?.[1];
  const effective = flat.match(/(?:This act|Except as otherwise[^.]*?, this act) shall take effect ([^.]+)\./)?.[1];
  const number = c.bill.match(/(\d+)/)?.[1];
  // Claim bills relieve a person; local bills open with their city, county or district.
  const subject = (act ?? '').split(';')[0];
  const billType = /^An act for the relief of/i.test(subject)
    ? 'CLAIM BILL'
    : /\b(?:City|Town|Village) of [A-Z]|\b[A-Z][\w.'-]+(?: [A-Z][\w.'-]+)* Count(?:y|ies)\b/.test(subject)
      ? 'LOCAL BILL'
      : undefined;
  return {
    key: `fl-${c.year}-${c.n}`,
    feed: 'fl-laws',
    level: 'state',
    jurisdiction: 'fl',
    kind: 'law',
    title: c.title,
    date: approved,
    url: number ? `${SENATE}/Session/Bill/${c.session}/${number}` : c.pdf,
    summary: truncate([act, effective && `Takes effect ${effective}.`].filter(Boolean).join('. ')),
    extra: {
      bill: c.bill,
      chapter: `Laws of Florida, Chapter ${c.year}-${c.n}`,
      session: c.session,
      billType,
      approved,
      effective,
      text: c.pdf,
      note: "Sponsors and votes weren't read (the Senate's site was throttling); they're on the bill page.",
    },
  };
}

export const flLaws: Feed = {
  id: 'fl-laws',
  description: 'Florida chapter laws (Laws of Florida, with sponsors and votes from the Senate)',
  async fetch({ since, limit, known }) {
    const front = await getText(`${LAWS}/`);
    // The year selector names each year's page id; the front page is the newest year.
    const years = new Map([...front.matchAll(/<option value="(\d+)"[^>]*>\s*(\d{4})\s*<\/option>/g)].map((m) => [Number(m[2]), m[1]]));
    const newestYear = Math.max(...years.keys());
    const all: Chapter[] = [];
    for (let year = Number(since.slice(0, 4)); year <= newestYear; year++) {
      if (!years.has(year)) continue;
      if (year !== newestYear) await sleep(11_000);
      all.push(...chapters(year === newestYear ? front : await getText(`${LAWS}/node?field_list_year_nid=${years.get(year)}`), year));
    }
    const out: Candidate[] = [];
    const local = await coveredPlaceNames('fl');
    // Newest chapters first; the Senate's throttle caps a run, then the chapter PDFs take over.
    let senate = 0;
    let throttled = false;
    let pdfs = 0;
    for (const c of all.filter((c) => !known?.has(`fl-${c.year}-${c.n}`)).sort((a, b) => b.year - a.year || Number(b.n) - Number(a.n))) {
      let result: Candidate | 'throttled' | null = 'throttled';
      if (!throttled && senate < MAX) {
        await sleep(30_000);
        senate++;
        result = await law(c);
        if (result === 'throttled') {
          throttled = true;
          console.warn('[fl-laws] the Senate asked us to slow down; reading the rest from Laws of Florida');
        }
      }
      if (result === 'throttled') {
        if (pdfs++ >= PDFS) break;
        await sleep(11_000);
        result = await fromChapter(c);
      }
      // Local and claim bills ("City of Trenton, Gilchrist County", "Relief of ...") only for places we cover.
      if (result && /LOCAL|CLAIM/.test(String(result.extra?.billType)) && !local.test(`${result.title} ${result.summary ?? ''}`)) continue;
      // Chapter numbers follow the order laws are filed, so the first one older than `since` ends the run.
      if (result && result.date < since) break;
      if (result) out.push(result);
    }
    return newest(out, limit);
  },
};
