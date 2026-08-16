import { useEffect, useState } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import QuickTranslateModal from './QuickTranslateModal'
import { readQuickTranslateHotkey } from '../services/hotkey'
import { isDesktop } from '../platform'

// Bản web (extension trình duyệt nhúng trang này trong iframe) không đọc được
// vùng chọn của tab khác, nên extension gửi sẵn chữ bôi đen qua tham số ?q=.
const seedFromUrl = () => new URLSearchParams(window.location.search).get('q') ?? ''

// Renderer riêng cho cửa sổ dịch nhỏ của Electron. Cửa sổ chính không cần
// hiện/được focus khi người dùng gọi phím tắt từ trình duyệt, Word hoặc PDF.
export default function QuickTranslateWindow() {
  const [focusToken, setFocusToken] = useState(0)
  const [seed, setSeed] = useState(isDesktop ? '' : seedFromUrl)

  useEffect(() => {
    if (!isDesktop) return
    return window.api.onQuickTranslateFocus((text) => {
      setSeed(text)
      setFocusToken((v) => v + 1)
    })
  }, [])

  // Lần mở đầu tiên không có sự kiện focus (cửa sổ vừa được tạo), tự hỏi main.
  useEffect(() => {
    if (!isDesktop) return
    void window.api.getQuickTranslateSeed().then((text) => {
      if (!text) return
      setSeed(text)
      setFocusToken((v) => v + 1)
    })
  }, [])

  const close = () => {
    if (isDesktop) {
      void window.api.closeQuickTranslateWindow()
      return
    }
    // Iframe khác origin không tự đóng được cửa sổ do trình duyệt mở, nên báo
    // cho trang cha (popup của extension) đóng giúp.
    window.parent.postMessage({ type: 'engmaster-quick-translate-close' }, '*')
    window.close()
  }

  return (
    <ThemeProvider>
      <QuickTranslateModal
        open
        standalone
        focusToken={focusToken}
        seedText={seed}
        hotkey={readQuickTranslateHotkey()}
        onClose={close}
      />
    </ThemeProvider>
  )
}
