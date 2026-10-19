#!/usr/bin/env python3
"""Acceptance run for one URL: console errors, pageerrors, CSP violations, third-party requests, transferred JS bytes,
screenshots at several scroll fractions for mobile (390x844) + desktop (1440x900), with and without reduced motion.
Usage: verify_page.py <url> <outdir> [--fractions 0,0.15,0.3,...] [--settle-ms 900]"""
import sys, json, os, argparse, urllib.parse
from playwright.sync_api import sync_playwright
ap = argparse.ArgumentParser(); ap.add_argument('url'); ap.add_argument('outdir')
ap.add_argument('--fractions', default='0,0.12,0.25,0.4,0.55,0.7,0.85,1'); ap.add_argument('--settle-ms', type=int, default=900)
ap.add_argument('--reduced', action='store_true', help='also run with prefers-reduced-motion: reduce')
ap.add_argument('--nojs', action='store_true', help='also run with JavaScript disabled (progressive-enhancement baseline)')
a = ap.parse_args(); os.makedirs(a.outdir, exist_ok=True)
host = urllib.parse.urlparse(a.url).hostname
fracs = [float(x) for x in a.fractions.split(',')]
report = {}
INIT = """window.__cspv=[];document.addEventListener('securitypolicyviolation',e=>{window.__cspv.push(e.violatedDirective+' '+(e.blockedURI||'')+' line'+e.lineNumber)});"""
def run(b, name, vp, mobile, reduced, js=True):
    ctx = b.new_context(viewport=vp, device_scale_factor=2, is_mobile=mobile, has_touch=mobile, java_script_enabled=js,
                        reduced_motion='reduce' if reduced else 'no-preference')
    pg = ctx.new_page()
    if js: pg.add_init_script(INIT)
    errs, reqs, jsbytes = [], [], 0
    pg.on('console', lambda m: errs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    def on_resp(r):
        nonlocal jsbytes
        u = urllib.parse.urlparse(r.url)
        if u.hostname and u.hostname != host and not r.url.startswith('data:'): reqs.append(r.url)
        if r.request.resource_type == 'script':
            try: jsbytes += int(r.headers.get('content-length') or len(r.body()))
            except Exception: pass
    pg.on('response', on_resp)
    pg.goto(a.url, wait_until='networkidle', timeout=90000); pg.wait_for_timeout(a.settle_ms)
    H = pg.evaluate('document.documentElement.scrollHeight'); vh = vp['height']
    shots = []
    for f in fracs:
        y = int((H - vh) * f); pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(a.settle_ms)
        p = f'{a.outdir}/{name}-{int(f*100):03d}.png'; pg.screenshot(path=p); shots.append(p)
    pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(300)
    pg.screenshot(path=f'{a.outdir}/{name}-full.png', full_page=True)
    cspv = pg.evaluate('window.__cspv') if js else []
    overflow = pg.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth + 1')
    report[name] = dict(scrollHeight=H, errors=errs, csp_violations=cspv, third_party=sorted(set(reqs)), js_bytes=jsbytes, overflow=overflow, shots=shots)
    ctx.close()
with sync_playwright() as p:
    b = p.chromium.launch()
    run(b, 'm', {'width': 390, 'height': 844}, True, False)
    run(b, 'd', {'width': 1440, 'height': 900}, False, False)
    if a.reduced: run(b, 'm-reduced', {'width': 390, 'height': 844}, True, True)
    if a.nojs: run(b, 'm-nojs', {'width': 390, 'height': 844}, True, False, js=False)
    b.close()
json.dump(report, open(f'{a.outdir}/report.json', 'w'), indent=1, ensure_ascii=False)
ok = all(not v['errors'] and not v['csp_violations'] and not v['third_party'] and not v['overflow'] for v in report.values())
for k, v in report.items(): print(k, 'H=', v['scrollHeight'], 'errors=', len(v['errors']), 'csp=', len(v['csp_violations']), '3rd=', len(v['third_party']), 'js_bytes=', v['js_bytes'], 'overflow=', v['overflow'])
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
