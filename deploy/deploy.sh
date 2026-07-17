#!/usr/bin/env bash
# 部署：site/ → /var/www/kesixu-home/（可重复执行；首次上线前需先完成 DNS/nginx/certbot 审批三步）
set -euo pipefail
cd "$(dirname "$0")/.."

python3 tools/check-glyphs.py   # 字形完整性门：缺字即中止

sudo mkdir -p /var/www/kesixu-home
sudo rsync -a --delete site/ /var/www/kesixu-home/
sudo chown -R root:root /var/www/kesixu-home
sudo chmod -R a+rX /var/www/kesixu-home

echo "== 冒烟 =="
curl -sk -o /dev/null -w "https://kesixu.com/  -> %{http_code}\n" https://kesixu.com/ || true
curl -sk -o /dev/null -w "robots.txt          -> %{http_code}\n" https://kesixu.com/robots.txt || true
