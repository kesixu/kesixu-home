import os
from collections import defaultdict

from playwright.sync_api import sync_playwright


URL = os.environ.get("KESIXU_URL", "http://127.0.0.1:8090/")
VIEWPORTS = ((360, 780), (390, 844), (430, 932))
SELECTORS = (
    ".whisper",
    ".hero-name h1",
    ".hero-name .latin",
    ".hero-name .tagline",
    ".hero-name .echo",
    "#about .line",
    "#lamps h2",
    ".chapter-sub",
    ".hero-lamp h3",
    ".lamp-desc",
    ".rest-label",
    ".rest-lamps li",
    ".sky-line",
    "#sky .echo",
    ".keep",
)


sizes = defaultdict(list)
failed = False

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for width, height in VIEWPORTS:
        context = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=3,
        )
        page = context.new_page()
        page.goto(URL, wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        for selector in SELECTORS:
            value = page.locator(selector).first.evaluate(
                "element => parseFloat(getComputedStyle(element).fontSize)"
            )
            sizes[selector].append(value)
        fonts = page.evaluate(
            """() => ({
              wenkai: document.fonts.check('16px "LXGW WenKai"'),
              garamond: document.fonts.check('16px "EB Garamond"'),
              displays: [...document.styleSheets].flatMap(sheet => {
                try { return [...sheet.cssRules]; } catch (_) { return []; }
              }).filter(rule => rule.type === CSSRule.FONT_FACE_RULE)
                .map(rule => [rule.style.fontFamily.replaceAll('"', ''), rule.style.fontDisplay])
            })"""
        )
        if not fonts["wenkai"] or not fonts["garamond"]:
            failed = True
            print(f"{width}px FAIL fonts not ready: {fonts}")
        elif any(display != "swap" for _, display in fonts["displays"]):
            failed = True
            print(f"{width}px FAIL unstable font-display: {fonts['displays']}")
        context.close()
    browser.close()

for selector, values in sizes.items():
    spread = max(values) - min(values)
    ok = spread <= 0.01
    failed |= not ok
    print(
        f"{selector}: "
        + "/".join(f"{value:g}px" for value in values)
        + f" spread={spread:.2f}px {'PASS' if ok else 'FAIL'}"
    )

raise SystemExit(1 if failed else 0)
