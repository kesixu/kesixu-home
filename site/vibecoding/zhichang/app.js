const $ = (query, root = document) => root.querySelector(query);
const $$ = (query, root = document) => [...root.querySelectorAll(query)];
const icon = (name) =>
  `<span class="icon" aria-hidden="true" style="--icon:url(assets/icons/${name}.svg)"></span>`;
const routes = {
  a: {
    name: "先私下核对",
    short: "先问清分工和记录",
    mobile: "先确认分工，给对方解释的空间。",
    title: "先核对分工，再决定是否公开说明",
    body: "先带着交付记录，确认对方如何理解分工，避免一开始就争论归属。",
    quote: "这次周报里没有写到我负责的部分，我想和你核对一下分工。",
    outcomes: ["认可并补充", "暂时未确认"],
    unknown: "对方是否只是遗漏",
  },
  b: {
    name: "组会上补充",
    short: "说明贡献，也可能有分歧",
    mobile: "让更多人了解，也可能引发讨论。",
    title: "围绕具体交付，把贡献说清楚",
    body: "先补充你负责的工作与交付结果，给对方解释的空间，避免把讨论直接变成归属争议。",
    quote: "我补充一下这部分的分工：其中的数据整理和交付由我负责。",
    outcomes: ["获得理解", "引发讨论"],
    unknown: "现场氛围与他人反应",
  },
  c: {
    name: "暂时不回应",
    short: "先收集信息 · 遗漏可能延续",
    mobile: "先收集信息，遗漏可能延续。",
    title: "暂缓回应，也给自己留一个期限",
    body: "整理已有交付记录，观察下一次信息是否得到补充。如果遗漏延续，再考虑主动沟通。",
    quote: "先把我负责的部分和交付时间整理好，在下次周报前再核对一次。",
    outcomes: ["后续得到补充", "遗漏继续存在"],
    unknown: "遗漏是否影响后续评价",
  },
};
const names = {
  chat: "对话",
  decision: "推演",
  relations: "棋盘",
  records: "记录",
  library: "锦囊",
  settings: "偏好与说明",
};
const state = {
  view: "decision",
  route: "a",
  model: "日常",
  saved: [],
  messages: [],
  inspectorClosed: false,
};
const shell = $(".app-shell"),
  pane = $("#pane"),
  sheet = $("#sheet"),
  composer = $("#composer");
