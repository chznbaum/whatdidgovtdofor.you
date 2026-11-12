// Which of our places a piece of text names, for feeds whose items cover the whole country.
// Names come from src/content/places/*.yaml (name and short name). Most Hampton Roads names are
// also places somewhere else (Norfolk, England; Hampton, N.H.; Suffolk County, N.Y.; Williamsburg,
// Brooklyn; York County, Pa.), so matching is deliberately strict:
//   - Case-sensitive, whole words: "NEW YORK –" datelines and lowercase words don't count.
//   - Two-letter short names (NY, VA) are never matched: "VA" is Veterans Affairs.
//   - Phrases that contain one of our names but mean something else are removed first (NOT_PLACES).
//   - An ambiguous name counts only when it's followed by ", Virginia" / ", Va." / ", VA", or when
//     the text is about Virginia, isn't followed by another state ("Portsmouth, N.H."), and names
//     none of the other states or countries that have a place by that name.
//   - States (ny, va) are reported apart from local places; callers decide when a state is enough.
import { join } from 'node:path';
import { CONTENT, idFromPath, listFiles, readYaml } from '../lib/content.ts';

const NOT_PLACES = [
  /\bWest Virginia\b/g,
  /\bNorfolk (?:Southern|Island|County|District|Naval Shipyard)\b/g, // railroad; Pacific island; Mass.; Army Corps district (most of Va.); the shipyard is in Portsmouth
  /\bSuffolk (?:County|University|Downs)\b/g, // N.Y. and Mass.; Virginia's Suffolk is a city
  /\bChesapeake (?:Bay|Energy|Beach|Utilities|Conservancy|and Ohio|City)\b/g,
  /\b(?:East|Lionel) Hampton\b|\bHampton (?:Bays|Inn|Falls|Court|County|Beach)\b/g, // N.Y., hotels, N.H., England, S.C.
  /\bPortsmouth Naval Shipyard\b/g, // Kittery, Maine
  /\bWilliamsburg (?:Bridge|Houses)\b/g, // Brooklyn
  /\bNew York County\b/g, // Manhattan, and it contains "York County"
];

// Ambiguous name -> other states and countries with a place by that name. Abbreviations only
// count right after the name ("Norfolk, Neb."); full names count anywhere in the text.
const AMBIGUOUS: Record<string, string[]> = {
  Norfolk: ['Massachusetts', 'Mass.', 'MA', 'Nebraska', 'Neb.', 'NE', 'Connecticut', 'Conn.', 'CT', 'England', 'United Kingdom', 'U.K.', 'UK'],
  Hampton: ['New Hampshire', 'N.H.', 'NH', 'Georgia', 'Ga.', 'GA', 'South Carolina', 'S.C.', 'SC', 'Iowa', 'IA', 'New Jersey', 'N.J.', 'NJ', 'Connecticut', 'Conn.', 'CT', 'Minnesota', 'Arkansas', 'Tennessee', 'Long Island', 'England', 'United Kingdom'],
  Suffolk: ['New York', 'N.Y.', 'NY', 'Long Island', 'Massachusetts', 'Mass.', 'MA', 'Boston', 'England', 'United Kingdom', 'U.K.', 'UK'],
  Portsmouth: ['New Hampshire', 'N.H.', 'NH', 'Ohio', 'OH', 'Rhode Island', 'R.I.', 'RI', 'Maine', 'England', 'United Kingdom', 'U.K.', 'UK', 'Dominica'],
  Chesapeake: ['Maryland', 'Md.', 'MD', 'Ohio', 'OH'],
  Williamsburg: ['New York', 'N.Y.', 'NY', 'Brooklyn', 'Kentucky', 'Ky.', 'KY', 'Ohio', 'OH', 'Iowa', 'IA', 'Massachusetts', 'Mass.', 'MA', 'Pennsylvania', 'Pa.', 'PA'],
  'York County': ['Pennsylvania', 'Pa.', 'PA', 'South Carolina', 'S.C.', 'SC', 'Maine', 'ME', 'Nebraska', 'Neb.', 'NE', 'New Brunswick'],
  Gloucester: ['Massachusetts', 'Mass.', 'MA', 'New Jersey', 'N.J.', 'NJ', 'England', 'United Kingdom', 'U.K.', 'UK'],
  'Gloucester County': ['New Jersey', 'N.J.', 'NJ'],
  'Isle of Wight': ['England', 'United Kingdom', 'U.K.', 'UK'],
};

