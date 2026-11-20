// Downloads the current rosters the address lookup uses to turn districts into people.
//   Congress: @unitedstates/congress-legislators (public domain)
//   State legislatures: Open States bulk people CSVs (CC0)
//   New York City Council: the district table on council.nyc.gov
// Then lists officials who look to have moved to a rostered seat (below).
// Run: npm run sync:roster (or `npm run sync:roster -- --check` to list moves against the rosters on disk, or
// `npm run sync:roster -- nj` to sync only the named states' legislatures)
import './lib/env.ts';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sameName } from '../src/lib/names.ts';
import { CONTENT, idFromPath, listFiles, readYaml, rel } from './lib/content.ts';
import { parseCsv } from './lib/csv.ts';
import { USER_AGENT } from './feeds/util.ts';

const OUT = new URL('../src/data/roster/', import.meta.url);
// States whose place file has a `legislature`, by its roster's name: state-va → va.
const STATES: string[] = [];
for (const file of await listFiles(join(CONTENT, 'places'), '.yaml')) {
  const roster = (await readYaml(file))?.legislature?.roster;
  if (roster) STATES.push(String(roster).replace(/^state-/, ''));
}

const FEDERAL_PARTY: Record<string, string> = { Democrat: 'D', Republican: 'R', Independent: 'I', Libertarian: 'L' };
const STATE_PARTY: Record<string, string> = {
  Democratic: 'D',
  'Democratic-Farmer-Labor': 'D', // Minnesota's Democratic Party
  Republican: 'R',
  Independent: 'I',
  Libertarian: 'L',
  Green: 'G',
};

async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

async function syncCongress() {
  const people = JSON.parse(await get('https://unitedstates.github.io/congress-legislators/legislators-current.json'));
  const members = people.map((p: any) => {
    const term = p.terms.at(-1);
    return {
      bioguide: p.id.bioguide,
      name: p.name.official_full ?? `${p.name.first} ${p.name.last}`,
      party: FEDERAL_PARTY[term.party] ?? 'I',
      chamber: term.type === 'sen' ? 'senate' : 'house',
      state: term.state,
      district: term.type === 'rep' ? term.district : null,
      url: term.url ?? null,
    };
  });
  const synced = new Date().toISOString().slice(0, 10);
  await writeFile(new URL('federal.json', OUT), JSON.stringify({ synced, congress: 119, members }, null, 1) + '\n');
  console.log(`congress: ${members.length} members`);
}

