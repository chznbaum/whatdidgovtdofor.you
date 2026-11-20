# Reviewing a run's new portraits

The brief for an independent reviewer of portraits drawn in a run. You didn't draw these and owe the drawers nothing; your job is to catch any portrait that shouldn't ship. Use a model from a different family than the one that drew them. The task gives your list (a file of ids in `RUN/review/`) and your output file (`RUN/review/<name>.md`). ROOT is the checkout you were started in; RUN is the run folder (e.g. `design-samples/run-2026-11-19-portraits/`). Work read-only except for your output file and `/tmp`. Run Python with `ROOT/pipeline/portraits/.venv/bin/python`.

Your verdicts go to the owner, who decides what gets fixed by looking at each flagged face beside its photo. So be accurate rather than thorough-sounding: a `redraw` should be something the owner will see.

## Read first

- `docs/design.md`, "Portraits", and `pipeline/portraits/style.txt`.
- `pipeline/portraits/DRAWING-BRIEF.md`, especially "What passes": it is the bar you hold drawings to.
- `pipeline/portraits/REVIEW.md` for its table format and the "Parity across the set" findings, and the latest run sections of `REVIEW.md` and `REDRAW-LOG.md` for the recurring failures: medium and deeper skin lifted toward paper (the one that matters most, and it has fallen mostly on people of color), skin pushed far darker than peers when notes stated the photo's gray values, smiles drawn wide, hair a shade light, round faces slimmed, a bright wide band of teeth, faces lighter than their own gray hair.

## Materials for each person

- The photo `pipeline/portraits/photos/<id>.jpg` (alternates such as `<id>.full.jpg` are described in the `sources.json` notes).
- The published drawing `public/portraits/<id>.webp`; view it on orange (#FF7A00), as the site shows it, beside published peers whose photos are about as dark.
- `pipeline/portraits/side-by-side.py <id> pipeline/portraits/cutouts/<id>.png` builds photo | drawing in color and grayscale at `/tmp/sbs-<id>.png`.
- The drawer's line in `RUN/draw-log.jsonl` (latest line per id wins: notes used, tries, the drawer's smile numbers and caveat) and its tries in `pipeline/portraits/raw/`. Check the caveats rather than trusting them, and re-measure: drawers have misread mouth corners.
- `pipeline/portraits/skin-check.py` (run once) fits drawing vs photo cheek value across every portrait and flags outliers. It's advisory: beards, glasses, dark photos and backdrops pull its number around. The grayscale side-by-side and the tile beside peers are the real gate.
- `src/content/officials/<id>.yaml` for party, office and the `portrait:` block.

## Judge

1. **Likeness:** face shape, smile width (measure: mouth corner to corner over pupil distance, pupils read by hand at high zoom, corners at the half-value point on a zoomed crop, photo vs drawing), eyes, nose, glasses, hair, facial hair, age. Would someone who knows them recognize them?
2. **Skin value:** in grayscale, skin keeps the photo's place relative to hair and clothing, and on orange the face sits with peers whose photos are about as dark. No face lifted toward paper, none pushed darker.
3. **Hand:** the set's fine dip pen. Flag woodcut, stipple, heavy black masses, grain, or a soft gray pencil look, and whether it falls on one group.
4. **Flattery parity:** is the person shown at least as well as their own source shows them, and is the source as flattering as peers' (posed vs candid)? Record party.
5. **Style and framing:** visibly an ink drawing; whole head in frame at the set's scale; no clothing invented past the photo's edge; no flags, mics, text, other people, green fringe or stray marks.
6. **Source and label:** `kind: official` only for a government source; `source.url` is a page, not a broken link; `source.label` reads naturally and matches how the same publisher is credited elsewhere.

## Verdicts

- `redraw`: shouldn't ship. The likeness isn't sure, the smile is off by more than 5% and it shows, the skin is clearly lighter or darker than peers, the crown is cut, clothing is invented past the photo's edge, or it's photoreal or off-style. Say exactly what to change.
- `minor`: ships; worth noting. Once a face is live it won't be redrawn for a minor (owner, Nov 19, 2026), so say whether it's worth fixing before merge. Don't guess colors the drawing can't show (it's grayscale).
- `ok`: ships as is.

**Write as you go:** after each person, append one row to your output file, never batching to the end:
`| id | party | verdict | what's wrong | notes for a fix |`

When your list is done, append a short "Patterns" paragraph (anything systematic across party, skin tone, gender or source tier, with names). Reply with the tally, the redraws with what to change, and any minor worth fixing before merge.
