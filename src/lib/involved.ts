// The "your turn" page and the call to action above the footer. Data comes from src/data/get-involved.json
// (shape: src/data/get-involved.schema.md), which a researcher fills in over time, so everything here tolerates a
// missing file, missing lists, and half-filled items: anything without a name and a URL is skipped.
import type { Place } from './data.ts';

export const LEANS = ['progressive', 'worker', 'nonpartisan', 'official'] as const;
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

// The places a reader can narrow the page to.
export const FILTERS = [
  { id: 'va', label: 'Virginia' },
  { id: 'hampton-roads', label: 'Hampton Roads' },
  { id: 'ny', label: 'New York State' },
  { id: 'nyc', label: 'New York City' },
] as const;

// For one item's place: the filters it belongs under. An item applies to a filter when its place is that place, inside
// it (Norfolk is in Hampton Roads), or contains it (a Virginia guide applies to Hampton Roads; anything national applies
// everywhere).
export function filtersFor(placeIds: string[], places: Map<string, Place>): string[] {
  const ancestors = (id: string): string[] => {
    const p = places.get(id);
    const up = [p?.data.parent?.id, ...[...places.values()].filter((r) => r.data.members.some((m) => m.id === id)).map((r) => r.id)];
    return up.filter(Boolean).flatMap((u) => [u!, ...ancestors(u!)]);
  };
  const out = new Set<string>();
  for (const id of placeIds) {
    if (id === 'us') return FILTERS.map((f) => f.id);
    const line = [id, ...ancestors(id)];
    for (const f of FILTERS) {
      const inside = line.includes(f.id);
      const contains = ancestors(f.id).includes(id);
      if (inside || contains) out.add(f.id);
    }
  }
  return [...out];
}

// Group resources by place, in the order the site lists places: national, then Virginia, then New York.
const ORDER = ['us', 'va', 'hampton-roads', 'ny', 'nyc'];
export function byPlace(items: Resource[]): [string, Resource[]][] {
  const groups = new Map<string, Resource[]>();
  for (const r of items) groups.set(r.place, [...(groups.get(r.place) ?? []), r]);
  const rank = (id: string) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length);
  return [...groups.entries()].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
}

// "teachers who want to run" → "For teachers who want to run."; leaves a sentence that already ends alone.
export const sentence = (s: string, lead = '') => {
  const t = lead ? `${lead} ${s}` : s[0].toUpperCase() + s.slice(1);
  return /[.!?]$/.test(t) ? t : `${t}.`;
};
