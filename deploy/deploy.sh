#!/usr/bin/env bash
# 部署：site/ → /var/www/kesixu-home/（可重复执行；首次上线前需先完成 DNS/nginx/certbot 审批三步）
set -euo pipefail
cd "$(dirname "$0")/.."

/usr/bin/python3 tools/check-glyphs.py   # /usr/bin/python3 有 fontTools；venv python 可能没有

sudo mkdir -p /var/www/kesixu-home
# 排除线上 /preview/ 与 .preview-backup-*（另一个会话的 v2 预览在制品，非本仓库内容）
sudo rsync -a --delete \
  --exclude='preview/' \
  --exclude='.preview-backup-*/' \
  site/ /var/www/kesixu-home/
sudo chown -R root:root /var/www/kesixu-home
sudo chmod -R a+rX /var/www/kesixu-home

echo "== 冒烟 =="
curl -sk -o /dev/null -w "https://kesixu.com/  -> %{http_code}\n" https://kesixu.com/ || true
curl -sk -o /dev/null -w "robots.txt          -> %{http_code}\n" https://kesixu.com/robots.txt || true
