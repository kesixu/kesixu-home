/* Aurelia 鉴赏 v3 ·「月下开片 · 证据之光」动效编排
   一幕一幕：桌面每节满屏，S3/S5/S6 钉住（pin）随滚动播放，滚动停下后轻轻落到最近的一幕；桌面用 Lenis 平滑滚动，手机原生滚动。
   月照（Relight）：月是唯一光源。每件器物用自身 alpha 遮罩推出旋成体的法线近似（横向归一坐标 u 与剖面斜率），
   以 WebGL 实时算月光高光，随月的站点与滚动变化；不支持 WebGL 时退回 CSS 高光带。全部自托管、无第三方请求。
   家规：scroll 是唯一输入；reduced-motion / 无 GSAP / 任何异常 → 静态全亮态（HTML/CSS 默认态）。 */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var isMobile = window.matchMedia("(any-pointer: coarse)").matches || window.matchMedia("(max-width: 899px)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches && !isMobile;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TEARDOWN = ".au-moonwrap,.au-moon,.au-lattice,.au-haze,.au-sky,.au-ember,.au-stage,.au-vessel,.au-shadow,.au-sheen i,.au-intro,.au-rise,.au-redline,.au-outline path,.au-part,.au-step,.au-measure dd,.au-crackle .ck,.au-beams path,.au-spot,.au-stage--nb,.au-space,.au-scroll-hint,.au-s5 .au-text > .au-p,.au-cap";
  var lightTL = null, introTL = null, lenis = null, pins = [], relight = null;

  function toStatic() {
    try { var fl = document.querySelector(".au-flow"); if (fl && fl.pauseAnimations) { fl.pauseAnimations(); fl.setCurrentTime(10.8); } } catch (e) {}
    try {
      doc.classList.remove("motion-pending", "fx");
      if (lenis) { lenis.destroy(); lenis = null; }
      if (relight) relight.dispose();
      if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(function (st) { st.kill(true); });
      if (window.gsap) { gsap.globalTimeline.clear(); gsap.set(TEARDOWN, { clearProps: "all" }); gsap.set(".au-bar__fill", { clearProps: "transform,opacity" }); }
      $$(".au-outline path, .au-beams path").forEach(function (p) { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; });
      $$(".au-box.is-lit").forEach(function (b) { b.classList.remove("is-lit"); });
    } catch (e) { /* 静态态不依赖任何脚本 */ }
    try { drawBeams(false); } catch (e) { /* 无 S6 亦可 */ }
  }

  function drawBeams(animated) {
    var wrap = $(".au-s6 .au-wrap--rel"), svg = $(".au-beams"), q = $(".au-stage--q .au-vessel");
    if (!wrap || !svg || !q) return [];
    var W = wrap.clientWidth, H = wrap.clientHeight, wr = wrap.getBoundingClientRect(), qr = q.getBoundingClientRect();
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var qx = qr.left - wr.left + qr.width / 2, qy = qr.top - wr.top + qr.height * 0.96;
    var paths = $$("path", svg), targets = $$(".au-nb .au-vessel");
    paths.forEach(function (p, i) {
      var t = targets[i]; if (!t) { p.setAttribute("d", ""); return; }
      var r = t.getBoundingClientRect(), nx = r.left - wr.left + r.width / 2, ny = r.top - wr.top + r.height * 0.04, dy = Math.max(40, (ny - qy) * 0.55);
      p.setAttribute("d", "M" + qx.toFixed(1) + "," + qy.toFixed(1) + " C" + qx.toFixed(1) + "," + (qy + dy).toFixed(1) + " " + nx.toFixed(1) + "," + (ny - dy).toFixed(1) + " " + nx.toFixed(1) + "," + ny.toFixed(1));
      if (!animated) { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; }
    });
    return paths;
  }

  if (reducedQuery.matches || !window.gsap || !window.ScrollTrigger) { toStatic(); return; }

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

  /* ════════ 月照：按器物轮廓的旋成体法线做实时高光 ════════ */
  function Relight(profile, moonWrap) {
    var VS = "attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*0.5+0.5,0.5-p.y*0.5);gl_Position=vec4(p,0.,1.);}";
    var FS = "precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec3 L;uniform vec3 C;uniform float G;" +
      "void main(){vec4 s=texture2D(t,v);float a=s.a;if(a<0.02){gl_FragColor=vec4(0.);return;}" +
      "float u=s.r*2.0-1.0;float sl=s.g*2.0-1.0;float nz=sqrt(max(0.0,1.0-u*u));" +
      "vec3 n=normalize(vec3(u,-sl*0.85,nz));vec3 l=normalize(L);vec3 h=normalize(l+vec3(0.,0.,1.));" +
      "float spec=pow(max(dot(n,h),0.0),38.0);float diff=max(dot(n,l),0.0);float rim=pow(1.0-nz,3.0)*max(0.0,dot(vec2(u,0.),normalize(vec2(l.x,1e-3))))*0.9;" +
      "float i=(spec*0.60+diff*0.09+rim*0.18)*G*a;gl_FragColor=vec4(C*i,i);}";
    var stages = [], live = 0, MAXLIVE = 8, color = [0.851, 0.875, 0.863], gain = { v: 0 }, lastKey = "", scrolling = false, dirty = true;
    var forceGL = /[?&]gl=force/.test(location.search); var test = document.createElement("canvas"), ok = !!(test.getContext("webgl", { failIfMajorPerformanceCaveat: !forceGL }) || (forceGL && test.getContext("experimental-webgl")));
    if (!ok) return null;

    function buildTexture(img) {
      var W = img.naturalWidth, H = img.naturalHeight; if (!W || !H) return null;
      var scale = Math.min(1, 512 / Math.max(W, H)), w = Math.max(2, Math.round(W * scale)), h = Math.max(2, Math.round(H * scale));
      var c = document.createElement("canvas"); c.width = w; c.height = h; var ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h); var d = ctx.getImageData(0, 0, w, h), px = d.data;
      var r = new Float32Array(h), cx = new Float32Array(h), has = new Uint8Array(h);
      for (var y = 0; y < h; y++) { var xl = -1, xr = -1, o = y * w * 4; for (var x = 0; x < w; x++) { if (px[o + x * 4 + 3] > 40) { if (xl < 0) xl = x; xr = x; } } if (xl >= 0) { has[y] = 1; cx[y] = (xl + xr) / 2; r[y] = Math.max(1, (xr - xl) / 2); } }
      var sm = new Float32Array(h); for (y = 0; y < h; y++) { var acc = 0, n = 0; for (var k = -3; k <= 3; k++) { var yy = y + k; if (yy >= 0 && yy < h && has[yy]) { acc += r[yy]; n++; } } sm[y] = n ? acc / n : 0; }
      for (y = 0; y < h; y++) {
        o = y * w * 4; if (!has[y]) { for (x = 0; x < w; x++) { px[o + x * 4] = 128; px[o + x * 4 + 1] = 128; } continue; }
        var y0 = Math.max(0, y - 2), y1 = Math.min(h - 1, y + 2), slope = (sm[y1] - sm[y0]) / Math.max(1, (y1 - y0)); slope = Math.max(-1, Math.min(1, slope / 1.2));
        var g = Math.round((slope + 1) * 127.5);
        for (x = 0; x < w; x++) { var u = (x - cx[y]) / r[y]; u = Math.max(-1, Math.min(1, u)); px[o + x * 4] = Math.round((u + 1) * 127.5); px[o + x * 4 + 1] = g; px[o + x * 4 + 2] = 0; }
      }
      ctx.putImageData(d, 0, 0); return c;
    }
    function compile(gl, type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    function initStage(st) {
      if (st.gl || st.failed) return;
      var img = st.img; if (!img.complete || !img.naturalWidth) { st.pending = true; return; }
      try {
        var tex = buildTexture(img); if (!tex) { st.failed = true; return; }
        var cv = document.createElement("canvas"); cv.className = "au-light"; cv.setAttribute("aria-hidden", "true"); st.box.appendChild(cv);
        var gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false }); if (!gl) { st.failed = true; cv.remove(); return; }
        var prog = gl.createProgram(); gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
        var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.BLEND);
        st.gl = gl; st.cv = cv; st.uL = gl.getUniformLocation(prog, "L"); st.uC = gl.getUniformLocation(prog, "C"); st.uG = gl.getUniformLocation(prog, "G");
        gl.uniform3fv(st.uC, color); st.box.classList.add("is-lit"); live++; sizeStage(st); st.pending = false;
        cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); disposeStage(st); }, false);
      } catch (e) { st.failed = true; }
    }
    function sizeStage(st) {
      var r = st.box.getBoundingClientRect(), dpr = profile.effectiveDpr(r.width, r.height) * 0.75;
      var w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
      if (st.cv.width !== w || st.cv.height !== h) { st.cv.width = w; st.cv.height = h; st.gl.viewport(0, 0, w, h); }
    }
    function disposeStage(st) {
      if (!st.gl) return;
      try { var ext = st.gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); } catch (e) { /* ignore */ }
      if (st.cv) st.cv.remove(); st.gl = null; st.cv = null; st.box.classList.remove("is-lit"); live--;
    }
    function render(force) {
      var mr = moonWrap.getBoundingClientRect(), mx = mr.left + mr.width / 2, my = mr.top + mr.height / 2, vw = window.innerWidth, vh = window.innerHeight;
      var key = Math.round(window.scrollY) + ":" + Math.round(mx) + ":" + Math.round(my) + ":" + gain.v.toFixed(2);
      if (!force && key === lastKey && !dirty) return; lastKey = key; dirty = false;
      stages.forEach(function (st) {
        var r = st.box.getBoundingClientRect(); var near = r.bottom > -vh * 0.5 && r.top < vh * 1.5;
        if (!st.gl) { if (near && live < MAXLIVE) initStage(st); if (!st.gl) return; } else if (!near && live > 4 && (r.bottom < -vh * 2 || r.top > vh * 3)) { disposeStage(st); return; }
        if (r.bottom < -40 || r.top > vh + 40) return;   // 不在视口，不画
        sizeStage(st);
        var cxv = r.left + r.width / 2, cyv = r.top + r.height / 2;
        var lx = (mx - cxv) / vw * 1.9, ly = (my - cyv) / vh * 1.4;
        if (st.override) { lx = st.override.x; ly = st.override.y; }
        var g = Math.max(0, gain.v) * (st.gain == null ? 1 : st.gain);
        st.gl.uniform3f(st.uL, lx, ly, 1.0); st.gl.uniform1f(st.uG, g);
        st.gl.clearColor(0, 0, 0, 0); st.gl.clear(st.gl.COLOR_BUFFER_BIT); st.gl.drawArrays(st.gl.TRIANGLE_STRIP, 0, 4);
      });
    }
    $$(".au-stage .au-box").forEach(function (box) {
      var img = $(".au-vessel", box); if (!img) return;
      var st = { box: box, img: img, gl: null, failed: false, pending: false, override: null, gain: null }; stages.push(st);
      img.addEventListener("load", function () { st.pending = false; dirty = true; });
    });
    gsap.ticker.add(function () { render(false); });
    ScrollTrigger.addEventListener("refresh", function () { dirty = true; });
    return { stages: stages, gain: gain, render: render, dirty: function () { dirty = true; }, byStage: function (el) { var b = $(".au-box", el); for (var i = 0; i < stages.length; i++) if (stages[i].box === b) return stages[i]; return null; },
      dispose: function () { stages.forEach(disposeStage); } };
  }

  function boot() {
    var profile = createMotionProfile();
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    var EASE = "power2.out", desktop = window.matchMedia("(min-width: 900px)").matches;

    /* ── 0. 桌面：Lenis 平滑滚动（手机原生）── */
    if (finePointer && window.Lenis) {
      try {
        lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false, autoRaf: false });
        window.__auLenis = lenis;
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } catch (e) { lenis = null; }
    }

    /* ── 1. 初始态（移除 motion-pending 之前同步设置）── */
    var moonWrap = $(".au-moonwrap"), moon = $(".au-moon"), lattice = $(".au-lattice"), haze = $(".au-haze"), ember = $(".au-ember");
    var heroStage = $(".au-stage--hero"), heroSheen = $(".au-stage--hero .au-sheen i"), heroShadow = $(".au-stage--hero .au-shadow");
    var introText = $$(".au-hero__text .au-intro"), hint = $(".au-scroll-hint");
    gsap.set(moon, { yPercent: 12, opacity: 0 }); gsap.set(lattice, { opacity: 0 }); if (haze) gsap.set(haze, { opacity: 0 });
    gsap.set(heroStage, { opacity: .35, scale: .985, transformOrigin: "50% 100%" }); gsap.set(heroShadow, { opacity: 0 }); gsap.set(heroSheen, { xPercent: -60 });
    gsap.set(introText, { opacity: 0, y: 14 }); gsap.set(hint, { opacity: 0 }); gsap.set(".au-rise", { opacity: 0, y: 14 }); gsap.set(".au-bar__fill", { scaleX: 0 }); gsap.set(".au-redline", { scaleX: 0 });
    doc.classList.add("fx"); doc.classList.remove("motion-pending");
    relight = Relight(profile, moonWrap); if (relight) doc.classList.add("webgl");

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
      .add(function () { doc.classList.add("intro-done"); if (!relight) gsap.fromTo(heroSheen, { xPercent: 35 }, { xPercent: -25, ease: "none", scrollTrigger: { trigger: "#s1", start: "top top", end: "bottom top", scrub: .6 } }); }, 2.4);
    if (relight) introTL.to(relight.gain, { v: 1, duration: 1.8, ease: "sine.out" }, .3);
    if (window.scrollY > window.innerHeight * .5 || location.hash) introTL.progress(1); else introTL.play();

    /* ── 3. 一幕一幕：桌面钉住 S3/S5/S6（手机顺流，S5/S6 由 CSS sticky）── */
    function pinOpts(id, extra) { return desktop ? { trigger: id, start: "top top", end: "+=" + extra, pin: true, anticipatePin: 1, scrub: .6 } : null; }

    /* ── 4. 光的站点表（唯一写入口）── */
    function buildLight() {
      if (lightTL) { if (lightTL.scrollTrigger) lightTL.scrollTrigger.kill(); lightTL.kill(); lightTL = null; }
      var vw = window.innerWidth / 100, vh = window.innerHeight / 100, D = window.matchMedia("(min-width: 900px)").matches;
      var top = function (sel) { var el = $(sel); return el ? el.getBoundingClientRect().top + window.scrollY : 0; };
      var H = Math.max(1, doc.scrollHeight - window.innerHeight);
      var base = D ? [84, 18] : [104, -3];
      var S = D ? { a: [84, 18], b: [84, 6], s5: [50, 8], s6: [50, 8], s7: [50, 30], s8: [50, 14], end: [50, 130] }
                : { a: [104, -3], b: [104, -15], s5: [96, -2], s6: [96, -2], s7: [96, -8], s8: [96, -8], end: [124, -8] };
      var t5 = top("#s5"), e5 = t5 + (D ? 1.4 * 100 * vh : 0), t6 = top("#s6");
      var K = [
        [0, S.a[0], S.a[1], 1, 1, 1], [60 * vh, S.b[0], S.b[1], 1, 1, 1],
        [top("#s2"), S.b[0], S.b[1], .85, .9, .9], [top("#s3"), S.b[0], S.b[1], .55, .4, .55], [top("#s4"), S.b[0], S.b[1], .5, .25, .5],
        [t5, S.s5[0], S.s5[1], 1, .25, .85], [e5, S.s5[0], S.s5[1], 1, .25, .85], [t6, S.s6[0], S.s6[1], .6, .2, .55],
        [top("#s7") - 50 * vh, S.s6[0], S.s6[1], .6, .2, .55], [top("#s7"), S.s7[0], S.s7[1], .15, .08, .15],
        [top("#s8") - 30 * vh, S.s7[0], S.s7[1], .15, .08, .15], [top("#s8"), S.s8[0], S.s8[1], .4, .18, .4],
        [top("#s9"), S.s8[0], S.s8[1], .4, .18, .35], [H, S.end[0], S.end[1], 0, .12, .25]
      ];
      for (var i = 1; i < K.length; i++) if (K[i][0] <= K[i - 1][0]) K[i][0] = K[i - 1][0] + 1;
      lightTL = gsap.timeline({ scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: .8 } });
      for (i = 1; i < K.length; i++) {
        var a = K[i - 1], b = K[i], d = b[0] - a[0];
        lightTL.to(moonWrap, { x: (b[1] - base[0]) * vw, y: (b[2] - base[1]) * vh, opacity: b[3], duration: d, ease: "none" }, a[0]);
        lightTL.to(lattice, { opacity: .15 * b[4], duration: d, ease: "none" }, a[0]);
        if (haze) lightTL.to(haze, { opacity: .13 * b[5], duration: d, ease: "none" }, a[0]);
      }
      if (relight) relight.dirty();
    }
    gsap.to(hint, { opacity: 0, ease: "none", scrollTrigger: { trigger: "#s1", start: "top top", end: "+=40%", scrub: true } });
    gsap.fromTo(ember, { opacity: 0 }, { opacity: .7, ease: "none", scrollTrigger: { trigger: "#s9", start: "top 60%", end: "bottom bottom", scrub: .8 } });

    /* ── 5. 逐屏揭示 ── */
    ScrollTrigger.batch(".au-rise", { start: "top 88%", once: true, onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .9, stagger: Math.min(.08, .9 / els.length), ease: EASE, overwrite: true }); } });

    /* ── 6. 高光带（无 WebGL 时）与接触阴影联动 ── */
    function coupleShadow(stage, trig) {
      var shadow = $(".au-shadow", stage); if (!shadow) return;
      gsap.fromTo(shadow, { scaleX: .92, opacity: .55 }, { keyframes: [{ scaleX: 1.04, opacity: 1, ease: "sine.out" }, { scaleX: .94, opacity: .6, ease: "sine.in" }], scrollTrigger: trig });   /* 影只随光变实变虚，不横移（否则与器物错位）*/
    }
    $$(".au-stage").forEach(function (st) {
      if (st.classList.contains("au-stage--hero") || st.classList.contains("au-stage--arc") || st.classList.contains("au-stage--ev")) return;
      var band = $(".au-sheen i", st), trig = { trigger: st, start: "top 95%", end: "bottom 5%", scrub: .6 };
      if (band && !relight) gsap.fromTo(band, { xPercent: -60 }, { xPercent: 60, ease: "none", scrollTrigger: trig });
      coupleShadow(st, trig);
    });
    /* S3 七件：一条时间线（桌面钉住 120vh），月光依次扫过；未照到的件只有 .62 的亮度 */
    var arcStages = $$(".au-stage--arc");
    if (arcStages.length) {
      var arcTL = gsap.timeline({ scrollTrigger: pinOpts("#s3", "55%") || { trigger: ".au-arc", start: "top 85%", end: "bottom 15%", scrub: .6 } });
      if (desktop && arcTL.scrollTrigger && arcTL.scrollTrigger.pin) pins.push(arcTL.scrollTrigger);
      arcStages.forEach(function (st, i) {
        var band = $(".au-sheen i", st), img = $(".au-vessel", st), cap = $(".au-cap", st), t0 = i * .55, rs = relight && relight.byStage(st);
        gsap.set(img, { opacity: .62 }); gsap.set(cap, { opacity: 0, y: 6 });
        if (rs) { rs.gain = 0; arcTL.to(rs, { gain: 1, duration: .5, ease: "none" }, t0 + .1); }
        else if (band) arcTL.fromTo(band, { xPercent: -60 }, { xPercent: 60, duration: 1, ease: "none" }, t0);
        arcTL.to(img, { opacity: 1, duration: .4, ease: "none" }, t0 + .2).to(cap, { opacity: 1, y: 0, duration: .3, ease: "none" }, t0 + .35);
      });
      arcTL.to({}, { duration: .6 });
    }

    /* ── 7. 风格空间（S3 画布）── */
    var space = $(".au-space");
    if (space && !profile.saveData && !(profile.name === "eco" && isMobile)) {
      var drawn = false, pts = null;
      var drawSpace = function () {
        if (!pts) return;
        var sec = space.parentElement, W = sec.clientWidth, H = sec.clientHeight, dpr = profile.effectiveDpr(W, H);
        space.width = Math.round(W * dpr); space.height = Math.round(H * dpr);
        var off = document.createElement("canvas"); off.width = space.width; off.height = space.height; var oc = off.getContext("2d"); oc.setTransform(dpr, 0, 0, dpr, 0, 0);
        var S = Math.min(W, H) * (desktop ? 1.15 : 1.25), ox = (W - S) / 2, oy = (H - S) / 2;
        var col = ["rgba(143,150,143,.30)", "rgba(178,74,60,.7)", "rgba(157,187,176,.62)", "rgba(157,187,176,.62)", "rgba(217,223,220,.5)", "rgba(143,150,143,.5)", "rgba(143,150,143,.30)"];
        var r = desktop ? 1.3 : 1.1, n = pts.length / 3;
        for (var i = 0; i < n; i++) { var x = ox + pts[i * 3] / 65535 * S, y = oy + pts[i * 3 + 1] / 65535 * S, d = pts[i * 3 + 2]; if (x < -2 || y < -2 || x > W + 2 || y > H + 2) continue; oc.fillStyle = col[d] || col[0]; oc.fillRect(x, y, r, r); }
        var ctx = space.getContext("2d"); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, space.width, space.height);
        try { ctx.filter = "blur(" + (2.2 * dpr) + "px)"; } catch (e) { /* 老内核 */ }
        ctx.drawImage(off, 0, 0); try { ctx.filter = "none"; } catch (e) { /* ignore */ }
        drawn = true;
      };
      var loadSpace = function () {
        fetch("data/projection.bin").then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
          var dv = new DataView(buf); if (dv.getUint8(0) !== 65 || dv.getUint8(1) !== 85) return;
          var n = dv.getUint32(4, true), out = new Float32Array(n * 3), o = 8;
          for (var i = 0; i < n; i++, o += 5) { out[i * 3] = dv.getUint16(o, true); out[i * 3 + 1] = dv.getUint16(o + 2, true); out[i * 3 + 2] = dv.getUint8(o + 4); }
          pts = out; (window.requestIdleCallback || function (f) { setTimeout(f, 0); })(function () {
            drawSpace();
            gsap.fromTo(space, { opacity: 0 }, { opacity: desktop ? .24 : .17, ease: "none", scrollTrigger: { trigger: "#s3", start: "top 80%", end: "top 20%", scrub: .5 } });
            if (profile.name !== "eco") gsap.fromTo(space, { yPercent: 6 }, { yPercent: -6, ease: "none", scrollTrigger: { trigger: "#s3", start: "top bottom", end: "bottom top", scrub: 1 } });
          });
        }).catch(function () { /* 静态页不依赖星点 */ });
      };
      gsap.set(space, { opacity: 0 });
      if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); loadSpace(); } }, { rootMargin: "150% 0px" }); io.observe(space); } else loadSpace();
      ScrollTrigger.addEventListener("refresh", function () { if (drawn) drawSpace(); });
    }

    /* ── 8. S4 条形 ── */
    $$(".au-bargroup, .au-routes").forEach(function (g) {
      var fills = $$(".au-bar__fill", g);
      ScrollTrigger.create({ trigger: g, start: "top 85%", once: true, onEnter: function () { fills.forEach(function (f, i) { var w = parseFloat(getComputedStyle(f).getPropertyValue("--w")) || 1; gsap.to(f, { scaleX: w, duration: 1.1, delay: i * .1, ease: "power3.out" }); }); } });
    });

    /* ── 9. S5 开片 · 证据（桌面钉住 140vh）── */
    var ev = $("#s5");
    if (ev) {
      var outline = $(".au-outline path", ev), parts = [$(".au-part--rim", ev), $(".au-part--body", ev), $(".au-part--foot", ev)];
      var steps = $$(".au-step", ev), dds = $$(".au-measure dd", ev), cks = $$(".au-crackle .ck", ev), vband = $(".au-sheen--v i", ev), dband = $(".au-stage--ev .au-sheen:not(.au-sheen--v) i", ev);
      var evP = $(".au-s5 .au-text > .au-p", ev), evStage = relight && relight.byStage($(".au-stage--ev", ev));
      gsap.set(outline, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(parts, { opacity: 0, y: 6 }); gsap.set(steps, { opacity: 0, y: 10 }); gsap.set(dds, { opacity: 0, y: 8 }); gsap.set(cks, { opacity: 0 });
      if (dband) gsap.set(dband, { xPercent: 35 }); if (evP) gsap.set(evP, { opacity: 0, y: 10 });
      var scan = { y: -1.6 };
      var evTL = gsap.timeline({ scrollTrigger: pinOpts("#s5", "75%") || { trigger: ev, start: "top 65%", end: "bottom 85%", scrub: .6 } });
      if (desktop && evTL.scrollTrigger && evTL.scrollTrigger.pin) pins.push(evTL.scrollTrigger);
      evTL.to(outline, { strokeDashoffset: 0, duration: 2.2, ease: "none" }, 0)
          .to(steps[0], { opacity: 1, y: 0, duration: 1 }, .4);
      if (evStage) { /* 光自口沿而下：月照的入射方向从上扫到下 */
        evTL.add(function () { evStage.override = { x: 0.15, y: scan.y }; }, 2.2)
            .to(scan, { y: 1.6, duration: 3, ease: "none", onUpdate: function () { if (evStage.override) { evStage.override.y = scan.y; relight.dirty(); } } }, 2.2)
            .add(function () { evStage.override = null; relight.dirty(); }, 5.4);
      } else if (vband) evTL.fromTo(vband, { yPercent: -45 }, { yPercent: 55, duration: 3, ease: "none" }, 2.2);
      evTL.to(parts[0], { opacity: 1, y: 0, duration: .5 }, 2.5).to(parts[1], { opacity: 1, y: 0, duration: .5 }, 3.4).to(parts[2], { opacity: 1, y: 0, duration: .5 }, 4.3)
          .to(steps[1], { opacity: 1, y: 0, duration: 1 }, 2.8).to(steps[2], { opacity: 1, y: 0, duration: 1 }, 5)
          .to(dds, { opacity: 1, y: 0, duration: .8, stagger: .35 }, 5.4).to(cks, { opacity: 1, duration: .9, stagger: .45 }, 4.2)
          .to(evP, { opacity: 1, y: 0, duration: 1 }, 7.2).to({}, { duration: .8 });
    }

    /* ── 10. S6 一束分五束（桌面钉住 100vh）── */
    var nbs = $(".au-nbs");
    if (nbs) {
      var spots = $$(".au-spot"), nbStages = $$(".au-stage--nb"), beams = drawBeams(true);
      gsap.set(beams, { strokeDasharray: 1, strokeDashoffset: 1 }); gsap.set(spots, { opacity: 0 }); gsap.set(nbStages, { opacity: .16, y: 10 });
      var beamTL = gsap.timeline({ scrollTrigger: pinOpts("#s6", "45%") || { trigger: nbs, start: "top 90%", end: "top 25%", scrub: .5 } });
      if (desktop && beamTL.scrollTrigger && beamTL.scrollTrigger.pin) pins.push(beamTL.scrollTrigger);
      beams.forEach(function (b, i) { beamTL.to(b, { strokeDashoffset: 0, duration: 1, ease: "none" }, .3 + i * .25); });
      spots.forEach(function (s, i) { beamTL.to(s, { opacity: 1, duration: .6 }, .9 + i * .25); });
      nbStages.forEach(function (s, i) { beamTL.to(s, { opacity: 1, y: 0, duration: .7, ease: EASE }, .9 + i * .25); });
      beamTL.to({}, { duration: .5 });
      ScrollTrigger.addEventListener("refresh", function () { drawBeams(true); });
    }

    /* ── 11. 红线 ── */
    var red = $(".au-redline");
    if (red) ScrollTrigger.create({ trigger: red, start: "top 85%", once: true, onEnter: function () { gsap.to(red, { scaleX: 1, duration: 1.4, ease: "power2.inOut" }); } });

    /* ── 12. 该停则停：滚动停下后落到最近的一幕（钉住段内不干预）── */
    var scenes = $$(".au-s"), snapping = false;
    function snapToScene() {
      if (snapping) return;
      var y = window.scrollY, vh = window.innerHeight, maxY = doc.scrollHeight - vh;
      if (y > maxY - 8) return;
      for (var i = 0; i < pins.length; i++) if (y > pins[i].start + 6 && y < pins[i].end - 6) return;
      var best = null;
      scenes.forEach(function (s) { var t = Math.round(s.getBoundingClientRect().top + y), d = Math.abs(t - y); if (d < vh * (desktop ? .5 : .3) && (!best || d < best.d)) best = { d: d, top: t }; });
      if (!best || best.d < 2) return;
      snapping = true;
      if (lenis) lenis.scrollTo(best.top, { duration: Math.min(1.1, .5 + best.d / vh * .7), easing: function (t) { return 1 - Math.pow(1 - t, 4); }, lock: false, onComplete: function () { snapping = false; } });
      else { var o = { y: y }; gsap.to(o, { y: best.top, duration: .55, ease: "power2.out", onUpdate: function () { window.scrollTo(0, o.y); }, onComplete: function () { snapping = false; } }); }
      setTimeout(function () { snapping = false; }, 1400);
    }
    /* 自动归位已停用：用户自由滚动，动画只在钉住段内轻微跟随 */

    /* ── 13. 建站点表；字体就绪与真正的 resize 时重建 ── */
    buildLight();
    var lastW = window.innerWidth, lastH = window.innerHeight, rt = 0;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { var w = window.innerWidth, h = window.innerHeight; if (w === lastW && Math.abs(h - lastH) < 140) return; lastW = w; lastH = h; ScrollTrigger.refresh(); buildLight(); }, 280); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); buildLight(); });
    window.addEventListener("load", function () { ScrollTrigger.refresh(); buildLight(); });

    /* ── 14. 中途切 reduced-motion → 静态；帧率持续偏低 → 降档 ── */
    var onReduced = function (e) { if (e.matches) toStatic(); };
    if (reducedQuery.addEventListener) reducedQuery.addEventListener("change", onReduced); else if (reducedQuery.addListener) reducedQuery.addListener(onReduced);
    var slow = 0, last = 0;
    gsap.ticker.add(function (t) { var dt = last ? (t - last) * 1000 : 16; last = t; if (dt > 40) { if (++slow > 45) { slow = 0; if (profile.degrade() && profile.name === "eco" && haze) haze.style.display = "none"; } } else if (slow > 0) slow--; });
  }

  requestAnimationFrame(function () { setTimeout(function () { try { boot(); } catch (err) { toStatic(); } }, 0); });
})();

