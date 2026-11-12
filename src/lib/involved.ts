// Ways into government: /your-turn/, "Your turn here" on each place page, and the link from /you/ results. Data comes
// from src/data/get-involved.json (shape: src/data/get-involved.schema.md). Every item belongs to a place, with the
// same place ids actions use, so a reader's address narrows these the way it narrows actions. A researcher fills the
// file in over time, so everything here tolerates a missing file, missing lists, and half-filled items: anything
// without a name and a URL is skipped. The validator (pipeline/validate.ts) is the strict side.
import type { Place } from './data.ts';
import { LEANS } from './schema.ts';

export type Lean = (typeof LEANS)[number];
// Said plainly, the way the site gives party as a word: a reader should know what they're clicking.
export const LEAN_LABEL: Record<Lean, string> = {
  progressive: 'Progressive',
  worker: 'Labor union',
  nonpartisan: 'Nonpartisan',
  official: 'Government office',
};

export type Org = { name: string; url: string; lean: Lean; for?: string; offers?: string; places: string[] };
export type Resource = { place: string; name: string; url: string; offers?: string };
export type Involved = { checked?: string; organizations: Org[]; how_to_run: Resource[]; boards: Resource[]; poll_work: Resource[] };

const files = import.meta.glob<unknown>('../data/get-involved.json', { eager: true, import: 'default' });
const raw = (Object.values(files)[0] ?? {}) as Record<string, unknown>;

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const isUrl = (v: unknown) => typeof v === 'string' && /^https?:\/\//.test(v);
const list = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

function resources(v: unknown): Resource[] {
  return list(v)
    .filter((r) => str(r.name) && isUrl(r.url))
    .map((r) => ({ place: str(r.place) ?? 'us', name: str(r.name)!, url: String(r.url), offers: str(r.offers) }));
}

// Run For Something leads (the owner's pick), then by lean, keeping the file's order within each lean.
function organizations(v: unknown): Org[] {
  const orgs = list(v)
    .filter((o) => str(o.name) && isUrl(o.url) && LEANS.includes(o.lean as Lean))
    .map((o) => ({
      name: str(o.name)!,
      url: String(o.url),
      lean: o.lean as Lean,
      for: str(o.for),
      offers: str(o.offers),
      places: Array.isArray(o.places) && o.places.length ? (o.places as string[]) : ['us'],
    }));
  const rank = (o: Org) => (/^run for something$/i.test(o.name) ? -1 : LEANS.indexOf(o.lean));
  return orgs.map((o, i) => ({ o, i })).sort((a, b) => rank(a.o) - rank(b.o) || a.i - b.i).map(({ o }) => o);
}

export const involved: Involved = {
  checked: str(raw.checked),
  organizations: organizations(raw.organizations),
  how_to_run: resources(raw.how_to_run),
  boards: resources(raw.boards),
  poll_work: resources(raw.poll_work),
};

// The three ways in, in the order every place lists them.
export const WAYS = [
  {
    id: 'run',
    title: 'Run for office',
    blurb: 'The official rules for getting on the ballot, and groups that train and back candidates.',
  },
  {
    id: 'boards',
    title: 'Join a board or commission',
    blurb: 'Cities, counties, and states appoint residents to boards on things like zoning, parks, and libraries. You apply instead of running.',
  },
  {
    id: 'polls',
    title: 'Work the polls',
    blurb: 'Every election needs poll workers. You sign up with your state or local election office.',
  },
] as const;
export type Way = (typeof WAYS)[number]['id'];

export type Listed = { guides: Resource[]; orgs: Org[]; boards: Resource[]; polls: Resource[] };

