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

export const PARTIES = ['D', 'R', 'I', 'L', 'G', 'NP'] as const;

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
    // When set, the address lookup shows this official to anyone in `place`.
    seat: z.object({ place: ref.places, title: z.string() }).optional(),
    ids: z
      .object({ bioguide: z.string().optional(), openstates: z.string().optional(), wikidata: z.string().optional() })
      .default({}),
    url: z.url().optional(),
  });

export const placeSchema = <O extends z.ZodType, P extends z.ZodType>(ref: Refs<O, P>) =>
  z.object({
    name: z.string(),
    short: z.string().max(14), // text on the route plate: "US", "NY", "NYC", "Norfolk"
    kind: z.enum(['country', 'state', 'region', 'city', 'county']),
    parent: ref.places.optional(),
    // Census GEOIDs the address lookup matches against.
    geoids: z
      .object({ state: z.string().optional(), county: z.string().optional(), place: z.string().optional() })
      .default({}),
    members: z.array(ref.places).default([]),
    blurb: z.string().optional(),
  });
