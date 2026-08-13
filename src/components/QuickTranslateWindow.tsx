import { useEffect, useState } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import QuickTranslateModal from './QuickTranslateModal'
import { readQuickTranslateHotkey } from '../services/hotkey'

// Renderer riêng cho cửa sổ dịch nhỏ của Electron. Cửa sổ chính không cần
// hiện/được focus khi người dùng gọi phím tắt từ trình duyệt, Word hoặc PDF.
export default function QuickTranslateWindow() {
  const [focusToken, setFocusToken] = useState(0)
  const [seed, setSeed] = useState('')

  useEffect(
    () =>
      window.api.onQuickTranslateFocus((text) => {
        setSeed(text)
        setFocusToken((v) => v + 1)
      }),
    [],
  )

  // Lần mở đầu tiên không có sự kiện focus (cửa sổ vừa được tạo), tự hỏi main.
  useEffect(() => {
    void window.api.getQuickTranslateSeed().then((text) => {
      if (!text) return
      setSeed(text)
      setFocusToken((v) => v + 1)
    })
  }, [])

  return (
    <ThemeProvider>
      <QuickTranslateModal
        open
        standalone
        focusToken={focusToken}
        seedText={seed}
        hotkey={readQuickTranslateHotkey()}
        onClose={() => void window.api.closeQuickTranslateWindow()}
      />
    </ThemeProvider>
  )
}
