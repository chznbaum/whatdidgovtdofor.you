// Structured data (schema.org JSON-LD) for search engines. Every page carries the site's own nodes (the website, the
// organization that publishes it, and its founder); action, official and place pages add their own. Nodes link by
// @id, which is the page's no-slash URL plus a fragment, so the same person is one node wherever they appear.
import { entryDates, entrySlug, entryUrl, officialUrl, placeTitle, placeUrl, type Entry, type Official, type Place } from './data.ts';
import { ACTION_NOUN } from './format.ts';
import { SITE, absoluteUrl } from './url.ts';

export type Node = Record<string, unknown>;

const DESCRIPTION = 'The concrete things government did for people, who made them happen, and whether they still stand.';
const ids = { website: `${SITE}/#website`, org: `${SITE}/#org`, founder: `${SITE}/#chazona` };
const ref = (id: string) => ({ '@id': id });
const day = (d: Date) => d.toISOString().slice(0, 10);

// The site is Chazona Baum's; the articles are the organization's, so others can contribute to them later.
export const siteNodes = (): Node[] => [
  {
    '@type': 'WebSite',
    '@id': ids.website,
    url: SITE,
    name: 'What did government do for you?',
    alternateName: 'whatdidgovtdofor.you',
    description: DESCRIPTION,
    inLanguage: 'en-US',
    author: ref(ids.founder),
    publisher: ref(ids.org),
  },
  {
    '@type': 'Organization',
    '@id': ids.org,
    name: 'What did government do for you?',
    alternateName: 'whatdidgovtdofor.you',
    url: SITE,
    email: 'corrections@whatdidgovtdofor.you',
    founder: ref(ids.founder),
    sameAs: ['https://github.com/chznbaum/whatdidgovtdofor.you'],
  },
  {
    '@type': 'Person',
    '@id': ids.founder,
    name: 'Chazona Baum',
    url: 'https://chazonabaum.com',
    email: 'chazona@whatdidgovtdofor.you',
    sameAs: ['https://github.com/chznbaum', 'https://www.linkedin.com/in/chazonacodes/', 'https://sifa.id/p/chazonabaum.com'],
  },
];

// ---------- people and places ----------

const officialId = (id: string) => `${absoluteUrl(officialUrl(id))}#person`;

// A person or body as it appears on another page: enough to stand alone, linked to its full node on its own page.
const officialRef = (o: Official): Node => ({
  '@type': o.data.kind === 'body' ? 'Organization' : 'Person',
  '@id': officialId(o.id),
  name: o.data.name,
  url: absoluteUrl(officialUrl(o.id)),
});

// Pages about the same person elsewhere: their official site, Wikidata, the Congressional Biographical Directory.
const sameAs = (o: Official) => {
  const { url, ids: x } = o.data;
  const links = [
    url,
    x?.wikidata && `https://www.wikidata.org/wiki/${x.wikidata}`,
    x?.bioguide && `https://bioguide.congress.gov/search/bio/${x.bioguide}`,
  ].filter((l): l is string => Boolean(l));
  return links.length ? links : undefined;
};

const PLACE_TYPE: Record<Place['data']['kind'], string> = {
  country: 'Country',
  state: 'State',
  city: 'City',
  county: 'AdministrativeArea',
  town: 'AdministrativeArea',
  region: 'AdministrativeArea',
};

// A place, inside its parent (Ashland inside Hanover County); the parent is named in full so the page stands alone.
const placeNode = (p: Place, places: Map<string, Place>, withParent = true): Node => {
  const parent = withParent && p.data.parent ? places.get(p.data.parent.id) : undefined;
  return {
    '@type': PLACE_TYPE[p.data.kind],
    '@id': `${absoluteUrl(placeUrl(p.id))}#place`,
    name: placeTitle(p, places),
    url: absoluteUrl(placeUrl(p.id)),
    ...(parent && { containedInPlace: placeNode(parent, places, false) }),
  };
};

// ---------- breadcrumbs ----------

// From the state down to the place (Virginia › Hanover County › Ashland); the country only for itself.
function placeTrail(p: Place, places: Map<string, Place>): Place[] {
  const trail: Place[] = [];
  for (let x: Place | undefined = p; x; x = x.data.parent ? places.get(x.data.parent.id) : undefined) {
    if (x.data.kind === 'country' && x.id !== p.id) break;
    trail.unshift(x);
  }
  return trail;
}

const breadcrumbs = (url: string, crumbs: { name: string; url: string }[]): Node => ({
  '@type': 'BreadcrumbList',
  '@id': `${url}#breadcrumbs`,
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
});

const placeCrumbs = (p: Place, places: Map<string, Place>) => [
  { name: 'Home', url: SITE },
  { name: 'Places', url: absoluteUrl('/places') },
  ...placeTrail(p, places).map((x) => ({ name: x.data.name, url: absoluteUrl(placeUrl(x.id)) })),
];

// ---------- an action ----------

// Where it stands, in schema.org's terms for legislation. A law under threat is still in force.
const LEGAL_FORCE: Record<Entry['data']['status']['state'], string> = {
  'in-effect': 'InForce',
  delivered: 'InForce',
  'under-threat': 'InForce',
  'phasing-in': 'PartiallyInForce',
  repealed: 'NotInForce',
  expired: 'NotInForce',
  blocked: 'NotInForce',
  cancelled: 'NotInForce',
};

