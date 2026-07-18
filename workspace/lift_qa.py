import os
from pathlib import Path

from playwright.sync_api import sync_playwright


URL = os.environ.get("KESIXU_URL", "http://127.0.0.1:8090/")
CAPTURE_DIR = Path(os.environ.get(
    "KESIXU_CAPTURE_DIR",
    "/home/oliver/.codex/visualizations/2026/07/18/019f736d-039a-79c3-b65a-d038fccedb14",
))
CAPTURE_DIR.mkdir(parents=True, exist_ok=True)

VIEWPORTS = ((360, 780), (390, 844), (430, 932), (844, 390), (1440, 900))


def route_progress(page):
    return page.evaluate(r"""
    () => {
      const path = document.getElementById('fuseBase');
      const story = document.getElementById('story');
      const storyRect = story.getBoundingClientRect();
      const length = path.getTotalLength();
      return [...document.querySelectorAll('[data-ignite]')].map((el) => {
        const dot = el.querySelector('.hero-dot');
        const rect = (dot || el).getBoundingClientRect();
        const minor = el.matches('.rest-lamps li');
        const font = minor ? parseFloat(getComputedStyle(el).fontSize) : 0;
        const target = {
          x: minor ? rect.left - 8.5 - storyRect.left : rect.left + rect.width / 2 - storyRect.left,
          y: minor ? rect.top + font * 1.08 + 2.5 - storyRect.top : rect.top + rect.height / 2 - storyRect.top
        };
        let best = {distance: Infinity, progress: 0};
        for (let step = 0; step <= 1800; step++) {
          const progress = step / 1800;
          const point = path.getPointAtLength(length * progress);
          const distance = Math.hypot(point.x - target.x, point.y - target.y);
          if (distance < best.distance) best = {distance, progress};
        }
        return {
          name: (el.querySelector('h3, strong')?.textContent || '').replace('↗', '').trim(),
          progress: best.progress,
          distance: best.distance
        };
      }).sort((a, b) => a.progress - b.progress);
    }
    """)


