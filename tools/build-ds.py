"""生成 Claude Design 设计系统（ds/），对齐官方模板规格：
styles.css(token表+字体+组件层) / theme.json / readme.md / thumbnail.html
/ foundations×4 / components×6 / templates/landing(整页静态快照)。"""
import base64, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DS = ROOT / "ds"

def b64(p): return base64.b64encode((ROOT / p).read_bytes()).decode()
WENKAI, GARA = b64("site/fonts/wenkai-subset.woff2"), b64("site/fonts/garamond-italic-subset.woff2")

def write(path, text):
    out = DS / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    print(f"{path:34s} {out.stat().st_size/1024:7.1f} KB")

# ═══ styles.css — 唯一 token 表 + 组件层（字体内嵌，页面只需相对链接它） ═══
write("styles.css", f"""/* 划亮 · kesixu.com — 唯一样式表。所有颜色/字体/间距/辉光取自变量，禁止硬编码。 */
@font-face {{ font-family:"LXGW WenKai"; src:url(data:font/woff2;base64,{WENKAI}) format("woff2"); font-weight:400 600; font-display:swap; }}
@font-face {{ font-family:"EB Garamond"; src:url(data:font/woff2;base64,{GARA}) format("woff2"); font-style:italic; font-display:swap; }}

:root {{
  /* 色：火焰光谱，唯一色系 */
  --color-ink:#0d0b09; --color-char:#2a2019; --color-ember:#b33a1e; --color-flame:#ff6b35;
  --color-amber:#ffa94d; --color-gold:#ffd28a; --color-paper:#f2ece1; --color-smoke:#8a8378;
  /* 字 */
  --font-display:"LXGW WenKai","Noto Serif SC",serif;
  --font-echo:"EB Garamond",Georgia,serif;
  --font-body:"Segoe UI",-apple-system,"PingFang SC","HarmonyOS Sans SC","Microsoft YaHei",sans-serif;
  /* 字阶（移动优先 clamp） */
  --type-name:clamp(92px,23vw,176px); --type-h2:clamp(34px,9vw,54px); --type-h3:clamp(26px,7vw,34px);
  --type-line:clamp(20px,5.8vw,36px); --type-body:clamp(15px,4vw,16.5px); --type-tag:11px; --type-fine:12.5px;
  /* 间距节奏（章节呼吸） */
  --space-chapter:16vh; --space-lamp:5.5vh; --space-breath:11vh; --gutter:clamp(24px,7vw,52px);
  /* 辉光层级：sm=灯芯 md=标题 lg=名字/火头 */
  --glow-sm:0 0 8px 2px rgba(255,210,138,.85),0 0 26px 9px rgba(255,107,53,.3);
  --glow-md:0 0 18px rgba(255,169,77,.3);
  --glow-lg:0 0 24px rgba(255,169,77,.38),0 0 90px rgba(255,107,53,.18);
  --halo:radial-gradient(closest-side,rgba(255,210,138,.38),rgba(255,107,53,.14) 55%,transparent);
  --lamp-backdrop:radial-gradient(closest-side at 18% 42%,rgba(255,140,66,.085),transparent 72%);
  --fuse-gradient:linear-gradient(#b33a1e,#ffa94d,#ffd28a);
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:var(--color-ink); color:var(--color-paper); font-family:var(--font-body);
       font-size:16px; line-height:1.9; -webkit-text-size-adjust:100%; }}
::selection {{ background:rgba(255,169,77,.28); color:var(--color-paper); }}
a {{ color:inherit; text-decoration:none; }}
a:focus-visible {{ outline:1px solid var(--color-amber); outline-offset:4px; border-radius:2px; }}

/* ── 文字组件 ── */
.name {{ writing-mode:vertical-rl; font-family:var(--font-display); font-weight:500;
        font-size:var(--type-name); line-height:1.06; letter-spacing:.1em;
        color:var(--color-paper); text-shadow:var(--glow-lg); }}
.echo {{ display:block; font-family:var(--font-display); font-weight:400;
        color:var(--color-smoke); letter-spacing:.18em; }}
.latin-echo {{ font-family:var(--font-echo); font-style:italic; letter-spacing:.34em;
              text-indent:.34em; color:var(--color-amber); }}
.line {{ font-family:var(--font-display); font-size:var(--type-line); font-weight:500;
        line-height:1.85; letter-spacing:.04em; color:var(--color-paper); text-wrap:balance; }}
.line-strong {{ color:var(--color-gold); }}
.keep {{ font-family:var(--font-display); font-size:clamp(26px,7vw,40px); letter-spacing:.1em; }}
.fine {{ font-size:var(--type-fine); line-height:2.2; color:var(--color-smoke); letter-spacing:.06em; }}

/* ── 灯（产品卡）── */
.lamp {{ position:relative; padding:var(--space-lamp) 0 var(--space-lamp) 34px; }}
.lamp::before {{ content:""; position:absolute; inset:0 0 0 -30%; background:var(--lamp-backdrop);
               opacity:0; transition:opacity 1.1s ease; pointer-events:none; }}
.lamp.lit::before {{ opacity:1; }}
.lamp-dot {{ position:absolute; left:0; top:calc(var(--space-lamp) + .95em); width:7px; height:7px;
            border-radius:50%; background:var(--color-char);
            transition:background 1s ease,box-shadow 1.2s ease,transform 1.2s ease; }}
.lamp.lit .lamp-dot {{ background:var(--color-gold); transform:scale(1.25); box-shadow:var(--glow-sm); }}
.lamp h3 {{ font-family:var(--font-display); font-weight:500; font-size:var(--type-h3);
           letter-spacing:.06em; color:var(--color-smoke); transition:color 1s ease,text-shadow 1s ease; }}
.lamp.lit h3 {{ color:var(--color-paper); text-shadow:var(--glow-md); }}
.lamp-desc {{ font-size:var(--type-body); color:var(--color-smoke); max-width:34em;
             margin:1.6vh 0 2.2vh; transition:color 1s ease; text-wrap:pretty; }}
.lamp.lit .lamp-desc {{ color:#cfc7b8; }}

/* ── 序数与落款 ── */
.lamp-no {{ display:block; font-family:var(--font-display); font-size:12.5px; letter-spacing:.5em;
           color:var(--color-smoke); margin-bottom:8px; transition:color 1s ease; }}
.lamp.lit .lamp-no {{ color:var(--color-amber); }}
/* ── 标签 ── */
.tag {{ display:inline-block; font-size:var(--type-tag); letter-spacing:.22em; text-indent:.22em;
       color:var(--color-smoke); border:1px solid rgba(138,131,120,.35); border-radius:3px;
       padding:4px 12px 3px; transition:color 1s ease,border-color 1s ease; }}
.lit .tag, .tag.lit {{ color:var(--color-amber); border-color:rgba(255,169,77,.45); }}
.lit .tag-open, .tag-open.lit {{ color:var(--color-gold); border-color:rgba(255,210,138,.65); }}

/* ── 余烬 ── */
.ember-dot {{ position:relative; display:inline-block; width:9px; height:9px; border-radius:50%;
             background:var(--color-gold); box-shadow:0 0 10px 3px rgba(255,210,138,.8); }}
.ember-dot::after {{ content:""; position:absolute; inset:-30px; border-radius:50%;
                    background:var(--halo); opacity:.7; }}
@media (prefers-reduced-motion:no-preference) {{
  .ember-dot::after {{ animation:ember-breathe 4.4s ease-in-out infinite; }}
  @keyframes ember-breathe {{ 0%,100%{{opacity:.5;transform:scale(.88)}} 50%{{opacity:1;transform:scale(1.12)}} }}
}}

/* ── DS 页面自身的排版 ── */
.ds-stage {{ padding:44px 38px; }}
.ds-label {{ font-size:10px; letter-spacing:.24em; color:var(--color-smoke);
            text-transform:uppercase; margin-bottom:22px; }}
.ds-note {{ font-size:12.5px; color:var(--color-smoke); line-height:2; max-width:44em; }}
""")

