# 燎原成星与项目状态 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把灯火段到星图段改造成“星火燎原、灰烬升空、九星成图”的连续滚动演出，同时明确可访问项目与尚未开放介绍页的项目状态。

**Architecture:** 继续使用 no-build HTML/CSS/GSAP 架构。DOM 负责九个项目和锁状态的真实语义；一个小型高分屏 Canvas 只负责星图转场粒子，GSAP ScrollTrigger 负责滚动进度、停帧与降级。Canvas 使用固定粒子池并在离屏时停止，静态/无 JS 模式直接展示完整星图。

**Tech Stack:** HTML5、CSS、Canvas 2D、GSAP 3.15、ScrollTrigger、Playwright Python QA。

---

### Task 1: Write regression assertions for the requested behavior

**Files:**
- Modify: `workspace/lift_qa.py`

- [ ] **Step 1: Assert the scroll hint lifecycle**

Extend the mobile QA state so it checks that the hint contains both `下滑` and `看更多`, remains visible after the first small scroll and after the match is lit, then hides only after the hero story has completed.

- [ ] **Step 2: Assert project ordering and locked states**

Require exactly four accessible projects, require `MatchPoint` to be the first secondary project, and require five inaccessible secondary projects to contain `.project-lock` inside `[data-locked]`.

- [ ] **Step 3: Assert the complete constellation and transition canvas**

Require nine `.star` nodes, three `.star.core` nodes, and a non-empty `#wildfire` Canvas while the sky ScrollTrigger is at mid-progress.

- [ ] **Step 4: Run the test before implementation**

Run: `python3 -u workspace/lift_qa.py`

Expected: FAIL for the old hint lifecycle, missing lock icons, seven-star SVG, and missing wildfire canvas.

### Task 2: Reorder projects and encode availability in the DOM

**Files:**
- Modify: `content/copy.md`
- Modify: `site/index.html`

- [ ] **Step 1: Put accessible projects first**

Keep the three linked hero cards first, then move linked `MatchPoint` to the first row under `更多项目`.

- [ ] **Step 2: Mark unavailable introduction pages**

Add `data-locked` to 见微、杏林观澜、ThesisAtlas、取之有道、Conference Cockpit and add a decorative `.project-lock` element with the accessible label `介绍页尚未开放`.

- [ ] **Step 3: Replace the old seven-star SVG**

Build a nine-node constellation. The three `.star.core` nodes are 一念起卦、铁饭碗、经史星图 and remain real links; MatchPoint is also linked. The five locked projects are non-link star groups.

- [ ] **Step 4: Add the transition canvas and new hint copy**

Insert `<canvas id="wildfire" aria-hidden="true"></canvas>` into `#sky` and change the hint to a small themed down-arrow plus `下滑` / `看更多`.

### Task 3: Implement the visual system and scroll timeline

**Files:**
- Modify: `site/style.css`
- Modify: `site/main.js`

- [ ] **Step 1: Draw theme-consistent lock icons in CSS**

Use borders, a shackle pseudo-element and a small ember keyhole. No emoji, external icon font or third-party request.

- [ ] **Step 2: Implement `WildfireScene`**

Use a fixed deterministic particle pool. At phase 0–0.35 a fire front spreads from the last ember; at phase 0.25–0.8 embers rise and cool; at phase 0.62–1 particles settle toward constellation coordinates. Cap DPR at 2.5 mobile / 2 desktop and stop `requestAnimationFrame` offscreen.

- [ ] **Step 3: Replace the one-shot sky reveal**

Pin `#sky` for a measured scroll interval. Bind Canvas phase and SVG line/star opacity to the same scrubbed timeline so fire fades before the nine-star constellation becomes fully legible.

- [ ] **Step 4: Correct the hint lifecycle**

Remove the `scrollY >= 7` retirement logic. Toggle `match-lit` while the fire is established and `story-entered` only near the end of the hero timeline; CSS keeps the small hint visible through ignition and then fades it.

- [ ] **Step 5: Preserve reduced-motion and no-JS fallbacks**

Never hide DOM content outside `.fx`; hide the Canvas for reduced motion/print and leave the complete constellation visible without JavaScript.

### Task 4: Verify, publish and re-check production

**Files:**
- Test: `workspace/lift_qa.py`
- Test: `workspace/type_qa.py`
- Test: `workspace/link_qa.py`

- [ ] **Step 1: Run static checks**

Run: `node --check site/main.js`, `git diff --check`, `python3 tools/check-glyphs.py`.

Expected: all exit 0.

- [ ] **Step 2: Run complete local QA**

Run: `python3 workspace/type_qa.py`, `python3 workspace/link_qa.py`, `python3 -u workspace/lift_qa.py`.

Expected: fixed mobile typography, correct live links, nine ignitions, nine stars, five locks, non-empty wildfire Canvas, clean console and zero external requests.

- [ ] **Step 3: Run Lighthouse and budget checks**

Require accessibility/best-practices/SEO 100, CLS 0 and total JavaScript below 150KB gzip. Investigate any material performance regression before deployment.

- [ ] **Step 4: Commit, push, back up and deploy**

Commit the source, push `main`, create a timestamped `/var/backups/kesixu-home-static-*.tar.gz`, then run `bash deploy/deploy.sh`.

- [ ] **Step 5: Re-run public QA**

Run the same Playwright suite with `KESIXU_URL=https://kesixu.com/` and verify source/live hashes plus `HEAD == origin/main`.
