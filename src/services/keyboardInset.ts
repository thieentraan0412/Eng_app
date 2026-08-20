// Phần đáy màn hình đang bị bàn phím ảo che: thu khung ứng dụng (--app-height)
// về đúng phần còn nhìn thấy, và đưa chiều cao bàn phím ra CSS qua --kb-inset
// cùng class .kb-open trên <html>.
//
// Chrome Android đọc interactive-widget=resizes-content nên layout tự co lại khi
// bàn phím bật; lúc đó innerHeight cũng nhỏ theo, hiệu số này bằng 0 và không có
// gì phải làm thêm. iOS Safari (và các trình duyệt chưa hỗ trợ) giữ nguyên
// layout, chỉ visualViewport nhỏ đi, nên hiệu số chính là chiều cao bàn phím —
// và cũng chính là chỗ phải tự tay cắt bớt khung ứng dụng.

// Dưới ngưỡng này là thanh công cụ/URL bar co giãn, không phải bàn phím.
const KEYBOARD_MIN_HEIGHT = 90

export function watchKeyboardInset(): () => void {
  const viewport = window.visualViewport
  if (!viewport) return () => {}
  const root = document.documentElement

  // iOS Safari không co layout theo bàn phím: để lộ ô đang gõ, nó đẩy CẢ TRANG
  // lên (visualViewport lệch khỏi mép trên màn hình) và không bao giờ tự trả
  // về — đó chính là lúc tiêu đề với câu hỏi biến mất. Sau khi --app-height thu
  // khung lại thì trang không còn chỗ nào để đẩy, chỉ cần kéo về 0; làm thêm
  // một nhịp khung hình nữa vì Safari đẩy sau khi sự kiện chạy xong.
  const resetPageShift = () => {
    window.scrollTo(0, 0)
    window.requestAnimationFrame(() => window.scrollTo(0, 0))
  }

  let lastInset = -1

  const apply = () => {
    const covered = window.innerHeight - viewport.height
    const inset = covered > KEYBOARD_MIN_HEIGHT ? Math.round(covered) : 0
    root.style.setProperty('--kb-inset', `${inset}px`)
    root.classList.toggle('kb-open', inset > 0)

    // Cắt khung ứng dụng đúng bằng phần màn hình bàn phím chưa che. Nhờ vậy ô
    // nhập không bao giờ nằm dưới bàn phím, nên trình duyệt không có cớ tự cuộn
    // trang — thứ đẩy tiêu đề và câu hỏi ra khỏi màn hình. Bàn phím tắt thì trả
    // lại 100dvh để thanh địa chỉ co giãn vẫn được tính đúng.
    if (inset > 0) root.style.setProperty('--app-height', `${Math.round(viewport.height)}px`)
    else root.style.removeProperty('--app-height')

    // Bàn phím vừa bật/tắt/đổi cỡ, hoặc trang vẫn đang bị đẩy lệch: kéo về.
    // offsetTop > 0 nghĩa là trang đang bị đẩy — Safari có thể đẩy muộn hơn cả
    // sự kiện resize nên không thể chỉ xử lý đúng lúc bàn phím đổi cỡ. Bỏ qua
    // khi người dùng đang tự phóng to (scale > 1) vì lúc đó họ chủ động kéo.
    const shifted = inset > 0 && viewport.offsetTop > 0.5 && viewport.scale <= 1.01
    if (inset !== lastInset || shifted) {
      lastInset = inset
      resetPageShift()
    }
  }

  apply()
  viewport.addEventListener('resize', apply)
  viewport.addEventListener('scroll', apply)
  return () => {
    viewport.removeEventListener('resize', apply)
    viewport.removeEventListener('scroll', apply)
    root.style.removeProperty('--kb-inset')
    root.style.removeProperty('--app-height')
    root.classList.remove('kb-open')
  }
}
