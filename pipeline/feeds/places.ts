// Which of our places a piece of text names, for feeds whose items cover the whole country.
// Names come from src/content/places/*.yaml (name and short name). Many of our places' names are
// also places somewhere else (Norfolk, England; Hampton, N.H.; Suffolk County, N.Y.; Newark, Del.;
// Duluth, Ga.; St. Louis County, Mo.), so matching is deliberately strict:
//   - Case-sensitive, whole words: "NEW YORK –" datelines and lowercase words don't count.
//   - Two-letter short names (NY, VA) are never matched: "VA" is Veterans Affairs.
//   - Phrases that contain one of our names but mean something else are removed first (NOT_PLACES).
//   - An ambiguous name counts only when it's followed by its own state (", Virginia" / ", Va." /
//     ", VA"), or when the text is about that state, isn't followed by another state ("Portsmouth,
//     N.H."), and names none of the other states or countries that have a place by that name. Text is
//     about a state when it names the state or one of its places whose name is ours alone.
//   - A strict name (Ashland, Elizabeth) counts only when it's followed by its own state: there are
//     too many Ashlands, Powhatan is also a people and their paramount chief, and Elizabeth and
//     Ramsey are names people have.
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
  /\bFederal Reserve Bank of Richmond\b|\bRichmond Fed\b/g, // federal, not the city
  /\bRichmond (?:County|Hill|Terrace|Avenue|Valley|Heights|Highway|District|University Medical Center)\b/g, // Staten Island, Queens, Ga., N.C., Ohio, U.S. 1 in Fairfax, San Francisco
  /\bCedric Richmond\b/g, // former Louisiana congressman
  /\bNew Hanover\b|\bHanover (?:Square|Street|Insurance)\b|\bHouse of Hanover\b/g, // N.C. county; Manhattan; a company; the dynasty
  /\bChesterfield Township\b/g, // Mich., N.J.
  /\bElizabeth (?:City|River)\b/g, // N.C.; the Elizabeth River runs through Norfolk and Portsmouth
  /\bUniversity of Minnesota Duluth\b/g, // a campus, not the city government
  /\bCamden Yards\b/g, // Baltimore
  /\bAtlantic City Electric\b/g, // the utility, not the city
  /\b(?:Republic|country|nation) of Georgia\b|\bGeorgia,? the (?:country|nation)\b/g, // the country
  /\bFederal Reserve Bank of Atlanta\b|\bAtlanta Fed\b|\bAtlanta Regional Office\b/g, // federal offices, not the city
  /\bSavannah River(?: Site| National Laboratory)?\b/g, // the Energy Department's site is in South Carolina
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
  Richmond: ['California', 'Calif.', 'CA', 'Kentucky', 'Ky.', 'KY', 'Indiana', 'Ind.', 'IN', 'Texas', 'Tex.', 'TX', 'Missouri', 'Mo.', 'MO', 'Michigan', 'Mich.', 'MI', 'Illinois', 'Ill.', 'IL', 'Rhode Island', 'R.I.', 'RI', 'Vermont', 'Vt.', 'VT', 'Maine', 'Utah', 'Staten Island', 'British Columbia', 'B.C.', 'BC', 'Canada', 'London', 'England', 'United Kingdom', 'U.K.', 'UK', 'Australia', 'New Zealand'],
  Chesterfield: ['Missouri', 'Mo.', 'MO', 'Michigan', 'Mich.', 'MI', 'New Jersey', 'N.J.', 'NJ', 'New Hampshire', 'N.H.', 'NH', 'Indiana', 'Ind.', 'IN', 'South Carolina', 'S.C.', 'SC', 'Massachusetts', 'Mass.', 'MA', 'England', 'Derbyshire', 'United Kingdom', 'U.K.', 'UK'],
  'Chesterfield County': ['South Carolina', 'S.C.', 'SC'],
  Hanover: ['Germany', 'New Hampshire', 'N.H.', 'NH', 'Dartmouth', 'Pennsylvania', 'Pa.', 'PA', 'Massachusetts', 'Mass.', 'MA', 'Maryland', 'Md.', 'MD', 'Indiana', 'Ind.', 'IN', 'Illinois', 'Ill.', 'IL', 'Minnesota', 'Minn.', 'MN', 'New Jersey', 'N.J.', 'NJ', 'Kansas', 'Kan.', 'KS', 'Ontario', 'Jamaica'],
  'Charles City': ['Iowa', 'IA'],
  Duluth: ['Georgia', 'Ga.', 'GA', 'Gwinnett'],
  'St. Louis County': ['Missouri', 'Mo.', 'MO'],
  'St. Louis Co.': ['Missouri', 'Mo.', 'MO'],
  'Ramsey County': ['North Dakota', 'N.D.', 'ND'],
  Newark: ['Delaware', 'Del.', 'DE', 'Ohio', 'OH', 'California', 'Calif.', 'CA', 'New York', 'N.Y.', 'NY', 'England', 'Nottinghamshire'],
  Camden: ['South Carolina', 'S.C.', 'SC', 'Maine', 'ME', 'Arkansas', 'Ark.', 'AR', 'Delaware', 'Del.', 'DE', 'Alabama', 'Ala.', 'AL', 'Tennessee', 'Tenn.', 'TN', 'Ohio', 'OH', 'London', 'England'],
  'Camden County': ['Georgia', 'Ga.', 'GA', 'Missouri', 'Mo.', 'MO', 'North Carolina', 'N.C.', 'NC'],
  'Essex County': ['Massachusetts', 'Mass.', 'MA', 'New York', 'N.Y.', 'NY', 'Vermont', 'Vt.', 'VT', 'Virginia', 'Va.', 'VA', 'Ontario', 'England'],
  Atlanta: ['Texas', 'Tex.', 'TX', 'Indiana', 'Ind.', 'IN', 'Illinois', 'Ill.', 'IL', 'Michigan', 'Mich.', 'MI', 'Idaho', 'Nebraska', 'Kansas'],
  Savannah: ['Tennessee', 'Tenn.', 'TN', 'Missouri', 'Mo.', 'MO', 'New York', 'N.Y.', 'NY'],
  Marietta: ['Ohio', 'OH', 'Oklahoma', 'Okla.', 'OK', 'Pennsylvania', 'Pa.', 'PA'],
  Lawrenceville: ['New Jersey', 'N.J.', 'NJ', 'Virginia', 'Va.', 'VA', 'Illinois', 'Ill.', 'IL'],
  'Fulton County': ['New York', 'N.Y.', 'NY', 'Pennsylvania', 'Pa.', 'PA', 'Ohio', 'OH', 'Illinois', 'Ill.', 'IL', 'Indiana', 'Ind.', 'IN', 'Kentucky', 'Ky.', 'KY', 'Arkansas', 'Ark.', 'AR'],
  'DeKalb County': ['Illinois', 'Ill.', 'IL', 'Indiana', 'Ind.', 'IN', 'Alabama', 'Ala.', 'AL', 'Tennessee', 'Tenn.', 'TN', 'Missouri', 'Mo.', 'MO', 'New York', 'N.Y.', 'NY'],
  'Chatham County': ['North Carolina', 'N.C.', 'NC'],
};

