#!/usr/bin/env python3
"""OG image = a real screenshot of the page (S5 evidence screen or hero), 1200x630, no synthesis.
Usage: make_og.py <url> <out.jpg> [selector]   (default selector #s5; falls back to the hero)"""
import sys
from playwright.sync_api import sync_playwright
from PIL import Image
url, out = sys.argv[1], sys.argv[2]; sel = sys.argv[3] if len(sys.argv) > 3 else '#s1'
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1200, 'height': 630}, device_scale_factor=2, reduced_motion='reduce')
    pg = ctx.new_page(); pg.goto(url, wait_until='networkidle', timeout=90000)
    pg.evaluate("(s)=>{const el=document.querySelector(s); if(el){el.scrollIntoView({block:'start'});}}", sel); pg.wait_for_timeout(1200)
    pg.screenshot(path='/tmp/aurelia-v2/og_raw.png'); b.close()
im = Image.open('/tmp/aurelia-v2/og_raw.png').convert('RGB').resize((1200, 630), Image.LANCZOS); im.save(out, 'JPEG', quality=86, optimize=True, progressive=True)
print('wrote', out, im.size)
