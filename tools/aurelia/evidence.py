"""Real evidence for the page: object mask -> outline SVG path, aesthetic fields, and language-grounded part boxes."""
import sys, json, numpy as np, cv2
sys.path.insert(0, '/home/u1960270/startup/aurelia-connoisseur/src')
from PIL import Image
from aurelia.evidence.grounded_sam import object_mask, part_masks
from aurelia.aesthetics.fields import compute_fields
out = {}
for oid in sys.argv[1:]:
    im = Image.open(f'/tmp/aurelia-v2/assets/print/{oid}.jpg').convert('RGB'); im.thumbnail((1800, 1800), Image.LANCZOS)
    m = object_mask(im, 'porcelain vessel'); arr = np.array(im)
    f = compute_fields(arr, m)
    # outline from mask -> largest contour -> simplify -> normalized path (0..1000 box of the mask bbox)
    ys, xs = np.where(m); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
    cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(cnts, key=cv2.contourArea); eps = 0.0025 * cv2.arcLength(c, True); c = cv2.approxPolyDP(c, eps, True)[:, 0, :]
    w, h = x1 - x0 + 1, y1 - y0 + 1
    pts = [(round((x - x0) / w * 1000, 1), round((y - y0) / h * 1000, 1)) for x, y in c]
    path = 'M' + ' L'.join(f'{x},{y}' for x, y in pts) + ' Z'
    parts = {}
    for phrase in ['rim of the vessel', 'foot of the vessel', 'neck of the vessel', 'body of the vessel']:
        try:
            r = part_masks(im, [phrase])
            if phrase in r:
                bx = r[phrase]['box']; parts[phrase] = {'box_rel': [round((bx[0]-x0)/w,3), round((bx[1]-y0)/h,3), round((bx[2]-x0)/w,3), round((bx[3]-y0)/h,3)], 'score': round(r[phrase]['score'],3)}
        except Exception as e: parts[phrase] = {'error': str(e)[:80]}
    out[oid] = {'size': im.size, 'bbox': [int(x0), int(y0), int(x1), int(y1)], 'fields': {'symmetry': round(f.symmetry,4), 'glaze_uniformity': round(f.glaze_uniformity,4), 'decoration_density': round(f.decoration_density,4), 'n_body_px': int(f.n_body_px)}, 'outline_path': path, 'outline_pts': len(pts), 'parts': parts}
    print(oid, out[oid]['fields'], 'pts', len(pts), {k: v.get('score') or v for k, v in parts.items()})
json.dump(out, open('/tmp/aurelia-v2/data/evidence.json', 'w'), indent=1)
