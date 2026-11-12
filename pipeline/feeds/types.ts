// Shared shapes for the sourcing layer. Feeds turn machine-readable government sources into
// candidates (raw actions); the triage/drafting stage turns candidates into entries.

export type Candidate = {
  key: string; // stable id, unique across all feeds, e.g. "us-law-119-21", "va-2026-hb1", "nyc-int-2024-0360"
  feed: string; // feed id that produced it
  level: 'federal' | 'state' | 'local';
  jurisdiction: string; // place id: us | ny | nyc | va | norfolk | virginia-beach | chesapeake | portsmouth | suffolk | hampton | newport-news | ...
  places?: string[]; // other place ids with a local footprint, e.g. a federal grant to Norfolk: jurisdiction us, places [norfolk]
  kind: 'law' | 'executive-order' | 'regulation' | 'ordinance' | 'press-release' | 'other';
  title: string;
  date: string; // YYYY-MM-DD (enacted / signed / published)
  url: string; // human-readable canonical page
  summary?: string; // any descriptive text the feed provides (truncate to ~1500 chars)
  extra?: Record<string, unknown>; // e.g. sponsors, identifiers, vote info if the feed has it
  seen?: string; // YYYY-MM-DD the candidate first landed in pipeline/state/candidates.json
};

export type FeedOptions = { since: string /* YYYY-MM-DD */; limit?: number };

export type Feed = {
  id: string;
  description: string;
  needsKey?: string;
  fetch(opts: FeedOptions): Promise<Candidate[]>;
};
