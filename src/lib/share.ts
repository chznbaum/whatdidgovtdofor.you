// Alt text for the share images (/og/*.png): the words each image carries, and whose ink drawing it shows.
import { getEntry } from 'astro:content';
import { getEntries, getLead, type Entry } from './data.ts';
import { ROLE_BYLINE, coverCredits, nameWithParty } from './format.ts';
import { statusText } from './status.ts';

const and = new Intl.ListFormat('en', { type: 'conjunction' });

// An action's image (src/pages/og/[slug].png.ts): headline, byline, where it stands, and the key person's drawing.
export async function entryShareAlt(entry: Entry): Promise<string> {
  const d = entry.data;
  const stars = await Promise.all(coverCredits(d.credit).map(async (c) => ({ ...c, person: (await getEntry(c.official))! })));
  const byline = `${ROLE_BYLINE[stars[0].role]} ${and.format(stars.map((s) => nameWithParty(s.person.data)))}`;
  const key = stars[0].person.data;
  const head = statusText(d).head.replaceAll(' ', ' ');
  return `${d.title}. ${byline}. ${head}${key.portrait ? ` Ink drawing of ${key.name}.` : ''}`;
}

// The site's image (src/pages/og/home.png.ts), the default for pages without their own: the question, answered by the
// home page's lead action. The same for every page in a build, so it is worked out once.
let home: Promise<string> | undefined;
export function homeShareAlt(): Promise<string> {
  home ??= (async () => {
    const lead = await getLead(await getEntries());
    const credit = lead.data.credit[0];
    const person = (await getEntry(credit.official))!.data;
    const drawing = person.portrait ? ` Ink drawing of ${person.name}.` : '';
    return `What did government do for you? ${lead.data.title}. ${ROLE_BYLINE[credit.role]} ${nameWithParty(person)}.${drawing}`;
  })();
  return home;
}
