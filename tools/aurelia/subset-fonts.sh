#!/usr/bin/env bash
# Page-specific font subsets for /vibecoding/aurelia/ (all OFL):
#   Ma Shan Zheng (brush kai)   -> display text only (h1/h2/h3/.au-step b/.au-bignum__lab/.au-seal/.au-measure dt? no) 
#   Noto Serif SC wght=400      -> every visible character (body)
#   LXGW WenKai Medium          -> eyebrow/buttons/nav/bars/numbers/part labels (+ ASCII)
#   EB Garamond Italic wght=500 -> English echoes
set -euo pipefail
cd "$(dirname "$0")/../.."
SRC=workspace/fonts-src; PAGE=site/vibecoding/aurelia; mkdir -p "$SRC" "$PAGE/fonts"
[ -f "$SRC/LXGWWenKai-Medium.ttf" ] || curl -sL -o "$SRC/LXGWWenKai-Medium.ttf" https://github.com/lxgw/LxgwWenKai/releases/download/v1.522/LXGWWenKai-Medium.ttf
[ -f "$SRC/EBGaramond-Italic.ttf" ] || curl -sL -o "$SRC/EBGaramond-Italic.ttf" "https://github.com/google/fonts/raw/main/ofl/ebgaramond/EBGaramond-Italic%5Bwght%5D.ttf"
[ -f "$SRC/MaShanZheng-Regular.ttf" ] || curl -sL -o "$SRC/MaShanZheng-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/mashanzheng/MaShanZheng-Regular.ttf"
[ -f "$SRC/NotoSerifSC.ttf" ] || curl -sL -o "$SRC/NotoSerifSC.ttf" "https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
python3 - "$SRC" <<'PY'
import re, html, sys
from html.parser import HTMLParser
src = sys.argv[1]; page = open('site/vibecoding/aurelia/index.html', encoding='utf-8').read()
ascii_ = ''.join(chr(c) for c in range(32, 127)); punct = '·—–…‘’“”、。，：；？！（）「」『』《》〈〉％→←　'
class P(HTMLParser):
    def __init__(s): super().__init__(); s.stack=[]; s.brush=set(); s.wenkai=set(); s.all=set()
    def handle_starttag(s, tag, attrs):
        a=dict(attrs); cls=a.get('class','') or ''; s.stack.append((tag, cls))
        for k in ('alt','aria-label','content','title'):
            if k in a and a[k]: s.all.update(a[k])
    def handle_endtag(s, tag):
        if s.stack: s.stack.pop()
    def handle_data(s, d):
        if not s.stack: return
        tags=[t for t,_ in s.stack]; classes=' '.join(c for _,c in s.stack)
        if 'script' in tags or 'style' in tags: return
        s.all.update(d)
        if any(t in ('h1','h2','h3') for t in tags) or 'au-seal' in classes or 'au-bignum__lab' in classes or ('au-step' in classes and tags[-1]=='b'): s.brush.update(d)
        if any(k in classes for k in ('au-eyebrow','au-btn','au-nav','au-back','au-mark','au-bar','au-num','au-part','au-doors','au-foot','au-scroll-hint','au-step')) or tags[-1]=='b': s.wenkai.update(d)
p=P(); p.feed(page)
def w(name, chars): open(f'{src}/{name}.txt','w',encoding='utf-8').write(''.join(sorted(set(chars)-set('\n\r\t'))))
w('aurelia-all', set(p.all)|set(ascii_)|set(punct)); w('aurelia-brush', set(p.brush)|set(ascii_)|set('鉴一二三·')); w('aurelia-wenkai', set(p.wenkai)|set(ascii_)|set(punct)|set('一二三'))
print('chars all', len(p.all), 'brush', len(p.brush), 'wenkai', len(p.wenkai))
PY
pyftsubset "$SRC/MaShanZheng-Regular.ttf" --text-file="$SRC/aurelia-brush.txt" --flavor=woff2 --layout-features='*' --desubroutinize --output-file="$PAGE/fonts/mashanzheng-aurelia.woff2"
fonttools varLib.instancer -q -o "$SRC/NotoSerifSC-w400.ttf" "$SRC/NotoSerifSC.ttf" wght=400 >/dev/null
pyftsubset "$SRC/NotoSerifSC-w400.ttf" --text-file="$SRC/aurelia-all.txt" --flavor=woff2 --layout-features='*' --desubroutinize --output-file="$PAGE/fonts/notoserif-aurelia.woff2"
pyftsubset "$SRC/LXGWWenKai-Medium.ttf" --text-file="$SRC/aurelia-wenkai.txt" --flavor=woff2 --layout-features='*' --desubroutinize --output-file="$PAGE/fonts/wenkai-aurelia.woff2"
fonttools varLib.instancer -q -o "$SRC/EBGaramond-Italic-w500.ttf" "$SRC/EBGaramond-Italic.ttf" wght=500 >/dev/null
pyftsubset "$SRC/EBGaramond-Italic-w500.ttf" --text-file="$SRC/aurelia-all.txt" --flavor=woff2 --layout-features='*' --output-file="$PAGE/fonts/garamond-aurelia.woff2"
ls -la "$PAGE/fonts/"
