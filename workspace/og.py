"""生成 OG 分享图：1200x630，取 hero 名字点亮帧。"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_context(viewport={"width": 1200, "height": 630}, device_scale_factor=1).new_page()
    page.goto("http://127.0.0.1:8090/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)
    page.evaluate(f"window.scrollTo(0, {int(630 * 2.3 * 0.80)})")
    page.wait_for_timeout(1600)
    page.screenshot(path="/tmp/og-raw.png")
    b.close()

from PIL import Image
Image.open("/tmp/og-raw.png").convert("RGB").save("site/assets/og.jpg", "JPEG", quality=85, optimize=True)
print("og.jpg done")
