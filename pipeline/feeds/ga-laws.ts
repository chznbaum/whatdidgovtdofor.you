// Georgia bills that became law. The Governor's pages list each year's signed bills (gov.georgia.gov/executive-action/
// legislation/signed-legislation/<year>, and <year>-special-session), with no dates, Act numbers or sponsors. For each
// bill not seen before, the General Assembly's published SOAP web services (webservices.legis.ga.gov, plain HTTP only;
// the owner approved its read-only POSTs on Nov. 14, 2026) give the rest: the session's index maps "HB 1075" to its id,
// and the bill's detail has its Act number, signing and effective dates, authors with member ids (the first author of
// the chamber it started in, and the other chamber's carrier, Georgia's "sponsor"), and every floor vote. Bill numbers
// repeat each two-year session, so a law is keyed by session and bill. Out of session the job reads two or three pages
// and posts nothing. About 40% of Georgia's laws are local acts for one city or county; only those for a place we cover
// are kept. The site's own JSON API needs a token its script derives from an obscured key, so it isn't used.
import { join } from 'node:path';
import { CONTENT, idFromPath, listFiles, readYaml } from '../lib/content.ts';
import type { Candidate, Feed } from './types.ts';
import { decodeEntities, get, getTextIfExists, newest, plainText, sleep, truncate } from './util.ts';

const GOVERNOR = 'https://gov.georgia.gov/executive-action/legislation/signed-legislation';
const SOAP = 'http://webservices.legis.ga.gov';
const NS = 'http://www.legis.ga.gov/2009/01/01/services/';

// One SOAP call; the reply with namespace prefixes dropped, so tags read <Caption>, <Sponsorship>.
async function soap(service: string, action: string, operation: string, body = ''): Promise<string> {
  const envelope = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><${operation} xmlns="${NS}">${body}</${operation}></s:Body></s:Envelope>`;
  const res = await get(`${SOAP}/${service}/Service.svc`, {
    method: 'POST',
    headers: { 'content-type': 'text/xml; charset=utf-8', soapaction: `"${action}"` },
    body: envelope,
  });
  return (await res.text()).replace(/<(\/?)\w+:/g, '<$1').replace(/\s+xmlns(?::\w+)?="[^"]*"/g, '');
}

const tag = (xml: string, name: string) => decodeEntities(xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? '').trim();
const all = (xml: string, name: string) => [...xml.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g'))].map((m) => m[1]);

type Session = { id: string; name: string; library: string };

async function sessions(): Promise<Session[]> {
  const xml = await soap('Session', 'GetSessions', 'GetSessions');
  return all(xml, 'Session').map((s) => ({ id: tag(s, 'Id'), name: tag(s, 'Description'), library: tag(s, 'Library') }));
}

// The Governor's list for a year (or its special session): "HB 1020", "SB 3EX", ... across its pages.
async function signed(path: string): Promise<string[]> {
  const first = await getTextIfExists(`${GOVERNOR}/${path}`);
  if (first === null) return [];
  const pages = [first];
  const more = [...new Set([...first.matchAll(/href="(\?[^"]*\bpage=\d+[^"]*)"/g)].map((m) => decodeEntities(m[1])))];
  for (const query of more) {
    await sleep(1_000);
    pages.push((await getTextIfExists(`${GOVERNOR}/${path}${query}`)) ?? '');
  }
  return [...new Set(pages.flatMap((html) => [...html.matchAll(/data-text="([^"]+)"/g)].map((m) => m[1].toUpperCase().replace(/\s+/g, ' ').trim())))];
}

// Names of the Georgia places we cover, for keeping the local acts that are theirs ("Atlanta, City of; ...").
async function coveredNames(): Promise<RegExp> {
  const places = new Map<string, any>();
  for (const file of await listFiles(join(CONTENT, 'places'), '.yaml')) places.set(idFromPath(file), await readYaml(file));
  const inGeorgia = (id: string): boolean => id === 'ga' || (!!places.get(id)?.parent && inGeorgia(places.get(id).parent));
  const names = [...places].filter(([id, p]) => id !== 'ga' && inGeorgia(id) && p.kind !== 'region').map(([, p]) => p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^(?:${names.join('|') || '$^'})(?:, City of)?;`, 'i');
}

const member = (description: string) => {
  // "Chastain, Johnny 7th" -> "Johnny Chastain (7th)"
  const m = description.match(/^(.+?),\s*(.+?)\s+(\d+(?:st|nd|rd|th))$/);
  return m ? `${m[2]} ${m[1]} (${m[3]})` : description.trim();
};

