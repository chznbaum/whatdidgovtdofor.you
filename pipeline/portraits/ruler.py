# Renders a gridded strip across a cutout's eyes so you can read off the pupil positions for eyes.json.
# Usage: python3 pipeline/portraits/ruler.py <id> <approximate eye y> [out.png]
import sys
from pathlib import Path
from PIL import Image, ImageDraw

here = Path(__file__).parent
pid, ey = sys.argv[1], int(sys.argv[2])
out = sys.argv[3] if len(sys.argv) > 3 else f'/tmp/ruler-{pid}.png'
im = Image.open(here / 'cutouts' / f'{pid}.png').convert('RGBA')
bg = Image.new('RGBA', im.size, (255, 122, 0, 255))
bg.alpha_composite(im)
top = max(0, ey - 90)
band = bg.convert('RGB').crop((0, top, im.size[0], top + 180))
d = ImageDraw.Draw(band)
for x in range(0, im.size[0], 25):
    d.line([(x, 0), (x, 180)], fill=(255, 0, 255) if x % 100 == 0 else (0, 160, 255), width=1)
for y in range(0, 180, 25):
    d.line([(0, y), (im.size[0], y)], fill=(0, 160, 255), width=1)
    d.text((2, y + 2), str(top + y), fill=(0, 0, 255))
for x in range(0, im.size[0], 100):
    d.text((x + 2, 2), str(x), fill=(255, 0, 255))
band.save(out)
print(out)
