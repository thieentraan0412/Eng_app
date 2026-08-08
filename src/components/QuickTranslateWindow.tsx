import { useEffect, useState } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import QuickTranslateModal from './QuickTranslateModal'

// Renderer riêng cho cửa sổ dịch nhỏ của Electron. Cửa sổ chính không cần
// hiện/được focus khi người dùng gọi phím tắt từ trình duyệt, Word hoặc PDF.
export default function QuickTranslateWindow() {
  const [focusToken, setFocusToken] = useState(0)

  useEffect(() => window.api.onQuickTranslateFocus(() => setFocusToken((v) => v + 1)), [])

  return (
    <ThemeProvider>
      <QuickTranslateModal
        open
        standalone
        focusToken={focusToken}
        hotkey={localStorage.getItem('quick_translate_hotkey') ?? 'Ctrl+Alt+E'}
        onClose={() => void window.api.closeQuickTranslateWindow()}
      />
    </ThemeProvider>
  )
}
