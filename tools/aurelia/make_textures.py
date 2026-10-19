#!/usr/bin/env python3
"""Generated textures -> single-channel (grayscale) WebP. Colour is applied later by CSS blend over --ink, so no foreign hue can enter the page.
lattice/haze: resize to 1440 wide, normalise + soften contrast. paper: 512x512 mirrored tile (seamless by construction)."""
import sys, os, numpy as np
from PIL import Image, ImageOps, ImageFilter
SRC, OUT = sys.argv[1], sys.argv[2]
def gray(p): return ImageOps.grayscale(Image.open(p))
def soften(im, lo_pct=0.5, hi_pct=99.5, gamma=1.0):
    a = np.asarray(im).astype(np.float32); lo, hi = np.percentile(a, lo_pct), np.percentile(a, hi_pct)
    a = np.clip((a - lo) / max(1, hi - lo), 0, 1) ** gamma
    return Image.fromarray((a * 255).astype(np.uint8))
for name, w in [('lattice', 1440), ('haze', 1440)]:
    im = gray(f'{SRC}/{name}.png'); im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im = soften(im).filter(ImageFilter.GaussianBlur(0.6))
    im.save(f'{OUT}/{name}.webp', 'WEBP', quality=68, method=6); print(name, im.size, os.path.getsize(f'{OUT}/{name}.webp') // 1024, 'KB')
im = gray(f'{SRC}/paper.png').resize((512, 512), Image.LANCZOS)
a = np.asarray(im).astype(np.float32); a = (a - a.mean()) * 0.6 + 128  # flatten: subtle fibre only
t = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
tile = Image.new('L', (1024, 1024)); tile.paste(t, (0, 0)); tile.paste(ImageOps.mirror(t), (512, 0)); tile.paste(ImageOps.flip(t), (0, 512)); tile.paste(ImageOps.flip(ImageOps.mirror(t)), (512, 512))
tile = tile.resize((512, 512), Image.LANCZOS); tile.save(f'{OUT}/paper.webp', 'WEBP', quality=60, method=6)
print('paper', tile.size, os.path.getsize(f'{OUT}/paper.webp') // 1024, 'KB')
