// Generic adapter for Granicus Legistar's Web API (https://webapi.legistar.com/Help), one feed
// per client. Pulls matters passed/enacted since `since` and skips agenda housekeeping.
import type { Candidate, Feed } from './types.ts';
import { getJson, mapLimit, newest, truncate } from './util.ts';

type Kind = Candidate['kind'];

export type LegistarOptions = {
  id: string;
  description: string;
  client: string; // webapi.legistar.com/v1/<client>
  place: string; // jurisdiction place id
  level?: Candidate['level'];
  site?: string; // public Legistar site, default https://<client>.legistar.com
  tokenEnv?: string; // env var holding the API token, for clients that require one
  dateField?: 'MatterPassedDate' | 'MatterEnactmentDate';
  filter?: string; // extra OData filter, ANDed with the date filter
  sponsors?: boolean; // one extra request per matter
  include?: (m: any) => boolean;
  kind?: (m: any) => Kind;
  key?: (m: any) => string;
  title?: (m: any) => string;
  extra?: (m: any) => Record<string, unknown>; // client-specific fields
};

// Matter types that are never entries: meeting housekeeping, appointments, ceremony.
const SKIP_TYPES =
  /briefing|appointment|minutes|closed session|motion|proclamation|presentation|ceremonial|recognition|communication|report|invocation|announcement|public comment/i;
const PASSED = /pass|adopt|approv|enact|accept/i;

const defaults = {
  include: (m: any) => !SKIP_TYPES.test(m.MatterTypeName ?? '') && PASSED.test(m.MatterStatusName ?? ''),
  kind: (m: any): Kind => (/ordinance/i.test(m.MatterTypeName ?? '') ? 'ordinance' : 'other'),
  title: (m: any) => m.MatterTitle || m.MatterName,
};

export function legistarFeed(o: LegistarOptions): Feed {
  const dateField = o.dateField ?? 'MatterPassedDate';
  const site = o.site ?? `https://${o.client}.legistar.com`;
  const include = o.include ?? defaults.include;
  const kind = o.kind ?? defaults.kind;
  const title = o.title ?? defaults.title;
  const key =
    o.key ??
    ((m: any) =>
      `${o.place}-${String(m.MatterFile ?? m.MatterId)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}`);

  function candidate(m: any): Candidate {
    const heading = String(title(m)).trim();
    // Legistar has a short name and a long formal title; whichever isn't the heading becomes the summary.
    const other = [m.MatterTitle, m.MatterName].find((s) => s && s.trim() !== heading);
    return {
      key: key(m),
      feed: o.id,
      level: o.level ?? 'local',
      jurisdiction: o.place,
      kind: kind(m),
      title: heading,
      date: String(m[dateField]).slice(0, 10),
      url: `${site}/LegislationDetail.aspx?ID=${m.MatterId}&GUID=${m.MatterGuid}`,
      summary: truncate(other?.trim()),
      extra: {
        file: m.MatterFile,
        type: m.MatterTypeName,
        status: m.MatterStatusName,
        body: m.MatterBodyName,
        introduced: m.MatterIntroDate?.slice(0, 10),
        passed: m.MatterPassedDate?.slice(0, 10),
        enacted: m.MatterEnactmentDate?.slice(0, 10),
        enactmentNumber: m.MatterEnactmentNumber ?? undefined,
        matterId: m.MatterId,
        ...o.extra?.(m),
      },
    };
  }

  return {
    id: o.id,
    description: o.description,
    needsKey: o.tokenEnv,
    async fetch({ since, limit }) {
      const token = o.tokenEnv ? process.env[o.tokenEnv] : undefined;
      if (o.tokenEnv && !token) return [];
      const api = `https://webapi.legistar.com/v1/${o.client}`;
      const query = (params: Record<string, string> = {}) =>
        new URLSearchParams(token ? { ...params, token } : params).toString();

      const matters: any[] = [];
      for (let skip = 0; ; skip += 1000) {
        const page: any[] = await getJson(
          `${api}/matters?${query({
            $filter: `${dateField} ge datetime'${since}'${o.filter ? ` and ${o.filter}` : ''}`,
            $orderby: `${dateField} desc`,
            $top: '1000',
            $skip: String(skip),
          })}`,
        );
        matters.push(...page);
        if (page.length < 1000) break;
      }

      const recent = newest(matters.filter(include).map(candidate), limit);
      if (o.sponsors) {
        await mapLimit(recent, 4, async (c) => {
          const rows: any[] = await getJson(`${api}/matters/${c.extra!.matterId}/sponsors?${query()}`).catch(() => []);
          const names = rows
            .sort((a, b) => a.MatterSponsorSequence - b.MatterSponsorSequence)
            .map((s) => s.MatterSponsorName);
          if (names.length) c.extra!.sponsors = names;
        });
      }
      return recent;
    },
  };
}