const LEGISLATION = new Set<Entry['data']['action']['type']>(['law', 'ordinance', 'regulation', 'executive-order', 'ballot-measure', 'budget']);
const SPONSOR_ROLES = new Set(['sponsored', 'cosponsored']);

type Credit = Entry['data']['credit'][number] & { person: Official };

// The action itself. Legislation carries the credit as sponsor (sponsors and cosponsors) and contributor (everyone
// else, in the site's credit order, so the key person leads and the signer comes last). A grant (MonetaryGrant) and a
// program (GovernmentService) have no such properties in schema.org, so their article names the people instead.
function actionNode(e: Entry, credits: Credit[], place: Place, places: Map<string, Place>): Node {
  const d = e.data;
  const id = `${absoluteUrl(entryUrl(e))}#action`;
  const where = placeNode(place, places);
  const sponsors = credits.filter((c) => SPONSOR_ROLES.has(c.role)).map((c) => officialRef(c.person));
  const contributors = credits.filter((c) => !SPONSOR_ROLES.has(c.role)).map((c) => officialRef(c.person));
  const credit = { ...(sponsors.length && { sponsor: sponsors }), ...(contributors.length && { contributor: contributors }) };
  const named = { '@id': id, name: d.action.name, ...(d.action.identifier && { identifier: d.action.identifier }) };

  if (LEGISLATION.has(d.action.type)) {
    return {
      '@type': 'Legislation',
      ...named,
      ...(d.action.identifier && { legislationIdentifier: d.action.identifier }),
      legislationType: ACTION_NOUN[d.action.type],
      legislationDate: day(d.action.date),
      ...(d.action.effective && { legislationDateOfApplicability: day(d.action.effective) }),
      legislationJurisdiction: where,
      legislationLegalForce: `https://schema.org/${LEGAL_FORCE[d.status.state]}`,
      ...credit,
    };
  }
  if (d.action.type === 'grant') return { '@type': 'MonetaryGrant', ...named };
  if (d.action.type === 'program') return { '@type': 'GovernmentService', ...named, areaServed: where };
  // A settlement: an agreement, so a plain creative work, which can carry the credit.
  return { '@type': 'CreativeWork', ...named, dateCreated: day(d.action.date), spatialCoverage: where, ...credit };
}

export function actionNodes(e: Entry, credits: Credit[], place: Place, places: Map<string, Place>): Node[] {
  const d = e.data;
  const url = absoluteUrl(entryUrl(e));
  const { published, modified } = entryDates(e);
  const action = actionNode(e, credits, place, places);
  const namesPeople = action['@type'] === 'MonetaryGrant' || action['@type'] === 'GovernmentService';
  return [
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      url,
      mainEntityOfPage: url,
      headline: d.title,
      description: d.dek,
      image: absoluteUrl(`/og/${entrySlug(e)}.png`),
      datePublished: day(published),
      dateModified: day(modified),
      inLanguage: 'en-US',
      isAccessibleForFree: true,
      isPartOf: ref(ids.website),
      author: ref(ids.org),
      publisher: ref(ids.org),
      about: ref(action['@id'] as string),
      ...(namesPeople && { mentions: credits.map((c) => officialRef(c.person)) }),
      citation: d.sources.map((s) => ({
        '@type': 'CreativeWork',
        name: s.title,
        url: s.url,
        publisher: { '@type': 'Organization', name: s.publisher },
        ...(s.date && { datePublished: day(s.date) }),
      })),
    },
    action,
    breadcrumbs(url, [...placeCrumbs(place, places), { name: d.title, url }]),
  ];
}

// ---------- an official ----------

export function officialNodes(o: Official, place: Place | undefined, places: Map<string, Place>, modified?: Date): Node[] {
  const url = absoluteUrl(officialUrl(o.id));
  const person = o.data.kind === 'person';
  return [
    {
      '@type': 'ProfilePage',
      '@id': `${url}#page`,
      url,
      name: o.data.name,
      isPartOf: ref(ids.website),
      mainEntity: ref(officialId(o.id)),
      ...(modified && { dateModified: day(modified) }),
    },
    {
      ...officialRef(o),
      ...(person ? { jobTitle: o.data.office } : { description: o.data.office }),
      ...(o.data.portrait && { image: absoluteUrl(o.data.portrait.image) }),
      ...(sameAs(o) && { sameAs: sameAs(o) }),
    },
    breadcrumbs(url, [...(place ? placeCrumbs(place, places) : [{ name: 'Home', url: SITE }]), { name: o.data.name, url }]),
  ];
}

// ---------- a place ----------

export function placeNodes(p: Place, places: Map<string, Place>, description: string, modified?: Date): Node[] {
  const url = absoluteUrl(placeUrl(p.id));
  return [
    {
      '@type': 'CollectionPage',
      '@id': `${url}#page`,
      url,
      name: placeTitle(p, places),
      description,
      ...(modified && { dateModified: day(modified) }),
      isPartOf: ref(ids.website),
      about: placeNode(p, places),
    },
    breadcrumbs(url, placeCrumbs(p, places)),
  ];
}

// The whole graph for a page, ready for a <script type="application/ld+json">. "<" is escaped so no string in it can
// close the script element.
export const graph = (nodes: Node[]) =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': [...siteNodes(), ...nodes] }).replace(/</g, '\\u003c');
