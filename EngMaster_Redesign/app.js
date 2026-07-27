/* =============================================================================
   EngMaster — Shell chung
   · Bộ icon SVG nét mảnh (thay toàn bộ emoji của bản gốc)
   · Tự dựng sidebar (PC) · topbar + drawer + thanh tab dưới (Mobile)
   · Ghi nhớ chế độ Sáng / Tối
   Cách dùng:  <body class="app" data-page="tu-vung" data-depth="1">
   ============================================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------- 1. ICONS */
  var P = {
    home:      '<path d="M3 9.6 12 3l9 6.6V20a1 1 0 0 1-1 1h-5v-6.5H9V21H4a1 1 0 0 1-1-1z"/>',
    layers:    '<path d="m12 2.5 9 4.8-9 4.8-9-4.8 9-4.8Z"/><path d="m3 12.3 9 4.8 9-4.8"/><path d="m3 17 9 4.8L21 17"/>',
    repeat:    '<path d="m17 2.5 3.5 3.5L17 9.5"/><path d="M3.5 11.2v-1.2a4 4 0 0 1 4-4h13"/><path d="m7 21.5-3.5-3.5L7 14.5"/><path d="M20.5 12.8V14a4 4 0 0 1-4 4h-13"/>',
    tasks:     '<path d="M9 4.5H7A2 2 0 0 0 5 6.5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-13a2 2 0 0 0-2-2h-2"/><rect x="9" y="2.5" width="6" height="4" rx="1.2"/><path d="m9.2 13.6 1.9 1.9 3.7-3.9"/>',
    book:      '<path d="M12 7.4v13.4"/><path d="M3 18.2a.9.9 0 0 1-.9-.9V4.6a.9.9 0 0 1 .9-.9h5a4 4 0 0 1 4 3.7 4 4 0 0 1 4-3.7h5a.9.9 0 0 1 .9.9v12.7a.9.9 0 0 1-.9.9h-5.6a3.3 3.3 0 0 0-3.4 3 3.3 3.3 0 0 0-3.4-3Z"/>',
    pen:       '<path d="M12.5 20.5H21"/><path d="M16.6 3.4a2.1 2.1 0 0 1 3 3L7.4 18.6 3.4 19.8l1.2-4Z"/>',
    keyboard:  '<rect x="2.2" y="6" width="19.6" height="12" rx="2.2"/><path d="M6 10h.01M9.4 10h.01M12.8 10h.01M16.2 10h.01M18.4 13.4h.01M5.6 13.4h.01M8.6 13.6h6.8"/>',
    chart:     '<path d="M3.2 3.2v17.6h17.6"/><rect x="6.8" y="12.4" width="2.8" height="5.4" rx="1"/><rect x="12" y="8.6" width="2.8" height="9.2" rx="1"/><rect x="17.2" y="5" width="2.8" height="12.8" rx="1"/>',
    settings:  '<path d="M12.2 2.5h-.4a1.9 1.9 0 0 0-1.9 1.9v.2a1.9 1.9 0 0 1-.9 1.6l-.4.2a1.9 1.9 0 0 1-1.9 0l-.2-.1a1.9 1.9 0 0 0-2.6.7l-.2.4a1.9 1.9 0 0 0 .7 2.6l.2.1a1.9 1.9 0 0 1 .9 1.6v.5a1.9 1.9 0 0 1-.9 1.6l-.2.1a1.9 1.9 0 0 0-.7 2.6l.2.4a1.9 1.9 0 0 0 2.6.7l.2-.1a1.9 1.9 0 0 1 1.9 0l.4.2a1.9 1.9 0 0 1 .9 1.6v.2a1.9 1.9 0 0 0 1.9 1.9h.4a1.9 1.9 0 0 0 1.9-1.9v-.2a1.9 1.9 0 0 1 .9-1.6l.4-.2a1.9 1.9 0 0 1 1.9 0l.2.1a1.9 1.9 0 0 0 2.6-.7l.2-.4a1.9 1.9 0 0 0-.7-2.6l-.2-.1a1.9 1.9 0 0 1-.9-1.6v-.5a1.9 1.9 0 0 1 .9-1.6l.2-.1a1.9 1.9 0 0 0 .7-2.6l-.2-.4a1.9 1.9 0 0 0-2.6-.7l-.2.1a1.9 1.9 0 0 1-1.9 0l-.4-.2a1.9 1.9 0 0 1-.9-1.6v-.2a1.9 1.9 0 0 0-1.9-1.9Z"/><circle cx="12" cy="12" r="2.9"/>',
    menu:      '<path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17"/>',
    x:         '<path d="M18 6 6 18M6 6l12 12"/>',
    left:      '<path d="m14.5 18.5-6.5-6.5 6.5-6.5"/>',
    right:     '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
    down:      '<path d="m6.5 9.5 5.5 5.5 5.5-5.5"/>',
    plus:      '<path d="M12 5v14M5 12h14"/>',
    search:    '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4-4"/>',
    trash:     '<path d="M3.5 6.2h17"/><path d="M8.5 6.2V4.4a1.2 1.2 0 0 1 1.2-1.2h4.6a1.2 1.2 0 0 1 1.2 1.2v1.8"/><path d="M18.6 6.2v13.4a1.2 1.2 0 0 1-1.2 1.2H6.6a1.2 1.2 0 0 1-1.2-1.2V6.2"/><path d="M10.2 10.5v6M13.8 10.5v6"/>',
    pencil:    '<path d="M16.8 3.4a2.1 2.1 0 0 1 3 3L7.4 18.8 3.4 20l1.2-4Z"/><path d="m14.8 5.4 3 3"/>',
    speak:     '<path d="M11 5.2 6.4 9.2H2.8v5.6h3.6L11 18.8Z"/><path d="M15 9.4a3.6 3.6 0 0 1 0 5.2"/><path d="M17.8 6.6a7.6 7.6 0 0 1 0 10.8"/>',
    sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 2.4v2.2M12 19.4v2.2M4.6 4.6 6.2 6.2M17.8 17.8l1.6 1.6M2.4 12h2.2M19.4 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>',
    moon:      '<path d="M20.8 13.1A8.6 8.6 0 1 1 11 3.3a6.8 6.8 0 0 0 9.8 9.8Z"/>',
    flame:     '<path d="M8.6 14.4A2.4 2.4 0 0 0 11 12c0-1.3-.5-1.9-1-2.9-1-2 .1-4 2.3-5.8.5 2.4 1.9 4.7 3.8 6.2 1.9 1.5 2.9 3.4 2.9 5.3a7 7 0 1 1-14 0c0-1.1.4-2.2 1-2.9a2.4 2.4 0 0 0 2.6 2.5Z"/>',
    clock:     '<circle cx="12" cy="12" r="8.8"/><path d="M12 7v5.2l3.2 2"/>',
    sparkle:   '<path d="m12 3.2 1.9 5 5 1.9-5 1.9-1.9 5-1.9-5-5-1.9 5-1.9Z"/><path d="M18.6 15.4 19.3 17.5l2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z"/>',
    bell:      '<path d="M18 8.6a6 6 0 1 0-12 0c0 6.4-2.6 8.2-2.6 8.2h17.2S18 15 18 8.6"/><path d="M13.7 20.4a2 2 0 0 1-3.4 0"/>',
    check:     '<path d="m20 6.5-11 11-5-5"/>',
    arrowR:    '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
    logout:    '<path d="M9.5 20.8H5.4a1.9 1.9 0 0 1-1.9-1.9V5.1a1.9 1.9 0 0 1 1.9-1.9h4.1"/><path d="m16.2 16.8 4.8-4.8-4.8-4.8"/><path d="M21 12H9.4"/>',
    database:  '<ellipse cx="12" cy="5.4" rx="8.4" ry="2.9"/><path d="M3.6 5.4v13.2c0 1.6 3.8 2.9 8.4 2.9s8.4-1.3 8.4-2.9V5.4"/><path d="M3.6 12c0 1.6 3.8 2.9 8.4 2.9s8.4-1.3 8.4-2.9"/>',
    activity:  '<path d="M21.5 12h-3.9l-2.9 8.5L9 3.5l-2.9 8.5H2.5"/>',
    calendar:  '<rect x="3.2" y="5" width="17.6" height="16" rx="2.2"/><path d="M8 3v4M16 3v4M3.2 10.4h17.6"/>',
    target:    '<circle cx="12" cy="12" r="8.8"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
    zap:       '<path d="M13.2 2.5 4.5 13.8h6.6l-1.3 7.7 8.7-11.3h-6.6Z"/>',
    file:      '<path d="M14 3.2H7.4a2 2 0 0 0-2 2v13.6a2 2 0 0 0 2 2h9.2a2 2 0 0 0 2-2V7.8Z"/><path d="M14 3.2v4.6h4.6"/><path d="M9 13h6M9 16.6h4"/>',
    folder:    '<path d="M3.2 6.8a2 2 0 0 1 2-2h3.6l2.1 2.5h7.9a2 2 0 0 1 2 2v8.9a2 2 0 0 1-2 2H5.2a2 2 0 0 1-2-2Z"/>',
    headphone: '<path d="M4 15.2v-3a8 8 0 0 1 16 0v3"/><path d="M4 15.2a2 2 0 0 1 2-2h1.2v6.4H6a2 2 0 0 1-2-2Z"/><path d="M20 15.2a2 2 0 0 0-2-2h-1.2v6.4H18a2 2 0 0 0 2-2Z"/>',
    shuffle:   '<path d="M16.4 3.4h4.4v4.4"/><path d="M3.6 20.4 20.8 3.4"/><path d="M20.8 16.2v4.4h-4.4"/><path d="m14.8 14.8 6 5.8"/><path d="m3.6 3.4 5 4.8"/>',
    undo:      '<path d="M9 14.4 4 9.4l5-5"/><path d="M4 9.4h11a5.2 5.2 0 0 1 0 10.4h-3.6"/>',
    save:      '<path d="M18.8 21H5.2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l4.6 4.6V19a2 2 0 0 1-2 2Z"/><path d="M16.8 21v-7.6H7.2V21M7.2 3v4.6h7.2"/>',
    refresh:   '<path d="M20.8 12a8.8 8.8 0 1 1-2.9-6.5"/><path d="M20.8 4.2v5h-5"/>',
    bulb:      '<path d="M9.4 18.4h5.2"/><path d="M10.4 21.4h3.2"/><path d="M12 2.6a6.8 6.8 0 0 0-3.9 12.4v2.2h7.8v-2.2A6.8 6.8 0 0 0 12 2.6Z"/>',
    eye:       '<path d="M2.4 12S6 5.4 12 5.4 21.6 12 21.6 12 18 18.6 12 18.6 2.4 12 2.4 12Z"/><circle cx="12" cy="12" r="2.9"/>',
    user:      '<circle cx="12" cy="8.2" r="3.9"/><path d="M4.4 20.6a7.6 7.6 0 0 1 15.2 0"/>',
    trend:     '<path d="m3.4 16.8 5.8-5.8 3.6 3.6 7.8-7.8"/><path d="M16.4 6.8h4.2V11"/>',
    alert:     '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.6v5M12 16.2v.01"/>',
    type:      '<path d="M4.4 7.4V5.2h15.2v2.2"/><path d="M12 5.2v13.6"/><path d="M9 18.8h6"/>',
    grid:      '<rect x="3.2" y="3.2" width="7.2" height="7.2" rx="1.8"/><rect x="13.6" y="3.2" width="7.2" height="7.2" rx="1.8"/><rect x="3.2" y="13.6" width="7.2" height="7.2" rx="1.8"/><rect x="13.6" y="13.6" width="7.2" height="7.2" rx="1.8"/>',
    dots:      '<circle cx="5.2" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="18.8" cy="12" r="1.35" fill="currentColor" stroke="none"/>',
    dice:      '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3.4"/><circle cx="8.6" cy="8.6" r="1.25" fill="currentColor" stroke="none"/><circle cx="15.4" cy="15.4" r="1.25" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/>',
    play:      '<path d="M7.4 4.6v14.8L19.6 12Z"/>',
    lock:      '<rect x="4.2" y="10.4" width="15.6" height="10.4" rx="2.2"/><path d="M8 10.4V7.6a4 4 0 0 1 8 0v2.8"/>',
    mail:      '<rect x="2.6" y="4.8" width="18.8" height="14.4" rx="2.2"/><path d="m3.4 6.6 8.6 6 8.6-6"/>',
    stack:     '<rect x="7.6" y="3.2" width="13.2" height="13.2" rx="2.4"/><path d="M16.4 20.8H5.6a2.4 2.4 0 0 1-2.4-2.4V7.6"/>',
    cloud:     '<path d="M6.6 18.4a4.2 4.2 0 0 1-.4-8.4 5.6 5.6 0 0 1 10.8-1.2 3.9 3.9 0 0 1 .6 7.7Z"/>',
    inbox:     '<path d="M3.4 12.6h4.4l1.4 2.6h5.6l1.4-2.6h4.4"/><path d="M5.6 4.6h12.8l2.2 8v5.2a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2v-5.2Z"/>',
    lang:      '<path d="M3.6 6.2h9.2"/><path d="M8.2 4v2.2"/><path d="M11.2 6.2c0 4-3.4 7.6-7.6 8.8"/><path d="M6 10.6c1.4 2.4 3.6 4 6.2 4.6"/><path d="m12.6 20.4 4-9.4 4 9.4"/><path d="M14.2 17.4h4.8"/>',
    grammar:   '<path d="M3.6 5.8h16.8M3.6 11.2h10.4M3.6 16.6h6.6"/><path d="m13.6 18.6 2.4 2.4 4.6-5"/>',
    flag:      '<path d="M4.6 21.4V3.4"/><path d="M4.6 4.2h11.2l-1.6 3.6 1.6 3.6H4.6Z"/><path d="M15.8 7.8h3.6v7.8H8.4"/>',
    upload:    '<path d="M20.6 15.4v3.8a1.8 1.8 0 0 1-1.8 1.8H5.2a1.8 1.8 0 0 1-1.8-1.8v-3.8"/><path d="m7.8 8.4 4.2-4.2 4.2 4.2"/><path d="M12 4.2v11.4"/>',
    download:  '<path d="M20.6 15.4v3.8a1.8 1.8 0 0 1-1.8 1.8H5.2a1.8 1.8 0 0 1-1.8-1.8v-3.8"/><path d="m7.8 10.6 4.2 4.2 4.2-4.2"/><path d="M12 14.8V3.4"/>'
  };

  function svg(name, cls) {
    var d = P[name] || P.dots;
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }
  window.EMIcon = svg;

  /* --------------------------------------------------------------- 2. NAV */
  var NAV = [
    { g: '', items: [
      { id: 'trang-chu', label: 'Trang chủ', ico: 'home', href: '02-trang-chu/index.html' }
    ]},
    { g: 'Luyện tập', items: [
      { id: 'tu-vung',  label: 'Từ vựng',  ico: 'layers',  href: '03-tu-vung/index.html', count: '98' },
      { id: 'on-tap',   label: 'Ôn tập',   ico: 'repeat',  href: '04-on-tap/index.html',  count: '98' },
      { id: 'bai-tap',  label: 'Bài tập',  ico: 'tasks',   href: '05-bai-tap/index.html' },
      { id: 'ngu-phap', label: 'Ngữ pháp', ico: 'grammar', href: '11-ngu-phap/index.html', count: '16' }
    ]},
    { g: 'Kỹ năng', items: [
      { id: 'doc',      label: 'Đọc',      ico: 'book',     href: '06-doc/index.html' },
      { id: 'viet',     label: 'Viết',     ico: 'pen',      href: '07-viet/index.html' },
      { id: 'chep-cau', label: 'Chép câu', ico: 'keyboard', href: '08-chep-cau/index.html' }
    ]},
    { g: 'Khác', items: [
      { id: 'thong-ke', label: 'Thống kê', ico: 'chart',    href: '09-thong-ke/index.html' },
      { id: 'cai-dat',  label: 'Cài đặt',  ico: 'settings', href: '10-cai-dat/index.html' }
    ]}
  ];
  var TABS = ['trang-chu', 'tu-vung', 'on-tap', 'bai-tap'];

  function flat() {
    var a = []; NAV.forEach(function (g) { g.items.forEach(function (i) { a.push(i); }); }); return a;
  }
  function byId(id) { return flat().filter(function (x) { return x.id === id; })[0]; }

  /* ------------------------------------------------------------- 3. THEME */
  var KEY = 'em-theme';
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-btn]'), function (b) {
      b.classList.toggle('is-active', b.dataset.themeBtn === t);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-toggle]'), function (b) {
      b.innerHTML = svg(t === 'dark' ? 'sun' : 'moon');
      b.title = t === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
    });
  }
  (function initTheme() {
    var t = 'light';
    try { t = localStorage.getItem(KEY) || 'light'; } catch (e) {}
    document.documentElement.setAttribute('data-theme', t);
  })();
  window.EMTheme = {
    apply: applyTheme,
    toggle: function () {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    }
  };

  /* -------------------------------------------------------------- 4. SHELL */
  function build() {
    var body = document.body;
    if (!body.classList.contains('app')) { hydrate(); return; }

    var active = body.dataset.page || '';
    var up = (body.dataset.depth === '1') ? '../' : '';
    var cur = byId(active);
    var title = body.dataset.title || (cur ? cur.label : 'EngMaster');

    /* ---- Sidebar */
    var groups = NAV.map(function (g) {
      var items = g.items.map(function (i) {
        return '<a class="nav-item' + (i.id === active ? ' is-active' : '') + '" href="' + up + i.href + '">' +
               svg(i.ico) + '<span>' + i.label + '</span>' +
               (i.count ? '<span class="nav-count">' + i.count + '</span>' : '') + '</a>';
      }).join('');
      return '<div class="side-group">' +
             (g.g ? '<div class="side-group-label">' + g.g + '</div>' : '') + items + '</div>';
    }).join('');

    var side = document.createElement('nav');
    side.className = 'side';
    side.id = 'emSide';
    side.innerHTML =
      '<div class="side-brand">' +
        '<span class="brand-mark">E</span>' +
        '<span class="brand-name">EngMaster</span>' +
        '<span class="spacer"></span>' +
        '<button class="icon-btn" id="emSideClose" aria-label="Đóng menu">' + svg('x') + '</button>' +
      '</div>' +
      '<div class="side-scroll">' + groups + '</div>' +
      '<div class="side-foot">' +
        '<a class="side-user" href="' + up + '10-cai-dat/index.html">' +
          '<span class="avatar">T</span>' +
          '<span class="side-user-txt"><b>thieentraan</b><span>Đã đồng bộ</span></span>' +
        '</a>' +
        '<button class="icon-btn" data-theme-toggle aria-label="Đổi giao diện"></button>' +
      '</div>';

    /* ---- Topbar (mobile) */
    var top = document.createElement('header');
    top.className = 'topbar';
    top.innerHTML =
      '<button class="icon-btn" id="emMenu" aria-label="Mở menu">' + svg('menu') + '</button>' +
      '<span class="topbar-title">' + title + '</span>' +
      '<button class="icon-btn" data-theme-toggle aria-label="Đổi giao diện"></button>';

    /* ---- Thanh tab dưới (mobile) */
    var tabs = TABS.map(function (id) {
      var i = byId(id);
      return '<a class="' + (i.id === active ? 'is-active' : '') + '" href="' + up + i.href + '">' +
             svg(i.ico) + '<span>' + i.label + '</span></a>';
    }).join('');
    var bar = document.createElement('nav');
    bar.className = 'tabbar';
    bar.innerHTML = tabs + '<a id="emMore" href="#">' + svg('dots') + '<span>Thêm</span></a>';

    var scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.id = 'emScrim';

    var main = document.querySelector('.main');
    body.insertBefore(side, body.firstChild);
    body.insertBefore(scrim, main || null);
    if (main) main.insertBefore(top, main.firstChild);
    body.appendChild(bar);

    /* ---- Tương tác drawer */
    function setOpen(v) {
      side.classList.toggle('is-open', v);
      scrim.classList.toggle('is-open', v);
      document.body.style.overflow = v ? 'hidden' : '';
    }
    document.getElementById('emMenu').onclick = function () { setOpen(true); };
    document.getElementById('emMore').onclick = function (e) { e.preventDefault(); setOpen(true); };
    document.getElementById('emSideClose').onclick = function () { setOpen(false); };
    scrim.onclick = function () { setOpen(false); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 920) setOpen(false); });

    hydrate();
  }

  /* ---- Thay <i data-ico="…"> bằng SVG + gắn nút đổi theme */
  function hydrate() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-ico]'), function (el) {
      var extra = (el.getAttribute('class') || '').replace(/\bico\b/g, '').trim();
      el.outerHTML = svg(el.getAttribute('data-ico'), extra);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-toggle]'), function (b) {
      if (b.dataset.bound) return; b.dataset.bound = '1';
      b.addEventListener('click', function () { window.EMTheme.toggle(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-btn]'), function (b) {
      if (b.dataset.bound) return; b.dataset.bound = '1';
      b.addEventListener('click', function () { applyTheme(b.getAttribute('data-theme-btn')); });
    });
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }
  window.EMHydrate = hydrate;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
