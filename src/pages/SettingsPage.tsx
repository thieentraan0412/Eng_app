import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { isDesktop } from '../platform'

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

  const toggleDeskTrans = () => {
    const next = !deskTrans
    setDeskTrans(next)
    localStorage.setItem('desktop_translate_enabled', next ? '1' : '0')
    window.api?.setDesktopTranslate(next)
  }

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
          </div>
          <button className="btn" onClick={toggleDeskTrans}>
            {deskTrans ? 'Tắt' : 'Bật'}
          </button>
        </div>
      )}
    </div>
  )
}
