#!/usr/bin/env bash
# Page-specific font subsets for /vibecoding/aurelia/: extract every visible character of index.html (+ ASCII), then subset
# LXGW WenKai Medium (display) and EB Garamond Italic (wght=500 static instance; old engines do not handle variable fonts).
set -euo pipefail
cd "$(dirname "$0")/../.."
SRC=workspace/fonts-src; PAGE=site/vibecoding/aurelia; mkdir -p "$SRC" "$PAGE/fonts"
[ -f "$SRC/LXGWWenKai-Medium.ttf" ] || curl -sL -o "$SRC/LXGWWenKai-Medium.ttf" https://github.com/lxgw/LxgwWenKai/releases/download/v1.522/LXGWWenKai-Medium.ttf
[ -f "$SRC/EBGaramond-Italic.ttf" ] || curl -sL -o "$SRC/EBGaramond-Italic.ttf" "https://github.com/google/fonts/raw/main/ofl/ebgaramond/EBGaramond-Italic%5Bwght%5D.ttf"
python3 - > "$SRC/aurelia-glyphs.txt" <<'PY'
import re, html, sys
h = open('site/vibecoding/aurelia/index.html', encoding='utf-8').read()
h = re.sub(r'<script[^>]*>.*?</script>', ' ', h, flags=re.S); h = re.sub(r'<style[^>]*>.*?</style>', ' ', h, flags=re.S)
meta = ' '.join(re.findall(r'content="([^"]*)"', h)) + ' ' + ' '.join(re.findall(r'<title>(.*?)</title>', h))
attrs = ' '.join(re.findall(r'(?:alt|aria-label|data-text)="([^"]*)"', h))
text = html.unescape(re.sub(r'<[^>]+>', ' ', h) + ' ' + meta + ' ' + attrs)
chars = sorted(set(text) - set('\n\r\t'))
sys.stdout.write(''.join(chars) + ''.join(chr(c) for c in range(32, 127)) + '·—–…‘’“”、。，：；？！（）「」『』《》〈〉％')
PY
pyftsubset "$SRC/LXGWWenKai-Medium.ttf" --text-file="$SRC/aurelia-glyphs.txt" --flavor=woff2 --layout-features='*' --desubroutinize --output-file="$PAGE/fonts/wenkai-aurelia.woff2"
fonttools varLib.instancer -q -o "$SRC/EBGaramond-Italic-w500.ttf" "$SRC/EBGaramond-Italic.ttf" wght=500 >/dev/null
pyftsubset "$SRC/EBGaramond-Italic-w500.ttf" --text-file="$SRC/aurelia-glyphs.txt" --flavor=woff2 --layout-features='*' --output-file="$PAGE/fonts/garamond-aurelia.woff2"
ls -la "$PAGE/fonts/"
