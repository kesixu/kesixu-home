/* PathBot「会诊」v4 动效编排 · GSAP(与主站同版 vendored)
   案卷墨线书写 / 标题逐行升起 / 印章顿落 / 仪表注墨 / 判决轮换 / 双语切换。
   异常或 reduced-motion → 全静态可读。 */
(function () {
  "use strict";
  var doc = document.documentElement;
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.remove("motion-pending");

  /* ── 双语切换(与动效无关,永远可用) ── */
  var LANG_KEY = "pbPageLang";
  var langBtn = document.getElementById("pb-lang");
  var swapEls = null;
  function collectSwap() {
    if (swapEls) return swapEls;
    swapEls = [];
    document.querySelectorAll("[data-en]").forEach(function (el) {
      swapEls.push({ el: el, zh: el.textContent, en: el.getAttribute("data-en") });
    });
    return swapEls;
  }
  function setLang(lang) {
    collectSwap().forEach(function (it) { it.el.textContent = lang === "en" ? it.en : it.zh; });
    doc.setAttribute("lang", lang === "en" ? "en" : "zh-CN");
    langBtn.textContent = lang === "en" ? "中" : "EN";
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
  if (saved === "en") setLang("en");
  langBtn.addEventListener("click", function () {
    setLang(doc.getAttribute("lang") === "en" ? "zh" : "en");
  });

  /* ── 导航滚动态 ── */
  var nav = document.getElementById("pb-nav");
  addEventListener("scroll", function () {
    nav.classList.toggle("scrolled", scrollY > 8);
  }, { passive: true });

  /* ── 英雄录屏:入视口播,离屏停 ── */
  (function heroVideo() {
    var v = document.getElementById("pb-heroloop");
    if (!v) return;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { en.isIntersecting ? v.play().catch(function () {}) : v.pause(); });
      }, { threshold: .25 }).observe(v);
    }
  })();

  function toStatic() { doc.classList.remove("fx"); doc.classList.add("no-fx"); }
  if (RM || !window.gsap || !window.ScrollTrigger) { toStatic(); return; }

  try {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    doc.classList.add("fx");

    /* ── 开卷:标题逐行从遮罩下升起,随后受理章落 ── */
    var lines = gsap.utils.toArray(".pb-h0 .ln, .pb-h0-en");
    gsap.set(lines, { yPercent: 110 });
    var opening = gsap.timeline({ delay: .15 });
    opening.to(lines, { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: .12 });

    var intakeStamp = document.getElementById("pb-stamp-intake");
    if (intakeStamp) {
      gsap.set(intakeStamp, { scale: 2.2, opacity: 0, rotation: -2 });
      ScrollTrigger.create({
        trigger: intakeStamp, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(intakeStamp, { scale: 1, opacity: 1, duration: .42, ease: "power4.in" });
          gsap.to(intakeStamp, { rotation: -6, duration: .35, delay: .42, ease: "elastic.out(1.2,.45)" });
        }
      });
    }

    /* ── 通用揭示 ── */
    gsap.utils.toArray(".rv").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: .95, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true }
      });
    });

    /* ── 案卷墨线:随滚动书写,索引点领路 ── */
    var ink = document.getElementById("pb-ink");
    var dot = document.getElementById("pb-dot");
    if (ink && dot) {
      var setInk = gsap.quickSetter(ink, "height", "%");
      var setDot = gsap.quickSetter(dot, "y", "px");
      ScrollTrigger.create({
        start: 0, end: "max", scrub: .6,
        onUpdate: function (st) {
          var p = st.progress;
          setInk(p * 100);
          setDot(p * (innerHeight - 20));
        }
      });
    }

    /* ── 数字滚动 ── */
    gsap.utils.toArray("[data-count]").forEach(function (el) {
      var target = parseInt(el.dataset.count, 10);
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 1.7, ease: "power3.out",
            onUpdate: function () { el.textContent = Math.round(obj.v); }
          });
        }
      });
    });

    /* ── 分诊三章:依次顿落 ── */
    var triageStamps = gsap.utils.toArray(".pb-stamp-s");
    if (triageStamps.length) {
      gsap.set(triageStamps, { scale: 1.9, opacity: 0 });
      ScrollTrigger.create({
        trigger: ".pb-triage", start: "top 82%", once: true,
        onEnter: function () {
          gsap.to(triageStamps, { scale: 1, opacity: 1, duration: .4, ease: "power4.in", stagger: .28 });
        }
      });
    }

    /* ── 仪表注墨 + 数值 ── */
    gsap.utils.toArray(".pb-meter-bar").forEach(function (bar) {
      ScrollTrigger.create({
        trigger: bar, start: "top 86%", once: true,
        onEnter: function () {
          gsap.to(bar, { width: bar.dataset.fill + "%", duration: 1.5, ease: "power3.out" });
        }
      });
    });
    gsap.utils.toArray("[data-mval]").forEach(function (el) {
      var target = parseFloat(el.dataset.mval);
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 86%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 1.5, ease: "power3.out",
            onUpdate: function () { el.textContent = obj.v.toFixed(2); }
          });
        }
      });
    });

    /* ── 判决轮换(纸上仪器的心跳) ── */
    var chip = document.getElementById("pb-vchip");
    if (chip) {
      var STATES = [["CONFIDENT", "v-pass"], ["ANOMALY FLAG", "v-warn"], ["INDETERMINATE", "v-indet"], ["ESCALATE", "v-esc"]];
      var si = 0;
      setInterval(function () {
        if (document.hidden) return;
        si = (si + 1) % STATES.length;
        chip.textContent = STATES[si][0];
        chip.className = STATES[si][1];
        gsap.fromTo(chip, { scale: 1.1 }, { scale: 1, duration: .45, ease: "back.out(2)" });
      }, 2800);
    }

    /* ── 灯箱附件轻视差(桌面细指针) ── */
    if (matchMedia("(pointer: fine)").matches) {
      gsap.utils.toArray(".pb-band-inner, .pb-frame").forEach(function (el) {
        gsap.fromTo(el, { y: 26 }, {
          y: -26, ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: .8 }
        });
      });
    }
  } catch (err) {
    toStatic();
  }
})();
