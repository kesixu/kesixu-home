#!/usr/bin/env python3
"""部署前断言：每个页面的全部可见字符 ⊆ 该页字体栈的 cmap 并集。缺字退出 1。
（QA 流程固化：改文案忘跑子集时在这里被拦住，不上线豆腐块。）
页面 → 字体栈在 PAGES 里维护;新页面上线时在此登记。"""
import re, html, sys
from fontTools.ttLib import TTFont

PAGES = {
    "site/index.html": ["site/fonts/wenkai-subset.woff2"],
    "site/matchpoint/index.html": [
        "site/matchpoint/fonts/nserif-350.woff2", "site/matchpoint/fonts/nserif-620.woff2",
        "site/matchpoint/fonts/cormorant-500.woff2", "site/matchpoint/fonts/cormorant-620.woff2",
    ],
    "site/pathbot/index.html": [
        "site/pathbot/fonts/misans-200.woff2", "site/pathbot/fonts/misans-300.woff2", "site/pathbot/fonts/misans-500.woff2",
        "site/pathbot/fonts/hanken-200.woff2", "site/pathbot/fonts/plexmono-300.woff2",
    ],
}

def page_chars(path):
    h = open(path, encoding="utf-8").read()
    h = re.sub(r"<script[^>]*>.*?</script>", " ", h, flags=re.S)
    meta = " ".join(re.findall(r'content="([^"]*)"', h)) + " ".join(re.findall(r"<title>(.*?)</title>", h))
    attrs = " ".join(re.findall(r'data-en(?:-html)?="([^"]*)"', h))
    text = html.unescape(re.sub(r"<[^>]+>", " ", h) + meta + attrs)
    text = re.sub(r"<[^>]+>", " ", text)  # data-en-html 里可能还有内嵌标签
    return {c for c in text if ord(c) > 32}

fail = False
for page, fonts in PAGES.items():
    cmap = set()
    for f in fonts:
        cmap |= set(TTFont(f).getBestCmap().keys())
    missing = sorted(c for c in page_chars(page) if ord(c) not in cmap)
    if missing:
        print(f"{page} 缺字形（先重铸该页子集）: {''.join(missing)}")
        fail = True
    else:
        print(f"{page} 字形完整")
if fail:
    sys.exit(1)
