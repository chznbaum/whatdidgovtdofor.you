// What the share images (/og/*.png) have in common: the fonts, a tiny element builder for satori, the status marks,
// ink drawings as PNG data, and the render to a 1200×630 PNG.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import sharp from 'sharp';
import type { Mark } from './status.ts';

export const ORANGE = '#ff7a00';
export const WIDTH = 1200;
export const HEIGHT = 630;

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
export const markUri = (m: Mark, color = '#000') =>
  `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${MARK_SVG[m].replaceAll('#000', color)}</svg>`).toString('base64')}`;

export type Node = { type: string; props: Record<string, unknown> };
export const h = (style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type: 'div',
  props: { style: { display: 'flex', boxSizing: 'border-box', ...style }, children: children.length === 1 ? children[0] : children },
});
export const img = (src: string, style: Record<string, unknown>): Node => ({ type: 'img', props: { src, style } });

// An ink drawing from public/ (e.g. /portraits/<id>.webp) as PNG data, `size` pixels square: satori can't read webp.
export async function portraitUri(path: string, size: number) {
  const png = await sharp(join(process.cwd(), 'public', path)).resize(size).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

export async function render(tree: Node): Promise<Response> {
  const svg = await satori(tree as any, { width: WIDTH, height: HEIGHT, fonts: await fonts });
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
