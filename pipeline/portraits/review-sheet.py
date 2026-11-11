"""Contact sheets for reviewing portraits: each published drawing beside the photo it was drawn from, labeled with
name and party, so a reviewer can check likeness, skin tone, and that no one is drawn less flatteringly than their
photo. Usage: python3 pipeline/portraits/review-sheet.py [out-dir]   (default /tmp/portrait-review)
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

here = Path(__file__).parent
root = here.parent.parent
out = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/portrait-review')
out.mkdir(parents=True, exist_ok=True)

H = 380  # height of each image in a pair
PAIRS_PER_ROW, ROWS = 3, 2
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 22)


def field(text, key):
    m = re.search(rf'^{key}:\s*(.+)$', text, re.M)
    return m.group(1).strip().strip('"') if m else ''


people = []
for y in sorted((root / 'src/content/officials').glob('*.yaml')):
    text = y.read_text()
    if not re.search(r'^portrait:', text, re.M):
        continue
    pid = y.stem
    drawing = root / 'public/portraits' / f'{pid}.webp'
    photo = next((p for p in [here / 'photos' / f'{pid}.official.jpg', here / 'photos' / f'{pid}.jpg'] if p.exists()), None)
    if pid == 'zohran-mamdani' and (here / 'photos' / 'zohran-mamdani.official.jpg').exists():
        photo = here / 'photos' / 'zohran-mamdani.official.jpg'
    people.append((pid, field(text, 'name'), field(text, 'party'), drawing, photo))


def fit(path, h):
    if not path or not path.exists():
        im = Image.new('RGB', (int(h * 0.8), h), (230, 230, 230))
        ImageDraw.Draw(im).text((10, h // 2), 'no photo', fill='black', font=font)
        return im
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im)
    im = im.convert('RGB')
    return im.resize((max(1, int(im.width * h / im.height)), h))


pair_w = int(H * 1.9) + 30
per_sheet = PAIRS_PER_ROW * ROWS
for s in range(0, len(people), per_sheet):
    sheet = Image.new('RGB', (pair_w * PAIRS_PER_ROW, (H + 50) * ROWS), 'white')
    d = ImageDraw.Draw(sheet)
    for i, (pid, name, party, drawing, photo) in enumerate(people[s:s + per_sheet]):
        x, y = (i % PAIRS_PER_ROW) * pair_w, (i // PAIRS_PER_ROW) * (H + 50)
        ph, dr = fit(photo, H), fit(drawing, H)
        sheet.paste(ph, (x + 5, y + 40))
        sheet.paste(dr, (x + 10 + ph.width, y + 40))
        d.text((x + 5, y + 8), f'{name} ({party})  photo | drawing', fill='black', font=font)
    path = out / f'sheet-{s // per_sheet + 1:02d}.png'
    sheet.save(path)
print(f'{len(people)} portraits on {(len(people) + per_sheet - 1) // per_sheet} sheets in {out}')
