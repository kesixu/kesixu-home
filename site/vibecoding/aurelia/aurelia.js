/* Aurelia 鉴赏家 v2 ·「月下开片 · 证据之光」动效编排
   家规：scroll 是唯一输入；只动 transform/opacity（例外：S5 轮廓与 S6 五线的 stroke-dashoffset）；
   reduced-motion、无 GSAP、任何异常 → 静态全亮态（HTML/CSS 默认态）。无内联脚本（CSP script-src 'self'）。
   光层只有一个写入口：lightTrack（月的站点表），intro 只动内层 .au-moon。 */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var isMobile = window.matchMedia("(any-pointer: coarse)").matches || window.matchMedia("(max-width: 899px)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TEARDOWN = ".au-moonwrap,.au-moon,.au-lattice,.au-haze,.au-sky,.au-ember,.au-stage,.au-vessel,.au-shadow,.au-sheen i,.au-intro,.au-rise,.au-redline,.au-outline path,.au-part,.au-step,.au-measure dd,.au-crackle .ck,.au-beams path,.au-spot,.au-stage--nb,.au-space,.au-scroll-hint,.au-s5 .au-text > .au-p,.au-cap";
  var lightTL = null, introTL = null;

  /* ── 静态态：拆掉全部演出，剥净内联样式（自身绝不再抛）── */
  function toStatic() {
    try {
      doc.classList.remove("motion-pending", "fx");
      if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(function (st) { st.kill(true); });
      if (window.gsap) { gsap.globalTimeline.clear(); gsap.set(TEARDOWN, { clearProps: "all" }); gsap.set(".au-bar__fill", { clearProps: "transform,opacity" }); }
      $$(".au-outline path, .au-beams path").forEach(function (p) { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; });
    } catch (e) { /* 静态态不依赖任何脚本 */ }
    try { drawBeams(false); } catch (e) { /* 无 S6 亦可 */ }
  }

  /* ── S6 光束：查询器底部 → 五件近亲顶部（像素坐标，随 refresh 重算）── */
  function drawBeams(animated) {
    var wrap = $(".au-s6 .au-wrap--rel"), svg = $(".au-beams"), q = $(".au-stage--q .au-vessel");
    if (!wrap || !svg || !q) return [];
    var W = wrap.clientWidth, H = wrap.clientHeight, wr = wrap.getBoundingClientRect(), qr = q.getBoundingClientRect();
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var qx = qr.left - wr.left + qr.width / 2, qy = qr.top - wr.top + qr.height * 0.96;
    var paths = $$("path", svg), targets = $$(".au-nb .au-vessel");
    paths.forEach(function (p, i) {
      var t = targets[i]; if (!t) { p.setAttribute("d", ""); return; }
      var r = t.getBoundingClientRect(), nx = r.left - wr.left + r.width / 2, ny = r.top - wr.top + r.height * 0.04;
      var dy = Math.max(40, (ny - qy) * 0.55);
      p.setAttribute("d", "M" + qx.toFixed(1) + "," + qy.toFixed(1) + " C" + qx.toFixed(1) + "," + (qy + dy).toFixed(1) + " " + nx.toFixed(1) + "," + (ny - dy).toFixed(1) + " " + nx.toFixed(1) + "," + ny.toFixed(1));
      if (!animated) { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; }
    });
    return paths;
  }

  if (reducedQuery.matches || !window.gsap || !window.ScrollTrigger) { toStatic(); return; }

  /* ── 画质分档（本地判断，不记录不上传；语义同主页 createMotionProfile）── */
  function createMotionProfile() {
    var tiers = { high: { name: "high", maxPixels: 1600000, dpr: 2 }, balanced: { name: "balanced", maxPixels: 720000, dpr: 1.6 }, eco: { name: "eco", maxPixels: 420000, dpr: 1.25 } };
    var cores = navigator.hardwareConcurrency || 6, memory = navigator.deviceMemory || 0;
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection, saveData = !!(conn && conn.saveData);
    var name = (saveData || cores <= 4 || (memory && memory <= 4)) ? "eco" : (!isMobile || (cores >= 8 && memory >= 8)) ? "high" : "balanced";
    var p = { saveData: saveData };
    function apply(n) { var s = tiers[n]; Object.keys(s).forEach(function (k) { p[k] = s[k]; }); doc.dataset.motionTier = p.name; }
    p.effectiveDpr = function (w, h) { return Math.min(window.devicePixelRatio || 1, p.dpr, Math.sqrt(p.maxPixels / Math.max(1, w * h))); };
    p.degrade = function () { if (p.name === "eco") return false; apply(p.name === "high" ? "balanced" : "eco"); doc.dataset.motionDegraded = "true"; return true; };
    apply(name); return p;
  }

  function boot() {
    var profile = createMotionProfile();
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    var EASE = "power2.out", desktop = window.matchMedia("(min-width: 900px)").matches;

    /* ── 1. 初始态（在移除 motion-pending 之前同步设置，无闪烁）── */
    var moonWrap = $(".au-moonwrap"), moon = $(".au-moon"), lattice = $(".au-lattice"), haze = $(".au-haze"), ember = $(".au-ember");
    var heroStage = $(".au-stage--hero"), heroSheen = $(".au-stage--hero .au-sheen i"), heroShadow = $(".au-stage--hero .au-shadow");
    var introText = $$(".au-hero__text .au-intro"), hint = $(".au-scroll-hint");
    gsap.set(moon, { yPercent: 12, opacity: 0 });
    gsap.set(lattice, { opacity: 0 });
    if (haze) gsap.set(haze, { opacity: 0 });
    gsap.set(heroStage, { opacity: .35, scale: .985, transformOrigin: "50% 100%" });
    gsap.set(heroShadow, { opacity: 0 });
    gsap.set(heroSheen, { xPercent: -60 });
    gsap.set(introText, { opacity: 0, y: 14 });
    gsap.set(hint, { opacity: 0 });
    gsap.set(".au-rise", { opacity: 0, y: 14 });
    gsap.set(".au-bar__fill", { scaleX: 0 });
    gsap.set(".au-redline", { scaleX: 0 });
    doc.classList.add("fx"); doc.classList.remove("motion-pending");

    /* ── 2. 月出 · 开卷（一次性 2.4 s）── */
    introTL = gsap.timeline({ paused: true, defaults: { ease: EASE } });
    introTL.to(ember, { opacity: .9, duration: .25 }, 0)
      .to(ember, { opacity: 0, scale: .6, duration: .8, ease: "power1.in" }, .3)
      .to(moon, { yPercent: 0, opacity: 1, duration: 1.6, ease: "power3.out" }, .15)
      .to(lattice, { opacity: .15, duration: 1.6, ease: "sine.out" }, .35)
      .to(haze || {}, { opacity: .13, duration: 1.6, ease: "sine.out" }, .35)
      .to(heroStage, { opacity: 1, scale: 1, duration: 1.2 }, .45)
      .to(heroShadow, { opacity: 1, duration: 1.2 }, .45)
      .to(heroSheen, { xPercent: 35, duration: 1.2, ease: "power2.inOut" }, .75)
      .to(introText, { opacity: 1, y: 0, duration: .7, stagger: .12 }, 1.05)
      .to(hint, { opacity: 1, duration: .6 }, 2.0)
      .add(function () {
        doc.classList.add("intro-done");
        gsap.fromTo(heroSheen, { xPercent: 35 }, { xPercent: -25, ease: "none", scrollTrigger: { trigger: "#s1", start: "top top", end: "bottom top", scrub: .6 } });
      }, 2.4);
    if (window.scrollY > window.innerHeight * .5 || location.hash) introTL.progress(1); else introTL.play();

    /* ── 3. 光的站点表：月随滚动走位，L 统领窗棂/月雾电平（唯一写入口）── */
    function buildLight() {
      if (lightTL) { if (lightTL.scrollTrigger) lightTL.scrollTrigger.kill(); lightTL.kill(); lightTL = null; }
      var vw = window.innerWidth / 100, vh = window.innerHeight / 100, D = window.matchMedia("(min-width: 900px)").matches;
      var top = function (sel) { var el = $(sel); return el ? el.getBoundingClientRect().top + window.scrollY : 0; };
      var H = Math.max(1, doc.scrollHeight - window.innerHeight);
      var base = D ? [84, 18] : [104, -3];
      var S = D ? { a: [84, 18], b: [84, 6], s5: [50, 10], s6: [50, 8], s7: [50, 30], s8: [50, 14], end: [50, 130] }
                : { a: [104, -3], b: [104, -15], s5: [96, -2], s6: [96, -2], s7: [96, -8], s8: [96, -8], end: [124, -8] };
      /* [scrollY, mx, my, halo, lattice, haze] */
      var K = [
        [0, S.a[0], S.a[1], 1, 1, 1], [60 * vh, S.b[0], S.b[1], 1, 1, 1],
        [top("#s2"), S.b[0], S.b[1], .85, .9, .9], [top("#s3"), S.b[0], S.b[1], .55, .4, .55], [top("#s4"), S.b[0], S.b[1], .5, .25, .5],
        [top("#s5"), S.s5[0], S.s5[1], 1, .25, .85], [top("#s6"), S.s6[0], S.s6[1], .6, .2, .55],
        [top("#s7") - 50 * vh, S.s6[0], S.s6[1], .6, .2, .55], [top("#s7"), S.s7[0], S.s7[1], .15, .08, .15],
        [top("#s8") - 30 * vh, S.s7[0], S.s7[1], .15, .08, .15], [top("#s8"), S.s8[0], S.s8[1], .4, .18, .4],
        [top("#s9"), S.s8[0], S.s8[1], .4, .18, .35], [H, S.end[0], S.end[1], 0, .12, .25]
      ];
      for (var i = 1; i < K.length; i++) if (K[i][0] <= K[i - 1][0]) K[i][0] = K[i - 1][0] + 1;   /* 单调保险 */
      lightTL = gsap.timeline({ scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: .8 } });
      for (i = 1; i < K.length; i++) {
        var a = K[i - 1], b = K[i], d = b[0] - a[0];
        lightTL.to(moonWrap, { x: (b[1] - base[0]) * vw, y: (b[2] - base[1]) * vh, opacity: b[3], duration: d, ease: "none" }, a[0]);
        lightTL.to(lattice, { opacity: .15 * b[4], duration: d, ease: "none" }, a[0]);
        if (haze) lightTL.to(haze, { opacity: .13 * b[5], duration: d, ease: "none" }, a[0]);
      }
    }
    gsap.to(hint, { opacity: 0, ease: "none", scrollTrigger: { trigger: "#s1", start: "top top", end: "+=40%", scrub: true } });
    gsap.fromTo(ember, { opacity: 0 }, { opacity: .7, ease: "none", scrollTrigger: { trigger: "#s9", start: "top 60%", end: "bottom bottom", scrub: .8 } });

    /* ── 4. 逐屏揭示（一次性）── */
    ScrollTrigger.batch(".au-rise", { start: "top 88%", once: true, onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .9, stagger: .08, ease: EASE, overwrite: true }); } });

    /* ── 5. 高光带：每个舞台随滚动扫过；阴影联动（光正对器物时影最实）── */
    function coupleShadow(stage, trig) {
      var shadow = $(".au-shadow", stage); if (!shadow) return;
      gsap.fromTo(shadow, { scaleX: .9, opacity: .55, xPercent: 4 }, { keyframes: [{ scaleX: 1.05, opacity: 1, xPercent: 0, ease: "sine.out" }, { scaleX: .92, opacity: .6, xPercent: -4, ease: "sine.in" }], scrollTrigger: trig });
    }
    $$(".au-stage").forEach(function (st) {
      if (st.classList.contains("au-stage--hero") || st.classList.contains("au-stage--arc") || st.classList.contains("au-stage--ev")) return;
      var band = $(".au-sheen i", st), trig = { trigger: st, start: "top 95%", end: "bottom 5%", scrub: .6 };
      if (band) gsap.fromTo(band, { xPercent: -60 }, { xPercent: 60, ease: "none", scrollTrigger: trig });
      coupleShadow(st, trig);
    });
    /* S3 七件：一条时间线，月光依次扫过；未照到的件只有 .62 的亮度，图注随亮 */
    var arcStages = $$(".au-stage--arc");
    if (arcStages.length) {
      var arcTL = gsap.timeline({ scrollTrigger: { trigger: ".au-arc", start: "top 85%", end: "bottom 15%", scrub: .6 } });
      arcStages.forEach(function (st, i) {
        var band = $(".au-sheen i", st), img = $(".au-vessel", st), cap = $(".au-cap", st), t0 = i * .55;
        gsap.set(img, { opacity: .62 }); gsap.set(cap, { opacity: 0, y: 6 });
        if (band) arcTL.fromTo(band, { xPercent: -60 }, { xPercent: 60, duration: 1, ease: "none" }, t0);
        arcTL.to(img, { opacity: 1, duration: .4, ease: "none" }, t0 + .2).to(cap, { opacity: 1, y: 0, duration: .3, ease: "none" }, t0 + .35);
      });
    }

    /* ── 6. 风格空间（S3 画布：一次绘制，只动 opacity/transform）── */
    var space = $(".au-space");
    if (space && !profile.saveData && !(profile.name === "eco" && isMobile)) {
      var drawn = false, pts = null;
      var drawSpace = function () {
        if (!pts) return;
        var sec = space.parentElement, W = sec.clientWidth, H = sec.clientHeight, dpr = profile.effectiveDpr(W, H);
        space.width = Math.round(W * dpr); space.height = Math.round(H * dpr);
        var ctx = space.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        var S = Math.min(W, H) * (desktop ? 1.15 : 1.25), ox = (W - S) / 2, oy = (H - S) / 2;
        /* 星云而非尘点：一次性 1.4px 模糊，点色全在色板内 */
        try { ctx.filter = "blur(1.4px)"; } catch (e) { /* 老内核无 filter */ }
        var col = ["rgba(143,150,143,.30)", "rgba(178,74,60,.7)", "rgba(157,187,176,.62)", "rgba(157,187,176,.62)", "rgba(217,223,220,.5)", "rgba(143,150,143,.5)", "rgba(143,150,143,.30)"];
        var r = desktop ? 1.3 : 1.1, n = pts.length / 3;
        for (var i = 0; i < n; i++) {
          var x = ox + pts[i * 3] / 65535 * S, y = oy + pts[i * 3 + 1] / 65535 * S, d = pts[i * 3 + 2];
          if (x < -2 || y < -2 || x > W + 2 || y > H + 2) continue;
          ctx.fillStyle = col[d] || col[0]; ctx.fillRect(x, y, r, r);
        }
        drawn = true;
      };
      var loadSpace = function () {
        fetch("data/projection.bin").then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
          var dv = new DataView(buf); if (dv.getUint8(0) !== 65 || dv.getUint8(1) !== 85) return;
          var n = dv.getUint32(4, true), out = new Float32Array(n * 3), o = 8;
          for (var i = 0; i < n; i++, o += 5) { out[i * 3] = dv.getUint16(o, true); out[i * 3 + 1] = dv.getUint16(o + 2, true); out[i * 3 + 2] = dv.getUint8(o + 4); }
          pts = out; (window.requestIdleCallback || function (f) { setTimeout(f, 0); })(function () {
            drawSpace();
            gsap.fromTo(space, { opacity: 0 }, { opacity: .32, ease: "none", scrollTrigger: { trigger: "#s3", start: "top 80%", end: "top 20%", scrub: .5 } });
            if (profile.name !== "eco") gsap.fromTo(space, { yPercent: 6 }, { yPercent: -6, ease: "none", scrollTrigger: { trigger: "#s3", start: "top bottom", end: "bottom top", scrub: 1 } });
          });
        }).catch(function () { /* 静态页不依赖星点 */ });
      };
      gsap.set(space, { opacity: 0 });
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); loadSpace(); } }, { rootMargin: "150% 0px" });
        io.observe(space);
      } else loadSpace();
      ScrollTrigger.addEventListener("refresh", function () { if (drawn) drawSpace(); });
    }

    /* ── 7. S4 条形：进入即生长（一次性，不 count-up）── */
    $$(".au-bargroup, .au-routes").forEach(function (g) {
      var fills = $$(".au-bar__fill", g);
      ScrollTrigger.create({ trigger: g, start: "top 85%", once: true, onEnter: function () {
        fills.forEach(function (f, i) { var w = parseFloat(getComputedStyle(f).getPropertyValue("--w")) || 1; gsap.to(f, { scaleX: w, duration: 1.1, delay: i * .1, ease: "power3.out" }); });
      } });
    });

    /* ── 8. S5 开片 · 证据（scrub 时间线：轮廓画出 → 光从口沿扫到圈足 → 三项 → 开片六组）── */
    var ev = $("#s5");
    if (ev) {
      var outline = $(".au-outline path", ev), parts = [$(".au-part--rim", ev), $(".au-part--body", ev), $(".au-part--foot", ev)];
      var steps = $$(".au-step", ev), dds = $$(".au-measure dd", ev), cks = $$(".au-crackle .ck", ev), vband = $(".au-sheen--v i", ev), dband = $(".au-stage--ev .au-sheen:not(.au-sheen--v) i", ev);
      var evP = $(".au-s5 .au-text > .au-p", ev);
      gsap.set(outline, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(parts, { opacity: 0, y: 6 }); gsap.set(steps, { opacity: 0, y: 10 }); gsap.set(dds, { opacity: 0, y: 8 }); gsap.set(cks, { opacity: 0 });
      if (dband) gsap.set(dband, { xPercent: 35 });   /* 光停住 */
      if (evP) gsap.set(evP, { opacity: 0, y: 10 });
      var evTL = gsap.timeline({ scrollTrigger: { trigger: ev, start: "top 65%", end: "bottom 85%", scrub: .6 } });
      evTL.to(outline, { strokeDashoffset: 0, duration: 2.2, ease: "none" }, 0)
          .to(steps[0], { opacity: 1, y: 0, duration: 1 }, .4)
          .fromTo(vband, { yPercent: -45 }, { yPercent: 55, duration: 3, ease: "none" }, 2.2)
          .to(parts[0], { opacity: 1, y: 0, duration: .5 }, 2.5)
          .to(parts[1], { opacity: 1, y: 0, duration: .5 }, 3.4)
          .to(parts[2], { opacity: 1, y: 0, duration: .5 }, 4.3)
          .to(steps[1], { opacity: 1, y: 0, duration: 1 }, 2.8)
          .to(steps[2], { opacity: 1, y: 0, duration: 1 }, 5)
          .to(dds, { opacity: 1, y: 0, duration: .8, stagger: .35 }, 5.4)
          .to(cks, { opacity: 1, duration: .9, stagger: .45 }, 4.2)
          .to(evP, { opacity: 1, y: 0, duration: 1 }, 7.2)
          .to({}, { duration: .6 });
    }

    /* ── 9. S6 一束分五束：五线依次画向五件，光斑亮起，暗件（.16）被照亮 ── */
    var nbs = $(".au-nbs");
    if (nbs) {
      var spots = $$(".au-spot"), nbStages = $$(".au-stage--nb"), beams = drawBeams(true);
      gsap.set(beams, { strokeDasharray: 1, strokeDashoffset: 1 }); gsap.set(spots, { opacity: 0 }); gsap.set(nbStages, { opacity: .16, y: 10 });
      var beamTL = gsap.timeline({ scrollTrigger: { trigger: nbs, start: "top 90%", end: "top 25%", scrub: .5 } });
      beams.forEach(function (b, i) { beamTL.to(b, { strokeDashoffset: 0, duration: 1, ease: "none" }, i * .25); });
      spots.forEach(function (s, i) { beamTL.to(s, { opacity: 1, duration: .6 }, .6 + i * .25); });
      nbStages.forEach(function (s, i) { beamTL.to(s, { opacity: 1, y: 0, duration: .7, ease: EASE }, .6 + i * .25); });
      ScrollTrigger.addEventListener("refresh", function () { drawBeams(true); });
    }

    /* ── 10. 红线一屏：朱砂线自中心展开 ── */
    var red = $(".au-redline");
    if (red) ScrollTrigger.create({ trigger: red, start: "top 85%", once: true, onEnter: function () { gsap.to(red, { scaleX: 1, duration: 1.4, ease: "power2.inOut" }); } });

    /* ── 11. 站点表建立；字体就绪与真正的 resize 时重建 ── */
    buildLight();
    var lastW = window.innerWidth, lastH = window.innerHeight, rt = 0;
    window.addEventListener("resize", function () {
      clearTimeout(rt); rt = setTimeout(function () {
        var w = window.innerWidth, h = window.innerHeight;
        if (w === lastW && Math.abs(h - lastH) < 140) return;   /* 地址栏伸缩不算 */
        lastW = w; lastH = h; buildLight(); ScrollTrigger.refresh();
      }, 280);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); buildLight(); });
    window.addEventListener("load", function () { ScrollTrigger.refresh(); buildLight(); });

    /* ── 12. 中途切 reduced-motion → 静态；帧率持续偏低 → 降档 ── */
    var onReduced = function (e) { if (e.matches) toStatic(); };
    if (reducedQuery.addEventListener) reducedQuery.addEventListener("change", onReduced); else if (reducedQuery.addListener) reducedQuery.addListener(onReduced);
    var slow = 0, last = 0;
    gsap.ticker.add(function (t) { var dt = last ? (t - last) * 1000 : 16; last = t; if (dt > 40) { if (++slow > 45) { slow = 0; if (profile.degrade() && profile.name === "eco" && haze) haze.style.display = "none"; } } else if (slow > 0) slow--; });
  }

  /* 首绘之后再接管（rAF → setTimeout 0，主页同款），任何异常回到静态 */
  requestAnimationFrame(function () { setTimeout(function () { try { boot(); } catch (err) { toStatic(); } }, 0); });
})();
