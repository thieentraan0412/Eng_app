import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isDesktop } from '../platform'

interface WindowChromeContextValue {
  hidden: boolean
  fullScreen: boolean
  setHidden: (hidden: boolean) => void
  toggleHidden: () => void
}

const WindowChromeContext = createContext<WindowChromeContextValue | null>(null)

/**
 * Trạng thái thanh cửa sổ chỉ sống trong phiên hiện tại. Mỗi lần mở app thanh
 * luôn hiện lại, tránh trường hợp người dùng bị kẹt mà không thấy nút đóng hoặc
 * không nhớ phím khôi phục.
 */
export function WindowChromeProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)

  const toggleHidden = () => setHidden((value) => !value)

  useEffect(() => {
    document.documentElement.classList.toggle('window-chrome-hidden', hidden)
    return () => document.documentElement.classList.remove('window-chrome-hidden')
  }, [hidden])

  useEffect(() => {
    if (isDesktop) {
      void window.api.getFullScreen().then(setFullScreen)
      const offFullScreen = window.api.onFullScreenState(setFullScreen)
      const offToggle = window.api.onWindowChromeToggle(toggleHidden)
      return () => {
        offFullScreen()
        offToggle()
      }
    }

    // Bản web không có Electron main để bắt phím, vẫn hỗ trợ cùng shortcut
    // khi xem responsive trong trình duyệt.
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !event.repeat &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'h'
      ) {
        event.preventDefault()
        toggleHidden()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  const value = useMemo(
    () => ({ hidden, fullScreen, setHidden, toggleHidden }),
    [hidden, fullScreen],
  )

  return <WindowChromeContext.Provider value={value}>{children}</WindowChromeContext.Provider>
}

export function useWindowChrome(): WindowChromeContextValue {
  const value = useContext(WindowChromeContext)
  if (!value) throw new Error('useWindowChrome phải dùng trong WindowChromeProvider')
  return value
}
