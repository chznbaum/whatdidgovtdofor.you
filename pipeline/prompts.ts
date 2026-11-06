// Prompts and output schemas for the writer and verifier. Both quote docs/content-guide.md verbatim,
// so editing the guide changes what the models produce.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CONTENT, ROOT, listFiles, idFromPath, readAllEntries, readYaml } from './lib/content.ts';

// OpenAI structured outputs need strict schemas: every property required, no extras.
const officialsArray = {
  type: 'array',
  description: 'Officials or bodies the entry references that do not exist yet. Empty if none.',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'yaml'],
    properties: {
      id: { type: 'string', description: 'lowercase-slug id, e.g. tim-kaine' },
      yaml: { type: 'string', description: 'complete YAML file for src/content/officials/<id>.yaml' },
    },
  },
};

export const WRITER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['decision', 'reason', 'slug', 'file', 'new_officials'],
  properties: {
    decision: { type: 'string', enum: ['draft', 'skip'] },
    reason: { type: 'string', description: 'One sentence: why it qualifies or why it was skipped.' },
    slug: { type: ['string', 'null'], description: 'File name without .md; null when skipping.' },
    file: { type: ['string', 'null'], description: 'The complete entry file (YAML frontmatter + body); null when skipping.' },
    new_officials: officialsArray,
  },
};

export const VERIFIER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'notes', 'problems', 'file', 'new_officials'],
  properties: {
    verdict: { type: 'string', enum: ['pass', 'corrected', 'fail'] },
    notes: { type: 'string', description: 'One or two sentences for readers: what you checked or changed.' },
    problems: { type: 'array', items: { type: 'string' }, description: 'Each error found, with the evidence.' },
    file: { type: ['string', 'null'], description: 'Full corrected entry file when verdict is corrected; otherwise null.' },
    new_officials: officialsArray,
  },
};

export const TRIAGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'decision', 'reason'],
        properties: {
          key: { type: 'string' },
          decision: { type: 'string', enum: ['draft', 'skip'] },
          reason: { type: 'string', description: 'A few words.' },
        },
      },
    },
  },
};

export type TriageOutput = { results: { key: string; decision: 'draft' | 'skip'; reason: string }[] };

export type WriterOutput = {
  decision: 'draft' | 'skip';
  reason: string;
  slug: string | null;
  file: string | null;
  new_officials: { id: string; yaml: string }[];
};

export type VerifierOutput = {
  verdict: 'pass' | 'corrected' | 'fail';
  notes: string;
  problems: string[];
  file: string | null;
  new_officials: { id: string; yaml: string }[];
};

const today = () => new Date().toLocaleDateString('en-CA');

async function context() {
  const guide = await readFile(join(ROOT, 'docs/content-guide.md'), 'utf8');
  const example = await readFile(join(CONTENT, 'entries/federal/medicare-insulin-35-cap.md'), 'utf8');
  const places = (await listFiles(join(CONTENT, 'places'), '.yaml')).map(idFromPath).join(', ');
  const officials = await Promise.all(
    (await listFiles(join(CONTENT, 'officials'), '.yaml')).map(async (f) => {
      const o = await readYaml(f);
      return `${idFromPath(f)}: ${o.name}${o.party ? ` (${o.party})` : ''}, ${o.office}`;
    }),
  );
  const entries = (await readAllEntries()).map(({ file, data }) => `${data.source_key ?? idFromPath(file)}: ${data.title}`);
  return { guide, example, places, officials: officials.join('\n'), entries: entries.join('\n') };
}

// Both models forgot this in testing, so it's spelled out in every prompt.
export const OFFICIALS_RULE = `Every official id you use (in credit, status.by, votes[].members, or votes[].tie_breaker) must either appear in official_ids or have a complete YAML file in new_officials. Agencies and boards count: create them as kind: body.`;

const ROSTERS = `Rosters for ids: src/data/roster/federal.json (bioguide ids for current members of Congress), src/data/roster/state-va.json and state-ny.json (openstates ids for current state legislators). You can read these files.`;

