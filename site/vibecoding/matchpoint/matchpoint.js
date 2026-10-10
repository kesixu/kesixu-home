/* MatchPoint v4 ·《夜场转播》回放引擎
   THE PLAYBACK:秒表跑表 → 你的一句话打字 → 四张字幕卡硬切砸入 → 记分牌翻出。
   零隐喻:卡上全是产品真实流程的事实。REPLAY 可重放;滚动入场自动首播。
   GSAP + Lenis 本地自托管;异常/reduced-motion → 全静态可读。 */
(function () {
  "use strict";
  var doc = document.documentElement;
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.remove("motion-pending");

  /* 双语 */
  var langBtn = document.getElementById("tv-lang");
  var swapEls = [];
  document.querySelectorAll("[data-en]").forEach(function (el) {
    swapEls.push({ el: el, zh: el.textContent, en: el.getAttribute("data-en") });
  });
  var lang = "zh";
  var sentenceEl = document.getElementById("pb-sentence");
  function setLang(next) {
    lang = next;
    if (window.pbFinish) window.pbFinish();
    swapEls.forEach(function (it) { it.el.textContent = lang === "en" ? it.en : it.zh; });
    doc.setAttribute("lang", lang === "en" ? "en" : "zh-CN");
    langBtn.textContent = lang === "en" ? "中" : "EN";
    try { localStorage.setItem("mpPageLang", lang); } catch (e) {}
  }
  try { if (localStorage.getItem("mpPageLang") === "en") setLang("en"); } catch (e) {}
  langBtn.addEventListener("click", function () { setLang(lang === "en" ? "zh" : "en"); });

  var nav = document.getElementById("tv-nav");
  addEventListener("scroll", function () {
    nav.classList.toggle("scrolled", scrollY > 8);
  }, { passive: true });

  function toStatic() {
    doc.classList.remove("fx"); doc.classList.add("no-fx");
    if (sentenceEl) sentenceEl.textContent = sentenceEl.dataset.full;
    var bd = document.getElementById("pb-board");
    if (bd) bd.hidden = false;
  }
  if (RM || !window.gsap || !window.ScrollTrigger) { toStatic(); return; }

  try {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    doc.classList.add("fx");

    if (window.Lenis) {
      var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* 英雄三行:硬切登场(转播不玩淡入) */
    var lines = gsap.utils.toArray(".tv-h0 .ln");
    gsap.set(lines, { yPercent: 108 });
    gsap.to(lines, { yPercent: 0, duration: .7, ease: "power4.out", stagger: .09, delay: .15 });
    gsap.from(".tv-sub, .tv-cta", { opacity: 0, y: 14, duration: .6, ease: "power2.out", stagger: .1, delay: .5 });

    gsap.utils.toArray(".rv").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: .7, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });

    /* 计分水印:滚动轻推 */
    gsap.utils.toArray(".score-mark").forEach(function (m) {
      gsap.fromTo(m, { y: 40 }, {
        y: -40, ease: "none",
        scrollTrigger: { trigger: m.parentElement, start: "top bottom", end: "bottom top", scrub: .6 }
      });
    });

    /* ── THE PLAYBACK ── */
    var clockEl = document.getElementById("pb-clock");
    var caret = document.getElementById("pb-caret");
    var cards = gsap.utils.toArray(".pb-card");
    var board = document.getElementById("pb-board");
    var replayBtn = document.getElementById("pb-replay");
    var stage = document.getElementById("pb-stage");
    board.hidden = true;   /* 无 JS 时默认可见;fx 下由回放接管 */
    var playing = false, played = false;
    var clockObj = { t: 0 };
    var masterTl = null;

    function fullSentence() {
      return lang === "en" ? sentenceEl.dataset.fullEn : sentenceEl.dataset.full;
    }
    function paintClock() {
      var s = clockObj.t;
      var mm = String(Math.floor(s / 60)).padStart(2, "0");
      var ss = String(Math.floor(s % 60)).padStart(2, "0");
      var d = Math.floor((s % 1) * 10);
      clockEl.textContent = mm + ":" + ss + "." + d;
    }
    function finishAll() {
      if (masterTl) { masterTl.kill(); masterTl = null; }
      playing = false; played = true;
      sentenceEl.textContent = fullSentence();
      gsap.set(caret, { opacity: 0 });
      cards.forEach(function (c) { gsap.set(c, { visibility: "visible", x: 0, opacity: 1 }); });
      board.hidden = false;
      gsap.set(board, { opacity: 1, y: 0 });
      gsap.set(".pb-board-stamp", { scaleX: 1 });
      clockObj.t = 7.4; paintClock();
    }
    window.pbFinish = finishAll;

    function play() {
      if (playing) return;
      playing = true; played = false;
      var full = fullSentence();
      sentenceEl.textContent = "";
      cards.forEach(function (c) { gsap.set(c, { visibility: "hidden", x: -26, opacity: 0 }); });
      board.hidden = true;
      gsap.set(board, { opacity: 0, y: 12 });
      gsap.set(caret, { opacity: 1 });
      clockObj.t = 0; paintClock();

      masterTl = gsap.timeline({ onComplete: function () { playing = false; played = true; gsap.set(caret, { opacity: 0 }); } });
      /* 秒表全程走表 */
      masterTl.to(clockObj, { t: 7.4, duration: 7.4, ease: "none", onUpdate: paintClock }, 0);
      /* 光标闪 */
      masterTl.to(caret, { opacity: 0, duration: .4, ease: "steps(1)", repeat: 5, yoyo: true }, 0);
      /* 你的一句话:逐字 */
      var typeState = { n: 0 };
      masterTl.to(typeState, {
        n: full.length, duration: 1.4, ease: "none",
        onUpdate: function () { sentenceEl.textContent = full.slice(0, Math.round(typeState.n)); }
      }, .5);
      /* 四张字幕卡:硬切砸入 */
      cards.forEach(function (c, i) {
        var at = 2.15 + i * 1.05;
        masterTl.set(c, { visibility: "visible" }, at);
        masterTl.fromTo(c, { x: -26, opacity: 0 }, { x: 0, opacity: 1, duration: .22, ease: "power4.out" }, at);
        masterTl.fromTo(c, { backgroundColor: "rgba(223,255,59,.16)" }, { backgroundColor: "rgba(242,239,230,.05)", duration: .5, ease: "power1.out" }, at + .22);
      });
      /* 记分牌 */
      masterTl.set(".pb-board-stamp", { scaleX: 0 }, 6.3);
      masterTl.add(function () { board.hidden = false; }, 6.35);
      masterTl.fromTo(board, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .35, ease: "power3.out" }, 6.4);
      masterTl.to(".pb-board-stamp", { scaleX: 1, duration: .38, ease: "power4.out" }, 6.85);
    }

    replayBtn.addEventListener("click", function () {
      if (playing) return;
      play();
    });
    ScrollTrigger.create({
      trigger: stage, start: "top 72%", once: true,
      onEnter: function () { play(); }
    });
  } catch (err) {
    toStatic();
  }
})();
