"""《划亮》截图验收：手机 390x844 + 桌面 1440x900，各叙事节点定点拍摄。"""
import sys
from playwright.sync_api import sync_playwright

OUT = "workspace/shots"
URL = "http://127.0.0.1:8090/"

def shoot(p, name, width, height, dsf):
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": width, "height": height},
                              device_scale_factor=dsf)
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(600)

    vh = height

    def snap(tag, y):
        page.evaluate(f"window.scrollTo(0, {max(0, int(y))})")
        page.wait_for_timeout(1300)  # 等 scrub 平滑 + reveal 动画收敛
        page.screenshot(path=f"{OUT}/{name}-{tag}.png")

    def el_top(sel):
        return page.evaluate(
            f"document.querySelector('{sel}').getBoundingClientRect().top + window.scrollY")

    # 叙事节点
    snap("0-dark", 0)
    snap("1-strike", vh * 2.3 * 0.30)          # hero pin 内 30%：划擦
    snap("2-name", vh * 2.3 * 0.78)            # hero pin 内 78%：名字点亮
    snap("3-about", el_top("#about") - vh * 0.30)
    snap("4-lamps-head", el_top("#lamps") - vh * 0.35)
    snap("5-lamp-mid", el_top(".lamp:nth-child(4)") - vh * 0.45)
    snap("6-lamp-match", el_top(".lamp:nth-child(5)") - vh * 0.45)
    snap("7-sky", el_top("#sky") + 100)
    snap("8-ember", page.evaluate("document.documentElement.scrollHeight") - vh)

    print(f"== {name} console ==")
    print("\n".join(errors) if errors else "(clean)")
    ctx.close(); browser.close()

with sync_playwright() as p:
    shoot(p, "m", 390, 844, 2)
    shoot(p, "d", 1440, 900, 1)
print("done")
