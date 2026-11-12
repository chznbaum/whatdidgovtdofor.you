"""Side-by-side likeness check: the source photo next to the drawing, in color (top row) and grayscale (bottom row),
both scaled to the same height, the drawing's chroma-key green flattened to white.
Usage: python3 pipeline/portraits/side-by-side.py <id> [drawing.png]   -> /tmp/sbs-<id>.png
Default drawing: pipeline/portraits/raw/<id>.png. Pass cutouts/<id>.png to check a published drawing.
"""
import sys
from pathlib import Path
from PIL import Image

here = Path(__file__).parent
pid = sys.argv[1]
draw_path = Path(sys.argv[2]) if len(sys.argv) > 2 else here / 'raw' / f'{pid}.png'
H = 560
photo = Image.open(here / 'photos' / f'{pid}.jpg').convert('RGB')
d = Image.open(draw_path).convert('RGB')
px = d.load()
for y in range(d.size[1]):
    for x in range(d.size[0]):
        r, g, b = px[x, y]
        if g > 150 and r < 120 and b < 120:
            px[x, y] = (255, 255, 255)
fit = lambda im: im.resize((round(im.size[0] * H / im.size[1]), H), Image.LANCZOS)
photo, d = fit(photo), fit(d)
W = photo.size[0] + d.size[0] + 20
sheet = Image.new('RGB', (W, 2 * H + 20), 'white')
sheet.paste(photo, (0, 0))
sheet.paste(d, (photo.size[0] + 20, 0))
sheet.paste(photo.convert('L').convert('RGB'), (0, H + 20))
sheet.paste(d.convert('L').convert('RGB'), (photo.size[0] + 20, H + 20))
out = Path(f'/tmp/sbs-{pid}.png')
sheet.save(out)
print(out)
