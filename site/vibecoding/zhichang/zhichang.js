/* 职场棋盘宣传页《手谈》：演出、棋谱导航和九个可点的演示。内容都在 DOM 里，这里只加动效和交互。 */
(function () {
  'use strict';
  var d = document, root = d.documentElement, NS = 'http://www.w3.org/2000/svg';
  var $ = function (s, el) { return (el || d).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); };
  var FX = root.classList.contains('fx');
  var G = window.gsap, ST = window.ScrollTrigger;
  if (FX && (!G || !ST)) { root.classList.remove('fx'); root.classList.add('no-fx'); FX = false; }
  if (G && ST) G.registerPlugin(ST);
  window.__znReady = true;

  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, FX ? ms : 0); }); };
  var onView = function (el, fn, th) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { threshold: th || .35 });
    io.observe(el);
  };
  var svg = function (tag, attrs, parent) {
    var e = d.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  var el = function (tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  var CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

  /* ── 纸面探测：导航和棋谱压在纸上时换浅色 ── */
  var nav = $('#nav'), kifu = $('#kifu');
  var paperAt = function (y) {
    var hit = false;
    $$('.paper, .folio-leaf').forEach(function (s) { if (s.classList.contains('paper')) { var r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) hit = true; } });
    return hit;
  };

  /* ── 棋谱导航 ── */
  var secs = $$('section[data-move]');
  var SPOTS = [[4, 1], [1, 2], [5, 4], [2, 5], [3, 3], [4, 5], [1, 4], [5, 2], [3, 1], [2, 2], [4, 3], [3, 5]];
  var kStones = [];
  if (kifu) {
    var kg = $('.kifu-grid', kifu), ks = $('.kifu-stones', kifu);
    for (var i = 0; i < 7; i++) {
      svg('line', { x1: 12, y1: 12 + i * 16, x2: 108, y2: 12 + i * 16 }, kg);
      svg('line', { x1: 12 + i * 16, y1: 12, x2: 12 + i * 16, y2: 108 }, kg);
    }
    secs.forEach(function (s, idx) {
      var p = SPOTS[idx % SPOTS.length], x = 12 + p[0] * 16, y = 12 + p[1] * 16, black = idx % 2 === 0;
      var g = svg('g', { class: 'ghost', role: 'link', tabindex: 0, 'aria-label': '第' + CN[idx + 1] + '手 · ' + s.dataset.name }, ks);
      svg('circle', { class: 'ring', cx: x, cy: y, r: 9.5 }, g);
      svg('circle', { class: 's', cx: x, cy: y, r: 7, fill: black ? '#1B1A18' : '#F1EBDF', stroke: black ? '#000' : '#B9B1A3', 'stroke-width': .6 }, g);
      var t = svg('text', { x: x, y: y + 2.3, fill: black ? '#F1EBDF' : '#1B1A18' }, g); t.textContent = idx + 1;
      var go = function () { s.scrollIntoView({ behavior: FX ? 'smooth' : 'auto' }); };
      g.addEventListener('click', go);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      kStones.push(g);
    });
  }
  var curMove = -1;
  var onScroll = function () {
    var y = window.scrollY, vh = window.innerHeight;
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('on-paper', paperAt(40));
    if (kifu) {
      kifu.classList.toggle('show', y > vh * .6);
      kifu.classList.toggle('on-paper', paperAt(vh - 90));
      var cur = -1;
      secs.forEach(function (s, idx) { if (s.getBoundingClientRect().top < vh * .5) cur = idx; });
      if (cur !== curMove) {
        curMove = cur;
        kStones.forEach(function (g, idx) { g.classList.toggle('ghost', idx > cur); g.classList.toggle('cur', idx === cur); });
        $('#kifu-now').textContent = cur < 0 ? '起手' : '第' + CN[cur + 1] + '手 · ' + secs[cur].dataset.name;
      }
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── 结尾的主按钮：开放前是“即将开放”，不带链接；开放那天在 HTML 里加上 href 就行 ── */
  var cta = $('#cta');

  /* ── 棋子链接：落子的涟漪 ── */
  $$('.stone-link, .scene, .tab').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!FX) return;
      var st = $('.st', b); if (!st) return;
      var r = el('span', 'ripple'); var br = b.getBoundingClientRect(), sr = st.getBoundingClientRect();
      r.style.left = (sr.left - br.left + sr.width / 2 - 17) + 'px'; r.style.top = (sr.top - br.top + sr.height / 2 - 17) + 'px';
      b.style.position = 'relative'; b.appendChild(r); setTimeout(function () { r.remove(); }, 900);
    });
  });

  /* ── 开场与视差 ── */
  if (FX) {
    var tl = G.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero-img', { scale: 1.12, duration: 3.2, ease: 'power2.out' }, 0)
      .to('.hero-title .ln > span', { y: 0, duration: 1.5, stagger: .16 }, .35)
      .to('.hero-copy > :not(.hero-title)', { opacity: 1, y: 0, duration: 1.2, stagger: .1 }, .2)
      .to('.hero-stage .win', { opacity: 1, x: 0, y: 0, rotateY: -7, rotateX: 3, duration: 2, ease: 'power3.out' }, .7)
      .to('.hero-stage .phone', { opacity: 1, x: 0, y: 0, duration: 1.8, ease: 'power3.out' }, 1.15);
    G.to('.hero-img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    if (window.matchMedia('(min-width: 961px)').matches) {
      G.to('.hero-inner', { yPercent: -10, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
      G.to('.hero-stage .phone', { y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
    [['.council-art img', '.council'], ['.knowledge-art img', '.knowledge'], ['.end-art', '.end']].forEach(function (p) {
      if ($(p[0])) G.fromTo(p[0], { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: p[1], start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    ST.batch('.rv', {
      start: 'top 88%',
      onEnter: function (els) {
        els.forEach(function (e, k) {
          if (e.classList.contains('scroll') && window.innerWidth > 760) G.to(e, { opacity: 1, scaleY: 1, duration: 1.5, delay: k * .18, ease: 'power3.out' });
          else G.to(e, { opacity: 1, y: 0, duration: 1.1, delay: k * .09, ease: 'expo.out' });
        });
      }
    });
  }

  /* ── 数字 ── */
  var fmt = function (n) { return n.toLocaleString('en-US'); };
  $$('.num[data-count]').forEach(function (e) {
    var to = +e.dataset.count;
    if (!FX) { e.textContent = fmt(to); return; }
    e.textContent = '0';
    onView(e, function () { var o = { v: 0 }; G.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: function () { e.textContent = fmt(Math.round(o.v)); } }); }, .6);
  });

  /* ── 演示一：开户 ── */
  var ob = $('#onboard');
  if (ob) {
    var steps = $$('#ob-progress li', ob), go = $('#ob-go', ob), goT = $('span', go), rep = $('[data-replay="onboard"]', ob);
    var running = false;
    var resetAsm = function (a) {
      a.classList.remove('v-ok', 'v-fix', 'v-no');
      if (!a.dataset.orig) a.dataset.orig = $('.asm-t', a).textContent;
      $('.asm-t', a).textContent = a.dataset.orig;
      $('.asm-verdict', a).textContent = '等你确认';
      $$('button', a).forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
    };
    var runOb = function () {
      if (running) return; running = true;
      ob.classList.add('ran'); go.disabled = true; goT.textContent = '正在了解';
      steps.forEach(function (li) { li.classList.remove('done', 'now'); });
      $$('.asm', ob).forEach(resetAsm);
      var box = $('#ob-asm', ob); box.hidden = true;
      var p = Promise.resolve();
      steps.forEach(function (li, k) {
        p = p.then(function () { li.classList.add('now'); return wait(k === steps.length - 1 ? 600 : 850); })
             .then(function () { li.classList.remove('now'); li.classList.add('done'); });
      });
      p.then(function () {
        box.hidden = false;
        if (FX) G.from($$('.ob-asm > *', ob), { opacity: 0, y: 14, duration: .8, stagger: .1, ease: 'expo.out' });
        goT.textContent = '已了解 · 41 秒'; rep.hidden = false; running = false;
      });
    };
    $('#ob-form', ob).addEventListener('submit', function (e) { e.preventDefault(); runOb(); });
    rep.addEventListener('click', runOb);
    $$('.asm', ob).forEach(function (a) {
      resetAsm(a);
      $$('button', a).forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.dataset.v, same = a.classList.contains('v-' + v);
          resetAsm(a);
          if (same) return;
          a.classList.add('v-' + v); b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
          if (v === 'fix') $('.asm-t', a).textContent = a.dataset.fix;
          $('.asm-verdict', a).textContent = v === 'ok' ? '已确认，写进档案' : v === 'fix' ? '已按你说的改' : '已删掉，不再用';
        });
      });
    });
    onView(ob, function () { setTimeout(runOb, 500); }, .45);
  }

  /* ── 演示二：关系雷达 v2 ──
     距离＝亲疏（c：1 最近）；角度＝组织位置：纵向 s 是相对级别（上正下负），横向 o 是组织距离（左本组、右别的部门）；
     棋子大小＝话语权；外圈＝态度，推测的态度画虚线。 */
  var PEOPLE = [
    { id: 'p1', nm: '沈蔓', f: '沈', rl: '直属上级', c: .5, s: 1, o: -.55, inf: .7, st: 'neu', lab: 'b' },
    { id: 'p2', nm: '周启明', f: '周', rl: '事业部总监', c: .16, s: 1, o: -.25, inf: 1, st: 'neu', dash: 1, lab: 't' },
    { id: 'p7', nm: '陈叙', f: '陈', rl: '同组老员工', c: .8, s: .3, o: -1, inf: .45, st: 'sup', lab: 'b' },
    { id: 'p5', nm: '唐小舟', f: '唐', rl: '同组同事', c: .45, s: -.12, o: -1, inf: .3, st: 'res', dash: 1, lab: 'b' },
    { id: 'p8', nm: '许薇', f: '许', rl: '财务 · 别的部门', c: .55, s: .05, o: 1, inf: .35, st: 'sup', lab: 'b' },
    { id: 'p9', nm: '贺之远', f: '贺', rl: '销售部负责人', c: .1, s: .8, o: .85, inf: .8, st: 'res', lab: 'b' },
    { id: 'p4', nm: '阿杰', f: '杰', rl: '你带的实习生', c: .72, s: -1, o: -.45, inf: .15, st: 'sup', lab: 'b' }
  ];
  var EDGES = [
    { a: 'you', b: 'p1', t: 'rep' }, { a: 'p1', b: 'p2', t: 'rep' }, { a: 'p4', b: 'you', t: 'rep' },
    { a: 'p7', b: 'p1', t: 'rep' }, { a: 'p5', b: 'p1', t: 'rep' }, { a: 'p9', b: 'p2', t: 'rep' },
    { a: 'you', b: 'p7', t: 'trust', w: 3.6 }, { a: 'you', b: 'p8', t: 'trust', w: 2.2 }, { a: 'you', b: 'p4', t: 'trust', w: 2.2 },
    { a: 'p1', b: 'p9', t: 'fric' },
    { a: 'p7', b: 'you', t: 'flow', off: 7 }, { a: 'p8', b: 'you', t: 'flow', off: 7 },
    { a: 'p5', b: 'p1', t: 'guess', off: -9 }, { a: 'p8', b: 'p2', t: 'guess' }
  ];
  var CX = 300, CY = 300, R0 = 70, R1 = 245;
  var place = function (p) {
    var vx = p.o, vy = -p.s, n = Math.sqrt(vx * vx + vy * vy) || 1, r = R0 + (1 - p.c) * (R1 - R0);
    p.x = CX + r * vx / n; p.y = CY + r * vy / n; p.r = 13 + 11 * p.inf;
  };
  PEOPLE.forEach(place);
  var YOU = { id: 'you', x: CX, y: CY, r: 22 };
  var byId = { you: YOU }; PEOPLE.forEach(function (p) { byId[p.id] = p; });

  var drawRadar = function (host, mini) {
    if (!host) return null;
    host.textContent = '';
    var pre = mini ? 'm' : 'r';
    var defs = svg('defs', {}, host);
    var gw = svg('radialGradient', { id: pre + 'sw', cx: '38%', cy: '32%', r: '70%' }, defs);
    svg('stop', { offset: '0', 'stop-color': '#FFFFFF' }, gw); svg('stop', { offset: '.6', 'stop-color': '#E9E2D3' }, gw); svg('stop', { offset: '1', 'stop-color': '#B8AF9F' }, gw);
    var gb = svg('radialGradient', { id: pre + 'sb', cx: '36%', cy: '30%', r: '72%' }, defs);
    svg('stop', { offset: '0', 'stop-color': '#6A6862' }, gb); svg('stop', { offset: '.45', 'stop-color': '#232220' }, gb); svg('stop', { offset: '1', 'stop-color': '#050505' }, gb);
    var mk = svg('marker', { id: pre + 'arr', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    svg('path', { d: 'M0,1 L9,5 L0,9 z', class: 'r-arrow' }, mk);
    var grid = svg('g', { class: 'r-grid' }, host);
    for (var k = 1; k < 20; k++) { svg('line', { x1: k * 30, y1: 0, x2: k * 30, y2: 600 }, grid); svg('line', { x1: 0, y1: k * 30, x2: 600, y2: k * 30 }, grid); }
    [129.5, 187, 245].forEach(function (r) { svg('circle', { class: 'r-ring', cx: CX, cy: CY, r: r }, host); });
    if (!mini) {
      [['自己人', 100], ['熟人', 158], ['点头之交', 216]].forEach(function (a) { var t = svg('text', { class: 'r-ring-l', x: CX + a[1] * .707, y: CY + a[1] * .707 }, host); t.textContent = a[0]; });
      [['资深', CX, 20, 'middle'], ['资浅', CX, 592, 'middle'], ['本组', 8, CY + 5, 'start'], ['别的部门', 592, CY + 5, 'end']].forEach(function (a) {
        var t = svg('text', { class: 'r-axis', x: a[1], y: a[2], 'text-anchor': a[3] }, host); t.textContent = a[0];
      });
    }
    var eg = svg('g', { class: 'r-edges' }, host);
    var edgeEls = [];
    EDGES.forEach(function (e) {
      var A = byId[e.a], B = byId[e.b];
      var dx = B.x - A.x, dy = B.y - A.y, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, off = e.off || 0;
      var x1 = A.x + ux * (A.r + 3) + nx * off, y1 = A.y + uy * (A.r + 3) + ny * off, x2 = B.x - ux * (B.r + 4) + nx * off, y2 = B.y - uy * (B.r + 4) + ny * off;
      var node;
      if (e.t === 'fric') {
        var pts = [], seg = 12;
        for (var q = 0; q <= seg; q++) { var t = q / seg, w = (q === 0 || q === seg) ? 0 : (q % 2 ? 5 : -5); pts.push((x1 + (x2 - x1) * t + nx * w).toFixed(1) + ',' + (y1 + (y2 - y1) * t + ny * w).toFixed(1)); }
        node = svg('polyline', { points: pts.join(' ') }, eg);
      } else {
        node = svg('line', { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1) }, eg);
        if (e.t === 'rep') node.setAttribute('marker-end', 'url(#' + pre + 'arr)');
        if (e.t === 'trust') node.setAttribute('stroke-width', e.w);
      }
      node.setAttribute('class', 'r-edge ' + e.t);
      node.dataset.a = e.a; node.dataset.b = e.b; node.dataset.t = e.t;
      edgeEls.push(node);
      if (e.t === 'guess') { var gd = svg('circle', { class: 'r-edge guess-dot r-gdot', cx: ((x1 + x2) / 2).toFixed(1), cy: ((y1 + y2) / 2).toFixed(1), r: 5.5 }, eg); gd.dataset.a = e.a; gd.dataset.b = e.b; gd.dataset.t = 'guess'; edgeEls.push(gd); }
    });
    var ng = svg('g', { class: 'r-nodes' }, host);
    var nodeEls = [];
    var stone = function (g, x, y, r, black) {
      svg('ellipse', { cx: x + 1.5, cy: y + r * .55, rx: r * .95, ry: r * .45, fill: 'rgba(0,0,0,.18)' }, g);
      svg('circle', { cx: x, cy: y, r: r, fill: 'url(#' + pre + (black ? 'sb' : 'sw') + ')' }, g);
    };
    var yg = svg('g', { class: 'r-node you', 'data-id': 'you' }, ng);
    svg('circle', { cx: CX, cy: CY, r: 48, fill: 'rgba(201,164,98,.16)' }, yg);
    stone(yg, CX, CY, 22, true);
    var yt = svg('text', { class: 'face', x: CX, y: CY + 7, 'font-size': 19 }, yg); yt.textContent = '你';
    PEOPLE.forEach(function (p) {
      var g = svg('g', { class: 'r-node', 'data-id': p.id, tabindex: mini ? null : 0, role: mini ? null : 'button', 'aria-label': mini ? null : '看' + p.nm + '的档案' }, ng);
      svg('circle', { class: 'halo', cx: p.x, cy: p.y, r: p.r + 9 }, g);
      stone(g, p.x, p.y, p.r, false);
      svg('circle', { class: 'ring ' + p.st + (p.dash ? ' dash' : ''), cx: p.x, cy: p.y, r: p.r + 3.5 }, g);
      var f = svg('text', { class: 'face', x: p.x, y: p.y + p.r * .36, 'font-size': (p.r * 1.02).toFixed(1) }, g); f.textContent = p.f;
      var up = p.lab === 't';
      var nmY = up ? p.y - p.r - 10 : p.y + p.r + 19, rlY = up ? p.y - p.r - 27 : p.y + p.r + 35;
      var nm = svg('text', { class: 'nm', x: p.x, y: mini ? (up ? p.y - p.r - 12 : p.y + p.r + 30) : nmY }, g); nm.textContent = p.nm;
      if (!mini) { var rl = svg('text', { class: 'rl', x: p.x, y: rlY }, g); rl.textContent = p.rl; }
      nodeEls.push(g);
    });
    return { host: host, edges: edgeEls, nodes: nodeEls };
  };

  var mini = drawRadar($('#mini-radar'), true);
  if (mini) { var mn = mini.nodes.filter(function (n) { return n.dataset.id === 'p1'; })[0]; if (mn) mn.classList.add('on'); }
  var big = drawRadar($('#radar-svg'), false);
  var cards = $$('.pcard'), ocs = $$('.oc[data-id]');
  var pick = function (id, scroll) {
    if (!big) return;
    var near = {};
    big.edges.forEach(function (e) { var hot = e.dataset.a === id || e.dataset.b === id; e.classList.toggle('hot', hot); if (hot) { near[e.dataset.a] = 1; near[e.dataset.b] = 1; } });
    big.nodes.forEach(function (n) { n.classList.toggle('on', n.dataset.id === id); n.classList.toggle('near', !!near[n.dataset.id]); });
    big.host.classList.add('focus');
    ocs.forEach(function (o) { o.classList.toggle('on', o.dataset.id === id); });
    cards.forEach(function (c) { c.classList.toggle('on', c.dataset.id === id); });
    var card = $('.pcard.on');
    if (card && FX) G.fromTo(card, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, ease: 'expo.out' });
    if (scroll && card && window.innerWidth < 960) card.scrollIntoView({ behavior: FX ? 'smooth' : 'auto', block: 'nearest' });
  };
  if (big) {
    big.nodes.forEach(function (n) {
      if (n.dataset.id === 'you') return;
      n.addEventListener('click', function () { pick(n.dataset.id, true); });
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(n.dataset.id, true); } });
    });
    ocs.forEach(function (o) { o.addEventListener('click', function () { pick(o.dataset.id, true); }); });
    pick('p1', false);
    if (FX) {
      var edgesAll = big.edges, nodesAll = big.nodes;
      G.set(edgesAll, { opacity: 0 }); G.set(nodesAll, { opacity: 0 });
      onView(big.host, function () {
        G.to(nodesAll, { opacity: 1, duration: .8, stagger: .08, ease: 'power2.out', onComplete: function () { G.set(nodesAll, { clearProps: 'opacity' }); } });
        G.to(edgesAll, { opacity: 1, duration: 1, stagger: .04, delay: .5, ease: 'power2.out', onComplete: function () { G.set(edgesAll, { clearProps: 'opacity' }); pick('p1', false); } });
      });
    }
    $$('#filters .flt').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
        big.edges.forEach(function (e) { if (e.dataset.t === b.dataset.t) e.classList.toggle('off', !on); });
      });
    });
  }
  $$('.tabs .tab').forEach(function (t) {
    t.addEventListener('click', function () {
      $$('.tabs .tab').forEach(function (x) { var on = x === t; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
      $('#view-radar').classList.toggle('on', t.dataset.view === 'radar');
      $('#view-org').classList.toggle('on', t.dataset.view === 'org');
      if (FX) G.fromTo('#view-' + t.dataset.view, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .5, ease: 'expo.out' });
    });
  });

  /* ── 演示三：开会 ── */
  var adv = $$('#advisors li'), feed = $$('#feed li'), feedRep = $('#feed-replay');
  var meeting = false;
  var runMeeting = function () {
    if (meeting) return; meeting = true;
    adv.forEach(function (a) { a.classList.remove('on', 'done'); });
    feed.forEach(function (f) { f.classList.remove('shown', 'cur'); });
    var p = wait(200);
    feed.forEach(function (f) {
      p = p.then(function () {
        adv.forEach(function (x) { if (x.classList.contains('on')) { x.classList.remove('on'); x.classList.add('done'); } });
        feed.forEach(function (x) { x.classList.remove('cur'); });
        var a = adv[+f.dataset.a]; if (a) a.classList.add('on');
        f.classList.add('shown', 'cur');
        return wait(820);
      });
    });
    p.then(function () {
      adv.forEach(function (x) { x.classList.remove('on'); x.classList.add('done'); });
      feed.forEach(function (x) { x.classList.remove('cur'); });
      if (feedRep) feedRep.hidden = false;
      meeting = false;
    });
  };
  if (feed.length) { onView($('#case'), runMeeting, .4); if (feedRep) feedRep.addEventListener('click', runMeeting); }

  /* ── 演示四：横向决策树 ── */
  var OPTS = [
    { k: 'A', tag: '本手', cls: '', title: '周报写清，下次组会主动讲', rec: true, y: 88 },
    { k: 'B', tag: '妙手', cls: 'miao', title: '先私下找唐小舟说清分工', y: 256 },
    { k: 'C', tag: '俗手', cls: 'su', title: '直接找沈蔓说明', y: 452 }
  ];
  var FACT = {
    mail: ['doc', '原文证据', '9/02 分工邮件：A 部分由你负责'],
    p1ear: ['seen', '亲历 · 5 次', '沈蔓开会习惯先听结论'],
    p5sry: ['seen', '亲历 · 2 次', '唐小舟被当面指出问题时都先道歉'],
    trip: ['hear', '转述 · 陈叙说的', '沈蔓下周三带周报去总部'],
    p1calm: ['guess', '推测 · 把握 0.7', '沈蔓不喜欢被打个措手不及'],
    p5ok: ['guess', '推测 · 把握 0.6', '唐小舟不是故意的，可能照抄了上期周报']
  };
  var OUT = { good: '好', ok: '一般', bad: '差' };
  var LEAVES = [
    { id: 'A1', o: 'A', y: 60, out: 'good', p: .65, lo: .55, hi: .75, p2: .62, lo2: .52, hi2: .72, name: '沈蔓注意到了',
      title: '沈蔓注意到，A 部分记回你名下', c: '不得罪任何人，功劳也回到你这里，只是要等到下次组会。',
      s: ['下一期周报把 A 部分的交付写清楚，附上提交记录', '组会上花两分钟，讲讲 A 部分的一个难点你是怎么解决的', '沈蔓习惯先听结论。你先讲结果，她会记住这是谁做的'],
      pro: '没有指责谁，唐小舟也不会下不来台', con: '这一期周报周三就带去总部了，那一份改不了',
      w2: '汇报推迟，这一期周报还有机会改，但 A 本来就不靠这一期，变化不大', f: ['mail', 'p1ear', 'p1calm'] },
    { id: 'A2', o: 'A', y: 116, out: 'ok', p: .35, lo: .25, hi: .45, p2: .38, lo2: .28, hi2: .48, name: '没注意到',
      title: '沈蔓没注意到', c: '最差也就是这次白讲了，关系没有任何损失，以后还能补。',
      s: ['组会上讲了，但沈蔓的心思在总部汇报上', '周报里写清的那部分留了底，以后翻记录对得上', '下个月述职，把 A 部分放进你的成果里再讲一次'],
      pro: '留下了书面记录，谁也挑不出毛病', con: '总部那份材料上，A 部分还是唐小舟的名字',
      w2: '汇报推迟后沈蔓更忙着改材料，组会上分心的可能略高', f: ['mail', 'trip'] },
    { id: 'B1', o: 'B', y: 200, out: 'good', p: .55, lo: .45, hi: .65, p2: .68, lo2: .58, hi2: .78, name: '唐小舟认可并更正',
      title: '唐小舟认可，自己去向沈蔓更正', c: '代价最小，关系几乎不受影响，但得靠唐小舟自己去更正，什么时候去，你说了不算。',
      s: ['约唐小舟单独聊 15 分钟，带上当初的分工邮件，只谈“周报写错了，怎么改”', '唐小舟多半会先道歉，前两次当面指出他的问题，他都是这样', '最好赶在周三去总部之前改掉'],
      pro: '不绕过任何人，沈蔓和周启明都不会觉得你在告状', con: '唐小舟要是拖过周三，总部那一份就改不了了',
      w2: '这条路原本最怕时间不够。汇报推迟后，唐小舟有足够的时间去更正', f: ['mail', 'p5sry', 'trip', 'p5ok'] },
    { id: 'B2', o: 'B', y: 256, out: 'ok', p: .35, lo: .25, hi: .45, p2: .24, lo2: .15, hi2: .33, name: '含糊过去',
      title: '唐小舟含糊过去，没人去更正', c: '话说开了，但事情没动，你还得再走一步。',
      s: ['唐小舟说“我回头看看”', '到周三还没有动静', '你改走 A：下一期周报自己写清楚'],
      pro: '唐小舟知道你在意这件事，下次会注意', con: '多耽误了几天',
      w2: '时间宽裕了，唐小舟找不到“来不及”的理由', f: ['p5ok', 'trip'] },
    { id: 'B3', o: 'B', y: 312, out: 'bad', p: .10, lo: .05, hi: .20, p2: .08, lo2: .04, hi2: .15, name: '唐小舟不高兴',
      title: '唐小舟不高兴，觉得你在翻旧账', c: '可能性小，但真发生了，同组之间会别扭一阵。',
      s: ['唐小舟觉得你小题大做', '之后分活的时候，他对你多了几分防备'],
      pro: '分工总算说清楚了', con: '你们每天还要一起干活，这阵别扭躲不开',
      w2: '和时间关系不大，基本不变', f: ['p5ok'] },
    { id: 'C1', o: 'C', y: 396, out: 'good', p: .50, lo: .40, hi: .60, p2: .45, lo2: .35, hi2: .55, name: '沈蔓理解',
      title: '沈蔓理解，自己去改周报', c: '最快，周三前就能改好，但你越过了唐小舟。',
      s: ['拿着分工邮件找沈蔓，说明 A 部分当初是怎么分的', '沈蔓改了周报，顺口问唐小舟一句'],
      pro: '总部那一份能赶在周三前改对', con: '唐小舟会知道是你去找的沈蔓',
      w2: '汇报推迟，没那么赶了，这时专门去找沈蔓说，反倒显得你沉不住气', f: ['mail', 'p1ear'] },
    { id: 'C2', o: 'C', y: 452, out: 'ok', p: .30, lo: .20, hi: .40, p2: .37, lo2: .27, hi2: .47, name: '觉得小题大做',
      title: '沈蔓觉得这点事不值得专门来说', c: '沈蔓正忙着准备总部汇报，可能会嫌你计较。',
      s: ['沈蔓说“知道了”', '周报没改，你在沈蔓那里留下了“计较”的印象'],
      pro: '沈蔓至少听你说过了', con: '印象分比这次的功劳更难补回来',
      w2: '汇报推迟，沈蔓更会觉得这件事可以等', f: ['trip', 'p1calm'] },
    { id: 'C3', o: 'C', y: 508, out: 'bad', p: .20, lo: .10, hi: .30, p2: .18, lo2: .10, hi2: .28, name: '沈蔓找唐小舟核实',
      title: '沈蔓找唐小舟核实，三个人都尴尬', c: '唐小舟会认定你在告状。三条路里，这是最伤关系的结局。',
      s: ['沈蔓当着你的面问唐小舟', '唐小舟下不来台，之后跟你疏远'],
      pro: '事实最后会清楚', con: '同组的关系可能要好几个月才能修好',
      w2: '基本不变', f: ['p5ok', 'p1calm'] }
  ];
  var dt = $('#dtree'), panel = $('#leaf-panel'), newsBtn = $('#news-btn');
  var upd = false, sel = 'A1', leafEls = {};
  var BX = 900, BW = 130;
  var buildTree = function () {
    if (!dt) return;
    dt.textContent = '';
    var rootG = svg('g', { class: 'd-root' }, dt);
    svg('rect', { x: 14, y: 226, width: 206, height: 108 }, rootG);
    ['周报把 A 部分写成了', '唐小舟完成的，', '沈蔓周三要带去总部'].forEach(function (s, k) { var t = svg('text', { x: 30, y: 262 + k * 24 }, rootG); t.textContent = s; });
    svg('line', { class: 'd-link rec', x1: 220, y1: 280, x2: 250, y2: 280 }, dt);
    svg('rect', { class: 'd-dec', x: 250, y: 266, width: 28, height: 28, transform: 'rotate(0)' }, dt);
    var dtx = svg('text', { class: 'd-dec-t', x: 264, y: 285 }, dt); dtx.textContent = '决';
    OPTS.forEach(function (o) {
      svg('path', { class: 'd-link' + (o.rec ? ' rec' : ''), d: 'M278 280 C 390 280, 400 ' + o.y + ', 548 ' + o.y }, dt);
      var og = svg('g', { class: 'd-opt' }, dt);
      /* 往下弯的枝，标签放在线下，免得被枝条穿过 */
      var dy = o.y > 280 ? 30 : -22;
      svg('rect', { class: 'd-tag-bg ' + o.cls, x: 318, y: o.y + dy - 16, width: 44, height: 22 }, og);
      var tg = svg('text', { class: 'd-tag', x: 340, y: o.y + dy }, og); tg.textContent = o.tag;
      var kk = svg('text', { class: 'k', x: 372, y: o.y + dy + 1 }, og); kk.textContent = o.k;
      var tt = svg('text', { class: 't', x: 390, y: o.y + dy }, og); tt.textContent = o.title;
      svg('circle', { class: 'd-chance', cx: 560, cy: o.y, r: 11 }, dt);
    });
    LEAVES.forEach(function (l) {
      var o = OPTS.filter(function (x) { return x.k === l.o; })[0];
      svg('path', { class: 'd-link' + (o.rec ? ' rec' : ''), d: 'M571 ' + o.y + ' C 592 ' + o.y + ', 598 ' + l.y + ', 622 ' + l.y }, dt);
      var g = svg('g', { class: 'd-leaf', tabindex: 0, role: 'button' }, dt);
      svg('rect', { class: 'hit', x: 622, y: l.y - 24, width: 480, height: 48, rx: 2 }, g);
      svg('circle', { class: 'o-' + l.out, cx: 638, cy: l.y, r: 5 }, g);
      var n = svg('text', { class: 'n', x: 652, y: l.y + 5 }, g); n.textContent = l.name + ' · ' + OUT[l.out];
      svg('rect', { class: 'bar-bg', x: BX, y: l.y - 3, width: BW, height: 6 }, g);
      var band = svg('rect', { class: 'bar o-' + l.out, x: BX, y: l.y - 3, width: BW, height: 6, opacity: .55 }, g);
      var mark = svg('rect', { x: BX, y: l.y - 8, width: 2, height: 16, fill: '#ECE6DA' }, g);
      var p = svg('text', { class: 'p', x: 1092, y: l.y + 6 }, g);
      var was = svg('text', { class: 'was', x: 1092, y: l.y + 21 }, g);
      g.addEventListener('click', function () { sel = l.id; paint(true); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel = l.id; paint(true); } });
      leafEls[l.id] = { g: g, band: band, mark: mark, p: p, was: was };
    });
  };
  var level = function (p) { return p >= .6 ? '中高' : p >= .4 ? '中' : p >= .2 ? '中低' : '低'; };
  var paint = function (swap) {
    LEAVES.forEach(function (l) {
      var e = leafEls[l.id]; if (!e) return;
      var p = upd ? l.p2 : l.p, lo = upd ? l.lo2 : l.lo, hi = upd ? l.hi2 : l.hi;
      e.g.classList.toggle('on', l.id === sel);
      e.g.setAttribute('aria-label', l.name + '，结果' + OUT[l.out] + '，可能性 ' + p.toFixed(2));
      e.band.setAttribute('x', BX + lo * BW); e.band.setAttribute('width', (hi - lo) * BW);
      e.mark.setAttribute('x', BX + p * BW - 1);
      e.p.textContent = p.toFixed(2);
      e.was.textContent = upd && Math.abs(l.p2 - l.p) >= .05 ? '原来 ' + l.p.toFixed(2) : '';
    });
    var l = LEAVES.filter(function (x) { return x.id === sel; })[0], o = OPTS.filter(function (x) { return x.k === l.o; })[0];
    var p = upd ? l.p2 : l.p;
    panel.textContent = '';
    panel.appendChild(el('p', 'lp-opt kai', '方案 ' + o.k + ' · ' + o.tag + ' · ' + o.title));
    panel.appendChild(el('p', 'lp-title', l.title));
    var meta = el('p', 'lp-meta');
    meta.appendChild(el('span', null, '可能性 ' + p.toFixed(2) + '（' + level(p) + '）'));
    meta.appendChild(el('span', null, '区间 ' + (upd ? l.lo2 : l.lo).toFixed(2) + '–' + (upd ? l.hi2 : l.hi).toFixed(2)));
    meta.appendChild(el('span', null, '结果' + OUT[l.out]));
    panel.appendChild(meta);
    panel.appendChild(el('p', 'lp-body', l.c));
    var ol = el('ol', 'lp-steps'); l.s.forEach(function (t) { ol.appendChild(el('li', null, t)); }); panel.appendChild(ol);
    var pc = el('div', 'lp-pc');
    var d1 = el('div'); d1.appendChild(el('b', null, '好处')); d1.appendChild(d.createTextNode(l.pro));
    var d2 = el('div'); d2.appendChild(el('b', null, '风险')); d2.appendChild(d.createTextNode(l.con));
    pc.appendChild(d1); pc.appendChild(d2); panel.appendChild(pc);
    var facts = el('div', 'lp-facts');
    l.f.forEach(function (k) { var f = FACT[k], w = el('p', 'lp-fact'); w.appendChild(el('span', 'mk mk-' + f[0], f[1])); w.appendChild(d.createTextNode(f[2])); facts.appendChild(w); });
    panel.appendChild(facts);
    if (upd) panel.appendChild(el('p', 'lp-why2', '新情况下：' + l.w2));
    if (swap && FX) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
  };
  if (dt) {
    buildTree(); paint(false);
    newsBtn.addEventListener('click', function () { upd = !upd; newsBtn.setAttribute('aria-pressed', upd ? 'true' : 'false'); paint(true); });
  }

  /* ── 演示五：只看事实 ── */
  var only = $('#only-facts');
  if (only) only.addEventListener('change', function () { $('#note-demo').classList.toggle('facts', only.checked); });

  /* ── 演示六：随手问 ── */
  var SCENES = [
    { time: '14:32 · 组会还没散', voice: '0:06', user: '组会上唐小舟当着大家说 A 部分是他做的，我现在要不要当场说', head: '先别当场争',
      acts: ['散会后 10 分钟内，私下找唐小舟', '只说一句：“周报里 A 部分好像写错了，我们一起改一下？”', '晚上回到电脑前，看完整的推演'],
      why: [['seen', '亲历 · 2 次', '唐小舟被指出问题都先道歉'], ['guess', '推测 · 把握 0.7', '沈蔓不喜欢会上起争执']] },
    { time: '09:58 · 一对一马上开始', voice: '0:04', user: '马上要跟沈蔓一对一，第一句说什么', head: '先说结论，再说过程',
      acts: ['开口第一句：“A 部分上周已经交付，有两件事想请您拍板”', '两件事各用一句话讲完，等她问再展开', '最后提一句周报，只说“我补了一版交付记录”'],
      why: [['seen', '亲历 · 5 次', '沈蔓开会习惯先听结论'], ['hear', '转述 · 陈叙说的', '她今天在准备总部汇报']] },
    { time: '16:10 · 收到一封抄送邮件', attach: '邮件截图', user: '周启明发邮件问 A 部分的进度，还抄送了沈蔓。要回吗', head: '要回，今天之内，只写事实',
      acts: ['回复全部，保留抄送', '正文一句话：“A 部分已于 9/15 交付，文档见附件，后续集成由唐小舟负责”', '不解释周报的事，留到跟唐小舟当面说'],
      why: [['seen', '亲历', '周启明很看重数据和口径'], ['guess', '推测 · 把握 0.6', '抄送沈蔓，说明她也在看这件事']] }
  ];
  var phone = $('#phone-lg'), screen = $('#phone-screen'), scenes = $$('.scenes .scene'), sceneTimer = 0;
  var showScene = function (k) {
    var s = SCENES[k];
    scenes.forEach(function (c, j) { c.classList.toggle('on', j === k); c.setAttribute('aria-selected', j === k ? 'true' : 'false'); });
    screen.textContent = '';
    var top = el('p', 'ph-top'); top.appendChild(el('span', null, '随手问')); top.appendChild(el('em', null, s.time)); screen.appendChild(top);
    var me = el('div', 'ph-bubble me');
    if (s.voice) me.appendChild(el('span', 'ph-voice', s.voice));
    if (s.attach) me.appendChild(el('span', 'ph-attach', s.attach));
    me.appendChild(d.createTextNode(s.user)); screen.appendChild(me);
    var th = el('div', 'ph-think'); th.appendChild(el('i')); th.appendChild(d.createTextNode('对照 3 个人 · 12 条记录')); screen.appendChild(th);
    var ai = el('div', 'ph-bubble ai'); ai.appendChild(el('p', 'ph-head', s.head));
    var ol = el('ol'); s.acts.forEach(function (t) { ol.appendChild(el('li', null, t)); }); ai.appendChild(ol);
    s.why.forEach(function (w) { var p = el('p', 'ph-why'); p.appendChild(el('span', 'mk mk-' + w[0], w[1])); p.appendChild(d.createTextNode(w[2])); ai.appendChild(p); });
    screen.appendChild(ai);
    var cp = el('p', 'ph-compose'); cp.appendChild(el('span', null, '按住说话，截图和邮件也收')); cp.appendChild(el('b', 'ph-send')); screen.appendChild(cp);
    phone.classList.add('asking');
    clearTimeout(sceneTimer);
    sceneTimer = setTimeout(function () { phone.classList.remove('asking'); }, FX ? 1300 : 0);
  };
  if (phone && scenes.length) {
    scenes.forEach(function (c, k) { c.addEventListener('click', function () { showScene(k); }); });
    onView(phone, function () { showScene(0); }, .5);
  }

  /* ── 演示七：封缄 ── */
  var gate = $('#gate');
  if (gate) {
    if (!FX) gate.classList.add('go');
    else onView(gate, function () {
      var loop = function () { gate.classList.remove('go'); setTimeout(function () { gate.classList.add('go'); }, 700); };
      loop(); setInterval(function () { if (!d.hidden) loop(); }, 7000);
    }, .45);
  }

  /* ── 收官：落下最后一子 ── */
  var eb = $('#end-board');
  if (eb) {
    var M = 30, S = 37.5, N = 9;
    var defs = svg('defs', {}, eb);
    var ew = svg('radialGradient', { id: 'ew', cx: '38%', cy: '32%', r: '70%' }, defs);
    svg('stop', { offset: '0', 'stop-color': '#FFFFFF' }, ew); svg('stop', { offset: '.6', 'stop-color': '#E9E2D3' }, ew); svg('stop', { offset: '1', 'stop-color': '#B8AF9F' }, ew);
    var ebk = svg('radialGradient', { id: 'eb', cx: '36%', cy: '30%', r: '72%' }, defs);
    svg('stop', { offset: '0', 'stop-color': '#6A6862' }, ebk); svg('stop', { offset: '.45', 'stop-color': '#232220' }, ebk); svg('stop', { offset: '1', 'stop-color': '#050505' }, ebk);
    for (var q = 0; q < N; q++) {
      svg('line', { class: 'eb-line', x1: M, y1: M + q * S, x2: M + 8 * S, y2: M + q * S }, eb);
      svg('line', { class: 'eb-line', x1: M + q * S, y1: M, x2: M + q * S, y2: M + 8 * S }, eb);
    }
    [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]].forEach(function (p) { svg('circle', { class: 'eb-star', cx: M + p[0] * S, cy: M + p[1] * S, r: 3.2 }, eb); });
    var taken = {};
    var put = function (cx, cy, black, parent) {
      var g = svg('g', {}, parent || eb);
      svg('ellipse', { cx: cx + 1.5, cy: cy + 8, rx: 15, ry: 7, fill: 'rgba(0,0,0,.25)' }, g);
      svg('circle', { cx: cx, cy: cy, r: 16, fill: 'url(#' + (black ? 'eb' : 'ew') + ')' }, g);
      return g;
    };
    [[3, 2, 1], [5, 3, 0], [3, 4, 1], [5, 5, 0], [4, 6, 1], [2, 5, 0], [6, 4, 1]].forEach(function (p) { taken[p[0] + ',' + p[1]] = 1; put(M + p[0] * S, M + p[1] * S, !!p[2]); });
    var ghost = put(-100, -100, true); ghost.setAttribute('class', 'eb-ghost');
    var placed = false;
    var snap = function (evt) {
      var r = eb.getBoundingClientRect(), sx = 360 / r.width;
      var x = (evt.clientX - r.left) * sx, y = (evt.clientY - r.top) * sx;
      var gx = Math.round((x - M) / S), gy = Math.round((y - M) / S);
      if (gx < 0 || gy < 0 || gx > 8 || gy > 8) return null;
      return [gx, gy];
    };
    eb.addEventListener('pointermove', function (evt) {
      if (placed) return;
      var p = snap(evt);
      if (!p || taken[p[0] + ',' + p[1]]) { ghost.setAttribute('transform', 'translate(-200 -200)'); return; }
      ghost.setAttribute('transform', 'translate(' + (M + p[0] * S + 100) + ' ' + (M + p[1] * S + 100) + ')');
    });
    eb.addEventListener('pointerleave', function () { ghost.setAttribute('transform', 'translate(-200 -200)'); });
    eb.addEventListener('click', function (evt) {
      if (placed) return;
      var p = snap(evt); if (!p || taken[p[0] + ',' + p[1]]) return;
      placed = true; ghost.remove();
      var cx = M + p[0] * S, cy = M + p[1] * S, g = put(cx, cy, true);
      if (FX) {
        G.from(g, { y: -30, opacity: 0, duration: .35, ease: 'power2.in', svgOrigin: cx + ' ' + cy });
        [0, 1, 2].forEach(function (k) {
          var rp = svg('circle', { class: 'eb-ripple', cx: cx, cy: cy, r: 16 }, eb);
          G.fromTo(rp, { attr: { r: 16 }, opacity: .8 }, { attr: { r: 80 }, opacity: 0, duration: 1.2, delay: .3 + k * .18, ease: 'power2.out', onComplete: function () { rp.remove(); } });
        });
      }
      var hint = $('.end-hint'); if (hint) hint.textContent = '这一局，归你了';
      if (cta) { cta.classList.add('pressed'); setTimeout(function () { cta.classList.remove('pressed'); }, 380); }
    });
  }

  if (ST) window.addEventListener('load', function () { ST.refresh(); onScroll(); });
})();