# ═══ theme.json ═══
write("theme.json", json.dumps({
  "name": "划亮 Strike a Light",
  "worldview": "一间黑屋子，唯一光源是访客亲手划亮的火柴；一切可见之物都被火光照亮，而非自己发光",
  "color": {"ink": "#0d0b09", "char": "#2a2019", "ember": "#b33a1e", "flame": "#ff6b35",
             "amber": "#ffa94d", "gold": "#ffd28a", "paper": "#f2ece1", "smoke": "#8a8378",
             "rule": "唯一色系=火焰光谱；文字只用 paper/smoke；禁止新增色相；禁纯黑"},
  "type": {"display": "LXGW WenKai Medium", "echo": "EB Garamond Italic", "body": "system CJK stack",
            "rule": "名字竖排；英文只做小声回声；正文零下载系统栈"},
  "glow": {"sm": "灯芯", "md": "标题", "lg": "名字/火头", "rule": "辉光即层级，代替边框和分割线"},
  "motion": {"input": "scroll only", "props": "transform/opacity only", "memory": "点过的灯不熄(once)",
              "pace": "reveal 1.0-1.1s power2.out; scrub 0.4-0.5", "baseline": "无JS/reduced/异常=静态可读"},
  "source_of_truth": "kumo:~/projects/kesixu-home (site/ 为部署产物, ds/ 为本设计系统)"
}, ensure_ascii=False, indent=2))

