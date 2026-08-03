import { useEffect, useState } from 'react'
import { useWindowChrome } from '../contexts/WindowChromeContext'
import { isDesktop } from '../platform'
import '../styles/windowbar.css'

interface WindowBarProps {
  onOpenMenu?: () => void
  menuOpen?: boolean
}

/**
 * Thanh cửa sổ do app tự vẽ. Trên màn hình nhỏ, nó đồng thời là thanh menu
 * mobile nên không còn hai hàng chồng lên nhau như trước.
 */
export default function WindowBar({ onOpenMenu, menuOpen = false }: WindowBarProps) {
  const { hidden, fullScreen } = useWindowChrome()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    if (!isDesktop) return
    void window.api.getMaximizedWindow().then(setMaximized)
    return window.api.onMaximizedState(setMaximized)
  }, [])

  if (!isDesktop || hidden || fullScreen) return null

  const toggleMaximize = async () => {
    setMaximized(await window.api.toggleMaximizeWindow())
  }

  return (
    <header className="win-bar">
      {onOpenMenu && (
        <button
          className="win-menu"
          onClick={onOpenMenu}
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
          title={menuOpen ? 'Đóng menu' : 'Mở menu'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      )}

      <div className="win-brand" aria-label="EngMaster">
        <span className="win-brand-badge">E</span>
        <span className="win-brand-name">EngMaster</span>
      </div>

      <div className="win-drag-region" title="Kéo để di chuyển cửa sổ" />

      <div className="win-controls" aria-label="Điều khiển cửa sổ">
        <button
          className="win-control"
          onClick={() => void window.api.minimizeWindow()}
          aria-label="Thu nhỏ"
          title="Thu nhỏ"
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 8.5h8" />
          </svg>
        </button>
        <button
          className="win-control"
          onClick={() => void toggleMaximize()}
          aria-label={maximized ? 'Khôi phục' : 'Phóng to'}
          title={maximized ? 'Khôi phục' : 'Phóng to'}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            {maximized ? (
              <>
                <path d="M3.5 3.5V2h6.5v6.5H8.5" />
                <rect x="2" y="3.5" width="6.5" height="6.5" />
              </>
            ) : (
              <rect x="2" y="2" width="8" height="8" />
            )}
          </svg>
        </button>
        <button
          className="win-control win-close"
          onClick={() => void window.api.closeWindow()}
          aria-label="Đóng"
          title="Đóng"
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="m2.5 2.5 7 7m0-7-7 7" />
          </svg>
        </button>
      </div>
    </header>
  )
}