// Names that count only right before their own state (see above). Union County is in 17 states; Columbus is also Ohio's
// capital and a man.
const STRICT = new Set(['Ashland', 'Powhatan', 'Ramsey', 'Elizabeth', 'Union County', 'Columbus']);

// How news copy writes each state we cover, besides its name and postal code (AP style).
const AP: Record<string, string> = { va: 'Va.', ny: 'N.Y.', mn: 'Minn.', nj: 'N.J.', ga: 'Ga.' };

// Extra names for a place, beyond its name and short name.
// (Not "New York, N.Y.": that's the dateline of every FEMA Region 2 release.)
const ALIASES: Record<string, string[]> = { nyc: ['City of New York'] };

// Longer places that start or end with a shorter one's name.
const NOT_PRECEDED_BY: Record<string, string> = { Richmond: 'Greater ' };
const NOT_FOLLOWED_BY: Record<string, string> = {
  Hampton: ' Roads',
  Chesterfield: ' County', // matched (or rejected) as "Chesterfield County"
  Hanover: ' County',
  Powhatan: ' County',
  'Charles City': ' County',
  Virginia: ' Beach',
  Gloucester: ' County', // matched (or rejected) as "Gloucester County"
  'Isle of Wight': ' County',
  Camden: ' County',
  Ramsey: ' County',
  'New York': ' City|,? N\\.?Y\\.?(?!\\w)',
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const word = (s: string) => `(?<![\\w-])${s}(?![\\w-])`;

type Matcher = {
  id: string;
  state: boolean;
  strict: boolean;
  pattern: RegExp;
  home?: RegExp; // right after the name: its own state (", Virginia", ", Va.", " (Va.)")
  about?: RegExp; // anywhere: its state's name or a place there whose name is ours alone
  nextTo?: RegExp;
  elsewhere?: RegExp;
};

async function load(): Promise<Matcher[]> {
  const places = new Map<string, any>();
  for (const file of await listFiles(join(CONTENT, 'places'), '.yaml')) places.set(idFromPath(file), await readYaml(file));
  const stateOf = (id: string): string | undefined => {
    const p = places.get(id);
    return !p ? undefined : p.kind === 'state' ? id : p.parent && stateOf(p.parent);
  };
  const namesOf = (id: string) => {
    const p = places.get(id);
    return [...new Set<string>([p.name, p.short, ...(ALIASES[id] ?? [])].filter((n) => n && !/^[A-Z]{2}$/.test(n)))];
  };
  const home: Record<string, RegExp> = {};
  const about: Record<string, RegExp> = {};
  for (const [id, p] of places) {
    if (p.kind !== 'state') continue;
    const forms = [p.name, AP[id], p.short].filter(Boolean).map(esc).join('|');
    home[id] = new RegExp(`,?\\s+(?:in\\s+)?(?:${forms})(?!\\w)|\\s*\\((?:${forms})\\)`, 'y');
    const own = [...places.keys()].filter((o) => o !== id && stateOf(o) === id).flatMap(namesOf).filter((n) => !AMBIGUOUS[n] && !STRICT.has(n));
    about[id] = new RegExp(word(`(?:${[p.name, ...own].map(esc).join('|')})`));
  }

  const out: Matcher[] = [];
  for (const [id, p] of places) {
    if (p.kind === 'country') continue;
    const state = stateOf(id);
    for (const name of namesOf(id)) {
      const others = AMBIGUOUS[name];
      out.push({
        id,
        state: p.kind === 'state',
        strict: STRICT.has(name),
        home: state && p.kind !== 'state' ? home[state] : undefined,
        about: state && p.kind !== 'state' ? about[state] : undefined,
        pattern: new RegExp(
          (NOT_PRECEDED_BY[name] ? `(?<!${NOT_PRECEDED_BY[name]})` : '') +
            word(esc(name) + (NOT_FOLLOWED_BY[name] ? `(?!${NOT_FOLLOWED_BY[name]})` : '')),
          'g',
        ),
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

  const local = new Set<string>();
  const states = new Set<string>();
  const at: Record<string, number> = {};
  for (const m of all) {
    const found = m.state ? states : local;
    if (found.has(m.id)) continue;
    for (const hit of t.matchAll(m.pattern)) {
      const end = hit.index + hit[0].length;
      const ok =
        (m.home && followedBy(m.home, t, end)) ||
        (!m.strict && (!m.nextTo || (m.about!.test(t) && !followedBy(m.nextTo, t, end) && !m.elsewhere!.test(t))));
      if (ok) {
        found.add(m.id);
        at[m.id] = hit.index;
        break;
      }
    }
  }
  return { local: [...local], states: [...states], at };
}
