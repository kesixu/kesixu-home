# Adaptive Wildfire Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the wildfire-to-constellation transition richer while guaranteeing a bounded rendering cost across modern and low-end phones.

**Architecture:** Keep the no-build, zero-network static architecture and the existing GSAP scroll orchestration. Add one deterministic motion-profile policy shared by the canvas scenes, then let the wildfire renderer cache expensive resources, cap physical canvas pixels, cap frame rate, and degrade one tier when sustained frame pacing misses its budget. The visual renderer remains Canvas 2D so every effect has the same code path on iOS Safari, Android Chromium, WeChat X5, desktop, and automated fallback tests.

**Tech Stack:** HTML5 Canvas 2D, requestAnimationFrame, GSAP ScrollTrigger, CSS, Python Playwright.

---

### Task 1: Lock the adaptive-rendering contract

**Files:**
- Modify: `workspace/lift_qa.py`
- Create: `workspace/motion_budget_qa.py`

- [ ] **Step 1: Add a failing profile assertion**

Load the page at 390x844 and assert that `<html>` exposes `data-motion-tier`, `data-motion-fps`, and `data-motion-pixels`, and that the canvas backing store does not exceed the declared pixel budget by more than one percent.

- [ ] **Step 2: Add a forced eco-mode test**

Load `/?motion=eco`, scroll to 46% of `sky-transition`, and assert tier `eco`, target FPS `30`, backing pixels at or below `420000`, a non-empty wildfire canvas, nine visible final stars, zero console errors, and zero third-party requests.

- [ ] **Step 3: Run the test and confirm red**

Run: `python3 workspace/motion_budget_qa.py`
Expected: FAIL because the motion profile attributes do not exist yet.

### Task 2: Add a deterministic motion budget

**Files:**
- Modify: `site/main.js`

- [ ] **Step 1: Implement profile selection**

Create `createMotionProfile()` with three tiers. High uses 60 FPS, 96 embers, 21 flame lanes, and at most 1,600,000 physical pixels; balanced uses 45 FPS, 68 embers, 16 lanes, and 720,000 pixels; eco uses 30 FPS, 42 embers, 11 lanes, and 420,000 pixels. Select from viewport area, `hardwareConcurrency`, optional `deviceMemory`, Save-Data, and the existing mobile test. Allow only `?motion=high|balanced|eco` as a deterministic local/public QA override.

- [ ] **Step 2: Expose only non-identifying diagnostics**

Write the active tier, target FPS, and pixel budget to `<html>` data attributes. Do not send, persist, or log hardware information.

- [ ] **Step 3: Bound canvas memory**

Compute effective DPR as `min(devicePixelRatio, tier DPR cap, sqrt(maxPixels / CSSPixelArea))`, never below 1. This prevents high-DPR full-screen canvases from allocating several million pixels on a phone.

- [ ] **Step 4: Add a frame governor**

Draw at most at the tier FPS. Maintain an exponential moving average of frame interval; after sustained slow pacing, step down one tier once per scene activation, rebuild cached resources, and update diagnostics.

- [ ] **Step 5: Run the motion-budget test and confirm green**

Run: `python3 workspace/motion_budget_qa.py`
Expected: PASS for automatic and forced eco profiles.

### Task 3: Replace the row of flames with a layered fire front

**Files:**
- Modify: `site/main.js`

- [ ] **Step 1: Cache resize-dependent paints**

Build the vertical fire gradient and ground glow gradient only during `resize()`. Reuse them during animation frames instead of allocating radial gradients on every draw.

- [ ] **Step 2: Draw a continuous wildfire curtain**

Add `drawFireCurtain(now, left, right, alpha)` that batches the outer ember silhouette and inner gold body into two filled paths. Use deterministic multi-frequency sine noise, smooth midpoint curves, and edge attenuation so the front spreads organically from the center without evenly spaced teeth.

- [ ] **Step 3: Add the ignition wave and ground filament**

Draw a low elliptical light wave at the moment the fire front accelerates, plus a thin incandescent ground line whose width follows the spread. Both stay within the existing ember-to-gold palette.

- [ ] **Step 4: Retain sparse hero flames**

Draw only the profile-controlled number of taller procedural flames over the curtain. Vary lane position, lean, root, height, and width deterministically.

- [ ] **Step 5: Make embers rise from the whole burning front**

Map each ember's source X across the active fire width before it follows its curved path to one of nine star targets. Keep color, size, and trail variation deterministic so reverse scrolling remains stable.

### Task 4: Verify interaction, visuals, and fallbacks

**Files:**
- Modify: `workspace/lift_qa.py`
- Modify: `workspace/motion_budget_qa.py`

- [ ] **Step 1: Run syntax and budget checks**

Run: `node --check site/main.js`, `git diff --check`, and gzip all three JavaScript files. Expected: clean syntax/diff and total JS below 150 KB gzip.

- [ ] **Step 2: Run full multi-viewport regression**

Run: `python3 -u workspace/lift_qa.py`
Expected: PASS at 360x780, 390x844, 430x932, 844x390, and 1440x900, plus reduced-motion and no-JS.

- [ ] **Step 3: Run typography, curve, glyph, and link checks**

Run: `python3 workspace/type_qa.py`, `python3 workspace/curve_probe.py`, `python3 tools/check-glyphs.py`, and `python3 workspace/link_qa.py`. Expected: all PASS.

- [ ] **Step 4: Capture and inspect high and eco frames**

Capture 390x844 screenshots at transition progress 0.30, 0.46, and 0.68 for automatic and eco modes. Confirm that the fire is continuous, the brightest point stays grounded, embers remain legible, labels do not collide, and eco mode preserves the narrative.

- [ ] **Step 5: Run Lighthouse**

Run mobile Lighthouse for performance, accessibility, best practices, and SEO. Expected: no regression in LCP or CLS, accessibility/best-practices/SEO remain 100, and performance stays within normal run-to-run variance of the current score.

### Task 5: Ship with rollback evidence

**Files:**
- Deploy: `site/` via `deploy/deploy.sh`

- [ ] **Step 1: Commit and push**

Commit the tested source, QA, and plan to `main`, then push `origin/main`.

- [ ] **Step 2: Back up production**

Create `/var/backups/kesixu-home-static-<UTC>.tar.gz` from `/var/www/kesixu-home` before deployment.

- [ ] **Step 3: Deploy and rerun public QA**

Run `bash deploy/deploy.sh`, then rerun motion-budget, full viewport, typography, and link checks against `https://kesixu.com/`.

- [ ] **Step 4: Prove synchronization**

Compare public and local hashes for `main.js` and `style.css`; confirm local `HEAD` equals `origin/main` and the worktree is clean.
