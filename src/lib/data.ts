import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { fileDate, latest } from './lastmod.ts';

export type Entry = CollectionEntry<'entries'>;
export type Official = CollectionEntry<'officials'>;
export type Place = CollectionEntry<'places'>;

// URL slug: the file name without its level folder ("federal/medicare-insulin-35-cap" → "medicare-insulin-35-cap").
export const entrySlug = (e: Entry) => e.id.split('/').pop()!;
export const entryUrl = (e: Entry) => `/action/${entrySlug(e)}`;
export const officialUrl = (id: string) => `/officials/${id}`;
export const placeUrl = (id: string) => `/places/${id}`;

// When the site published an entry, and when its page last changed: the latest of the draft, the verifier's check
// and the status check (each shown on the page) and the last change to its file (a hand correction, say).
export const entryDates = (e: Entry) => {
  const v = e.data.verification;
  return { published: v.writer.date, modified: latest(v.writer.date, v.verifier?.date, e.data.status.as_of, fileDate(e.filePath))! };
};

const newestPublished = (entries: Entry[]) => latest(...entries.map((e) => entryDates(e).published));

// An official's page changes with their own file and drawing, and when an action crediting them is added.
export const officialModified = (o: Official, entries: Entry[]) => {
  const image = o.data.portrait?.image;
  return latest(
    fileDate(o.filePath),
    fileDate(image && `public${image}`),
    fileDate(image && `public${image.replace(/\.webp$/, '-400.webp')}`),
    newestPublished(entries.filter((e) => e.data.credit.some((c) => c.official.id === o.id))),
  );
};

// A place's page changes with its own file, the officials seated there, and the actions it lists.
export const placeModified = (place: Place, entries: Entry[], places: Map<string, Place>, seated: Official[]) => {
  const { own, footprint, around } = placeSections(place, entries, places);
  return latest(fileDate(place.filePath), ...seated.map((o) => fileDate(o.filePath)), newestPublished([...own, ...footprint, ...around]));
};

// AP abbreviations for the states we cover, for page titles ("Ashland, Va."). A state missing here gets its full name.
const AP_STATE: Record<string, string> = { va: 'Va.', ny: 'N.Y.', mn: 'Minn.', nj: 'N.J.', ga: 'Ga.', fl: 'Fla.' };

// The state a place sits in, following parents (Ashland → Hanover County → Virginia). A state is its own.
export function stateOf(place: Place, places: Map<string, Place>): Place | undefined {
  for (let p: Place | undefined = place; p; p = p.data.parent ? places.get(p.data.parent.id) : undefined) {
    if (p.data.kind === 'state') return p;
  }
}

// A place's name for page titles, with its state when the name alone could be anywhere: "Ashland, Va.", but
// "Virginia", "South Florida" and "New York City" as they are.
export function placeTitle(place: Place, places: Map<string, Place>): string {
  const state = stateOf(place, places);
  const name = place.data.name;
  if (!state || state.id === place.id || name.includes(state.data.name)) return name;
  return `${name}, ${AP_STATE[state.id] ?? state.data.name}`;
}

const byDateDesc = (a: Entry, b: Entry) => b.data.action.date.getTime() - a.data.action.date.getTime();

// Entries a verifier has failed stay out of the site until fixed or retracted.
export async function getEntries(): Promise<Entry[]> {
  return (await getCollection('entries', (e) => e.data.verification.verdict !== 'fail')).sort(byDateDesc);
}

export async function getOfficialsMap(): Promise<Map<string, Official>> {
  return new Map((await getCollection('officials')).map((o) => [o.id, o]));
}

export async function getPlacesMap(): Promise<Map<string, Place>> {
  return new Map((await getCollection('places')).map((p) => [p.id, p]));
}

// What a place's page lists: its own actions (its government's; a region's, its local governments'), actions from
// elsewhere aimed at it (footprint), and actions from the governments around it that reach it (around).
export function placeSections(place: Place, entries: Entry[], places: Map<string, Place>) {
  const scope = placeAndDescendants(place.id, places);
  const isRegion = place.data.kind === 'region';
  const own = isRegion
    ? entries.filter((e) => e.data.level === 'local' && scope.has(e.data.jurisdiction.id))
    : entries.filter((e) => e.data.jurisdiction.id === place.id);
  const footprint =
    place.id === 'us'
      ? []
      : entries.filter((e) => !own.includes(e) && e.data.places.some((x) => scope.has(x.id)) && !scope.has(e.data.jurisdiction.id));
  const around =
    place.id === 'us' || isRegion
      ? []
      : entriesWithin(place.id, entries, places).filter((e) => !own.includes(e) && !footprint.includes(e));
  return { own, footprint, around };
}

// Every place id an entry applies to: where the acting government sits plus any local footprint.
export const entryPlaceIds = (e: Entry) => [e.data.jurisdiction.id, ...e.data.places.map((p) => p.id)];

