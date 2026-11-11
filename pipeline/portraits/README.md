# Portraits

How an official gets their ink drawing. The rules are in `docs/design.md`, "Portraits".

1. **Find a real photo** of the person, following `SOURCING.md` (where to look, in order, and how to confirm it's the right person). Save it as `photos/<id>.jpg` and record it in `sources.json`: the page it came from (the bioguide, member, Commons file, or press page; never a bare image URL), the publisher, and the license.

   The site never republishes source photos. `photos/` is a private working copy for drawing: it's gitignored and never copied to `public/`. Readers see the original by following a link to its page.
2. **Draw:** `pipeline/portraits/draw.sh <id> pipeline/portraits/photos/<id>.jpg ["notes"]`. It uses GPT image generation (via Codex) with `style.txt` and writes `raw/<id>.png`, the drawing on chroma-key green. It takes a few minutes. Use the notes for coloring the model tends to get wrong, e.g. "Her hair is dark blonde, darker at the roots; render it mid-toned, never platinum."
3. **Check it side by side with the photo.** Look for the same face shape, smile width, hair color and lightness, glasses, and age. It must be visibly a drawing. If it drifts, caricatures, or goes photoreal, run it again; it can take a few tries.
4. **Cut it out:** `python3 pipeline/portraits/cutout.py <id>` writes `cutouts/<id>.png`, ink on white with a transparent surround.
5. **Measure the eyes:** `python3 pipeline/portraits/ruler.py <id> <approximate eye y>` renders a gridded strip. Read off the midpoint between the pupils (`x`, `y`) and the pupil-to-pupil distance (`ipd`), and add them to `eyes.json`.
6. **Frame and publish:** `python3 pipeline/portraits/normalize.py <id>` writes `public/portraits/<id>.webp` and `<id>-400.webp`. Every face comes out at the same scale, with the whole head in frame. Only the drawing is published; the source photo stays in `photos/`.
7. **Add the field** to `src/content/officials/<id>.yaml`:

   ```yaml
   portrait:
     image: /portraits/<id>.webp
     kind: official        # only when the photo is a government's own (a .gov page, or a public-domain government portrait on Commons); otherwise: photo
     source:
       label: U.S. Congress  # who published the photo, as readers should see it
       url: https://bioguide.congress.gov/search/bio/<bioguide>  # the page from sources.json, never a bare image
       license: Public domain
   ```

   Every drawing on the site carries a "See the photo (U.S. Congress)" link to `source.url`, opening in a new tab. The photo itself never ships.

8. Run `npm run validate`. It checks that the drawing files exist, that `official` is only used with a bioguide id, and that bodies have no portrait.

`raw/` and `photos/` are ignored by git. `cutouts/`, `eyes.json`, and `sources.json` are kept, so any drawing can be reframed later and any photo found again from its page.