async function law(id: string, session: Session, local: RegExp): Promise<Candidate | null> {
  const xml = await soap('Legislation', 'http://www.legis.ga.gov/2009/01/01/services/LegislationSearch/GetLegislationDetail', 'GetLegislationDetail', `<LegislationId>${id}</LegislationId>`);
  const act = tag(xml, 'ActVetoNumber');
  const statuses = all(xml, 'StatusListing').map((s) => ({ code: tag(s, 'Code'), date: tag(s, 'Date').slice(0, 10), name: tag(s, 'Description') }));
  const enacted = statuses.find((s) => /^Act\b/.test(s.name));
  if (!act || /^V/i.test(act) || !enacted) return null; // vetoed, or not recorded yet
  const caption = tag(xml, 'Caption');
  if (tag(xml, 'LegislationType') === 'LOC' && !local.test(caption)) return null;
  const bill = `${tag(xml, 'DocumentType')} ${tag(xml, 'Number')}${tag(xml, 'Suffix')}`;
  // Authors are Sponsorships; the other chamber's carrier is the detail's single Sponsor.
  const authors = [...all(xml, 'Sponsorship'), ...all(xml, 'Sponsor')]
    .map((s) => ({ who: member(tag(s, 'MemberDescription')), id: tag(s, 'MemberId'), seq: Number(tag(s, 'Sequence')), type: tag(s, 'Type') }))
    .sort((a, b) => a.seq - b.seq);
  const title = (type: string) => (type.startsWith('House') ? 'Rep.' : 'Sen.');
  const firstAuthor = authors.find((a) => /Author$/.test(a.type));
  const carrier = authors.find((a) => /Sponsor$/.test(a.type));
  // Each chamber's final vote: its last recorded vote on the bill.
  const votes: Record<string, string> = {};
  for (const v of all(xml, 'VoteListing'))
    votes[tag(v, 'Branch')] = `${tag(v, 'Yeas')}-${tag(v, 'Nays')} on ${tag(v, 'Date').slice(0, 10)} (${tag(v, 'Caption').toLowerCase()})`;
  const effective = statuses.find((s) => s.code === 'EFF')?.date;
  return {
    key: `ga-${session.library.toLowerCase()}-${bill.replace(' ', '').toLowerCase()}`,
    feed: 'ga-laws',
    level: 'state',
    jurisdiction: 'ga',
    kind: 'law',
    title: caption,
    date: enacted.date,
    url: `https://www.legis.ga.gov/legislation/${id}`,
    summary: truncate([plainText(tag(xml, 'Summary')), effective && `Effective ${effective}.`].filter(Boolean).join(' ')),
    extra: {
      bill,
      session: session.name,
      act: `Act ${act}`,
      local: tag(xml, 'LegislationType') === 'LOC' || undefined,
      firstAuthor: firstAuthor && `${title(firstAuthor.type)} ${firstAuthor.who}`,
      authors: authors.filter((a) => /Author$/.test(a.type)).map((a) => `${title(a.type)} ${a.who}`),
      carrier: carrier && `${title(carrier.type)} ${carrier.who}`,
      votes: Object.keys(votes).length ? votes : undefined,
      effective,
    },
  };
}

export const gaLaws: Feed = {
  id: 'ga-laws',
  description: "Georgia bills signed into law (the Governor's lists and the General Assembly's SOAP web services)",
  async fetch({ since, limit, known }) {
    const list = await sessions();
    const local = await coveredNames();
    const out: Candidate[] = [];
    for (let year = Number(since.slice(0, 4)); year <= new Date().getFullYear(); year++) {
      for (const [path, session] of [
        [`${year}`, list.find((s) => !/EX$/.test(s.library) && s.library.includes(String(year)))],
        [`${year}-special-session`, list.find((s) => s.library === `${year}EX`)],
      ] as const) {
        if (!session) continue;
        await sleep(1_000);
        const bills = (await signed(path)).filter((b) => !known?.has(`ga-${session.library.toLowerCase()}-${b.replace(' ', '').toLowerCase()}`));
        if (!bills.length) continue;
        // The session's index maps bill numbers to ids: one call, about 1 MB.
        await sleep(1_000);
        const index = await soap('Legislation', 'http://www.legis.ga.gov/2009/01/01/services/LegislationSearch/GetLegislationForSession', 'GetLegislationForSession', `<SessionId>${session.id}</SessionId>`);
        const ids = new Map(all(index, 'LegislationIndex').map((l) => [tag(l, 'Description').toUpperCase(), tag(l, 'Id')]));
        for (const b of bills) {
          const id = ids.get(b);
          if (!id) continue;
          await sleep(1_000);
          const c = await law(id, session, local);
          if (c && c.date >= since) out.push(c);
        }
      }
    }
    return newest(out, limit);
  },
};
