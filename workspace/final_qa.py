"""《划亮》文案雅化后最终视觉回归 QA。
截图 + 程序化度量：断行/孤字、溢出、lamp-no/lamp-dot 对齐、引信穿点、
朱印、#ember 间距、横屏 hero、console。输出 shots/final-*.png + JSON 度量。
"""
import json
import sys
from playwright.sync_api import sync_playwright

OUT = "/home/oliver/projects/kesixu-home/workspace/shots"
URL = "http://127.0.0.1:8090/"

MEASURE_JS = r"""
() => {
  const res = {};
  const de = document.documentElement;
  res.viewport = { w: de.clientWidth, h: de.clientHeight };
  res.hoverflow = de.scrollWidth - de.clientWidth;

  function lines(el) {
    if (!el) return null;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const chars = [];
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent;
      for (let i = 0; i < t.length; i++) {
        if (/\s/.test(t[i])) continue;
        const r = document.createRange();
        r.setStart(node, i); r.setEnd(node, i + 1);
        const rects = r.getClientRects();
        if (!rects.length) continue;
        const rect = rects[0];
        if (rect.width === 0 && rect.height === 0) continue;
        chars.push({ ch: t[i], top: rect.top });
      }
    }
    const ls = [];
    chars.forEach(c => {
      const cur = ls.length ? ls[ls.length - 1] : null;
      if (cur && Math.abs(cur.top - c.top) < 6) cur.text += c.ch;
      else ls.push({ top: c.top, text: c.ch });
    });
    return ls.map(l => l.text);
  }
  const sel = s => document.querySelector(s);

  res.textlines = {};
  const targets = {
    whisper: '.whisper',
    tagline: '.hero-name .tagline',
    heroEcho: '.hero-name .echo',
    chapterSub: '.chapter-sub',
    skyline: '.sky-line',
    skyEcho: '#sky .echo',
    emberEcho: '#ember .echo',
    keep: '.keep',
    fine: '.fine',
  };
  for (const [k, s] of Object.entries(targets)) res.textlines[k] = lines(sel(s));
  res.aboutLines = [...document.querySelectorAll('#about .line')].map(el => lines(el));
  res.lampDescs = [...document.querySelectorAll('.lamp-desc')].map(el => lines(el));
  res.lampTitles = [...document.querySelectorAll('.lamp h3')].map(el => lines(el));

  res.eloverflow = [];
  document.querySelectorAll('body *').forEach(el => {
    if (el.closest('svg') || el.tagName === 'CANVAS') return;
    if (el.clientWidth > 0 && el.scrollWidth - el.clientWidth > 1) {
      res.eloverflow.push({
        tag: el.tagName, cls: String(el.className).slice(0, 50),
        d: el.scrollWidth - el.clientWidth,
      });
    }
  });

  res.lamps = [...document.querySelectorAll('.lamp')].map(l => {
    const dotEl = l.querySelector('.lamp-dot');
    const no = l.querySelector('.lamp-no');
    const h3 = l.querySelector('h3');
    const dot = dotEl && dotEl.getBoundingClientRect();
    const noR = no && no.getBoundingClientRect();
    let h3line = null;
    if (h3) {
      const tw = document.createTreeWalker(h3, NodeFilter.SHOW_TEXT);
      const n = tw.nextNode();
      if (n && n.textContent.length) {
        const r = document.createRange();
        r.setStart(n, 0); r.setEnd(n, 1);
        const rr = r.getClientRects()[0];
        if (rr) h3line = { top: rr.top, bottom: rr.bottom, cy: (rr.top + rr.bottom) / 2 };
      }
    }
    return {
      lit: l.classList.contains('lit'),
      noColor: no ? getComputedStyle(no).color : null,
      dotCy: dot ? dot.top + dot.height / 2 : null,
      dotCx: dot ? dot.left + dot.width / 2 : null,
      noCy: noR ? (noR.top + noR.bottom) / 2 : null,
      h3lineCy: h3line ? h3line.cy : null,
      h3lineTop: h3line ? h3line.top : null,
      h3lineBottom: h3line ? h3line.bottom : null,
    };
  });

  const base = document.getElementById('fuseBase');
  if (base && base.getAttribute('d')) {
    const svg = document.getElementById('fuse');
    const sr = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const total = base.getTotalLength();
    const pts = [];
    for (let i = 0; i <= 4000; i++) pts.push(base.getPointAtLength(total * i / 4000));
    res.fuseDotDist = [...document.querySelectorAll('.lamp-dot')].map(d => {
      const r = d.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let best = 1e9;
      for (const p of pts) {
        const sx = sr.left + (p.x - vb.x) * (sr.width / vb.width);
        const sy = sr.top + (p.y - vb.y) * (sr.height / vb.height);
        const dd = Math.hypot(sx - cx, sy - cy);
        if (dd < best) best = dd;
      }
      return Math.round(best * 10) / 10;
    });
  }

  const seal = sel('.seal');
  if (seal) {
    const r = seal.getBoundingClientRect();
    const cs = getComputedStyle(seal);
    let clipper = null, e = seal.parentElement;
    while (e && e !== document.body) {
      const o = getComputedStyle(e);
      if (/(hidden|clip|scroll|auto)/.test(o.overflow)) { clipper = e.tagName + '.' + e.className; break; }
      e = e.parentElement;
    }
    res.seal = {
      rect: { t: +r.top.toFixed(1), l: +r.left.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
      writingMode: cs.writingMode, transform: cs.transform,
      text: seal.textContent, clipper,
    };
  }

  const ember = sel('#ember');
  if (ember) {
    res.emberChildren = [...ember.children].map(c => {
      const r = c.getBoundingClientRect();
      return { cls: (String(c.className) || c.tagName).slice(0, 30), top: Math.round(r.top), h: Math.round(r.height) };
    });
    const ee = sel('#ember .echo');
    if (ee) {
      const cs = getComputedStyle(ee);
      res.emberEchoStyle = { fs: cs.fontSize, lh: cs.lineHeight, ls: cs.letterSpacing };
    }
  }

  const h1 = sel('.hero-name h1');
  const hn = sel('.hero-name');
  if (h1 && hn) {
    const r = h1.getBoundingClientRect(), rn = hn.getBoundingClientRect();
    res.hero = {
      wm: getComputedStyle(h1).writingMode,
      h1: { t: +r.top.toFixed(1), l: +r.left.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) },
      nameBox: { t: +rn.top.toFixed(1), l: +rn.left.toFixed(1), r: +rn.right.toFixed(1), b: +rn.bottom.toFixed(1) },
    };
  }

  const flare = document.querySelectorAll('#dipper .flare');
  if (flare.length) {
    res.flare = [...flare].map(f => {
      const cs = getComputedStyle(f);
      return { stroke: cs.stroke, opacity: cs.opacity, width: cs.strokeWidth };
    });
  }
  return res;
}
"""


