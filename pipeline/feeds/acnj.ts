// Atlantic City Council, from the JSON the city's own meetings page loads (www.acnj.gov/api/data/GetMeetings: every
// body's meetings by year, with their PDFs). A week or two after a meeting the clerk posts its "minutes": a scanned book
// that opens with the minutes and the FINAL agenda, which marks each resolution "P" (passed) and gives each ordinance
// its council sponsors and outcome ("KURTZ  PASSED  47  ORDINANCE IMPOSING ..."), then holds the full text of every
// adopted item, a page or more each. The opening pages, read with OCR up to the first full text, are a recap, split
// into actions before triage. (The agenda posted before a meeting has no outcomes, and was replaced by the final one
// only once in 2026.) robots.txt disallows only /ads_admin/.
import type { Candidate, Feed } from './types.ts';
import { get, getJson, newest, pdfText, sleep, truncate } from './util.ts';

export type AcnjOptions = { id: string; description: string; origin: string; body: string; place: string };

// The final agenda marks outcomes.
const OUTCOME = /\bPASSED\b|^\s*P\s+\d+\s*[-–]/m;
// The appendix starts with each adopted resolution or ordinance on its own page.
const APPENDIX = /^\s*(?:Resolution|Ordinance) of the City of Atlantic City\b/im;

type Meeting = { Meeting_ID: number; Meeting_Title: string; Meeting_DateTime: string; Meeting_IsCanceled: boolean; Meeting_MinutesPDF: string | null };

export function acnjFeed(o: AcnjOptions): Feed {
  return {
    id: o.id,
    description: o.description,
    lookback: 60,
    async fetch({ since, limit, known }) {
      const years: { LabelYear: string; MeetingType: { LabelMeetingType: string; Meetings: Meeting[] }[] }[] = await getJson(`${o.origin}/api/data/GetMeetings`);
      const out: Candidate[] = [];
      for (const year of years)
        for (const type of year.MeetingType) {
          if (type.LabelMeetingType !== o.body) continue;
          for (const m of type.Meetings) {
            const date = m.Meeting_DateTime.slice(0, 10);
            const key = `${o.id}-${m.Meeting_ID}`;
            if (m.Meeting_IsCanceled || !m.Meeting_MinutesPDF || date < since || known?.has(key)) continue;
            out.push({
              key,
              feed: o.id,
              level: 'local',
              jurisdiction: o.place,
              kind: 'recap',
              title: `${m.Meeting_Title} minutes and final agenda, ${date}`,
              date,
              url: new URL(m.Meeting_MinutesPDF, o.origin).href,
            });
          }
        }
      const recent = newest(out, limit);
      for (const c of recent) {
        await sleep(1_000);
        let text = '';
        try {
          text = (await pdfText(new Uint8Array(await (await get(c.url)).arrayBuffer()), { ocrPages: 40, until: APPENDIX })).trim();
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('pdftotext not found (brew install poppler)');
          console.warn(`[${o.id}] skipped ${c.url}: ${(e as Error).message}`);
        }
        if (OUTCOME.test(text)) Object.assign(c, { summary: truncate(text.replace(/\s+/g, ' ')), extra: { text } });
        else console.warn(`[${o.id}] no outcomes found in ${c.url}`);
      }
      return recent.filter((c) => c.extra?.text);
    },
  };
}
