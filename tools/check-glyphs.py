#!/usr/bin/env python3
"""部署前断言：site/index.html 的全部可见字符 ⊆ 文楷子集 cmap。缺字退出 1。
（QA 流程建议固化：改文案忘跑 subset-fonts.sh 时在这里被拦住，不上线豆腐块。）"""
import re, html, sys, glob
from fontTools.ttLib import TTFont

chars = set()
for f in ["site/index.html"] + sorted(glob.glob("site/*/index.html")):
    h = open(f, encoding="utf-8").read()
    h = re.sub(r"<script[^>]*>.*?</script>", " ", h, flags=re.S)
    meta = " ".join(re.findall(r'content="([^"]*)"', h)) + " ".join(re.findall(r"<title>(.*?)</title>", h))
    text = html.unescape(re.sub(r"<[^>]+>", " ", h) + meta)
    chars |= {c for c in text if ord(c) > 32}

cmap = set(TTFont("site/fonts/wenkai-subset.woff2").getBestCmap().keys())
missing = sorted(c for c in chars if ord(c) not in cmap)
if missing:
    print("缺字形（先跑 tools/subset-fonts.sh）:", "".join(missing))
    sys.exit(1)
print(f"字形完整：{len(chars)} 个字符全部覆盖")
