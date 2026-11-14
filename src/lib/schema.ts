// Content schemas shared by Astro (src/content.config.ts) and the pipeline (pipeline/validate.ts).
// Each schema takes one reference schema per collection, so Astro can pass its `reference()`
// while the pipeline passes plain string ids that it checks itself.
// Keep the vocabularies in sync with docs/content-guide.md — the pipeline prompts quote that file.
import { z } from 'astro/zod';

export const TOPICS = [
  'health',
  'costs',
  'housing',
  'childcare',
  'education',
  'work',
  'transit',
  'infrastructure',
  'climate',
  'storms',
  'safety',
  'rights',
  'veterans',
  'food',
  'internet',
  'voting',
  'seniors',
] as const;

export const STATUS_STATES = [
  'in-effect',
  'delivered',
  'phasing-in',
  'under-threat',
  'repealed',
  'expired',
  'blocked',
  'cancelled',
] as const;

export const CREDIT_ROLES = [
  'signed',
  'sponsored',
  'cosponsored',
  'proposed',
  'led',
  'championed',
  'negotiated',
  'secured-funding',
  'voted-yes',
  'tie-breaker',
  'issued',
  'implemented',
] as const;

export const ACTION_TYPES = [
  'law',
  'executive-order',
  'regulation',
  'budget',
  'program',
  'ordinance',
  'ballot-measure',
  'settlement',
  'grant',
] as const;

export const PARTIES = ['D', 'R', 'I', 'L', 'G', 'DSA', 'NP'] as const;

export type Collection = 'officials' | 'places';
// Generic so Astro's `reference()` output type ({ id, collection }) flows through to the inferred types.
export type Refs<O extends z.ZodType = z.ZodType, P extends z.ZodType = z.ZodType> = { officials: O; places: P };

const date = z.coerce.date();

const source = z.object({
  title: z.string(),
  publisher: z.string(),
  url: z.url(),
  date: date.optional(),
});

const partyTally = z.object({ yes: z.number().int().nonnegative(), no: z.number().int().nonnegative() });

export const entrySchema = <O extends z.ZodType, P extends z.ZodType>(ref: Refs<O, P>) =>
  z.object({
    title: z.string().max(90),
    dek: z.string().max(280),
    level: z.enum(['federal', 'state', 'local']),
    jurisdiction: ref.places,
    places: z.array(ref.places).default([]),
    action: z.object({
      type: z.enum(ACTION_TYPES),
      name: z.string(),
      identifier: z.string().optional(),
      date,
      effective: date.optional(),
    }),
    topics: z.array(z.enum(TOPICS)).min(1).max(3),
    who_benefits: z.string(),
    impact: z
      .array(z.object({ figure: z.string().max(18), label: z.string().max(80) }))
      .min(1)
      .max(3),
    status: z.object({
      state: z.enum(STATUS_STATES),
      as_of: date,
      note: z.string().optional(),
      by: z.array(ref.officials).default([]),
      source: z.url().optional(),
    }),
    credit: z
      .array(z.object({ official: ref.officials, role: z.enum(CREDIT_ROLES), note: z.string().optional() }))
      .min(1),
    votes: z
      .array(
        z.object({
          chamber: z.string(),
          date,
          yes: z.number().int().nonnegative(),
          no: z.number().int().nonnegative(),
          by_party: z.partialRecord(z.enum(PARTIES), partyTally).optional(),
          // A Vice President's deciding vote; counted in `yes`/`no` but not in `by_party`.
          tie_breaker: z.object({ official: ref.officials, vote: z.enum(['yes', 'no']) }).optional(),
          members: z
            .array(z.object({ official: ref.officials, vote: z.enum(['yes', 'no', 'abstain', 'absent']) }))
            .optional(),
          source: z.url(),
        }),
      )
      .default([]),
    sources: z.array(source).min(1),
    featured: z.boolean().default(false),
    verification: z.object({
      writer: z.object({ model: z.string(), via: z.string(), date }),
      verifier: z.object({ model: z.string(), via: z.string(), date }).optional(),
      verdict: z.enum(['pending', 'pass', 'corrected', 'fail']),
      notes: z.string().optional(),
    }),
    // Stable key for the underlying action; the pipeline uses it to dedupe and honor retractions.
    source_key: z.string().optional(),
  });

