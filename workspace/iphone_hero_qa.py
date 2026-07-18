import os
from pathlib import Path

from playwright.sync_api import sync_playwright


URL = os.environ.get("KESIXU_URL", "http://127.0.0.1:8090/")
CAPTURE_DIR = Path(os.environ.get(
    "KESIXU_CAPTURE_DIR",
    "/home/oliver/.codex/visualizations/2026/07/18/019f736d-039a-79c3-b65a-d038fccedb14/iphone-hero",
))
CAPTURE_DIR.mkdir(parents=True, exist_ok=True)

IPHONES = (
    "iPhone SE",
    "iPhone 12 Mini",
    "iPhone 13",
    "iPhone 15 Pro Max",
    "iPhone SE landscape",
    "iPhone 13 landscape",
    "iPhone 15 Pro Max landscape",
)


def inspect(browser_type, playwright, device_name):
    browser = browser_type.launch(headless=True)
    context = browser.new_context(**playwright.devices[device_name])
    page = context.new_page()
    console = []
    page.on("console", lambda message: console.append(f"{message.type}: {message.text}")
            if message.type in ("error", "warning") else None)
    page.on("pageerror", lambda error: console.append(f"pageerror: {error}"))
    response = page.goto(URL, wait_until="networkidle")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(700)
    state = page.evaluate(r"""
    () => {
      const rect = (selector) => {
        const el = document.querySelector(selector);
        const r = el.getBoundingClientRect();
        return {x:r.x, y:r.y, left:r.left, right:r.right, top:r.top, bottom:r.bottom,
          width:r.width, height:r.height, scrollWidth:el.scrollWidth, scrollHeight:el.scrollHeight};
      };
      const h1 = document.querySelector('.hero-name h1');
      return {
        viewport: {width:innerWidth, height:innerHeight},
        documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        hero: rect('#hero'),
        whisper: rect('#whisper'),
        lockup: rect('.calligraphy-lockup'),
        title: rect('.hero-name h1'),
        hint: rect('#scrollHint'),
        writingMode: getComputedStyle(h1).writingMode,
        fontSize: parseFloat(getComputedStyle(h1).fontSize),
        fontReady: document.fonts.check('16px "LXGW WenKai"')
      };
    }
    """)
    hero_trigger = page.evaluate(r"""
    () => {
      const trigger = ScrollTrigger.getAll().find(item => item.trigger?.id === 'hero');
      return {start:trigger.start, end:trigger.end};
    }
    """)
    page.evaluate("y => { scrollTo(0, y); ScrollTrigger.update(); }",
                  hero_trigger["start"] + (hero_trigger["end"] - hero_trigger["start"]) * .48)
    page.wait_for_timeout(650)
    state["hintAfterIgnite"] = page.evaluate("+getComputedStyle(document.getElementById('scrollHint')).opacity")
    page.evaluate("y => { scrollTo(0, y); ScrollTrigger.update(); }",
                  hero_trigger["start"] + (hero_trigger["end"] - hero_trigger["start"]) * .62)
    if state["viewport"]["height"] <= 720:
        # Use a fixed transition wait so the public site's strict CSP never needs
        # to allow the string evaluation used internally by wait_for_function.
        page.wait_for_timeout(1000)
    else:
        page.wait_for_timeout(650)
    state["hintAfterDetails"] = page.evaluate("+getComputedStyle(document.getElementById('scrollHint')).opacity")
    state["http"] = response.status if response else 0
    # Snapshot the page's own messages before Playwright's screenshot helper
    # injects its animation-suppression stylesheet under a strict public CSP.
    state["console"] = list(console)
    slug = device_name.lower().replace(" ", "-").replace("(", "").replace(")", "")
    if device_name in ("iPhone SE", "iPhone 12 Mini", "iPhone 15 Pro Max landscape"):
        page.screenshot(path=CAPTURE_DIR / f"{browser_type.name}-{slug}.png")
    context.close()
    browser.close()
    return state


failed = False
with sync_playwright() as playwright:
    for engine_name in ("chromium", "webkit"):
        browser_type = getattr(playwright, engine_name)
        for device_name in IPHONES:
            result = inspect(browser_type, playwright, device_name)
            problems = []
            landscape = device_name.endswith("landscape")
            lockup = result["lockup"]
            title = result["title"]
            hero = result["hero"]
            whisper = result["whisper"]
            hint = result["hint"]
            if result["http"] != 200:
                problems.append(f"HTTP {result['http']}")
            if result["documentOverflow"] > 1:
                problems.append(f"document overflow {result['documentOverflow']}")
            if not result["fontReady"]:
                problems.append("WenKai not ready")
            if lockup["width"] + 1 < title["width"]:
                problems.append(f"zero/narrow lockup {lockup['width']:.2f} < title {title['width']:.2f}")
            if title["left"] < hero["left"] + 4 or title["right"] > hero["right"] - 4:
                problems.append(f"title clipped horizontally {title['left']:.1f}..{title['right']:.1f}")
            if title["top"] < hero["top"] + 4 or title["bottom"] > hero["bottom"] - 4:
                problems.append(f"title clipped vertically {title['top']:.1f}..{title['bottom']:.1f}")
            if whisper["bottom"] > lockup["top"] - 4:
                problems.append(f"whisper/title overlap {whisper['bottom']:.1f} > {lockup['top']:.1f}")
            if hint["top"] < hero["top"] or hint["bottom"] > hero["bottom"] + 1:
                problems.append(f"hint outside hero {hint['top']:.1f}..{hint['bottom']:.1f}")
            expected_mode = "horizontal-tb" if landscape else "vertical-rl"
            if result["writingMode"] != expected_mode:
                problems.append(f"writing mode {result['writingMode']} != {expected_mode}")
            if result["viewport"]["height"] <= 720:
                if result["hintAfterIgnite"] < .35:
                    problems.append(f"compact hint retires before ignition {result['hintAfterIgnite']}")
                if result["hintAfterDetails"] > .08:
                    problems.append(f"compact hint overlaps details {result['hintAfterDetails']}")
            if result["console"]:
                problems.append("console " + " | ".join(result["console"]))
            print(engine_name, device_name,
                  f"{result['viewport']['width']}x{result['viewport']['height']}",
                  f"lock={lockup['width']:.1f} title={title['width']:.1f}",
                  result["writingMode"], "PASS" if not problems else "FAIL")
            for problem in problems:
                print("  -", problem)
            failed = failed or bool(problems)

raise SystemExit(1 if failed else 0)
