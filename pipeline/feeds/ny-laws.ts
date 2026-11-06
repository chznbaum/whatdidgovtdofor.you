// New York bills signed by the Governor, from the NY Senate Open Legislation API v3
// (https://legislation.nysenate.gov/static/docs/html/). Needs a free key: NYSENATE_API_KEY.
//   Sessions are two years and named for the odd year (2025 = 2025-26).
import type { Candidate, Feed } from './types.ts';
import { getJson, newest, today, truncate } from './util.ts';

const API = 'https://legislation.nysenate.gov/api/3';

const sessionFor = (date: string) => {
  const year = Number(date.slice(0, 4));
  return year % 2 ? year : year - 1;
};

export const nyLaws: Feed = {
  id: 'ny-laws',
  description: 'New York bills signed by the Governor (NY Senate Open Legislation API)',
  needsKey: 'NYSENATE_API_KEY',
  async fetch({ since, limit }) {
    const key = process.env.NYSENATE_API_KEY;
    if (!key) return [];
    const out: Candidate[] = [];

    for (let session = sessionFor(since); session <= sessionFor(today()); session += 2) {
      const term = `status.statusType:SIGNED_BY_GOV AND billType.resolution:false AND status.actionDate:[${since} TO *]`;
      let offset = 1;
      while (true) {
        const params = new URLSearchParams({
          term,
          sort: 'status.actionDate:DESC',
          limit: '1000',
          offset: String(offset),
          key,
        });
        const page: any = await getJson(`${API}/bills/${session}/search?${params}`);
        if (page.success === false) throw new Error(page.message ?? 'Open Legislation error');
        for (const { result: bill } of page.result?.items ?? []) {
          if (!bill?.basePrintNo) continue;
          const sponsor = bill.sponsor?.member;
          out.push({
            key: `ny-${bill.session}-${bill.basePrintNo.toLowerCase()}`,
            feed: 'ny-laws',
            level: 'state',
            jurisdiction: 'ny',
            kind: 'law',
            title: bill.title,
            date: bill.status?.actionDate,
            url: `https://www.nysenate.gov/legislation/bills/${bill.session}/${bill.basePrintNo}`,
            summary: truncate(bill.summary),
            extra: {
              bill: bill.printNo ?? bill.basePrintNo,
              session: `${bill.session}-${bill.session + 1}`,
              chamber: bill.billType?.chamber,
              sponsor: sponsor ? { name: sponsor.fullName, district: sponsor.districtCode } : undefined,
              budget: bill.sponsor?.budget || undefined,
              program: bill.programInfo?.name,
              status: bill.status?.statusDesc,
            },
          });
        }
        if (!page.offsetEnd || page.offsetEnd >= (page.total ?? 0)) break;
        offset = page.offsetEnd + 1;
      }
    }
    return newest(
      out.filter((c) => c.date >= since),
      limit,
    );
  },
};
