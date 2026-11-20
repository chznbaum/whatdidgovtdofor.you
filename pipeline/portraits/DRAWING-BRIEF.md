# Drawing one person's portrait

The brief for an agent that draws **one** official, then stops. The task names the person (`<id>`) and the run folder (RUN, e.g. `design-samples/run-2026-11-19-portraits/`). ROOT is the checkout you were started in: the run's worktree. You make the drawing yourself with your own image generation tool, check it, and publish it, or leave the person out if no try passes. How a whole run is organized is in `README.md`.

- Use absolute paths and `cd ROOT` in every shell command. Write only inside ROOT and `/tmp` (your image tool's own storage, such as `~/.codex/generated_images/`, is fine). Name scratch files `/tmp/<id>-*`, since other agents share `/tmp`.
- Run every Python script with `ROOT/pipeline/portraits/.venv/bin/python`, by absolute path. Plain `python3` may lack Pillow.
- Shared files (`eyes.json`, `sources.json`) only through `pipeline/portraits/merge.py`, which locks the file, re-reads it and merges your entry; other agents write them at the same time. The draw log is append-only: one `>>` write.
- Don't commit. Don't touch anyone else's files, and never redraw, reframe or edit anyone already published.

## 0. Check you can write

`touch ROOT/pipeline/portraits/cutouts/.w-<id> RUN/.w-<id> && rm ROOT/pipeline/portraits/cutouts/.w-<id> RUN/.w-<id>`. If it's refused, stop and report the exact error.

## 1. Read

- `pipeline/portraits/style.txt` and the "Portraits" section of `docs/design.md`.
- The person's entry in `pipeline/portraits/sources.json` (notes included), their line in `RUN/flags.md` if there is one, and `src/content/officials/<id>.yaml`.
- The photo, `pipeline/portraits/photos/<id>.jpg` (a `<id>.full.jpg` is the uncropped original; draw from `<id>.jpg`). Draw from that one photo, the one the portrait will link to: hair, age and features all come from it, even if you know the person looks different now. Never combine two photos.
- Three published tiles in `public/portraits/` to calibrate the hand (`jennifer-boysko.webp`, `raphael-warnock.webp`, `garret-graves.webp`), plus two or three whose photos are about as dark as this person's.

## 2. Write the notes

The model gets these properties wrong unless the notes pin them down. Write them from the photo, in plain words:

- **Skin, first.** Describe the face's value against the person's own clothing, from the color photo. For medium and deeper skin, place it against a **mid-tone** garment: "her face is about as dark as her pink blazer, clearly darker than the white blouse"; "about the gray suit's value". Placing it only between a white shirt and black hair leaves room for near-white, and that is how two Black women were drawn far too light in run 5. Medium and deeper skin and tanned faces get lifted toward paper on first tries; that is the failure that matters most. **Never write the photo's own gray values** into the notes: the model draws them literally with none of the set's lift, and in run 4 that pushed four faces far darker than their peers. If a try still lifts the face, name a published drawing whose photo is about as dark ("as dark as the drawing of Raphael Warnock") or give a target in the drawing's own values, never the photo's. A face must not end up lighter than its own gray hair.
- **Smile.** Measure the photo first: eyes aligned, mouth corner to corner over the pupil-to-pupil distance. Read the pupils by hand at high zoom (catchlights or iris edges). Read each corner on a zoomed crop at the half-value point of the lip line, at the tip of the dark wedge beside the outer teeth, not inside it and not at the darkest pixel (under a moustache, where the lips meet). Put the number in the notes: "the mouth is exactly <r> times the distance between the pupils, corner to corner: keep it that narrow; do not widen or open the smile." Where the outer teeth fall into shadow, say so: a bright, even band of teeth reads as a broader grin.
- **Hair:** its color and value, and what it must not become: "warm honey blonde, mid value, darker than her face, few highlight strands, never platinum, silver or white"; "black, with only a few gray strands at the temples, not salt-and-pepper"; "dark brown with strands, not solid black". Hair comes out a shade light by default.
- **Face shape:** "round, full face; keep it exactly as round". Round faces get slimmed and lower faces shortened. For a turned head, describe the pose, or it comes back facing front.
- **Eyes:** if the smile narrows them, "upper lids covering the top of the irises".
- **Clothes:** name a dark suit "near-black"; give a mid-tone garment its value ("a periwinkle blazer, a mid-gray in ink, clearly darker than the white top").
- Glasses, facial hair, earrings, gray temples.
- **The same hand for everyone**, whatever their skin tone: "Fine dip pen, the same light, even line weight as the rest of the set; a delicate, refined hedcut with crisp, thin black lines, never soft gray pencil or grain; no woodcut, scratchboard, stipple, thick or jagged strokes, or black blotches; smooth, fine parallel hatching on the cheeks, no white flecks; soft smile folds; under-eye lines no deeper or more numerous than the photo shows; add no creases the photo doesn't show."

Working copies go in `/tmp`, never in `photos/`. A small photo (face under ~250px) draws better from a 2–3x LANCZOS upscale; a wide shot from a head-and-shoulders crop with clear space above the hair, at least about five pupil distances wide. A grayscale copy as input helps near-black hair that keeps coming out gray, and light or tanned faces that the color input lifts to paper; on medium or deeper skin, check it hasn't pushed the face too dark.

**No padding (owner, Nov 19, 2026):** never extend clothing past the photo's edge, and never feed a padded copy or one with clothing roughed in.

## 3. Draw and check

1. Make the image with your image generation tool, with the photo (or your working copy) as the input image and this prompt, `style.txt` pasted in verbatim:

   > Restyle the attached photo as: {style.txt}. {notes} Keep the person's likeness faithful: same face, features, skin tone, hair, glasses, and age. Don't add text, logos, or flags.

   Every try starts from the photo, never from an earlier try (except the near-miss edit below).
2. Save it: `sips -Z 900 <generated file> --out pipeline/portraits/raw/<id>.png`, then copy that to `raw/<id>.try<N>.png` (the task may give a run-specific name). The background must be flat chroma-key green; if it isn't, the try fails.
3. Check it: `pipeline/portraits/.venv/bin/python pipeline/portraits/side-by-side.py <id>` writes `/tmp/sbs-<id>.png` (photo | drawing, color on top, grayscale below). Look at it, and at zoomed crops; never assume a measurement. Compare face shape, smile width (measured as in step 2, on both images), how far the lips part, eyes, hair color and lightness, glasses, age, and skin by hatching density: in grayscale the skin keeps the photo's place relative to hair and clothing. It must be visibly an ink drawing, never photoreal.
4. **What passes** (owner, Nov 19, 2026): the likeness is sure (face shape, features and age are the person's), the smile is within ±5% of the photo's, and skin and hair values are about right relative to each other and the clothing. Small flaws don't fail a try: a shoulder that ends at the drawing's edge, hair a shade light, a slightly tonal patch, a garment's value a little off. Note them in the log's caveat for the reviewer and publish; don't spend tries chasing them. Fail a try only when the likeness isn't sure, the smile is off by more than 5%, the skin is clearly lighter or darker than peers whose photos are about as dark, the crown is cut, or it looks photoreal or off-style.
5. Up to 3 tries, keeping the notes that worked and sharpening only what failed. One of them may be an edit of a near-miss try (below). If none passes, leave the person out: no cutout, eyes entry, webp or yaml, and say why. **Never publish a face you aren't sure matches.**

## 4. Publish

1. `pipeline/portraits/.venv/bin/python pipeline/portraits/cutout.py <id>` writes `cutouts/<id>.png`.
2. `pipeline/portraits/.venv/bin/python pipeline/portraits/ruler.py <id> <approx eye y>` renders a gridded strip. Read off the midpoint between the pupils (`x`, `y`) and the pupil distance (`ipd`), checking the pupils by hand at high zoom: a short `ipd` frames the head large, and a turned head foreshortens it.
3. `pipeline/portraits/.venv/bin/python pipeline/portraits/merge.py pipeline/portraits/eyes.json <id> '{"x": X, "y": Y, "ipd": IPD}'` (add `"frame": [k, ey]` only if the default frame cuts the crown; `--replace` to re-measure). The entry must match the published drawing.
4. `pipeline/portraits/.venv/bin/python pipeline/portraits/normalize.py <id>` writes `public/portraits/<id>.webp` and `<id>-400.webp`. Look at the framed tile on orange (#FF7A00) beside two or three published peers whose photos are about as dark: whole head in frame, the same scale as the set, the face sitting with its peers.
5. Append the `portrait:` block to `src/content/officials/<id>.yaml`, formatted like `src/content/officials/julia-salazar.yaml`, from the sources.json entry: `image: /portraits/<id>.webp`; `kind: official` for tier `official`, otherwise `photo`; `source.label` (the publisher as readers should see it, e.g. "New York State Senate", "U.S. House of Representatives, via Wikimedia Commons"); `source.url` (the sources.json `page`, never a bare image unless no page shows it); `source.license`.
6. `npm run validate`. If it says a source can't be `kind: official`, use `kind: photo`: the validator decides which hosts count as government. Fix only your own problems.

## 5. Log and reply

Append one line to `RUN/draw-log.jsonl`:
`{"id": "<id>", "status": "published|left-out", "tries": N, "kind": "official|photo", "model": "<your model>", "notes_used": "...", "caveat": "<smile photo → drawing; anything the reviewer should look at>"}`

Reply with: id | status | tries | smile (photo → drawing) | caveat. If left out, say why.

## Editing a near-miss try in place

When one try is right on everything but one local property (a mouth corner, the mouth's expression, one jaw contour) or one even value change (the face a step darker), edit that try instead of drawing again. A fresh draw tends to fix the one thing and break another.

1. **Feed the try itself, not the photo,** as the input image (`/tmp/<id>-base.png`, the near-miss raw drawing on green).
2. **Notes:** "The attached image is already the finished ink drawing of this person, on chroma-key green. Reproduce it exactly as it is: the same face shape and size, the same head position and framing, the same skin value and hatching density, the same line weight, the same hair, eyes, ears and clothes. [Hand sentence.] The lips are hatched with the same fine engraved lines as the rest of the face. Change ONLY [the change]." For a mouth, anchor both corners to features ("the right end sits directly below the pupil above it"), give the ratio to the pupil distance, and say what stays where. For a value change, describe it against the clothing, as in step 2.
3. **Check the edit stayed local:** `pipeline/portraits/.venv/bin/python pipeline/portraits/patch-edit.py diff /tmp/<id>-base.png <edit.png>` prints the size, the mean change and the bounding box of changed pixels.
4. **If it spilled outside the region,** composite only that region back: `patch-edit.py comp /tmp/<id>-base.png <edit.png> <out.png> x0 y0 x1 y1 8` (feathered by 8 px; everything outside the box stays byte-identical). Make the box cover the feature and its folds (about 0.3 ipd around a mouth), so the feather falls on plain hatching.
5. **Check the seam and the hand at 5–6x:** the hatching runs on across the border at the same angle and spacing, with no hard arc, gap or white band, and the patch is still distinct ink lines, not a smooth gray tone (`patch-edit.py ink` compares a region's tone and crispness with the face beside it).
6. **Measure everything again,** the unchanged properties too: an edit can nudge them.

Edits can't rescue a try that fails on several properties at once; a whole-face change regenerates the drawing, so check it as a new try.
