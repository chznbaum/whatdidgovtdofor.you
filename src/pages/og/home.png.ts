// The site's own share image, also the default for pages without one: the home page's question, answered by the
// home page's lead person (getLead), whose head rises out of an ink band that says what they did. Chosen from designer
// samples on 2026-11-12 ("Cover 1", design-samples/home-og/claude-cover/).
import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { getEntries, getLead } from '../../lib/data.ts';
import { ROLE_BYLINE, initials, nameWithParty } from '../../lib/format.ts';
import { ORANGE, h, img, portraitUri, render, type Node } from '../../lib/og.ts';

export const GET: APIRoute = async () => {
  const lead = await getLead(await getEntries());
  const credit = lead.data.credit[0];
  const person = (await getEntry(credit.official))!;
  const answer = `${lead.data.title}. ${ROLE_BYLINE[credit.role]} ${nameWithParty(person.data)}.`;

  // Painted in source order: the question, then the band, then the drawing in front of both, so the head breaks out
  // of the band and rises beside the question.
  let art: Node;
  if (person.data.portrait) {
    art = img(await portraitUri(person.data.portrait.image, 590), { position: 'absolute', left: 610, top: 40, width: 590, height: 590 });
  } else if (person.data.kind === 'body') {
    art = h({ position: 'absolute', left: 780, top: 150, width: 380, fontFamily: 'Young Serif', fontSize: 70, lineHeight: 0.95, letterSpacing: -2 }, person.data.name);
  } else {
    art = h({ position: 'absolute', right: 40, top: 150, fontFamily: 'Young Serif', fontSize: 260, lineHeight: 1, letterSpacing: -9 }, initials(person.data.name));
  }

  return render(
    h(
      { position: 'relative', width: 1200, height: 630, background: ORANGE, color: '#000', fontFamily: 'Libre Franklin', overflow: 'hidden' },
      h({ position: 'absolute', left: 98, top: 50, fontSize: 26, fontWeight: 800 }, 'whatdidgovtdofor.you'),
      h(
        { position: 'absolute', left: 98, top: 98, flexDirection: 'column', fontFamily: 'Young Serif', fontSize: 112, lineHeight: 0.9, letterSpacing: -3.3 },
        h({}, 'What did'),
        h({}, 'government'),
        h({}, 'do for you?'),
      ),
      h(
        { position: 'absolute', left: 0, top: 476, width: 1200, height: 154, padding: '27px 0 0 98px', background: '#000', color: '#fff' },
        h({ width: 640, fontSize: answer.length > 120 ? 24 : 27, fontWeight: 600, lineHeight: 1.24 }, answer),
      ),
      art,
    ),
  );
};
