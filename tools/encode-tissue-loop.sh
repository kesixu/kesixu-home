#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
ffmpeg_bin="${FFMPEG_BIN:-ffmpeg}"
cwebp_bin="${CWEBP_BIN:-cwebp}"

command -v "$ffmpeg_bin" >/dev/null
command -v "$cwebp_bin" >/dev/null
mkdir -p site/pathbot/visual-demo/media

"$ffmpeg_bin" -hide_banner -loglevel error -y \
  -framerate 24 -start_number 1 \
  -i workspace/tissue-loop-frames/frame_%04d.png \
  -map_metadata -1 -an -c:v libx264 -preset slow -crf 24 \
  -pix_fmt yuv420p -movflags +faststart \
  site/pathbot/visual-demo/media/tissue-loop.mp4

"$cwebp_bin" -quiet -q 82 \
  workspace/tissue-loop-frames/frame_0048.png \
  -o site/pathbot/visual-demo/media/tissue-loop-poster.webp

printf 'Encoded %s\n' site/pathbot/visual-demo/media/tissue-loop.mp4
