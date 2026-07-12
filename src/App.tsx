import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AuthScreen from './components/auth/AuthScreen'
import AppLayout from './components/AppLayout'

function Gate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-shell">
        <p className="muted">Đang tải…</p>
      </div>
    )
  }
  return user ? <AppLayout /> : <AuthScreen />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  )
}
