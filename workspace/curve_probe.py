from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8090/"

PROBE = r"""
() => {
  const path = document.getElementById('fuseBase');
  const total = path.getTotalLength();
  const samples = [];
  for (let distance = 2; distance < total - 2; distance += 3) {
    const a = path.getPointAtLength(distance - 2);
    const b = path.getPointAtLength(distance + 2);
    samples.push({distance, angle: Math.atan2(b.y - a.y, b.x - a.x)});
  }
  let maxTurn = 0;
  let maxAt = 0;
  for (let index = 1; index < samples.length; index++) {
    let delta = Math.abs(samples[index].angle - samples[index - 1].angle);
    if (delta > Math.PI) delta = Math.PI * 2 - delta;
    if (delta > maxTurn) {
      maxTurn = delta;
      maxAt = samples[index].distance / total;
    }
  }
  const svg = document.getElementById('fuse');
  const svgRect = svg.getBoundingClientRect();
  const storyRect = document.getElementById('story').getBoundingClientRect();
  const targets = [...document.querySelectorAll('.hero-dot')].map((dot) => {
    const rect = dot.getBoundingClientRect();
    const target = {
      x: rect.left + rect.width / 2 - storyRect.left,
      y: rect.top + rect.height / 2 - storyRect.top
    };
    let best = {distance: Infinity, progress: 0};
    for (let step = 0; step <= 2400; step++) {
      const progress = step / 2400;
      const point = path.getPointAtLength(total * progress);
      const distance = Math.hypot(point.x - target.x, point.y - target.y);
      if (distance < best.distance) best = {distance, progress};
    }
    return {name: dot.parentElement.querySelector('h3').innerText.trim(), ...best};
  });
  return {
    viewport: [innerWidth, innerHeight],
    svgWidth: svgRect.width,
    pathLength: Math.round(total),
    cubicSegments: (path.getAttribute('d').match(/C/g) || []).length,
    maxTurnDegrees: +(maxTurn * 180 / Math.PI).toFixed(2),
    maxTurnProgress: +maxAt.toFixed(4),
    targets: targets.map((target) => ({...target, distance: +target.distance.toFixed(2), progress: +target.progress.toFixed(4)}))
  };
}
"""

with sync_playwright() as playwright:
    for width, height in ((390, 844), (1440, 900)):
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=2 if width < 600 else 1)
        page.goto(URL, wait_until="networkidle")
        page.wait_for_timeout(900)
        print(page.evaluate(PROBE))
        browser.close()
