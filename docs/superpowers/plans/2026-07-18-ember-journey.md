# Ember Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cellular motif and kinked fuse with a realistic scroll-driven ember that follows a graceful curve and visibly ignites every project in sequence.

**Architecture:** Keep the no-build, self-hosted GSAP setup. Generate a monotonic cubic SVG route from measured project anchors, move a small high-DPI Canvas ember with native `getPointAtLength()`, and derive each project's ignition threshold from the same path so motion and highlight cannot drift apart. All effects remain progressive enhancement and collapse to readable static content under reduced motion.

**Tech Stack:** Semantic HTML, CSS, SVG geometry APIs, Canvas 2D, GSAP core, ScrollTrigger, Playwright.

---

### Task 1: Lock the path regression into a probe

**Files:**
- Create: `workspace/curve_probe.py`
- Create: `workspace/lift_qa.py`

- [ ] **Step 1: Measure the current path**

Sample tangents along `#fuseBase`, report the maximum local angle change, and calculate the closest path distance to each `.hero-dot`.

- [ ] **Step 2: Record the failing baseline**

Run `python3 workspace/curve_probe.py`. Expected before the fix: the 1440px layout misses at least one main project anchor by more than 20px and contains a local turn above 45 degrees.

### Task 2: Replace the cellular image with fire

**Files:**
- Modify: `site/main.js`
- Modify: `site/index.html`
- Modify: `site/style.css`

- [ ] **Step 1: Remove the microscopic ellipse field**

Delete the `cellMotifs` allocation and `drawMicroField()` pass from the match canvas.

- [ ] **Step 2: Add a real fuse ember canvas**

Place a small `#fuseSpark` canvas inside `#fuseHead`. Render a warm halo, an asymmetric white-hot flame core, short ballistic ember streaks, and a fading smoke wisp using a fixed particle pool.

- [ ] **Step 3: Tie the ember to the SVG tangent**

Use points immediately before and after the current path distance to compute travel angle. Feed position, direction, scroll velocity, and active state into the ember scene without allocating objects per frame.

### Task 3: Rebuild the route as a graceful monotonic curve

**Files:**
- Modify: `site/main.js`
- Modify: `site/style.css`

- [ ] **Step 1: Stagger desktop project cards**

Give the second and third main cards increasing vertical offsets on wide screens so one continuous route can visit them in reading order.

- [ ] **Step 2: Generate anchors in reading order**

Combine restrained editorial guide points, the three main card wicks, and the remaining project list items. Keep y coordinates strictly increasing and place secondary anchors near alternating outer margins so the line never crosses text.

- [ ] **Step 3: Connect anchors with vertical-tangent cubics**

For each pair, use control points at 42 percent of the vertical gap with the source and destination x coordinates. This produces C1-continuous joins without Catmull-Rom overshoot, knots, or horizontal cusps.

- [ ] **Step 4: Prove the geometry**

Run `python3 workspace/curve_probe.py`. Expected after the fix: all main anchor distances below 2px and maximum sampled local turn below 20 degrees on 390px and 1440px layouts.

### Task 4: Ignite projects at the exact arrival moment

**Files:**
- Modify: `site/main.js`
- Modify: `site/style.css`
- Modify: `site/index.html`

- [ ] **Step 1: Derive ignition thresholds from the path**

For each measured target, scan the finished path once, store its closest normalized distance, and sort thresholds in route order.

- [ ] **Step 2: Apply arrival and persistent states**

When forward scroll crosses a threshold, add `.lit` for the lasting warm state and `.is-igniting` for a short border flash, logo colour return, radial heat bloom, and ember burst. Remove only the transient class after the pulse.

- [ ] **Step 3: Preserve keyboard and static access**

Focused projects ignite immediately. No-JS and reduced-motion modes show all content clearly without movement.

### Task 5: Correct the first-screen guidance

**Files:**
- Modify: `content/copy.md`
- Modify: `site/index.html`
- Modify: `site/style.css`
- Modify: `site/main.js`
- Update: `site/fonts/wenkai-subset.woff2`

- [ ] **Step 1: Change the instruction to 下滑**

Show the exact two-character instruction beside a small travelling ember, not an arrow-only control.

- [ ] **Step 2: Keep the name faintly present on first paint**

Render 徐可斯 as a low-contrast charcoal imprint before ignition so the instruction and intended action are connected immediately.

- [ ] **Step 3: Remove the hint after the first meaningful scroll**

Hide the guide after the first scroll delta and do not show another scrolling instruction later in the page.

- [ ] **Step 4: Rebuild the font subset**

Run `bash tools/subset-fonts.sh`. Expected: exit 0 and the resulting subset contains every code point used by the page.

### Task 6: Verify and deploy

**Files:**
- Create: `workspace/lift_qa.py`

- [ ] **Step 1: Run responsive interaction QA**

Test 360×780, 390×844, 430×932, 844×390, and 1440×900. Check zero overflow, clean console, no external requests, the hint disappears after scrolling, the ember canvas is non-empty, and projects ignite in route order.

- [ ] **Step 2: Run reduced-motion and no-JS QA**

Confirm the entire page stays readable, no looping canvas runs, and all projects remain visible.

- [ ] **Step 3: Run Lighthouse**

Expected mobile scores: performance at least 90, accessibility/best practices/SEO at least 95, CLS below 0.1.

- [ ] **Step 4: Back up and deploy**

Archive `/var/www/kesixu-home`, run the existing deployment script, and compare source/deployed SHA-256 values. No DNS or Nginx changes are required.

- [ ] **Step 5: Verify production**

Repeat the responsive smoke test against `https://kesixu.com/`, verify HTTP 200 and new cache-versioned assets, then confirm the repository and remote branch are synchronized.
