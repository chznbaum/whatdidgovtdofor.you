// Hampton Roads city sources. Checked 2026-11-05:
//   Legistar Web API: only Hampton (client "hampton") is live without a token. "norfolkva" exists but
//     is empty; no instance for Virginia Beach, Chesapeake, Portsmouth, Suffolk, or Newport News.
//   News RSS: CivicPlus News Flash for Norfolk, Chesapeake, Suffolk, Hampton, Newport News;
//     Virginia Beach publishes /news.rss. Portsmouth moved to CivicPlus HCMS, which has no public feed.
import { legistarFeed } from './legistar.ts';
import { civicPlusNews, rssFeed } from './rss.ts';
import type { Feed } from './types.ts';

export const hamptonRoadsFeeds: Feed[] = [
  legistarFeed({
    id: 'hampton-council',
    description: 'Hampton City Council ordinances and resolutions passed (Legistar Web API)',
    client: 'hampton',
    place: 'hampton',
  }),
  civicPlusNews('norfolk', 'https://www.norfolk.gov', 'Norfolk'),
  rssFeed({
    id: 'virginia-beach-news',
    description: 'Virginia Beach city news releases (RSS)',
    url: 'https://virginiabeach.gov/news.rss',
    place: 'virginia-beach',
  }),
  civicPlusNews('chesapeake', 'https://www.cityofchesapeake.net', 'Chesapeake'),
  civicPlusNews('suffolk', 'https://www.suffolkva.us', 'Suffolk'),
  civicPlusNews('hampton', 'https://www.hampton.gov', 'Hampton'),
  civicPlusNews('newport-news', 'https://www.nnva.gov', 'Newport News'),
];
