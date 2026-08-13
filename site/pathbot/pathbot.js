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

    /* ── 通用揭示:安静淡入;完成后打 seen,眉线自绘 ── */
    gsap.utils.toArray(".rv").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: .8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 105%", once: true },
        onComplete: function () { el.classList.add("seen"); }
      });
    });

    /* ── 英雄录屏:滚动中极缓的呼吸缩放 ── */
    var hv = document.getElementById("pb-heroloop");
    if (hv) {
      gsap.fromTo(hv, { scale: 1.045 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: hv, start: "top bottom", end: "bottom top", scrub: .6 }
      });
    }

    /* ── 桌面按钮磁吸:指针靠近轻轻贴过来 ── */
    if (matchMedia("(pointer: fine)").matches) {
      gsap.utils.toArray(".pb-pill, .pb-nav-cta").forEach(function (btn) {
        btn.addEventListener("pointermove", function (e) {
          var r = btn.getBoundingClientRect();
          var dx = (e.clientX - r.left - r.width / 2) / r.width;
          var dy = (e.clientY - r.top - r.height / 2) / r.height;
          btn.style.translate = (dx * 6).toFixed(1) + "px " + (dy * 4).toFixed(1) + "px";
        });
        btn.addEventListener("pointerleave", function () { btn.style.translate = "0px 0px"; });
      });
    }

    /* ── 数字滚动;20/20 大数字带弹性放大(页面的重音) ── */
    gsap.utils.toArray("[data-count]").forEach(function (el) {
      var target = parseInt(el.dataset.count, 10);
      var big = !!el.closest(".pb-blank-big");
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 92%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 0.5, ease: "power3.out",
            onUpdate: function () { el.textContent = Math.round(obj.v); }
          });
          if (big) {
            gsap.fromTo(el, { scale: .8, transformOrigin: "left 80%" },
              { scale: 1, duration: .9, ease: "back.out(1.4)" });
            var den = el.parentElement.querySelector("span");
            if (den) gsap.fromTo(den, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: .5, delay: .55 });
          }
        }
      });
    });

    /* ── 分诊三行:行自右滑入,判决词随后亮起 ── */
    var triageRows = gsap.utils.toArray(".pb-triage-row");
    var verdictWords = gsap.utils.toArray(".pb-stamp-s");
    if (triageRows.length) {
      gsap.set(triageRows, { opacity: 0, x: 18 });
      gsap.set(verdictWords, { opacity: 0 });
      ScrollTrigger.create({
        trigger: ".pb-triage", start: "top 82%", once: true,
        onEnter: function () {
          gsap.to(triageRows, { opacity: 1, x: 0, duration: .55, stagger: .16, ease: "power2.out" });
          gsap.to(verdictWords, { opacity: 1, duration: .25, stagger: .16, delay: .12, ease: "none" });
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
      // 数值与判决词必须永远同帧一致:不做逐帧计数,入场即落定
      ScrollTrigger.create({
        trigger: el, start: "top 94%", once: true,
        onEnter: function () { el.textContent = parseFloat(el.dataset.mval).toFixed(2); }
      });
    });

    /* ── 会诊对话:气泡剧场。医生泡弹出→打字点→PathBot 泡展开 ── */
    (function chat() {
      var box = document.getElementById("pb-chat");
      if (!box) return;
      var rows = gsap.utils.toArray(box.querySelectorAll(".pb-bub-row"));
      var timers = [];
      var done = false;
      function springIn(el, d) {
        gsap.fromTo(el, { opacity: 0, y: 16, scale: .96 },
          { opacity: 1, y: 0, scale: 1, duration: d || .5, ease: "back.out(1.5)", overwrite: true });
      }
      function finishAll() {
        if (done) return;
        done = true;
        timers.forEach(clearTimeout);
        rows.forEach(function (r) {
          gsap.set(r, { opacity: 1, y: 0, scale: 1 });
          var dots = r.querySelector(".pb-dots");
          if (dots && r.dataset.msg != null) {
            r.querySelector(".pb-bub").textContent = r.dataset.msg;
            delete r.dataset.msg;
          }
          var tag = r.querySelector(".pb-bub-tag");
          if (tag) gsap.set(tag, { opacity: 1 });
        });
      }
      window.pbChatFinish = finishAll;
      function playRow(i) {
        if (done || i >= rows.length) { done = true; return; }
        var row = rows[i];
        var bub = row.querySelector(".pb-bub");
        var tag = row.querySelector(".pb-bub-tag");
        if (!row.classList.contains("from-bot")) {
          springIn(row);
          timers.push(setTimeout(function () { playRow(i + 1); }, 380));
          return;
        }
        // PathBot:先以打字点现身,再换正文,标签最后浮现
        var msg = bub.textContent;
        row.dataset.msg = msg;
        bub.textContent = "";
        var dots = document.createElement("span");
        dots.className = "pb-dots";
        dots.innerHTML = "<i></i><i></i><i></i>";
        bub.appendChild(dots);
        if (tag) gsap.set(tag, { opacity: 0 });
        springIn(row);
        timers.push(setTimeout(function () {
          if (done) return;
          delete row.dataset.msg;
          bub.textContent = msg;
          springIn(bub, .4);
          if (tag) gsap.to(tag, { opacity: 1, duration: .4, delay: .25 });
          if (msg.indexOf("REFUSE") === 0) {
            gsap.fromTo(bub, { textShadow: "0 0 22px rgba(255,32,95,.9)" },
              { textShadow: "0 0 0px rgba(255,32,95,0)", duration: 1.5, ease: "power2.out" });
          }
          timers.push(setTimeout(function () { playRow(i + 1); }, 400));
        }, 520));
      }
      ScrollTrigger.create({
        trigger: box, start: "top 88%", once: true,
        onEnter: function () { playRow(0); }
      });
    })();

    /* ── CoFaCT 循环:数值、注条、判决词同步换"病例",不再各说各话 ── */
    var chip = document.getElementById("pb-vchip");
    var barB = document.getElementById("pb-bar-b"), barK = document.getElementById("pb-bar-k");
    var valB = document.getElementById("pb-val-b"), valK = document.getElementById("pb-val-k");
    if (chip && barB && barK) {
      var CASES = [
        { b: 0.82, k: 0.74, w: "CONFIDENT", c: "v-pass" },
        { b: 0.66, k: 0.71, w: "ANOMALY FLAG", c: "v-warn" },
        { b: 0.41, k: 0.35, w: "INDETERMINATE", c: "v-indet" },
        { b: 0.72, k: 0.22, w: "ESCALATE", c: "v-esc" }
      ];
      var ci = 0;
      var looping = false;
      ScrollTrigger.create({
        trigger: chip, start: "top 92%", once: true,
        onEnter: function () { setTimeout(function () { looping = true; }, 2400); }
      });
      setInterval(function () {
        if (document.hidden || !looping) return;
        ci = (ci + 1) % CASES.length;
        var cs = CASES[ci];
        gsap.to(barB, { width: cs.b * 100 + "%", duration: .35, ease: "power2.out" });
        gsap.to(barK, { width: cs.k * 100 + "%", duration: .35, ease: "power2.out" });
        valB.textContent = cs.b.toFixed(2);
        valK.textContent = cs.k.toFixed(2);
        chip.textContent = cs.w;
        chip.className = cs.c;
      }, 3200);
    }

  } catch (err) {
    toStatic();
  }
})();
