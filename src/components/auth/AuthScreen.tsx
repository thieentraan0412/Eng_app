import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'

// Màn hình Đăng nhập — giao diện split-screen theo thiết kế 01-login
export default function AuthScreen() {
  const { signIn, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Tự điền thông tin đăng nhập đã lưu (nếu có)
  useEffect(() => {
    window.api?.loadCred().then((cred) => {
      if (cred) {
        setEmail(cred.email)
        setPassword(cred.password)
        setRemember(true)
      }
    })
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      await signIn(email, password)
      // Lưu/xóa thông tin đăng nhập theo lựa chọn "Ghi nhớ"
      if (remember) await window.api?.saveCred({ email, password })
      else await window.api?.clearCred()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      {/* Cột thương hiệu */}
      <section className="auth-brand">
        <div className="auth-brand-inner">
          <div className="brand">
            <div className="brand-mark">E</div>
            <div>
              <div className="brand-name">EngMaster</div>
              <div className="brand-sub">Học tiếng Anh</div>
            </div>
          </div>
          <h1 className="auth-headline">
            Học tiếng Anh mỗi ngày,
            <br />
            tiến bộ thấy rõ từng tuần.
          </h1>
          <p className="auth-lead">
            Flashcard SRS, đọc &amp; tra từ, luyện viết và chép câu — mọi thiết bị, đồng bộ đám mây.
          </p>
          <div className="auth-features">
            <div className="feature-li">
              <div className="fi">📇</div>
              <div>
                <b>Flashcard thông minh (SRS)</b>
                <p>Lặp lại ngắt quãng, nhớ lâu hơn với 4 mức đánh giá.</p>
              </div>
            </div>
            <div className="feature-li">
              <div className="fi">📖</div>
              <div>
                <b>Đọc &amp; tra từ tức thì</b>
                <p>Bôi chữ để dịch, lưu từ mới vào bộ thẻ chỉ với một chạm.</p>
              </div>
            </div>
            <div className="feature-li">
              <div className="fi">✏️</div>
              <div>
                <b>Luyện dịch Việt → Anh</b>
                <p>100+ câu theo cấp độ A1–B2 kèm chấm điểm &amp; sửa chính tả.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cột đăng nhập */}
      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <h2 className="auth-title">Chào mừng trở lại 👋</h2>
          <p className="auth-sub">Đăng nhập để tiếp tục hành trình học của bạn — mọi thiết bị.</p>

          {!configured && (
            <div className="alert warn">
              Chưa cấu hình Supabase. Hãy tạo file <code>.env</code> theo hướng dẫn.
            </div>
          )}

          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="ban@email.com"
            />
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <div className="pass-wrap">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Ít nhất 6 ký tự"
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </label>

          <div className="auth-row">
            <label className="switch-label">
              <span className="switch">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="slider" />
              </span>
              Ghi nhớ đăng nhập
            </label>
            <a href="#" className="auth-forgot" onClick={(e) => e.preventDefault()}>
              Quên mật khẩu?
            </a>
          </div>

          {error && <div className="alert error">{error}</div>}
          {notice && <div className="alert ok">{notice}</div>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Đang xử lý…' : 'Đăng nhập'}
          </button>
        </form>
      </section>
    </div>
  )
}
