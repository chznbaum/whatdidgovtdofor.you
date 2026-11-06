// Prompts and output schemas for the writer and verifier. Both quote docs/content-guide.md verbatim,
// so editing the guide changes what the models produce.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CONTENT, ROOT, listFiles, idFromPath, readMarkdown, readYaml } from './lib/content.ts';

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

const today = () => new Date().toISOString().slice(0, 10);

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
  const entries = await Promise.all(
    (await listFiles(join(CONTENT, 'entries'), '.md')).map(async (f) => {
      const { data } = await readMarkdown(f);
      return `${data.source_key ?? idFromPath(f)}: ${data.title}`;
    }),
  );
  return { guide, example, places, officials: officials.join('\n'), entries: entries.join('\n') };
}

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
   - Use existing official ids where they match. For anyone else you credit, add them to new_officials with a complete YAML file per the guide.
   - Set verification to: writer: { model: ${model}, via: ${via}, date: ${today()} } and verdict: pending.
   - Set source_key: ${(candidate as any).key ?? 'a stable id for the action'}.
   - The slug is lowercase kebab-case describing the impact. Prefix state and local slugs with the place (ny-, nyc-, va-, norfolk-, …).
3. Accuracy beats coverage. If you can't verify the core claim, skip it and say why.`;
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

Return:
- "pass" if everything checks out. Minor style preferences don't count as problems.
- "corrected" if there were fixable errors. Return the full corrected file in the same format, changing only what's wrong. Keep verification.writer as it is and leave verdict: pending (we set the verdict ourselves). List every correction in problems.
- "fail" if the core claim is false or unverifiable, or the action doesn't qualify under the guide.
notes: one or two plain sentences for readers about what you checked or changed, e.g. "Confirmed both roll calls and the $35 cap; updated the status date."`;
}
