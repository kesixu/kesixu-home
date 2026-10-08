#!/usr/bin/env python3
"""部署前断言：每个页面的全部可见字符 ⊆ 该页字体栈的 cmap 并集。缺字退出 1。
（QA 流程固化：改文案忘跑子集时在这里被拦住，不上线豆腐块。）
页面 → 字体栈在 PAGES 里维护;新页面上线时在此登记。"""
import re, html, sys
from fontTools.ttLib import TTFont

PAGES = {
    # 根占位页（敬请期待）用独立极小子集
    "site/index.html": ["site/fonts/wenkai-coming.woff2"],
    "site/vibecoding/index.html": ["site/vibecoding/fonts/wenkai-subset.woff2"],
    "site/vibecoding/aurelia/index.html": ["site/vibecoding/aurelia/fonts/wenkai-aurelia.woff2", "site/vibecoding/aurelia/fonts/garamond-aurelia.woff2"],
    "site/vibecoding/zaojian/index.html": ["site/vibecoding/zaojian/fonts/zaofont-page.woff2"],
    # 职场棋盘宣传页（原“职囊”）：正文用系统黑体，只有标题、引文、印章用自托管的宋体和楷体，所以不能拿整页的字去核。
    # 改成核“渲染出来用到这个字体的字”：字表由 workspace/runs/zhichang-build/glyphs.py 在浏览器里按实际字体和字重收集
    "site/vibecoding/zhichang/index.html": {"rendered": [
        ("workspace/runs/zhichang-build/chars-s250.txt", "site/vibecoding/zhichang/fonts/zn-serif-250.woff2"),
        ("workspace/runs/zhichang-build/chars-s400.txt", "site/vibecoding/zhichang/fonts/zn-serif-400.woff2"),
        ("workspace/runs/zhichang-build/chars-s600.txt", "site/vibecoding/zhichang/fonts/zn-serif-600.woff2"),
        ("workspace/runs/zhichang-build/chars-kai.txt", "site/vibecoding/zhichang/fonts/zn-kai.woff2"),
    ]},
    "site/vibecoding/matchpoint/index.html": [
        "site/vibecoding/matchpoint/fonts/misans-demi.woff2", "site/vibecoding/matchpoint/fonts/misans-300.woff2",
        "site/vibecoding/matchpoint/fonts/arch-exp800.woff2", "site/vibecoding/matchpoint/fonts/arch-cond700.woff2",
    ],
    "site/vibecoding/pathbot/index.html": [
        "site/vibecoding/pathbot/fonts/misans-200.woff2", "site/vibecoding/pathbot/fonts/misans-300.woff2", "site/vibecoding/pathbot/fonts/misans-500.woff2",
        "site/vibecoding/pathbot/fonts/hanken-200.woff2", "site/vibecoding/pathbot/fonts/plexmono-300.woff2",
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
    if isinstance(fonts, dict):
        missing = ""
        for chars_file, font in fonts["rendered"]:
            cmap = set(TTFont(font).getBestCmap().keys())
            missing += "".join(sorted(c for c in open(chars_file, encoding="utf-8").read() if ord(c) > 32 and ord(c) not in cmap))
        if missing:
            print(f"{page} 缺字形（先重铸该页子集）: {missing}")
            fail = True
        else:
            print(f"{page} 字形完整（按渲染字表核）")
        continue
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
