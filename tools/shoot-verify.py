#!/usr/bin/env python3
"""截根占位页 + vibecoding 主页，375 与 1440 两档验收。"""
from playwright.sync_api import sync_playwright

BASE = "https://kesixu.com"
pages = [
    ("root", BASE + "/"),
    ("vibecoding", BASE + "/vibecoding/"),
]
viewports = [
    ("m", 375, 812),
    ("d", 1440, 900),
]

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, url in pages:
        for tag, w, h in viewports:
            page = b.new_page(viewport={"width": w, "height": h})
            page.goto(url, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)
            out = f"workspace/shots/{name}-{tag}.png"
            page.screenshot(path=out, full_page=False)
            print(f"{out}  ({w}x{h})")
            page.close()
    b.close()
