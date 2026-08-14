/* MatchPoint 产品页 v1 · 安静动效:标题升起/淡入/英雄图浮现/按钮磁吸。
   流程动图为 CSS/SMIL 驱动,JS 异常不影响。reduced-motion 全静。 */
(function () {
  "use strict";
  var doc = document.documentElement;
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.remove("motion-pending");

  /* 双语切换 */
  var LANG_KEY = "mpPageLang";
  var langBtn = document.getElementById("mp-lang");
  var swapEls = [];
  document.querySelectorAll("[data-en]").forEach(function (el) {
    swapEls.push({ el: el, zh: el.textContent, en: el.getAttribute("data-en") });
  });
  function setLang(lang) {
    swapEls.forEach(function (it) { it.el.textContent = lang === "en" ? it.en : it.zh; });
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

  var nav = document.getElementById("mp-nav");
  addEventListener("scroll", function () {
    nav.classList.toggle("scrolled", scrollY > 8);
  }, { passive: true });

  function toStatic() { doc.classList.remove("fx"); doc.classList.add("no-fx"); }
  if (RM || !window.gsap || !window.ScrollTrigger) { toStatic(); return; }

  try {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    doc.classList.add("fx");

    var lines = gsap.utils.toArray(".mp-h0 .ln");
    gsap.set(lines, { yPercent: 110 });
    gsap.to(lines, { yPercent: 0, duration: 1, ease: "power4.out", stagger: .1, delay: .12 });
    var shot = document.querySelector(".mp-hero-shot");
    if (shot) requestAnimationFrame(function () { shot.classList.add("shown"); });

    gsap.utils.toArray(".rv").forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: .8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true }
      });
    });

    if (matchMedia("(pointer: fine)").matches) {
      gsap.utils.toArray(".mp-pill").forEach(function (btn) {
        btn.addEventListener("pointermove", function (e) {
          var r = btn.getBoundingClientRect();
          btn.style.translate = ((e.clientX - r.left - r.width / 2) / r.width * 6).toFixed(1) + "px " +
                                ((e.clientY - r.top - r.height / 2) / r.height * 4).toFixed(1) + "px";
        });
        btn.addEventListener("pointerleave", function () { btn.style.translate = "0px 0px"; });
      });
    }
  } catch (err) {
    toStatic();
  }
})();
