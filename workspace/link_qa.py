import os
import urllib.request

from playwright.sync_api import sync_playwright


URL = os.environ.get("KESIXU_URL", "http://127.0.0.1:8090/")
EXPECTED = "https://textbook.kesixu.com/"
STALE = "ecowiki.kesixu.com"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    response = page.goto(URL, wait_until="networkidle")
    card = page.locator(".hero-lamp", has_text="经史星图")
    href = card.get_attribute("href")
    html = page.content()
    browser.close()

target = urllib.request.urlopen(EXPECTED, timeout=15)
status = target.status
target.close()

problems = []
if not response or response.status != 200:
    problems.append(f"homepage HTTP {response.status if response else 'none'}")
if href != EXPECTED:
    problems.append(f"href is {href!r}")
if STALE in html:
    problems.append("stale ecowiki address remains")
if status != 200:
    problems.append(f"target HTTP {status}")

print(f"homepage={response.status if response else 'none'} href={href} target={status}")
if problems:
    print("FAIL " + "; ".join(problems))
    raise SystemExit(1)
print("PASS")
