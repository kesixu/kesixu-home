# AGENTS.md — kesixu-home（kesixu.com 根域名个人主页）

> 继承 `~/AGENTS.md` 与 `~/projects/AGENTS.md` 的全部规则；本文件只写本项目特有约束。
> 本项目是**公开互联网资产**，任何改动上线前先过安全红线（见下），再走部署流程。

## 这是什么

kesixu.com 根域名的个人主页《划亮》：黑暗中划亮一根火柴 → 火焰化作引信随滚动游走 → 逐盏点亮七个产品 → 收束成星图 → 灯留着（联系方式）。故事型单页，手机竖屏优先。

## 设计宪法（改样式前必读）

- **世界观**：整页是一间黑屋子，唯一光源是访客亲手划亮的那根火柴。所有可见之物都必须像"被火光照亮"，而不是"自己发光"。
- **色板**（只此一系，禁止新增色相）：
  - 底：`--ink: #0d0b09`（暖炭黑，禁纯黑）
  - 火焰光谱：`--ember: #b33a1e` → `--flame: #ff6b35` → `--amber: #ffa94d` → `--gold: #ffd28a`
  - 文字：`--paper: #f2ece1`（烛光纸白）/ `--smoke: #8a8378`（烟灰，次级）
- **字体**：显示字 = 霞鹜文楷 Medium（`site/fonts/` 子集 woff2）；英文回声 = EB Garamond Italic；正文 = 系统栈（英文族在前，中文族在后）。禁止引入其他字体。
- **动效纪律**：scroll 是唯一输入；只动画 `transform`/`opacity`；动效慢而少（奢侈感来自节制）；每个动画必须有 `prefers-reduced-motion` 降级；canvas 离屏即停。
- **文案**：唯一事实源 `content/copy.md`，改字先改那里。语气克制、有余温、不装。

## 硬约束（违反即打回）

1. **no-build**：`site/` 就是部署产物本身，禁止引入打包器/框架/npm 依赖（vendor 手动放）。
2. **零第三方请求**：所有资源自托管。上线前验证：页面加载不得发出任何非 kesixu.com 请求（大陆可达性 + 隐私双重理由）。
3. **JS 预算 ≤150KB gzip 总量**（当前 GSAP core+ScrollTrigger ≈ 40KB）。
4. **无 cookie、无追踪、无表单、无后端**。统计走 nginx 日志 + GoAccess，页面零埋点。
5. **渐进增强**：无 JS 时页面必须完整可读（内容都在 DOM 里，JS 只加演出）。
6. **安全红线**（详见 `content/copy.md` 末节）：不出现手机/微信/生日/单位/家人/具体病种；**任何 `*.kesixu.com` 私有子域名不得出现在 HTML/JS/注释/robots.txt 中**；产品卡除 MatchPoint 外一律无外链。
7. 图片入库前 `exiftool -all=` 去元数据。

## 文件地图

```
content/copy.md        文案唯一事实源（含红线清单）
site/index.html        单页全部结构（内容在 DOM，SEO 可见）
site/style.css         全部样式（CSS 变量在 :root）
site/main.js           火柴 canvas + 引信 SVG + ScrollTrigger 编排
site/vendor/           gsap.min.js + ScrollTrigger.min.js（3.15.0，勿升级除非有理由）
site/fonts/            子集化 woff2（由 tools/subset-fonts.sh 生成，勿手改）
tools/subset-fonts.sh  从 index.html 提取全部文字重新子集化
tools/preview.sh       本地预览：127.0.0.1:8090
deploy/nginx-kesixu.com.conf  nginx vhost 草案（上线走审批）
deploy/deploy.sh       rsync site/ → /var/www/kesixu-home/（需 sudo，上线后可重复跑）
workspace/shots/       Playwright 截图（gitignored）
```

## 工作流

- 预览：`bash tools/preview.sh` → Playwright 截 390×844（iPhone）与 1440×900 两档验收。
- 改文案：`content/copy.md` → `site/index.html` → `bash tools/subset-fonts.sh`（字体子集必须重跑，否则新字缺字形）。
- 部署（🔴 首次上线需用户批准 DNS/nginx/certbot 三件事）：`bash deploy/deploy.sh` + `curl -I https://kesixu.com/` 冒烟。
- 上线后大陆实测：17ce.com / ping.chinaz.com。

## 为什么这么设计（给未来的 agent）

- no-build 三件套是刻意的：十年不腐、view-source 即真相、对 agent 最友好。
- GSAP 而非 CSS scroll-driven animations：微信 X5/UC 老内核不支持后者，大陆访客是一等公民。
- Lenis 刻意不用于手机（原生滚动神圣不可侵犯）；桌面暂也未引入，够丝滑了再说。
- 产品卡不放子域名链接是安全决策（私有应用零导流），不是疏忽。
