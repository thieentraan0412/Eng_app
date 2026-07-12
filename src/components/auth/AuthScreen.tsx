import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'

// Màn hình Đăng nhập / Đăng ký (Supabase Auth thật)
export default function AuthScreen() {
  const { signIn, signUp, configured } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
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
      if (mode === 'login') {
        await signIn(email, password)
        // Lưu/xóa thông tin đăng nhập theo lựa chọn "Ghi nhớ"
        if (remember) await window.api?.saveCred({ email, password })
        else await window.api?.clearCred()
      } else {
        await signUp(email, password)
        setNotice('Đăng ký thành công! Nếu bật xác nhận email, hãy kiểm tra hộp thư. Nếu tắt, bạn đăng nhập được ngay.')
        setMode('login')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="brand">EngMaster</h1>
        <p className="auth-sub">Học tiếng Anh của bạn — mọi thiết bị</p>

        {!configured && (
          <div className="alert warn">
            Chưa cấu hình Supabase. Hãy tạo file <code>.env</code> theo hướng dẫn.
          </div>
        )}

        <div className="tabs">
          <button
            type="button"
            className={mode === 'login' ? 'tab active' : 'tab'}
            onClick={() => setMode('login')}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'tab active' : 'tab'}
            onClick={() => setMode('signup')}
          >
            Đăng ký
          </button>
        </div>

        <label className="field">
          <span>Email</span>
          <input
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Ít nhất 6 ký tự"
          />
        </label>

        {mode === 'login' && (
          <label className="remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Ghi nhớ đăng nhập (lưu mật khẩu mã hóa trên máy này)</span>
          </label>
        )}

        {error && <div className="alert error">{error}</div>}
        {notice && <div className="alert ok">{notice}</div>}

        <button type="submit" className="btn primary full" disabled={busy}>
          {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>
      </form>
    </div>
  )
}
