# kesixu.com 上线三步审批清单（每步都要用户点头才执行）

## ① DNS（Porkbun API，纯增量）

新增两条，**绝不动现有 MX/SPF/NS/TXT**（根域邮件转发依赖 MX）：

| 操作 | 类型 | 名称 | 值 | TTL |
|---|---|---|---|---|
| create | A | kesixu.com | 207.148.91.108 | 600 |
| create | A | www.kesixu.com | 207.148.91.108 | 600 |

API：`POST https://api.porkbun.com/api/json/v3/dns/create/kesixu.com`，body `{type:"A", name:""|"www", content:"207.148.91.108", ttl:"600"}`。
回滚：记下返回的记录 id，`POST .../dns/delete/kesixu.com/<id>`。
验证：`dig +short kesixu.com @maceio.ns.porkbun.com` = 207.148.91.108。

## ② nginx vhost

- `sudo cp deploy/nginx-kesixu.com.conf /etc/nginx/sites-available/kesixu.com`
- `sudo ln -s ../sites-available/kesixu.com /etc/nginx/sites-enabled/kesixu.com`
- `sudo nginx -t` 通过后 `sudo systemctl reload nginx`
- 回滚：`sudo rm /etc/nginx/sites-enabled/kesixu.com && sudo nginx -t && sudo systemctl reload nginx`
- 注意：**无 default_server**（443 catch-all 属 chaogu 配置）；改前先确认第二个 SSH 会话在线。

## ③ 证书（DNS 生效后）

- 先部署静态文件（webroot 要存在）：`bash deploy/deploy.sh`（首次跑到 rsync 即可，curl 冒烟会失败属预期）
- `sudo certbot certonly --webroot -w /var/www/kesixu-home -d kesixu.com -d www.kesixu.com`
- 成功后 `sudo nginx -t && sudo systemctl reload nginx`，`curl -I https://kesixu.com/`
- 注：nginx conf 引用的 live/kesixu.com 路径在证书签出前不存在，所以顺序必须是
  「先 80-only 临时启用或先签证书再 enable」。执行时用两阶段：
  a. 只启用 80 段（把 443 两个 server 块暂时注释）→ reload → certbot webroot 签发
  b. 取消注释 443 段 → nginx -t → reload

## ④ 上线后

- `curl -sI https://kesixu.com/ | grep -Ei "strict|content-security|x-frame"` 头齐全
- 大陆多节点：17ce.com / ping.chinaz.com 测 https://kesixu.com/
- GoAccess 看日志：`sudo goaccess /var/log/nginx/access.log --log-format=COMBINED`（如未装：`sudo apt install goaccess`）

## ⑤ email@kesixu.com 转发（Porkbun 无 API，手动 1 分钟）

porkbun.com 登录 → Domain Management → kesixu.com → **Email Forwarding** →
添加 `email@kesixu.com` → 转发到 Gmail。MX 记录已就位（fwd1/fwd2.porkbun.com），无需动 DNS。
