# Design: Faces first

**Audience:** working people who don't follow the news, usually arriving on a phone from a link someone shared.
**Job:** in five seconds, show what government did for them, who did the work, and whether it still stands. Proof is one tap away.
**Reference:** the round-2 "Faces first" sample (chosen Nov. 2026), kept locally in `design-samples/r2-1-faces/`, which is gitignored because the samples include private copies of source photos.

## Concept

Every action is a cover story, and the cover star is the person who did the work. Their face is drawn in ink, cut out, and set on hi-vis orange. What they did for you sits right next to the face, and where it stands sits right under it. One ink hand draws every official the same way, so from cover to cover the only thing that changes is the person.

The signature move: **heads break the frame.** A cut-out head rises out of its orange tile, or in front of the type it belongs to. It's the one bold thing. Everything around it stays plain.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--orange` | `#FF7A00` | The ground every portrait stands on, and covers. Hi-vis, the color of work vests and cones. Hue 29°, off the red/blue party axis. |
| `--ink` | `#000000` | Type, the drawings, and the band that carries the deed. Ink on orange is 8:1. |
| `--paper` | `#FFFFFF` | Reading surfaces and the inside of every drawing. |
| `--muted` | `#444444` | Secondary text on paper only. Never on orange. |

That's the whole palette. No other hues, no tints, no gradients.

## Type

- **Young Serif** (display, self-hosted via `@fontsource/young-serif`): headlines, names, big numbers. Its thick-thin strokes echo the pen line. One weight. **Lining figures are forced site-wide**, because its defaults are old-style and "12 weeks" has to stand tall. (Satori doesn't apply this, so the share images still show old-style figures.)
- **Libre Franklin** (text and interface, `@fontsource/libre-franklin` 400–800): body, labels, buttons, status words.
- Sizes: body 17px; nothing that keeps a claim true goes under 16px on a phone. Covers set the title by length (three sizes) so long titles still fit.
- Sentence case everywhere. No eyebrows, no all-caps labels, no monospace.

## Layout

- **Cover (action pages):** orange. It carries a place-and-type line ("Virginia law, April 2026"), the title, and the art rising from the bottom edge. On desktop the cover sits on the left; on the right is an ink column with the role ("Carried by"), the names, and the impact figures, then a paper block with the status and the signer.
- **Lists:** each card is an orange tile with a head breaking out of its top, then the title, a byline, and the status. Rows on a phone, a grid of faces from about 640px.
- **The record** (body, everyone credited, votes, sources, how we checked) goes on paper below, in a readable column (≤ 66ch).
- Left-aligned throughout. Tap targets ≥ 44px.

## Who's on the cover

- The key person is `credit[0]`. A second person joins only when `credit[1]` did the same job (two chief patrons, two lead sponsors), never the signer. And only when both are drawn or both are initials, so a co-sponsor's face never upstages a key person who has no photo.
- Bylines are phrased by role (`ROLE_BYLINE` in `src/lib/format.ts`). A sponsor "carried" it, a mayor "proposed" it, a board "issued" it.
- **The signer is always last and lighter:** "Signed into law by…" in small text with a small face, after the status. Never on the cover.

## Status

Status never uses hue. Each state is a shape plus words, and the shape never appears without them (`src/lib/status.ts`, `StatusMark.astro`):

| Shape | States | Words |
| --- | --- | --- |
| Filled disc | in-effect, delivered | "Working now." / "Delivered." |
| Half disc | phasing-in | "Law now. Benefits start Dec. 1, 2028." when the start date is ahead, and "Rolling out. Not everyone has it yet." once it has started. "Law now." is for laws only; a budget is "Funded.", a rule "Rule adopted." |
| Disc with a wedge cut out, on an inverted ink band | under-threat | "Under threat." plus the full note (it holds the words that keep it accurate, like "nonbinding" or "the judge said he couldn't halt it") and an as-of date |
| Open ring | repealed, expired, blocked, cancelled | The state's name, plus the note |

Status is never phrased to suggest people have something they don't have yet.

## Portraits

1. **Draw only from a real photo of that person.** Never invent a face. No photo: show their initials in Young Serif on the orange tile. A body (a council, a board): its name, set the same way. The validator rejects a portrait on a body.
2. **Keep their real coloring and likeness.** The ink style changes how a face is rendered, not who it is. Hatching density follows the photo's values, so hair and skin keep their true lightness relative to each other. Gray stays light. Deeper skin gets denser, even hatching, never a flat black face. No caricature, no widened smiles.
3. **Visibly drawn, never photoreal.** Crisp dip-pen line and hatching, no gray wash, no stipple. If a drawing could pass for the photo, redraw it.
4. **One hand for everyone.** Same style prompt, same framing (`pipeline/portraits/`). Clothes become outline, so no suit, tie, or flag can read as a party color.
5. **Honest labels.** Say "Illustration from official portrait" only when `portrait.kind: official` (a Congress bioguide portrait; the validator enforces this). Everything else says "Illustration from photo". The original is one tap away, on the page it came from: every drawing carries a link that names the source, e.g. "See the photo (Senate of Virginia)", and opens that page (the bioguide, member, Commons file, or press page; never a bare image file) in a new tab. With several faces, each source gets its own link. The site never republishes a source photo, whatever its license; the downloaded copy is a private drawing reference (`pipeline/portraits/SOURCING.md`).
6. **Check every new drawing side by side with its photo** before it ships. How to draw someone: `pipeline/portraits/README.md`.

## Motion

Only motion that reveals something, played once, and skipped under `prefers-reduced-motion`. The reference sample has two moves: the face rising into frame after the question, and the veto history drawing year by year. Neither is built into the site yet.

## Banned

- Party colors, ever. Party appears as text: (D), (R). No status hue on the red/blue axis.
- Any second accent color, gradients, glow, glassmorphism, drop shadows, rounded cards, pill badges, `border-left` accent stripes.
- The v1 road-sign kit: sign panels, exit tabs, plaques, Overpass.
- All-caps eyebrows, section numbering, monospace metadata, "→" on links, drop caps, decorative dividers.
- Generic AI illustration: corporate-Memphis people, 3D renders, gouache or oil "portrait filter" looks, caricature.
- Self-narrating microcopy, "Not X, but Y", tagline triplets, calling laws "wins".
- Decorative scroll fades or entrance animations on every section.