// Official member pages, where Open States' first link is often a caucus or campaign site. New Jersey: Open States
// carries each member's Legislature roster id somewhere in its links or sources (a member who changed house carries
// the old id too), so the id on the Legislature's current roster wins.
const OFFICIAL_URL: Record<string, () => Promise<(r: Record<string, string>) => string | null>> = {
  async nj() {
    const site = 'https://www.njleg.state.nj.us';
    const html = await get(`${site}/legislative-roster`);
    const data = JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)![1]);
    const current = new Map<string, string>(
      data.props.pageProps.legrosterData[0].map((m: { BioLink: string }) => [m.BioLink.match(/\/legislative-roster\/(\d+)\//)![1], m.BioLink]),
    );
    return (r) => {
      const ids = [...`${r.links};${r.sources}`.matchAll(/legislative-roster\/(\d+)|legislatorBio\/(\d+)/g)].map((m) => m[1] ?? m[2]);
      const link = ids.map((id) => current.get(id)).find(Boolean);
      return link ? `${site}${link}` : null;
    };
  },
  // Georgia: each row carries the General Assembly's member id, which a member keeps across chambers, in a link or
  // source; the first link is often the bare member list or the retired House site.
  async ga() {
    return (r) => {
      const id = `${r.links};${r.sources}`.match(/legis\.ga\.gov\/(?:members\/(?:house|senate)|api\/members\/detail)\/(\d+)/)?.[1];
      return id ? `https://www.legis.ga.gov/members/${r.current_chamber === 'upper' ? 'senate' : 'house'}/${id}` : null;
    };
  },
};

// Legislatures read from their own member lists instead of Open States. Florida's members take office on election
// (Art. III §15(d)) and both chambers list the new term right away, weeks before Open States rebuilds. The Senate's list
// is keyed by district ("Vacant" for an empty seat); the House's carries each member's lifelong MemberId. Party is the
// ballot label: Florida's for no party is NPA.
const CHAMBER_LISTS: Record<string, () => Promise<{ name: string; party: string; chamber: string; district: string; url: string }[]>> = {
  async fl() {
    const party = (p: string) => ({ Republican: 'R', Democrat: 'D', Democratic: 'D', 'No Party Affiliation': 'NPA' })[p.trim()] ?? 'I';
    const text = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();
    // "Abbott, Shane G." -> "Shane G. Abbott"; "Bush, James, III" -> "James Bush III"
    const natural = (s: string) => {
      const [last, first, ...rest] = s.split(',').map((t) => t.trim());
      return [first, last, ...rest].filter(Boolean).join(' ');
    };
    const senate = await get('https://www.flsenate.gov/Senators/');
    const senators = [...senate.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].flatMap(([, row]) => {
      const m = row.match(/href="\/Senators\/[\d-]+\/S(\d+)"[^>]*>(?:<img[^>]*>)?([^<]+)<\/a>[\s\S]*?<td[^>]*>\s*\d+\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/);
      if (!m || /^Vacant$/i.test(text(m[2]))) return [];
      return [{ name: natural(text(m[2])), party: party(m[3]), chamber: 'upper', district: m[1], url: `https://www.flsenate.gov/Senators/S${m[1]}` }];
    });
    const house = await get('https://www.flhouse.gov/Sections/Representatives/representatives.aspx');
    const reps = [...house.matchAll(/details\.aspx\?MemberId=(\d+)[^"]*"[\s\S]*?<h5>([\s\S]*?)<\/h5>\s*<p>([^<&]*?)\s*&mdash;\s*<span[^>]*>District:\s*(\d+)/g)].map(
      ([, id, name, p, district]) => ({
        name: natural(text(name)),
        party: party(p),
        chamber: 'lower',
        district,
        url: `https://www.flhouse.gov/Sections/Representatives/details.aspx?MemberId=${id}`,
      }),
    );
    if (senators.length < 35 || reps.length < 110) throw new Error(`fl: parsed ${senators.length} senators and ${reps.length} representatives`);
    return [...senators, ...reps];
  },
};

async function syncState(state: string) {
  if (CHAMBER_LISTS[state]) {
    const members = await CHAMBER_LISTS[state]();
    const synced = new Date().toISOString().slice(0, 10);
    await writeFile(new URL(`state-${state}.json`, OUT), JSON.stringify({ synced, state, members }, null, 1) + '\n');
    console.log(`${state}: ${members.length} legislators (from the chambers' own lists)`);
    return;
  }
  const rows = parseCsv(await get(`https://data.openstates.org/people/current/${state}.csv`));
  const official = await OFFICIAL_URL[state]?.();
  const members = rows
    .filter((r) => r.current_chamber === 'upper' || r.current_chamber === 'lower')
    .map((r) => ({
      openstates: r.id,
      name: r.name,
      // New York's fusion voting lists every line a member ran on ("Democratic/Working Families"); the first is the party.
      party: STATE_PARTY[r.current_party.split('/')[0]] ?? 'I',
      chamber: r.current_chamber,
      district: r.current_district,
      url: official?.(r) ?? (r.links.split(';')[0] || null),
    }));
  const synced = new Date().toISOString().slice(0, 10);
  await writeFile(new URL(`state-${state}.json`, OUT), JSON.stringify({ synced, state, members }, null, 1) + '\n');
  console.log(`${state}: ${members.length} legislators`);
}

async function syncNycCouncil() {
  const html = await get('https://council.nyc.gov/districts/');
  const text = (cell: string) => cell.replace(/<[^>]+>/g, ' ').replace(/&#0?39;|&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const members = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map(([, row]) => [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(([, cell]) => cell))
    .filter((cells) => /^\d+$/.test(text(cells[0] ?? '')))
    .map((cells) => ({
      district: text(cells[0]),
      // Leadership titles are part of the name cell ("Minority Leader David Carr").
      name: text(cells[1]).replace(/^((Deputy|Majority|Minority|Assistant) )*(Speaker|Leader|Whip) /, ''),
      party: FEDERAL_PARTY[text(cells[4])] ?? 'I',
      url: `https://council.nyc.gov/district-${text(cells[0])}/`,
    }));
  if (members.length < 51) throw new Error(`nyc council: expected 51 districts, parsed ${members.length}`);
  const synced = new Date().toISOString().slice(0, 10);
  await writeFile(new URL('nyc-council.json', OUT), JSON.stringify({ synced, members }, null, 1) + '\n');
  console.log(`nyc council: ${members.length} members`);
}

// Officials whose file still describes an earlier office (a state senator since elected to Congress): a roster member
// at another level with the same name, in the same state, whose id the file doesn't carry. A member of Congress's
// jurisdiction is `us`, which names no state, so they're matched by name alone. Relinking is a hand edit
// (ids, office, level, jurisdiction), so this only lists them, after every sync until they're linked.
async function listMoves() {
  const places = new Map<string, { kind: string; parent?: string; legislature?: Record<string, { name: string }> }>();
  for (const file of await listFiles(join(CONTENT, 'places'), '.yaml')) places.set(idFromPath(file), await readYaml(file));
  const stateOf = (id: string): string | undefined => {
    const p = places.get(id);
    return !p ? undefined : p.kind === 'state' ? id : p.parent && stateOf(p.parent);
  };
  const officials = await Promise.all(
    (await listFiles(join(CONTENT, 'officials'), '.yaml')).map(async (file) => ({ file, ...(await readYaml(file)) })),
  );
  const roster = async (name: string) => JSON.parse(await readFile(new URL(`${name}.json`, OUT), 'utf8')).members;
  const seats = [
    ...(await roster('federal')).map((m: any) => ({
      ...m,
      level: 'federal',
      state: m.state.toLowerCase(),
      id: ['bioguide', m.bioguide],
      office: m.chamber === 'senate' ? `U.S. Senator from ${m.state}` : `U.S. Representative, ${m.state} District ${m.district}`,
    })),
    ...(
      await Promise.all(
        STATES.map(async (state) =>
          (await roster(`state-${state}`)).map((m: any) => ({
            ...m,
            level: 'state',
            state,
            id: ['openstates', m.openstates],
            office: `${state.toUpperCase()} ${places.get(state)?.legislature?.[m.chamber]?.name ?? m.chamber} District ${m.district}`,
          })),
        ),
      )
    ).flat(),
  ];
  for (const seat of seats)
    for (const o of officials)
      if (o.level !== seat.level && o.ids?.[seat.id[0]] !== seat.id[1] && (stateOf(o.jurisdiction) === seat.state || (o.jurisdiction === 'us' && o.ids?.bioguide)) && sameName(o.name, seat.name))
        console.log(`moved? ${rel(o.file)} (${o.office}) looks like ${seat.name}, ${seat.office} (${seat.id.join(' ')})`);
}

// A source that fails (Florida's Senate throttles) keeps its last roster on disk; the daily run goes on.
const only = process.argv.slice(2).filter((a) => STATES.includes(a));
const runs = only.length ? only.map(syncState) : process.argv.includes('--check') ? [] : [syncCongress(), ...STATES.map(syncState), syncNycCouncil()];
for (const r of await Promise.allSettled(runs))
  if (r.status === 'rejected') console.warn(`roster sync failed, kept the last roster: ${(r.reason as Error)?.message ?? r.reason}`);
await listMoves();
