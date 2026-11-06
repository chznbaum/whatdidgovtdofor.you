# Design

**Subject:** a public record of concrete things government did for people, each one traceable to the officials responsible.
**Audience:** ordinary constituents, usually arriving on a phone from a shared link; also the people sharing it.
**Primary job:** make one government action legible in five seconds (what it does for you, who did it, whether it still stands), with proof one tap away.

## Concept: project signs

Government already has a visual language for "this was done for you": the highway guide sign and the *Your tax dollars at work* / *Investing in America* project sign. People drive past them every day without reading them. We take that vernacular and make it impossible to miss.

The sign vernacular has rules, and we use them for meaning, never decoration:

| Sign element | MUTCD meaning | Our meaning |
| --- | --- | --- |
| Green guide sign, white legend | Guidance, destinations | Action **in effect**, or a one-time benefit **delivered** |
| Orange construction sign, black legend | Work zone | **Phasing in**, being rolled out |
| Yellow warning sign, black legend | Hazard ahead | **Under threat**, a named effort would end it |
| Red regulatory sign, white legend | Stop / prohibition | **Ended** (repealed, expired, blocked, cancelled) |
| Supplemental plaque under a sign | Qualifies the sign above, same colors | Status detail ("In effect since Jan. 2023") |
| Exit tab on top edge | Which exit | Which government acted (US, NY, NYC, VA, Norfolk…) |
| Distance sign (name left, number right) | Miles to each place | Places, with the number of actions on record |
| Inset white border, rounded corners | Standard sign construction | Every sign panel |

## Tokens

Color (sign colors tuned for screen contrast; all legend pairs ≥ 6:1):

| Name | Hex | Use |
| --- | --- | --- |
| guide | `#006A4E` | In-effect signs, links |
| work | `#F47B20` | Phasing-in signs |
| warning | `#FFC72C` | Under-threat signs |
| stop | `#B5121B` | Ended signs |
| sky | `#DCE4E9` | Page ground behind signs |
| paper | `#FFFFFF` | Reading surfaces, sign legends on dark signs |
| ink | `#000000` | Text, legends on yellow and orange |
| steel | `#59646B` | Posts, secondary text |

Status is the *only* thing color encodes. Party is shown as text, (D) and (R), and never as red or blue, which would collide with the status colors.

Type:
- **Overpass** (open-source descendant of Highway Gothic): every sign legend, heading, number, and UI label. Mixed case, as on modern guide signs. Bold for legends and tabular figures for numbers.
- **Source Serif 4**: the fine print (explanations, sources, methods). Signs carry the headline; paper carries the detail.
- Scale (px): 14 · 16 · 19 (body serif) · 22 · 28 · 36 · 48 · 64 · 84.

Layout: left-aligned throughout, like sign legends. Reading columns max out at about 68ch. Signs size to their content within a grid; the hero is the only full-bleed composition.

## Principles

1. **Readable at highway speed.** Headlines are the impact in plain words. If it takes two reads, rewrite it.
2. **Color means status.** Never use the sign colors as decoration.
3. **Credit is personal.** Names and parties, not "the government."
4. **Proof is one tap away.** Every sign links to its sources, votes, and how we checked it.
5. **Sign for the headline, paper for the fine print.**

## The one bold thing

The hero: a full guide sign asking *What did government do for you?*, with the address lookup built into its face. Next to it is a distance sign listing each place and how many actions are on record there. Everything else stays quiet and consistent.

## Avoid (checked against generic defaults)

- No drop shadows, gradients, or glow: real signs are flat.
- No all-caps eyebrow labels, monospace data labels, or "→" appended to links. Arrows appear only where a sign would use them.
- No per-section entrance animations. The only motion responds to the lookup (results arriving).
- No party colors.

## Notes from iterations

- v1 (2026-11-05): first build. What worked: the distance sign's counts in the hero, the exit tab as "which government", and plaques for status. At 50+ signs the page reads as a lively highway rather than a card grid, because status colors vary and signs size to their legends.
- Added a `delivered` status (green) for one-time benefits like rebate checks. Calling them "expired" put them under "Already taken away", which was false.
- Home sections dedupe top to bottom, and every under-threat sign gets its own section.
- 404 is a white "Road closed" plate. An orange detour sign was tempting, but orange means "phasing in."
- On narrow screens the impact figure moves above its label so the number leads.
- Ideas not yet tried: a night/dark mode (signs as retroreflective panels on a dark sky), a printable one-page "receipt" of your officials' records, and per-official share images.
