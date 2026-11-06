// Downloads the current rosters the address lookup uses to turn districts into people.
//   Congress: @unitedstates/congress-legislators (public domain)
//   State legislatures: Open States bulk people CSVs (CC0)
//   New York City Council: the district table on council.nyc.gov
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
      // New York's fusion voting lists every line a member ran on ("Democratic/Working Families"); the first is the party.
      party: STATE_PARTY[r.current_party.split('/')[0]] ?? 'I',
      chamber: r.current_chamber,
      district: r.current_district,
      url: r.links.split(';')[0] || null,
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

await Promise.all([syncCongress(), ...STATES.map(syncState), syncNycCouncil()]);