export const officialSchema = <O extends z.ZodType, P extends z.ZodType>(ref: Refs<O, P>) =>
  z.object({
    name: z.string(),
    kind: z.enum(['person', 'body']).default('person'),
    party: z.enum(PARTIES).optional(),
    office: z.string(),
    level: z.enum(['federal', 'state', 'local']),
    jurisdiction: ref.places,
    current: z.boolean().default(true),
    // When set, the address lookup shows this official to anyone in `place`. A seat changing hands on a known date (a
    // governor-elect) has `from`, and the one leaving `until`; the site is rebuilt daily, so the lookup switches on its own.
    seat: z.object({ place: ref.places, title: z.string(), from: date.optional(), until: date.optional() }).optional(),
    ids: z
      .object({ bioguide: z.string().optional(), openstates: z.string().optional(), wikidata: z.string().optional() })
      .default({}),
    url: z.url().optional(),
    // An ink illustration drawn from a real photo of this person (see docs/design.md, "Portraits", and
    // pipeline/portraits/). Without one, the site shows the person's initials; it never invents a face.
    // The site never republishes the photo itself; it links to the page the photo came from.
    portrait: z
      .object({
        // Cutout drawing under public/, e.g. /portraits/jennifer-boysko.webp (a -400.webp sibling serves small tiles).
        image: z.string().regex(/^\/portraits\/[a-z0-9-]+\.webp$/),
        // `official` only for an official government portrait (the Congress bioguide); everything else is `photo`.
        kind: z.enum(['official', 'photo']),
        source: z.object({
          label: z.string(), // "U.S. Congress", "Senate of Virginia", "NY Senate, via Wikimedia Commons"
          // The page the photo came from, linked from every drawing: a bioguide, member, or Commons file page,
          // never a bare image file.
          url: z.url(),
          license: z.string().optional(), // "Public domain", "CC BY 2.0"
        }),
      })
      .optional(),
  });

