# design-sync 笔记（kesixu-home）

- 本仓库**无 React 组件可编译**：不产 `_ds_bundle.js`/`.d.ts`/`.prompt.md`，设计代理靠三样东西工作：
  `styles.css`（token + 组件类 + 内嵌子集字体）、`readme.md`（conventions，含已校验的类/token 词汇表）、
  `templates/landing/index.html`（整页参照）。这是静态站设计语言的诚实形态，不是缺漏。
- `_ds_sync.json` 锚不产出（无转换器 hash 流水线）——每次同步全量重推 15 个文件，幂等且秒级，可接受。
- 改站点（site/）后同步三步：`python3 tools/build-ds.py` → `DesignSync finalize_plan`（writes 见 config）→ `write_files` 15 文件。
- 字体以 data URI 内嵌进 ds/styles.css（~183KB），单文件 <256KB 限制内；templates/landing 同理（~200KB）。
- 站点文案改动后必跑 `tools/subset-fonts.sh`，部署门 `tools/check-glyphs.py` 会拦缺字。
- 用户设计否决清单（勿再引入）：印章/图章装饰、"自家服务器"表述、胶囊圆角标签、英文回声（人名除外）、任何"AI 味"点缀。准则：稳定流畅 > 巧思。
