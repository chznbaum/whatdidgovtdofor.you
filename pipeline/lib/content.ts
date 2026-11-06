// Read and write content files outside of Astro (pipeline, validation, agents).
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parse, stringify } from 'yaml';

export const ROOT = new URL('../../', import.meta.url).pathname;
export const CONTENT = join(ROOT, 'src/content');

export async function listFiles(dir: string, ext: string): Promise<string[]> {
  const out: string[] = [];
  for (const d of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (d.isFile() && d.name.endsWith(ext)) out.push(join(d.parentPath, d.name));
  }
  return out.sort();
}

export const idFromPath = (file: string) => file.split('/').pop()!.replace(/\.(ya?ml|md)$/, '');
export const rel = (file: string) => relative(ROOT, file);

export type MarkdownDoc = { data: Record<string, any>; body: string };

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseMarkdown(text: string): MarkdownDoc {
  const m = text.match(FRONTMATTER);
  if (!m) throw new Error('missing YAML frontmatter');
  return { data: parse(m[1]) ?? {}, body: text.slice(m[0].length).trim() };
}

export function formatMarkdown({ data, body }: MarkdownDoc): string {
  return `---\n${stringify(data, { lineWidth: 0 }).trim()}\n---\n\n${body.trim()}\n`;
}

export async function readMarkdown(file: string): Promise<MarkdownDoc> {
  return parseMarkdown(await readFile(file, 'utf8'));
}

export async function writeMarkdown(file: string, doc: MarkdownDoc) {
  await writeFile(file, formatMarkdown(doc));
}

export async function readYaml(file: string): Promise<any> {
  return parse(await readFile(file, 'utf8'));
}

export async function loadIds(collection: 'officials' | 'places'): Promise<Set<string>> {
  return new Set((await listFiles(join(CONTENT, collection), '.yaml')).map(idFromPath));
}
