import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'

// Màn hình Đăng nhập (đã ẩn chức năng đăng ký tài khoản)
export default function AuthScreen() {
  const { signIn, configured } = useAuth()
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
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="brand">EngMaster</h1>
        <p className="auth-sub">Học tiếng Anh của bạn — mọi thiết bị</p>

        {!configured && (
          <div className="alert warn">
            Chưa cấu hình Supabase. Hãy tạo file <code>.env</code> theo hướng dẫn.
          </div>
        )}

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

        <label className="remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Ghi nhớ đăng nhập (lưu mật khẩu mã hóa trên máy này)</span>
        </label>

        {error && <div className="alert error">{error}</div>}
        {notice && <div className="alert ok">{notice}</div>}

        <button type="submit" className="btn primary full" disabled={busy}>
          {busy ? 'Đang xử lý…' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  )
}
