const routes = {
  a: {
    title: "先核对分工，再决定是否公开说明",
    body: "带上交付记录，问清对方如何理解分工。",
    source: "分工与交付记录",
    unknown: "对方是否只是遗漏",
  },
  b: {
    title: "把贡献说清楚，也给讨论留余地",
    body: "围绕具体交付补充信息，避免先判断对方的动机。",
    source: "过往会议记录",
    unknown: "现场氛围与他人反应",
  },
  c: {
    title: "先收集信息，给自己留一个期限",
    body: "暂缓回应不等于放下这件事，可以先整理交付记录。",
    source: "近期工作安排",
    unknown: "遗漏是否会影响后续评价",
  },
};
function setHeading(element, text) {
  element.replaceChildren(
    ...text.match(/[^，]+，?/gu).flatMap((phrase, index) => {
      const span = document.createElement("span");
      span.className = "type-phrase";
      span.textContent = phrase;
      return index ? [document.createElement("wbr"), span] : [span];
    }),
  );
}
document.querySelectorAll("[data-route]").forEach((button) =>
  button.addEventListener("click", () => {
    const key = button.dataset.route;
    const route = routes[key];
    document
      .querySelectorAll("[data-path]")
      .forEach((path) =>
        path.classList.toggle("selected", path.dataset.path === key),
      );
    document.querySelectorAll("[data-route]").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    document.querySelector(".route-result .tag").textContent =
      `当前走法 · ${key.toUpperCase()}`;
    setHeading(document.getElementById("result-title"), route.title);
    ["body", "source", "unknown"].forEach(
      (field) =>
        (document.getElementById(`result-${field}`).textContent = route[field]),
    );
    document.getElementById("open-route").href =
      `app.html?view=decision&route=${key}`;
  }),
);
