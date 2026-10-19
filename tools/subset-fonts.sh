#!/usr/bin/env bash
# 从 site/index.html 提取全部文字重新子集化字体。改文案后必须重跑，否则新字缺字形。
set -euo pipefail
cd "$(dirname "$0")/.."

SRCDIR=workspace/fonts-src
mkdir -p "$SRCDIR" site/fonts

[ -f "$SRCDIR/LXGWWenKai-Medium.ttf" ] || curl -sL -o "$SRCDIR/LXGWWenKai-Medium.ttf" \
  https://github.com/lxgw/LxgwWenKai/releases/download/v1.522/LXGWWenKai-Medium.ttf
[ -f "$SRCDIR/EBGaramond-Italic.ttf" ] || curl -sL -o "$SRCDIR/EBGaramond-Italic.ttf" \
  "https://github.com/google/fonts/raw/main/ofl/ebgaramond/EBGaramond-Italic%5Bwght%5D.ttf"

# 1) 提取页面可见文字 + title/meta（星图 SVG 里的 <text> 也在 DOM 里，一并覆盖）
python3 - > "$SRCDIR/glyphs.txt" <<'EOF'
import re, html, sys, glob
# 主页 + 子页面(如 /pathbot/)共用同一份子集,任一页面新增文字都要覆盖
files = ['site/index.html'] + sorted(glob.glob('site/*/index.html'))
buf = []
for f in files:
    h = open(f, encoding='utf-8').read()
    h = re.sub(r'<script[^>]*>.*?</script>', ' ', h, flags=re.S)
    meta = ' '.join(re.findall(r'content="([^"]*)"', h)) + ' ' + ' '.join(re.findall(r'<title>(.*?)</title>', h))
    buf.append(re.sub(r'<[^>]+>', ' ', h) + ' ' + meta)
chars = sorted(set(html.unescape(' '.join(buf))) - set('\n\r\t'))
sys.stdout.write(''.join(chars))
EOF
# 附加 ASCII 全集，保证英文数字标点永远齐全
python3 -c "import sys; sys.stdout.write(''.join(chr(c) for c in range(32,127)))" >> "$SRCDIR/glyphs.txt"

# 2) 霞鹜文楷 Medium（显示字）
pyftsubset "$SRCDIR/LXGWWenKai-Medium.ttf" \
  --text-file="$SRCDIR/glyphs.txt" \
  --flavor=woff2 --layout-features='*' --desubroutinize \
  --output-file=site/fonts/wenkai-subset.woff2

# 3) EB Garamond Italic：先固化 wght=500 静态实例（老内核不啃变量字体），再子集
fonttools varLib.instancer -q -o "$SRCDIR/EBGaramond-Italic-w500.ttf" \
  "$SRCDIR/EBGaramond-Italic.ttf" wght=500 >/dev/null
pyftsubset "$SRCDIR/EBGaramond-Italic-w500.ttf" \
  --text-file="$SRCDIR/glyphs.txt" \
  --flavor=woff2 --layout-features='*' \
  --output-file=site/fonts/garamond-italic-subset.woff2

echo "== 子集结果 =="
ls -la site/fonts/
