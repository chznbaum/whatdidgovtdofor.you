// Virginia bills that became law (have an Acts of Assembly chapter), from the LIS data files
// the General Assembly publishes per session: https://lis.blob.core.windows.net/lisfiles/<session>/BILLS.CSV
//   Session codes are <year><n>: n=1 regular session, n=2.. special sessions I, II, ...
//   Summaries.csv (~4 MB) is only fetched when there's something to summarize.
import { parseCsv } from '../lib/csv.ts';
import type { Candidate, Feed } from './types.ts';
import { getTextIfExists, mdyDate, newest, plainText, truncate } from './util.ts';

const FILES = 'https://lis.blob.core.windows.net/lisfiles';
const ROMAN = ['', 'I', 'II', 'III', 'IV'];

// "HB0001" / "HB 1" -> "HB1"
const billId = (s: string) =>
  s
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/^([A-Z]+)0*(\d+)$/, '$1$2');

function sessionName(code: string) {
  const n = Number(code.slice(4));
  return n === 1
    ? `${code.slice(0, 4)} Regular Session`
    : `${code.slice(0, 4)} Special Session ${ROMAN[n - 1] ?? n - 1}`;
}

// Latest summary per bill (rows run introduced -> substitute -> passed).
async function summaries(code: string): Promise<Map<string, string>> {
  const csv = await getTextIfExists(`${FILES}/${code}/Summaries.csv`);
  const out = new Map<string, string>();
  // The export turns "§" into "?"; put it back where a Code section follows.
  for (const r of csv ? parseCsv(csv) : []) {
    out.set(billId(r.SUM_BILNO), r.SUMMARY_TEXT.replace(/\?(\s+)(?=\d)/g, '§$1'));
  }
  return out;
}

async function sessionLaws(code: string, since: string): Promise<Candidate[] | null> {
  const csv = await getTextIfExists(`${FILES}/${code}/BILLS.CSV`);
  if (csv === null) return null;
  const year = code.slice(0, 4);
  const n = Number(code.slice(4));
  const laws: Candidate[] = [];
  for (const r of parseCsv(csv)) {
    const chapter = r.Chapter_id?.trim();
    if (!chapter) continue;
    const chapterDoc = [1, 2, 3, 4, 5, 6].find((i) => r[`Full_text_doc${i}`]?.trim() === chapter);
    const date =
      mdyDate(r.Last_governor_action_date) ?? (chapterDoc ? mdyDate(r[`Full_text_date${chapterDoc}`]) : null);
    if (!date || date < since) continue;
    const bill = billId(r.Bill_id);
    laws.push({
      key: `va-${year}${n === 1 ? '' : `s${n - 1}`}-${bill.toLowerCase()}`,
      feed: 'va-laws',
      level: 'state',
      jurisdiction: 'va',
      kind: 'law',
      title: r.Bill_description.trim(),
      date,
      url: `https://lis.virginia.gov/bill-details/${code}/${bill}`,
      extra: {
        bill: bill.replace(/^([A-Z]+)(\d+)$/, '$1 $2'),
        session: sessionName(code),
        chapter: `Acts of Assembly ${chapter.replace(/^CHAP0*/, 'Chapter ')}`,
        patron: r.Patron_name || undefined,
        governorAction: r.Last_governor_action || undefined,
        approved: r.Approved === 'Y',
        emergency: r.Emergency === 'Y' || undefined,
        introduced: mdyDate(r.Introduction_date) ?? undefined,
      },
    });
  }
  if (laws.length) {
    const text = await summaries(code);
    for (const c of laws) c.summary = truncate(plainText(text.get(billId(c.extra!.bill as string))));
  }
  return laws;
}

export const vaLaws: Feed = {
  id: 'va-laws',
  description: 'Virginia bills chaptered into law (LIS session data files)',
  async fetch({ since, limit }) {
    const out: Candidate[] = [];
    const last = new Date().getFullYear();
    for (let year = Number(since.slice(0, 4)); year <= last; year++) {
      for (let n = 1; n <= 9; n++) {
        const laws = await sessionLaws(`${year}${n}`, since);
        if (laws === null && n > 1) break; // special sessions are numbered consecutively
        out.push(...(laws ?? []));
      }
    }
    return newest(out, limit);
  },
};
