// Ghi lại chữ đang bôi đen của trang và gửi về service worker.
//
// Vì sao cần: cách cũ đợi tới lúc bấm phím tắt mới chèn script vào trang để hỏi
// vùng chọn. Cách đó hỏng lặng lẽ ở khá nhiều tình huống — trang chưa cấp xong
// quyền activeTab, khung nhúng khác origin, trang đang tải, trang chặn chèn
// script. Ghi sẵn thì lúc bấm chỉ việc lấy ra, không phụ thuộc gì nữa.
//
// Từ 1.5.0 còn lo luôn phần tự dịch khi bôi đen: hiện bóng dịch ngay cạnh chữ.
;(() => {
  const VERSION = '1.6.0'
  const MAX_SELECTION = 1000
  const DEBOUNCE = 120
  // Thả chuột là dịch luôn — chỉ nhường một nhịp để trình duyệt chốt xong vùng
  // chọn (bấm đúp, bấm ba) rồi mới đọc.
  const MOUSE_DELAY = 10
  // Bôi bằng bàn phím (Shift + mũi tên, Ctrl+A) thì mỗi lần nhấn là một vùng chọn
  // mới: đợi dừng tay mới dịch, không thì gọi dịch vụ dồn dập tới mức bị chặn.
  const KEY_DELAY = 300
  // Vùng chọn đổi mà trong khoảng này không có thao tác chuột/phím nào thì là do
  // trang tự bôi (ô tìm kiếm tự chọn hết chữ khi focus…) — không dịch.
  const GESTURE_WINDOW = 1500
  const RECENT_LIMIT = 50
  const AUTO_KEY = 'autoTranslate'
  const GAP = 8
  const TOAST_MS = 1800
  const SVG_NS = 'http://www.w3.org/2000/svg'

  // Ngữ cảnh của tiện ích chết khi tiện ích được nạp lại / cập nhật / tắt bật.
  // Bản content.js cũ vẫn nằm nguyên trong trang nhưng chrome.runtime biến mất,
  // mọi lần gửi từ đó đều rơi vào hư không.
  const alive = () => {
    try {
      return Boolean(chrome.runtime && chrome.runtime.id)
    } catch {
      return false
    }
  }

  // Chỉ thoát khi trang ĐANG có một bản còn sống cùng phiên bản. Cách cũ chỉ nhìn
  // một cờ boolean: nạp lại tiện ích xong, bản mới vừa chèn vào thấy cờ của bản
  // cũ (đã chết) liền tự thoát — thành ra trang không còn ai bắt Alt+X lẫn ghi
  // chữ bôi đen, mà nhìn bên ngoài thì y như bình thường.
  const prev = window.__engmaster
  if (prev && prev.version === VERSION && typeof prev.alive === 'function') {
    let ok = false
    try {
      ok = prev.alive()
    } catch {
      ok = false
    }
    if (ok) return
  }
  if (prev && typeof prev.teardown === 'function') {
    try {
      prev.teardown()
    } catch {
      // Bản cũ đã chết hẳn, không gỡ được thì thôi.
    }
  }

  // Trang Dịch nhanh nhúng trong cửa sổ của tiện ích cũng khớp <all_urls>. Bỏ qua
  // nó, không thì bấm Alt+X lúc đang tra sẽ nạp lại chính cửa sổ đó.
  const isQuickTranslatePage =
    new URLSearchParams(location.search).get('view') === 'quick-translate'

  let lastSent = ''
  let timer = 0

  function send(payload) {
    if (!alive()) {
      teardown()
      return false
    }
    try {
      const p = chrome.runtime.sendMessage(payload)
      // MV3 báo lỗi kiểu bất đồng bộ (service worker vừa chết, tiện ích vừa nạp
      // lại) — try/catch không bắt được, không nuốt thì trang đầy lỗi đỏ.
      if (p && typeof p.catch === 'function') p.catch(() => {})
      return true
    } catch {
      return false
    }
  }

  // Như send nhưng đợi service worker trả lời. Lỗi gì cũng ra null.
  function ask(payload) {
    if (!alive()) {
      teardown()
      return Promise.resolve(null)
    }
    try {
      return Promise.resolve(chrome.runtime.sendMessage(payload)).catch(() => null)
    } catch {
      return Promise.resolve(null)
    }
  }

  // Chrome không tính chữ bôi đen trong <input>/<textarea> vào window.getSelection()
  function currentSelection() {
    const active = document.activeElement
    const tag = active && active.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      const { selectionStart: from, selectionEnd: to } = active
      if (typeof from === 'number' && typeof to === 'number' && to > from) {
        const picked = String(active.value || '')
          .slice(from, to)
          .trim()
        if (picked) return picked.slice(0, MAX_SELECTION)
      }
    }
    const picked = String(window.getSelection() || '').trim()
    return picked ? picked.slice(0, MAX_SELECTION) : ''
  }

  function push() {
    const text = currentSelection()
    // Bỏ chọn (text rỗng) thì GIỮ nguyên chữ cũ: bấm phím tắt đôi khi làm trang
    // mất vùng chọn, xoá đi là mất luôn thứ người dùng vừa bôi.
    if (!text || text === lastSent) return
    // Chỉ ghi nhận là "đã gửi" khi gửi trót lọt. Ghi trước như cách cũ thì một
    // lần gửi hỏng là chữ đó không bao giờ được gửi lại nữa.
    if (send({ type: 'engmaster-selection', text })) lastSent = text
  }

  // Gửi ngay, không đợi hết nhịp chờ, và gửi kể cả khi trùng chữ lần trước.
  function pushNow() {
    clearTimeout(timer)
    const text = currentSelection()
    if (!text) return
    if (send({ type: 'engmaster-selection', text })) lastSent = text
  }

  function schedule() {
    clearTimeout(timer)
    timer = setTimeout(push, DEBOUNCE)
  }

  // ---------- Tự dịch khi bôi đen ----------
  // Mặc định bật; tắt/bật bằng Alt+Shift+X hoặc công tắc trong trang cài đặt.
  // Việc gọi dịch vụ dịch do service worker làm (trang chặn CORS), ở đây chỉ
  // hiện bóng dịch.

  const LANG_NAMES = {
    en: 'Anh',
    vi: 'Việt',
    ja: 'Nhật',
    ko: 'Hàn',
    zh: 'Trung',
    'zh-CN': 'Trung',
    'zh-TW': 'Trung',
    fr: 'Pháp',
    de: 'Đức',
    es: 'Tây Ban Nha',
    ru: 'Nga',
    th: 'Thái',
  }

  const SPEECH_LANGS = {
    en: 'en-US',
    vi: 'vi-VN',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    fr: 'fr-FR',
    de: 'de-DE',
    es: 'es-ES',
    ru: 'ru-RU',
    th: 'th-TH',
  }

  // Từ loại (mã rút gọn service worker gửi về): [nhãn, tên tiếng Việt, tông màu]
  const POS_INFO = {
    n: ['N', 'Danh từ', 'n'],
    v: ['V', 'Động từ', 'v'],
    adj: ['ADJ', 'Tính từ', 'adj'],
    adv: ['ADV', 'Trạng từ', 'adv'],
    pron: ['PRON', 'Đại từ', 'pron'],
    prep: ['PREP', 'Giới từ', 'prep'],
    conj: ['CONJ', 'Liên từ', 'conj'],
    interj: ['INTERJ', 'Thán từ', 'interj'],
    aux: ['AUX', 'Trợ động từ', 'v'],
    art: ['ART', 'Mạo từ', 'other'],
    abbr: ['ABBR', 'Viết tắt', 'other'],
  }

  const CSS = `
    .bubble {
      position: fixed;
      top: 0;
      left: 0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      width: max-content;
      min-width: 240px;
      max-width: min(400px, calc(100vw - 16px));
      max-height: min(400px, calc(100vh - 16px));
      overflow: hidden;
      background: #111827;
      color: #e5e7eb;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 14px;
      box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0, 0, 0, 0.25);
      font: 14px/1.5 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-style: normal;
      font-weight: 400;
      text-align: left;
      text-transform: none;
      letter-spacing: normal;
      -webkit-font-smoothing: antialiased;
      animation: fade 0.12s ease-out;
    }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    .bubble[hidden], .toast[hidden], .skeleton[hidden], .icon[hidden] { display: none; }
    .head {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 30px;
      padding: 8px 8px 0 14px;
    }
    .word {
      display: flex;
      flex: 1 1 auto;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 2px 8px;
      min-width: 0;
    }
    .src {
      color: #f9fafb;
      font-size: 15px;
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .phon { color: #9ca3af; font-size: 13px; }
    .src:empty, .phon:empty, .lang:empty { display: none; }
    .tools {
      display: flex;
      flex: none;
      align-items: center;
      gap: 2px;
      margin-left: auto;
    }
    .lang {
      margin-right: 4px;
      padding: 1px 8px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.14);
      color: #9ca3af;
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .icon {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      padding: 0;
      border: 0;
      border-radius: 7px;
      background: none;
      color: #9ca3af;
      cursor: pointer;
    }
    .icon:hover { background: rgba(148, 163, 184, 0.16); color: #f3f4f6; }
    .icon:focus-visible { outline: 2px solid #818cf8; outline-offset: 1px; }
    .icon svg { width: 16px; height: 16px; }
    .body { padding: 4px 14px 13px; overflow: auto; }
    .main {
      color: #f9fafb;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.45;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .main.muted { color: #9ca3af; font-size: 13.5px; font-weight: 400; }
    .senses {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: baseline;
      gap: 7px 10px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(148, 163, 184, 0.16);
    }
    .senses:empty { display: none; }
    .pos {
      justify-self: start;
      box-sizing: border-box;
      min-width: 36px;
      padding: 0 6px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 700;
      line-height: 19px;
      letter-spacing: 0.04em;
      text-align: center;
      cursor: default;
    }
    .terms { color: #cbd5e1; font-size: 13.5px; line-height: 1.5; }
    .terms b { color: #f3f4f6; font-weight: 600; }
    .tone-n { background: rgba(96, 165, 250, 0.16); color: #93c5fd; }
    .tone-v { background: rgba(52, 211, 153, 0.16); color: #6ee7b7; }
    .tone-adj { background: rgba(251, 191, 36, 0.16); color: #fcd34d; }
    .tone-adv { background: rgba(192, 132, 252, 0.18); color: #d8b4fe; }
    .tone-pron { background: rgba(244, 114, 182, 0.16); color: #f9a8d4; }
    .tone-prep { background: rgba(45, 212, 191, 0.16); color: #5eead4; }
    .tone-conj { background: rgba(251, 146, 60, 0.16); color: #fdba74; }
    .tone-interj { background: rgba(248, 113, 113, 0.16); color: #fca5a5; }
    .tone-other { background: rgba(148, 163, 184, 0.16); color: #cbd5e1; }
    .skeleton { display: grid; gap: 8px; padding: 6px 0 2px; }
    .bar {
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(90deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.12));
      background-size: 200% 100%;
      animation: shimmer 1.1s linear infinite;
    }
    .bar + .bar { width: 62%; }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
    @media (prefers-reduced-motion: reduce) { .bubble, .bar { animation: none; } }
    .toast {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #111827;
      color: #e5e7eb;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 999px;
      box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.5);
      font: 13px/1.4 'Segoe UI', system-ui, -apple-system, sans-serif;
      white-space: nowrap;
    }
    .toast b { color: #f9fafb; }
    .toast small { color: #9ca3af; font-size: 12px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #6b7280; }
    .dot.on { background: #4ade80; }
  `

  let autoOn = true
  let autoTimer = 0
  let requestSeq = 0
  let host = null
  let root = null
  let ui = null
  let toast = null
  let toastTimer = 0
  // Vùng chọn đang được dịch — Range để bóng dịch bám theo chữ khi cuộn trang.
  let anchor = null
  let shownText = ''
  let shownFrom = ''
  let frame = 0
  let watching = false
  let toggleKey = 'Alt+Shift+X'
  // Theo dõi chuột/phím để biết lúc nào người dùng bôi đen xong.
  let held = false
  let gestureAt = 0
  let pointerUpAt = 0
  let lastPoint = null
  let lastRoot = document
  // Chữ đã dịch trong trang này: bôi lại là hiện ngay, khỏi chờ service worker
  // (hay ngủ, đánh thức mất vài trăm mili giây) lẫn mạng.
  const recent = new Map()

  function remember(text, res) {
    recent.delete(text)
    recent.set(text, res)
    if (recent.size > RECENT_LIMIT) recent.delete(recent.keys().next().value)
  }

  function el(tag, className, text) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text) node.textContent = text
    return node
  }

  function svgIcon(paths) {
    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '2')
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')
    svg.setAttribute('aria-hidden', 'true')
    for (const d of paths) {
      const path = document.createElementNS(SVG_NS, 'path')
      path.setAttribute('d', d)
      svg.append(path)
    }
    return svg
  }

  // Bóng dịch nằm trong Shadow DOM đóng: CSS của trang không lọt vào làm vỡ
  // giao diện, CSS của bóng dịch cũng không rò ra trang.
  function ensureHost() {
    if (host) {
      if (!host.isConnected) document.documentElement.append(host)
      return
    }
    host = document.createElement('engmaster-translate')
    host.style.cssText =
      'all: initial !important; position: fixed !important; top: 0 !important;' +
      'left: 0 !important; width: 0 !important; height: 0 !important;' +
      'overflow: visible !important; z-index: 2147483647 !important;'
    // popover đưa bóng dịch lên "top layer" — nằm trên cả hộp thoại <dialog>, lớp
    // phủ và video toàn màn hình của trang, những thứ z-index cao mấy cũng không
    // vượt lên được.
    host.setAttribute('popover', 'manual')
    root = host.attachShadow({ mode: 'closed' })
    // Stylesheet dựng sẵn thay vì thẻ <style>: trang có CSP chặt có thể chặn thẻ
    // <style> chèn vào, bóng dịch hiện ra trần trụi.
    try {
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(CSS)
      root.adoptedStyleSheets = [sheet]
    } catch {
      root.append(el('style', '', CSS))
    }
    // Bấm trong bóng dịch đừng để trang tưởng người dùng bấm ra ngoài (đóng
    // menu, bỏ chọn…).
    for (const type of ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup']) {
      host.addEventListener(type, (e) => e.stopPropagation())
    }
    document.documentElement.append(host)
  }

  // Đưa lên trên cùng mỗi lần hiện: trang mở hộp thoại/lớp phủ SAU bóng dịch thì
  // lớp đó nằm trên, mở lại popover mới vượt lên được.
  function raise() {
    if (!host || typeof host.showPopover !== 'function') return
    try {
      if (host.matches(':popover-open')) host.hidePopover()
      host.showPopover()
    } catch {
      // Trình duyệt chưa có popover — còn z-index.
    }
  }

  function buildBubble() {
    ensureHost()
    if (ui) return
    const bubble = el('div', 'bubble')
    bubble.setAttribute('role', 'dialog')
    bubble.setAttribute('aria-label', 'Bản dịch')
    bubble.hidden = true

    const head = el('div', 'head')
    const word = el('div', 'word')
    const src = el('span', 'src')
    const phon = el('span', 'phon')
    word.append(src, phon)

    const tools = el('div', 'tools')
    const lang = el('span', 'lang')
    const speakButton = el('button', 'icon')
    speakButton.type = 'button'
    speakButton.title = 'Đọc to'
    speakButton.setAttribute('aria-label', 'Đọc to')
    speakButton.append(
      svgIcon(['M11 5 6 9H3v6h3l5 4V5z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M18.5 5.5a9 9 0 0 1 0 13']),
    )
    speakButton.addEventListener('click', speak)
    const close = el('button', 'icon')
    close.type = 'button'
    close.title = 'Đóng (Esc)'
    close.setAttribute('aria-label', 'Đóng')
    close.append(svgIcon(['M6 6l12 12', 'M18 6 6 18']))
    close.addEventListener('click', hideBubble)
    tools.append(lang, speakButton, close)
    head.append(word, tools)

    const body = el('div', 'body')
    const skeleton = el('div', 'skeleton')
    skeleton.append(el('div', 'bar'), el('div', 'bar'))
    const main = el('div', 'main')
    const senses = el('div', 'senses')
    body.append(skeleton, main, senses)

    bubble.append(head, body)
    root.append(bubble)
    ui = { bubble, src, phon, lang, speak: speakButton, skeleton, main, senses }
  }

  const bubbleShown = () => Boolean(ui && !ui.bubble.hidden)
  const acceptable = (text) => Boolean(text) && text.length <= MAX_SELECTION && /\p{L}/u.test(text)

  // activeElement đi xuyên Shadow DOM: ô nhập nằm trong web component thì
  // document.activeElement chỉ trỏ tới vỏ ngoài.
  function deepActive() {
    let active = document.activeElement
    while (active && active.shadowRoot && active.shadowRoot.activeElement) {
      active = active.shadowRoot.activeElement
    }
    return active
  }

  // Chữ đang bôi đen để tự dịch, kèm thứ để định vị bóng dịch.
  function autoSelection() {
    if (!document.body) return null
    const active = deepActive()
    const tag = active && active.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      let from = null
      let to = null
      try {
        from = active.selectionStart
        to = active.selectionEnd
      } catch {
        // Ô kiểu number/date không có vùng chọn chữ.
      }
      if (typeof from === 'number' && typeof to === 'number' && to > from) {
        // Không bao giờ gửi mật khẩu đi dịch.
        if (active.type === 'password') return null
        const text = String(active.value || '')
          .slice(from, to)
          .trim()
        return acceptable(text) ? { text, element: active } : null
      }
    }

    // Chữ trong Shadow DOM mở (web component): vùng chọn thật nằm ở shadow root
    // chỗ vừa thả chuột, window.getSelection() chỉ thấy vỏ ngoài.
    const roots = []
    if (lastRoot && lastRoot !== document && typeof lastRoot.getSelection === 'function') {
      roots.push(lastRoot)
    }
    roots.push(document)
    for (const scope of roots) {
      let sel = null
      try {
        sel = scope.getSelection()
      } catch {
        sel = null
      }
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) continue
      const text = String(sel).trim()
      if (!acceptable(text)) continue
      let backward = false
      if (sel.anchorNode === sel.focusNode) backward = sel.anchorOffset > sel.focusOffset
      else if (sel.anchorNode && sel.focusNode) {
        backward = Boolean(
          sel.anchorNode.compareDocumentPosition(sel.focusNode) & Node.DOCUMENT_POSITION_PRECEDING,
        )
      }
      let range = null
      try {
        range = sel.getRangeAt(0).cloneRange()
      } catch {
        range = null
      }
      return { text, range, backward }
    }
    return null
  }

  // anchor.point / anchor.last lưu theo toạ độ trang (đã cộng phần cuộn) để vẫn
  // đúng chỗ khi trang cuộn đi.
  const pointRect = (p) => ({ left: p.x - scrollX, top: p.y - scrollY - 10, bottom: p.y - scrollY + 10 })

  function anchorRect() {
    if (!anchor) return null

    // Bôi trong ô nhập: không có Range, bám theo chỗ thả chuột nếu nằm trong ô,
    // không thì bám theo mép dưới của ô.
    if (anchor.element) {
      const box = anchor.element.getBoundingClientRect()
      if (anchor.point) {
        const p = pointRect(anchor.point)
        const y = p.top + 10
        if (p.left >= box.left && p.left <= box.right && y >= box.top && y <= box.bottom) return p
      }
      return box.width || box.height ? { left: box.left, top: box.top, bottom: box.bottom } : null
    }

    // Khung của dòng mà người dùng thả chuột (đầu hoặc cuối vùng chọn), gộp mọi
    // mảnh trên cùng dòng đó — bôi đen cả đoạn dài thì bóng dịch hiện ngay chỗ
    // tay vừa dừng, không tít dưới cuối đoạn.
    const range = anchor.range
    if (range && !range.collapsed && range.startContainer.isConnected) {
      const rects = [...range.getClientRects()].filter((r) => r.width > 0 || r.height > 0)
      if (rects.length) {
        const edge = anchor.backward ? rects[0] : rects[rects.length - 1]
        const line = rects.filter((r) => r.top < edge.bottom && r.bottom > edge.top)
        const rect = {
          left: Math.min(...line.map((r) => r.left)),
          top: Math.min(...line.map((r) => r.top)),
          bottom: Math.max(...line.map((r) => r.bottom)),
        }
        anchor.last = { x: rect.left + scrollX, top: rect.top + scrollY, bottom: rect.bottom + scrollY }
        return rect
      }
    }

    // Trang vẽ lại (Facebook và các trang React…) thay mất đoạn chữ vừa bôi: Range
    // co về rỗng. Bản cũ gặp thế là đóng luôn bóng dịch, nhìn như tiện ích không
    // chạy — giờ giữ nguyên chỗ cũ.
    if (anchor.last) {
      return {
        left: anchor.last.x - scrollX,
        top: anchor.last.top - scrollY,
        bottom: anchor.last.bottom - scrollY,
      }
    }
    return anchor.point ? pointRect(anchor.point) : null
  }

  function place() {
    frame = 0
    if (!bubbleShown()) return
    const rect = anchorRect()
    if (!rect) return
    const { bubble } = ui
    const vw = document.documentElement.clientWidth || window.innerWidth
    const vh = window.innerHeight
    const width = bubble.offsetWidth
    const height = bubble.offsetHeight
    const left = Math.max(GAP, Math.min(rect.left, vw - width - GAP))
    let top = rect.bottom + GAP
    // Dưới không đủ chỗ thì lật lên trên chữ.
    if (top + height > vh - GAP && rect.top - GAP - height >= GAP) top = rect.top - GAP - height
    top = Math.max(GAP, Math.min(top, vh - height - GAP))
    // Cuộn chữ ra khỏi màn hình thì giấu bóng dịch đi, cuộn lại thì hiện lại.
    bubble.style.visibility = rect.bottom < 0 || rect.top > vh ? 'hidden' : 'visible'
    bubble.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`
  }

  function onViewport() {
    if (!frame) frame = requestAnimationFrame(place)
  }

  // Bắt cả sự kiện cuộn của các khung cuộn bên trong trang (capture), không chỉ
  // cuộn cả trang.
  function watchViewport(on) {
    if (on === watching) return
    watching = on
    if (on) {
      window.addEventListener('scroll', onViewport, { capture: true, passive: true })
      window.addEventListener('resize', onViewport, { passive: true })
    } else {
      window.removeEventListener('scroll', onViewport, true)
      window.removeEventListener('resize', onViewport)
      cancelAnimationFrame(frame)
      frame = 0
    }
  }

  function hideBubble() {
    requestSeq += 1
    anchor = null
    shownText = ''
    shownFrom = ''
    if (ui) ui.bubble.hidden = true
    watchViewport(false)
  }

  // Bôi một từ hay cụm ngắn thì ghi lại chữ gốc ở đầu bóng dịch như từ điển;
  // bôi cả câu thì thôi, chữ gốc đang nằm ngay trên trang rồi.
  const isWordLike = (text) => text.length <= 40 && !/\n/.test(text) && text.split(/\s+/).length <= 3

  function renderLoading(text) {
    ui.src.textContent = isWordLike(text) ? text : ''
    ui.phon.textContent = ''
    ui.lang.textContent = ''
    ui.speak.hidden = true
    ui.skeleton.hidden = false
    ui.main.hidden = true
    ui.senses.textContent = ''
  }

  function renderMessage(text) {
    ui.phon.textContent = ''
    ui.lang.textContent = ''
    ui.speak.hidden = true
    ui.skeleton.hidden = true
    ui.main.hidden = false
    ui.main.className = 'main muted'
    ui.main.textContent = text
    ui.senses.textContent = ''
  }

  function renderResult(text, res) {
    const name = (code) => LANG_NAMES[code] || String(code || '').toUpperCase()
    shownFrom = res.from || ''
    ui.src.textContent = isWordLike(text) ? text : ''
    // Cách đọc chỉ có ích khi bôi từ/cụm ngắn; bôi cả câu thì là một dòng dài vô dụng.
    const reading = String(res.phonetic || '')
    ui.phon.textContent =
      isWordLike(text) && reading.toLowerCase() !== text.toLowerCase() ? reading : ''
    ui.lang.textContent = res.from && res.to ? `${name(res.from)} → ${name(res.to)}` : ''
    ui.speak.hidden = typeof speechSynthesis === 'undefined'
    ui.skeleton.hidden = true
    ui.main.hidden = false
    ui.main.className = 'main'
    ui.main.textContent = res.text
    ui.senses.textContent = ''
    for (const sense of Array.isArray(res.senses) ? res.senses : []) {
      const terms = Array.isArray(sense.terms) ? sense.terms : []
      if (!terms.length) continue
      const info = POS_INFO[sense.pos] || [String(sense.pos || '?').toUpperCase(), '', 'other']
      const badge = el('span', `pos tone-${info[2]}`, info[0])
      if (info[1]) badge.title = info[1]
      const line = el('span', 'terms')
      line.append(el('b', '', terms[0]))
      if (terms.length > 1) line.append(document.createTextNode(', ' + terms.slice(1).join(', ')))
      ui.senses.append(badge, line)
    }
  }

  function speak() {
    if (!shownText || typeof speechSynthesis === 'undefined') return
    try {
      speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(shownText)
      utter.lang = SPEECH_LANGS[shownFrom] || shownFrom || 'en-US'
      utter.rate = 0.95
      speechSynthesis.speak(utter)
    } catch {
      // Máy không có giọng đọc cho ngôn ngữ này — thôi.
    }
  }

  // Phiên âm IPA hỏi sau khi đã có bản dịch, tới đâu điền tới đó (thay cho cách
  // đọc tạm Google gửi kèm) — không bắt bản dịch phải đợi.
  function fetchPhonetic(text, res, seq) {
    const word = text.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
    if (res.from !== 'en' || res.ipaAsked || !/^[A-Za-z][A-Za-z'-]*$/.test(word)) return
    res.ipaAsked = true
    void ask({ type: 'engmaster-phonetic', word }).then((reply) => {
      if (!reply || !reply.phonetic) return
      res.phonetic = reply.phonetic
      if (seq !== requestSeq || !bubbleShown() || shownText !== text) return
      ui.phon.textContent = reply.phonetic
      place()
    })
  }

  function translatePicked(picked) {
    buildBubble()
    const point =
      lastPoint && Date.now() - lastPoint.at < GESTURE_WINDOW
        ? { x: lastPoint.x + scrollX, y: lastPoint.y + scrollY }
        : null
    anchor = { ...picked, point, last: null }
    shownText = picked.text
    shownFrom = ''
    requestSeq += 1
    const seq = requestSeq
    const text = picked.text
    const known = recent.get(text)
    if (known) renderResult(text, known)
    else renderLoading(text)
    ui.bubble.hidden = false
    raise()
    place()
    watchViewport(true)
    if (known) {
      fetchPhonetic(text, known, seq)
      return
    }

    void ask({ type: 'engmaster-translate', text }).then((res) => {
      if (res && res.keys && res.keys.toggle) toggleKey = res.keys.toggle
      // Nhớ cả khi bóng dịch đã đóng trong lúc chờ — bôi lại là có ngay.
      if (res && res.status === 'ok') {
        remember(text, res)
        fetchPhonetic(text, res, seq)
      }
      // Người dùng đã bôi chữ khác hoặc đóng bóng dịch trong lúc chờ.
      if (seq !== requestSeq || !bubbleShown()) return
      if (res && res.status === 'ok') renderResult(text, res)
      // Tên riêng, từ viết tắt… dịch ra y hệt chữ gốc: im lặng đóng, hiện ra
      // "không có nghĩa" cho mỗi lần bôi đen chỉ tổ rối mắt.
      else if (res && res.status === 'no-meaning') {
        hideBubble()
        return
      } else if (res) renderMessage('Dịch vụ dịch đang bận hoặc mất mạng — thử lại sau ít phút.')
      else renderMessage('Không dịch được lúc này. Thử tải lại trang (F5).')
      place()
    })
  }

  function autoCheck() {
    autoTimer = 0
    if (!autoOn) return
    const picked = autoSelection()
    if (!picked) return
    // Bấm lại vào đúng chữ đang dịch: giữ nguyên, khỏi gọi dịch lần nữa.
    if (bubbleShown() && picked.text === shownText) {
      anchor = { ...anchor, ...picked }
      place()
      return
    }
    translatePicked(picked)
  }

  const fromBubble = (e) =>
    Boolean(host && typeof e.composedPath === 'function' && e.composedPath().includes(host))

  function scheduleCheck(delay) {
    clearTimeout(autoTimer)
    autoTimer = setTimeout(autoCheck, delay)
  }

  // Nghe cả pointer lẫn mouse, ở tầng window pha capture: nhiều trang (Facebook,
  // trình soạn thảo, thư viện kéo thả) chặn hoặc huỷ một trong hai loại sự kiện
  // ở document/phần tử, nghe một loại ở document như bản cũ là hụt.
  function onPointerDown(e) {
    gestureAt = Date.now()
    // Chuột phải (mở menu để chép chữ) không đóng bóng dịch.
    if (e.button !== 0 || fromBubble(e)) return
    held = true
    clearTimeout(autoTimer)
    if (bubbleShown()) hideBubble()
  }

  function notePointer(e) {
    lastPoint = { x: e.clientX, y: e.clientY, at: Date.now() }
    const target = typeof e.composedPath === 'function' ? e.composedPath()[0] : e.target
    lastRoot = target && typeof target.getRootNode === 'function' ? target.getRootNode() : document
  }

  function onPointerUp(e) {
    gestureAt = Date.now()
    if (e.button !== 0 || fromBubble(e)) return
    held = false
    pointerUpAt = Date.now()
    notePointer(e)
    if (autoOn) scheduleCheck(MOUSE_DELAY)
  }

  // Trang nuốt cả pointerup lẫn mouseup ở tầng window: chuột di mà không còn nút
  // nào giữ thì coi như đã thả.
  function onPointerMove(e) {
    if (!held || e.buttons !== 0) return
    held = false
    gestureAt = Date.now()
    pointerUpAt = Date.now()
    notePointer(e)
    if (autoOn) scheduleCheck(MOUSE_DELAY)
  }

  // Bôi bằng bàn phím, hoặc chuột mà trang chặn hết sự kiện chuột: vùng chọn đổi
  // là đủ biết.
  function onSelectionChange() {
    if (!autoOn || held) return
    // Vừa thả chuột thì onPointerUp lo rồi; sự kiện này tới trễ, hoãn thêm chỉ chậm.
    if (Date.now() - pointerUpAt < 250) return
    if (Date.now() - gestureAt > GESTURE_WINDOW) return
    scheduleCheck(KEY_DELAY)
  }

  function onKeyUp() {
    gestureAt = Date.now()
  }

  // Đang gõ (kể cả gõ đè lên chữ vừa bôi trong ô nhập) thì cất bóng dịch đi.
  function isTypingKey(e) {
    if (['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock'].includes(e.key)) return false
    if (e.ctrlKey || e.metaKey || e.altKey) return false
    if (e.shiftKey && /^(?:Arrow|Home|End|Page)/.test(e.key)) return false
    return true
  }

  function showToast(on) {
    if (!document.body) return
    ensureHost()
    if (!toast) {
      toast = el('div', 'toast')
      toast.setAttribute('role', 'status')
      root.append(toast)
    }
    toast.textContent = ''
    toast.append(
      el('span', on ? 'dot on' : 'dot'),
      el('span', '', 'Tự dịch khi bôi đen'),
      el('b', '', on ? 'BẬT' : 'TẮT'),
      el('small', '', `${toggleKey} để ${on ? 'tắt' : 'bật lại'}`),
    )
    toast.hidden = false
    raise()
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      if (toast) toast.hidden = true
    }, TOAST_MS)
  }

  function onStorage(changes, area) {
    if (area !== 'sync' || !changes[AUTO_KEY]) return
    autoOn = changes[AUTO_KEY].newValue !== false
    if (!autoOn) {
      clearTimeout(autoTimer)
      hideBubble()
    }
    // Mọi tab, mọi khung đều nghe thấy thay đổi này — chỉ khung chính của tab
    // đang dùng mới báo, không thì iframe quảng cáo cũng nhảy thông báo theo.
    if (window === window.top && document.hasFocus() && document.visibilityState === 'visible') {
      showToast(autoOn)
    }
  }

  // Bấm Alt+X ngay trong trang: lấy chữ bôi đen tại đúng thời điểm bấm rồi nhờ
  // service worker mở cửa sổ Dịch nhanh.
  //
  // Vì sao cần dù manifest đã khai báo phím tắt: phím tắt cấp trình duyệt
  // (chrome.commands) im lặng khá thường xuyên — Edge để trống ô phím tắt khi cài
  // tiện ích ngoài cửa hàng, hoặc một tiện ích khác đã giữ mất Alt+X. Bắt thêm ở
  // trong trang thì bôi đen xong bấm là ăn, không phụ thuộc chỗ đó nữa.
  function onHotkey(e) {
    gestureAt = Date.now()
    if (e.key === 'Escape' && bubbleShown()) {
      hideBubble()
      return
    }
    if (bubbleShown() && !fromBubble(e) && isTypingKey(e)) hideBubble()
    // Ngược lại, khi phím tắt cấp trình duyệt ĐANG bật thì trình duyệt nuốt trọn
    // tổ hợp Alt+X — trang không bao giờ thấy chữ X, đoạn dưới không chạy lần
    // nào. Nhưng riêng phím Alt (bước đầu của tổ hợp) thì trang vẫn nhận. Gửi
    // chữ đang bôi đen ngay lúc đó để service worker luôn có sẵn bản mới nhất,
    // đường nào mở cửa sổ cũng có chữ để đổ vào ô nhập.
    if (e.key === 'Alt' && !e.repeat) {
      pushNow()
      return
    }
    if (!e.altKey || e.ctrlKey || e.metaKey || e.repeat) return
    // So theo mã phím vật lý: bàn phím tiếng Việt (hoặc AltGr) cho e.key ra ký tự
    // khác, chỉ so e.key sẽ trượt.
    if (e.code !== 'KeyX' && String(e.key || '').toLowerCase() !== 'x') return
    // Alt+Shift+X: bật/tắt tự dịch khi bôi đen. Cùng lý do như Alt+X — ô phím
    // tắt của trình duyệt có thể đang trống.
    if (e.shiftKey) {
      if (send({ type: 'engmaster-toggle-auto' })) e.preventDefault()
      return
    }
    const text = currentSelection()
    // Gửi chữ đi trước rồi mới xin mở: lệnh mở tới trước mà service worker chưa
    // có chữ thì cửa sổ hiện ra trống.
    if (text) send({ type: 'engmaster-selection', text })
    if (send({ type: 'engmaster-open', text })) {
      e.preventDefault()
      hideBubble()
    }
  }

  function teardown() {
    document.removeEventListener('mouseup', schedule, true)
    document.removeEventListener('keyup', schedule, true)
    document.removeEventListener('selectionchange', schedule, true)
    document.removeEventListener('selectionchange', onSelectionChange)
    window.removeEventListener('keydown', onHotkey, true)
    window.removeEventListener('keyup', onKeyUp, true)
    window.removeEventListener('pointerdown', onPointerDown, true)
    window.removeEventListener('mousedown', onPointerDown, true)
    window.removeEventListener('pointerup', onPointerUp, true)
    window.removeEventListener('mouseup', onPointerUp, true)
    window.removeEventListener('pointermove', onPointerMove, true)
    clearTimeout(timer)
    clearTimeout(autoTimer)
    clearTimeout(toastTimer)
    watchViewport(false)
    try {
      chrome.storage.onChanged.removeListener(onStorage)
    } catch {
      // Ngữ cảnh tiện ích đã chết thì listener cũng chết theo.
    }
    if (host) host.remove()
    if (window.__engmaster && window.__engmaster.version === VERSION) {
      delete window.__engmaster
    }
  }

  if (!isQuickTranslatePage) {
    document.addEventListener('mouseup', schedule, true)
    document.addEventListener('keyup', schedule, true)
    document.addEventListener('selectionchange', schedule, true)
    document.addEventListener('selectionchange', onSelectionChange)
    window.addEventListener('keydown', onHotkey, true)
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('mousedown', onPointerDown, true)
    window.addEventListener('pointerup', onPointerUp, true)
    window.addEventListener('mouseup', onPointerUp, true)
    window.addEventListener('pointermove', onPointerMove, { capture: true, passive: true })
    try {
      chrome.storage.sync.get(AUTO_KEY).then(
        (stored) => {
          autoOn = stored[AUTO_KEY] !== false
        },
        () => {},
      )
      chrome.storage.onChanged.addListener(onStorage)
    } catch {
      // Tiện ích vừa bị nạp lại giữa chừng — bản mới sẽ được chèn vào thay.
    }
  }

  window.__engmaster = { version: VERSION, alive, teardown }
})()
