"""QA 截图：360/390/1440 三档全节点 + 390x930 超高屏 + 844x390 横屏 hero。
输出 workspace/shots/qa-*.png，并打印每档的诊断数据（溢出/引信对齐/字名几何/控制台）。"""
import json
from playwright.sync_api import sync_playwright

OUT = "/home/oliver/projects/kesixu-home/workspace/shots"
URL = "http://127.0.0.1:8090/"

FULL_BEATS = True

DIAG_JS = """
() => {
  const de = document.documentElement;
  const out = { hOverflow: de.scrollWidth - de.clientWidth, docH: de.scrollHeight };
  const story = document.getElementById('story');
  const path = document.getElementById('fuseBase');
  if (story && path && path.getTotalLength) {
    const storyTop = story.getBoundingClientRect().top + scrollY;
    const storyLeft = story.getBoundingClientRect().left + scrollX;
    const L = path.getTotalLength();
    const yAt = t => path.getPointAtLength(t).y;
    out.fuseDeltas = [...document.querySelectorAll('.lamp-dot')].map(d => {
      const r = d.getBoundingClientRect();
      const cy = r.top + r.height/2 + scrollY - storyTop;
      const cx = r.left + r.width/2 + scrollX - storyLeft;
      let lo = 0, hi = L;                       // path y 单调，二分找同高点
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (yAt(mid) < cy) lo = mid; else hi = mid;
      }
      return +(path.getPointAtLength((lo+hi)/2).x - cx).toFixed(2);
    });
  }
  return out;
}
"""

HERO_GEO_JS = """
() => {
  const g = s => { const r = document.querySelector(s).getBoundingClientRect();
    return {t:+r.top.toFixed(1), b:+r.bottom.toFixed(1), l:+r.left.toFixed(1), r:+r.right.toFixed(1)}; };
  return { W: innerWidth, H: innerHeight, h1: g('.hero-name h1'), name: g('.hero-name'),
           tag: g('.hero-name .tagline'), flameAnchor: {x:+(innerWidth*0.72).toFixed(1), y:+(innerHeight*0.56).toFixed(1)} };
}
"""

def shoot(p, name, width, height, dsf, hero_only=False):
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": width, "height": height},
                              device_scale_factor=dsf)
    page = ctx.new_page()
    logs = []
    page.on("console", lambda m: logs.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: logs.append(f"[pageerror] {e}"))
    page.on("requestfailed", lambda r: logs.append(f"[reqfail] {r.url} {r.failure}"))
    page.on("response", lambda r: logs.append(f"[http {r.status}] {r.url}") if r.status >= 400 else None)
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(700)

    vh = height

    def snap(tag, y, settle=1400):
        page.evaluate(f"window.scrollTo(0, {max(0, int(y))})")
        page.wait_for_timeout(settle)
        page.screenshot(path=f"{OUT}/qa-{name}-{tag}.png")

    def el_top(sel):
        return page.evaluate(
            f"document.querySelector('{sel}').getBoundingClientRect().top + window.scrollY")

    snap("0-dark", 0)
    snap("1-strike", vh * 2.3 * 0.30)
    snap("2-name", vh * 2.3 * 0.78)
    hero_geo = page.evaluate(HERO_GEO_JS)

    if not hero_only:
        snap("3-about", el_top("#about") - vh * 0.30)
        snap("4-lamps-head", el_top("#lamps") - vh * 0.35)
        snap("5-lamp-mid", el_top(".lamp:nth-child(4)") - vh * 0.45)
        snap("6-lamp-match", el_top(".lamp:nth-child(5)") - vh * 0.45)
        snap("7-sky", el_top("#sky") + 100, settle=3200)
        snap("8-ember", page.evaluate("document.documentElement.scrollHeight") - vh, settle=2400)

    diag = page.evaluate(DIAG_JS)
    print(f"\n== {name} ({width}x{height}@{dsf}x) ==")
    print("heroGeo:", json.dumps(hero_geo))
    print("diag:", json.dumps(diag))
    print("console:", "\n  ".join(logs) if logs else "(clean)")
    ctx.close(); browser.close()

with sync_playwright() as p:
    shoot(p, "s360", 360, 780, 2)
    shoot(p, "m390", 390, 844, 2)
    shoot(p, "d1440", 1440, 900, 1)
    shoot(p, "tall390", 390, 930, 2, hero_only=True)
    shoot(p, "land844", 844, 390, 2, hero_only=True)
print("\ndone")