// A place plus everything inside it: child places and, for regions, member places.
export function placeAndDescendants(id: string, places: Map<string, Place>): Set<string> {
  const out = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of places.values()) {
      if (out.has(p.id)) continue;
      const inParent = p.data.parent && out.has(p.data.parent.id);
      const inRegion = [...out].some((o) => places.get(o)?.data.members.some((m) => m.id === p.id));
      if (inParent || inRegion) {
        out.add(p.id);
        grew = true;
      }
    }
  }
  return out;
}

export function entriesWithin(id: string, entries: Entry[], places: Map<string, Place>): Entry[] {
  const scope = placeAndDescendants(id, places);
  return entries.filter((e) => entryPlaceIds(e).some((p) => scope.has(p)));
}

// How many actions a place has on record: the federal ones for the country, everything within it for anywhere else.
export const actionCount = (id: string, entries: Entry[], places: Map<string, Place>) =>
  id === 'us' ? entries.filter((e) => e.data.level === 'federal').length : entriesWithin(id, entries, places).length;

// The places the address lookup on /you knows: those with an action on record, or with officials the lookup shows (a
// council roster or a seat). A place filed only so officials can name it has neither, and an address in it is treated
// as if the file weren't there. The /you feeds (addressPlaceSets) use the same set, so their keys match the lookup's.
export async function getLookupPlaceIds(entries: Entry[], places: Map<string, Place>): Promise<Set<string>> {
  const seats = new Set((await getCollection('officials')).flatMap((o) => (o.data.seat ? [o.data.seat.place.id] : [])));
  const shown = [...places.values()].filter((p) => p.id === 'us' || p.data.council || seats.has(p.id) || actionCount(p.id, entries, places) > 0);
  return new Set(shown.map((p) => p.id));
}

// The sets of places an address can belong to, as /you finds them from the Census (its lookup in src/pages/you.astro):
// the country, the state, a city or town and a county (any county in the state, since a city can span several), and
// any region that lists one of them as a member or serves the address's county. Each set has a feed of everything
// that reaches the address (/you/feed/<key>.xml); the key is the set's ids without "us", sorted, joined by "_"
// ("us" alone for an address outside the states we cover).
export function addressPlaceSets(places: Map<string, Place>, lookup: Set<string>): { key: string; ids: Set<string> }[] {
  const all = [...places.values()].filter((p) => lookup.has(p.id));
  const local = (k: string) => k === 'city' || k === 'county' || k === 'town';
  const regions = all.filter((p) => p.data.kind === 'region');
  const withRegions = (ids: string[], county?: string) => {
    const set = new Set(['us', ...ids]);
    for (const r of regions)
      if (r.data.members.some((m) => set.has(m.id)) || (county && r.data.geoids.counties?.includes(county))) set.add(r.id);
    return set;
  };
  const sets: Set<string>[] = [new Set(['us'])];
  for (const state of all.filter((p) => p.data.kind === 'state')) {
    const inState = all.filter((p) => local(p.data.kind) && stateOf(p, places)?.id === state.id);
    const counties = inState.filter((p) => p.data.kind === 'county');
    const towns = inState.filter((p) => p.data.kind !== 'county');
    // An address in a county we don't cover can still be in a region that serves it (the Met Council's seven counties).
    const servedCounties = regions.flatMap((r) => (stateOf(r, places)?.id === state.id ? (r.data.geoids.counties ?? []) : []));
    const uncovered = [undefined, ...servedCounties.filter((c) => !counties.some((p) => p.data.geoids.county === c))];
    for (const c of uncovered) {
      sets.push(withRegions([state.id], c));
      for (const t of towns) sets.push(withRegions([state.id, t.id], t.data.geoids.county ?? c));
    }
    for (const county of counties) {
      sets.push(withRegions([state.id, county.id], county.data.geoids.county));
      for (const t of towns) sets.push(withRegions([state.id, t.id, county.id], county.data.geoids.county));
    }
  }
  const byKey = new Map(sets.map((ids) => [addressFeedKey(ids), ids]));
  return [...byKey].map(([key, ids]) => ({ key, ids }));
}

export const addressFeedKey = (ids: Iterable<string>) => [...ids].filter((id) => id !== 'us').sort().join('_') || 'us';

export const creditedIds = (e: Entry) => e.data.credit.map((c) => c.official.id);

// The home page's cover story: an editor's pick, falling back to the newest featured action whose key person has a
// drawing. Leading with a Republican who did the work says, without saying it, that this site credits whoever did it.
// The home share image (/og/home.png) is drawn from the same pick, so a shared link shows the face people land on.
const LEAD = 'social-security-fairness-act';
export async function getLead(entries: Entry[]): Promise<Entry> {
  const hasFace = async (e: Entry) => Boolean((await getEntry(e.data.credit[0].official))?.data.portrait);
  let lead = entries.find((e) => e.id.endsWith(`/${LEAD}`));
  if (!lead || !(await hasFace(lead))) {
    for (const e of entries.filter((e) => e.data.featured)) if (await hasFace(e)) { lead = e; break; }
  }
  return lead ?? entries[0];
}
