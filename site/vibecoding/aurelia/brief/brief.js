/* Invitation gate: derive a key from the code with PBKDF2-SHA256; the report lives at a path named by that key. */
(function () {
  var SALT = 'aurelia-brief-2026', ITER = 200000;
  var EXPECT = '2e4d2c497ade58dd884eee8f1f50cfbfc5fe5034529c8df1a9659bd01974bc83';
  var form = document.getElementById('gate'), input = document.getElementById('code'), btn = document.getElementById('go'), msg = document.getElementById('msg');
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function derive(code) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(SALT), iterations: ITER }, k, 256);
    }).then(hex);
  }
  function target(h) { return '/vibecoding/aurelia-brief/' + h.slice(0, 16) + '/'; }
  var saved = sessionStorage.getItem('aurelia-brief');
  if (saved === EXPECT) { msg.textContent = '已验证，正在打开…'; location.replace(target(saved)); return; }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = input.value.trim(); if (!code) return;
    btn.disabled = true; msg.className = 'msg'; msg.textContent = '核对中…';
    derive(code).then(function (h) {
      if (h === EXPECT) { sessionStorage.setItem('aurelia-brief', h); msg.textContent = '已验证，正在打开…'; location.href = target(h); }
      else { msg.className = 'msg err'; msg.textContent = '邀请码不对，请再试一次。'; btn.disabled = false; input.select(); }
    }).catch(function () { msg.className = 'msg err'; msg.textContent = '浏览器不支持所需功能，请换一个浏览器。'; btn.disabled = false; });
  });
})();
