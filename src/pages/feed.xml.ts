// The whole site's feed: every action, newest added first (src/lib/feed.ts).
import type { APIRoute } from 'astro';
import { getEntries } from '../lib/data.ts';
import { rss } from '../lib/feed.ts';

export const GET: APIRoute = async () =>
  rss({
    title: 'What did government do for you?',
    page: '/',
    feed: '/feed.xml',
    description: 'Concrete things government did for people, who made them happen, and whether they still stand.',
    entries: await getEntries(),
  });
