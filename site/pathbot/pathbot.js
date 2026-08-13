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
    // 大标题带 <em> 高亮,整行按 HTML 交换
    document.querySelectorAll("[data-en-html]").forEach(function (el) {
      swapEls.push({ el: el, zh: el.innerHTML, en: el.getAttribute("data-en-html"), html: true });
    });
    return swapEls;
  }
  function setLang(lang) {
    if (window.pbChatFinish) window.pbChatFinish();
    collectSwap().forEach(function (it) {
      var v = lang === "en" ? it.en : it.zh;
      if (it.html) it.el.innerHTML = v; else it.el.textContent = v;
    });
    doc.setAttribute("lang", lang === "en" ? "en" : "zh-CN");
    langBtn.textContent = lang === "en" ? "中" : "EN";
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }
  collectSwap();  // 开机即快照原文,防打字动画污染缓存
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
        trigger: el, start: "top 92%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 0.9, ease: "power3.out",
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
        trigger: bar, start: "top 94%", once: true,
        onEnter: function () {
          gsap.to(bar, { width: bar.dataset.fill + "%", duration: 0.9, ease: "power3.out" });
        }
      });
    });
    gsap.utils.toArray("[data-mval]").forEach(function (el) {
      var target = parseFloat(el.dataset.mval);
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 94%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 0.9, ease: "power3.out",
            onUpdate: function () { el.textContent = obj.v.toFixed(2); }
          });
        }
      });
    });

    /* ── 会诊对话:医生行整行现,PathBot 行逐字打出 ── */
    (function chat() {
      var box = document.getElementById("pb-chat");
      if (!box) return;
      var rows = gsap.utils.toArray(box.querySelectorAll(".pb-chat-row"));
      var timers = [];
      var done = false;
      function finishAll() {
        if (done) return;
        done = true;
        timers.forEach(clearTimeout);
        rows.forEach(function (r) {
          r.classList.add("shown");
          var m = r.querySelector(".pb-chat-msg");
          if (m.dataset.full != null) { m.textContent = m.dataset.full; delete m.dataset.full; }
          var c = m.querySelector(".pb-caret");
          if (c) c.remove();
        });
      }
      window.pbChatFinish = finishAll;   // 语言切换前先收尾,防止半行文本被快照
      function typeRow(i) {
        if (done || i >= rows.length) { done = true; return; }
        var row = rows[i];
        var msg = row.querySelector(".pb-chat-msg");
        row.classList.add("shown");
        if (!row.classList.contains("is-bot")) {
          timers.push(setTimeout(function () { typeRow(i + 1); }, 620));
          return;
        }
        var full = msg.textContent;
        msg.dataset.full = full;
        msg.textContent = "";
        var caret = document.createElement("i");
        caret.className = "pb-caret";
        msg.appendChild(caret);
        var n = 0;
        (function tick() {
          if (done) return;
          n += 1 + (full.length > 60 ? 1 : 0);      // 长句双倍速
          if (n >= full.length) {
            msg.textContent = full;
            delete msg.dataset.full;
            timers.push(setTimeout(function () { typeRow(i + 1); }, 480));
            return;
          }
          msg.textContent = full.slice(0, n);
          msg.appendChild(caret);
          timers.push(setTimeout(tick, 24));
        })();
      }
      ScrollTrigger.create({
        trigger: box, start: "top 78%", once: true,
        onEnter: function () { typeRow(0); }
      });
    })();

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
