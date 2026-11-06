// Presidential executive orders, from the Federal Register API. EOs rarely carry an abstract,
// so the summary comes from the order's own text (from "Section 1" on).
import { frDocuments } from './federal-register.ts';
import type { Candidate, Feed } from './types.ts';
import { getText, mapLimit, newest, plainText, truncate } from './util.ts';

const FIELDS = [
  'title',
  'document_number',
  'executive_order_number',
  'signing_date',
  'publication_date',
  'html_url',
  'raw_text_url',
  'pdf_url',
  'abstract',
  'president',
  'citation',
  'disposition_notes',
];

// Drop the GPO header and page markers; keep the order itself.
function orderText(raw: string): string {
  const text = plainText(raw.replace(/\[\[Page \d+\]\]/g, ' '));
  const start = text.search(/\bBy the authority vested in me\b|\bSection 1\.\s/);
  return start >= 0 ? text.slice(start) : text;
}

export const usExecutiveOrders: Feed = {
  id: 'us-executive-orders',
  description: 'Presidential executive orders (Federal Register API)',
  async fetch({ since, limit }) {
    const docs = await frDocuments(
      { type: ['PRESDOCU'], presidential_document_type: ['executive_order'] },
      FIELDS,
      since,
      limit,
    );
    const orders: Candidate[] = docs.map((d) => ({
      key: d.executive_order_number ? `us-eo-${d.executive_order_number}` : `us-fr-${d.document_number}`,
      feed: 'us-executive-orders',
      level: 'federal',
      jurisdiction: 'us',
      kind: 'executive-order',
      title: d.title,
      date: d.signing_date ?? d.publication_date,
      url: d.html_url,
      summary: truncate(d.abstract ?? undefined),
      extra: {
        eo: d.executive_order_number ? `E.O. ${d.executive_order_number}` : undefined,
        president: d.president?.name,
        published: d.publication_date,
        citation: d.citation,
        documentNumber: d.document_number,
        notes: d.disposition_notes ?? undefined,
        pdf: d.pdf_url,
        text: d.raw_text_url,
      },
    }));

    await mapLimit(
      orders.filter((c) => !c.summary && c.extra!.text),
      4,
      async (c) => {
        const raw = await getText(c.extra!.text as string).catch(() => '');
        if (raw) c.summary = truncate(orderText(raw));
      },
    );
    return newest(orders, limit);
  },
};
