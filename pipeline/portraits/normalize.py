# Frames every cutout as the same bust (centered on the eyes, the eyes the same distance apart) so faces read at
# one scale everywhere. The eye line sits 42% down, or lower when that's what it takes to keep the top of the head
# in the frame, so heads can break out of their tiles whole. Then it writes the site's files:
#   public/portraits/<id>.webp (800px), public/portraits/<id>-400.webp
# Source photos stay in pipeline/portraits/photos/ and are never copied to public/: the site links to the page each
# photo came from instead (SOURCING.md).
# Eye positions are measured by hand on the cutout (see `ruler.py`) and kept in eyes.json.
# Usage: python3 pipeline/portraits/normalize.py [id ...]   (default: everyone in eyes.json)
import json
import sys
from pathlib import Path
from PIL import Image

here = Path(__file__).parent
public = here.parent.parent / 'public' / 'portraits'
public.mkdir(parents=True, exist_ok=True)
eyes = json.loads((here / 'eyes.json').read_text())
ids = sys.argv[1:] or [k for k in eyes if not k.startswith('_')]

for pid in ids:
    e = eyes[pid]
    cx, cy, ipd = e['x'], e['y'], e['ipd']
    k, ey = e.get('frame', [5.0, 0.42])  # crop width in eye-distances; eye line as a share of the height
    im = Image.open(here / 'cutouts' / f'{pid}.png').convert('LA')
    s = k * ipd
    # Headroom: find the top of the head above the eyes and keep it (plus a little air) inside the frame.
    alpha = im.getchannel('A')
    x0, x1 = max(0, int(cx - 1.6 * ipd)), min(im.size[0], int(cx + 1.6 * ipd))
    head_top = next((y for y in range(im.size[1]) if alpha.crop((x0, y, x1, y + 1)).getextrema()[1] > 40), 0)
    ey = max(ey, (cy - head_top + 0.04 * s) / s)
    box = (round(cx - s / 2), round(cy - ey * s), round(cx + s / 2), round(cy - ey * s + s))
    bust = im.crop(box).convert('RGBA')  # areas outside the drawing come back transparent
    for size, suffix in ((800, ''), (400, '-400')):
        bust.resize((size, size), Image.LANCZOS).save(public / f'{pid}{suffix}.webp', 'WEBP', quality=82, method=6)
    print(pid, box)