def run_vp(p, name, width, height, dsf, lamps_pairs=True):
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": width, "height": height},
                              device_scale_factor=dsf)
    page = ctx.new_page()
    console = []
    page.on("console", lambda m: console.append(f"[{m.type}] {m.text}")
            if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: console.append(f"[pageerror] {e}"))
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(600)

    vh = height
    manifest = []

    def snap(tag, y):
        y = max(0, int(y))
        page.evaluate(f"window.scrollTo(0, {y})")
        page.wait_for_timeout(1600)  # scrub 提到 0.7/0.8，多等一点
        fn = f"{OUT}/final-{name}-{tag}.png"
        page.screenshot(path=fn)
        manifest.append({"shot": f"final-{name}-{tag}.png", "scrollY": y})

    def el_top(s):
        return page.evaluate(
            f"document.querySelector('{s}').getBoundingClientRect().top + window.scrollY")

    # 初始未点亮态的 lamp-no 颜色（对照）
    unlit = page.evaluate("getComputedStyle(document.querySelector('.lamp-no')).color")

    snap("0-dark", 0)
    snap("1-tagline", vh * 2.3 * 0.78)
    snap("2-about-a", el_top("#about .line") - vh * 0.16)
    snap("3-about-b", el_top("#about .line.strong") - vh * 0.42)
    if lamps_pairs:
        for k in (1, 3, 5, 7):
            snap(f"4-lamp{k}", el_top(f".lamp:nth-child({k})") - vh * 0.10)
    snap("7-sky", el_top("#sky") + 60)
    snap("8-ember", page.evaluate("document.documentElement.scrollHeight") - vh)

    metrics = page.evaluate(MEASURE_JS)
    metrics["unlitLampNoColor"] = unlit
    metrics["console"] = console
    metrics["manifest"] = manifest

    # 页脚细节图（fine + copyright 联合裁切）
    try:
        clip = page.evaluate("""() => {
          const a = document.querySelector('.fine').getBoundingClientRect();
          const b = document.querySelector('.copyright').getBoundingClientRect();
          const t = Math.min(a.top, b.top) - 8, l = Math.min(a.left, b.left) - 8;
          return {x: Math.max(0, l), y: Math.max(0, t),
                  width: Math.max(a.right, b.right) - l + 16,
                  height: Math.max(a.bottom, b.bottom) - t + 8};
        }""")
        page.screenshot(path=f"{OUT}/final-{name}-9-footer.png", clip=clip)
        manifest.append({"shot": f"final-{name}-9-footer.png"})
    except Exception as e:
        metrics["footerShotError"] = str(e)

    ctx.close()
    browser.close()
    return metrics


def main():
    out = {}
    with sync_playwright() as p:
        out["m360"] = run_vp(p, "m360", 360, 780, 2)
        out["m390"] = run_vp(p, "m390", 390, 844, 2)
        out["d1440"] = run_vp(p, "d1440", 1440, 900, 1)
        # 横屏：只关心 hero 与全局体检
        out["land"] = run_vp(p, "land", 844, 390, 2, lamps_pairs=False)
    path = "/home/oliver/projects/kesixu-home/workspace/final_qa_metrics.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("metrics ->", path)
    for vp, m in out.items():
        print(f"== {vp} console ==")
        print("\n".join(m["console"]) if m["console"] else "(clean)")
        print(f"   hoverflow={m['hoverflow']} eloverflow={m['eloverflow']}")


if __name__ == "__main__":
    sys.exit(main())
