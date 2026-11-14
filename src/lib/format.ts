import type { CollectionEntry } from 'astro:content';

type Party = NonNullable<CollectionEntry<'officials'>['data']['party']>;
type Role = CollectionEntry<'entries'>['data']['credit'][number]['role'];

// Content dates are calendar days parsed as UTC midnight; format them in UTC so they don't shift.
const long = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });
const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
// AP-style month abbreviations: "Dec. 1, 2028", "Sept. 30, 2027", "April 1, 2028".
const AP_MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

export const formatDate = (d: Date) => long.format(d);
export const formatMonth = (d: Date) => month.format(d);
export const formatShortDate = (d: Date) => `${AP_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const PARTY_NAMES: Record<Party, string> = {
  D: 'Democrat',
  R: 'Republican',
  I: 'Independent',
  L: 'Libertarian',
  G: 'Green',
  DSA: 'Democratic Socialists of America',
  NP: 'Nonpartisan',
};

export const PARTY_PLURALS: Record<Party, string> = {
  D: 'Democrats',
  R: 'Republicans',
  I: 'Independents',
  L: 'Libertarians',
  G: 'Greens',
  DSA: 'Democratic Socialists',
  NP: 'Nonpartisan',
};

// "Tim Kaine (D)". Bodies and nonpartisan offices get no letter.
export function nameWithParty(o: CollectionEntry<'officials'>['data']) {
  return o.party && o.party !== 'NP' ? `${o.name} (${o.party})` : o.name;
}

// How a credit reads as a byline under a face: "Carried by Jennifer Boysko (D)". Phrased by what the person did,
// so a sponsor "carried" a bill and a mayor "proposed" a program. `signed` is always last and set lighter.
export const ROLE_BYLINE: Record<Role, string> = {
  sponsored: 'Carried by',
  cosponsored: 'Co-sponsored by',
  proposed: 'Proposed by',
  led: 'Led by',
  championed: 'Championed by',
  negotiated: 'Negotiated by',
  'secured-funding': 'Funding won by',
  'voted-yes': 'Passed by',
  'tie-breaker': 'Deciding vote by',
  issued: 'Issued by',
  implemented: 'Carried out by',
  signed: 'Signed by',
};

// How a credit reads in a list of people: "Tim Kaine (D) · Sponsored it".
export const ROLE_LABEL: Record<Role, string> = {
  signed: 'Signed it',
  sponsored: 'Sponsored it',
  cosponsored: 'Co-sponsored it',
  proposed: 'Proposed it',
  led: 'Led it',
  championed: 'Championed it',
  negotiated: 'Negotiated it',
  'secured-funding': 'Secured the funding',
  'voted-yes': 'Voted for it',
  'tie-breaker': 'Cast the deciding vote',
  issued: 'Issued it',
  implemented: 'Carried it out',
};

// The byline is the first credit: entries list the people who did the work first and the signer last
// (docs/content-guide.md, "credit"), so the order is an editorial decision, not something to re-sort here.
export function primaryCredit<T extends { role: Role }>(credits: T[]): T {
  return credits[0];
}

// Who stands on an action's cover: the first credit, joined by the second when that person did the same job
// (two chief patrons, two lead sponsors). Never the signer, unless the signer is somehow the only credit.
export function coverCredits<T extends { role: Role }>(credits: T[]): T[] {
  const [first, second] = credits;
  return second && second.role === first.role && second.role !== 'signed' ? [first, second] : [first];
}

// "S. Chris Jones" → "CJ"; "Bill de Blasio" → "BdB". Used where there's no photo to draw from.
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => !/^[A-Z]\.$/.test(w));
  if (words.length === 1) return words[0].slice(0, 2);
  const last = words.at(-1)!;
  const particle = words.length > 2 && /^[a-z]/.test(words.at(-2)!) ? words.at(-2)![0] : '';
  return words[0][0] + particle + last[0];
}

export const TOPIC_LABELS: Record<CollectionEntry<'entries'>['data']['topics'][number], string> = {
  health: 'Health care',
  costs: 'Lower costs',
  housing: 'Housing',
  childcare: 'Child care',
  education: 'Schools',
  work: 'Work and wages',
  transit: 'Getting around',
  infrastructure: 'Roads and water',
  climate: 'Clean energy',
  storms: 'Flooding and storms',
  safety: 'Safety',
  rights: 'Rights',
  veterans: 'Veterans',
  food: 'Food',
  internet: 'Internet',
  voting: 'Voting',
  seniors: 'Seniors',
};

// "claude-opus-5-5" → "Claude Opus 5.5 (Anthropic)"; "gpt-5.5" → "GPT-5.5 (OpenAI)".
export function modelName(id: string): string {
  if (/^claude-/.test(id)) {
    const words = id.replace(/^claude-/, '').split('-');
    const name = words.filter((w) => !/^\d+$/.test(w)).map((w) => w[0].toUpperCase() + w.slice(1));
    const version = words.filter((w) => /^\d+$/.test(w) && w.length < 4).join('.');
    return `Claude ${name.join(' ')} ${version}`.trim() + ' (Anthropic)';
  }
  if (/^(gpt|o\d)/i.test(id)) return `${id.replace(/^gpt/i, 'GPT')} (OpenAI)`;
  return id;
}

// "New York and Virginia", "Minnesota, New York and Virginia".
export const andList = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : (items[0] ?? ''));