// A machine-readable source of a place's own actions, read by the pipeline (pipeline/feeds/place-feeds.ts). The feed
// id defaults to "<place>-council" for a meeting system or recaps and "<place>-news" for a news feed; candidate keys
// and decisions hang off it, so don't rename one that has run. A recap (a meeting summary or minutes) lists many
// actions; the pipeline splits it into one candidate per action before triage.
const placeFeedSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('legistar'), // Granicus Legistar Web API: webapi.legistar.com/v1/<client>
    id: z.string().optional(),
    client: z.string(),
    site: z.url().optional(), // public site, if not https://<client>.legistar.com
    types: z.array(z.string()).optional(), // matter types to keep, e.g. [Ordinance, Resolution]; default: all but housekeeping
    status: z.string().optional(), // with `types`, a pattern for the statuses kept; default: passed, adopted, approved...
    sponsors: z.boolean().optional(), // fetch each matter's sponsors
    text: z.boolean().optional(), // fetch each matter's text, so triage sees what it does and not just its title
  }),
  z.object({
    type: z.literal('rss'), // an RSS 2.0 news feed, e.g. CivicPlus News Flash: <origin>/RSSFeed.aspx?ModID=1&CID=All-newsflash.xml
    id: z.string().optional(),
    url: z.url(),
    recaps: z.string().optional(), // pattern for the titles of meeting recaps (CivicPlus articles, each read in full)
  }),
  z.object({
    type: z.literal('wordpress'), // a WordPress site's posts: <url>/wp-json/wp/v2/posts
    id: z.string().optional(),
    url: z.url(),
    recaps: z.string().optional(), // pattern for the titles of meeting recaps, e.g. "\\brecap\\b"
  }),
  z.object({
    type: z.literal('civicclerk'), // CivicClerk meetings: each one's minutes, as text, is a recap
    id: z.string().optional(),
    tenant: z.string(), // <tenant>.api.civicclerk.com
    category: z.number().int(), // the governing body's event category
  }),
  z.object({
    type: z.literal('agendacenter'), // a CivicPlus Agenda Center: each meeting's minutes (or marked-up agenda) is a recap
    id: z.string().optional(),
    url: z.url(), // the site's origin, e.g. https://www.norfolk.gov
    category: z.number().int(), // the body's category id (/AgendaCenter/City-Council-Agendas-25 is 25)
    file: z.enum(['minutes', 'agenda']), // `agenda` where the clerk adds every item's outcome to the agenda after the meeting
  }),
  z.object({
    type: z.literal('laserfiche'), // a Laserfiche WebLink archive: each meeting's OCR'd summary or minutes is a recap
    id: z.string().optional(),
    url: z.url(), // the WebLink root, e.g. https://edocs.vbgov.com/WebLink
    repo: z.string(), // the repository, e.g. CityClerk
    folder: z.number().int(), // the series' folder, which holds one subfolder per year
    title: z.string(), // what each document is: "Summary of City Council actions"
  }),
  z.object({
    type: z.literal('hcms'), // a CivicPlus HCMS ("Evolve") site: each meeting's matching minutes files are a recap
    id: z.string().optional(),
    page: z.url(), // a public page listing the meetings; the guest token is read from it
    category: z.string(), // the body's category id
    files: z.string(), // pattern for the minutes files to read, by file name, e.g. 'Agenda Actions'
  }),
  z.object({
    type: z.literal('acnj'), // Atlantic City's meetings JSON: each meeting's minutes book, up to its appendix, is a recap
    id: z.string().optional(),
    url: z.url(), // the site's origin, https://www.acnj.gov
    body: z.string(), // the meeting type, "Council"
  }),
  z.object({
    type: z.literal('minutes-list'), // a page listing a body's meetings with "Minutes" PDF links: each one's is a recap
    id: z.string().optional(),
    url: z.url(), // the meeting list (older meetings on ?page=2, ...)
    pages: z.number().int().default(2), // how many list pages to read
    title: z.string(), // the body: "Metropolitan Council"
    layout: z.enum(['table', 'blocks']).optional(), // a table row per meeting (default), or a line or box per meeting
    link: z.string().optional(), // pattern for the minutes link's text (default "Minutes")
    rows: z.string().optional(), // pattern a meeting's row must match, e.g. "Regular Meeting"
    delay: z.number().optional(), // seconds between requests, if robots.txt sets a Crawl-delay
    lookback: z.number().int().optional(), // days to look back for late minutes (default 120)
  }),
]);

// How an address finds its district. `label` names the districts: "Ward" makes "Ward 2", "Borough" makes "Chuckatuck
// Borough" (default "District").
//   - A map the browser can query: an ArcGIS layer that sends CORS headers, and the field holding the district. `values`
//     translates what the map says when it isn't the district itself, into one district or several where it's split
//     (Newark's wards into Essex County commissioner districts: { NORTH: "1", WEST: ["1", "3"] }).
//   - `towns`: the town (the Census County Subdivision) decides it, for districts drawn from whole towns.
//   - `unmapped`: no current map yet, so every address in the place sees each district's member, labeled with it.
const districtLayer = z.object({
  arcgis: z.url(),
  field: z.string(),
  label: z.string().optional(),
  values: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
});
const districtTowns = z.object({ towns: z.record(z.string(), z.string()), label: z.string().optional() });
const districtUnmapped = z.object({ unmapped: z.literal(true), label: z.string().optional() });
const districtLookup = z.union([districtLayer, districtTowns, districtUnmapped]);

