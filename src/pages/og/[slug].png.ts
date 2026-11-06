// Share images: each action's sign at 1200×630, rendered at build time.
import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { entrySlug, getEntries, type Entry } from '../../lib/data.ts';
import { ROLE_BYLINE, nameWithParty, primaryCredit } from '../../lib/format.ts';
import { TONE, plaqueText } from '../../lib/status.ts';

const COLORS = {
  guide: { bg: '#006a4e', fg: '#ffffff' },
  work: { bg: '#f47b20', fg: '#000000' },
  warning: { bg: '#ffc72c', fg: '#000000' },
  stop: { bg: '#b5121b', fg: '#ffffff' },
};

const font = (weight: number) =>
  readFile(new URL(`../../../node_modules/@fontsource/overpass/files/overpass-latin-${weight}-normal.woff`, import.meta.url));
const fonts = Promise.all([600, 700, 800].map(async (weight) => ({ name: 'Overpass', data: await font(weight), weight: weight as 600 | 700 | 800 })));

type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown } };
const h = (style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type: 'div',
  props: { style: { display: 'flex', boxSizing: 'border-box', ...style }, children: children.length === 1 ? children[0] : children },
});

export async function getStaticPaths() {
  return (await getEntries()).map((entry) => ({ params: { slug: entrySlug(entry) }, props: { entry } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: Entry };
  const d = entry.data;
  const c = COLORS[TONE[d.status.state]];
  const place = await getEntry(d.jurisdiction);
  const credit = primaryCredit(d.credit);
  const official = await getEntry(credit.official);
  const byline = official ? `${ROLE_BYLINE[credit.role]} ${nameWithParty(official.data)}` : '';
  const titleSize = d.title.length > 60 ? 62 : d.title.length > 40 ? 72 : 84;
  const top = d.impact[0];

  const tree = h(
    { width: 1200, height: 630, background: '#dce4e9', padding: '70px 56px 40px', flexDirection: 'column', fontFamily: 'Overpass' },
    // Sign with its exit tab.
    h(
      { position: 'relative', flexDirection: 'column', flexGrow: 1 },
      h(
        { position: 'absolute', top: -46, right: 40, background: c.bg, padding: '7px 7px 0', borderRadius: '14px 14px 0 0' },
        h(
          { border: `4px solid ${c.fg}`, borderBottom: 'none', borderRadius: '9px 9px 0 0', padding: '4px 18px 2px', color: c.fg, fontSize: 28, fontWeight: 800 },
          place?.data.short ?? '',
        ),
      ),
      h(
        { flexGrow: 1, background: c.bg, borderRadius: 26, padding: 9 },
        h(
          { flexGrow: 1, flexDirection: 'column', justifyContent: 'space-between', border: `6px solid ${c.fg}`, borderRadius: 18, padding: '36px 48px 34px', color: c.fg },
          h({ fontSize: titleSize, fontWeight: 700, lineHeight: 1.02, letterSpacing: -1.5 }, d.title),
          h(
            { flexDirection: 'column' },
            // The top impact figure, laid out like a distance sign.
            h(
              { justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `5px solid ${c.fg}`, paddingTop: 18, gap: 32 },
              h({ fontSize: 30, fontWeight: 600, lineHeight: 1.15, maxWidth: 640 }, top.label.charAt(0).toUpperCase() + top.label.slice(1)),
              h({ fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: -1 }, top.figure),
            ),
            h({ fontSize: 28, fontWeight: 600, marginTop: 16 }, byline),
          ),
        ),
      ),
    ),
    // Supplemental plaque and site name.
    h(
      { justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
      h(
        { background: c.bg, borderRadius: 14, padding: 6 },
        h({ border: `3px solid ${c.fg}`, borderRadius: 9, padding: '6px 16px 2px', color: c.fg, fontSize: 26, fontWeight: 700 }, plaqueText(d)),
      ),
      h({ fontSize: 30, fontWeight: 800, color: '#000' }, 'whatdidgovtdofor.you'),
    ),
  );

  const svg = await satori(tree as any, { width: 1200, height: 630, fonts: await fonts });
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
