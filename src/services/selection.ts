// Đoạn chữ người dùng đang bôi đen. Ô nhập liệu phải đọc riêng vì
// window.getSelection() không thấy vùng chọn bên trong <input>/<textarea>.
export function readSelectedText(limit = 1000): string {
  const active = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null
  if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
    const start = active.selectionStart ?? 0
    const end = active.selectionEnd ?? 0
    if (end > start) return active.value.slice(start, end).trim().slice(0, limit)
  }
  return (window.getSelection()?.toString() ?? '').trim().slice(0, limit)
}

// Chữ bôi đen gần nhất, ghi lại ngay lúc bôi.
//
// Vì sao cần: đọc vùng chọn đúng lúc bấm phím tắt hỏng lặng lẽ ở khá nhiều tình
// huống — bấm phím làm trang mất vùng chọn, focus nhảy sang chỗ khác, hoặc người
// dùng bôi đen rồi lỡ bấm chuột trước khi gọi phím tắt. Extension của trình duyệt
// đã phải làm đúng cách này (browser-extension/content.js), bản trong app dùng
// chung một lối cho khớp.
let remembered = ''
let rememberedAt = 0
let timer = 0

// Chữ ghi lâu hơn mức này coi như đã cũ (tránh dịch lại chữ bôi từ nửa tiếng trước).
const SELECTION_TTL = 10 * 60 * 1000
const DEBOUNCE = 120

function remember() {
  const text = readSelectedText()
  // Bỏ chọn (text rỗng) thì GIỮ nguyên chữ cũ, đừng xoá đi: bấm phím tắt đôi khi
  // tự làm mất vùng chọn, xoá là mất luôn thứ người dùng vừa bôi.
  if (!text) return
  remembered = text
  rememberedAt = Date.now()
}

function schedule() {
  window.clearTimeout(timer)
  timer = window.setTimeout(remember, DEBOUNCE)
}

/** Bắt đầu ghi lại vùng chọn. Trả về hàm dọn dẹp. */
export function watchSelection(): () => void {
  document.addEventListener('mouseup', schedule, true)
  document.addEventListener('keyup', schedule, true)
  document.addEventListener('selectionchange', schedule, true)
  return () => {
    window.clearTimeout(timer)
    document.removeEventListener('mouseup', schedule, true)
    document.removeEventListener('keyup', schedule, true)
    document.removeEventListener('selectionchange', schedule, true)
  }
}

/**
 * Chữ để đổ vào ô dịch: ưu tiên vùng chọn ngay lúc này, mất rồi thì lấy chữ đã
 * ghi lúc bôi.
 */
export function takeSelectedText(limit = 1000): string {
  const live = readSelectedText(limit)
  if (live) {
    remembered = live
    rememberedAt = Date.now()
    return live
  }
  if (!remembered || Date.now() - rememberedAt > SELECTION_TTL) return ''
  return remembered.slice(0, limit)
}
