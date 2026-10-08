#!/usr/bin/env bash
# Publish the page to an unlisted preview directory on kesixu.com (real nginx + CSP), with noindex.
# Usage: deploy_preview.sh [suffix]   -> https://kesixu.com/vibecoding/aurelia-v2-<suffix>/
set -euo pipefail
cd "$(dirname "$0")/../.."
SUF="${1:-$(python3 -c 'import secrets;print(secrets.token_hex(3))')}"
DIR="aurelia-v2-$SUF"; TMP="$(mktemp -d)"
rsync -a --exclude 'og.jpg' site/vibecoding/aurelia/ "$TMP/$DIR/"
# noindex + canonical stays on the production URL; relative asset URLs make the copy self-contained
python3 - "$TMP/$DIR/index.html" <<'PY'
import sys; p=sys.argv[1]; s=open(p,encoding='utf-8').read()
s=s.replace('<meta name="theme-color"', '<meta name="robots" content="noindex, nofollow">\n<meta name="theme-color"',1)
open(p,'w',encoding='utf-8').write(s)
PY
rsync -az --delete "$TMP/$DIR/" "kumo:/tmp/$DIR/"
ssh kumo "sudo mkdir -p /var/www/kesixu-home/vibecoding/$DIR && sudo rsync -a --delete /tmp/$DIR/ /var/www/kesixu-home/vibecoding/$DIR/ && sudo chown -R root:root /var/www/kesixu-home/vibecoding/$DIR && sudo chmod -R a+rX /var/www/kesixu-home/vibecoding/$DIR && rm -rf /tmp/$DIR"
rm -rf "$TMP"
echo "https://kesixu.com/vibecoding/$DIR/"
