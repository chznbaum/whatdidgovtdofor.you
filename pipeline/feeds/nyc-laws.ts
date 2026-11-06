// NYC Council introductions enacted as Local Laws, from the Council's Legistar Web API.
//   The nyc client needs a free token (https://council.nyc.gov/legislation/api/): NYC_LEGISTAR_TOKEN.
import { legistarFeed } from './legistar.ts';

// "2024/018" -> "Local Law 18 of 2024"
function localLaw(n: string | null): string | undefined {
  const m = n?.match(/(\d{4})\D+(\d+)/);
  return m ? `Local Law ${Number(m[2])} of ${m[1]}` : (n ?? undefined);
}

export const nycLaws = legistarFeed({
  id: 'nyc-laws',
  description: 'NYC Council introductions enacted as Local Laws (Legistar Web API)',
  client: 'nyc',
  place: 'nyc',
  site: 'https://legistar.council.nyc.gov',
  tokenEnv: 'NYC_LEGISTAR_TOKEN',
  dateField: 'MatterEnactmentDate',
  filter: "MatterTypeName eq 'Introduction'",
  sponsors: true,
  include: (m) => Boolean(m.MatterEnactmentNumber) || /enacted/i.test(m.MatterStatusName ?? ''),
  kind: () => 'law',
  // "Int 0360-2024" -> "nyc-int-2024-0360"
  key: (m) => {
    const f = String(m.MatterFile).match(/Int\.?\s*(\d+)(?:-[A-Z])?-(\d{4})/i);
    return f ? `nyc-int-${f[2]}-${f[1].padStart(4, '0')}` : `nyc-matter-${m.MatterId}`;
  },
  title: (m) => m.MatterName || m.MatterTitle,
  extra: (m) => ({ localLaw: localLaw(m.MatterEnactmentNumber) }),
});
