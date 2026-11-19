// When each page last changed, from src/data/lastmod.json (kept by pipeline/lastmod.ts): the date a file's content
// last changed, combined per page with the dates the page itself shows. The sitemap's lastmod and the structured
// data's dateModified both come from here, so they agree.
import record from '../data/lastmod.json';

const stamps = record as Record<string, { hash: string; date: string }>;

// The date a file (a path from the project root, like an entry's filePath) last changed.
export const fileDate = (path: string | undefined): Date | undefined => {
  const stamp = path ? stamps[path] : undefined;
  return stamp ? new Date(stamp.date) : undefined;
};

export const latest = (...dates: (Date | undefined)[]): Date | undefined => {
  const times = dates.filter((d): d is Date => Boolean(d)).map((d) => d.getTime());
  return times.length ? new Date(Math.max(...times)) : undefined;
};
