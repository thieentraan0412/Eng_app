// Phần đáy màn hình đang bị bàn phím ảo che, đưa ra CSS qua biến --kb-inset và
// class .kb-open trên <html>.
//
// Chrome Android đọc interactive-widget=resizes-content nên layout tự co lại khi
// bàn phím bật; lúc đó innerHeight cũng nhỏ theo và số này bằng 0 — không cần
// chừa thêm gì. iOS Safari (và các trình duyệt chưa hỗ trợ) giữ nguyên layout,
// chỉ visualViewport nhỏ đi, nên phần chênh lệch chính là chiều cao bàn phím.
// Không có nó thì ô nhập gần cuối trang không tài nào cuộn lên trên bàn phím
// được: vùng cuộn đã hết chỗ.

// Dưới ngưỡng này là thanh công cụ/URL bar co giãn, không phải bàn phím.
const KEYBOARD_MIN_HEIGHT = 90

export function watchKeyboardInset(): () => void {
  const viewport = window.visualViewport
  if (!viewport) return () => {}
  const root = document.documentElement

  const apply = () => {
    const covered = window.innerHeight - viewport.height
    const inset = covered > KEYBOARD_MIN_HEIGHT ? Math.round(covered) : 0
    root.style.setProperty('--kb-inset', `${inset}px`)
    root.classList.toggle('kb-open', inset > 0)
  }

  apply()
  viewport.addEventListener('resize', apply)
  viewport.addEventListener('scroll', apply)
  return () => {
    viewport.removeEventListener('resize', apply)
    viewport.removeEventListener('scroll', apply)
    root.style.removeProperty('--kb-inset')
    root.classList.remove('kb-open')
  }
}