# ═══ readme.md ═══
write("readme.md", """# 划亮 · kesixu.com design system

划亮是一间黑屋子：唯一的光源是访客亲手划亮的那根火柴。整个系统只有一种颜色——火，
从余烬红烧到烛金；一切可见之物都必须像"被火光照亮"，而不是自己发光。层级不靠边框、
不靠底色块，靠**辉光的强弱**（灯芯 sm → 标题 md → 名字 lg）和霞鹜文楷的字阶。
英文永远是小声的回声（EB Garamond Italic），不与中文并排争声量。

## How to use this

- 每个页面链接唯一的样式表 `<link rel="stylesheet" href="styles.css">`（按相对路径调整），
  颜色/字体/字阶/间距/辉光全部取自变量（`var(--color-*)`, `var(--font-*)`, `--type-*`, `--space-*`, `--glow-*`）。
  **禁止硬编码**十六进制、字体名、像素值。
- 用下面的组件类搭建，不要发明平行类；组件页是纯 HTML，view source 即可复制。
- `templates/landing/` 是可整页复制的起点（线上站点的静态快照）。
- 整个系统由 `theme.json` 推导；改观感先改 `styles.css` 顶部的 token，并保持 theme.json 与本文同步。

## Direction

竖排的名字是仪式的中心；内容单列左对齐，引信（一条从火柴延续下来的光线）在左侧 gutter
贯穿全部叙事，穿过每盏灯的灯芯。章节之间用大量黑（16vh+）呼吸，绝不用分割线。
滚动是唯一输入——滚动即"往下，划"。灯点过就不熄：回滚时一切保持点亮，火有记忆。

## Color

暖炭黑 `--color-ink`（禁纯黑）为地；火焰光谱 ember→flame→amber→gold 是唯一的强调系；
文字只用 `--color-paper`（烛光纸白）与 `--color-smoke`（烟灰）。未点燃的物件一律 `--color-char`。
同一小组件内不混用两档火色（例：标签点亮用 amber，公开款才升到 gold）。

## Type

霞鹜文楷 Medium 承担全部显示层（名字、章句、灯名、结语、序数、小注）；EB Garamond Italic
只保留给人名 "Kesi Xu"；正文用系统栈（英文族在前防中文字体劫持拉丁字形）。
字阶已定义为 `--type-*` token，别再造新档。

## Voice（文案纪律）

全部中文；**文雅、通顺、有新意，不拗口**——典故织入但不堆砌，现代语序为主，不注出处。
已织入的典源：未央（《庭燎》/长乐未央）、《大学》格物、《庄子》薪火相传、《维摩诘经》无尽灯
（一灯点亮能燃百灯）、《孟子》观澜与明察秋毫、按图索骥、老吏断案、《孙子》庙算、
《诗经·大东》维北有斗（「在野」双关 indie）、《论语》有朋自远方来。
七盏灯以「其一…其七」编次。题眼「往下，划」保持白话，一字不动。装饰宁缺毋滥：不用印章、不用图章式点缀，稳定流畅高于巧思。

## Glow

辉光即层级：`--glow-sm`（灯芯点）、`--glow-md`（点亮的标题）、`--glow-lg`（名字与火头）。
呼吸类动效一律走伪元素的 opacity/scale（见 `.ember-dot::after`），禁止动画 box-shadow 本体。

## Motion

scroll 是唯一输入；只动 transform/opacity；reveal 1.0–1.1s power2.out，scrub 平滑 0.4–0.5；
灯 once:true 点过不熄；无 JS / reduced-motion / JS 异常时必须是完整可读的静态页。

## Do

- 用留白和辉光分层，不用边框、卡片底、分割线。
- 名字竖排；移动端优先设计，桌面只是更从容的同一构图。
- 让访客"做"点什么才能看见（划、滚动）——仪式感来自参与。

## Don't

- 不新增色相（没有蓝、没有绿、没有紫）。
- 不让英文与中文同字号并排。
- 不给静态基线留下任何不可读的残缺。
- 不加载任何第三方资源（大陆可达性 + 隐私是硬约束）。

## 组件类词汇表（设计代理按此取用，全部经存在性校验）

| 类 | 用途 |
|---|---|
| `.name` | 竖排大名（--type-name + --glow-lg） |
| `.echo` | 中文小注（文楷、smoke、.18em 字距） |
| `.latin-echo` | 人名 "Kesi Xu" 专用（Garamond Italic、amber） |
| `.line` / `.line-strong` | 章句 / 金色强调句 |
| `.lamp` + `.lit` | 产品卡容器；点亮态加 `.lit`（衬底/灯芯/标题联动） |
| `.lamp-dot` / `.lamp-no` / `.lamp-desc` | 灯芯点 / 「其N」序数 / 一句话描述 |
| `.tag` / `.tag-open` | 状态标签（方角 hairline）；公开款加 `.tag-open` |
| `.keep` / `.fine` | 结语大字 / 页脚小字 |
| `.ember-dot` | 呼吸余烬（伪元素光晕，只动 opacity/scale） |
| `.ds-stage` / `.ds-label` / `.ds-note` | DS 文档页自用排版 |

最小可用骨架（每页必须链接唯一样式表；深底由 body 自带）：

```html
<link rel="stylesheet" href="styles.css">
<div class="lamp lit">
  <span class="lamp-dot"></span>
  <span class="lamp-no">其一</span>
  <h3>灯名</h3>
  <p class="lamp-desc">一句话，宁短勿长。</p>
  <span class="tag">内测中</span>
</div>
```

颜色/字号/间距/辉光一律取 `var(--color-*) / var(--type-*) / var(--space-*) / var(--glow-*)`，
禁止硬编码；新增元素前先看本表有没有现成的类。

## Files

- `styles.css` — 唯一样式表：token 表 + 组件层 +内嵌子集字体。
- `theme.json` — token 的机器可读记录。
- `thumbnail.html` — 项目封面。
- `foundations/color.html` `type.html` `glow.html` `motion.html` — 基础层。
- `components/hero.html` `lamp.html` `tag.html` `fuse.html` `constellation.html` `ember.html` — 组件层。
- `templates/landing/index.html` — 线上站点的自包含静态快照（整页模板）。

线上源仓库：kumo `~/projects/kesixu-home`（`site/` 为部署产物；本系统与其同步，改这里之后要回灌）。
""")

