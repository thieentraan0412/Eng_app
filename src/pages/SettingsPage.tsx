import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { isDesktop } from '../platform'

// Dựng chuỗi accelerator Electron từ sự kiện bàn phím (Ctrl+Alt+D, Ctrl+Shift+F2…).
// Bắt buộc có Ctrl/Alt/Super để không chiếm phím gõ thường của mọi ứng dụng.
function accelFromEvent(e: KeyboardEvent): string | null {
  if (!e.ctrlKey && !e.altKey && !e.metaKey) return null
  const k = e.key
  let key: string
  if (/^[a-z]$/i.test(k)) key = k.toUpperCase()
  else if (/^[0-9]$/.test(k)) key = k
  else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(k)) key = k
  else if (k === ' ') key = 'Space'
  else if (k === 'ArrowUp') key = 'Up'
  else if (k === 'ArrowDown') key = 'Down'
  else if (k === 'ArrowLeft') key = 'Left'
  else if (k === 'ArrowRight') key = 'Right'
  else return null // mới nhấn mỗi modifier, hoặc phím không hỗ trợ
  const mods: string[] = []
  if (e.ctrlKey) mods.push('Ctrl')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  if (e.metaKey) mods.push('Super')
  return [...mods, key].join('+')
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const [suggest, setSuggest] = useState(localStorage.getItem('suggest_enabled') !== '0')
  const [spell, setSpell] = useState(localStorage.getItem('spell_enabled') !== '0')
  const [grammar, setGrammar] = useState(localStorage.getItem('grammar_enabled') !== '0')
  // Mặc định TẮT (tính năng nền toàn cục, người dùng chủ động bật)
  const [deskTrans, setDeskTrans] = useState(
    localStorage.getItem('desktop_translate_enabled') === '1',
  )
  // Phím tắt toàn cục bật/tắt dịch nhanh ('' = không dùng phím tắt)
  const [hotkey, setHotkey] = useState(
    localStorage.getItem('desktop_translate_hotkey') ?? 'Ctrl+Alt+D',
  )
  const [recording, setRecording] = useState(false)
  const [hkErr, setHkErr] = useState<string | null>(null)

  const toggleDeskTrans = () => {
    const next = !deskTrans
    setDeskTrans(next)
    localStorage.setItem('desktop_translate_enabled', next ? '1' : '0')
    window.api?.setDesktopTranslate(next)
  }

  // Phím tắt toàn cục vừa bật/tắt tính năng (AppLayout bắn event) -> đồng bộ nút
  useEffect(() => {
    const h = (e: Event) => setDeskTrans(!!(e as CustomEvent).detail)
    window.addEventListener('desktop-translate-changed', h)
    return () => window.removeEventListener('desktop-translate-changed', h)
  }, [])

  // Lưu + đăng ký phím tắt mới (accel rỗng = gỡ bỏ)
  const applyHotkey = async (accel: string) => {
    setHotkey(accel)
    setHkErr(null)
    localStorage.setItem('desktop_translate_hotkey', accel)
    const ok = await window.api?.setTranslateHotkey(accel)
    if (accel && !ok) setHkErr('Không đăng ký được — tổ hợp có thể đã bị ứng dụng khác dùng')
  }

  // Chế độ ghi phím tắt: nhấn tổ hợp để đặt, Esc hủy, Backspace/Delete gỡ phím tắt
  useEffect(() => {
    if (!recording) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') {
        setRecording(false)
        return
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        void applyHotkey('')
        setRecording(false)
        return
      }
      const accel = accelFromEvent(e)
      if (!accel) return // chờ tổ hợp hợp lệ (phải kèm Ctrl/Alt)
      void applyHotkey(accel)
      setRecording(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording])

  const toggleSuggest = () => {
    const next = !suggest
    setSuggest(next)
    localStorage.setItem('suggest_enabled', next ? '1' : '0')
  }

  const toggleSpell = () => {
    const next = !spell
    setSpell(next)
    localStorage.setItem('spell_enabled', next ? '1' : '0')
  }

  const toggleGrammar = () => {
    const next = !grammar
    setGrammar(next)
    localStorage.setItem('grammar_enabled', next ? '1' : '0')
  }

  return (
    <div className="page">
      <h1 className="page-title">Cài đặt</h1>

      <div className="setting-row">
        <div>
          <div className="setting-label">Tài khoản</div>
          <div className="muted">{user?.email}</div>
        </div>
        <button className="btn danger" onClick={signOut}>
          Đăng xuất
        </button>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-label">Giao diện</div>
          <div className="muted">Chế độ {theme === 'dark' ? 'Tối' : 'Sáng'}</div>
        </div>
        <button className="btn" onClick={toggle}>
          Chuyển sang {theme === 'dark' ? 'Sáng ☀️' : 'Tối 🌙'}
        </button>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-label">Gợi ý từ khi viết</div>
          <div className="muted">{suggest ? 'Đang bật' : 'Đang tắt'}</div>
        </div>
        <button className="btn" onClick={toggleSuggest}>
          {suggest ? 'Tắt' : 'Bật'}
        </button>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-label">Kiểm tra chính tả</div>
          <div className="muted">
            {spell ? 'Gạch chân từ sai + gợi ý sửa' : 'Đang tắt'}
          </div>
        </div>
        <button className="btn" onClick={toggleSpell}>
          {spell ? 'Tắt' : 'Bật'}
        </button>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-label">Kiểm tra câu</div>
          <div className="muted">
            {grammar ? 'Ngữ pháp, văn phong, dùng từ, collocation (cần mạng)' : 'Đang tắt'}
          </div>
        </div>
        <button className="btn" onClick={toggleGrammar}>
          {grammar ? 'Tắt' : 'Bật'}
        </button>
      </div>

      {/* Dịch toàn màn hình là tính năng nền của desktop → ẩn trên web */}
      {isDesktop && (
        <div className="setting-row">
          <div>
            <div className="setting-label">Dịch nhanh toàn màn hình</div>
            <div className="muted">
              {deskTrans
                ? 'Bôi/tô chữ ở BẤT KỲ app nào (trình duyệt, Word, PDF…) để dịch'
                : 'Đang tắt'}
            </div>
            <div className="hotkey-line muted">
              Phím tắt bật/tắt:{' '}
              {recording ? (
                <span className="hotkey-recording">
                  nhấn tổ hợp phím (kèm Ctrl/Alt)… · Esc hủy · Backspace gỡ
                </span>
              ) : (
                <>
                  <kbd className="hotkey-kbd">{hotkey || 'chưa đặt'}</kbd>
                  <button className="btn tiny" onClick={() => setRecording(true)}>
                    Đổi
                  </button>
                </>
              )}
              {hkErr && <span className="hotkey-err">⚠️ {hkErr}</span>}
            </div>
          </div>
          <button className="btn" onClick={toggleDeskTrans}>
            {deskTrans ? 'Tắt' : 'Bật'}
          </button>
        </div>
      )}
    </div>
  )
}
