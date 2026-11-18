// Minneapolis's Legislative Information Management System (LIMS, built by DataNet Systems) through its API, which
// needs a key sent as a Bearer token. The rest of lims.minneapolismn.gov sits behind a Cloudflare check that we never
// try to pass; the API's /api/v1/ paths answer scripts.
//
// One candidate per file and council meeting, for the official acts ("2026-040", "2026R-198", "2026A-0459") the council
// adopted there that cleared the mayor. search/FileItemSearch returns a year's file items (by the file's year) with the
// author, every committee and council action with its roll call, and the mayor's action; filtered by status, it
// returns only what's in force now.
// Status, not history, decides that: LIMS logs every mayoral action as "Approved and Signed by Mayor", a veto and an
// act the mayor let pass unsigned included, and only a later council vote on the veto shows one in the history.
//
// Each candidate carries the record as text (extra.record), since the writer and verifier can't open LIMS's pages.
import type { Candidate, Feed } from './types.ts';
import { get, localDate, newest, plainText, sleep, truncate } from './util.ts';

export type LimsOptions = {
  id: string;
  description: string;
  origin: string; // https://lims.minneapolismn.gov
  place: string;
  keyEnv: string; // env var holding the API key
  skip?: RegExp; // subcategories left out
};

// Routine business the council passes by the hundred: license batches (1,039 rows in 2026 to Nov. 18), appointments,
// honorary resolutions, staff travel paid by others, block-event permits. Triage makes the real call on the rest.
const SKIP = /business license|appointment|honorary|award|commendation|donation|gift acceptance|membership|^permit$|scheduling/i;
// Statuses of acts in force: "Approved", "Approved, does not require Mayor's signature", "Deemed Approved" (the
// mayor let it pass unsigned), "Veto Overridden".
const IN_FORCE = /^(?:approved\b|deemed approved|veto overridden)/i;
// The council's final action, for an act it passed (not "Denied", which can carry an act number and the mayor's
// approval too).
const ADOPTED = /^(?:adopted|granted|veto overridden)/i;
const TYPES = new Set(['Ordinance', 'Resolution', 'Action']);
const LIMIT = 4000; // FileItemSearch returns at most this many rows
const PAUSE = 1000; // ms between requests

type Vote = { MemberName: string; Vote: string };
type Step = {
  ActionDate: string; // "5/21/2026"
  CommitteeName: string | null;
  CommitteeCode: string | null; // "Council" for the City Council
  Action: string | null;
  VotingInformation: { VoteResult: string; VoteType: string; Votes: Vote[] | null } | null;
};
type Row = {
  FileNumber: string;
  URL: string;
  ActNumber: string;
  FileType: string;
  SubCategory: string;
  FileSubject: string;
  ItemTitle: string;
  AuthorId: number | null;
  Author: string | null;
  AgendaPublishedDate: string | null;
  LegislativeHistory: Step[] | null;
};

// "5/21/2026" -> "2026-05-21"
const isoDate = (s: string) => {
  const [m, d, y] = s.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};
const squash = (s: string | null | undefined) => plainText(s).replace(/\s+/g, ' ').trim();

function tally(step: Step) {
  const v = step.VotingInformation;
  if (!v) return undefined;
  const who = (vote: string) => (v.Votes ?? []).filter((x) => x.Vote === vote).map((x) => x.MemberName);
  const [aye, nay, abstain, absent] = ['Aye', 'Nay', 'Abstain', 'Absent'].map(who);
  const rollCall = Boolean(v.Votes?.length);
  return {
    result: v.VoteResult,
    type: v.VoteType,
    tally: rollCall ? `${aye.length}-${nay.length}` : undefined,
    aye: rollCall ? aye : undefined,
    nay: nay.length ? nay : undefined,
    abstain: abstain.length ? abstain : undefined,
    absent: absent.length ? absent : undefined,
  };
}

const isMayor = (s: Step) => !s.CommitteeCode && /mayor/i.test(s.Action ?? '');

// What the mayor did, from the act's status, since the history's label is the same whatever it was.
function mayorAction(status: string): string | undefined {
  if (/^veto overridden/i.test(status)) return 'Vetoed (the council overrode the veto)';
  // The signed act's cover says so: "Mayor did not sign this action within the time specified by City Charter. This
  // action is valid and effective as if approved by the Mayor."
  if (/^deemed approved/i.test(status)) return 'Did not sign it within the time the City Charter allows, so it took effect as if approved';
  if (/^approved$/i.test(status)) return 'Approved and signed';
  return undefined; // doesn't require the mayor's signature
}