# ═══ thumbnail ═══
write("thumbnail.html", """<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="styles.css">
<body style="display:flex;align-items:center;justify-content:center;height:100vh;gap:38px">
  <div class="name" style="font-size:96px">划亮</div>
  <div>
    <div class="latin-echo" style="font-size:15px">Strike a Light</div>
    <div style="display:flex;gap:7px;margin-top:18px">
      <span style="width:22px;height:22px;border-radius:50%;background:#b33a1e"></span>
      <span style="width:22px;height:22px;border-radius:50%;background:#ff6b35"></span>
      <span style="width:22px;height:22px;border-radius:50%;background:#ffa94d"></span>
      <span style="width:22px;height:22px;border-radius:50%;background:#ffd28a"></span>
      <span style="width:22px;height:22px;border-radius:50%;background:#f2ece1"></span>
    </div>
    <p class="fine" style="margin-top:14px">kesixu.com · 七盏灯，一张星图</p>
  </div>
</body>""")

# ═══ foundations ═══
write("foundations/color.html", """<!-- @dsCard group="Foundations" name="火焰色板" subtitle="唯一色系：从炭到金" -->
<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../styles.css">
<body><div class="ds-stage">
  <div class="ds-label">Palette · 火焰光谱</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px">""" + "".join(f"""
    <div style="border:1px solid #241d16;border-radius:10px;overflow:hidden">
      <div style="height:74px;background:var(--color-{k})"></div>
      <div style="padding:10px 12px;font-size:12px;color:var(--color-smoke)">{label}<br>
        <span style="color:var(--color-paper);font-family:monospace">--color-{k}</span></div>
    </div>""" for k, label in [("ink","暖炭黑 · 地（禁纯黑）"),("char","未燃物"),("ember","余烬红"),
      ("flame","火橙"),("amber","琥珀 · 点亮态"),("gold","烛金 · 最高亮"),
      ("paper","烛光纸白 · 正文"),("smoke","烟灰 · 次级")]) + """
  </div>
  <p class="ds-note" style="margin-top:22px">规则：一切可见之物都"被火光照亮"而非自己发光。文字只用 paper/smoke；
  同一小组件内不混用两档火色；对比度下限：正文级文字 ≥4.5:1（smoke on ink = 5.24 ✓）。</p>
</div></body>""")

