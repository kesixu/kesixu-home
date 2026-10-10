#!/usr/bin/env python3
"""DOM 级验收：关键元素渲染、控制台错误、资源 404 全查。"""
from playwright.sync_api import sync_playwright

BASE = "https://kesixu.com"
checks = [
    ("root", BASE + "/", ["h1"], "敬请期待"),
    ("vibecoding", BASE + "/vibecoding/", ["#heroName", "#lamps", "#sky", "#ember"], None),
]

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, url, selectors, expect_text in checks:
        for tag, w, h in [("m", 375, 812), ("d", 1440, 900)]:
            page = b.new_page(viewport={"width": w, "height": h})
            console_errs = []
            failed_reqs = []
            page.on("console", lambda m: console_errs.append(m.text) if m.type == "error" else None)
            page.on("requestfailed", lambda r: failed_reqs.append(r.url))
            page.goto(url, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1200)
            ok = True
            for sel in selectors:
                n = page.locator(sel).count()
                if n == 0:
                    ok = False
                    print(f"[{name}-{tag}] 缺失元素: {sel}")
            if expect_text:
                body = page.inner_text("body")
                if expect_text not in body:
                    ok = False
                    print(f"[{name}-{tag}] 缺少文本: {expect_text}")
            # 横向溢出检测
            overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
            if overflow:
                ok = False
                print(f"[{name}-{tag}] 横向溢出!")
            status = "OK" if ok else "FAIL"
            print(f"[{name}-{tag}] {w}x{h} -> {status} | console_err={len(console_errs)} failed_req={len(failed_reqs)} overflow={overflow}")
            if console_errs:
                print("    console:", console_errs[:5])
            if failed_reqs:
                print("    failed:", failed_reqs[:5])
            page.close()
    b.close()
