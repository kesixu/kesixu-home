#!/usr/bin/env bash
# kesixu.com 一键上线：DNS → 80 临时 vhost → certbot → 完整 vhost → 冒烟
# 每步失败即停（set -e），可安全重跑（幂等：已存在的记录/证书/软链会跳过）。
set -euo pipefail
cd "$(dirname "$0")/.."

banner() { echo; echo "════════ $1 ════════"; }

banner "① DNS：kesixu.com + www → 207.148.91.108（只增量）"
set -a; source ~/.porkbun-api; set +a
AUTH="\"apikey\":\"$PORKBUN_API_KEY\",\"secretapikey\":\"$PORKBUN_SECRET_KEY\""
EXISTING=$(curl -s --max-time 20 -X POST https://api.porkbun.com/api/json/v3/dns/retrieve/kesixu.com \
  -H 'Content-Type: application/json' -d "{$AUTH}" \
  | python3 -c "import sys,json; recs=json.load(sys.stdin)['records']; print(' '.join(r['name']+'/'+r['type'] for r in recs))")
for entry in "|kesixu.com" "www|www.kesixu.com"; do
  short="${entry%%|*}"; fqdn="${entry##*|}"
  # 锚定匹配：避免 chaogu.kesixu.com/A 之类子域名误匹配根域名
  if echo "$EXISTING" | grep -qE "(^| )$fqdn/A( |$)"; then
    echo "· $fqdn A 记录已存在，跳过"
  else
    curl -s --max-time 20 -X POST https://api.porkbun.com/api/json/v3/dns/create/kesixu.com \
      -H 'Content-Type: application/json' \
      -d "{$AUTH,\"type\":\"A\",\"name\":\"$short\",\"content\":\"207.148.91.108\",\"ttl\":\"600\"}"
    echo "  ← $fqdn（回滚：dns/delete/kesixu.com/<上面返回的 id>）"
  fi
done
echo "· 等待权威 NS 生效（certbot 的前置门）…"
APEX=""
for i in $(seq 1 12); do
  APEX=$(dig +short kesixu.com @maceio.ns.porkbun.com | head -1)
  WWW=$(dig +short www.kesixu.com @maceio.ns.porkbun.com | head -1)
  [ -n "$APEX" ] && [ -n "$WWW" ] && break
  sleep 5
done
echo "  kesixu.com     -> ${APEX:-未生效}"
echo "  www.kesixu.com -> ${WWW:-未生效}"
if [ -z "$APEX" ] || [ -z "$WWW" ]; then
  echo "DNS 尚未在权威 NS 生效，中止。稍等一分钟重跑本脚本即可（全程幂等）。"
  exit 1
fi

banner "② nginx 阶段 A：仅 80 端口"
if [ ! -f /etc/letsencrypt/live/kesixu.com/fullchain.pem ]; then
  sudo cp deploy/nginx-kesixu.com-phase-a.conf /etc/nginx/sites-available/kesixu.com
else
  echo "· 证书已在，直接进完整配置"
  sudo cp deploy/nginx-kesixu.com.conf /etc/nginx/sites-available/kesixu.com
fi
[ -L /etc/nginx/sites-enabled/kesixu.com ] || sudo ln -s ../sites-available/kesixu.com /etc/nginx/sites-enabled/kesixu.com
sudo nginx -t
sudo systemctl reload nginx
echo "· 80 端口就绪"

banner "③ certbot 签发（webroot）"
if [ ! -f /etc/letsencrypt/live/kesixu.com/fullchain.pem ]; then
  sudo certbot certonly --webroot -w /var/www/kesixu-home -d kesixu.com -d www.kesixu.com -n
else
  echo "· 证书已存在，跳过"
fi

banner "④ nginx 完整配置（443 + 安全头 + 限速）"
sudo cp deploy/nginx-kesixu.com.conf /etc/nginx/sites-available/kesixu.com
sudo nginx -t
sudo systemctl reload nginx

banner "⑤ 冒烟"
sleep 1
curl -sI --max-time 10 https://kesixu.com/ | head -6
curl -s -o /dev/null -w "robots.txt      -> %{http_code}\n" https://kesixu.com/robots.txt
curl -s -o /dev/null -w "http 301 检查   -> %{http_code}\n" http://kesixu.com/
curl -s -o /dev/null -w "www 归一        -> %{http_code} %{redirect_url}\n" https://www.kesixu.com/
curl -s -o /dev/null -w "字体            -> %{http_code}\n" https://kesixu.com/fonts/wenkai-subset.woff2
echo; echo "════════ 完成。回到 Claude 继续验证。════════"
