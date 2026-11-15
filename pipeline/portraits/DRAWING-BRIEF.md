# Drawing brief for portrait agents

You turn sourced photos into published ink portraits for whatdidgovtdofor.you. Read these first:
- `pipeline/portraits/README.md` (the steps)
- `pipeline/portraits/style.txt` (the style)
- the "Portraits" section of `docs/design.md`

Then look at three existing results in `public/portraits/` (e.g. `jennifer-boysko.webp`, `garret-graves.webp`, `raphael-warnock.webp`) so yours match the set.

## For each official on your list, one at a time

1. **Skip** anyone whose `src/content/officials/<id>.yaml` already has a `portrait:`.
2. Read their entry in `pipeline/portraits/sources.json`: the tier, the page, the notes (including any note on expression, such as "draw it as a gentle smile, not mid-word"). The photo is `pipeline/portraits/photos/<id>.jpg`. Draw from that one photo, the one the portrait will link to: hair, age and features all come from it, even if you know the person looks different now. If a newer photo would be better, say so in your reply; never combine two photos in one drawing.
3. **Measure the photo, then draw:** `pipeline/portraits/draw.sh <id> pipeline/portraits/photos/<id>.jpg "<notes>"`.
   - Before the first try, measure the photo's smile (step 4 says how) and put the number in the notes: "the mouth is exactly <r> times the distance between the pupils, corner to corner: keep it that narrow; do not widen or open the smile." Smiles drawn wide are the commonest failure; without the number they came out 6-13% wide.
   - Look at the photo and write notes, in plain values, for everything else the model tends to get wrong:
     - **Hair:** its color and value, and what it must not become: "warm honey blonde, mid value, darker than her face, few highlight strands, never platinum, silver or white"; "black, with only a few gray strands at the temples, not salt-and-pepper"; "dark brown with strands, not solid black". Hair comes out a shade light by default, with white highlight strands.
     - **Face shape:** "round, full face; keep it exactly as round". Round faces get slimmed and lower faces shortened; for a long or broad face, give its length or jaw width in pupil distances. For a turned head, describe the pose ("head turned to the viewer's right; the far cheek's outline just outside that eye") or it comes back facing front.
     - **Eyes:** if the smile narrows them, "upper lids covering the top of the irises". They come out more open than a smiling squint.
     - **Clothes:** name a dark suit "near-black" (it drifts to mid-gray), and give a mid-tone garment its value ("a periwinkle blazer, a mid-gray in ink, clearly darker than the white top"); otherwise it goes to bare paper.
     - Glasses, facial hair, gray temples, and the skin value (next bullet).
   - **Skin value:** describe the face against its own clothing and hair, from the color photo: "her face is a medium-deep brown, darker than the white shirt and lighter than the near-black suit: even middle-density hatching with white paper between the lines, never bare paper and never a smooth gray tone." First tries lift medium and deeper skin toward paper, and lift tans on light-skinned men. **Never write the photo's own gray values into the notes**, whatever the input: the model draws them literally, with none of the lift every face in the set gets. In run 4 that pushed Corey Givens, Chigozie Onyema (from a color input), Naya Young and the light-olive Joseph Vitale far darker than their peers, and it is the main reason Black officials came off worse in that run. Don't draw medium or deeper skin from a grayscale copy either: it pushed faces darker than anyone in the set, in a tonal graphite look, and widened mouths. If the color try still lifts the face, name a published drawing whose photo is about as dark ("as dark as the drawing of Raphael Warnock") or give a target in the drawing's own values ("cheeks about 180 of 255"), never the photo's. Gray or silver hair: the face must not end up lighter than the hair when the photo has them equal (lift the hair with the face). Before publishing, look at the framed tile on orange beside two or three published peers whose photos are about as dark.
   - Give everyone, whatever their skin tone, the same hand sentence: "Fine dip pen, the same light, even line weight as the rest of the set; a delicate, refined hedcut with crisp, thin black lines, never soft gray pencil or grain; no woodcut, scratchboard, stipple, thick or jagged strokes, or black blotches; smooth, fine parallel hatching on the cheeks, no white flecks; soft smile folds; under-eye lines no deeper or more numerous than the photo shows; add no creases the photo doesn't show." Without it, first tries drift to a heavy hand, more often on darker-skinned people; darker skin and tans come out as coarse, flecked engraving that ages lined faces and turns soft folds into lines (most often on women of color and weathered men); and fair women drift to a soft gray pencil.
   - Small photos (face under ~250px) draw better from a 2-3x LANCZOS upscale. Wide or tight shots draw better from a head-and-shoulders crop that keeps clear space above the hair (a tight crop cuts the crown) and is at least about five pupil distances wide (a narrower one comes back with shoulders that stop inside the frame). Keep those working copies in `/tmp`, never in `photos/`. A grayscale copy of the photo as input holds near-black hair that keeps coming out gray; it doesn't hold blonde, red or gray hair (give those a value instead), and on medium or deeper skin check that it hasn't pushed the face too dark. On light or tanned faces that the color input lifts to paper (ruddy and tanned men most of all), a grayscale copy with the value described relative to the shirt and hair fixed it in run 4.
   - Several agents share `/tmp`: name your scratch files with the person's id.
