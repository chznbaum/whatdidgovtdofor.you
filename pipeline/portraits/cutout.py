# Turns a drawing made on chroma-key green into a cutout: grayscale ink on white inside the figure,
# transparent outside. Edge pixels are un-mixed from the green so no green fringe survives.
# Usage: python3 pipeline/portraits/cutout.py <id>
#   reads pipeline/portraits/raw/<id>.png, writes pipeline/portraits/cutouts/<id>.png
import sys
from pathlib import Path
from PIL import Image

here = Path(__file__).parent
pid = sys.argv[1]
im = Image.open(here / 'raw' / f'{pid}.png').convert('RGB')
px = im.load()
w, h = im.size
res = Image.new('LA', (w, h))
rp = res.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        rb = (r + b) / 2
        spill = max(0.0, g - rb) / 255.0
        a = max(0.0, min(1.0, 1.0 - spill * 1.15))
        if a < 0.04:
            rp[x, y] = (0, 0)
            continue
        fg = min(255, int(round(rb / a)))
        rp[x, y] = (fg, int(round(a * 255)))
out = here / 'cutouts' / f'{pid}.png'
res.save(out, optimize=True)
print(out)
