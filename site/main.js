/* 《划亮》main.js — 编排：火柴(canvas) → 引信(SVG) → 九盏灯 → 燎原成星 → 余烬
   纪律：只动 transform/opacity；canvas 离屏即停；reduced-motion 全静态。 */
(function () {
  "use strict";

  /* ---------- 邮箱拼装（永远执行，无 JS 时页面显示 [at] 版本） ---------- */
  var mail = document.getElementById("mailLink");
  if (mail) {
    var addr = mail.getAttribute("data-u") + "@" + mail.getAttribute("data-d");
    mail.href = "mailto:" + addr;
    mail.querySelector("span").textContent = addr;
  }

  /* ---------- 星空底噪（装饰，静态） ---------- */
  var field = document.getElementById("skyField");
  if (field) {
    var NS = "http://www.w3.org/2000/svg";
    var fieldFragment = document.createDocumentFragment();
    for (var i = 0; i < 46; i++) {
      // 伪随机但可复现：黄金角散布
      var a = i * 2.399963, r0 = 16 + (i * 97 % 100) * 4.7;
      var cx = 180 + Math.cos(a) * r0 * 0.95;
      var cy = 250 + Math.sin(a) * r0;
      if (cx < 8 || cx > 352 || cy < 8 || cy > 512) continue;
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", cx.toFixed(1));
      c.setAttribute("cy", cy.toFixed(1));
      c.setAttribute("r", (0.5 + (i * 37 % 10) / 12).toFixed(2));
      c.setAttribute("opacity", (0.12 + (i * 53 % 10) / 45).toFixed(3));
      fieldFragment.appendChild(c);
    }
    field.appendChild(fieldFragment);
  }

  var reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function bootMotion() {
  document.documentElement.classList.remove("motion-pending");
  if (reducedQuery.matches || !window.gsap || !window.ScrollTrigger) {
    // 基线：静态点亮态（与中途切 reduced 的终态保持一致）
    document.querySelectorAll("[data-ignite]").forEach(function (el) { el.classList.add("lit"); });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true }); // 地址栏伸缩不触发 refresh

  var flame = null;
  var fuseSpark = null;
  var wildfire = null;

  /* 拆掉全部演出、剥净内联样式，回到静态点亮态。
     用于：中途切 reduced-motion、初始化任何异常（渐进增强的执行点）。 */
  function teardownToStatic() {
    try {
      ScrollTrigger.getAll().forEach(function (st) { st.kill(true); }); // revert=true 剥内联样式
      gsap.globalTimeline.clear();
      gsap.set("#heroName, #whisper, #scrollHint, .hero-name h1, .hero-name h1 span, .hero-name .latin, " +
        ".hero-name .tagline, .hero-name .echo, #about .line, #about .echo, #lamps h2, " +
        ".chapter-sub, .rest-label, .hero-lamp, .rest-lamps li, .sky-line, #sky .echo, #dipperStars .star, #dipperLines line, " +
        "#skyField circle, #wildfire, #ember > *, #fuseHead", { clearProps: "all" });
    } catch (e) { /* 清理路径自身绝不允许再抛 */ }
    // 这些是绕开 gsap 手设的内联样式，clearProps 管不到
    document.querySelectorAll("#dipperLines line, #fuseLit").forEach(function (el) {
      el.style.strokeDasharray = "";
      el.style.strokeDashoffset = "";
    });
    document.documentElement.classList.remove("fx");
    document.documentElement.classList.remove("fuse-ready");
    document.documentElement.classList.remove("match-lit");
    document.documentElement.classList.remove("story-entered");
    document.documentElement.classList.remove("motion-pending");
    if (flame) flame.setActive(false);
    if (fuseSpark) fuseSpark.setActive(false);
    if (wildfire) wildfire.setActive(false);
    document.querySelectorAll("[data-ignite]").forEach(function (el) { el.classList.add("lit"); });
  }

  /* 中途切到"减少动态"（老 WebKit 无 EventTarget 接口，走 addListener 兜底） */
  function onReducedChange(e) { if (e.matches) teardownToStatic(); }
  if (reducedQuery.addEventListener) reducedQuery.addEventListener("change", onReducedChange);
  else if (reducedQuery.addListener) reducedQuery.addListener(onReducedChange);

  try { // ---- 动效初始化整体受保护：任何异常 → teardownToStatic() 静态可读 ----
  document.documentElement.classList.add("fx");

  /* ============================================================
     火柴与火焰（canvas 2D）
     ============================================================ */
  // 横屏手机宽度常超过 768px，不能只用宽度判断，否则会误走桌面画质路径。
  var isMobile = window.matchMedia("(any-pointer: coarse)").matches ||
    window.matchMedia("(max-width: 768px)").matches;

  /* 一套画质预算统领三块 canvas。它只在本地做判断，不记录、不上传设备信息。
     maxPixels 是全屏画布的物理像素上限，比单纯限制 DPR 更能覆盖折叠屏与长屏。 */
  function createMotionProfile() {
    var tiers = {
      high: {
        name: "high", fps: 60, maxPixels: 1600000, dpr: 2.25,
        wildfireParticles: 96, flameLanes: 21, fireSamples: 34,
        matchParticles: 128, matchRate: 104, sparkParticles: 34, sparkBurst: 4
      },
      balanced: {
        name: "balanced", fps: 45, maxPixels: 720000, dpr: 1.85,
        wildfireParticles: 68, flameLanes: 16, fireSamples: 27,
        matchParticles: 78, matchRate: 66, sparkParticles: 24, sparkBurst: 2
      },
      eco: {
        name: "eco", fps: 30, maxPixels: 420000, dpr: 1.5,
        wildfireParticles: 42, flameLanes: 11, fireSamples: 20,
        matchParticles: 48, matchRate: 43, sparkParticles: 16, sparkBurst: 1
      }
    };
    var queryTier = "";
    try { queryTier = new URLSearchParams(location.search).get("motion") || ""; } catch (e) { /* 老内核 */ }
    var forced = Object.prototype.hasOwnProperty.call(tiers, queryTier);
    var cores = navigator.hardwareConcurrency || 6;
    var memory = navigator.deviceMemory || 0;
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = !!(connection && connection.saveData);
    var name;
    if (forced) name = queryTier;
    else if (saveData || cores <= 4 || (memory && memory <= 4)) name = "eco";
    else if (!isMobile || (cores >= 8 && memory >= 8)) name = "high";
    else name = "balanced";

    var profile = {};
    function expose() {
      document.documentElement.dataset.motionTier = profile.name;
      document.documentElement.dataset.motionFps = String(profile.fps);
      document.documentElement.dataset.motionPixels = String(profile.maxPixels);
    }
    function apply(next) {
      var source = tiers[next];
      Object.keys(source).forEach(function (key) { profile[key] = source[key]; });
      expose();
    }
    profile.forced = forced;
    profile.effectiveDpr = function (width, height) {
      var area = Math.max(1, width * height);
      return Math.min(window.devicePixelRatio || 1, profile.dpr, Math.sqrt(profile.maxPixels / area));
    };
    profile.degrade = function () {
      if (forced || profile.name === "eco") return false;
      apply(profile.name === "high" ? "balanced" : "eco");
      document.documentElement.dataset.motionDegraded = "true";
      return true;
    };
    apply(name);
    return profile;
  }

  var motionProfile = createMotionProfile();

  function FlameScene(canvas) {
    var ctx = canvas.getContext("2d");
    var dpr = 1, W = 0, H = 0;
    var phase = 0, active = false, raf = 0, last = 0;
    var parts = [], sparks = [];
    var MAXP = motionProfile.matchParticles;
    var frameInterval = 1000 / motionProfile.fps;
    var lastPaint = 0;
    var nameEdge = 0; // 名字右缘（px），驻位锚定用；0 = 未测量

    // 预渲染光斑 sprite：金 / 琥珀 / 橙 / 烬红
    var tints = ["255,222,160", "255,169,77", "255,107,53", "179,58,30"];
    var sprites = tints.map(function (t) {
      var s = document.createElement("canvas"); s.width = s.height = 64;
      var g = s.getContext("2d");
      var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(" + t + ",1)");
      grad.addColorStop(0.35, "rgba(" + t + ",.55)");
      grad.addColorStop(1, "rgba(" + t + ",0)");
      g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
      return s;
    });

    function resize() {
      // 现代手机普遍是 3x 屏。旧版上限 2x 会被浏览器再放大 1.5 倍，
      // 细长的火柴边缘因此发虚、看起来像“弯了”。粒子数量另行限流。
      W = Math.max(1, Math.round(canvas.clientWidth));
      H = Math.max(1, Math.round(canvas.clientHeight));
      dpr = motionProfile.effectiveDpr(W, H);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
    function smooth(v) { return v * v * (3 - 2 * v); }

    /* 火柴头位置/角度/火焰强度，全部是 phase 的纯函数（resize 免疫） */
    function matchState(p, t) {
      var mx, my, ang, inten = 0;
      var eIn = seg(p, 0, 0.15);          // 入场
      var eSt = seg(p, 0.15, 0.27);       // 划擦
      var eUp = seg(p, 0.27, 0.42);       // 起火，移向驻位
      var eOff = seg(p, 0.86, 1);         // 交棒退场
      if (p < 0.15) {
        mx = lerp(W * 0.92, W * 0.66, smooth(eIn));
        my = lerp(H * 1.08, H * 0.64, smooth(eIn));
        ang = lerp(-0.9, -0.55, eIn);
      } else if (p < 0.27) {
        mx = lerp(W * 0.66, W * 0.34, smooth(eSt));
        my = lerp(H * 0.64, H * 0.58, smooth(eSt));
        ang = lerp(-0.55, -0.35, eSt);
        inten = eSt * 0.25;
      } else {
        // 驻位在名字右侧：像举着火柴照亮名字。宽屏时收拢到名字右缘附近，
        // 手机上 min() 仍取 0.72W（名字右缘 + 间距 ≈ 0.72W），行为不变
        var restX = Math.min(W * 0.72,
          (nameEdge > 0 ? nameEdge : W * 0.72) + Math.min(W * 0.08, 96));
        mx = lerp(W * 0.34, restX, smooth(eUp));
        my = lerp(H * 0.58, H * 0.56, smooth(eUp));
        ang = lerp(-0.35, -1.45, smooth(eUp));
        inten = lerp(0.25, 1, smooth(eUp));
        mx += Math.sin(t / 900) * 3 * eUp;
      }
      if (eOff > 0) {
        mx = lerp(mx, W * 0.12, smooth(eOff));
        my = lerp(my, H * 1.02, smooth(eOff));
        inten *= (1 - eOff * 0.75);
      }
      return { mx: mx, my: my, ang: ang, inten: inten };
    }

    function spawn(st, dt, t) {
      // 火焰粒子
      var rate = st.inten * motionProfile.matchRate;
      var n = rate * dt;
      if (Math.random() < n % 1) n++;
      for (var i = 0; i < Math.floor(n) && parts.length < MAXP; i++) {
        parts.push({
          x: st.mx + (Math.random() - 0.5) * 7,
          y: st.my + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 14,
          vy: -(34 + Math.random() * 62) * (0.5 + st.inten * 0.7),
          life: 0, ttl: 0.55 + Math.random() * 0.55,
          size: (7 + Math.random() * 11) * (0.6 + st.inten * 0.5),
          drift: Math.random() * 6.28
        });
      }
      // 划擦火花
      var p = phase;
      if (p > 0.16 && p < 0.3) {
        for (var j = 0; j < motionProfile.sparkBurst; j++) {
          if (sparks.length > 60) break;
          sparks.push({
            x: st.mx, y: st.my,
            vx: (Math.random() - 0.2) * 260,
            vy: -Math.random() * 190,
            life: 0, ttl: 0.25 + Math.random() * 0.3,
            size: 1.5 + Math.random() * 2.5
          });
        }
      }
    }

    function step(dt, t) {
      var i, q;
      for (i = parts.length - 1; i >= 0; i--) {
        q = parts[i]; q.life += dt;
        if (q.life > q.ttl) { parts.splice(i, 1); continue; }
        q.x += (q.vx + Math.sin(t / 260 + q.drift) * 9) * dt;
        q.y += q.vy * dt;
        q.vy -= 26 * dt; // 热浮力，越升越快一点
      }
      for (i = sparks.length - 1; i >= 0; i--) {
        q = sparks[i]; q.life += dt;
        if (q.life > q.ttl) { sparks.splice(i, 1); continue; }
        q.vy += 620 * dt; // 重力
        q.x += q.vx * dt; q.y += q.vy * dt;
      }
    }

    // 擦火磷纸：只在“划”的瞬间显现，让动作在小屏上也一眼可读。
    function drawStriker(p) {
      var alpha = smooth(seg(p, 0.06, 0.13)) * (1 - smooth(seg(p, 0.29, 0.38)));
      if (alpha < 0.002) return;
      var ax = W * 0.70, ay = H * 0.648;
      var bx = W * 0.30, by = H * 0.572;
      var vx = bx - ax, vy = by - ay;
      var vl = Math.hypot(vx, vy) || 1;
      var nx = -vy / vl, ny = vx / vl;
      var grit = ctx.createLinearGradient(ax, ay, bx, by);
      grit.addColorStop(0, "rgba(82,54,35,0)");
      grit.addColorStop(0.18, "rgba(116,73,43,.72)");
      grit.addColorStop(0.76, "rgba(145,84,45,.58)");
      grit.addColorStop(1, "rgba(82,54,35,0)");

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(34,23,17,.95)";
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.strokeStyle = grit;
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();

      // 规则种子制造不等距砂砾，避免排成“尺子”，同时不逐帧闪烁。
      ctx.fillStyle = "rgba(255,177,94,.52)";
      for (var gi = 0; gi < 34; gi++) {
        var gt = ((gi * 37) % 101) / 100;
        var jitter = Math.sin(gi * 12.9898) * 3.7;
        var gx = ax + vx * gt + nx * jitter;
        var gy = ay + vy * gt + ny * jitter;
        var gr = 0.45 + (gi * 7 % 6) * 0.13;
        ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }

    // 分层绘制木梗、焦痕与椭圆火柴头；比单根圆线更接近真实比例。
    function drawMatch(st) {
      var len = Math.max(76, Math.min(112, Math.min(W, H) * 0.21));
      var dx = Math.cos(st.ang), dy = Math.sin(st.ang);
      var nx = -dy, ny = dx;
      var hx = st.mx, hy = st.my;
      var tx = hx - dx * len, ty = hy - dy * len;

      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(20,13,9,.96)";
      ctx.lineWidth = 5.6;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();

      var wood = ctx.createLinearGradient(tx, ty, hx, hy);
      wood.addColorStop(0, "#3a2517");
      wood.addColorStop(0.36, "#a76a36");
      wood.addColorStop(0.78, "#75401f");
      wood.addColorStop(1, "#23130e");
      ctx.strokeStyle = wood;
      ctx.lineWidth = 3.1;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();

      // 木纤维高光让 3x 屏上的火柴仍有实体感。
      ctx.strokeStyle = "rgba(255,199,126,.32)";
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(tx + nx * 0.8, ty + ny * 0.8);
      ctx.lineTo(hx - dx * 20 + nx * 0.8, hy - dy * 20 + ny * 0.8);
      ctx.stroke();

      // 靠近火柴头的焦黑段。
      ctx.strokeStyle = st.inten > 0.08 ? "rgba(38,19,13,.96)" : "rgba(76,39,24,.94)";
      ctx.lineWidth = 4.1;
      ctx.beginPath();
      ctx.moveTo(hx - dx * 18, hy - dy * 18);
      ctx.lineTo(hx - dx * 3, hy - dy * 3);
      ctx.stroke();

      ctx.translate(hx, hy);
      ctx.rotate(st.ang);
      ctx.fillStyle = "#24120f";
      ctx.beginPath(); ctx.ellipse(1.2, 0, 6.7, 5.0, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = st.inten > 0.05 ? "#9d4728" : "#603024";
      ctx.beginPath(); ctx.ellipse(1.5, 0, 5.2, 3.7, 0, 0, 6.2832); ctx.fill();
      if (st.inten > 0.05) {
        ctx.globalAlpha = Math.min(0.85, 0.28 + st.inten * 0.56);
        ctx.fillStyle = "#e28744";
        ctx.beginPath(); ctx.ellipse(2.4, -0.5, 2.4, 1.55, 0, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }

    function draw(st, t) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      drawStriker(phase);
      drawMatch(st);

      var hx = st.mx, hy = st.my;

      // 发光层（多周期正弦叠出近似噪声的呼吸，比单一正弦更像真火）
      ctx.globalCompositeOperation = "lighter";
      var flick = 0.5 + 0.28 * Math.sin(t / 61) * Math.sin(t / 137) + 0.22 * Math.sin(t / 43);
      if (st.inten > 0.01) {
        var R = Math.min(W, H) * (0.16 + 0.42 * st.inten) * (0.97 + flick * 0.06);
        var g = ctx.createRadialGradient(hx, hy - 8, 0, hx, hy - 8, R);
        g.addColorStop(0, "rgba(255,190,110," + (0.30 * st.inten) + ")");
        g.addColorStop(0.5, "rgba(255,120,50," + (0.10 * st.inten) + ")");
        g.addColorStop(1, "rgba(255,90,40,0)");
        ctx.fillStyle = g;
        ctx.fillRect(hx - R, hy - 8 - R, R * 2, R * 2);
        // 白热内核：贴着火柴头的小亮核，随 flick 跳动
        var cs = (16 + flick * 9) * (0.5 + st.inten * 0.6);
        ctx.globalAlpha = st.inten * (0.55 + flick * 0.4);
        ctx.drawImage(sprites[0], hx - cs / 2, hy - 10 - cs / 2, cs, cs);
        ctx.globalAlpha = 1;
      }
      var i, q, f, sp;
      for (i = 0; i < parts.length; i++) {
        q = parts[i]; f = q.life / q.ttl;
        sp = sprites[f < 0.25 ? 0 : f < 0.55 ? 1 : f < 0.8 ? 2 : 3];
        ctx.globalAlpha = (1 - f) * 0.85;
        var s = q.size * (1 - f * 0.6);
        ctx.drawImage(sp, q.x - s / 2, q.y - s / 2, s, s);
      }
      for (i = 0; i < sparks.length; i++) {
        q = sparks[i]; f = q.life / q.ttl;
        ctx.globalAlpha = (1 - f) * 0.9;
        ctx.strokeStyle = "rgba(255,196,112,.9)";
        ctx.lineWidth = Math.max(0.6, q.size * 0.42);
        ctx.beginPath();
        ctx.moveTo(q.x - q.vx * 0.018, q.y - q.vy * 0.018);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        var s2 = q.size * 2.4;
        ctx.drawImage(sprites[0], q.x - s2 / 2, q.y - s2 / 2, s2, s2);
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      if (!active) return;
      if (now - lastPaint < frameInterval) { raf = requestAnimationFrame(loop); return; }
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      lastPaint = now;
      var st = matchState(phase, now);
      spawn(st, dt, now);
      step(dt, now);
      draw(st, now);
      raf = requestAnimationFrame(loop);
    }

    return {
      setPhase: function (p) { phase = p; },
      setNameEdge: function (v) { nameEdge = v; },
      setActive: function (on) {
        on = on && !document.hidden;
        if (on === active) return;
        active = on;
        if (active) { last = lastPaint = performance.now() - frameInterval; raf = requestAnimationFrame(loop); }
        else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); parts.length = sparks.length = 0; }
      },
      resize: resize,
      isActive: function () { return active; }
    };
  }

  /* 小画布随 SVG 路径移动。所有粒子都在固定池里复用，避免滚动时制造垃圾。 */
  function FuseSparkScene(canvas) {
    var ctx = canvas.getContext("2d");
    var size = isMobile ? 76 : 92;
    var dpr = Math.min(window.devicePixelRatio || 1, motionProfile.dpr);
    var center = size / 2;
    var active = false, raf = 0, last = 0, lastPaint = 0;
    var frameInterval = 1000 / motionProfile.fps;
    var angle = Math.PI / 2, velocity = 0, burst = 0;
    var seed = 0x1f2e3d4c;
    var particles = [];
    var count = motionProfile.sparkParticles;

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    function random() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }

    for (var i = 0; i < count; i++) {
      particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 2, ttl: 1, hot: 0 });
    }

    function respawn(p, force) {
      var back = angle + Math.PI;
      var spread = (random() - 0.5) * 1.5;
      var power = 20 + random() * (42 + velocity * 80 + force * 45);
      p.x = center + (random() - 0.5) * 4;
      p.y = center + (random() - 0.5) * 4;
      p.vx = Math.cos(back + spread) * power + (random() - 0.5) * 18;
      p.vy = Math.sin(back + spread) * power - 14 - random() * 28;
      p.life = 0;
      p.ttl = .22 + random() * .42;
      p.hot = random();
    }

    function update(dt) {
      var spawnChance = Math.min(1, dt * (18 + velocity * 95 + burst * 120));
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.life += dt;
        if (p.life >= p.ttl) {
          if (random() < spawnChance) respawn(p, burst);
          continue;
        }
        p.vy += 52 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      burst = Math.max(0, burst - dt * 2.4);
    }

    function draw(now) {
      ctx.clearRect(0, 0, size, size);

      // 两缕不同相位的薄烟，离开白热核心后才显出灰度。
      ctx.save();
      ctx.globalAlpha = .17 + Math.sin(now / 210) * .025;
      ctx.strokeStyle = "rgba(138,131,120,.38)";
      ctx.lineWidth = .9;
      ctx.beginPath();
      ctx.moveTo(center, center + 3);
      ctx.bezierCurveTo(center - 8, center - 8, center + 10, center - 18, center + 1, center - 31);
      ctx.stroke();
      ctx.globalAlpha *= .55;
      ctx.lineWidth = .55;
      ctx.beginPath();
      ctx.moveTo(center + 2, center);
      ctx.bezierCurveTo(center + 9, center - 11, center - 6, center - 20, center + 4, center - 36);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.life >= p.ttl) continue;
        var fade = 1 - p.life / p.ttl;
        ctx.globalAlpha = fade * (.42 + p.hot * .58);
        ctx.strokeStyle = p.hot > .55 ? "#ffd28a" : "#ff6b35";
        ctx.lineWidth = 1.25 + p.hot * 1.3;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * .026, p.y - p.vy * .026);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalAlpha = fade * (.62 + p.hot * .38);
        ctx.strokeStyle = p.hot > .4 ? "#fff3c7" : "#ffa94d";
        ctx.lineWidth = .38 + p.hot * .55;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * .018, p.y - p.vy * .018);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      var flicker = 1 + Math.sin(now / 47) * .09 + Math.sin(now / 83) * .06;
      var outer = ctx.createRadialGradient(center - 2, center + 2, 1, center, center, 34 * flicker);
      outer.addColorStop(0, "rgba(255,210,138,.55)");
      outer.addColorStop(.24, "rgba(255,169,77,.28)");
      outer.addColorStop(.58, "rgba(255,107,53,.09)");
      outer.addColorStop(1, "rgba(179,58,30,0)");
      ctx.globalAlpha = .62 + Math.min(.3, velocity * .52 + burst * .18);
      ctx.fillStyle = outer;
      ctx.fillRect(center - 38, center - 38, 76, 76);

      var halo = ctx.createRadialGradient(center - 1, center, 0, center, center, 19 * flicker);
      halo.addColorStop(0, "rgba(255,248,226,.98)");
      halo.addColorStop(.16, "rgba(255,210,138,.82)");
      halo.addColorStop(.46, "rgba(255,107,53,.29)");
      halo.addColorStop(1, "rgba(179,58,30,0)");
      ctx.globalAlpha = .82;
      ctx.fillStyle = halo;
      ctx.fillRect(center - 23, center - 23, 46, 46);

      // 非对称白热火舌，朝行进方向的反向轻轻拖曳。
      ctx.translate(center, center);
      ctx.rotate(angle - Math.PI / 2);
      ctx.globalAlpha = .72;
      ctx.fillStyle = "#b33a1e";
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.bezierCurveTo(-8, 3, -7 * flicker, -11, -1, -19 * flicker);
      ctx.bezierCurveTo(3, -13, 9, 1, 0, 9);
      ctx.fill();
      ctx.globalAlpha = .98;
      ctx.fillStyle = "#ff6b35";
      ctx.beginPath();
      ctx.moveTo(0, 7);
      ctx.bezierCurveTo(-6, 2, -5 * flicker, -9, -1, -15 * flicker);
      ctx.bezierCurveTo(2, -10, 7, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#ffd28a";
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.bezierCurveTo(-3, 1, -2.5, -6, 0, -10 * flicker);
      ctx.bezierCurveTo(2.4, -5, 3.5, 1, 0, 5);
      ctx.fill();
      ctx.globalAlpha = .92;
      ctx.fillStyle = "#fff3c7";
      ctx.beginPath();
      ctx.moveTo(0, 3.8);
      ctx.bezierCurveTo(-1.4, .5, -1.1, -3.5, .2, -6.2 * flicker);
      ctx.bezierCurveTo(1.4, -2.8, 1.7, .8, 0, 3.8);
      ctx.fill();
      ctx.restore();
    }

    function loop(now) {
      if (!active) return;
      if (now - lastPaint < frameInterval) { raf = requestAnimationFrame(loop); return; }
      var dt = Math.min(.05, Math.max(.001, (now - last) / 1000));
      last = now;
      lastPaint = now;
      update(dt);
      draw(now);
      raf = requestAnimationFrame(loop);
    }

    return {
      setMotion: function (nextAngle, nextVelocity) {
        angle = nextAngle;
        velocity = Math.min(1, Math.max(0, nextVelocity));
      },
      ignite: function () {
        burst = 1;
        particles.forEach(function (p, index) { if (index % 2 === 0) respawn(p, 1); });
      },
      setActive: function (on) {
        on = on && !document.hidden;
        if (on === active) return;
        active = on;
        if (active) { last = lastPaint = performance.now() - frameInterval; raf = requestAnimationFrame(loop); }
        else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, size, size); }
      },
      resize: function () {}
    };
  }

  /* 燎原转场：固定种子粒子从火线升空，并精确落到九颗项目星的位置。 */
  function WildfireScene(canvas) {
    var ctx = canvas.getContext("2d");
    var dipper = document.getElementById("dipper");
    var sky = document.getElementById("sky");
    var starView = [
      [66, 108], [178, 66], [294, 118], [330, 216], [270, 286],
      [166, 250], [50, 306], [106, 406], [258, 388]
    ];
    var targets = [];
    var particles = [];
    var phase = 0, active = false, raf = 0, lastPaint = 0;
    var frameInterval = 1000 / motionProfile.fps;
    var renderAverage = 0, slowFrames = 0, degradedThisRun = false;
    var W = 1, H = 1, dpr = 1, groundY = 1;
    var fireOuter = null, fireInner = null, glowSprite = null;
    var seed = 0x7a11f17e;
    var count = 96; // 固定最大池；各画质档只遍历自己的前 N 颗，不在帧中分配对象。

    function random() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (var i = 0; i < count; i++) {
      particles.push({
        rx: random(), ry: random(), bend: random() - .5,
        start: .12 + random() * .31,
        duration: .34 + random() * .24,
        size: .6 + random() * 1.7,
        hot: random()
      });
    }

    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function seg(v, a, b) { return clamp01((v - a) / (b - a)); }
    function smooth(v) { return v * v * (3 - 2 * v); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    function resize() {
      W = Math.max(1, Math.round(canvas.clientWidth));
      H = Math.max(1, Math.round(canvas.clientHeight));
      dpr = motionProfile.effectiveDpr(W, H);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      groundY = H * .69;

      // 渐变只在 resize 时创建；逐帧只复用 paint，避免动画中制造垃圾。
      fireOuter = ctx.createLinearGradient(0, groundY - H * .17, 0, groundY + 4);
      fireOuter.addColorStop(0, "rgba(179,58,30,0)");
      fireOuter.addColorStop(.38, "rgba(179,58,30,.58)");
      fireOuter.addColorStop(.78, "rgba(255,107,53,.82)");
      fireOuter.addColorStop(1, "rgba(255,169,77,.94)");
      fireInner = ctx.createLinearGradient(0, groundY - H * .11, 0, groundY + 3);
      fireInner.addColorStop(0, "rgba(255,107,53,0)");
      fireInner.addColorStop(.45, "rgba(255,107,53,.72)");
      fireInner.addColorStop(.82, "rgba(255,210,138,.92)");
      fireInner.addColorStop(1, "rgba(242,236,225,.96)");

      glowSprite = document.createElement("canvas");
      glowSprite.width = 256; glowSprite.height = 96;
      var glowCtx = glowSprite.getContext("2d");
      var glow = glowCtx.createRadialGradient(128, 72, 0, 128, 72, 124);
      glow.addColorStop(0, "rgba(255,210,138,.42)");
      glow.addColorStop(.3, "rgba(255,107,53,.23)");
      glow.addColorStop(.67, "rgba(179,58,30,.1)");
      glow.addColorStop(1, "rgba(179,58,30,0)");
      glowCtx.fillStyle = glow;
      glowCtx.fillRect(0, 0, 256, 96);

      var skyRect = sky.getBoundingClientRect();
      var dipperRect = dipper.getBoundingClientRect();
      targets = starView.map(function (point) {
        return {
          x: dipperRect.left - skyRect.left + point[0] / 360 * dipperRect.width,
          y: dipperRect.top - skyRect.top + point[1] / 520 * dipperRect.height
        };
      });
    }

    function curtainPoints(now, left, right, scale, phaseOffset) {
      var points = [];
      var samples = motionProfile.fireSamples;
      var width = Math.max(1, right - left);
      for (var index = 0; index < samples; index++) {
        var t = index / (samples - 1);
        var edge = Math.pow(Math.sin(Math.PI * t), .42);
        var wave = Math.sin(now / 127 + index * 1.71 + phaseOffset) * .5 +
          Math.sin(now / 71 - index * 2.37 + phaseOffset * .7) * .3 +
          Math.sin(index * 5.13 + phaseOffset) * .2;
        var spike = Math.pow(Math.max(0, Math.sin(index * 2.91 + phaseOffset * 1.3)), 5) * 22;
        var height = (15 + (wave + 1) * 13 + spike) * edge * scale;
        points.push({ x: left + width * t, y: groundY - height });
      }
      return points;
    }

    function fillCurtain(points, paint, alpha) {
      if (!points.length || alpha <= .001) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = paint;
      ctx.beginPath();
      ctx.moveTo(points[0].x, groundY + 4);
      ctx.lineTo(points[0].x, points[0].y);
      for (var i = 1; i < points.length; i++) {
        var previous = points[i - 1];
        var current = points[i];
        ctx.quadraticCurveTo(previous.x, previous.y,
          (previous.x + current.x) * .5, (previous.y + current.y) * .5);
      }
      var lastPoint = points[points.length - 1];
      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, lastPoint.x, groundY + 4);
      ctx.closePath();
      ctx.fill();
    }

    function drawFireFront(now, spread, fireFade) {
      if (spread <= 0 || fireFade <= .001) return;
      var radius = W * (.035 + spread * .54);
      var left = W * .5 - radius;
      var right = W * .5 + radius;

      ctx.globalAlpha = fireFade;
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(glowSprite, left - radius * .13, groundY - H * .13,
        radius * 2.26, H * .22);

      // 一圈贴地扩散的白热波：先于火幕抵达两侧，给“点燃大地”一个明确瞬间。
      var wave = smooth(seg(phase, .055, .29));
      var waveFade = (1 - smooth(seg(phase, .28, .5))) * fireFade;
      if (wave > .001 && waveFade > .001) {
        ctx.globalAlpha = waveFade * .58;
        ctx.strokeStyle = "#ffd28a";
        ctx.lineWidth = .6 + (1 - wave) * 1.2;
        ctx.beginPath();
        ctx.ellipse(W * .5, groundY + 1, radius * (1.02 + wave * .08), 3 + wave * 4, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
      }

      // 两层连续火幕是主体；二十余个采样点合并成两个 path，成本远低于逐火苗绘制。
      fillCurtain(curtainPoints(now, left, right, 1.34, .7), fireOuter, fireFade * .76);
      fillCurtain(curtainPoints(now, left, right, .72, 2.8), fireInner, fireFade * .78);

      ctx.lineCap = "round";
      ctx.globalAlpha = fireFade * (.42 + spread * .32);
      ctx.strokeStyle = "#ffa94d";
      ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(left, groundY + 1); ctx.lineTo(right, groundY + 1); ctx.stroke();
      ctx.globalAlpha = fireFade * .22;
      ctx.strokeStyle = "#ffd28a";
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(left + radius * .08, groundY + 2); ctx.lineTo(right - radius * .08, groundY + 2); ctx.stroke();

      // 稀疏的高火舌只负责节奏与剪影，不再排成一行“齿”。
      ctx.globalCompositeOperation = "lighter";
      var flameCount = motionProfile.flameLanes;
      for (var f = 0; f < flameCount; f++) {
        var laneJitter = Math.sin((f + 1) * 12.9898) * .31;
        var fx = W * (f + .5 + laneJitter) / flameCount;
        var distance = Math.abs(fx - W * .5);
        var reach = clamp01((radius - distance) / Math.max(1, W * .12));
        if (reach <= .02) continue;
        var noise = Math.sin(now / 74 + f * 2.17) * 3.4 + Math.sin(now / 43 + f) * 1.7;
        var fh = (18 + (f * 17 % 34)) * reach * (1 + Math.sin(now / 113 + f) * .16);
        var rootLift = Math.sin(f * 4.3) * 4 + Math.cos(f * 1.91) * 2;
        var flameWidth = 4.2 + ((f * 7) % 6);
        drawFlame(fx, groundY + rootLift, fh, flameWidth, noise, fireFade * reach * .86);
      }
    }

    function drawFlame(x, y, height, width, flicker, alpha) {
      ctx.globalAlpha = alpha * .48;
      ctx.fillStyle = "#b33a1e";
      ctx.beginPath();
      ctx.moveTo(x - width, y + 2);
      ctx.bezierCurveTo(x - width * .7, y - height * .34, x - width * .15 + flicker, y - height * .78, x, y - height);
      ctx.bezierCurveTo(x + width * .38, y - height * .68, x + width, y - height * .2, x + width, y + 2);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = alpha * .72;
      ctx.fillStyle = "#ff6b35";
      ctx.beginPath();
      ctx.moveTo(x - width * .48, y + 1);
      ctx.bezierCurveTo(x - width * .25, y - height * .3, x + flicker * .42, y - height * .62, x + width * .05, y - height * .76);
      ctx.bezierCurveTo(x + width * .44, y - height * .4, x + width * .5, y - height * .16, x + width * .46, y + 1);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = alpha * .8;
      ctx.fillStyle = "#ffd28a";
      ctx.beginPath();
      ctx.moveTo(x - width * .16, y);
      ctx.quadraticCurveTo(x - width * .08, y - height * .28, x + flicker * .18, y - height * .48);
      ctx.quadraticCurveTo(x + width * .2, y - height * .19, x + width * .18, y);
      ctx.closePath(); ctx.fill();
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      if (phase <= .001 || phase >= .995) return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      var spread = smooth(seg(phase, .025, .38));
      var fireFade = 1 - smooth(seg(phase, .48, .76));
      drawFireFront(now, spread, fireFade);

      var settleFade = 1 - smooth(seg(phase, .86, .98));
      var activeParticles = Math.min(particles.length, motionProfile.wildfireParticles);
      for (var index = 0; index < activeParticles; index++) {
        var particle = particles[index];
        var raw = seg(phase, particle.start, particle.start + particle.duration);
        if (raw <= 0 || settleFade <= 0) continue;
        var t = smooth(raw);
        var target = targets[index % targets.length] || { x: W * .5, y: H * .25 };
        var sourceSpread = smooth(seg(particle.start, .08, .43));
        var sx = W * .5 + (particle.rx - .5) * W * (.22 + sourceSpread * .72);
        var sy = groundY + (particle.ry - .5) * 12;
        var arc = Math.sin(Math.PI * t) * H * (.14 + particle.ry * .18);
        var x = lerp(sx, target.x, t) + particle.bend * W * .28 * Math.sin(Math.PI * t);
        var y = lerp(sy, target.y, t) - arc;
        var previousT = Math.max(0, t - .026);
        var px = lerp(sx, target.x, previousT) + particle.bend * W * .28 * Math.sin(Math.PI * previousT);
        var py = lerp(sy, target.y, previousT) - Math.sin(Math.PI * previousT) * H * (.14 + particle.ry * .18);
        var born = smooth(seg(raw, 0, .12));
        var alpha = born * settleFade * (.28 + particle.hot * .7);
        ctx.globalAlpha = alpha * .42;
        ctx.strokeStyle = particle.hot > .55 ? "#ffd28a" : "#ff6b35";
        ctx.lineWidth = .5 + particle.size * .55;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = t > .72 ? "#f2ece1" : particle.hot > .5 ? "#ffd28a" : "#ffa94d";
        ctx.beginPath(); ctx.arc(x, y, particle.size * (1 - t * .38), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    function loop(now) {
      if (!active) return;
      if (now - lastPaint < frameInterval) { raf = requestAnimationFrame(loop); return; }
      lastPaint = now;
      var renderStart = performance.now();
      draw(now);
      var cost = performance.now() - renderStart;
      renderAverage = renderAverage ? renderAverage * .88 + cost * .12 : cost;
      var costLimit = Math.min(13, frameInterval * .52);
      slowFrames = renderAverage > costLimit ? slowFrames + 1 : Math.max(0, slowFrames - 2);
      if (!degradedThisRun && slowFrames > 18 && motionProfile.degrade()) {
        degradedThisRun = true;
        frameInterval = 1000 / motionProfile.fps;
        resize();
      }
      raf = requestAnimationFrame(loop);
    }

    resize();
    return {
      setPhase: function (value) { phase = clamp01(value); if (!active) draw(performance.now()); },
      setActive: function (on) {
        on = on && !document.hidden;
        if (on === active) return;
        active = on;
        if (active) {
          lastPaint = performance.now() - frameInterval;
          renderAverage = 0; slowFrames = 0; degradedThisRun = false;
          raf = requestAnimationFrame(loop);
        }
        else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); }
      },
      resize: function () { resize(); draw(performance.now()); }
    };
  }

  flame = FlameScene(document.getElementById("flame"));
  fuseSpark = FuseSparkScene(document.getElementById("fuseSpark"));
  wildfire = WildfireScene(document.getElementById("wildfire"));

  var nameEl = document.querySelector(".hero-name h1");
  function measureName() {
    flame.setNameEdge(nameEl.getBoundingClientRect().right);
  }
  measureName();

  /* ============================================================
     章一 · hero pinned 时间轴（scroll 即划火柴）
     ============================================================ */
  var compactHero = window.matchMedia("(max-height: 720px)").matches;
  var heroTL = gsap.timeline({
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "+=230%",
      pin: true,
      scrub: 0.7,
      onUpdate: function (st) {
        flame.setPhase(st.progress);
        flame.setActive(st.isActive && st.progress > .003 && st.progress < .997);
        document.documentElement.classList.toggle("match-lit", st.progress >= .31 && st.progress < .92);
        document.documentElement.classList.toggle("story-entered", st.progress >= (compactHero ? .58 : .92));
      },
      onToggle: function (st) { flame.setActive(st.isActive && st.progress > .003 && st.progress < .997); }
    }
  });
  heroTL
    .to("#whisper", { opacity: 0, y: -26, duration: 0.16 }, 0.13)
    .fromTo("#heroName", { opacity: 0.42 }, { opacity: 1, y: 0, duration: 0.26, ease: "none" }, 0.3)
    .fromTo(".hero-name h1 span", { opacity: 0.4, y: 12 },
      { opacity: 1, y: 0, stagger: 0.085, duration: 0.22, ease: "power1.out" }, 0.31)
    .from(".hero-name .latin, .hero-name .tagline, .hero-name .echo",
      { opacity: 0, y: 18, stagger: 0.05, duration: 0.2, ease: "power1.out" }, 0.44)
    .to({}, { duration: 0.2 }); // 驻留

  var heroST = heroTL.scrollTrigger;
  var skyST = null;
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      flame.setActive(false);
      fuseSpark.setActive(false);
      wildfire.setActive(false);
    } else {
      flame.setActive(heroST && heroST.isActive && heroST.progress > .003 && heroST.progress < .997);
      fuseSpark.setActive(storyST && storyST.isActive);
      wildfire.setActive(skyST && skyST.isActive);
    }
  });

  /* ============================================================
     引信：路径过每盏灯的灯芯，dashoffset 随滚动烧进
     ============================================================ */
  var story = document.getElementById("story");
  var fuseSvg = document.getElementById("fuse");
  var fuseBase = document.getElementById("fuseBase");
  var fuseLit = document.getElementById("fuseLit");
  var fuseHead = document.getElementById("fuseHead");
  var fuseLen = 0;
  var ignitionTargets = [];
  var lastFuseProgress = 0;
  var storyST = null;

  function buildFuse() {
    var H = story.scrollHeight;
    var EXT = 90;
    var storyW = story.clientWidth;
    if (storyW < 1) storyW = 360;

    fuseSvg.setAttribute("viewBox", "0 -" + EXT + " " + storyW + " " + (H + EXT));

    var storyRect = story.getBoundingClientRect();
    var storyTop = storyRect.top + window.scrollY;
    var targets = [];
    var minorIndex = 0;
    document.querySelectorAll("[data-ignite]").forEach(function (el) {
      var dot = el.querySelector(".hero-dot");
      var rect = (dot || el).getBoundingClientRect();
      var isMinor = el.matches(".rest-lamps li");
      var minorFont = isMinor ? parseFloat(getComputedStyle(el).fontSize) : 0;
      targets.push({
        el: el,
        x: isMinor ? rect.left - 8.5 - storyRect.left : rect.left + rect.width / 2 - storyRect.left,
        y: isMinor ? rect.top + minorFont * 1.08 + 2.5 + window.scrollY - storyTop :
          rect.top + rect.height / 2 + window.scrollY - storyTop,
        minor: isMinor,
        order: isMinor ? minorIndex++ : -1,
        progress: 1
      });
    });
    targets.sort(function (a, b) { return a.y - b.y; });

    // 自述段只给路线定节奏；灯火段的每个项目才是真正的点火锚点。
    var anchors = [{ x: storyW * 0.09, y: -EXT }];
    document.querySelectorAll("#about .line").forEach(function (line, index) {
      var rect = line.getBoundingClientRect();
      anchors.push({
        x: storyW * (index % 2 === 0 ? 0.84 : 0.16),
        y: rect.top + rect.height * 0.52 + window.scrollY - storyTop
      });
    });
    targets.forEach(function (target, index) {
      var previous = targets[index - 1];
      if (previous && !previous.minor && !target.minor &&
          target.y - previous.y > 150 && Math.abs(target.x - previous.x) < storyW * 0.08) {
        // 手机端三盏灯芯同在左侧。中间轻轻向外舒展一次，既避开卡片，
        // 又避免两灯之间退化成机械的垂直直线。
        anchors.push({
          x: Math.max(5, Math.min(previous.x, target.x) - Math.min(34, storyW * 0.075)),
          y: previous.y + (target.y - previous.y) * 0.5
        });
      }
      anchors.push({ x: target.x, y: target.y, target: target });
    });
    anchors.push({ x: storyW * 0.68, y: H });
    anchors.sort(function (a, b) { return a.y - b.y; });

    // 同高锚点会制造回钩。布局本身已把三张主卡纵向错开，此处仍保留
    // 8px 安全间距，防字体替换或极矮视口把点压到同一水平线上。
    for (var index = 1; index < anchors.length; index++) {
      if (anchors[index].y <= anchors[index - 1].y + 8) {
        anchors[index].y = anchors[index - 1].y + 8;
        if (anchors[index].target) anchors[index].target.y = anchors[index].y;
      }
    }

    // 每个节点两侧都保持竖直切线：连接连续、舒展，不会出现 Catmull-Rom
    // 在间距不均时的过冲，也不需要任何人为“小结”。
    var d = "M" + anchors[0].x.toFixed(1) + " " + anchors[0].y.toFixed(1);
    for (var i = 0; i < anchors.length - 1; i++) {
      var from = anchors[i], to = anchors[i + 1];
      var dy = Math.max(8, to.y - from.y);
      var handle = Math.min(dy * 0.42, 260);
      d += "C" + from.x.toFixed(1) + " " + (from.y + handle).toFixed(1) + " " +
        to.x.toFixed(1) + " " + (to.y - handle).toFixed(1) + " " +
        to.x.toFixed(1) + " " + to.y.toFixed(1);
    }

    fuseBase.setAttribute("d", d);
    fuseLit.setAttribute("d", d);
    fuseLen = fuseLit.getTotalLength();
    fuseLit.style.strokeDasharray = fuseLen;
    fuseLit.style.strokeDashoffset = fuseLen;

    // 曲线 y 严格单调，因此可按 y 二分求到达进度。旧版为每个目标扫描
    // 1800 个点，低端手机首屏会重复执行约 1.6 万次 SVG 几何查询。
    targets.forEach(function (target) {
      var low = 0, high = fuseLen;
      for (var step = 0; step < 18; step++) {
        var middle = (low + high) * 0.5;
        var point = fuseLit.getPointAtLength(middle);
        if (point.y < target.y) low = middle;
        else high = middle;
      }
      target.progress = ((low + high) * 0.5) / fuseLen;
    });
    ignitionTargets = targets.sort(function (a, b) { return a.progress - b.progress; });
  }

  var setHeadX = gsap.quickSetter(fuseHead, "x", "px");
  var setHeadY = gsap.quickSetter(fuseHead, "y", "px");

  function igniteTarget(target) {
    var el = target.el;
    el.classList.add("lit");
    el.classList.remove("is-igniting");
    void el.offsetWidth;
    el.classList.add("is-igniting");
    clearTimeout(el._igniteTimer);
    el._igniteTimer = setTimeout(function () { el.classList.remove("is-igniting"); }, 1450);
    gsap.to(el, { opacity: 1, y: 0, duration: target.minor ? .7 : 1, ease: "power2.out", overwrite: true });
    fuseSpark.ignite();
  }

  function placeHead(progress) {
    if (!fuseLen) return;
    var distance = fuseLen * progress;
    var pt = fuseLit.getPointAtLength(distance);
    var before = fuseLit.getPointAtLength(Math.max(0, distance - 3));
    var after = fuseLit.getPointAtLength(Math.min(fuseLen, distance + 3));
    var angle = Math.atan2(after.y - before.y, after.x - before.x);
    var velocity = Math.min(1, Math.abs(progress - lastFuseProgress) * 95);
    setHeadX(pt.x);
    setHeadY(pt.y);
    fuseSpark.setMotion(angle, velocity);
    fuseLit.style.strokeDashoffset = fuseLen * (1 - progress);
    var edge = Math.min(progress / 0.02, (1 - progress) / 0.02, 1);
    fuseHead.style.opacity = Math.max(0, Math.min(1, edge));
    if (progress >= lastFuseProgress) {
      ignitionTargets.forEach(function (target) {
        if (target.progress > lastFuseProgress && target.progress <= progress + 0.001) igniteTarget(target);
      });
    }
    lastFuseProgress = progress;
  }

  function startFuse() {
    if (storyST) return;
    buildFuse();
    placeHead(0);
    storyST = ScrollTrigger.create({
      trigger: "#story",
      start: "top 58%",
      end: "bottom 62%",
      scrub: 0.8,
      onUpdate: function (st) { placeHead(st.progress); },
      onToggle: function (st) { fuseSpark.setActive(st.isActive); }
    });
    document.documentElement.classList.add("fuse-ready");
  }

  /* ---------- 章二 · 自述逐句点亮 ---------- */
  gsap.utils.toArray("#about .line, #about .echo").forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.1, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 74%", once: true }
    });
  });

  /* ---------- 章三 · 标题与七盏灯（点过就不熄） ---------- */
  gsap.utils.toArray("#lamps h2, .chapter-sub, .rest-label").forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 76%", once: true }
    });
  });

  /* ---------- 章四 · 燎原成星：火线、升烬、九星与连线共用一条滚动时间线 ---------- */
  var dipLines = gsap.utils.toArray("#dipperLines line");
  dipLines.forEach(function (ln) {
    var L = Math.hypot(ln.x2.baseVal.value - ln.x1.baseVal.value,
                       ln.y2.baseVal.value - ln.y1.baseVal.value);
    ln.style.strokeDasharray = L;
    ln.style.strokeDashoffset = L;
  });
  var skyTL = gsap.timeline({
    scrollTrigger: {
      id: "sky-transition",
      trigger: "#sky",
      start: "top top",
      end: "+=175%",
      pin: true,
      scrub: .72,
      anticipatePin: 1,
      onRefresh: function () { wildfire.resize(); },
      onUpdate: function (st) { wildfire.setPhase(st.progress); },
      onToggle: function (st) { wildfire.setActive(st.isActive); }
    }
  });
  skyST = skyTL.scrollTrigger;
  skyTL
    .to({}, { duration: .48 })
    .to("#dipperStars .star", {
      opacity: 1, duration: .2, stagger: .034, ease: "power2.out"
    }, .5)
    .to(dipLines, {
      strokeDashoffset: 0, opacity: function (index, line) {
        return line.classList.contains("core-line") ? .66 : .4;
      }, duration: .34, stagger: .045, ease: "power1.inOut"
    }, .58)
    .to("#skyField circle", {
      opacity: function (index) { return .12 + (index * 53 % 10) / 45; },
      duration: .32, stagger: { amount: .22, from: "random" }, ease: "power1.out"
    }, .62)
    .to("#wildfire", { opacity: 0, duration: .25, ease: "power1.out" }, .9)
    .to(".sky-line", { opacity: 1, duration: .34, ease: "power1.out" }, .94)
    .to("#sky .echo", { opacity: 1, duration: .3, ease: "power1.out" }, 1.08);

  /* ---------- 章五 · 余烬 ---------- */
  gsap.to("#ember > *", {
    opacity: 1, y: 0, duration: 1.1, stagger: 0.14, ease: "power2.out",
    scrollTrigger: { trigger: "#ember", start: "top 72%", once: true }
  });

  /* ---------- 键盘兜底：Tab 进未点亮区域时立即点亮，焦点永不落在透明元素上 ---------- */
  document.getElementById("lamps").addEventListener("focusin", function (e) {
    var lamp = e.target.closest("[data-ignite]");
    if (lamp && !lamp.classList.contains("lit")) {
      var target = ignitionTargets.find(function (item) { return item.el === lamp; });
      if (target) igniteTarget(target);
    }
  });
  document.getElementById("ember").addEventListener("focusin", function () {
    gsap.to("#ember > *", { opacity: 1, y: 0, duration: 0.3, overwrite: true });
  });

  /* ---------- 布局变动：重建引信（忽略移动端地址栏伸缩级别的高度抖动） ---------- */
  var rT, lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener("resize", function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      var w = window.innerWidth, h = window.innerHeight;
      if (w === lastW && Math.abs(h - lastH) < 140) { lastH = h; return; }
      lastW = w; lastH = h;
      try {
        flame.resize();
        wildfire.resize();
        measureName();
        if (storyST) {
          var currentProgress = storyST.progress;
          buildFuse();
          lastFuseProgress = currentProgress;
          placeHead(currentProgress);
        }
        ScrollTrigger.refresh();
      } catch (e) { teardownToStatic(); }
    }, 280);
  });
  function finishFontLayout() {
    try {
      measureName();
      startFuse();
    } catch (e) { teardownToStatic(); }
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(finishFontLayout);
  } else finishFontLayout();

  } catch (err) { // ---- 动效初始化失败：降级为静态可读页 ----
    teardownToStatic();
  }
  }

  // defer 脚本完成后先提交首屏，再初始化路径测量与动画系统。
  // rAF 内再投递 task，避免初始化占住本轮首次绘制。
  requestAnimationFrame(function () { setTimeout(bootMotion, 0); });
})();
