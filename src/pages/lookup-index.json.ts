// Everything the /you page needs to turn Census districts into people and actions, built at deploy time.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import federal from '../data/roster/federal.json';
import stateVa from '../data/roster/state-va.json';
import stateNy from '../data/roster/state-ny.json';
import { entryPlaceIds, getEntries } from '../lib/data.ts';

// Synced council rosters a place can name instead of listing its members (see `council.roster` in the place schema).
type RosterMember = { district?: string; name: string; party: string; role?: string; url?: string };
const rosters = Object.fromEntries(
  Object.entries(import.meta.glob<{ members: RosterMember[] }>('../data/roster/*.json', { eager: true, import: 'default' })).map(
    ([path, data]) => [path.match(/([^/]+)\.json$/)![1], data.members],
  ),
);

// Census geocoder settings. ACS2025_Current carries the 119th Congress and the 2024 state legislative maps;
// switch to ACS2026_Current (120th Congress) when the new Congress is seated in January 2027.
const GEOCODER = {
  benchmark: 'Public_AR_Current',
  vintage: 'ACS2025_Current',
};

// State legislatures we cover, keyed by state FIPS code.
const STATES = [
  { fips: '51', place: 'va', roster: stateVa, upper: 'State Senator', lower: 'Delegate' },
  { fips: '36', place: 'ny', roster: stateNy, upper: 'State Senator', lower: 'Assembly Member' },
];

const normalize = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z ]/g, '')
    .replace(/\b(jr|sr|ii|iii)\b/g, '')
    .split(/\s+/)
    .filter(Boolean);
// "Robert C. "Bobby" Scott" and "Bobby Scott" match on last name plus any shared given name.
const sameName = (a: string, b: string) => {
  const x = normalize(a);
  const y = normalize(b);
  return x.at(-1) === y.at(-1) && x.slice(0, -1).some((w) => y.includes(w));
};

export const GET: APIRoute = async () => {
  const officials = await getCollection('officials');
  const entries = await getEntries();

  const credited = new Map<string, number>();
  for (const e of entries) for (const c of new Set(e.data.credit.map((c) => c.official.id))) credited.set(c, (credited.get(c) ?? 0) + 1);

  const byBioguide = new Map(officials.filter((o) => o.data.ids.bioguide).map((o) => [o.data.ids.bioguide!, o.id]));
  const byOpenstates = new Map(officials.filter((o) => o.data.ids.openstates).map((o) => [o.data.ids.openstates!, o.id]));
  const findOfficial = (level: 'state' | 'local', name: string, place: string) =>
    officials.find((o) => o.data.level === level && o.data.jurisdiction.id === place && sameName(o.data.name, name))?.id;

  const person = (name: string, party: string, office: string, id: string | undefined, url?: string | null) => ({
    name,
    party,
    office,
    id: id ?? null,
    url: url ?? null,
    n: id ? (credited.get(id) ?? 0) : 0,
  });

  const congress: Record<string, { senate: unknown[]; house: Record<string, unknown> }> = {};
  for (const m of federal.members) {
    const st = (congress[m.state] ??= { senate: [], house: {} });
    const id = byBioguide.get(m.bioguide);
    if (m.chamber === 'senate') st.senate.push(person(m.name, m.party, `U.S. Senator from ${m.state}`, id, m.url));
    else {
      const office = m.district === 0 ? `U.S. Representative, ${m.state} at large` : `U.S. Representative, ${m.state} District ${m.district}`;
      st.house[String(m.district)] = person(m.name, m.party, office, id, m.url);
    }
  }

  const legislatures = Object.fromEntries(
    STATES.map((s) => {
      const chamber = (c: 'upper' | 'lower') =>
        Object.fromEntries(
          s.roster.members
            .filter((m) => m.chamber === c)
            .map((m) => [
              m.district,
              person(
                m.name,
                m.party,
                `${s[c]}, District ${m.district}`,
                byOpenstates.get(m.openstates) ?? findOfficial('state', m.name, s.place),
                m.url,
              ),
            ]),
        );
      return [s.fips, { place: s.place, upper: chamber('upper'), lower: chamber('lower') }];
    }),
  );

  const allPlaces = await getCollection('places');

  // Councils and boards, by place. The browser finds the address's district (from the geocoder's County Subdivisions
  // or an ArcGIS point query) and shows that district's members plus any at-large ones. Numbered districts get the
  // body's name ("City Council District 6"); named ones stand alone ("Brookland District").
  const councils = Object.fromEntries(
    allPlaces
      .filter((p) => p.data.council)
      .map((p) => {
        const c = p.data.council!;
        const named = (d: string) => (/^\d+$/.test(d) ? `District ${d}` : `${d} District`);
        const members = c.roster ? rosters[c.roster] : c.members;
        if (!members) throw new Error(`${p.id}: no roster named "${c.roster}" in src/data/roster/`);
        return [
          p.id,
          {
            districts: c.districts === 'census' ? 'census' : c.districts ? { url: c.districts.arcgis, field: c.districts.field } : null,
            members: members.map((m) => {
              const role = m.role ?? c.title;
              const title = m.district ? `${role}, ${named(m.district)}` : role;
              // Someone the site already credits keeps the name their page uses ("Andrew Breton", not "Andrew S. Breton").
              const id = findOfficial('local', m.name, p.id);
              const name = officials.find((o) => o.id === id)?.data.name ?? m.name;
              return {
                district: m.district ?? null,
                title,
                where: m.district ? (/^\d+$/.test(m.district) ? `${c.body} ${named(m.district)}` : named(m.district)) : null,
                ...person(name, m.party, title, id, m.url ?? c.url),
              };
            }),
          },
        ];
      }),
  );

  const seats = officials
    .filter((o) => o.data.current && o.data.seat)
    .map((o) => ({ place: o.data.seat!.place.id, title: o.data.seat!.title, ...person(o.data.name, o.data.party ?? '', o.data.office, o.id) }));

  const places = allPlaces.map((p) => ({
    id: p.id,
    name: p.data.name,
    kind: p.data.kind,
    geoids: p.data.geoids,
    members: p.data.members.map((m) => m.id),
  }));

  const body = {
    geocoder: GEOCODER,
    places,
    congress,
    legislatures,
    councils,
    seats,
    entries: entries.map((e) => ({ id: e.id, places: entryPlaceIds(e), credit: e.data.credit.map((c) => c.official.id) })),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
};
