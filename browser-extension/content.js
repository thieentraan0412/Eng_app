// Ghi lại chữ đang bôi đen của trang và gửi về service worker.
//
// Vì sao cần: cách cũ đợi tới lúc bấm phím tắt mới chèn script vào trang để hỏi
// vùng chọn. Cách đó hỏng lặng lẽ ở khá nhiều tình huống — trang chưa cấp xong
// quyền activeTab, khung nhúng khác origin, trang đang tải, trang chặn chèn
// script. Ghi sẵn thì lúc bấm chỉ việc lấy ra, không phụ thuộc gì nữa.
;(() => {
  const VERSION = '1.4.0'
  const MAX_SELECTION = 1000
  const DEBOUNCE = 120

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

  // Bấm Alt+X ngay trong trang: lấy chữ bôi đen tại đúng thời điểm bấm rồi nhờ
  // service worker mở cửa sổ Dịch nhanh.
  //
  // Vì sao cần dù manifest đã khai báo phím tắt: phím tắt cấp trình duyệt
  // (chrome.commands) im lặng khá thường xuyên — Edge để trống ô phím tắt khi cài
  // tiện ích ngoài cửa hàng, hoặc một tiện ích khác đã giữ mất Alt+X. Bắt thêm ở
  // trong trang thì bôi đen xong bấm là ăn, không phụ thuộc chỗ đó nữa.
  function onHotkey(e) {
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
    const text = currentSelection()
    // Gửi chữ đi trước rồi mới xin mở: lệnh mở tới trước mà service worker chưa
    // có chữ thì cửa sổ hiện ra trống.
    if (text) send({ type: 'engmaster-selection', text })
    if (send({ type: 'engmaster-open', text })) e.preventDefault()
  }

  function teardown() {
    document.removeEventListener('mouseup', schedule, true)
    document.removeEventListener('keyup', schedule, true)
    document.removeEventListener('selectionchange', schedule, true)
    document.removeEventListener('keydown', onHotkey, true)
    if (window.__engmaster && window.__engmaster.version === VERSION) {
      delete window.__engmaster
    }
  }

  if (!isQuickTranslatePage) {
    document.addEventListener('mouseup', schedule, true)
    document.addEventListener('keyup', schedule, true)
    document.addEventListener('selectionchange', schedule, true)
    document.addEventListener('keydown', onHotkey, true)
  }

  window.__engmaster = { version: VERSION, alive, teardown }
})()
