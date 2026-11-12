# Drawing brief for portrait agents

You turn sourced photos into published ink portraits for whatdidgovtdofor.you. Read these first:
- `pipeline/portraits/README.md` (the steps)
- `pipeline/portraits/style.txt` (the style)
- the "Portraits" section of `docs/design.md`

Then look at three existing results in `public/portraits/` (e.g. `jennifer-boysko.webp`, `garret-graves.webp`, `raphael-warnock.webp`) so yours match the set.

## For each official on your list, one at a time

1. **Skip** anyone whose `src/content/officials/<id>.yaml` already has a `portrait:`.
2. Read their entry in `pipeline/portraits/sources.json`: the tier, the page, the notes. The photo is `pipeline/portraits/photos/<id>.jpg`.
3. **Draw:** `pipeline/portraits/draw.sh <id> pipeline/portraits/photos/<id>.jpg "<notes>"`.
   - Look at the photo first and write notes for anything the model tends to get wrong: hair color and lightness, gray temples, glasses, skin tone, facial hair.
   - Give everyone, whatever their skin tone, the same hand sentence: "Fine dip pen, the same light, even line weight as the rest of the set; a delicate, refined hedcut with thin black lines; no woodcut, scratchboard, stipple, thick or jagged strokes, or black blotches; add no creases the photo doesn't show." Without it, first tries still drift to a heavy hand, more often on darker-skinned people.
   - Name a dark suit "near-black"; it drifts to mid-gray otherwise.
   - Small photos (face under ~250px) draw better from a 2-3x LANCZOS upscale, and wide or tight shots from a head-and-shoulders crop. Keep those working copies in `/tmp`, never in `photos/`. If a hair value keeps coming out wrong, a grayscale copy of the photo as input holds it.
   - Several agents share `/tmp`: name your scratch files with the person's id.
4. **Check the likeness.** Open the photo and the drawing (`raw/<id>.png`) with Read and compare:
   - face shape
   - smile width
   - hair color and lightness
   - glasses
   - age
   - skin tone, rendered by hatching density
   
   **Also compare in grayscale:** `python3 pipeline/portraits/side-by-side.py <id>` writes `/tmp/sbs-<id>.png`, the photo beside the drawing in color and in grayscale. The drawing's skin, hair and clothing must keep the photo's relative lightness: skin no lighter and no darker than in the photo, especially for people of color.
   - **Measure the smile; don't eyeball it.** Align the eyes, read the mouth corners at the half-value point of the lip line on the photo and the drawing alike, and divide the width by the pupil distance. Pass within ±5%. Mouths run wide.
   - The reviewer found these failures most often: round faces slimmed (almost always women's), creases and age added, a heavier woodcut hand on darker-skinned people, dark brown hair turned solid black, and blonde turned gray.
   - `pipeline/portraits/skin-check.py` gives a rough advisory number; photo lighting dominates it, so the grayscale side-by-side is the real gate.
   It must be **visibly an ink drawing, never photoreal**. If it drifts, caricatures, recolors, or looks like a photo, run it again with sharper notes, up to 3 tries. If it still fails, leave this person out, note why, and move on. **Never publish a face you aren't sure matches.**
5. **Cut out, measure, frame:**
   - `python3 pipeline/portraits/cutout.py <id>`
   - `python3 pipeline/portraits/ruler.py <id> <approx eye y>`, then read off `x`, `y`, `ipd`
   - Add `<id>` to `pipeline/portraits/eyes.json` with `python3 pipeline/portraits/merge.py pipeline/portraits/eyes.json <id> '{"x": X, "y": Y, "ipd": IPD}'` (add `--replace` to re-measure). It locks the file, re-reads it, and merges only your entry, since other agents share it. Record sources in `sources.json` the same way.
   - `python3 pipeline/portraits/normalize.py <id>`
6. **Check the framed result:** whole head in frame and the same scale as the existing set. Then add the `portrait:` field to the official's yaml:
   - `image: /portraits/<id>.webp`
   - `kind: official` when the photo is a government's own (sources.json tier `official`), otherwise `photo`
   - `source.label`: the publisher as readers should see it, e.g. "U.S. Congress", "New York State Senate", "The White House, via Wikimedia Commons"
   - `source.url`: the sources.json `page`, never a bare image
   - `source.license`: the license
7. **Save as you go.** Each person must be fully done (webp in `public/portraits/`, yaml field, eyes.json entry) before you start the next. Never batch to the end.

Don't edit anything else in `src/` or any other agent's files. Run `npm run validate` after every few people and fix your own problems. Don't commit.

When you finish, reply with a table: id | tries | kind | any caveat. List anyone you left out, and why.
