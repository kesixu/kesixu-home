/* Aurelia live demo front-end. No inline script (CSP). API is same-origin at /api/aurelia/. */
(function () {
  var API = '/api/aurelia', SALT = 'aurelia-brief-2026', ITER = 200000;
  var EXPECT = '2e4d2c497ade58dd884eee8f1f50cfbfc5fe5034529c8df1a9659bd01974bc83';
  var $ = function (id) { return document.getElementById(id); };
  var tok = sessionStorage.getItem('aurelia-brief');
  function show(id) { ['gate', 'upload', 'result'].forEach(function (s) { $(s).classList.toggle('hidden', s !== id); }); window.scrollTo({ top: 0 }); }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function derive(code) { var enc = new TextEncoder(); return crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']).then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(SALT), iterations: ITER }, k, 256); }).then(hex); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // gate
  $('gateform').addEventListener('submit', function (e) {
    e.preventDefault(); var code = $('code').value.trim(); if (!code) return; $('gatebtn').disabled = true; $('gatemsg').className = 'msg'; $('gatemsg').textContent = '核对中…';
    derive(code).then(function (h) { if (h === EXPECT) { tok = h; sessionStorage.setItem('aurelia-brief', h); $('gatemsg').textContent = ''; boot(); } else { $('gatemsg').className = 'msg err'; $('gatemsg').textContent = '邀请码不对，请再试一次。'; $('gatebtn').disabled = false; } });
  });
  // previews
  function preview(input, img) { input.addEventListener('change', function () { var f = input.files && input.files[0]; var lab = input.parentNode; if (!f) { img.hidden = true; lab.classList.remove('has'); return; } img.src = URL.createObjectURL(f); img.hidden = false; lab.classList.add('has'); }); }
  preview($('file'), $('pv')); preview($('bfile'), $('bpv'));
  // submit
  $('form').addEventListener('submit', function (e) {
    e.preventDefault(); var f = $('file').files[0]; if (!f) return;
    var fd = new FormData(); fd.append('image', f); if ($('bfile').files[0]) fd.append('base', $('bfile').files[0]); fd.append('consent', $('consent').checked ? '1' : '0');
    $('go').disabled = true; $('msg').className = 'msg'; $('msg').innerHTML = '<span class="spin"></span>分割、检索、读数，通常 5 到 15 秒…';
    fetch(API + '/analyze', { method: 'POST', body: fd, headers: { 'X-Aurelia-Token': tok } }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
      .then(function (x) { if (!x.ok) { throw new Error(x.j && x.j.detail ? x.j.detail : ('服务返回 ' + x.status)); } render(x.j); history.replaceState(null, '', '?r=' + x.j.id); show('result'); })
      .catch(function (err) { $('msg').className = 'msg err'; $('msg').textContent = err.message || '分析失败，请稍后再试。'; })
      .then(function () { $('go').disabled = false; });
  });
  function bars(list, cls, title) {
    var h = '<div class="bar head ' + cls + '"><span>' + title + '</span><span></span><span></span></div>';
    list.forEach(function (it) { var w = Math.min(99, Math.round(it.p * 100)); h += '<div class="bar ' + cls + '"><span>' + esc(it.label) + '</span><i style="--w:' + w + '%"></i><b>' + w + '%</b></div>'; });
    return h;
  }
  function render(r) {
    $('ov').src = 'data:image/jpeg;base64,' + r.query.overlay; $('qcap').textContent = '模型分割出的器物轮廓（分值 ' + r.query.vessel_score + '）。检索与读数都基于去掉背景后的器物。';
    $('bars').innerHTML = bars(r.readout.style.slice(0, 3), 's', '风格 · 像哪一窑') + bars(r.readout.period.slice(0, 4), 'p', '年代 · 读数未经校准');
    $('vlist').innerHTML = r.verdict.map(function (v) { return '<li>' + esc(v) + '</li>'; }).join('');
    $('nb').innerHTML = r.neighbors.map(function (n) {
      var sub = [n.dynasty ? n.dynasty + '代' : '', n.reign, n.kiln].filter(Boolean).join(' · ');
      var link = n.link ? ' <a href="' + esc(n.link) + '" target="_blank" rel="noopener">馆方页面</a>' : '';
      return '<figure><div class="im"><img loading="lazy" src="' + API + '/thumb/' + encodeURIComponent(n.object_id) + '?t=' + EXPECT.slice(0, 16) + '" alt=""></div><figcaption><span class="t">' + esc(n.title) + '</span><span class="s">相似度 ' + n.sim.toFixed(3) + '</span>' + esc(n.museum) + '<br>' + esc(sub) + link + '</figcaption></figure>';
    }).join('');
    $('nbnote').textContent = '在 ' + r.index_n.toLocaleString() + ' 件馆藏里检索，相似度为模型特征的余弦相似度。';
    var p = r.parts, h = '';
    if (p.rim) h += '<figure><div class="im"><img src="data:image/jpeg;base64,' + p.rim.img + '" alt=""></div><figcaption>口沿</figcaption></figure>';
    if (p.body) h += '<figure><div class="im"><img src="data:image/jpeg;base64,' + p.body.img + '" alt=""></div><figcaption>器身</figcaption></figure>';
    if (p.base) h += '<figure><div class="im"><img src="data:image/jpeg;base64,' + p.base.img + '" alt=""></div><figcaption>底部</figcaption></figure>';
    if (p.foot) h += '<figure><div class="im"><img src="data:image/jpeg;base64,' + p.foot.img + '" alt=""></div><figcaption>圈足</figcaption></figure>';
    else h += '<figure class="want"><span>再上传一张底部照片，就能看到圈足：露胎、修足与支钉是行家翻过来看的地方。</span></figure>';
    $('parts').innerHTML = h;
    $('partnote').textContent = r.has_base ? '底部照片里找到了圈足。做工的证据主要在这里，模型对它的读数仍在实验中。' : '正面照里只能看到口沿与器身。';
    $('notes').textContent = r.notes.join(' ');
  }
  $('again').addEventListener('click', function () { $('form').reset(); $('pv').hidden = true; $('bpv').hidden = true; $('file').parentNode.classList.remove('has'); $('bfile').parentNode.classList.remove('has'); $('msg').textContent = ''; history.replaceState(null, '', location.pathname); show('upload'); });
  $('share').addEventListener('click', function () { var u = location.origin + location.pathname + location.search; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { $('sharemsg').className = 'msg ok'; $('sharemsg').textContent = '已复制，链接 24 小时内有效，对方也需要邀请码。'; }, function () { $('sharemsg').className = 'msg'; $('sharemsg').textContent = u; }); });
  function boot() {
    var m = location.search.match(/[?&]r=([0-9a-f]{12})/);
    if (m) { fetch(API + '/report/' + m[1], { headers: { 'X-Aurelia-Token': tok } }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { render(j); show('result'); }).catch(function () { show('upload'); }); }
    else show('upload');
  }
  if (tok === EXPECT) boot(); else show('gate');
})();
