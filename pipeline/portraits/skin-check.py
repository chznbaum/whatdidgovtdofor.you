"""Measures whether each drawing keeps its subject's skin value. In ink, skin tone is hatching density, so a fair set
keeps the order of the photos: a darker-skinned subject's face must come out denser than a lighter-skinned one's.

For each portrait it takes the mean gray of the central face (cheeks, nose, mouth) in the photo (found with OpenCV's
face detector) and in the drawing (located from eyes.json on the cutout). It fits drawing value against photo value
across the whole set and flags anyone whose drawing is lighter or darker than the set's own fit predicts.

ADVISORY ONLY: photo lighting and exposure dominate the photo value even after normalizing, so flags are pointers for
a closer look, not verdicts. The gate is a grayscale side-by-side of photo and drawing (see DRAWING-BRIEF.md).

Usage: pipeline/portraits/.venv/bin/python pipeline/portraits/skin-check.py [id ...]
(one-time setup: python3 -m venv pipeline/portraits/.venv && pipeline/portraits/.venv/bin/pip install "opencv-python-headless<5" numpy pillow)
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

here = Path(__file__).parent
eyes = json.loads((here / 'eyes.json').read_text())
cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')


def photo_value(pid):
    path = next((p for p in [here / 'photos' / f'{pid}.official.jpg', here / 'photos' / f'{pid}.jpg'] if p.exists()), None)
    if pid != 'zohran-mamdani':
        path = here / 'photos' / f'{pid}.jpg' if (here / 'photos' / f'{pid}.jpg').exists() else path
    if not path:
        return None
    gray = cv2.cvtColor(cv2.imread(str(path)), cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, 1.1, 5, minSize=(60, 60))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    face = gray[y + int(0.45 * h): y + int(0.85 * h), x + int(0.22 * w): x + int(0.78 * w)]  # cheeks, nose, mouth
    # Normalize for exposure: place the face between the photo's own darkest and lightest tones (a studio-lit photo
    # and a dim one of the same person should score alike).
    lo, hi = np.percentile(gray, 2), np.percentile(gray, 98)
    return float(np.clip((face.mean() - lo) / max(hi - lo, 1) * 255, 0, 255))


def drawing_value(pid):
    if pid not in eyes or not (here / 'cutouts' / f'{pid}.png').exists():
        return None
    rgba = cv2.imread(str(here / 'cutouts' / f'{pid}.png'), cv2.IMREAD_UNCHANGED)
    if rgba.shape[2] == 4:
        a = rgba[:, :, 3:4] / 255.0
        rgb = (rgba[:, :, :3] * a + 255 * (1 - a)).astype(np.uint8)
    else:
        rgb = rgba
    gray = cv2.cvtColor(rgb, cv2.COLOR_BGR2GRAY)
    e = eyes[pid]
    cx, cy, ipd = e['x'], e['y'], e['ipd']
    face = gray[int(cy + 0.35 * ipd): int(cy + 1.25 * ipd), int(cx - 0.7 * ipd): int(cx + 0.7 * ipd)]  # same zone
    return float(face.mean())


ids = sys.argv[1:] or sorted(k for k in eyes if not k.startswith('_'))
rows = []
for pid in ids:
    p, d = photo_value(pid), drawing_value(pid)
    if p is None or d is None:
        print(f'{pid:28s} skipped ({"no face found in photo" if p is None else "no cutout"})')
        continue
    rows.append((pid, p, d))

xs, ys = np.array([r[1] for r in rows]), np.array([r[2] for r in rows])
b, a = np.polyfit(xs, ys, 1)
resid = ys - (a + b * xs)
sd = resid.std()
print(f'\nfit: drawing = {a:.1f} + {b:.2f} x photo   (residual sd {sd:.1f}; n={len(rows)})\n')
print(f'{"id":28s} photo  drawing  residual  flag')
for (pid, p, d), r in sorted(zip(rows, resid), key=lambda t: -abs(t[1])):
    flag = 'LIGHTER than fit' if r > 1.5 * sd else 'DARKER than fit' if r < -1.5 * sd else ''
    print(f'{pid:28s} {p:5.0f}  {d:7.0f}  {r:+8.1f}  {flag}')
