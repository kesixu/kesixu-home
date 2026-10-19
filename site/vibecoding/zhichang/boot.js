/* 在首帧之前决定要不要演出：允许动效才隐藏待入场的元素；动画库 4 秒没到就全部亮出来 */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { d.classList.add('no-fx'); return; }
  d.classList.add('fx');
  setTimeout(function () {
    if (!window.__znReady) { d.classList.remove('fx'); d.classList.add('no-fx'); }
  }, 4000);
})();