// Extra names for a place, beyond its name and short name.
// (Not "New York, N.Y.": that's the dateline of every FEMA Region 2 release.)
const ALIASES: Record<string, string[]> = { nyc: ['City of New York'] };

// Longer places that start with a shorter one's name.
const NOT_FOLLOWED_BY: Record<string, string> = {
  Hampton: ' Roads',
  Virginia: ' Beach',
  Gloucester: ' County', // matched (or rejected) as "Gloucester County"
  'Isle of Wight': ' County',
  'New York': ' City|,? N\\.?Y\\.?(?!\\w)',
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const word = (s: string) => `(?<![\\w-])${s}(?![\\w-])`;
const VIRGINIA = /,?\s+(?:in\s+)?(?:Virginia|Va\.|VA)(?!\w)|\s*\(Va\.\)/y;
const ABOUT_VIRGINIA = new RegExp(word('(?:Virginia|Hampton Roads|Newport News|Poquoson)'));

type Matcher = { id: string; state: boolean; pattern: RegExp; nextTo?: RegExp; elsewhere?: RegExp };

async function load(): Promise<Matcher[]> {
  const out: Matcher[] = [];
  for (const file of await listFiles(join(CONTENT, 'places'), '.yaml')) {
    const id = idFromPath(file);
    const p = await readYaml(file);
    if (p.kind === 'country') continue;
    const names = new Set<string>([p.name, p.short, ...(ALIASES[id] ?? [])].filter((n) => n && !/^[A-Z]{2}$/.test(n)));
    for (const name of names) {
      const others = AMBIGUOUS[name];
      out.push({
        id,
        state: p.kind === 'state',
        pattern: new RegExp(word(esc(name) + (NOT_FOLLOWED_BY[name] ? `(?!${NOT_FOLLOWED_BY[name]})` : '')), 'g'),
        nextTo: others && new RegExp(`,?\\s+(?:${others.map(esc).join('|')})(?!\\w)`, 'y'),
        elsewhere: others && new RegExp(word(`(?:${others.filter((s) => /^[A-Z][a-z]/.test(s) && !s.endsWith('.')).map(esc).join('|')})`)),
      });
    }
  }
  return out;
}

let matchers: Promise<Matcher[]> | undefined;

const followedBy = (re: RegExp, text: string, at: number) => ((re.lastIndex = at), re.test(text));

export type NamedPlaces = {
  local: string[]; // cities, counties, the region, NYC
  states: string[];
  at: Record<string, number>; // where in `text` each place is first named
};

export async function namedPlaces(text: string): Promise<NamedPlaces> {
  const all = await (matchers ??= load());
  let t = text;
  for (const re of NOT_PLACES) t = t.replace(re, (m) => ' '.repeat(m.length)); // keep offsets
  const aboutVirginia = ABOUT_VIRGINIA.test(t);

  const local = new Set<string>();
  const states = new Set<string>();
  const at: Record<string, number> = {};
  for (const m of all) {
    const found = m.state ? states : local;
    if (found.has(m.id)) continue;
    for (const hit of t.matchAll(m.pattern)) {
      const end = hit.index + hit[0].length;
      const ok =
        !m.nextTo ||
        followedBy(VIRGINIA, t, end) ||
        (aboutVirginia && !followedBy(m.nextTo, t, end) && !m.elsewhere!.test(t));
      if (ok) {
        found.add(m.id);
        at[m.id] = hit.index;
        break;
      }
    }
  }
  return { local: [...local], states: [...states], at };
}