def run_motion(playwright, width, height):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=2 if width < 900 else 1,
    )
    page = context.new_page()
    console = []
    external = []
    page.on("console", lambda message: console.append(f"{message.type}: {message.text}")
            if message.type in ("error", "warning") else None)
    page.on("pageerror", lambda error: console.append(f"pageerror: {error}"))

    expected_host = "127.0.0.1" if URL.startswith("http://127.0.0.1") else "kesixu.com"
    page.on("request", lambda request: external.append(request.url)
            if expected_host not in request.url else None)
    response = page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(900)

    initial = page.evaluate(r"""
    () => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hint: document.getElementById('scrollHint').innerText.trim(),
      hintOpacity: +getComputedStyle(document.getElementById('scrollHint')).opacity,
      nameOpacity: +getComputedStyle(document.getElementById('heroName')).opacity,
      cellularCode: document.documentElement.innerHTML.includes('cellMotifs'),
      accessibleProjects: document.querySelectorAll('.hero-lamp[href], .rest-lamps a').length,
      firstSecondary: document.querySelector('.rest-lamps li')?.textContent.trim() || '',
      lockedProjects: document.querySelectorAll('.rest-lamps [data-locked]').length,
      lockIcons: document.querySelectorAll('.project-lock').length,
      constellationStars: document.querySelectorAll('#dipperStars .star').length,
      coreStars: document.querySelectorAll('#dipperStars .star.core').length,
      motionTier: document.documentElement.dataset.motionTier || '',
      motionFps: +(document.documentElement.dataset.motionFps || 0),
      motionPixels: +(document.documentElement.dataset.motionPixels || 0),
      wildfirePixels: document.getElementById('wildfire').width * document.getElementById('wildfire').height
    })
    """)
    if width == 390:
        page.screenshot(path=CAPTURE_DIR / "home-start.png")
    page.evaluate("scrollTo(0, 18)")
    page.wait_for_timeout(650)
    hint_after_scroll = page.evaluate("+getComputedStyle(document.getElementById('scrollHint')).opacity")
    hero_trigger = page.evaluate(r"""
    () => {
      const trigger = ScrollTrigger.getAll().find(item => item.trigger?.id === 'hero');
      return {start: trigger.start, end: trigger.end};
    }
    """)
    page.evaluate("top => scrollTo(0, top)", hero_trigger["start"] + (hero_trigger["end"] - hero_trigger["start"]) * .62)
    page.wait_for_timeout(800)
    hint_after_ignite = page.evaluate("+getComputedStyle(document.getElementById('scrollHint')).opacity")
    page.evaluate("top => scrollTo(0, top)", hero_trigger["end"] + 12)
    page.wait_for_timeout(700)
    hint_after_story = page.evaluate("+getComputedStyle(document.getElementById('scrollHint')).opacity")

    route = route_progress(page)
    main_route = route[:3]
    ignition_order = []
    spark_bytes = 0
    wildfire_bytes = 0

    if width in (390, 1440):
        trigger = page.evaluate(r"""
        () => {
          const trigger = ScrollTrigger.getAll().find((item) => item.trigger?.id === 'story');
          return {start: trigger.start, end: trigger.end};
        }
        """)
        for index, target in enumerate(route):
            scroll_y = trigger["start"] + (trigger["end"] - trigger["start"]) * min(.998, target["progress"] + .006)
            page.evaluate("top => scrollTo(0, top)", scroll_y)
            page.wait_for_timeout(1050)
            lit = page.evaluate("[...document.querySelectorAll('[data-ignite]')].filter(el => el.classList.contains('lit')).map(el => (el.querySelector('h3, strong')?.textContent || '').replace('↗','').trim())")
            ignition_order = lit
            if index < 3:
                spark_bytes = max(spark_bytes, page.evaluate("document.getElementById('fuseSpark').toDataURL().length"))
                if width == 390:
                    page.screenshot(path=CAPTURE_DIR / f"home-ignite-{index + 1}.png")

        sky_trigger = page.evaluate(r"""
        () => {
          const trigger = ScrollTrigger.getById('sky-transition');
          return trigger ? {start: trigger.start, end: trigger.end} : null;
        }
        """)
        if sky_trigger:
            sky_y = sky_trigger["start"] + (sky_trigger["end"] - sky_trigger["start"]) * .46
            page.evaluate("top => scrollTo(0, top)", sky_y)
            page.wait_for_timeout(1100)
            wildfire_bytes = page.evaluate("document.getElementById('wildfire')?.toDataURL().length || 0")
            if width == 390:
                page.screenshot(path=CAPTURE_DIR / "home-wildfire.png")

    page.evaluate("scrollTo(0, document.documentElement.scrollHeight)")
    page.wait_for_timeout(1600)
    final_lit = page.locator("[data-ignite].lit").count()

    state = {
        "viewport": f"{width}x{height}",
        "http": response.status if response else 0,
        "initial": initial,
        "hintAfterScroll": hint_after_scroll,
        "hintAfterIgnite": hint_after_ignite,
        "hintAfterStory": hint_after_story,
        "route": route,
        "mainAnchorMax": max(item["distance"] for item in main_route),
        "sparkBytes": spark_bytes,
        "wildfireBytes": wildfire_bytes,
        "lit": final_lit,
        "ignitionOrder": ignition_order,
        "console": console,
        "external": external,
    }
    browser.close()
    return state


def run_fallback(playwright, reduced=False, no_js=False):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        reduced_motion="reduce" if reduced else "no-preference",
        java_script_enabled=not no_js,
    )
    page = context.new_page()
    page.goto(URL, wait_until="networkidle")
    state = page.evaluate(r"""
    () => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      visibleProjects: [...document.querySelectorAll('[data-ignite]')].filter(el => +getComputedStyle(el).opacity > .95).length,
      visibleStars: [...document.querySelectorAll('#dipperStars .star')].filter(el => +getComputedStyle(el).opacity > .95).length,
      lockIcons: document.querySelectorAll('.project-lock').length,
      fuseOpacity: +getComputedStyle(document.getElementById('fuseHead')).opacity,
      fx: document.documentElement.classList.contains('fx')
    })
    """)
    browser.close()
    return state


