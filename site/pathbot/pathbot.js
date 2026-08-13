/* PathBot 产品页 v5 · noetik 式安静动效
   词汇表刻意收窄:标题遮罩升起 / 元素淡入上移 / 数字滚动 / 仪表注入 / 判决轮换(纯换字)。
   无弹跳、无印章、无视差 — 与克隆对象的 .2s/.3s 过渡语汇一致。
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

    /* ── 开卷:标题逐行从遮罩下升起 ── */
    var lines = gsap.utils.toArray(".pb-h0 .ln, .pb-h0-en");
    gsap.set(lines, { yPercent: 110 });
    gsap.to(lines, { yPercent: 0, duration: 1, ease: "power4.out", stagger: .1, delay: .15 });

    /* ── 通用揭示:安静淡入 ── */
    gsap.utils.toArray(".rv").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: .8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true }
      });
    });

    /* ── 数字滚动 ── */
    gsap.utils.toArray("[data-count]").forEach(function (el) {
      var target = parseInt(el.dataset.count, 10);
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 1.6, ease: "power3.out",
            onUpdate: function () { el.textContent = Math.round(obj.v); }
          });
        }
      });
    });

    /* ── 分诊三行判决词:顺次淡现 ── */
    var verdictWords = gsap.utils.toArray(".pb-stamp-s");
    if (verdictWords.length) {
      gsap.set(verdictWords, { opacity: 0 });
      ScrollTrigger.create({
        trigger: ".pb-triage", start: "top 82%", once: true,
        onEnter: function () {
          gsap.to(verdictWords, { opacity: 1, duration: .3, stagger: .25, ease: "none" });
        }
      });
    }

    /* ── 仪表注入 + 数值 ── */
    gsap.utils.toArray(".pb-meter-bar").forEach(function (bar) {
      ScrollTrigger.create({
        trigger: bar, start: "top 86%", once: true,
        onEnter: function () {
          gsap.to(bar, { width: bar.dataset.fill + "%", duration: 1.4, ease: "power3.out" });
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
            v: target, duration: 1.4, ease: "power3.out",
            onUpdate: function () { el.textContent = obj.v.toFixed(2); }
          });
        }
      });
    });

    /* ── 判决轮换:纯换字换色,不弹跳 ── */
    var chip = document.getElementById("pb-vchip");
    if (chip) {
      var STATES = [["CONFIDENT", "v-pass"], ["ANOMALY FLAG", "v-warn"], ["INDETERMINATE", "v-indet"], ["ESCALATE", "v-esc"]];
      var si = 0;
      setInterval(function () {
        if (document.hidden) return;
        si = (si + 1) % STATES.length;
        chip.textContent = STATES[si][0];
        chip.className = STATES[si][1];
      }, 2800);
    }
  } catch (err) {
    toStatic();
  }
})();
