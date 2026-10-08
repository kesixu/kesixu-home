#!/usr/bin/env bash
# Page-specific font subsets for /vibecoding/aurelia/ — one sans family, two weights (300 display / 400 text).
# Prefers MiSans (Light/Regular, matches sibling pages) when present in workspace/fonts-src; otherwise instances Noto Sans SC (OFL).
set -euo pipefail
cd "$(dirname "$0")/../.."
SRC=workspace/fonts-src; PAGE=site/vibecoding/aurelia; mkdir -p "$SRC" "$PAGE/fonts"
python3 - > "$SRC/aurelia-all.txt" <<'PY'
import re, html, sys
page = open('site/vibecoding/aurelia/index.html', encoding='utf-8').read()
h = re.sub(r'<script[^>]*>.*?</script>', ' ', page, flags=re.S); h = re.sub(r'<style[^>]*>.*?</style>', ' ', h, flags=re.S)
meta = ' '.join(re.findall(r'content="([^"]*)"', h)) + ' ' + ' '.join(re.findall(r'<title>(.*?)</title>', h)) + ' ' + ' '.join(re.findall(r'(?:alt|aria-label)="([^"]*)"', h))
text = html.unescape(re.sub(r'<[^>]+>', ' ', h) + ' ' + meta)
ascii_ = ''.join(chr(c) for c in range(32, 127)); punct = '·—–…‘’“”、。，：；？！（）「」『』《》〈〉％→←　'
sys.stdout.write(''.join(sorted(set(text) - set('\n\r\t'))) + ascii_ + punct)
PY
if [ -f "$SRC/MiSans-Light.ttf" ] && [ -f "$SRC/MiSans-Regular.ttf" ]; then
  L="$SRC/MiSans-Light.ttf"; R="$SRC/MiSans-Regular.ttf"; echo "using MiSans"
else
  [ -f "$SRC/NotoSansSC.ttf" ] || curl -sL -o "$SRC/NotoSansSC.ttf" "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"
  fonttools varLib.instancer -q -o "$SRC/NotoSansSC-w300.ttf" "$SRC/NotoSansSC.ttf" wght=300 >/dev/null
  fonttools varLib.instancer -q -o "$SRC/NotoSansSC-w400.ttf" "$SRC/NotoSansSC.ttf" wght=400 >/dev/null
  L="$SRC/NotoSansSC-w300.ttf"; R="$SRC/NotoSansSC-w400.ttf"; echo "using Noto Sans SC"
fi
pyftsubset "$L" --text-file="$SRC/aurelia-all.txt" --flavor=woff2 --layout-features='*' --desubroutinize --output-file="$PAGE/fonts/sans-300-aurelia.woff2"
pyftsubset "$R" --text-file="$SRC/aurelia-all.txt" --flavor=woff2 --layout-features='*' --desubroutinize --output-file="$PAGE/fonts/sans-400-aurelia.woff2"
rm -f "$PAGE"/fonts/{mashanzheng,notoserif,wenkai,garamond}-aurelia.woff2
ls -la "$PAGE/fonts/"