write("foundations/type.html", """<!-- @dsCard group="Foundations" name="字体系统" subtitle="文楷显示 · Garamond 回声 · 系统栈正文" -->
<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../styles.css">
<body><div class="ds-stage">
  <div class="ds-label">Type Scale（token: --type-*）</div>
  <div class="name" style="font-size:72px;writing-mode:horizontal-tb">徐可斯</div>
  <div class="latin-echo" style="font-size:19px;margin:12px 0 30px">Kesi Xu</div>
  <div style="font-family:var(--font-display);font-size:var(--type-h2);margin-bottom:8px">七盏灯
    <span class="echo" style="display:inline;font-size:.38em">Seven lamps</span></div>
  <p class="ds-note" style="margin-bottom:26px">↑ --type-h2 章题 + 内联回声（0.38 倍）</p>
  <p class="line" style="margin-bottom:8px">入夜，一句话点燃一个念头，众智传薪。</p>
  <p class="ds-note" style="margin-bottom:26px">↑ --type-line 章句（文楷 500，行高 1.85，手工断行）</p>
  <p style="font-size:var(--type-body);color:var(--color-smoke);max-width:34em;margin-bottom:8px">
    把散落的检查、文献与随访，织成一张可以问询的图谱——观水，必观其澜。</p>
  <p class="ds-note" style="margin-bottom:26px">↑ --type-body 正文（系统栈，零下载）</p>
  <p class="echo" style="font-size:14px;letter-spacing:.4em">维北有斗，七星在野。</p>
  <p class="ds-note">↑ .echo 中文小注：雅文在上、小注在下；英文只保留人名 "Kesi Xu"（.latin-echo）</p>
</div></body>""")