failed = False
with sync_playwright() as playwright:
    for viewport in VIEWPORTS:
        result = run_motion(playwright, *viewport)
        problems = []
        if result["http"] != 200:
            problems.append(f"HTTP {result['http']}")
        if result["initial"]["overflow"] > 1:
            problems.append(f"overflow {result['initial']['overflow']}")
        if "下滑" not in result["initial"]["hint"] or "看更多" not in result["initial"]["hint"]:
            problems.append(f"hint {result['initial']['hint']}")
        if result["initial"]["hintOpacity"] < .9 or result["initial"]["nameOpacity"] < .2:
            problems.append("initial guide/name hidden")
        if result["hintAfterScroll"] < .35:
            problems.append(f"hint retires before ignition {result['hintAfterScroll']}")
        if viewport[1] <= 720:
            if result["hintAfterIgnite"] > .08:
                problems.append(f"compact hint overlaps details {result['hintAfterIgnite']}")
        elif result["hintAfterIgnite"] < .35:
            problems.append(f"hint retires early {result['hintAfterIgnite']}")
        if result["hintAfterStory"] > .05:
            problems.append(f"hint remains after story {result['hintAfterStory']}")
        if result["initial"]["accessibleProjects"] != 4 or not result["initial"]["firstSecondary"].startswith("MatchPoint"):
            problems.append("accessible project order")
        if result["initial"]["lockedProjects"] != 5 or result["initial"]["lockIcons"] != 5:
            problems.append(f"locks {result['initial']['lockedProjects']}/{result['initial']['lockIcons']}")
        if result["initial"]["constellationStars"] != 9 or result["initial"]["coreStars"] != 3:
            problems.append(f"stars {result['initial']['constellationStars']}/{result['initial']['coreStars']}")
        if result["initial"]["motionTier"] not in ("high", "balanced", "eco") or result["initial"]["motionFps"] not in (30, 45, 60):
            problems.append(f"motion profile {result['initial']['motionTier']}/{result['initial']['motionFps']}")
        if result["initial"]["motionPixels"] <= 0 or result["initial"]["wildfirePixels"] > result["initial"]["motionPixels"] * 1.01:
            problems.append(f"canvas budget {result['initial']['wildfirePixels']}/{result['initial']['motionPixels']}")
        if result["mainAnchorMax"] > 2:
            problems.append(f"anchor miss {result['mainAnchorMax']:.2f}")
        if result["lit"] != 9:
            problems.append(f"lit {result['lit']}/9")
        if viewport[0] in (390, 1440) and result["sparkBytes"] < 1000:
            problems.append(f"empty spark {result['sparkBytes']}")
        if viewport[0] in (390, 1440) and result["wildfireBytes"] < 1000:
            problems.append(f"empty wildfire {result['wildfireBytes']}")
        if result["console"]:
            problems.append("console " + " | ".join(result["console"]))
        if result["external"]:
            problems.append("external " + " | ".join(result["external"]))
        failed |= bool(problems)
        print(f"{result['viewport']} anchors={result['mainAnchorMax']:.2f} spark={result['sparkBytes']} wildfire={result['wildfireBytes']} lit={result['lit']}/9 " + ("PASS" if not problems else "FAIL " + "; ".join(problems)))

    reduced = run_fallback(playwright, reduced=True)
    no_js = run_fallback(playwright, no_js=True)
    reduced_ok = reduced["visibleProjects"] == 9 and reduced["visibleStars"] == 9 and reduced["lockIcons"] == 5 and not reduced["fx"] and reduced["overflow"] <= 1
    no_js_ok = no_js["visibleProjects"] == 9 and no_js["visibleStars"] == 9 and no_js["lockIcons"] == 5 and not no_js["fx"] and no_js["overflow"] <= 1
    failed |= not reduced_ok or not no_js_ok
    print(f"reduced-motion {reduced} {'PASS' if reduced_ok else 'FAIL'}")
    print(f"no-js {no_js} {'PASS' if no_js_ok else 'FAIL'}")

raise SystemExit(1 if failed else 0)
