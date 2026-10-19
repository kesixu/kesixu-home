#!/usr/bin/env bash
# 为根占位页生成极小子集字体：霞鹜文楷（"敬请期待"+ASCII）+ EB Garamond Italic（"Kesi Xu"+ASCII）
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=workspace/fonts-src
mkdir -p site/fonts

# ASCII 全集 + 占位页全部中文字符（含 title/description/og 里的字与中文标点）
python3 - <<'EOF' > "$SRC/coming-glyphs.txt"
import sys
sys.stdout.write(''.join(chr(c) for c in range(32,127)))
sys.stdout.write('敬请期待徐可斯的个人主页全新面貌正在点亮中·，（）。')
EOF

/usr/bin/python3 -c "import fontTools" && PY=/usr/bin/python3 || PY=python3

"$PY" -m fontTools.subset "$SRC/LXGWWenKai-Medium.ttf" \
  --text-file="$SRC/coming-glyphs.txt" \
  --flavor=woff2 --layout-features='*' --desubroutinize \
  --output-file=site/fonts/wenkai-coming.woff2

# EB Garamond Italic：固化 wght=500 再子集
"$PY" -m fontTools.varLib.instancer -q -o "$SRC/EBGaramond-Italic-w500.ttf" \
  "$SRC/EBGaramond-Italic.ttf" wght=500 >/dev/null 2>&1 || true
[ -f "$SRC/EBGaramond-Italic-w500.ttf" ] || cp "$SRC/EBGaramond-Italic.ttf" "$SRC/EBGaramond-Italic-w500.ttf"

"$PY" -m fontTools.subset "$SRC/EBGaramond-Italic-w500.ttf" \
  --text-file="$SRC/coming-glyphs.txt" \
  --flavor=woff2 --layout-features='*' \
  --output-file=site/fonts/garamond-coming.woff2

ls -la site/fonts/