/* ── 卷目导航与阅读进度（独立于动效档位，无 JS 时 <details> 与锚点照常可用） ── */
(function () {
  var toc = document.getElementById("toc"); if (!toc) return;
  var rail = document.querySelector(".au-rail i"), reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var links = [].slice.call(toc.querySelectorAll('a[href^="#"]'));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  function go(sel) {
    var el = document.querySelector(sel); if (!el) return; toc.removeAttribute("open");
    var L = window.__auLenis;
    if (L && L.scrollTo && !reduced) L.scrollTo(el, { offset: 0, duration: 1.1, easing: function (t) { return 1 - Math.pow(1 - t, 3); } });
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }
  links.forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); go(a.getAttribute("href")); try { history.replaceState(null, "", a.getAttribute("href")); } catch (err) {} }); });
  toc.addEventListener("click", function (e) { if (e.target === toc) toc.removeAttribute("open"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") toc.removeAttribute("open"); });
  var ticking = false;
  function update() {
    ticking = false;
    var H = document.documentElement.scrollHeight - window.innerHeight, p = H > 0 ? window.scrollY / H : 0;
    if (rail) rail.style.top = (Math.max(0, Math.min(1, p)) * 100).toFixed(2) + "%";
    var y = window.scrollY + window.innerHeight * 0.38, cur = 0;
    for (var i = 0; i < secs.length; i++) { if (secs[i] && secs[i].getBoundingClientRect().top + window.scrollY <= y) cur = i; }
    links.forEach(function (a, i) { a.parentNode.classList.toggle("is-cur", i === cur); });
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", update); update();
})();
