// Significant final rules (EO 12866), from the Federal Register API. Corrections are skipped.
import { frDocuments } from './federal-register.ts';
import type { Feed } from './types.ts';
import { newest, plainText, truncate } from './util.ts';

const FIELDS = [
  'title',
  'document_number',
  'publication_date',
  'effective_on',
  'html_url',
  'abstract',
  'agencies',
  'action',
  'citation',
  'regulation_id_numbers',
  'cfr_references',
];

export const usRules: Feed = {
  id: 'us-rules',
  description: 'Significant final rules (Federal Register API)',
  async fetch({ since, limit }) {
    const docs = await frDocuments({ type: ['RULE'], significant: '1' }, FIELDS, since, limit);
    const rules = docs
      .filter((d) => !/correct|technical amendment/i.test(d.action ?? ''))
      .map((d) => ({
        key: `us-fr-${d.document_number}`,
        feed: 'us-rules',
        level: 'federal' as const,
        jurisdiction: 'us',
        kind: 'regulation' as const,
        title: d.title,
        date: d.publication_date,
        url: d.html_url,
        summary: truncate(plainText(d.abstract)),
        extra: {
          action: d.action,
          agencies: (d.agencies ?? []).map((a: any) => a.name ?? a.raw_name).filter(Boolean),
          effective: d.effective_on ?? undefined,
          citation: d.citation,
          documentNumber: d.document_number,
          rin: d.regulation_id_numbers?.length ? d.regulation_id_numbers : undefined,
          cfr: d.cfr_references?.map((r: any) => `${r.title} CFR ${r.part}`),
        },
      }));
    return newest(rules, limit);
  },
};
