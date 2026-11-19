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
