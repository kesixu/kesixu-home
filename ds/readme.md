# 划亮 · kesixu.com design system

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

全部中文；文雅、有典故、有节奏、用成语；典故织入不注出处。已织入的典源：《诗经·庭燎》
（夜如何其）、《大学》格物、韩愈焚膏继晷、《庄子》薪火相传、《礼记》玉琢成器、《维摩诘经》
无尽灯（一灯燃百灯）、《孟子》观水观澜与明察秋毫、《孙子》庙算、《诗经·大东》维北有斗、
《论语》有朋自远方来。七盏灯以「其一…其七」古典序数编次。题眼「往下，划」保持白话，一字不动。

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

## Files

- `styles.css` — 唯一样式表：token 表 + 组件层 +内嵌子集字体。
- `theme.json` — token 的机器可读记录。
- `thumbnail.html` — 项目封面。
- `foundations/color.html` `type.html` `glow.html` `motion.html` — 基础层。
- `components/hero.html` `lamp.html` `tag.html` `fuse.html` `constellation.html` `ember.html` — 组件层。
- `templates/landing/index.html` — 线上站点的自包含静态快照（整页模板）。

线上源仓库：kumo `~/projects/kesixu-home`（`site/` 为部署产物；本系统与其同步，改这里之后要回灌）。
