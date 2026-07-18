import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("KESIXU_URL", "http://127.0.0.1:8090/")
CAPTURE_DIR = Path(os.environ.get(
    "KESIXU_CAPTURE_DIR",
    "/home/oliver/.codex/visualizations/2026/07/18/019f736d-039a-79c3-b65a-d038fccedb14",
))
CAPTURE_DIR.mkdir(parents=True, exist_ok=True)


def with_motion(url, tier):
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query))
    if tier:
        query["motion"] = tier
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def inspect_profile(playwright, forced_tier=None):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=3,
    )
    page = context.new_page()
    console = []
    external = []
    expected_host = "127.0.0.1" if BASE_URL.startswith("http://127.0.0.1") else "kesixu.com"
    page.on("console", lambda message: console.append(f"{message.type}: {message.text}")
            if message.type in ("error", "warning") else None)
    page.on("pageerror", lambda error: console.append(f"pageerror: {error}"))
    page.on("request", lambda request: external.append(request.url)
            if expected_host not in request.url else None)
    response = page.goto(with_motion(BASE_URL, forced_tier), wait_until="networkidle")
    page.wait_for_timeout(900)

    profile = page.evaluate(r"""
    () => {
      const root = document.documentElement.dataset;
      const canvas = document.getElementById('wildfire');
      const flame = document.getElementById('flame');
      return {
        tier: root.motionTier || '',
        fps: +(root.motionFps || 0),
        budget: +(root.motionPixels || 0),
        width: canvas.width,
        height: canvas.height,
        pixels: canvas.width * canvas.height,
        flamePixels: flame.width * flame.height
      };
    }
    """)

    sky_trigger = page.evaluate(r"""
    () => {
      const trigger = ScrollTrigger.getById('sky-transition');
      return trigger ? {start: trigger.start, end: trigger.end} : null;
    }
    """)
    page.evaluate("y => scrollTo(0, y)", sky_trigger["start"] + (sky_trigger["end"] - sky_trigger["start"]) * .46)
    page.wait_for_timeout(1200)
    wildfire_bytes = page.evaluate("document.getElementById('wildfire').toDataURL().length")
    if forced_tier == "eco":
        page.screenshot(path=CAPTURE_DIR / "wildfire-eco.png")

    page.evaluate("y => scrollTo(0, y)", sky_trigger["end"] + 24)
    page.wait_for_timeout(900)
    visible_stars = page.evaluate(r"""
    [...document.querySelectorAll('#dipperStars .star')]
      .filter(star => +getComputedStyle(star).opacity > .9).length
    """)
    state = {
        "http": response.status if response else 0,
        "profile": profile,
        "wildfireBytes": wildfire_bytes,
        "visibleStars": visible_stars,
        "console": console,
        "external": external,
    }
    browser.close()
    return state


failed = False
with sync_playwright() as playwright:
    expected_profiles = {
        "high": (60, 1600000),
        "balanced": (45, 720000),
        "eco": (30, 420000),
    }
    for forced in (None, "high", "balanced", "eco"):
        result = inspect_profile(playwright, forced)
        profile = result["profile"]
        problems = []
        if result["http"] != 200:
            problems.append(f"HTTP {result['http']}")
        if profile["tier"] not in ("high", "balanced", "eco"):
            problems.append(f"missing tier {profile['tier']!r}")
        if profile["fps"] not in (30, 45, 60):
            problems.append(f"missing fps {profile['fps']}")
        if profile["budget"] <= 0:
            problems.append(f"missing pixel budget {profile['budget']}")
        if profile["budget"] and profile["pixels"] > profile["budget"] * 1.01:
            problems.append(f"canvas pixels {profile['pixels']} > {profile['budget']}")
        if profile["budget"] and profile["flamePixels"] > profile["budget"] * 1.01:
            problems.append(f"flame pixels {profile['flamePixels']} > {profile['budget']}")
        if forced:
            expected_fps, expected_budget = expected_profiles[forced]
            if profile["tier"] != forced or profile["fps"] != expected_fps or profile["budget"] != expected_budget:
                problems.append(f"{forced} override ignored {profile}")
        if result["wildfireBytes"] < 1000:
            problems.append(f"empty wildfire {result['wildfireBytes']}")
        if result["visibleStars"] != 9:
            problems.append(f"visible stars {result['visibleStars']}/9")
        if result["console"]:
            problems.append("console " + " | ".join(result["console"]))
        if result["external"]:
            problems.append("external " + " | ".join(result["external"]))
        label = forced or "auto"
        print(label, profile, f"wildfire={result['wildfireBytes']}", "PASS" if not problems else "FAIL")
        for problem in problems:
            print("  -", problem)
        failed = failed or bool(problems)

raise SystemExit(1 if failed else 0)
