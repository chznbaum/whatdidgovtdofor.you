// Minnesota bills that became law, from the Revisor of Statutes, which publishes no feed or data file: each session's
// table of session-law chapters (https://www.revisor.mn.gov/laws/<year>/<n>/, n=0 regular, 1.. special sessions),
// then for each new chapter its bill page (description, chief authors in both chambers, the governor's action, the
// effective date) and its chapter page (the act's title and when the governor signed it). Regular-session chapters run
// on across a two-year Legislature; special sessions start at 1, so a law is keyed by year, session and chapter.
// robots.txt allows these pages (it disallows only the bill-status search results).
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, getTextIfExists, longDate, newest, plainText, sleep, truncate } from './util.ts';

const SITE = 'https://www.revisor.mn.gov';
const ORDINAL = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth'];

const text = (html: string | undefined) => plainText(decodeEntities(html ?? '')).trim();
// "05/18/26" -> "2026-05-18"
const shortDate = (s: string | undefined) => {
  const m = s?.match(/(\d{2})\/(\d{2})\/(\d{2})\b/);
  return m ? `20${m[3]}-${m[1]}-${m[2]}` : null;
};

// The authors listed under a heading on a bill page: surnames, chief author first.
function authors(html: string, heading: RegExp): string[] {
  const at = html.search(heading);
  if (at < 0) return [];
  const list = html.slice(at).match(/<ul[^>]*>([\s\S]*?)<\/ul>/)?.[1] ?? '';
  return [...list.matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map((m) => decodeEntities(m[1]).trim());
}

async function session(year: number, n: number, since: string, known?: Set<string>): Promise<Candidate[] | null> {
  const floor = new Date(Date.parse(since) - 30 * 864e5).toISOString().slice(0, 10);
  const table = await getTextIfExists(`${SITE}/laws/${year}/${n}/`);
  if (table === null) return null;
  const name = n ? `${year} ${ORDINAL[n] ?? `${n}th`} Special Session` : `${year} Regular Session`;
  const out: Candidate[] = [];
  const body = table.slice(table.search(/id="session_table"/));
  for (const [, row] of body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    const chapter = cells[0]?.match(/Chapter(?:&nbsp;|\s)+(\d+)/)?.[1];
    const billPath = cells[1]?.match(/href="([^"]+)"/)?.[1];
    // The table's date is when the bill reached the governor, who signs within days (14 at most after session ends);
    // the signing date, from the chapter page, is the one checked against `since`.
    const presented = longDate(text(cells[2]));
    if (!chapter || !billPath || !presented) continue;
    const key = `mn-${year}${n ? `s${n}` : ''}-ch${chapter}`;
    if (known?.has(key) || presented < floor) continue;
    out.push({
      key,
      feed: 'mn-laws',
      level: 'state',
      jurisdiction: 'mn',
      kind: 'law',
      title: text(cells[1]),
      date: presented,
      url: `${SITE}/laws/${year}/${n}/Session+Law/Chapter/${chapter}/`,
      extra: {
        bill: text(cells[1]).replace(/^([A-Z]+)(\d+)$/, '$1 $2'),
        session: name,
        chapter: n ? `Laws ${year}, ${ORDINAL[n]} Special Session chapter ${chapter}` : `Laws ${year}, chapter ${chapter}`,
        billUrl: new URL(billPath, SITE).href,
        vetoed: text(cells[3]) || undefined,
      },
    });
  }
  return out;
}

// The bill and chapter pages fill in what the table lacks; one request a second.
async function complete(c: Candidate) {
  await sleep(1_000);
  const bill = (await getTextIfExists(c.extra!.billUrl as string)) ?? '';
  await sleep(1_000);
  const chapter = (await getTextIfExists(c.url)) ?? '';
  const description = text(bill.match(/<h2>\s*Description\s*<\/h2>\s*<p>([\s\S]*?)<\/p>/)?.[1]);
  const actTitle = text(chapter.match(/<div id="btitle">([\s\S]*?)<\/div>/)?.[1]);
  const signed = longDate(chapter.match(/Signed by the governor ([^<]+)/)?.[1] ?? '') ?? shortDate(bill.match(/Governor's action[^<]*?(\d{2}\/\d{2}\/\d{2})/)?.[1]);
  // The bill's own chamber lists its authors first; the companion chamber's follow under "House/Senate Authors".
  const own = authors(bill, /<h2>\s*Authors/);
  const other = authors(bill, /<h3[^>]*>\s*(House|Senate) Authors/);
  const house = /^HF/.test(c.title) ? own : other;
  const senate = /^SF/.test(c.title) ? own : other;
  const effective = text(bill.match(/Effective date\s*([^<]+)/)?.[1]);
  if (description) c.title = description;
  if (signed) c.date = signed;
  c.summary = truncate([actTitle, effective && `Effective ${effective}.`].filter(Boolean).join(' '));
  Object.assign(c.extra!, {
    chiefAuthors: [senate[0] && `Sen. ${senate[0]}`, house[0] && `Rep. ${house[0]}`].filter(Boolean).join(' and ') || undefined,
    senateAuthors: senate.length ? senate : undefined,
    houseAuthors: house.length ? house : undefined,
    effective: effective || undefined,
  });
}

export const mnLaws: Feed = {
  id: 'mn-laws',
  description: 'Minnesota bills that became law (Revisor of Statutes session-law tables and bill pages)',
  async fetch({ since, limit, known }) {
    const out: Candidate[] = [];
    for (let year = Number(since.slice(0, 4)); year <= new Date().getFullYear(); year++) {
      for (let n = 0; n <= 9; n++) {
        const laws = await session(year, n, since, known);
        if (laws === null) break; // special sessions are numbered consecutively; no regular session yet means none
        out.push(...laws);
      }
    }
    const recent = newest(out, limit);
    for (const c of recent) await complete(c);
    return recent;
  },
};
