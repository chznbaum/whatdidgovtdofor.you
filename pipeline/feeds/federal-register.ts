// Federal Register API client (https://www.federalregister.gov/developers/documentation/api/v1). No key.
import { getJson } from './util.ts';

const API = 'https://www.federalregister.gov/api/v1/documents.json';

// Every document matching `conditions` published on or after `since`, newest first.
export async function frDocuments(
  conditions: Record<string, string | string[]>,
  fields: string[],
  since: string,
  limit = 1000,
): Promise<any[]> {
  const params = new URLSearchParams({ per_page: String(Math.min(limit, 1000)), order: 'newest' });
  params.append('conditions[publication_date][gte]', since);
  for (const [name, value] of Object.entries(conditions)) {
    for (const v of [value].flat()) params.append(`conditions[${name}]${Array.isArray(value) ? '[]' : ''}`, v);
  }
  for (const f of fields) params.append('fields[]', f);

  const docs: any[] = [];
  let url: string | null = `${API}?${params}`;
  while (url && docs.length < limit) {
    const page: any = await getJson(url);
    docs.push(...(page.results ?? []));
    url = page.next_page_url ?? null;
  }
  return docs.slice(0, limit);
}
