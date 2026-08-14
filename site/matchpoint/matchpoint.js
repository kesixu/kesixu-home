/* MatchPoint v2 · 七拍对攻引擎 + 温网级动效
   球到下半场等你点击回击(不点 900ms 自动回),每一拍推进 Agent 七步之一;
   顶视高度感 = 球体中途放大 + 影子反向缩小。GSAP 3.13 + Lenis,全部本地。
   异常/reduced-motion → 静态可读,球停在场心。 */
(function () {
  "use strict";
  var doc = document.documentElement;
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.remove("motion-pending");

  /* 双语 */
  var langBtn = document.getElementById("mp-lang");
  var swapEls = [];
  document.querySelectorAll("[data-en]").forEach(function (el) {
    swapEls.push({ el: el, zh: el.textContent, en: el.getAttribute("data-en") });
  });
  var STEPS = [
    { zh: ["听懂你", "运动 · 时间 · 想不想热闹，一句话里全听出来"], en: ["It listens", "Sport, time, social taste — parsed from one sentence"] },
    { zh: ["请权限", "日历、位置、熟人——用哪样，先问你"], en: ["It asks first", "Calendar, location, friends — permission before access"] },
    { zh: ["四路搜索", "球局、场地、教练、搭档，一次全查"], en: ["It searches ×4", "Games, courts, coaches, partners — all at once"] },
    { zh: ["做匹配", "水平合不合、路顺不顺、气氛对不对"], en: ["It matches", "Level fit, commute, social comfort"] },
    { zh: ["给理由排序", "「差一人的进阶练习赛」——每条都说得清为什么"], en: ["It ranks, with reasons", "“One spot left, advanced rally” — every pick explained"] },
    { zh: ["记住你", "这一局的偏好，沉进你的画像"], en: ["It remembers", "This game folds into your profile"] },
    { zh: ["留住名额", "你还没到场，位置已经是你的"], en: ["It holds the spot", "The seat is yours before you arrive"] }
  ];
  var CN_NUM = ["一", "二", "三", "四", "五", "六", "七"];
  var lang = "zh";
  function setLang(next) {
    lang = next;
    swapEls.forEach(function (it) { it.el.textContent = lang === "en" ? it.en : it.zh; });
    doc.setAttribute("lang", lang === "en" ? "en" : "zh-CN");
    langBtn.textContent = lang === "en" ? "中" : "EN";
    paintStep();
    try { localStorage.setItem("mpPageLang", lang); } catch (e) {}
  }
  try { if (localStorage.getItem("mpPageLang") === "en") setLang("en"); } catch (e) {}
  langBtn.addEventListener("click", function () { setLang(lang === "en" ? "zh" : "en"); });

  var nav = document.getElementById("mp-nav");
  addEventListener("scroll", function () {
    nav.classList.toggle("scrolled", scrollY > 8);
  }, { passive: true });

  /* 对拍状态(动效可关,状态机常在) */
  var shot = 0, finished = false;
  var stepName = document.getElementById("mp-stepname");
  var stepSub = document.getElementById("mp-stepsub");
  var shotIdx = document.getElementById("mp-shotidx");
  var pips = document.querySelectorAll("#mp-pips li");
  var finalBox = document.getElementById("mp-final");
  var tapline = document.getElementById("mp-tapline");
  function paintStep() {
    var i = Math.min(shot, 6);
    var t = STEPS[i][lang];
    stepName.textContent = t[0];
    stepSub.textContent = t[1];
    shotIdx.textContent = lang === "en" ? String(i + 1) : CN_NUM[i];
    pips.forEach(function (p, j) { p.classList.toggle("on", j <= i && (shot > 0 || j < shot)); });
    pips.forEach(function (p, j) { p.classList.toggle("on", j < shot || (finished && j <= 6)); });
  }
  paintStep();

  function toStatic() { doc.classList.remove("fx"); doc.classList.add("no-fx"); }
  if (RM || !window.gsap || !window.ScrollTrigger) { toStatic(); return; }

  try {
    gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin);
    ScrollTrigger.config({ ignoreMobileResize: true });
    doc.classList.add("fx");

    /* Lenis 丝滑滚动 */
    if (window.Lenis) {
      var lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* 英雄:标题遮罩升起 + 副文淡入 */
    var lines = gsap.utils.toArray(".mp-h0 .ln");
    gsap.set(lines, { yPercent: 112 });
    gsap.to(lines, { yPercent: 0, duration: 1.15, ease: "power4.out", stagger: .12, delay: .2 });
    gsap.from(".mp-eyebrow, .mp-sub, .mp-cta", {
      opacity: 0, y: 18, duration: .9, ease: "power2.out", stagger: .12, delay: .55
    });

    /* 章节标题:SplitText 按行遮罩升起 */
    gsap.utils.toArray(".mp-edit h2").forEach(function (h) {
      var split = new SplitText(h, { type: "lines", mask: "lines" });
      gsap.set(split.lines, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: h, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(split.lines, { yPercent: 0, duration: .95, ease: "power4.out", stagger: .1 });
        }
      });
    });
    gsap.utils.toArray(".rv").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: .85, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });

    /* 画廊悬停 3D 轻倾 */
    if (matchMedia("(pointer: fine)").matches) {
      gsap.utils.toArray(".mp-duo a").forEach(function (card) {
        var rx = gsap.quickTo(card, "rotationY", { duration: .4, ease: "power2.out" });
        var ry = gsap.quickTo(card, "rotationX", { duration: .4, ease: "power2.out" });
        card.addEventListener("pointermove", function (e) {
          var r = card.getBoundingClientRect();
          rx(((e.clientX - r.left) / r.width - .5) * 7);
          ry(-((e.clientY - r.top) / r.height - .5) * 5);
        });
        card.addEventListener("pointerleave", function () { rx(0); ry(0); });
      });
    }

    /* 收尾视频:入视口才播 */
    var goV = document.querySelector(".mp-go-video");
    if (goV) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { en.isIntersecting ? goV.play().catch(function () {}) : goV.pause(); });
      }, { threshold: .2 }).observe(goV);
    }

    /* ── 七拍对攻引擎 ── */
    var ball = document.getElementById("cw-ball");
    var shadow = document.getElementById("cw-shadow");
    var fx = document.getElementById("cw-fx");
    var wrap = document.getElementById("mp-courtwrap");
    var state = "idle";            // idle | flyUp | awaitTop | flyDown | awaitYou | done
    var autoTimer = null;
    var NS = "http://www.w3.org/2000/svg";

    function ripple(x, y, gold) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 6);
      if (!gold) c.setAttribute("stroke", "#D7E84B");
      fx.appendChild(c);
      gsap.fromTo(c, { attr: { r: 6 }, opacity: .85 },
        { attr: { r: 34 }, opacity: 0, duration: .7, ease: "power2.out",
          onComplete: function () { c.remove(); } });
    }

    function landPos(top) {
      return { x: 110 + Math.random() * 180, y: top ? 70 + Math.random() * 70 : 470 + Math.random() * 80 };
    }

    function fly(toTop, zip) {
      state = toTop ? "flyUp" : "flyDown";
      var from = { x: +ball.getAttribute("cx"), y: +ball.getAttribute("cy") };
      var to = landPos(toTop);
      var midX = (from.x + to.x) / 2 + (Math.random() * 60 - 30);
      var dur = zip ? .5 : .68;
      ripple(from.x, from.y, true);
      gsap.to(tapline, { opacity: 0, duration: .25 });
      tapline.classList.remove("pulse");
      var tl = gsap.timeline({ onComplete: function () { arrive(toTop); } });
      tl.to(ball, {
        duration: dur, ease: zip ? "power2.out" : "power1.inOut",
        motionPath: { path: [{ x: from.x, y: from.y }, { x: midX, y: (from.y + to.y) / 2 }, { x: to.x, y: to.y }],
          curviness: 1.2, type: "cubic" },
        attr: {}
      }, 0)
        .to(ball, { attr: { r: 14 }, duration: dur / 2, ease: "power1.out" }, 0)
        .to(ball, { attr: { r: 9 }, duration: dur / 2, ease: "power1.in" }, dur / 2)
        .to(shadow, { attr: { rx: 6, ry: 2.5 }, opacity: .25, duration: dur / 2 }, 0)
        .to(shadow, { attr: { rx: 12, ry: 5 }, opacity: 1, duration: dur / 2 }, dur / 2);
      gsap.to(shadow, {
        duration: dur, ease: zip ? "power2.out" : "power1.inOut",
        motionPath: { path: [{ x: from.x, y: from.y + 8 }, { x: midX, y: (from.y + to.y) / 2 + 10 }, { x: to.x, y: to.y + 8 }],
          curviness: 1.2, type: "cubic" }
      });
      /* MotionPath 走 transform;先把当前位置搬进 transform 再归零 cx,防首帧闪原点 */
      gsap.set(ball, { x: from.x, y: from.y, attr: { cx: 0, cy: 0 } });
      gsap.set(shadow, { x: from.x, y: from.y + 8, attr: { cx: 0, cy: 0 } });
      ball.dataset.tx = to.x; ball.dataset.ty = to.y;
    }

    function settle(el, x, y) {
      gsap.set(el, { clearProps: "x,y,transform" });
      el.setAttribute("cx", x); el.setAttribute("cy", y);
    }

    function arrive(atTop) {
      var x = +ball.dataset.tx, y = +ball.dataset.ty;
      settle(ball, x, y); settle(shadow, x, y + 8);
      ripple(x, y, atTop);
      advance();
      if (finished) { celebrate(x, y); return; }
      if (atTop) {
        state = "awaitTop";
        autoTimer = setTimeout(function () { fly(false, false); }, 620);
      } else {
        state = "awaitYou";
        gsap.to(tapline, { opacity: .85, duration: .3 });
        tapline.classList.add("pulse");
        autoTimer = setTimeout(function () { userReturn(false); }, 950);
      }
    }

    function advance() {
      if (shot >= 7) return;
      shot += 1;
      if (shot >= 7) finished = true;
      var i = Math.min(shot - 1, 6);
      var t = STEPS[i][lang];
      gsap.to([stepName, stepSub], {
        opacity: 0, y: -8, duration: .18, ease: "power1.in",
        onComplete: function () {
          stepName.textContent = t[0];
          stepSub.textContent = t[1];
          shotIdx.textContent = lang === "en" ? String(i + 1) : CN_NUM[i];
          gsap.fromTo([stepName, stepSub], { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: .38, ease: "power2.out", stagger: .06 });
        }
      });
      pips.forEach(function (p, j) { p.classList.toggle("on", j < shot); });
    }

    function userReturn(byUser) {
      if (state !== "awaitYou") return;
      clearTimeout(autoTimer);
      fly(true, byUser);
      if (byUser) gsap.fromTo(wrap, { scale: .992 }, { scale: 1, duration: .3, ease: "power2.out" });
    }

    function celebrate(x, y) {
      state = "done";
      clearTimeout(autoTimer);
      for (var i = 0; i < 3; i++) (function (k) {
        setTimeout(function () { ripple(x, y, k % 2 === 0); }, k * 160);
      })(i);
      finalBox.hidden = false;
      gsap.fromTo(finalBox, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6, ease: "power2.out" });
      gsap.to(tapline, { opacity: 0, duration: .3 });
      setTimeout(resetRally, 9000);
    }

    function resetRally() {
      if (state !== "done") return;
      shot = 0; finished = false; state = "idle";
      finalBox.hidden = true;
      settle(ball, 200, 548); settle(shadow, 200, 556);
      paintStep();
      startWhenSeen(true);
    }

    function startWhenSeen(force) {
      if (force) { state = "awaitYou"; tapline.classList.add("pulse");
        autoTimer = setTimeout(function () { userReturn(false); }, 1400); return; }
      ScrollTrigger.create({
        trigger: wrap, start: "top 75%", once: true,
        onEnter: function () {
          state = "awaitYou";
          tapline.classList.add("pulse");
          autoTimer = setTimeout(function () { userReturn(false); }, 1600);
        }
      });
    }

    wrap.addEventListener("pointerdown", function () { userReturn(true); });
    wrap.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); userReturn(true); }
    });
    startWhenSeen(false);
  } catch (err) {
    toStatic();
  }
})();
