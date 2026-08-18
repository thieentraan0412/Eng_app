// Ghi lại chữ đang bôi đen của trang và gửi về service worker.
//
// Vì sao cần: cách cũ đợi tới lúc bấm phím tắt mới chèn script vào trang để hỏi
// vùng chọn. Cách đó hỏng lặng lẽ ở khá nhiều tình huống — trang chưa cấp xong
// quyền activeTab, khung nhúng khác origin, trang đang tải, trang chặn chèn
// script. Ghi sẵn thì lúc bấm chỉ việc lấy ra, không phụ thuộc gì nữa.
//
// Bọc trong hàm và có cờ chặn chạy hai lần: service worker chèn tay file này
// vào các tab đang mở, mà tab đó có thể đã có sẵn nó rồi. Chạy lại lần hai mà
// không bọc sẽ ném lỗi "khai báo trùng" và gắn thêm một bộ listener nữa.
;(() => {
  if (window.__engmasterReady) return
  window.__engmasterReady = true

  const MAX_SELECTION = 1000
  const DEBOUNCE = 120

  // Trang Dịch nhanh nhúng trong cửa sổ của tiện ích cũng khớp <all_urls>. Bỏ qua
  // nó, không thì bấm Alt+X lúc đang tra sẽ nạp lại chính cửa sổ đó.
  const isQuickTranslatePage =
    new URLSearchParams(location.search).get('view') === 'quick-translate'

  let lastSent = ''
  let timer = 0

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
    lastSent = text
    try {
      chrome.runtime.sendMessage({ type: 'engmaster-selection', text })
    } catch {
      // Service worker đang ngủ hoặc tiện ích vừa được nạp lại — lần sau gửi tiếp.
    }
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
    if (!e.altKey || e.ctrlKey || e.metaKey || e.repeat) return
    // So theo mã phím vật lý: bàn phím tiếng Việt (hoặc AltGr) cho e.key ra ký tự
    // khác, chỉ so e.key sẽ trượt.
    if (e.code !== 'KeyX' && String(e.key || '').toLowerCase() !== 'x') return
    const text = currentSelection()
    try {
      chrome.runtime.sendMessage({ type: 'engmaster-open', text })
      e.preventDefault()
    } catch {
      // Tiện ích vừa được nạp lại — để trang tự xử phím này.
    }
  }

  if (!isQuickTranslatePage) {
    document.addEventListener('mouseup', schedule, true)
    document.addEventListener('keyup', schedule, true)
    document.addEventListener('selectionchange', schedule, true)
    document.addEventListener('keydown', onHotkey, true)
  }
})()