let toastTimer;
function notify(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 3500);
}
function loadLocation() {
  const params = new URLSearchParams(location.search);
  state.view = Object.hasOwn(names, params.get("view"))
    ? params.get("view")
    : matchMedia("(max-width:760px)").matches
      ? "chat"
      : "decision";
  state.route = Object.hasOwn(routes, params.get("route"))
    ? params.get("route")
    : "a";
}
function setView(view, { push = true } = {}) {
  if (!Object.hasOwn(names, view)) return;
  state.view = view;
  state.inspectorClosed = false;
  if (push) {
    const url = new URL(location.href);
    url.searchParams.set("view", view);
    url.searchParams.set("route", state.route);
    history.pushState(null, "", url);
  }
  render();
  pane.scrollTop = 0;
  pane.focus({ preventScroll: true });
}
function headingPhrases(text) {
  return text
    .match(/[^，]+，?/gu)
    .map((phrase) => {
      const span = document.createElement("span");
      span.className = "type-phrase";
      span.textContent = phrase;
      return span.outerHTML;
    })
    .join("<wbr>");
}
function pageHeading(eyebrow, title, description = "") {
  return `<div class="page-heading"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${description ? `<p>${description}</p>` : ""}</div>`;
}
function routeDetails(mobile = false) {
  const r = routes[state.route],
    saved = state.saved.some((item) => item.route === state.route);
  return `<div class="recommendation"><span class="tag gold">${icon("check-circle")}当前选择 · 方案 ${state.route.toUpperCase()}</span><h3>${headingPhrases(r.title)}</h3><p>${r.body}</p><hr class="rule"><h4 class="quote-title">${mobile ? "这一步怎么开口" : "可以这样开口"}</h4><blockquote class="quote has-copy">“${r.quote}”<button class="icon-button" data-copy="quote" aria-label="复制建议话术">${icon("copy")}</button></blockquote><details class="evidence-details" ${mobile ? "" : "open"}><summary>${icon("file-text")}有记录支持 · 2 条<span class="caret icon" style="--icon:url(assets/icons/caret-down.svg)"></span></summary><div class="detail-copy">交付记录中有你的工作内容，可以先基于这些记录和对方核对。<br><button data-dialog="sources">查看依据与待确认</button></div></details><details class="evidence-details"><summary>${icon("warning-circle")}仍待确认<span class="caret icon" style="--icon:url(assets/icons/caret-down.svg)"></span></summary><p class="detail-copy">${r.unknown}。目前的记录不足以直接判断动机。</p></details><button class="button save-action" data-save="${state.route}" ${saved ? "disabled" : ""}>${saved ? "已记入演示记录" : "保存这条行动"}${icon(saved ? "check" : "arrow-right")}</button><button class="compare-link" data-compare>继续比较其他走法</button></div>`;
}
function decision() {
  const nodes = Object.entries(routes)
    .map(
      ([key, r]) =>
        `<button class="graph-node" data-route="${key}" aria-pressed="${state.route === key}"><span class="node-letter">${key.toUpperCase()}</span><span><strong>${r.name}</strong><small>${r.short}</small></span></button>`,
    )
    .join("");
  const outcomes = Object.entries(routes)
    .map(
      ([key, r]) =>
        `<div class="graph-outcomes" data-key="${key}">${r.outcomes.map((text) => `<p>${text}<span>可能结果 · 待验证</span></p>`).join("")}</div>`,
    )
    .join("");
  const paths = Object.entries({ a: 14, b: 50, c: 86 })
    .map(
      ([key, y]) =>
        `<path class="${state.route === key ? "selected" : ""}" d="M19 50 H23 C27 50 26 ${y} 31 ${y}"/><path class="response ${state.route === key ? "selected" : ""}" d="M62 ${y} H67 C70 ${y} 69 ${y - 7} 74 ${y - 7} M67 ${y} C70 ${y} 69 ${y + 7} 74 ${y + 7}"/>`,
    )
    .join("");
  return `<section class="decision-page"><div class="page-subnav"><button data-view="relations">关系棋盘</button><button aria-pressed="true" data-view="decision">推演</button></div>${pageHeading("上下文 · P1 · 本周周报", '<span class="desktop-title">周报里，我的贡献被写漏了</span><span class="phone-title">先比较，再落子</span>', "先看清几种走法，再决定下一步。")}<div class="decision-graph" aria-label="周报遗漏情境的三种走法"><div class="graph-headings"><span>眼前的事</span><span>可以怎么做</span><span>可能的回应</span></div><div class="graph-body"><svg class="graph-lines" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">${paths}</svg><div class="graph-root">周报遗漏了<br>我的贡献</div>${nodes}${outcomes}</div><div class="graph-legend"><span><b>金色</b>：当前选择</span><span>虚线：可能的回应</span></div></div><div class="mobile-routes" aria-label="比较三种走法">${Object.entries(
    routes,
  )
    .map(
      ([key, r]) =>
        `<button class="mobile-route" data-route="${key}" aria-pressed="${key === state.route}"><span class="route-marker">${key.toUpperCase()}</span><span><strong>${r.name}</strong><p>${r.mobile}</p>${key === state.route ? '<span class="selected-caption">当前选择</span>' : ""}</span></button>`,
    )
    .join(
      "",
    )}</div><section class="mobile-action-detail" aria-label="当前走法详情">${routeDetails(true)}</section><button class="button secondary reopen-inspector" data-reopen hidden>展开这条走法</button></section>`;
}
function chat() {
  return `<section class="chat-page">${pageHeading("你的私人职场参谋", "今天，聊聊哪一步")}<div class="user-message">周报里没写我负责的部分，P1 是不是故意的？</div><div class="assistant-label"><img src="assets/brand.png" alt="" width="28" height="28"><span>参谋 · 演示回答</span></div><p class="assistant-answer">仅凭这次遗漏，还不能判断是不是故意。先核对分工和交付记录，再决定是否需要公开补充。<button class="citation" data-dialog="sources" aria-label="查看这句话的依据">1</button></p><span class="tag caution answer-tag">${icon("warning-circle")}推测待确认</span><div class="next-step"><h2><span>下一步</span> · 先私下核对</h2><p>“我想核对一下，这次周报里的分工<span class="type-phrase">是怎么整理的？”</span></p><button class="button" data-view="decision">看三种走法${icon("arrow-right")}</button></div><button class="disclosure-button" data-dialog="sources">${icon("file-text")}依据与待确认 · 2 项${icon("caret-down")}</button><button class="disclosure-button" data-dialog="strategy">${icon("book-open")}相关锦囊 · 沟通前先确认事实${icon("caret-down")}</button><div class="message-actions"><button data-save="a">${icon("file-text")}记下</button><button data-copy="answer">${icon("copy")}复制</button><button data-dialog="feedback">${icon("chat-circle-dots")}反馈</button></div><div id="session-messages"></div></section>`;
}
function records() {
  return `<section class="content-page">${pageHeading("把经历留下，让判断有来路", "记录", "本页是本次演示的临时记录，刷新后会清空。")}<article class="record-row">${icon("file-text")}<div><h2>周报未提及我的交付</h2><p>演示资料中的周报没有写到我负责的部分；还不能据此判断 P1 的动机。</p><span class="tag">演示资料 · 待核对</span></div><button class="icon-button" data-dialog="sources" aria-label="展开周报依据">${icon("caret-right")}</button></article><div id="saved-records"></div>${state.saved.length ? "" : `<div class="empty-state"><h2>把下一步，记在这里</h2><p>选择一条走法后，保存的行动会出现在这份演示记录里。</p><button class="button secondary" data-view="decision">回到推演${icon("arrow-right")}</button></div>`}</section>`;
}
function relations() {
  return `<section class="content-page"><div class="page-subnav"><button aria-pressed="true" data-view="relations">关系棋盘</button><button data-view="decision">推演</button></div>${pageHeading("身边的人，是事情的一部分", "先认识人，再看清局势", "这是演示人物列表。关系远近与态度需要依据，不能凭空判断。")}<div class="profile-list">${[
    ["P1", "同组同事", "周报中的分工待核对"],
    ["P2", "直属上级", "了解团队工作安排"],
    ["P3", "跨部门同事", "参与项目协作"],
  ]
    .map(
      ([code, role, note]) =>
        `<button class="person-button" data-person="${code}"><span class="person-code">${code}</span><span><strong>${role}</strong><small>${note}</small></span></button>`,
    )
    .join(
      "",
    )}</div><hr class="rule"><p class="muted">从一条记录开始，而不是急着给一个人下判断。</p><button class="text-link" data-view="records" style="border:0;background:transparent;margin-top:16px">看看已有记录${icon("arrow-right")}</button></section>`;
}
function library() {
  return `<section class="content-page">${pageHeading("在需要的时候，多一个思路", "锦囊", "先了解适用情境，再决定一句建议能不能用在自己身上。")}<article class="record-row">${icon("book-open")}<div><h2>沟通前，先确认事实</h2><p>把看到的事情、自己的判断和仍待确认的地方分开，再组织一次沟通。</p><span class="tag">交互演示 · 非文献引用</span></div><button class="icon-button" data-dialog="strategy" aria-label="展开沟通锦囊">${icon("caret-right")}</button></article></section>`;
}
function settings() {
  return `<section class="content-page">${pageHeading("让工作空间适合你", "偏好与说明")}<div class="setting-row"><div><h2>思考档位</h2><p>预览选项，不会调用模型或产生费用。</p></div><button class="button secondary" data-dialog="model">${state.model}${icon("caret-down")}</button></div><div class="setting-row"><div><h2>减少动态效果</h2><p>同时遵循设备的“减少动态效果”设置。</p></div><label><span class="sr-only">减少动态效果</span><input id="reduce-motion" type="checkbox" ${document.documentElement.classList.contains("reduce-motion") ? "checked" : ""}></label></div><div class="setting-row"><div><h2>演示数据</h2><p>所有人物均为代号。输入与行动仅保留在本次页面会话中。</p></div><button class="button secondary" data-reset>清空演示输入</button></div><div class="setting-row"><div><h2>关于这份预览</h2><p>用于检查视觉与交互，不连接真实账户、AI 或产品数据库。</p></div><a class="button secondary" href="index.html">产品介绍</a></div></section>`;
}
function render() {
  shell.dataset.view = state.view;
  document.title = `${names[state.view]} · 职场棋盘`;
  $("#view-name").textContent = names[state.view];
  pane.innerHTML = { decision, chat, records, relations, library, settings }[
    state.view
  ]();
  $("#inspector").innerHTML =
    `<div class="inspector-header"><div><h2>这条路，怎么走</h2><p>方案 ${state.route.toUpperCase()}</p></div><button class="icon-button" data-close-inspector aria-label="收起走法详情">${icon("x")}</button></div>${routeDetails()}`;
  const inspectorActions = document.createElement("div");
  inspectorActions.className = "inspector-actions";
  inspectorActions.append(
    $("#inspector .save-action"),
    $("#inspector .compare-link"),
  );
  $("#inspector").append(inspectorActions);
  $("#inspector").hidden = state.inspectorClosed;
  composer.hidden = !["chat", "decision"].includes(state.view);
  $("#context-label").textContent =
    state.view === "chat" ? "关于 P1 · 周报分工" : "当前推演 · 周报贡献被遗漏";
  $$(".model-trigger").forEach(
    (button) => (button.innerHTML = state.model + icon("caret-down")),
  );
  $$("nav button[data-view]").forEach((button) => {
    const selected =
      button.dataset.view === state.view ||
      (button.closest(".mobile-nav") &&
        button.dataset.view === "decision" &&
        ["relations", "library"].includes(state.view));
    if (selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (state.view === "chat") renderMessages();
  if (state.view === "records") renderRecords();
}
function renderMessages() {
  const root = $("#session-messages");
  if (!root) return;
  root.replaceChildren();
  state.messages.forEach((text) => {
    const wrap = document.createElement("div");
    wrap.className = "session-message";
    const message = document.createElement("div");
    message.className = "user-message";
    message.textContent = text;
    const notice = document.createElement("p");
    notice.className = "session-notice";
    notice.textContent =
      "已加入本次演示背景。当前预览不会生成新的 AI 判断，你可以继续比较三种走法，或查看已有依据。";
    wrap.append(message, notice);
    root.append(wrap);
  });
}
function renderRecords() {
  const root = $("#saved-records");
  if (!root) return;
  state.saved.forEach((item) => {
    const article = document.createElement("article");
    article.className = "record-row";
    article.innerHTML = `${icon("check-circle")}<div><h2></h2><p></p><span class="tag gold">本次演示 · 已记下</span></div><button class="icon-button" aria-label="移除这条演示行动" data-remove="${item.route}">${icon("x")}</button>`;
    $("h2", article).textContent = routes[item.route].name;
    $("p", article).textContent = routes[item.route].quote;
    root.append(article);
  });
}
const sourcesContent = () =>
  `<section class="source-group"><h3>${icon("file-text")}已有记录</h3><div class="source-item"><h4>1 · 演示周报与交付记录</h4><p>周报未提到你负责的部分，交付记录中包含你的工作内容。</p><button data-dialog="original">查看这条记录${icon("arrow-right")}</button></div></section><section class="source-group"><h3>${icon("warning-circle")}仍待确认</h3><div class="source-item"><h4>P1 是否了解完整分工</h4><p>目前没有直接记录，不能据此判断动机。</p></div></section><p class="source-boundary">对方的动机属于推测，建议先核实。</p><button class="button sheet-return" data-close-sheet>返回${state.view === "chat" ? "对话" : "推演"}</button>`;
function openDialog(type, person) {
  let title = "",
    html = "";
  if (type === "sources") {
    title = "依据与待确认";
    html = sourcesContent();
  } else if (type === "original") {
    title = "原始记录 · 演示资料";
    html =
      '<section class="source-group"><h3>周报摘要</h3><div class="source-item"><p>“本周完成项目资料整理与交付。”</p></div></section><section class="source-group"><h3>交付记录摘要</h3><div class="source-item"><p>“你负责整理数据，并完成本次交付。”</p></div></section><p class="source-boundary">以上文本为交互演示素材，不是真实用户记录。</p><button class="button sheet-return" data-dialog="sources">返回依据</button>';
  } else if (type === "model") {
    title = "选择思考档位";
    html = `<div class="model-options">${["日常", "深入"].map((model) => `<button class="model-option" data-model="${model}" aria-pressed="${state.model === model}"><strong>${model}</strong><small>${model === "日常" ? "先理清问题，给出可以继续的一步" : "展开更多走法，比较依据与未知"}</small></button>`).join("")}</div><p class="model-help">这里演示选项的交互，实际模型不会运行。正式产品的换模型确认流程应继续保留。</p>`;
  } else if (type === "strategy") {
    title = "沟通前，先确认事实";
    html =
      '<p>先写清楚你看到了什么，再把自己的判断单独列出来。</p><hr class="rule"><p>可以按这个顺序开口：</p><ol><li>说具体的事情，不先评价动机。</li><li>核对对方掌握的信息是否完整。</li><li>提出一个双方都能确认的下一步。</li></ol><p class="source-boundary">这是用于展示锦囊界面的示例，不作为研究结论或文献引用。</p><button class="button sheet-return" data-close-sheet>回到当前页面</button>';
  } else if (type === "feedback") {
    title = "这句建议，哪里不合适";
    html =
      '<label for="feedback-text">写下你想补充或纠正的地方</label><textarea class="search-input" id="feedback-text" rows="4" maxlength="1000" placeholder="例如：我们已经核对过分工了"></textarea><p class="model-help">反馈只用于当前演示，不会上传。</p><div class="sheet-buttons"><button class="button secondary" data-close-sheet>取消</button><button class="button" data-feedback>记下反馈</button></div>';
  } else if (type === "notice") {
    title = "这是一份交互预览";
    html =
      '<p>你可以比较走法、展开依据、选择思考档位，并把行动存进本次演示的记录。</p><hr class="rule"><p class="muted">所有情境均为示例。当前页面不登录、不调用 AI、不向服务器发送输入，刷新后临时内容会清空。</p><button class="button sheet-return" data-close-sheet>继续体验</button>';
  } else if (type === "person") {
    title = `${person} · 人物资料`;
    html = `<span class="tag">演示人物</span><p style="margin-top:20px">${person === "P1" ? "同组同事，参与本周周报整理。" : "与当前项目有关的协作人物。"}</p><hr class="rule"><h3>从事情里了解一个人</h3><p class="muted" style="margin-top:12px">目前信息有限，不能直接判断态度或动机。可以先核对相关记录。</p><button class="button sheet-return" data-dialog="sources">查看相关记录</button>`;
  } else if (type === "search") {
    title = "搜索演示内容";
    html =
      '<label class="sr-only" for="search-input">搜索演示内容</label><input id="search-input" class="search-input" placeholder="输入周报、记录或锦囊" autocomplete="off"><div class="search-results"></div>';
  }
  $("#sheet-title").textContent = title;
  $("#sheet-body").innerHTML = html;
  if (!sheet.open) sheet.showModal();
  if (type === "search") {
    updateSearch("");
    $("#search-input").focus();
  } else $("#close-sheet").focus();
}
function updateSearch(query) {
  const entries = [
    ["decision", "周报贡献被遗漏", "比较三条走法"],
    ["records", "周报与行动记录", "回看已有依据"],
    ["library", "沟通锦囊", "沟通前先确认事实"],
    ["relations", "人物关系棋盘", "P1、P2、P3"],
  ];
  const root = $(".search-results");
  const found = entries.filter((item) => item.join(" ").includes(query.trim()));
  root.innerHTML = found.length
    ? found
        .map(
          ([view, title, note]) =>
            `<button data-search-view="${view}">${title}<small>${note}</small></button>`,
        )
        .join("")
    : '<p class="muted">没有找到对应的演示内容。</p>';
}
function saveRoute(key) {
  if (!Object.hasOwn(routes, key)) return;
  if (state.saved.some((item) => item.route === key)) {
    notify("这条行动已在本次演示记录里");
    return;
  }
  state.saved.push({ route: key });
  $$(`[data-save="${key}"]`).forEach((button) => {
    if (button.classList.contains("save-action")) {
      button.disabled = true;
      button.innerHTML = "已记入演示记录" + icon("check");
    }
  });
  notify("已记入本次演示，可在“记录”中查看");
}
document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.view) {
    setView(button.dataset.view);
    return;
  }
  if (button.dataset.route) {
    state.route = button.dataset.route;
    const url = new URL(location.href);
    url.searchParams.set("route", state.route);
    history.replaceState(null, "", url);
    const scroll = pane.scrollTop;
    render();
    pane.scrollTop = scroll;
    const target = matchMedia("(max-width:760px)").matches
      ? `.mobile-route[data-route=${state.route}]`
      : `.graph-node[data-route=${state.route}]`;
    $(target)?.focus({ preventScroll: true });
    return;
  }
  if (button.dataset.dialog) {
    openDialog(button.dataset.dialog);
    return;
  }
  if (button.dataset.person) {
    openDialog("person", button.dataset.person);
    return;
  }
  if (button.hasAttribute("data-close-sheet") || button.id === "close-sheet") {
    sheet.close();
    return;
  }
  if (button.dataset.model) {
    state.model = button.dataset.model;
    sheet.close();
    render();
    notify(`已选择${state.model}档位（演示）`);
    return;
  }
  if (button.dataset.save) {
    saveRoute(button.dataset.save);
    return;
  }
  if (button.dataset.remove) {
    state.saved = state.saved.filter(
      (item) => item.route !== button.dataset.remove,
    );
    render();
    notify("已移除这条演示行动");
    return;
  }
  if (button.dataset.searchView) {
    sheet.close();
    setView(button.dataset.searchView);
    return;
  }
  if (button.hasAttribute("data-feedback")) {
    if (!$("#feedback-text").value.trim()) {
      $("#feedback-text").focus();
      return;
    }
    sheet.close();
    notify("反馈已在本次演示中确认，不会上传");
    return;
  }
  if (button.dataset.copy) {
    const text =
      button.dataset.copy === "quote"
        ? routes[state.route].quote
        : "仅凭这次遗漏，还不能判断是不是故意。先核对分工和交付记录，再决定是否需要公开补充。";
    try {
      await navigator.clipboard.writeText(text);
      notify("已复制");
    } catch {
      notify("浏览器未允许复制，可选中文字手动复制");
    }
    return;
  }
  if (button.hasAttribute("data-close-inspector")) {
    state.inspectorClosed = true;
    $("#inspector").hidden = true;
    $("[data-reopen]").hidden = false;
    $("[data-reopen]").focus();
    return;
  }
  if (button.hasAttribute("data-reopen")) {
    state.inspectorClosed = false;
    $("#inspector").hidden = false;
    button.hidden = true;
    $("[data-close-inspector]").focus();
    return;
  }
  if (button.hasAttribute("data-compare")) {
    const target = matchMedia("(max-width:760px)").matches
      ? ".mobile-routes"
      : ".decision-graph";
    $(target)?.scrollIntoView({ block: "nearest" });
    $(`${target} button[aria-pressed=true]`)?.focus({ preventScroll: true });
    return;
  }
  if (button.hasAttribute("data-reset")) {
    state.messages = [];
    state.saved = [];
    $("#message").value = "";
    notify("本次演示输入与行动已清空");
    return;
  }
});
document.addEventListener("input", (event) => {
  if (event.target.id === "search-input") updateSearch(event.target.value);
  if (event.target.id === "message") {
    event.target.style.height = "auto";
    event.target.style.height = Math.min(event.target.scrollHeight, 116) + "px";
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "reduce-motion")
    document.documentElement.classList.toggle(
      "reduce-motion",
      event.target.checked,
    );
});
composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const field = $("#message"),
    text = field.value.trim();
  if (!text) {
    field.focus();
    return;
  }
  state.messages.push(text);
  field.value = "";
  field.style.height = "auto";
  if (state.view !== "chat") setView("chat");
  else renderMessages();
  pane.scrollTop = pane.scrollHeight;
  field.focus();
});
$("#message").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    composer.requestSubmit();
  }
});
sheet.addEventListener("click", (event) => {
  if (event.target === sheet) {
    const box = sheet.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      sheet.close();
  }
});
window.addEventListener("popstate", () => {
  loadLocation();
  render();
});
loadLocation();
render();
