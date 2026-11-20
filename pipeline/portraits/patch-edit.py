"""In-place edit helper. Compares an edited drawing with the try it was made from, and can
composite only a chosen region of the edit back onto the try, so everything outside it stays byte-identical.
usage:
  patch-edit.py diff  <base.png> <edit.png>                       -> size, mean |diff|, bbox of pixels changed > 40
  patch-edit.py comp  <base.png> <edit.png> <out.png> x0 y0 x1 y1 [feather]   -> paste edit's box (feathered) on base
  patch-edit.py ink   <img.png> x0 y0 x1 y1                        -> ink-vs-tone check of a region
'ink' prints: mid = share of pixels in the 90-200 gray band (tone), and lap = mean |Laplacian| (line crispness).
Crisp hatching: mid well under ~0.45 and lap high, like the surrounding face; a tonal (graphite/photo) patch has mid
high and lap about half the face's. Compare the patch with a same-size box of the face next to it.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
cmd = sys.argv[1]
def L(p): return np.array(Image.open(p).convert('L')).astype(float)
if cmd == 'diff':
    a, b = L(sys.argv[2]), L(sys.argv[3])
    print('sizes', a.shape, b.shape)
    if a.shape == b.shape:
        d = np.abs(a - b); ys, xs = np.where(d > 40)
        print(f'mean |diff| {d.mean():.2f}; changed>40: {len(xs)} px', f'bbox x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()}' if len(xs) else '')
elif cmd == 'comp':
    base = Image.open(sys.argv[2]).convert('RGB'); ed = Image.open(sys.argv[3]).convert('RGB')
    if ed.size != base.size:
        ed = ed.resize(base.size, Image.LANCZOS)
    x0, y0, x1, y1 = map(int, sys.argv[5:9]); f = int(sys.argv[9]) if len(sys.argv) > 9 else 8
    m = Image.new('L', base.size, 0); m.paste(255, (x0 + f, y0 + f, x1 - f, y1 - f))
    m = m.filter(ImageFilter.GaussianBlur(f / 2))
    out = Image.composite(ed, base, m); out.save(sys.argv[4])
    a, b = L(sys.argv[2]), np.array(out.convert('L')).astype(float)
    ys, xs = np.where(np.abs(a - b) > 0)
    print(f'wrote {sys.argv[4]}; pixels changed only inside x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()}' if len(xs) else 'no change')
elif cmd == 'ink':
    g = Image.open(sys.argv[2]).convert('RGB'); a = np.array(g).astype(int)
    green = (a[:, :, 1] > 150) & (a[:, :, 0] < 120) & (a[:, :, 2] < 120)
    gl = np.array(g.convert('L')).astype(float); gl[green] = 255
    x0, y0, x1, y1 = map(int, sys.argv[3:7]); r = gl[y0:y1, x0:x1]
    lap = np.abs(np.array(Image.fromarray(gl.astype(np.uint8)).filter(ImageFilter.FIND_EDGES)).astype(float))[y0:y1, x0:x1]
    print(f'mean {r.mean():.0f}  mid(90-200) {((r > 90) & (r < 200)).mean():.2f}  lap {lap.mean():.1f}')
if cmd == 'hp':
    # line energy: std of (gray - blur r=2.5) in the box; hatching is high, smooth tone is low
    g = Image.open(sys.argv[2]).convert('L'); x0, y0, x1, y1 = map(int, sys.argv[3:7])
    a = np.array(g).astype(float); b = np.array(g.filter(ImageFilter.GaussianBlur(2.5))).astype(float)
    print(f'hp {(a - b)[y0:y1, x0:x1].std():.1f}')
