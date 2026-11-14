// Helpers shared by feeds: HTTP with timeouts, PDF text, HTML/RSS cleanup, and date parsing.
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Candidate } from './types.ts';

export const USER_AGENT = 'Mozilla/5.0 (compatible; whatdidgovtdofor.you-feeds; +https://whatdidgovtdofor.you)';

// Keep API keys out of logs and error messages.
export const redact = (url: string) => url.replace(/((?:api_)?key|token)=[^&]+/gi, '$1=***');

export async function get(url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { 'user-agent': USER_AGENT, ...init.headers },
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${redact(url)}`);
  return res;
}

export const getText = async (url: string, init?: RequestInit) => (await get(url, init)).text();
export const getJson = async (url: string, init?: RequestInit): Promise<any> => (await get(url, init)).json();

// Like getText, but a 404 means "doesn't exist (yet)" and returns null.
export async function getTextIfExists(url: string): Promise<string | null> {
  try {
    return await getText(url);
  } catch (e) {
    if (/^404\b/.test((e as Error).message)) return null;
    throw e;
  }
}

// A PDF's text, laid out as on the page, via poppler's pdftotext (brew install poppler). Pages that are scans without
// a text layer are read with OCR instead (brew install tesseract), up to `ocrPages` of them (OCR takes two or three seconds a
// page); past that, or without tesseract, they come back empty. `until` ends the text at the first page that matches it
// (a minutes book's appendix of full texts).
export async function pdfText(bytes: Uint8Array, { ocrPages = 150, until }: { ocrPages?: number; until?: RegExp } = {}): Promise<string> {
  const run = promisify(execFile);
  const dir = await mkdtemp(join(tmpdir(), 'feed-pdf-'));
  try {
    const file = join(dir, 'file.pdf');
    await writeFile(file, bytes);
    const { stdout } = await run('pdftotext', ['-layout', file, '-'], { maxBuffer: 64 * 1024 * 1024 });
    // pdftotext ends each page with a form feed. A page with almost no letters is a scan (or blank).
    const pages = stdout.split('\f');
    if (pages.at(-1) === '') pages.pop();
    let budget = ocrPages;
    for (let i = 0; i < pages.length && budget > 0; i++) {
      if (until?.test(pages[i])) return pages.slice(0, i).join('\f');
      if ((pages[i].match(/[A-Za-z]/g)?.length ?? 0) >= 40) continue;
      budget--;
      try {
        await run('pdftoppm', ['-r', '300', '-gray', '-png', '-singlefile', '-f', `${i + 1}`, '-l', `${i + 1}`, file, join(dir, 'page')]);
        // --psm 1 detects each page's orientation: clerks scan pages sideways and upside down.
        pages[i] = (await run('tesseract', [join(dir, 'page.png'), '-', '--psm', '1'], { maxBuffer: 16 * 1024 * 1024 })).stdout;
        if (until?.test(pages[i])) return pages.slice(0, i).join('\f');
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') break; // no tesseract: leave scans empty
        throw e;
      }
    }
    const end = until ? pages.findIndex((p) => until.test(p)) : -1;
    return (end < 0 ? pages : pages.slice(0, end)).join('\f');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Run `fn` over `items` with at most `n` in flight.
export async function mapLimit<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  bull: '•',
  middot: '·',
  sect: '§',
  para: '¶',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  frac12: '½',
  eacute: 'é',
  egrave: 'è',
  aacute: 'á',
  ntilde: 'ñ',
  oacute: 'ó',
  iacute: 'í',
  uacute: 'ú',
  ccedil: 'ç',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

// HTML (possibly entity-escaped, as in RSS descriptions) to one line of plain text.
export function plainText(s: string | null | undefined): string {
  if (!s) return '';
  const html = decodeEntities(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'));
  return decodeEntities(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

// HTML to plain text that keeps its paragraphs and list items on their own lines, for long documents a model reads.
export function blockText(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/<!--[\s\S]*?(?:-->|$)/g, ' ') // comments, including one cut off at the end
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/?(?:p|div|li|ul|ol|h\d|br|tr|table|section|article|blockquote)\b[^>]*>/gi, '\n')
    .split('\n')
    .map((line) => plainText(line))
    .filter(Boolean)
    .join('\n');
}

export function truncate(s: string | null | undefined, max = 1500): string | undefined {
  if (!s) return undefined;
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ') > max * 0.8 ? cut.lastIndexOf(' ') : max).trimEnd() + '…';
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// `xml` is the raw item, for feeds that carry extra tags (read them with xmlTag).
export type RssItem = { title: string; link: string; pubDate: string; description: string; guid: string; xml: string };

// Inner text of the first <name> element, CDATA unwrapped; '' if absent.
export function xmlTag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
}

// Regex extractor for RSS 2.0 <item>s; good enough for CivicPlus and similar CMS feeds.
export function rssItems(xml: string): RssItem[] {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(([, item]) => ({
    title: plainText(xmlTag(item, 'title')),
    link: decodeEntities(xmlTag(item, 'link')),
    pubDate: xmlTag(item, 'pubDate'),
    description: xmlTag(item, 'description'),
    guid: decodeEntities(xmlTag(item, 'guid')),
    xml: item,
  }));
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const iso = (y: number | string, m: number, d: number | string) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// "Thu, 05 Nov 2026 17:23:52 -0500" -> "2026-11-05" (the publisher's local date, not UTC).
//   RFC 822 also allows two-digit years ("Tue, 10 Nov 26", as dol.gov sends).
export function rfc822Date(s: string): string | null {
  const m = s.match(/(\d{1,2})\s+([a-z]{3})[a-z]*\s+(\d{4}|\d{2})\b/i);
  const month = m ? MONTHS.indexOf(m[2].toLowerCase()) + 1 : 0;
  return m && month ? iso(m[3].length === 2 ? `20${m[3]}` : m[3], month, m[1]) : null;
}

// "November 5, 2026" / "Nov. 05, 2026" -> "2026-11-05"
export function longDate(s: string): string | null {
  const m = s.match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  const month = m ? MONTHS.indexOf(m[1].toLowerCase()) + 1 : 0;
  return m && month ? iso(m[3], month, m[2]) : null;
}

// "4/8/2026" -> "2026-04-08"
export function mdyDate(s: string): string | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? iso(m[3], Number(m[1]), m[2]) : null;
}

// Local calendar date, YYYY-MM-DD (en-CA formats dates that way).
export const localDate = (d = new Date()) => d.toLocaleDateString('en-CA');
export const today = () => localDate();

// Newest first, capped at `limit`.
export function newest(candidates: Candidate[], limit?: number): Candidate[] {
  const sorted = candidates.sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key));
  return limit ? sorted.slice(0, limit) : sorted;
}
