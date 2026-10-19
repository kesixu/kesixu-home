#!/usr/bin/env python3
"""Export vessel cutouts (RGBA PNG from cutout.py) to WebP-with-alpha at the sizes the page needs. No metadata is written."""
import sys, os
from PIL import Image
SRC = sys.argv[1]; OUT = sys.argv[2]
# id -> list of max-side sizes
PLAN = {
 'cma_140168': [1400, 900], 'cma_97956': [1100, 700], 'cma_135015': [1400, 900], 'cma_134979': [1100, 700], 'cma_120203': [900],
 'cma_134843': [900], 'cma_121469': [900], 'met_49855': [900], 'met_39666': [900], 'cma_154732': [900], 'cma_112196': [900],
 'aic_80869': [700], 'cma_134997': [700], 'cma_284746': [700], 'cma_153286': [700], 'aic_58904': [700],
}
total = 0
for oid, sizes in PLAN.items():
    im = Image.open(f'{SRC}/{oid}.png').convert('RGBA')
    for s in sizes:
        t = im.copy(); t.thumbnail((s, s), Image.LANCZOS)
        p = f'{OUT}/{oid}-{s}.webp'; t.save(p, 'WEBP', quality=82, method=6, exact=False)
        total += os.path.getsize(p); print(oid, s, t.size, os.path.getsize(p) // 1024, 'KB')
print('TOTAL', total // 1024, 'KB')
