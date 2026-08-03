import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { WindowChromeProvider, useWindowChrome } from './contexts/WindowChromeContext'
import AuthScreen from './components/auth/AuthScreen'
import AppLayout from './components/AppLayout'
import WindowBar from './components/WindowBar'
import { isDesktop } from './platform'

function Gate() {
  const { user, loading } = useAuth()
  const { hidden, fullScreen } = useWindowChrome()

  const authWindowClass = [
    'auth-window',
    isDesktop && !hidden && !fullScreen ? 'has-window-bar' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (loading) {
    return (
      <div className={authWindowClass}>
        <WindowBar />
        <div className="app-shell">
          <p className="muted">Đang tải…</p>
        </div>
      </div>
    )
  }
  return user ? (
    <AppLayout />
  ) : (
    <div className={authWindowClass}>
      <WindowBar />
      <AuthScreen />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <WindowChromeProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </WindowChromeProvider>
    </ThemeProvider>
  )
}
