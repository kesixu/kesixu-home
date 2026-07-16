"""验证视觉 QA 修复：横屏名字、360 自述断行、桌面驻位、引信起笔、溢出。"""
from playwright.sync_api import sync_playwright

OUT = "workspace/shots"
URL = "http://127.0.0.1:8090/"

def ctx_page(p, w, h, dsf):
    b = p.chromium.launch(headless=True)
    c = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf)
    pg = c.new_page()
    pg.goto(URL); pg.wait_for_load_state("networkidle"); pg.wait_for_timeout(500)
    return b, pg

with sync_playwright() as p:
    # 1. 横屏 844x390：名字应为横排单行
    b, pg = ctx_page(p, 844, 390, 2)
    pg.evaluate(f"window.scrollTo(0, {int(390*2.3*0.78)})"); pg.wait_for_timeout(1300)
    pg.screenshot(path=f"{OUT}/fix-land-name.png")
    box = pg.evaluate("JSON.stringify(document.querySelector('.hero-name h1').getBoundingClientRect())")
    print("landscape h1 rect:", box)
    b.close()

    # 2. 360 宽自述断行
    b, pg = ctx_page(p, 360, 780, 2)
    y = pg.evaluate("document.querySelector('#about').getBoundingClientRect().top + window.scrollY")
    pg.evaluate(f"window.scrollTo(0, {y - 780*0.25})"); pg.wait_for_timeout(1300)
    pg.screenshot(path=f"{OUT}/fix-s360-about.png")
    ovf = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    print("360 hOverflow:", ovf)
    b.close()

    # 3. 桌面驻位 + 引信起笔
    b, pg = ctx_page(p, 1440, 900, 1)
    pg.evaluate(f"window.scrollTo(0, {int(900*2.3*0.78)})"); pg.wait_for_timeout(1400)
    pg.screenshot(path=f"{OUT}/fix-d-name.png")
    y = pg.evaluate("document.querySelector('#about').getBoundingClientRect().top + window.scrollY")
    pg.evaluate(f"window.scrollTo(0, {y - 900*0.55})"); pg.wait_for_timeout(1400)
    pg.screenshot(path=f"{OUT}/fix-d-fusetop.png")
    b.close()

    # 4. 390 溢出复测
    b, pg = ctx_page(p, 390, 844, 2)
    ovf = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    print("390 hOverflow:", ovf)
    b.close()
print("done")
