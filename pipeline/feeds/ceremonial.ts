// Cheap prefilter for candidates that are obviously not entries (see docs/content-guide.md,
// "What qualifies"). Errs toward keeping things: triage makes the real call.
import type { Candidate } from './types.ts';

type Rule = { reason: string; pattern: RegExp; kinds?: Candidate['kind'][] };

const NEWS: Candidate['kind'][] = ['press-release'];

const RULES: Rule[] = [
  { reason: 'post office naming', pattern: /\bpost office\b|\bpostal service\b[^.]*\blocated at\b/i },
  {
    reason: 'naming',
    pattern:
      /\b(?:designat|nam|renam|redesignat)\w*\b[^.]{0,200}?\b(?:facility|building|courthouse|bridge|highway|road|street|avenue|boulevard|interchange|clinic|medical center|outpatient|station|park|plaza|square|corner|way)\b[^.]{0,150}?\bas the\b/i,
  },
  { reason: 'naming', pattern: /\bco-?nam(?:e|es|ed|ing)\b/i },
  {
    reason: 'commemorative',
    pattern:
      /\b(?:commemorat\w*|proclamations?|proclaim\w*|congressional gold medal|in (?:honor|memory|recognition) of|memorializ\w*)\b/i,
  },
  {
    reason: 'commemorative',
    pattern:
      /^(?:a resolution |resolution )?(?:honoring|commending|congratulating|recognizing|celebrating|mourning|remembering|expressing (?:support|condolences|gratitude|appreciation))\b/i,
  },
  {
    reason: 'observance',
    pattern: /\b(?:awareness|appreciation|heritage|history|remembrance|recognition|pride) (?:day|week|month|year)\b/i,
  },
  {
    reason: 'observance',
    pattern: /\b(?:designat|declar|proclaim|recogniz)\w*\b[^.]{0,150}?\bas\b[^.]{0,80}?\b(?:day|week|month)\b/i,
  },
  {
    reason: 'procedural',
    pattern:
      /\b(?:closed session|approval of (?:the )?(?:minutes|agenda)|minutes of the|meeting (?:calendar|schedule)|legislative (?:priorities|agenda|program)|rules of (?:order|procedure)|technical (?:and conforming )?amendments?|correcting amendments?|closing of (?:executive )?departments|emergency executive order no\.?\s*\d+\.\d+)/i,
  },
  {
    reason: 'appointment',
    pattern:
      /\b(?:re)?appoint(?:s|ed|ing)\b|\b(?:board|commission|committee|council|cabinet|staff|administration|leadership|judicial|key)\s+appointments?\b|\bappointments? (?:to|of)\b|\b(?:sworn in|swears in)\b/i,
  },
  {
    reason: 'appointment',
    kinds: NEWS,
    pattern:
      /\bnominat(?:es|ed|ions?)\b|\b(?:named|to serve as|selected as|tapped as) (?:the )?(?:[\w.'-]+ ){0,4}(?:mayor|director|commissioner|chief|chair\w*|secretary|deputy|manager|administrator|president|superintendent|judge)\b/i,
  },
  // News feeds also carry items that are never actions.
  {
    reason: 'not an action',
    kinds: NEWS,
    pattern:
      /^(?:transcript|full remarks|statement|readout|media advisory|public schedule|watch|video|photos?|listen)\b|\bagenda\b[^.]{0,40}\bavailable\b|\bupcoming meetings?\b|\boffices? (?:will be |to be |to )?close[ds]?\b|\bclosed? in observance\b|\b(?:locations?|offices?|facilities|buildings?) (?:will be |are )?closed\b|\b(?:operating|holiday|trash|refuse) (?:schedule|hours)\b/i,
  },
  {
    reason: 'police blotter',
    kinds: NEWS,
    pattern:
      /^(?:commonwealth|cw) v\.?\s|\b(?:found safe|missing (?:person|juvenile|teen|man|woman|child|endangered)|arrests? (?:made|in)|arrested|arrests (?:two|three|\w+ suspects?)|charged|police charge|(?:man|woman|teen|juvenile|driver|pedestrian|cyclist|motorcyclist) (?:dies|killed|injured)|sentenced|convicted|homicide|murder|stabbing|shooting investigation|fatal (?:crash|shooting)|suspects?|seek(?:s|ing)? (?:additional )?(?:victims|witnesses))\b/i,
  },
  {
    reason: 'event listing',
    kinds: NEWS,
    pattern:
      /\b(?:workshop|festival|craft show|concert|parade|tree lighting|auction|job fair|career fair|open house|kick off|newsletter|luncheon|tickets available|awards ceremony)\b/i,
  },
];

export function ceremonialReason(c: Candidate): string | null {
  if (c.kind === 'recap') return null; // judged item by item once it's split
  for (const rule of RULES) {
    if (rule.kinds && !rule.kinds.includes(c.kind)) continue;
    if (rule.pattern.test(c.title)) return rule.reason;
  }
  return null;
}

export const isCeremonial = (c: Candidate): boolean => ceremonialReason(c) !== null;
