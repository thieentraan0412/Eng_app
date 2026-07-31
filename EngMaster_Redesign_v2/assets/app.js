/* ============================================================
   EngMaster v2 "Horizon Lumina" — shared runtime
   1) SVG icon sprite  2) App shell (topbar/sidebar/tabbar)
   3) Theme Sáng/Tối   4) Micro-behaviors (menu/flip/tabs/pills)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. SVG sprite ---------- */
  var I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6.5h5V21"/>',
    cards: '<rect x="3" y="7.5" width="13" height="13" rx="2.5"/><path d="M8.5 7.5V6a2.5 2.5 0 0 1 2.5-2.5h7.5A2.5 2.5 0 0 1 21 6v7.5a2.5 2.5 0 0 1-2.5 2.5H17"/>',
    repeat: '<path d="m17 2.5 4 4-4 4"/><path d="M3 11.5v-1a4 4 0 0 1 4-4h14"/><path d="m7 21.5-4-4 4-4"/><path d="M21 12.5v1a4 4 0 0 1-4 4H3"/>',
    task: '<rect x="5" y="4" width="14" height="17.5" rx="2.5"/><path d="M9 4V3.4A1.4 1.4 0 0 1 10.4 2h3.2A1.4 1.4 0 0 1 15 3.4V4"/><path d="m9 13.5 2.2 2.2 4.3-4.7"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    'lines-pen': '<path d="M4 5.5h9"/><path d="M4 10h6"/><path d="M4 14.5h5"/><path d="m13.2 18 6.1-6.1a1.9 1.9 0 0 1 2.7 2.7l-6.1 6.1L13 21z"/>',
    chart: '<path d="M3.5 3.5v17h17"/><path d="M8 16.5V11"/><path d="M12.5 16.5v-9"/><path d="M17 16.5V8.5"/>',
    sliders: '<path d="M4 7h9"/><circle cx="16.5" cy="7" r="2.3"/><path d="M18.8 7H21"/><path d="M4 15.5h3"/><circle cx="10.5" cy="15.5" r="2.3"/><path d="M12.8 15.5H21"/>',
    menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/>',
    x: '<path d="m6 6 12 12"/><path d="M18 6 6 18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2"/><path d="M12 19.5v2"/><path d="M2.5 12h2"/><path d="M19.5 12h2"/><path d="m5 5 1.4 1.4"/><path d="m17.6 17.6 1.4 1.4"/><path d="m19 5-1.4 1.4"/><path d="M6.4 17.6 5 19"/>',
    moon: '<path d="M21 13.3A8.6 8.6 0 1 1 10.7 3a7 7 0 1 0 10.3 10.3z"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    'arr-r': '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    'arr-l': '<path d="M20 12H5"/><path d="m11 18-6-6 6-6"/>',
    'chev-r': '<path d="m9 5 7 7-7 7"/>',
    bell: '<path d="M18 9.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5"/><path d="M10.4 20a2 2 0 0 0 3.2 0"/>',
    flame: '<path d="M12 3c1.5 2.6 5 5.4 5 9.2a5 5 0 0 1-10 0c0-1.5.5-2.9 1.4-4.2.6 1 1.4 1.7 2.3 2.2C10.2 7.7 11 5.3 12 3z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    sparkle: '<path d="m12 3.5 1.6 4.9 4.9 1.6-4.9 1.6L12 16.5l-1.6-4.9L5.5 10l4.9-1.6z"/><path d="m18.5 15.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    'list-check': '<path d="M11 6h9"/><path d="M11 12h9"/><path d="M11 18h9"/><path d="m3.5 5.5 1.5 1.5 2.5-2.5"/><path d="m3.5 11.5 1.5 1.5 2.5-2.5"/><path d="m3.5 17.5 1.5 1.5 2.5-2.5"/>',
    shuffle: '<path d="M16 4h4.5v4.5"/><path d="M4 19.5 20.5 4"/><path d="M20.5 15.5V20H16"/><path d="m14.5 14.5 6 5.5"/><path d="M4 4.5 9.5 9.5"/>',
    speaker: '<path d="M11.5 5 6.5 9H3.5v6h3l5 4z"/><path d="M15.5 8.7a4.7 4.7 0 0 1 0 6.6"/><path d="M18.3 6a8.7 8.7 0 0 1 0 12"/>',
    trash: '<path d="M4 7h16"/><path d="M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7"/><path d="m6.5 7 .9 12.6a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/><path d="M10 11v5.5"/><path d="M14 11v5.5"/>',
    edit: '<path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17z"/><path d="m13.5 7 3 3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.5-4.5"/>',
    folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.6L12 7.5h6.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>',
    headphone: '<path d="M4 14.5v-2.3a8 8 0 0 1 16 0v2.3"/><path d="M4 14.5h2.3a1.2 1.2 0 0 1 1.2 1.2v3.1A1.2 1.2 0 0 1 6.3 20H4z"/><path d="M20 14.5h-2.3a1.2 1.2 0 0 0-1.2 1.2v3.1a1.2 1.2 0 0 0 1.2 1.2H20z"/>',
    bulb: '<path d="M9.5 18.5h5"/><path d="M10.2 21.5h3.6"/><path d="M12 2.8a6.2 6.2 0 0 1 3.6 11.2c-.8.6-1.1 1.4-1.1 2.2v.3h-5v-.3c0-.8-.3-1.6-1.1-2.2A6.2 6.2 0 0 1 12 2.8z"/>',
    key: '<circle cx="7.5" cy="15.5" r="3.8"/><path d="m10.5 12.5 9-9"/><path d="m16.5 6.5 3 3"/><path d="m13.5 9.5 2.5 2.5"/>',
    logout: '<path d="M9.5 4H6.5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="m15.5 8 4 4-4 4"/><path d="M19.5 12h-10"/>',
    user: '<circle cx="12" cy="8" r="3.7"/><path d="M5 20.2c1.2-3.5 3.9-5.2 7-5.2s5.8 1.7 7 5.2"/>',
    refresh: '<path d="M21 4.5V10h-5.5"/><path d="M20.3 14.5A8.5 8.5 0 1 1 18.6 7L21 10"/>',
    dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/>',
    save: '<path d="M19.5 21h-15A1.5 1.5 0 0 1 3 19.5v-15A1.5 1.5 0 0 1 4.5 3H16l5 5v11.5a1.5 1.5 0 0 1-1.5 1.5z"/><path d="M17 21v-7.5H7V21"/><path d="M7 3v4.5h7.5"/>',
    undo: '<path d="M8.5 5.5 4 10l4.5 4.5"/><path d="M4 10h10.5a5 5 0 0 1 0 10H10"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.6 2.5 2.6 14.5 0 17"/><path d="M12 3.5c-2.6 2.5-2.6 14.5 0 17"/>',
    keyboard: '<rect x="3" y="7" width="18" height="11" rx="2.2"/><path d="M7 14.8h10"/><path d="M6.5 11h.01"/><path d="M9.5 11h.01"/><path d="M12.5 11h.01"/><path d="M15.5 11h.01"/><path d="M18 11h.01"/>',
    cloud: '<path d="M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 2.8V7"/><path d="M16 2.8V7"/>',
    database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8v-13"/><path d="M4.5 12c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8"/>',
    activity: '<path d="M3 12.5h3.5l3 7.5 4.5-16 3 8.5H21"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><path d="M12 7.6h.01"/>',
    spell: '<path d="m4 15 4.5-10L13 15"/><path d="M5.6 11.5h5.8"/><path d="m15 13.5 2.5 2.5 4.5-6.5"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'
  };
  var sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">';
  for (var k in I) sprite += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + I[k] + '</symbol>';
  sprite += '</svg>';
  document.body.insertAdjacentHTML('afterbegin', sprite);

  function ic(name, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '"><use href="#i-' + name + '"/></svg>'; }
  window.EM = { icon: ic };

  /* ---------- 2. Theme ---------- */
  var root = document.documentElement;
  function getTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    try { return localStorage.getItem('em-theme') || 'light'; } catch (e) { return 'light'; }
  }
  function setTheme(t) {
    t = t === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('em-theme', t); } catch (e) {}
    syncThemeUI();
  }
  function syncThemeUI() {
    var t = getTheme();
    document.querySelectorAll('[data-set-theme]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-set-theme') === t);
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.innerHTML = ic(t === 'dark' ? 'sun' : 'moon');
    });
  }
  window.EM.setTheme = setTheme;

  /* ---------- 3. App shell ---------- */
  var B = document.body;
  var PAGE = B.getAttribute('data-page') || '';
  var TITLE = B.getAttribute('data-title') || 'EngMaster';
  var ROOT = B.hasAttribute('data-root') ? B.getAttribute('data-root') : '../';

  var NAV = [
    { sec: 'Tổng quan' },
    { id: 'home', t: 'Trang chủ', i: 'home', h: '02-trang-chu/index.html' },
    { id: 'stats', t: 'Thống kê', i: 'chart', h: '09-thong-ke/index.html' },
    { sec: 'Học từ vựng' },
    { id: 'vocab', t: 'Từ vựng', i: 'cards', h: '03-tu-vung/index.html' },
    { id: 'review', t: 'Ôn tập', i: 'repeat', h: '04-on-tap/index.html' },
    { id: 'quiz', t: 'Bài tập', i: 'task', h: '05-bai-tap/index.html' },
    { sec: 'Kỹ năng' },
    { id: 'read', t: 'Đọc', i: 'book', h: '06-doc/index.html' },
    { id: 'write', t: 'Viết', i: 'pen', h: '07-viet/index.html' },
    { id: 'copy', t: 'Chép câu', i: 'lines-pen', h: '08-chep-cau/index.html' },
    { sec: 'Hệ thống' },
    { id: 'settings', t: 'Cài đặt', i: 'sliders', h: '10-cai-dat/index.html' }
  ];

  if (B.getAttribute('data-shell') !== 'none') {
    var main = document.querySelector('main.content');
    if (main) {
      var navHtml = '';
      NAV.forEach(function (n) {
        if (n.sec) { navHtml += '<div class="nav-sec">' + n.sec + '</div>'; return; }
        navHtml += '<a href="' + ROOT + n.h + '"' + (n.id === PAGE ? ' class="active"' : '') + '>' + ic(n.i) + n.t + '</a>';
      });

      var side = document.createElement('aside');
      side.className = 'sidebar'; side.id = 'sidebar';
      side.innerHTML =
        '<div class="brand"><div class="brand-mark">E</div>' +
        '<div><div class="brand-name">EngMaster</div><div class="brand-sub">Học tiếng Anh</div></div>' +
        '<button class="side-close" id="sideClose" aria-label="Đóng menu">' + ic('x') + '</button></div>' +
        '<nav class="nav">' + navHtml + '</nav>' +
        '<div class="side-foot">' +
        '<div class="theme-seg" role="group" aria-label="Giao diện">' +
        '<button data-set-theme="light">' + ic('sun') + 'Sáng</button>' +
        '<button data-set-theme="dark">' + ic('moon') + 'Tối</button></div>' +
        '<div class="side-user"><div class="ava">T</div><div><b>thieentraan</b><span>Gói miễn phí</span></div></div>' +
        '<div class="side-ver"><span>v2.0 · Horizon Lumina</span><span>© EngMaster</span></div>' +
        '</div>';

      var top = document.createElement('header');
      top.className = 'topbar';
      top.innerHTML =
        '<button class="tbtn" id="burger" aria-label="Mở menu">' + ic('menu') + '</button>' +
        '<div class="topbar-title">' + TITLE + '</div>' +
        '<button class="tbtn" data-theme-toggle aria-label="Đổi giao diện"></button>';

      var ovl = document.createElement('div');
      ovl.className = 'overlay'; ovl.id = 'overlay';

      var app = document.createElement('div');
      app.className = 'app';

      B.insertBefore(top, main);
      B.insertBefore(ovl, main);
      B.insertBefore(app, main);
      app.appendChild(side);
      app.appendChild(main);

      var TABS = [
        { id: 'home', t: 'Trang chủ', i: 'home', h: '02-trang-chu/index.html' },
        { id: 'vocab', t: 'Từ vựng', i: 'cards', h: '03-tu-vung/index.html' },
        { id: 'review', t: 'Ôn tập', i: 'repeat', h: '04-on-tap/index.html' },
        { id: 'quiz', t: 'Bài tập', i: 'task', h: '05-bai-tap/index.html' }
      ];
      var tabHtml = '';
      TABS.forEach(function (n) {
        tabHtml += '<a href="' + ROOT + n.h + '"' + (n.id === PAGE ? ' class="active"' : '') + '>' + ic(n.i) + n.t + '</a>';
      });
      tabHtml += '<button id="tabMenu">' + ic('menu') + 'Menu</button>';
      var tabbar = document.createElement('nav');
      tabbar.className = 'tabbar';
      tabbar.innerHTML = tabHtml;
      B.appendChild(tabbar);

      /* menu drawer */
      function menu(o) { side.classList.toggle('open', o); ovl.classList.toggle('show', o); }
      document.getElementById('burger').onclick = function () { menu(true); };
      document.getElementById('sideClose').onclick = function () { menu(false); };
      ovl.onclick = function () { menu(false); };
      var tm = document.getElementById('tabMenu'); if (tm) tm.onclick = function () { menu(true); };
    }
  }

  /* ---------- 4. Behaviors ---------- */
  document.addEventListener('click', function (e) {
    var st = e.target.closest('[data-set-theme]');
    if (st) { setTheme(st.getAttribute('data-set-theme')); return; }
    var tg = e.target.closest('[data-theme-toggle]');
    if (tg) { setTheme(getTheme() === 'dark' ? 'light' : 'dark'); return; }
  });
  syncThemeUI();

  document.querySelectorAll('[data-flip]').forEach(function (f) {
    f.addEventListener('click', function () { f.classList.toggle('flipped'); });
    f.querySelectorAll('input,textarea,button').forEach(function (i) {
      i.addEventListener('click', function (e) { e.stopPropagation(); });
    });
  });
  document.querySelectorAll('.tabs:not([data-static])').forEach(function (g) {
    g.querySelectorAll('.tab').forEach(function (t) {
      if (t.tagName === 'BUTTON') t.onclick = function () {
        g.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
      };
    });
  });
  document.querySelectorAll('.pills').forEach(function (g) {
    g.querySelectorAll('.pill').forEach(function (t) {
      t.onclick = function () {
        g.querySelectorAll('.pill').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
      };
    });
  });
})();