write("foundations/glow.html", """<!-- @dsCard group="Foundations" name="辉光层级" subtitle="辉光即层级：sm 灯芯 / md 标题 / lg 名字" -->
<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../styles.css">
<body><div class="ds-stage">
  <div class="ds-label">Glow Scale（token: --glow-*）</div>
  <div style="display:grid;gap:44px;padding:30px 0">
    <div style="display:flex;align-items:center;gap:28px">
      <span style="width:7px;height:7px;border-radius:50%;background:var(--color-gold);box-shadow:var(--glow-sm)"></span>
      <span class="ds-note">--glow-sm · 灯芯点：近层烛金 + 远层火橙的双层光</span></div>
    <div style="display:flex;align-items:center;gap:28px">
      <span style="font-family:var(--font-display);font-size:28px;color:var(--color-paper);text-shadow:var(--glow-md)">杏林观澜</span>
      <span class="ds-note">--glow-md · 点亮的标题：只给一层柔光，不抢字形</span></div>
    <div style="display:flex;align-items:center;gap:28px">
      <span style="font-family:var(--font-display);font-size:44px;color:var(--color-paper);text-shadow:var(--glow-lg)">徐可斯</span>
      <span class="ds-note">--glow-lg · 名字/火头：双层大半径，页面最高亮度</span></div>
  </div>
  <p class="ds-note">规则：辉光代替边框和分割线做层级；呼吸动效走伪元素 opacity/scale（--halo），禁止动画 box-shadow 本体。</p>
</div></body>""")

write("foundations/motion.html", """<!-- @dsCard group="Foundations" name="动效纪律" subtitle="scroll 唯一输入 · 只动 transform/opacity · 点过不熄" -->
<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../styles.css">
<body><div class="ds-stage">
  <div class="ds-label">Motion Principles</div>
  <ul style="list-style:none;font-size:13.5px;line-height:2.5;color:var(--color-smoke)">
    <li>① <span style="color:var(--color-paper)">scroll 是唯一输入</span> — 滚动即拉动引信；「往下，划」是全站题眼</li>
    <li>② <span style="color:var(--color-paper)">只动 transform / opacity</span> — canvas 离屏即停、dpr≤2、粒子有上限</li>
    <li>③ <span style="color:var(--color-paper)">灯点过就不熄</span> — once:true；回滚一切保持点亮，火有记忆</li>
    <li>④ <span style="color:var(--color-paper)">慢而少</span> — reveal 1.0–1.1s power2.out；scrub 0.4–0.5；奢侈感来自节制</li>
    <li>⑤ <span style="color:var(--color-paper)">基线不可残缺</span> — 无 JS / reduced-motion / JS 异常 = 完整静态可读页</li>
  </ul>
</div></body>""")

# ═══ components ═══
write("components/hero.html", """<!-- @dsCard group="Components" name="Hero · 划亮的名字" subtitle="竖排 .name + .latin-echo + 侧位火柴" -->
<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../styles.css">
<body><div class="ds-stage" style="position:relative;height:560px;overflow:hidden;
  background:radial-gradient(60% 50% at 62% 42%,rgba(255,150,70,.09),transparent 70%)">
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center">
    <div class="name" style="font-size:116px">徐可斯</div>
    <div class="latin-echo" style="font-size:17px">Kesi&nbsp;Xu</div>
    <div style="font-family:var(--font-display);font-size:15px;color:var(--color-smoke);line-height:2.1">
      格物于毫厘，点灯于长夜。</div>
    <p class="echo" style="font-size:12.5px">计算病理出身，做医学与智能之间的转化。</p>
  </div>
  <div style="position:absolute;right:22%;top:38%;width:3px;height:100px;background:#31241b;border-radius:2px;transform:rotate(6deg)">
    <div style="position:absolute;top:-8px;left:-3px;width:9px;height:12px;border-radius:50%;background:#7a4a28;
         box-shadow:0 0 18px 6px rgba(255,190,110,.55),0 0 60px 24px rgba(255,110,50,.22)"></div></div>
</div></body>""")

