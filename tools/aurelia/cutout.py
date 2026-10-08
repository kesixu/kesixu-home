"""Cut porcelain objects out of museum photos with Grounded-SAM2 (repo module), feather edges, save RGBA PNG + contact sheet on ink ground."""
import sys, os, glob, numpy as np
sys.path.insert(0, '/home/u1960270/startup/aurelia-connoisseur/src')
from PIL import Image, ImageFilter, ImageDraw
from aurelia.evidence.grounded_sam import object_mask
SRC = '/tmp/aurelia-v2/assets/print'; OUT = '/tmp/aurelia-v2/assets/cut'
MAXS = 1800
ids = sys.argv[1:] or [os.path.basename(p)[:-4] for p in sorted(glob.glob(f'{SRC}/*.jpg'))]
tiles = []
for oid in ids:
    im = Image.open(f'{SRC}/{oid}.jpg').convert('RGB'); im.thumbnail((MAXS, MAXS), Image.LANCZOS)
    m = object_mask(im, 'porcelain vessel')
    if m is None:
        print(oid, 'NO MASK'); continue
    cov = m.mean()
    mask = Image.fromarray((m * 255).astype(np.uint8))
    # clean: slight erosion of halo then feather
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    rgba = im.copy(); rgba.putalpha(mask)
    bbox = mask.getbbox(); rgba = rgba.crop(bbox)
    rgba.save(f'{OUT}/{oid}.png', optimize=True)
    print(oid, im.size, 'coverage %.2f' % cov, 'crop', rgba.size)
    t = Image.new('RGB', (300, 340), (13, 11, 9)); th = rgba.copy(); th.thumbnail((280, 280))
    t.paste(th, ((300 - th.width) // 2, 10), th); ImageDraw.Draw(t).text((6, 300), f'{oid} cov={cov:.2f}', fill=(230, 220, 200))
    tiles.append(t)
cols = 6; rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (cols * 300, rows * 340), (13, 11, 9))
for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * 300, (i // cols) * 340))
sheet.save(f'{OUT}/_contact.jpg', quality=85); print('sheet', sheet.size)