export async function writerPrompt(candidate: object, model: string, via: string): Promise<string> {
  const c = await context();
  return `You write entries for whatdidgovtdofor.you. Today is ${today()}. Your working directory is the site's repository.

<content_guide>
${c.guide}
</content_guide>

<example_entry>
${c.example}
</example_entry>

<candidate>
${JSON.stringify(candidate, null, 2)}
</candidate>

<existing_entries>
${c.entries}
</existing_entries>

<place_ids>${c.places}</place_ids>

<official_ids>
${c.officials}
</official_ids>

${ROSTERS}

Your job:
1. Decide whether the candidate qualifies under "What qualifies" in the guide. Skip it if it's ceremonial, procedural, only proposed, has no direct effect on people, or duplicates an existing entry. To skip, return decision "skip", a one-sentence reason, and null slug and file.
2. If it qualifies, research it with web search, open the primary sources, and write ONE complete entry file in exactly the example's format (YAML frontmatter, then the body).
   - Every number, vote tally, and status claim must come from a source you opened, and that source must be in the entry.
   - Check the CURRENT status as of today, not just the enactment news.
   - Use existing official ids where they match. ${OFFICIALS_RULE}
   - Set verification to: writer: { model: ${model}, via: ${via}, date: ${today()} } and verdict: pending.
   - Set source_key: ${(candidate as any).key ?? 'a stable id for the action'}.
   - The slug is lowercase kebab-case describing the impact. Prefix state and local slugs with the place (ny-, nyc-, va-, norfolk-, …).
3. Accuracy beats coverage. If you can't verify the core claim, skip it and say why.`;
}

// Cheap first pass over many candidates at once: no web search, just the qualification rules.
export async function triagePrompt(candidates: any[]): Promise<string> {
  const c = await context();
  const rules = c.guide.match(/## What qualifies[\s\S]*?(?=\n## )/)?.[0] ?? '';
  const list = candidates.map((x) => ({
    key: x.key,
    where: x.jurisdiction,
    kind: x.kind,
    date: x.date,
    title: x.title,
    summary: (x.summary ?? '').slice(0, 400),
  }));
  return `You screen candidate government actions for whatdidgovtdofor.you, a site about concrete things government did for people. Decide for each candidate whether it is worth researching as an entry.

${rules}

Mark "draft" only when the item itself is (or clearly announces) an enacted, signed, funded, or ordered action with a direct, tangible effect on people. Press releases about events, appointments, closures, ribbon-cuttings, awards, and routine administrative items are "skip". Also skip anything that duplicates an existing entry:

<existing_entries>
${c.entries}
</existing_entries>

<candidates>
${JSON.stringify(list, null, 1)}
</candidates>

Return one result per candidate key.`;
}

export async function verifierPrompt(file: string, text: string): Promise<string> {
  const c = await context();
  return `You are the independent fact-checker for whatdidgovtdofor.you. A model from a different company wrote the entry below. Today is ${today()}. Your working directory is the site's repository.

<content_guide>
${c.guide}
</content_guide>

<entry path="${file}">
${text}
</entry>

<place_ids>${c.places}</place_ids>

<official_ids>
${c.officials}
</official_ids>

${ROSTERS}

Check every factual claim using web search and the cited sources:
- title, dek, who_benefits, and body: true, and no stronger than the sources support?
- impact figures: each one appears in a source or follows from one arithmetically?
- action: name, identifier, and dates correct?
- credit: did each person really play that role, and is their party right?
- votes: totals and party breakdowns match the official roll call exactly?
- status: correct as of today? Search specifically for repeal, expiration, court blocks, funding cuts, or extensions since enactment.
- sources: do the URLs exist, and do they support what they're cited for?
- guide compliance: impact-first headline, plain language, no editorializing about parties.

Keep headlines readable at a glance. Change a title only if it is false or materially overstated, and fix it in plain words ("the extra half of overtime pay", not "federally required overtime premiums"). Precise qualifiers and legal terms belong in the dek and body, not the title.

Return:
- "pass" if everything checks out. Minor style preferences don't count as problems.
- "corrected" if there were fixable errors. Return the full corrected file in the same format, changing only what's wrong. Keep verification.writer as it is and leave verdict: pending (we set the verdict ourselves). List every correction in problems. ${OFFICIALS_RULE}
- "fail" if the core claim is false or unverifiable, or the action doesn't qualify under the guide.
notes: one or two plain sentences for readers about what you checked or changed, e.g. "Confirmed both roll calls and the $35 cap; updated the status date."`;
}