function stepLine(s: Step, mayor?: string): string {
  const who = s.CommitteeName ?? (isMayor(s) ? 'Mayor' : '');
  const v = s.VotingInformation;
  const action = isMayor(s) && mayor ? `${mayor} (LIMS logs it as "${squash(s.Action)}")` : squash(s.Action);
  let line = `- ${s.ActionDate}${who ? ` ${who}` : ''}: ${action}`;
  if (v) {
    const t = tally(s)!;
    line += ` (${v.VoteType}, ${v.VoteResult}${t.tally ? `, ${t.tally}` : ''})`;
    for (const [label, names] of [['Aye', t.aye], ['Nay', t.nay], ['Abstain', t.abstain], ['Absent', t.absent]] as const)
      if (names?.length) line += `. ${label}: ${names.join(', ')}`;
  }
  return line;
}

export function limsFeed(o: LimsOptions): Feed {
  const skip = o.skip ?? SKIP;
  const api = `${o.origin.replace(/\/$/, '')}/api/v1`;

  return {
    id: o.id,
    description: o.description,
    needsKey: o.keyEnv,
    // An act shows up once the mayor signs it (up to a week after the vote) or lets it stand; a veto and its override
    // take a few more weeks. The whole year comes down either way, so looking back costs nothing.
    lookback: 45,
    async fetch({ since, limit }) {
      const key = process.env[o.keyEnv];
      if (!key) return [];
      const headers = { authorization: `Bearer ${key}`, accept: 'application/json' };
      const call = async (path: string, body?: object): Promise<any> => {
        const res = await get(`${api}/${path}`, {
          method: body ? 'POST' : 'GET',
          headers: body ? { ...headers, 'content-type': 'application/json' } : headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        await sleep(PAUSE);
        return res.json();
      };

      const members: { CouncilMemberId: number; Name: string }[] = await call('referenceList/CouncilMembers');
      const memberName = new Map(members.map((m) => [m.CouncilMemberId, m.Name]));
      const statuses: { StatusId: number; Name: string }[] = await call('referenceList/FileItemStatus');
      const inForce = statuses.filter((s) => IN_FORCE.test(s.Name.trim()));
      if (!inForce.some((s) => /^approved$/i.test(s.Name.trim()))) throw new Error('LIMS has no "Approved" status any more');

      // A year's rows in one status; past the API's cap, again by quarter of the agenda date (the only date it filters
      // on), with the year after for files that waited.
      const search = async (year: number, status: number): Promise<Row[]> => {
        const rows: Row[] = await call('search/FileItemSearch', { CalendarYear: year, StatusId: status });
        if (rows.length < LIMIT) return rows;
        const windows = [
          [`${year}-01-01`, `${year}-03-31`],
          [`${year}-04-01`, `${year}-06-30`],
          [`${year}-07-01`, `${year}-09-30`],
          [`${year}-10-01`, `${year}-12-31`],
          [`${year + 1}-01-01`, localDate()],
        ];
        const out: Row[] = [];
        for (const [from, to] of windows) {
          const part: Row[] = await call('search/FileItemSearch', { CalendarYear: year, StatusId: status, FromDate: from, ToDate: to });
          if (part.length >= LIMIT) throw new Error(`LIMS returned ${LIMIT}+ items for ${year} ${from}..${to}; split further`);
          out.push(...part);
        }
        return out;
      };

      // Files are numbered by the year they were opened, and some wait months for a vote: read the year before too.
      const rows: (Row & { status: string })[] = [];
      for (let year = Number(since.slice(0, 4)) - 1; year <= Number(localDate().slice(0, 4)); year++)
        for (const s of inForce) for (const r of await search(year, s.StatusId)) rows.push({ ...r, status: s.Name.trim() });

      // One act can hold many items (a batch of contracts), each a row with the same history.
      const byAct = new Map<string, (Row & { status: string })[]>();
      for (const r of rows) {
        if (!r.ActNumber || !TYPES.has(r.FileType) || skip.test(r.SubCategory ?? '')) continue;
        byAct.set(r.ActNumber, [...(byAct.get(r.ActNumber) ?? []), r]);
      }

      // A file often holds several acts the council passes together (a grant's acceptance and its appropriation, a
      // rezoning's ordinance and its findings, five chapters of one noise ordinance): one candidate per file and
      // council meeting, so the writer sees them as one action.
      type Act = { act: string; rows: (Row & { status: string })[]; history: Step[]; final: Step; date: string; items: string[] };
      const meetings = new Map<string, Act[]>();
      for (const [act, group] of byAct) {
        const history = group[0].LegislativeHistory ?? [];
        const final = history.filter((s) => s.CommitteeCode === 'Council').at(-1);
        if (!final || !ADOPTED.test(final.Action ?? '')) continue; // Audit Committee and Charter Commission items, denials
        const date = isoDate(final.ActionDate);
        if (date < since) continue;
        const items = [...new Set(group.map((g) => squash(g.ItemTitle)).filter(Boolean))];
        const id = `${group[0].FileNumber}|${date}`;
        meetings.set(id, [...(meetings.get(id) ?? []), { act, rows: group, history, final, date, items }]);
      }

      const out: Candidate[] = [];
      for (const acts of meetings.values()) {
        // Ordinances first, then resolutions, then actions; by number within each.
        const rank = (a: Act) => ['Ordinance', 'Resolution', 'Action'].indexOf(a.rows[0].FileType);
        acts.sort((a, b) => rank(a) - rank(b) || a.act.localeCompare(b.act, 'en', { numeric: true }));
        const [lead] = acts;
        const r = lead.rows[0];
        const { history, final, date } = lead;
        const items = [...new Set(acts.flatMap((a) => a.items))];
        const statuses = [...new Set(acts.map((a) => a.rows[0].status))];
        const subject = squash(r.FileSubject);
        const authored = acts.flatMap((a) => a.rows).find((x) => x.AuthorId || x.Author);
        const author = authored ? (memberName.get(authored.AuthorId!) ?? authored.Author) : undefined;
        const committee = history.filter((s) => s.CommitteeCode && s.CommitteeCode !== 'Council').at(-1);
        const mayorStep = history.filter(isMayor).at(-1);
        const mayor = mayorAction(lead.rows[0].status);
        const published = history.filter((s) => !s.CommitteeCode && /^published$/i.test(s.Action ?? '')).at(-1);
        const summary = items.length === 1 ? items[0] : items.map((t, i) => `${i + 1}) ${t}`).join(' ');
        const shared = acts.every((a) => JSON.stringify(a.history) === JSON.stringify(history));

        const actLine = (a: Act) => `${a.rows[0].FileType} (${a.rows[0].SubCategory}), official act No. ${a.act}, status ${a.rows[0].status}`;
        // "- Resolution (Land Sale), status Approved: official acts No. 2026R-211, 2026R-212, ..."
        const actGroups = (list: Act[]) => {
          const kinds = new Map<string, string[]>();
          for (const a of list) {
            const kind = `${a.rows[0].FileType} (${a.rows[0].SubCategory}), status ${a.rows[0].status}`;
            kinds.set(kind, [...(kinds.get(kind) ?? []), a.act]);
          }
          return [...kinds].map(([kind, nos]) => `- ${kind}: official act${nos.length > 1 ? 's' : ''} No. ${nos.join(', ')}`);
        };
        const itemLines = (list: string[]) => (list.length === 1 ? [`Item: ${list[0]}`] : [`Items (${list.length}):`, ...list.map((t) => `- ${t}`)]);
        const historyLines = (a: Act) => ['Legislative history:', ...a.history.map((s) => stepLine(s, mayorAction(a.rows[0].status)))];
        const record = [
          `Minneapolis LIMS, File No. ${r.FileNumber}: ${subject}`,
          author ? `Author: ${author}` : 'Author: none listed (a staff or committee item)',
          ...(acts.length === 1
            ? [`${actLine(lead)}.`, ...itemLines(lead.items), ...historyLines(lead)]
            : shared
              ? [`${acts.length} official acts, passed together:`, ...actGroups(acts), ...itemLines(items), ...historyLines(lead)]
              : acts.flatMap((a) => ['', `${actLine(a)}.`, ...itemLines(a.items), ...historyLines(a)])),
        ].join('\n');

        out.push({
          key: `${o.place}-lims-${r.FileNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${date}`,
          feed: o.id,
          level: 'local',
          jurisdiction: o.place,
          kind: acts.some((a) => a.rows[0].FileType === 'Ordinance') ? 'ordinance' : 'other',
          title: subject || items[0],
          date,
          url: r.URL || `${o.origin}/file/${r.FileNumber}`,
          summary: truncate(summary),
          extra: {
            file: r.FileNumber,
            acts: acts.map((a) => a.act),
            type: [...new Set(acts.map((a) => a.rows[0].FileType))].join(', '),
            subcategory: [...new Set(acts.map((a) => a.rows[0].SubCategory))].join(', '),
            status: statuses.join(', '),
            author: author ?? undefined,
            committee: committee
              ? { name: committee.CommitteeName, date: isoDate(committee.ActionDate), action: squash(committee.Action), vote: tally(committee) }
              : undefined,
            vote: { date, action: squash(final.Action), ...tally(final) },
            mayor: mayor ? { action: mayor, date: mayorStep ? isoDate(mayorStep.ActionDate) : undefined } : undefined,
            published: published ? isoDate(published.ActionDate) : undefined,
            items: items.length > 1 ? items.length : undefined,
            record: truncate(record, 20_000),
          },
        });
      }
      return newest(out, limit);
    },
  };
}
