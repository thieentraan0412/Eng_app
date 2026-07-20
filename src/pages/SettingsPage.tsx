import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { isDesktop } from '../platform'
import '../styles/settings.css'

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

  // Chữ cái đầu của email cho ô avatar (thuần hiển thị, không đổi logic)
  const initial = (user?.email?.[0] ?? 'U').toUpperCase()

  return (
    <div className="page set-page">
      <div className="set-head">
        <h1 className="page-title">Cài đặt</h1>
        <p className="set-sub">Tài khoản, giao diện và trợ lý viết</p>
      </div>

      {/* Tài khoản */}
      <div className="set-card">
        <div className="set-row">
          <div className="set-ico set-ava">{initial}</div>
          <div className="set-main">
            <div className="set-title">{user?.email}</div>
            <div className="set-desc">Tài khoản · đồng bộ đám mây</div>
          </div>
          <button className="btn set-signout" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Tùy chọn */}
      <div className="set-card set-section-gap">
        <div className="set-card-title">Tùy chọn</div>

        <div className="set-row">
          <div className="set-ico set-i1">🌗</div>
          <div className="set-main">
            <div className="set-title">Giao diện</div>
            <div className="set-desc">Chế độ hiển thị Sáng / Tối</div>
          </div>
          <div className="set-seg">
            <button
              className={`set-seg-btn${theme !== 'dark' ? ' active' : ''}`}
              onClick={() => theme === 'dark' && toggle()}
            >
              ☀️ Sáng
            </button>
            <button
              className={`set-seg-btn${theme === 'dark' ? ' active' : ''}`}
              onClick={() => theme !== 'dark' && toggle()}
            >
              🌙 Tối
            </button>
          </div>
        </div>

        <div className="set-row">
          <div className="set-ico set-i2">✨</div>
          <div className="set-main">
            <div className="set-title">Gợi ý từ khi viết</div>
            <div className="set-desc">Hiện gợi ý từ tiếp theo khi bạn gõ</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={suggest} onChange={toggleSuggest} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="set-row">
          <div className="set-ico set-i3">🔤</div>
          <div className="set-main">
            <div className="set-title">Kiểm tra chính tả</div>
            <div className="set-desc">Gạch chân từ sai + gợi ý sửa</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={spell} onChange={toggleSpell} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="set-row">
          <div className="set-ico set-i4">🧠</div>
          <div className="set-main">
            <div className="set-title">Kiểm tra câu</div>
            <div className="set-desc">
              Ngữ pháp, văn phong, dùng từ, collocation (cần mạng)
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={grammar} onChange={toggleGrammar} />
            <span className="slider"></span>
          </label>
        </div>

        {/* Dịch toàn màn hình là tính năng nền của desktop → ẩn trên web */}
        {isDesktop && (
          <div className="set-row">
            <div className="set-ico set-i5">🌐</div>
            <div className="set-main">
              <div className="set-title">Dịch nhanh toàn màn hình</div>
              <div className="set-desc">
                {deskTrans
                  ? 'Bôi/tô chữ ở BẤT KỲ app nào (trình duyệt, Word, PDF…) để dịch'
                  : 'Bôi/tô chữ ở bất kỳ ứng dụng nào để dịch nhanh'}
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
            <label className="switch">
              <input type="checkbox" checked={deskTrans} onChange={toggleDeskTrans} />
              <span className="slider"></span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