// What's listed for one place. A group that works nationwide is listed once, under the country, even when it also
// names states; a group that names only states or localities is listed under each of them.
export function listedFor(id: string): Listed {
  const national = (o: Org) => o.places.includes('us');
  return {
    guides: involved.how_to_run.filter((r) => r.place === id),
    orgs: involved.organizations.filter((o) => (id === 'us' ? national(o) : !national(o) && o.places.includes(id))),
    boards: involved.boards.filter((r) => r.place === id),
    polls: involved.poll_work.filter((r) => r.place === id),
  };
}
export const listedCount = (l: Listed) => l.guides.length + l.orgs.length + l.boards.length + l.polls.length;
// Under "Run for office", the official guide comes before the groups.
export const byWay = (l: Listed): Record<Way, (Org | Resource)[]> => ({ run: [...l.guides, ...l.orgs], boards: l.boards, polls: l.polls });

// Every place id the data names, including any that aren't places yet (the validator flags those).
export const placeIdsInData = () => [
  ...new Set([
    ...involved.organizations.flatMap((o) => o.places),
    ...[...involved.how_to_run, ...involved.boards, ...involved.poll_work].map((r) => r.place),
  ]),
];

// The places that contain a place: its parent, any region that lists it as a member, and on up to the country.
// The address lookup on /you/ produces the same set (the country, the state, the city or county, and its regions).
export function containing(id: string, places: Map<string, Place>): string[] {
  const out: string[] = [];
  const visit = (x: string) => {
    const regions = [...places.values()].filter((r) => r.data.members.some((m) => m.id === x)).map((r) => r.id);
    for (const up of [places.get(x)?.data.parent?.id, ...regions]) {
      if (up && !out.includes(up)) {
        out.push(up);
        visit(up);
      }
    }
  };
  visit(id);
  return out;
}

// The page's outline: the country first, then each state (by name) with its own row, then its regions, each followed
// by its member cities and counties, then any other places in the state. Anything left over (an id in the data that
// isn't a place yet) goes last, so it still shows.
export type Row = { id: string; label: string; name: string; kind: string };
export type Chapter = { id: string; title: string; rows: Row[] };

export function outline(places: Map<string, Place>, extra: string[] = []): Chapter[] {
  const byName = (a: Place, b: Place) => a.data.name.localeCompare(b.data.name);
  const isRegion = (p: Place) => p.data.kind === 'region';
  const inside = (id: string) =>
    [...places.values()]
      .filter((p) => p.data.parent?.id === id || places.get(id)?.data.members.some((m) => m.id === p.id))
      .sort((a, b) => Number(isRegion(b)) - Number(isRegion(a)) || byName(a, b));
  const row = (p: Place, label = p.data.name): Row => ({ id: p.id, label, name: p.data.name, kind: p.data.kind });

  const seen = new Set<string>();
  const chapters: Chapter[] = [];
  const us = places.get('us');
  if (us) {
    seen.add('us');
    chapters.push({ id: 'us', title: 'Nationwide', rows: [row(us, 'Nationwide')] });
  }
  for (const state of [...places.values()].filter((p) => p.data.kind === 'state').sort(byName)) {
    const rows: Row[] = [];
    const walk = (p: Place, label?: string) => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      rows.push(row(p, label));
      for (const q of inside(p.id)) walk(q);
    };
    walk(state, 'Statewide');
    chapters.push({ id: state.id, title: state.data.name, rows });
  }
  const rest: Row[] = [
    ...[...places.values()].filter((p) => !seen.has(p.id)).map((p) => row(p)),
    ...extra.filter((id) => !places.has(id)).map((id) => ({ id, label: id, name: id, kind: 'unknown' })),
  ];
  if (rest.length) chapters.push({ id: 'other', title: 'Other places', rows: rest });
  return chapters;
}

// "teachers who want to run" → "For teachers who want to run."; leaves a sentence that already ends alone.
export const sentence = (s: string, lead = '') => {
  const t = lead ? `${lead} ${s}` : s[0].toUpperCase() + s.slice(1);
  return /[.!?]$/.test(t) ? t : `${t}.`;
};

// Where /your-turn/ narrows to: the places listed, plus everything that contains them. The /you/ results link passes
// the lookup's own place set ("us,va,hampton-roads,norfolk"); a place page passes its own id.
export const yourTurnUrl = (ids: string[] = []) => (ids.length ? `/your-turn/?places=${ids.join(',')}` : '/your-turn/');
