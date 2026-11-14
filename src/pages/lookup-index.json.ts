// Everything the /you page needs to turn Census districts into people and actions, built at deploy time.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import federal from '../data/roster/federal.json';
import { entryPlaceIds, getEntries } from '../lib/data.ts';
import { sameName } from '../lib/names.ts';

// Synced rosters, by file name: state legislatures (`legislature.roster` in a state's place file) and councils a place
// names instead of listing its members (`council.roster`).
type RosterMember = {
  district?: string;
  name: string;
  party: string;
  role?: string;
  url?: string | null;
  from?: Date;
  until?: Date;
  chamber?: 'upper' | 'lower';
  openstates?: string;
};
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

// A legislative district as the geocoder and rosters both can name it: no leading zeros, letters upper case ("45A").
const districtKey = (d: string) => d.trim().toUpperCase().replace(/^0+(?=\d)/, '');

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

  const allPlaces = await getCollection('places');

  // Whether a seat with optional start and end dates is held on the day the site is built.
  const today = new Date();
  const holds = (seat: { from?: Date; until?: Date }) => (!seat.from || seat.from <= today) && (!seat.until || today < seat.until);

  // State legislatures we cover, keyed by state FIPS code, each chamber's members keyed by district. A district can
  // elect more than one member (New Jersey's Assembly elects two). Members a state's file marks as out (suspended)
  // are left out until their date.
  const legislatures = Object.fromEntries(
    allPlaces
      .filter((p) => p.data.legislature && p.data.geoids.state)
      .map((p) => {
        const l = p.data.legislature!;
        const members = rosters[l.roster];
        if (!members) throw new Error(`${p.id}: no roster named "${l.roster}" in src/data/roster/ (run npm run sync:roster)`);
        const chamber = (c: 'upper' | 'lower') => {
          const byDistrict: Record<string, ReturnType<typeof person>[]> = {};
          const out = (m: RosterMember) =>
            l.out.some((o) => o.chamber === c && districtKey(o.district) === districtKey(m.district!) && sameName(o.name, m.name) && today < o.until);
          for (const m of members.filter((m) => m.chamber === c && m.district && !out(m)))
            (byDistrict[districtKey(m.district!)] ??= []).push(
              person(
                m.name,
                m.party,
                `${l[c].title}, District ${m.district}`,
                (m.openstates && byOpenstates.get(m.openstates)) || findOfficial('state', m.name, p.id),
                m.url,
              ),
            );
          return { name: l[c].name, title: l[c].title, members: byDistrict };
        };
        return [p.data.geoids.state!, { place: p.id, upper: chamber('upper'), lower: chamber('lower') }];
      }),
  );

  // Councils and boards, by place, with the members serving on the day the site is built. The browser finds the
  // address's districts (from the geocoder's County Subdivisions or ArcGIS point queries) and shows those districts'
  // members plus any at-large ones.
  const councils = Object.fromEntries(
    allPlaces
      .filter((p) => p.data.council)
      .map((p) => {
        const c = p.data.council!;
        const members = c.roster ? rosters[c.roster] : c.members;
        if (!members) throw new Error(`${p.id}: no roster named "${c.roster}" in src/data/roster/`);
        const layers = c.districts === 'census' || !c.districts ? [] : [c.districts].flat();
        return [
          p.id,
          {
            body: c.body,
            districts:
              c.districts === 'census'
                ? [{ census: true, label: 'District' }]
                : layers.map((l) => {
                    const label = l.label ?? 'District';
                    if ('unmapped' in l) return { unmapped: true, label };
                    if ('towns' in l) return { towns: Object.fromEntries(Object.entries(l.towns).map(([t, d]) => [t, [d]])), label };
                    const values = l.values && Object.fromEntries(Object.entries(l.values).map(([v, d]) => [v, [d].flat()]));
                    return { url: l.arcgis, field: l.field, label, ...(values && { values }) };
                  }),
            members: members
              .filter(holds)
              .map((m) => {
                const role = m.role ?? c.title;
                // Someone the site already credits keeps the name their page uses ("Andrew Breton", not "Andrew S. Breton").
                const id = findOfficial('local', m.name, p.id);
                const name = officials.find((o) => o.id === id)?.data.name ?? m.name;
                // `lead`: a member with their own title (a Mayor) heads the council's list.
                return { district: m.district ?? null, role, lead: !!m.role, ...person(name, m.party, role, id, m.url ?? c.url) };
              }),
          },
        ];
      }),
  );

  // Seats held on the day the site is built (a governor-elect's starts on inauguration day), chief executives first.
  const SEAT_ORDER = ['President', 'Vice President', 'Governor', 'Lieutenant Governor', 'Attorney General', 'Mayor'];
  const rank = (title: string) => (SEAT_ORDER.includes(title) ? SEAT_ORDER.indexOf(title) : SEAT_ORDER.length);
  const seats = officials
    .filter((o) => o.data.current && o.data.seat && holds(o.data.seat))
    .sort((a, b) => rank(a.data.seat!.title) - rank(b.data.seat!.title))
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