write("components/lamp.html", """<!-- @dsCard group="Components" name="灯 · 产品卡" subtitle=".lamp / .lamp.lit — 无边框，辉光与衬底做层级" -->
<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../styles.css">
<body><div class="ds-stage" style="display:grid;gap:20px">
  <div class="lamp">
    <span class="lamp-dot" style="top:calc(var(--space-lamp) + .95em + 27px)"></span>
    <span class="lamp-no">其一</span>
    <h3>见微</h3>
    <p class="lamp-desc">每天拂晓，把科学智能与生医的微末信号，读成三分钟晨报——见微，知著。</p>
    <span class="tag">内测中</span>
  </div>
  <div class="lamp lit">
    <span class="lamp-dot" style="top:calc(var(--space-lamp) + .95em + 27px)"></span>
    <span class="lamp-no">其五</span>
    <h3>MatchPoint<span style="font-size:.55em;color:var(--color-amber);vertical-align:.55em;margin-left:.25em">↗</span></h3>
    <p class="lamp-desc">一句话说出想动的念头，剩下的运筹组局，交给智能。</p>
    <span class="tag tag-open">公开 · 联袂之作</span>
  </div>
  <p class="ds-note">上：未点亮（全 smoke/char）。下：.lit 点亮态 —— 灯芯金点 + 标题纸白 + 火光衬底浮现。
  只有公开产品的标题可点击（下划线 + ↗）。</p>
</div></body>""")

write("components/tag.html", """<!-- @dsCard group="Components" name="状态标签" subtitle=".tag / .lit / .tag-open — hairline 胶囊三态" -->
<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../styles.css">
<body><div class="ds-stage">
  <div class="ds-label">Tag States</div>
  <div style="display:flex;gap:16px;flex-wrap:wrap">
    <span class="tag">未点亮 · 内测中</span>
    <span class="tag lit">点亮 · 琢磨中</span>
    <span class="tag tag-open lit">公开 · 联袂之作</span>
  </div>
  <p class="ds-note" style="margin-top:20px">11px + .22em 字距的 hairline 胶囊。烟灰 → 琥珀（点亮）→ 烛金（仅公开款）。
  同一标签不混两档火色。</p>
</div></body>""")

write("components/fuse.html", """<!-- @dsCard group="Components" name="引信" subtitle="烧过的余烬红 → 火头烛金；穿过每盏灯的灯芯" -->
<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../styles.css">
<body><div class="ds-stage" style="position:relative;height:430px">
  <svg width="70" height="430" style="position:absolute;left:40px" viewBox="0 0 70 430">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b33a1e"/><stop offset=".45" stop-color="#ffa94d"/><stop offset="1" stop-color="#ffd28a"/>
    </linearGradient></defs>
    <path d="M35 0 C 41 60 29 120 35 180 C 41 240 35 260 35 272" fill="none" stroke="url(#g)" stroke-width="1.5"
          style="filter:drop-shadow(0 0 6px rgba(255,169,77,.65))"/>
    <path d="M35 272 C 35 305 33 365 35 430" fill="none" stroke="var(--color-char)" stroke-width="1.5"/>
  </svg>
  <div style="position:absolute;left:73px;top:264px;width:5px;height:5px;border-radius:50%;background:var(--color-gold);
       box-shadow:0 0 10px 3px rgba(255,210,138,.9),0 0 34px 12px rgba(255,107,53,.35)"></div>
  <p class="ds-note" style="position:absolute;left:135px;top:236px;max-width:22em">
    上段：烧过（--fuse-gradient，余烬红渐到烛金）；<br>下段：未燃（--color-char）。<br>
    火头 = 金点 + --glow-sm 级双层光。<br>滚动拉动火头前进；路径必须精确穿过每个 .lamp-dot。</p>
</div></body>""")

