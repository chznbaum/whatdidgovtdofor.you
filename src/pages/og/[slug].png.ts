// Share images: each action as a 1200×630 cover, rendered at build time. The key person's ink drawing stands on
// orange next to what they did, who they are, and where it stands. No drawing: initials. A body: its name.
import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { entrySlug, getEntries, type Entry } from '../../lib/data.ts';
import { ROLE_BYLINE, coverCredits, initials, nameWithParty } from '../../lib/format.ts';
import { ORANGE, h, img, markUri, portraitUri, render, type Node } from '../../lib/og.ts';
import { MARK, statusText } from '../../lib/status.ts';

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
    art = img(await portraitUri(key.data.portrait.image, 560), { width: 560, height: 560, position: 'absolute', right: -40, bottom: -40 });
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

  return render(tree);
};
