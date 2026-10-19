(function () {
  "use strict";

  var html = document.documentElement;
  var reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lang = "zh";
  try { lang = localStorage.getItem("pbPageLang") === "en" ? "en" : "zh"; } catch (error) {}

  var scenarios = {
    confident: {
      verdict: "CONFIDENT", beta: 0.91, kappa: 0.87, focus: "ROI 04 · TRACE OK",
      gates: ["good", "good", "good", "good", "good"],
      zh: {
        status: ["通过", "通过", "通过", "通过", "就绪"],
        reason: "流程完整，反事实替换后回答随证据改变；当前轨迹没有发现越界或证据脱钩。",
        next: "允许生成带引用的研究报告，交病理医生复核。"
      },
      en: {
        status: ["PASS", "PASS", "PASS", "PASS", "READY"],
        reason: "The declared workflow holds, and the answer changes when its evidence changes. No boundary breach or evidence detachment is detected.",
        next: "Allow a cited research report to proceed to pathologist review."
      }
    },
    anomaly: {
      verdict: "ANOMALY FLAG", beta: 0.61, kappa: 0.84, focus: "STEP 03 · PATH DRIFT",
      gates: ["good", "good", "warn", "good", "warn"],
      zh: {
        status: ["通过", "通过", "偏离", "通过", "待复核"],
        reason: "证据仍然有效，但工具调用顺序偏离声明流程；异常已定位到第三步。",
        next: "暂停受影响步骤，保留已有结果，复核轨迹后决定是否重跑。"
      },
      en: {
        status: ["PASS", "PASS", "DRIFT", "PASS", "REVIEW"],
        reason: "The evidence still holds, but the tool order departs from the declared workflow. The deviation is isolated to step three.",
        next: "Pause the affected step, retain prior results, and review the trace before rerunning."
      }
    },
    escalate: {
      verdict: "ESCALATE", beta: 0.86, kappa: 0.29, focus: "EVIDENCE · LINK BROKEN",
      gates: ["good", "good", "good", "stop", "stop"],
      zh: {
        status: ["通过", "通过", "通过", "失真", "交给人"],
        reason: "流程表面完整，但替换关键证据后回答几乎不变；结论与证据可能已经脱钩。",
        next: "停止自动结论，连同原始证据和完整轨迹立即升级给人工。"
      },
      en: {
        status: ["PASS", "PASS", "PASS", "FAILED", "HUMAN"],
        reason: "The workflow looks intact, yet the answer barely changes when key evidence is replaced. The conclusion may be detached from its evidence.",
        next: "Block the automated conclusion and hand the evidence plus full trace to a human."
      }
    },
    indeterminate: {
      verdict: "INDETERMINATE", beta: 0.32, kappa: 0.26, focus: "FIELD · INSUFFICIENT",
      gates: ["warn", "warn", "stop", "stop", "good"],
      zh: {
        status: ["不足", "待定", "中止", "不足", "已记录"],
        reason: "输入质量、流程符合度和证据忠实度同时不足，没有可靠基础支持结论。",
        next: "不给答案；记录不确定原因，并请求补充材料或人工判读。"
      },
      en: {
        status: ["WEAK", "UNCLEAR", "STOP", "WEAK", "LOGGED"],
        reason: "Input quality, process conformance, and evidence faithfulness are all too weak to support a reliable conclusion.",
        next: "Return no answer, record why, and request more material or human review."
      }
    }
  };

  var langButton = document.getElementById("lang-toggle");
  var staticSwaps = [];
  document.querySelectorAll("[data-en]").forEach(function (element) {
    staticSwaps.push({ element: element, zh: element.textContent, en: element.getAttribute("data-en") });
  });
  document.querySelectorAll("[data-en-html]").forEach(function (element) {
    staticSwaps.push({ element: element, zh: element.innerHTML, en: element.getAttribute("data-en-html"), html: true });
  });

  var activeScenario = "confident";
  var lab = document.querySelector(".lab");
  var verdict = document.getElementById("verdict");
  var beta = document.getElementById("beta");
  var kappa = document.getElementById("kappa");
  var betaValue = document.getElementById("beta-value");
  var kappaValue = document.getElementById("kappa-value");
  var reason = document.getElementById("reason");
  var nextAction = document.getElementById("next-action");
  var focusLabel = document.getElementById("focus-label");
  var gateItems = Array.prototype.slice.call(document.querySelectorAll(".gates li"));

  function setLanguage(nextLanguage) {
    lang = nextLanguage;
    staticSwaps.forEach(function (swap) {
      var content = lang === "en" ? swap.en : swap.zh;
      if (swap.html) swap.element.innerHTML = content;
      else swap.element.textContent = content;
    });
    html.lang = lang === "en" ? "en" : "zh-CN";
    langButton.textContent = lang === "en" ? "中" : "EN";
    try { localStorage.setItem("pbPageLang", lang); } catch (error) {}
    renderScenario(activeScenario);
  }

  function renderScenario(name) {
    activeScenario = name;
    var scenario = scenarios[name];
    var copy = scenario[lang];
    lab.dataset.state = name;
    verdict.textContent = scenario.verdict;
    beta.value = scenario.beta;
    kappa.value = scenario.kappa;
    betaValue.textContent = scenario.beta.toFixed(2);
    kappaValue.textContent = scenario.kappa.toFixed(2);
    reason.textContent = copy.reason;
    nextAction.textContent = copy.next;
    focusLabel.textContent = scenario.focus;
    verdict.className = "verdict " + name;
    gateItems.forEach(function (item, index) {
      item.className = scenario.gates[index];
      item.querySelector("i").textContent = copy.status[index];
    });
    document.querySelectorAll("[data-scenario]").forEach(function (button) {
      button.setAttribute("aria-selected", String(button.dataset.scenario === name));
    });
    drawField();
  }

  document.querySelectorAll("[data-scenario]").forEach(function (button) {
    button.addEventListener("click", function () { renderScenario(button.dataset.scenario); });
    button.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-scenario]"));
      var step = event.key === "ArrowRight" ? 1 : -1;
      var next = buttons[(buttons.indexOf(button) + step + buttons.length) % buttons.length];
      next.focus();
      next.click();
    });
  });
  langButton.addEventListener("click", function () { setLanguage(lang === "en" ? "zh" : "en"); });

  var canvas = document.getElementById("case-map");
  var context = canvas.getContext("2d");
  var cells = [];
  var pointer = { x: 0.62, y: 0.42, active: false };
  var palette = ["#1b8f59", "#a3304b", "#536ec6", "#a85f2f", "#62586a"];
  var seed = 20260906;
  function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (var index = 0; index < 92; index += 1) {
    cells.push({ x: random(), y: random(), radius: .006 + random() * .014, color: palette[Math.floor(random() * palette.length)] });
  }

  function drawField(time) {
    var width = canvas.width;
    var height = canvas.height;
    var ctx = context;
    var stateIndex = ["confident", "anomaly", "escalate", "indeterminate"].indexOf(activeScenario);
    ctx.clearRect(0, 0, width, height);
    var wash = ctx.createRadialGradient(width * .58, height * .42, 0, width * .58, height * .42, width * .7);
    wash.addColorStop(0, "#101719");
    wash.addColorStop(1, "#020303");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    cells.forEach(function (cell, cellIndex) {
      var x = cell.x * width;
      var y = cell.y * height;
      var radius = cell.radius * width;
      ctx.globalAlpha = activeScenario === "indeterminate" ? .42 : .72;
      ctx.fillStyle = cell.color;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.5, radius, cellIndex * .37, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = .58;
      ctx.fillStyle = "#9776b8";
      ctx.beginPath();
      ctx.arc(x, y, radius * .34, 0, Math.PI * 2);
      ctx.fill();
    });

    var route = [[.16, .66], [.34, .44], [.53, .57], [.72, .32], [.86, .45]];
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(2, width / 420);
    ctx.strokeStyle = activeScenario === "confident" ? "#1bce71" : activeScenario === "anomaly" ? "#fcdd45" : activeScenario === "escalate" ? "#ff205f" : "#6d86e8";
    ctx.setLineDash(activeScenario === "escalate" ? [12, 10] : activeScenario === "indeterminate" ? [3, 12] : []);
    ctx.beginPath();
    route.forEach(function (point, routeIndex) {
      var x = point[0] * width;
      var y = point[1] * height;
      if (routeIndex === 0) ctx.moveTo(x, y);
      else if (!(activeScenario === "escalate" && routeIndex === 4)) ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    route.forEach(function (point, routeIndex) {
      ctx.fillStyle = routeIndex <= (4 - stateIndex) ? ctx.strokeStyle : "#3e4243";
      ctx.beginPath();
      ctx.arc(point[0] * width, point[1] * height, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    var scanX = reducedMotion ? .46 : ((time || 0) / 9000) % 1;
    ctx.globalAlpha = .34;
    ctx.strokeStyle = "#e8e2da";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scanX * width, 0);
    ctx.lineTo(scanX * width, height);
    ctx.stroke();

    if (pointer.active) {
      ctx.globalAlpha = .95;
      ctx.strokeStyle = "#e8e2da";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pointer.x * width, pointer.y * height, width * .075, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pointer.x * width - 12, pointer.y * height);
      ctx.lineTo(pointer.x * width + 12, pointer.y * height);
      ctx.moveTo(pointer.x * width, pointer.y * height - 12);
      ctx.lineTo(pointer.x * width, pointer.y * height + 12);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function updatePointer(event) {
    var bounds = canvas.getBoundingClientRect();
    pointer.x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    pointer.y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    pointer.active = true;
    drawField(performance.now());
  }
  canvas.addEventListener("pointermove", updatePointer, { passive: true });
  canvas.addEventListener("pointerdown", updatePointer, { passive: true });
  canvas.addEventListener("pointerleave", function () { pointer.active = false; });

  var animationFrame = 0;
  function animate(time) {
    drawField(time);
    animationFrame = requestAnimationFrame(animate);
  }
  function startCanvas() {
    if (!reducedMotion && !document.hidden && !animationFrame) animationFrame = requestAnimationFrame(animate);
  }
  function stopCanvas() {
    if (!animationFrame) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
  if (reducedMotion) {
    drawField(0);
  } else if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? startCanvas() : stopCanvas();
    }, { threshold: .05 }).observe(canvas);
    document.addEventListener("visibilitychange", function () { document.hidden ? stopCanvas() : startCanvas(); });
  } else {
    startCanvas();
  }

  var video = document.getElementById("tissue-loop");
  if (reducedMotion) {
    video.pause();
    video.removeAttribute("autoplay");
  } else if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.isIntersecting ? video.play().catch(function () {}) : video.pause(); });
    }, { threshold: .15 }).observe(video);
  }

  setLanguage(lang);
})();
