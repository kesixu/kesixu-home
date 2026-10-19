#!/usr/bin/env python3
"""Generate images with OpenAI gpt-image-2.5 (flare|sunburst). Key from env OPENAI_API_KEY only.
Usage: gen_image.py --out path.webp --prompt "..." [--model flare|sunburst] [--size 1536x1024] [--quality low|medium|high] [--transparent] [--n 1]
Logs usage + generation_id to <out>.json. Never writes the key anywhere."""
import argparse, base64, json, os, sys, time, urllib.request, urllib.error
ap = argparse.ArgumentParser()
ap.add_argument('--out', required=True); ap.add_argument('--prompt', required=True)
ap.add_argument('--model', default='flare', choices=['flare', 'sunburst'])
ap.add_argument('--size', default='1024x1024'); ap.add_argument('--quality', default='medium')
ap.add_argument('--transparent', action='store_true'); ap.add_argument('--n', type=int, default=1)
ap.add_argument('--format', default='webp', choices=['webp', 'png', 'jpeg'])
a = ap.parse_args()
key = os.environ.get('OPENAI_API_KEY')
if not key: sys.exit('OPENAI_API_KEY missing')
body = {"model": f"gpt-image-2.5-{a.model}", "prompt": a.prompt, "size": a.size, "quality": a.quality,
        "output_format": a.format, "n": a.n}
if a.transparent: body["background"] = "transparent"
req = urllib.request.Request("https://api.openai.com/v1/images/generations", data=json.dumps(body).encode(),
                             headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
for attempt in range(3):
    try:
        t = time.time(); d = json.loads(urllib.request.urlopen(req, timeout=300).read()); break
    except urllib.error.HTTPError as e:
        msg = e.read().decode()[:800]; print('HTTP', e.code, msg, file=sys.stderr)
        if e.code in (429, 500, 502, 503) and attempt < 2: time.sleep(8 * (attempt + 1)); continue
        sys.exit(1)
base, ext = os.path.splitext(a.out)
outs = []
for i, img in enumerate(d['data']):
    p = a.out if (a.n == 1 and i == 0) else f"{base}-{i+1}{ext}"
    open(p, 'wb').write(base64.b64decode(img['b64_json'])); outs.append(p)
meta = {k: v for k, v in d.items() if k != 'data'}; meta.update(prompt=a.prompt, model=body['model'], size=a.size,
        quality=a.quality, elapsed_s=round(time.time() - t, 1), files=outs, generation_ids=[x.get('generation_id') for x in d['data']])
json.dump(meta, open(base + '.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps({"files": outs, "usage": meta.get('usage'), "elapsed_s": meta['elapsed_s']}))
