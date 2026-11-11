// Share images: each action as a 1200×630 cover, rendered at build time. The key person's ink drawing stands on
// orange next to what they did, who they are, and where it stands. No drawing: initials. A body: its name.
import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import sharp from 'sharp';
import { entrySlug, getEntries, type Entry } from '../../lib/data.ts';
import { ROLE_BYLINE, coverCredits, initials, nameWithParty } from '../../lib/format.ts';
import { MARK, statusText, type Mark } from '../../lib/status.ts';

const ORANGE = '#ff7a00';
// Paths from the project root: this module runs from a build chunk, so paths relative to it would break.
const fontFile = (pkg: string, file: string) => readFile(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', file));
const fonts = Promise.all([
  fontFile('young-serif', 'young-serif-latin-400-normal.woff').then((data) => ({ name: 'Young Serif', data, weight: 400 as const })),
  ...([600, 800] as const).map(async (weight) => ({
    name: 'Libre Franklin',
    data: await fontFile('libre-franklin', `libre-franklin-latin-${weight}-normal.woff`),
    weight,
  })),
]);

const MARK_SVG: Record<Mark, string> = {
  full: '<circle cx="10" cy="10" r="8.5" fill="#000"/>',
  half: '<circle cx="10" cy="10" r="7.75" fill="none" stroke="#000" stroke-width="1.5"/><path d="M10 2.25A7.75 7.75 0 0 0 10 17.75Z" fill="#000"/>',
  threat: '<path d="M10 10L17.36 5.75A8.5 8.5 0 1 1 10 1.5Z" fill="#000"/>',
  ring: '<circle cx="10" cy="10" r="7.5" fill="none" stroke="#000" stroke-width="2"/>',
};
const markUri = (m: Mark, color = '#000') =>
  `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${MARK_SVG[m].replaceAll('#000', color)}</svg>`).toString('base64')}`;

type Node = { type: string; props: Record<string, unknown> };
const h = (style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type: 'div',
  props: { style: { display: 'flex', boxSizing: 'border-box', ...style }, children: children.length === 1 ? children[0] : children },
});
const img = (src: string, style: Record<string, unknown>): Node => ({ type: 'img', props: { src, style } });

async function portraitUri(path: string) {
  const png = await sharp(join(process.cwd(), 'public', path)).resize(560).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

export async function getStaticPaths() {
  return (await getEntries()).map((entry) => ({ params: { slug: entrySlug(entry) }, props: { entry } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: Entry };
  const d = entry.data;
  const stars = await Promise.all(coverCredits(d.credit).map(async (c) => ({ ...c, person: (await getEntry(c.official))! })));
  const key = stars[0].person;
  const and = new Intl.ListFormat('en', { type: 'conjunction' });
  const byline = `${ROLE_BYLINE[stars[0].role]} ${and.format(stars.map((s) => nameWithParty(s.person.data)))}`;
  const titleSize = d.title.length > 64 ? 50 : d.title.length > 42 ? 58 : 68;
  const { head } = statusText(d);
  const mark = MARK[d.status.state];

  let art: Node;
  if (key.data.portrait) {
    art = img(await portraitUri(key.data.portrait.image), { width: 560, height: 560, position: 'absolute', right: -40, bottom: -40 });
  } else if (key.data.kind === 'body') {
    art = h({ position: 'absolute', right: 40, bottom: 70, width: 400, fontFamily: 'Young Serif', fontSize: 78, lineHeight: 0.95, letterSpacing: -2 }, key.data.name);
  } else {
    art = h({ position: 'absolute', right: 40, bottom: -36, fontFamily: 'Young Serif', fontSize: 300, lineHeight: 1, letterSpacing: -10 }, initials(key.data.name));
  }

  const tree = h(
    { position: 'relative', width: 1200, height: 630, background: ORANGE, color: '#000', fontFamily: 'Libre Franklin', overflow: 'hidden' },
    art,
    h(
      { flexDirection: 'column', justifyContent: 'space-between', width: 720, height: 630, padding: '44px 0 40px 56px' },
      h(
        { flexDirection: 'column' },
        h({ fontFamily: 'Young Serif', fontSize: titleSize, lineHeight: 1.02, letterSpacing: -1.5 }, d.title),
        h({ fontSize: 28, fontWeight: 600, marginTop: 22, lineHeight: 1.25 }, byline),
      ),
      h(
        { flexDirection: 'column' },
        h(
          {
            alignItems: 'center',
            alignSelf: 'flex-start',
            gap: 14,
            fontSize: 28,
            fontWeight: 800,
            ...(mark === 'threat' ? { background: '#000', color: '#fff', padding: '8px 16px' } : {}),
          },
          img(markUri(mark, mark === 'threat' ? '#fff' : '#000'), { width: 30, height: 30 }),
          head,
        ),
        h({ fontSize: 26, fontWeight: 800, marginTop: 22 }, 'whatdidgovtdofor.you'),
      ),
    ),
  );

  const svg = await satori(tree as any, { width: 1200, height: 630, fonts: await fonts });
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
