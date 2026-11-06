// Downloads the current rosters the address lookup uses to turn districts into people.
//   Congress: @unitedstates/congress-legislators (public domain)
//   State legislatures: Open States bulk people CSVs (CC0)
// Run: npm run sync:roster
import { writeFile } from 'node:fs/promises';
import { parseCsv } from './lib/csv.ts';

const OUT = new URL('../src/data/roster/', import.meta.url);
const STATES = ['va', 'ny'];

const FEDERAL_PARTY: Record<string, string> = { Democrat: 'D', Republican: 'R', Independent: 'I', Libertarian: 'L' };
const STATE_PARTY: Record<string, string> = {
  Democratic: 'D',
  Republican: 'R',
  Independent: 'I',
  Libertarian: 'L',
  Green: 'G',
};

async function get(url: string): Promise<string> {
  const res = await fetch(url);
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

async function syncState(state: string) {
  const rows = parseCsv(await get(`https://data.openstates.org/people/current/${state}.csv`));
  const members = rows
    .filter((r) => r.current_chamber === 'upper' || r.current_chamber === 'lower')
    .map((r) => ({
      openstates: r.id,
      name: r.name,
      party: STATE_PARTY[r.current_party] ?? 'I',
      chamber: r.current_chamber,
      district: r.current_district,
      url: r.links.split(';')[0] || null,
    }));
  const synced = new Date().toISOString().slice(0, 10);
  await writeFile(new URL(`state-${state}.json`, OUT), JSON.stringify({ synced, state, members }, null, 1) + '\n');
  console.log(`${state}: ${members.length} legislators`);
}

await Promise.all([syncCongress(), ...STATES.map(syncState)]);