// The elected body that runs a place, so the address lookup can name a reader's own member. Members with a `district`
// are shown to addresses in it; members without one sit at large and are shown to everyone in the place. Rosters are
// copied by hand from the government's roster page (`url`, `checked`); New York City's is synced instead (`roster`).
const councilSchema = z.object({
  body: z.string(), // "City Council", "Board of Supervisors"
  title: z.string(), // a member's title: "Council Member", "Supervisor"
  // How an address finds its district. `census`: the geocoder's County Subdivisions layer, whose BASENAME is a
  // Virginia county's magisterial district ("Ashland", "2"), free since the page already asks the geocoder. The Census
  // can lag a redistricting, so use it only where random points agree with the county's own map. Otherwise the county
  // or city's own district layer, or several when an address sits in more than one kind of district (Norfolk's wards
  // and superwards). Omit when every member is elected at large.
  districts: z.union([z.literal('census'), districtLookup, z.array(districtLookup).min(1)]).optional(),
  url: z.url().optional(),
  checked: date.optional(),
  roster: z.string().optional(), // a synced file in src/data/roster/, e.g. nyc-council
  members: z
    .array(
      z.object({
        name: z.string(),
        party: z.enum(PARTIES),
        district: z.string().optional(), // as the Census or the layer gives it, ignoring case, spaces and punctuation
        role: z.string().optional(), // a title that replaces `title`, e.g. "Mayor" for a council-elected mayor
        url: z.url().optional(),
        // A seat changing hands on a known date: the new member's `from` is the old one's `until`. The site is rebuilt
        // daily, so the lookup switches on its own.
        from: date.optional(),
        until: date.optional(),
      }),
    )
    .default([]),
});

// A state's legislature, for the address lookup: its roster, synced from Open States by `npm run sync:roster` into
// src/data/roster/<roster>.json, and what each chamber and its members are called. Districts are matched as the Census
// geocoder names them, ignoring leading zeros ("045A" is "45A").
const chamberSchema = z.object({ name: z.string(), title: z.string() }); // { name: House of Delegates, title: Delegate }
const legislatureSchema = z.object({ roster: z.string(), upper: chamberSchema, lower: chamberSchema });

export const placeSchema = <O extends z.ZodType, P extends z.ZodType>(ref: Refs<O, P>) =>
  z.object({
    name: z.string(),
    short: z.string().max(14), // short name: "US", "NY", "NYC", "Norfolk"
    kind: z.enum(['country', 'state', 'region', 'city', 'county', 'town']), // a town sits inside its county (its parent)
    parent: ref.places.optional(),
    // Census GEOIDs the address lookup matches against: a county or independent city by county, a town or a city inside a
    // county by place. A region whose own body serves more than its member places (the Metropolitan Council's seven
    // counties) lists those counties.
    geoids: z
      .object({
        state: z.string().optional(),
        county: z.string().optional(),
        place: z.string().optional(),
        counties: z.array(z.string()).optional(),
      })
      .default({}),
    members: z.array(ref.places).default([]),
    blurb: z.string().optional(),
    feeds: z.array(placeFeedSchema).default([]),
    council: councilSchema.optional(),
    legislature: legislatureSchema.optional(), // a state's
  });

// Ways into government (src/data/get-involved.json, described in src/data/get-involved.schema.md): groups that help
// people run, official guides to getting on the ballot, boards and commissions, and poll work. Each item belongs to a
// place, with the same place ids actions use, so a reader's address narrows them the same way. The site renders
// whatever parses (src/lib/involved.ts); the validator holds the file to this schema.
export const LEANS = ['progressive', 'worker', 'nonpartisan', 'official'] as const;

const webUrl = z.url({ protocol: /^https?$/, error: 'must be an http(s) URL' });
const named = z.string().trim().min(1);

export const involvedSchema = <O extends z.ZodType, P extends z.ZodType>(ref: Refs<O, P>) => {
  const resource = z.object({
    place: ref.places,
    name: named,
    url: webUrl,
    offers: z.string().optional(),
    lean: z.enum(LEANS).optional(),
  });
  return z.object({
    checked: z.iso.date().optional(),
    organizations: z
      .array(
        z.object({
          name: named,
          url: webUrl,
          lean: z.enum(LEANS),
          for: z.string().optional(),
          offers: z.string().optional(),
          places: z.array(ref.places).min(1),
        }),
      )
      .default([]),
    how_to_run: z.array(resource).default([]),
    boards: z.array(resource).default([]),
    poll_work: z.array(resource).default([]),
  });
};
