/* 《划亮》main.js — 编排：火柴(canvas) → 引信(SVG) → 七盏灯 → 星图 → 余烬
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
      c.setAttribute("opacity", (0.05 + (i * 53 % 10) / 60).toFixed(3));
      field.appendChild(c);
    }
  }

  var reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedQuery.matches || !window.gsap || !window.ScrollTrigger) return; // 基线：静态点亮态

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("fx");

  /* 中途切到"减少动态"：拆掉全部演出，回到静态点亮态 */
  reducedQuery.addEventListener("change", function (e) {
    if (!e.matches) return;
    ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
    gsap.globalTimeline.clear();
    document.documentElement.classList.remove("fx");
    if (flame) flame.setActive(false);
    document.querySelectorAll(".lamp").forEach(function (el) { el.classList.add("lit"); });
    gsap.set("#heroName, #about .line, #about .echo, #lamps h2, .chapter-sub, .lamp, .sky-line, #sky .echo, #dipperStars .star, #dipperLines line, #ember > *", { clearProps: "all", opacity: 1 });
  });

  /* ============================================================
     火柴与火焰（canvas 2D）
     ============================================================ */
  var isMobile = window.matchMedia("(max-width: 768px)").matches;

  function FlameScene(canvas) {
    var ctx = canvas.getContext("2d");
    var dpr = 1, W = 0, H = 0;
    var phase = 0, active = false, raf = 0, last = 0;
    var parts = [], sparks = [];
    var MAXP = isMobile ? 90 : 150;

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
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function seg(p, a, b) { return clamp01((p - a) / (b - a)); }

    /* 火柴头位置/角度/火焰强度，全部是 phase 的纯函数（resize 免疫） */
    function matchState(p, t) {
      var mx, my, ang, inten = 0;
      var eIn = seg(p, 0, 0.15);          // 入场
      var eSt = seg(p, 0.15, 0.27);       // 划擦
      var eUp = seg(p, 0.27, 0.42);       // 起火，移向驻位
      var eOff = seg(p, 0.86, 1);         // 交棒退场
      var ease = function (v) { return v * v * (3 - 2 * v); };
      if (p < 0.15) {
        mx = lerp(W * 0.92, W * 0.66, ease(eIn));
        my = lerp(H * 1.08, H * 0.64, ease(eIn));
        ang = lerp(-0.9, -0.55, eIn);
      } else if (p < 0.27) {
        mx = lerp(W * 0.66, W * 0.34, ease(eSt));
        my = lerp(H * 0.64, H * 0.58, ease(eSt));
        ang = lerp(-0.55, -0.35, eSt);
        inten = eSt * 0.25;
      } else {
        // 驻位在名字右侧：像举着火柴照亮名字，避开居中的文字列
        mx = lerp(W * 0.34, W * 0.72, ease(eUp));
        my = lerp(H * 0.58, H * 0.56, ease(eUp));
        ang = lerp(-0.35, -1.45, ease(eUp));
        inten = lerp(0.25, 1, ease(eUp));
        mx += Math.sin(t / 900) * 3 * eUp;
      }
      if (eOff > 0) {
        mx = lerp(mx, W * 0.12, ease(eOff));
        my = lerp(my, H * 1.02, ease(eOff));
        inten *= (1 - eOff * 0.75);
      }
      return { mx: mx, my: my, ang: ang, inten: inten };
    }

    function spawn(st, dt, t) {
      // 火焰粒子
      var rate = st.inten * (isMobile ? 62 : 110);
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
        for (var j = 0; j < (isMobile ? 2 : 4); j++) {
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

    function draw(st, t) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";

      // 火柴本体
      var len = Math.min(W, H) * 0.2;
      var hx = st.mx, hy = st.my;
      var tx = hx - Math.cos(st.ang) * len, ty = hy - Math.sin(st.ang) * len;
      ctx.lineCap = "round";
      ctx.lineWidth = 3.6;
      ctx.strokeStyle = "#31241b";
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = st.inten > 0.05 ? "#7a4a28" : "#402a1e";
      ctx.beginPath(); ctx.arc(hx, hy, 4.4, 0, 6.2832); ctx.fill();

      // 发光层
      ctx.globalCompositeOperation = "lighter";
      if (st.inten > 0.01) {
        var R = Math.min(W, H) * (0.16 + 0.42 * st.inten) * (1 + Math.sin(t / 700) * 0.03);
        var g = ctx.createRadialGradient(hx, hy - 8, 0, hx, hy - 8, R);
        g.addColorStop(0, "rgba(255,190,110," + (0.30 * st.inten) + ")");
        g.addColorStop(0.5, "rgba(255,120,50," + (0.10 * st.inten) + ")");
        g.addColorStop(1, "rgba(255,90,40,0)");
        ctx.fillStyle = g;
        ctx.fillRect(hx - R, hy - 8 - R, R * 2, R * 2);
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
        var s2 = q.size * 2.4;
        ctx.drawImage(sprites[0], q.x - s2 / 2, q.y - s2 / 2, s2, s2);
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      if (!active) return;
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      var st = matchState(phase, now);
      spawn(st, dt, now);
      step(dt, now);
      draw(st, now);
      raf = requestAnimationFrame(loop);
    }

    return {
      setPhase: function (p) { phase = p; },
      setActive: function (on) {
        on = on && !document.hidden;
        if (on === active) return;
        active = on;
        if (active) { last = performance.now(); raf = requestAnimationFrame(loop); }
        else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); parts.length = sparks.length = 0; }
      },
      resize: resize,
      isActive: function () { return active; }
    };
  }

  var flame = FlameScene(document.getElementById("flame"));

  /* ============================================================
     章一 · hero pinned 时间轴（scroll 即划火柴）
     ============================================================ */
  var heroTL = gsap.timeline({
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "+=230%",
      pin: true,
      scrub: 0.4,
      onUpdate: function (st) { flame.setPhase(st.progress); },
      onToggle: function (st) { flame.setActive(st.isActive); }
    }
  });
  heroTL
    .to("#scrollHint", { opacity: 0, duration: 0.06 }, 0.02)
    .to("#whisper", { opacity: 0, y: -26, duration: 0.16 }, 0.13)
    .fromTo("#heroName", { opacity: 0 }, { opacity: 1, duration: 0.26, ease: "none" }, 0.33)
    .from(".hero-name h1", { y: 30, duration: 0.3, ease: "power1.out" }, 0.33)
    .from(".hero-name .latin, .hero-name .tagline, .hero-name .echo",
      { opacity: 0, y: 18, stagger: 0.05, duration: 0.2, ease: "power1.out" }, 0.44)
    .to({}, { duration: 0.2 }); // 驻留

  var heroST = heroTL.scrollTrigger;
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) flame.setActive(false);
    else flame.setActive(heroST && heroST.isActive);
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

  function buildFuse() {
    var H = story.scrollHeight;
    var Wl = fuseSvg.clientWidth || 60;
    // 几何约定：svg 宽 = gutter+20，灯芯中线 = gutter/2（与 .lamp-dot 的 CSS 对齐）
    var x = (Wl - 20) / 2;
    fuseSvg.setAttribute("viewBox", "0 0 " + Wl + " " + H);

    var storyTop = story.getBoundingClientRect().top + window.scrollY;
    var pins = [];
    document.querySelectorAll(".lamp-dot").forEach(function (d) {
      var r = d.getBoundingClientRect();
      pins.push(r.top + r.height / 2 + window.scrollY - storyTop);
    });
    var pts = [[x, 0]];
    var y = 0, stepY = 300, k = 0;
    var nextPin = 0;
    function nearPin(yy) {
      for (var j = 0; j < pins.length; j++) if (Math.abs(pins[j] - yy) < 140) return true;
      return false;
    }
    while (y < H) {
      y += stepY;
      while (nextPin < pins.length && pins[nextPin] < y) {
        pts.push([x, pins[nextPin]]); nextPin++;
      }
      if (y < H && !nearPin(y)) pts.push([x + Math.sin(++k * 1.7) * 6, y]);
    }
    while (nextPin < pins.length) { pts.push([x, pins[nextPin]]); nextPin++; }
    pts.push([x, H]);
    pts.sort(function (a, b) { return a[1] - b[1]; });

    // Catmull-Rom → cubic
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1],
          p3 = pts[Math.min(i + 2, pts.length - 1)];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += "C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " +
           c2x.toFixed(1) + " " + c2y.toFixed(1) + " " +
           p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    fuseBase.setAttribute("d", d);
    fuseLit.setAttribute("d", d);
    fuseLen = fuseLit.getTotalLength();
    fuseLit.style.strokeDasharray = fuseLen;
    fuseLit.style.strokeDashoffset = fuseLen;
  }

  var setHeadX = gsap.quickSetter(fuseHead, "x", "px");
  var setHeadY = gsap.quickSetter(fuseHead, "y", "px");

  function placeHead(progress) {
    if (!fuseLen) return;
    var pt = fuseLit.getPointAtLength(fuseLen * progress);
    setHeadX(pt.x);
    setHeadY(pt.y);
    fuseLit.style.strokeDashoffset = fuseLen * (1 - progress);
    var edge = Math.min(progress / 0.02, (1 - progress) / 0.02, 1);
    fuseHead.style.opacity = Math.max(0, Math.min(1, edge));
  }

  buildFuse();
  placeHead(0);

  ScrollTrigger.create({
    trigger: "#story",
    start: "top 58%",
    end: "bottom 62%",
    scrub: 0.5,
    onUpdate: function (st) { placeHead(st.progress); }
  });

  /* ---------- 章二 · 自述逐句点亮 ---------- */
  gsap.utils.toArray("#about .line, #about .echo").forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.1, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 74%", once: true }
    });
  });

  /* ---------- 章三 · 标题与七盏灯（点过就不熄） ---------- */
  gsap.utils.toArray("#lamps h2, .chapter-sub").forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 76%", once: true }
    });
  });
  gsap.utils.toArray(".lamp").forEach(function (el) {
    ScrollTrigger.create({
      trigger: el, start: "top 66%", once: true,
      onEnter: function () {
        el.classList.add("lit");
        gsap.to(el, { opacity: 1, y: 0, duration: 1.05, ease: "power2.out" });
      }
    });
  });

  /* ---------- 章四 · 星图：连线自绘，星辰次第亮 ---------- */
  var dipLines = gsap.utils.toArray("#dipperLines line");
  dipLines.forEach(function (ln) {
    var L = Math.hypot(ln.x2.baseVal.value - ln.x1.baseVal.value,
                       ln.y2.baseVal.value - ln.y1.baseVal.value);
    ln.style.strokeDasharray = L;
    ln.style.strokeDashoffset = L;
  });
  gsap.timeline({
    scrollTrigger: { trigger: "#sky", start: "top 62%", once: true }
  })
    .to("#dipperStars .star", { opacity: 1, duration: 0.7, stagger: 0.16, ease: "power1.out" }, 0)
    .to(dipLines, { strokeDashoffset: 0, opacity: 1, duration: 0.9, stagger: 0.14, ease: "power1.inOut" }, 0.25)
    .to(".sky-line", { opacity: 1, duration: 1.2 }, 1.1)
    .to("#sky .echo", { opacity: 1, duration: 1.2 }, 1.35);

  /* ---------- 章五 · 余烬 ---------- */
  gsap.to("#ember > *", {
    opacity: 1, y: 0, duration: 1.1, stagger: 0.14, ease: "power2.out",
    scrollTrigger: { trigger: "#ember", start: "top 72%", once: true }
  });

  /* ---------- 布局变动：重建引信 ---------- */
  var rT;
  window.addEventListener("resize", function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      flame.resize();
      buildFuse();
      ScrollTrigger.refresh();
    }, 280);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      buildFuse();
      ScrollTrigger.refresh();
    });
  }
})();