4. **Check the likeness.** Open the photo and the drawing (`raw/<id>.png`) with Read and compare:
   - face shape
   - smile width, and how far the lips part
   - eyes, no more open than the photo's
   - hair color and lightness
   - glasses
   - age
   - expression: the photo's, or the one the `sources.json` notes ask for
   - skin tone, rendered by hatching density
   
   **Also compare in grayscale:** `python3 pipeline/portraits/side-by-side.py <id>` writes `/tmp/sbs-<id>.png`, the photo beside the drawing in color and in grayscale. The drawing's skin, hair and clothing must keep the photo's relative lightness: skin no lighter and no darker than in the photo, especially for people of color.
   - **Teeth:** where the photo's outer teeth fall into shadow, the drawing keeps them shadowed. A bright, even band of teeth wider than the photo's reads as a broader grin even when the corners measure right.
   - **Measure the smile; don't eyeball it.** Read the pupils by hand at high zoom (catchlights or iris edges) on both images: on a small or squinting photo, a pupil misread is the biggest source of error, and it fakes shape failures too (a "broad jaw" that is really a misread pupil distance). Align the eyes, read each mouth corner on a zoomed crop at the half-value point of the lip line, not at the darkest pixel (under a moustache, where the lips meet), on the photo and the drawing alike, and divide the width by the pupil distance. Pass within ±5%. Mouths run wide, most often at the subject's left corner (the viewer's right). If the photo's number looks off, re-measure it before blaming the drawing.
   - The reviewers found these failures most often: smiles drawn wide; hair a shade light (blonde to platinum, red to ash, black to salt-and-pepper); dark brown turned solid black; medium and deeper skin lifted toward paper, or pushed too dark from grayscale input; creases and age added, often as coarse, flecked texture or soft folds drawn as lines; round faces slimmed (almost always women's); eyes more open than a smiling squint; mid-tone clothing lifted to white; a soft gray pencil on fair women; a heavier woodcut hand on darker-skinned people.
   - `pipeline/portraits/skin-check.py` gives a rough advisory number. Photo lighting dominates it, and beards, moustaches, open mouths, black hair, dark backdrops or a face box that misses the face all pull it darker, so the grayscale side-by-side, with the cheeks read by hand, is the real gate.
   It must be **visibly an ink drawing, never photoreal**. If it drifts, caricatures, recolors, or looks like a photo, run it again with sharper notes, up to 3 tries; when one feature fails on an otherwise good try, keep the notes that worked and sharpen only that one. If it still fails, leave this person out, note why, and move on. **Never publish a face you aren't sure matches.**
5. **Cut out, measure, frame:**
   - `python3 pipeline/portraits/cutout.py <id>`
   - `python3 pipeline/portraits/ruler.py <id> <approx eye y>`, then read off `x`, `y`, `ipd`, and check the pupils by hand at high zoom: a short `ipd` frames the head large. A turned head foreshortens the pupil distance and frames large too.
   - Add `<id>` to `pipeline/portraits/eyes.json` with `python3 pipeline/portraits/merge.py pipeline/portraits/eyes.json <id> '{"x": X, "y": Y, "ipd": IPD}'` (add `--replace` to re-measure). It locks the file, re-reads it, and merges only your entry, since other agents share it. Record sources in `sources.json` the same way. The entry must always match the published drawing: re-measure after every redraw, and if you put an older version back, put its entry back too.
   - `python3 pipeline/portraits/normalize.py <id>`
6. **Check the framed result:** whole head in frame, the same scale as the existing set, and no shoulder ending in a hard edge inside the tile. Then add the `portrait:` field to the official's yaml:
   - `image: /portraits/<id>.webp`
   - `kind: official` when the photo is a government's own (sources.json tier `official`), otherwise `photo`
   - `source.label`: the publisher as readers should see it, e.g. "U.S. Congress", "New York State Senate", "The White House, via Wikimedia Commons"
   - `source.url`: the sources.json `page`, never a bare image
   - `source.license`: the license
7. **Save as you go.** Each person must be fully done (webp in `public/portraits/`, yaml field, eyes.json entry) before you start the next. Never batch to the end.

Don't edit anything else in `src/` or any other agent's files. Run `npm run validate` after every few people and fix your own problems. Don't commit.

When you finish, reply with a table: id | tries | kind | any caveat. List anyone you left out, and why.