write("components/constellation.html", """<!-- @dsCard group="Components" name="星图 · 北斗七灯" subtitle="七盏灯=北斗；MatchPoint 居天枢最亮" -->
<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../styles.css">
<body><div class="ds-stage" style="display:flex;flex-direction:column;align-items:center;gap:30px">
  <svg viewBox="0 0 360 400" style="width:min(88%,470px)">
    <g fill="none" stroke="#8a7a5e" stroke-width=".6" opacity=".4">
      <line x1="52" y1="84" x2="128" y2="128"/><line x1="128" y1="128" x2="196" y2="158"/>
      <line x1="196" y1="158" x2="262" y2="186"/><line x1="262" y1="186" x2="340" y2="230"/>
      <line x1="340" y1="230" x2="316" y2="344"/><line x1="316" y1="344" x2="232" y2="296"/>
      <line x1="232" y1="296" x2="262" y2="186"/>
    </g>
    <g fill="var(--color-gold)" style="font-family:var(--font-display);font-size:12px">
      <g transform="translate(52 84)"><circle r="2.2"/><text x="-10" y="-10" fill="var(--color-smoke)">见微</text></g>
      <g transform="translate(128 128)"><circle r="2.2"/><text x="-10" y="-11" fill="var(--color-smoke)">杏林观澜</text></g>
      <g transform="translate(196 158)"><circle r="2.2"/><text x="6" y="-9" fill="var(--color-smoke)">ThesisAtlas</text></g>
      <g transform="translate(262 186)"><circle r="2.2"/><text x="10" y="-8" fill="var(--color-smoke)">DCSchina</text></g>
      <g transform="translate(340 230)"><circle r="3" style="filter:drop-shadow(0 0 4px rgba(255,210,138,.9))"/>
        <text x="-9" y="-12" text-anchor="end" fill="var(--color-smoke)">MatchPoint</text></g>
      <g transform="translate(316 344)"><circle r="2.2"/><text x="-9" y="18" text-anchor="end" fill="var(--color-smoke)">TrustPathBot</text></g>
      <g transform="translate(232 296)"><circle r="2.2"/><text x="-96" y="14" fill="var(--color-smoke)">Conference Cockpit</text></g>
    </g>
  </svg>
  <p class="line" style="font-size:24px">点过的灯，抬头再看，<br>已成星斗。</p>\n  <p class="echo" style="font-size:13px;letter-spacing:.4em">维北有斗，七星在野。</p>
</div></body>""")

write("components/ember.html", """<!-- @dsCard group="Components" name="余烬 · 联系" subtitle="呼吸余烬 + 反收割邮箱 + 无追踪声明" -->
<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="../styles.css">
<body><div class="ds-stage" style="display:flex;flex-direction:column;align-items:center;gap:28px;text-align:center;padding-top:64px">
  <span class="ember-dot"></span>
  <div class="keep">灯为君留。</div>
  <div style="display:flex;flex-direction:column;gap:14px;font-size:15px;letter-spacing:.12em">
    <a style="color:var(--color-amber);border-bottom:1px solid rgba(255,169,77,.35);padding-bottom:3px">email@kesixu.com</a>
    <a style="color:var(--color-amber);border-bottom:1px solid rgba(255,169,77,.35);padding-bottom:3px">GitHub&nbsp;@kesixu</a>
  </div>
  <p class="echo" style="font-size:13px;letter-spacing:.22em">有朋自远方来——来信，即复。</p>
  <p class="fine">此页无追踪、无埋点、无第三方。<br>一砖一瓦，皆是手作。</p>
  <p style="font-size:12.5px;color:var(--color-smoke);letter-spacing:.1em">© 2026 徐可斯</p>
</div></body>""")

# ═══ templates/landing —— 线上站点的自包含静态快照 ═══
site_html = (ROOT / "site/index.html").read_text(encoding="utf-8")
site_css = (ROOT / "site/style.css").read_text(encoding="utf-8")
site_css = site_css.replace('url("/fonts/wenkai-subset.woff2")', f'url(data:font/woff2;base64,{WENKAI})')
site_css = site_css.replace('url("/fonts/garamond-italic-subset.woff2")', f'url(data:font/woff2;base64,{GARA})')
snap = site_html
snap = re.sub(r'<script src="/(?:vendor/[^"]+|main\.js[^"]*)" defer></script>\s*', '', snap)
snap = re.sub(r'<link rel="preload"[^>]+>\s*', '', snap)
snap = re.sub(r'<link rel="stylesheet" href="/style\.css[^"]*">',
              lambda m: '<style>\n' + site_css + '\n</style>', snap)
snap = snap.replace('<li class="lamp">', '<li class="lamp lit">')   # 快照 = 全点亮静态态
snap = snap.replace('<!DOCTYPE html>',
  '<!-- @dsCard group="Templates" name="划亮 · 整页" subtitle="线上站点静态快照（全点亮态，无 JS）" -->\n<!DOCTYPE html>')
write("templates/landing/index.html", snap)

print("\nds/ built to official-template spec.")
