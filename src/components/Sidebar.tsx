import { useEffect, useState } from 'react'
import { NAV_GROUPS, type PageKey } from '../pages/pages'
import { CloudApi } from '../services/cloud/CloudApiClient'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Icon from './Icon'
import { isDesktop } from '../platform'

interface Props {
  current: PageKey
  onNavigate: (page: PageKey) => void
  onClose?: () => void // đóng drawer trên mobile
}

export default function Sidebar({ current, onNavigate, onClose }: Props) {
  const [version, setVersion] = useState(__APP_VERSION__)
  const [counts, setCounts] = useState<{ cards: number; due: number } | null>(null)
  const { user } = useAuth()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    if (!isDesktop) return
    void window.api
      .appVersion()
      .then((currentVersion) => setVersion(currentVersion))
      .catch(() => {})
  }, [])

  // Chỉ số cạnh mục Từ vựng / Ôn tập — lỗi thì đơn giản là không hiện
  useEffect(() => {
    CloudApi.summary()
      .then((s) => setCounts({ cards: s.cards, due: s.due }))
      .catch(() => setCounts(null))
  }, [])

  // Tên hiển thị: phần trước @ của email
  const name = user?.email?.split('@')[0] ?? 'Khách'

  return (
    <nav className="sidebar" title={`EngMaster v${version}`}>
      <div className="sidebar-head">
        <span className="brand-badge">E</span>
        <span className="sidebar-brand">EngMaster</span>
        <span className="sidebar-spacer" />
        {onClose && (
          <button className="sidebar-close" onClick={onClose} aria-label="Đóng menu">
            <Icon name="x" />
          </button>
        )}
      </div>

      <div className="sidebar-scroll">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label || 'main'}>
            {group.label && <div className="nav-group-label">{group.label}</div>}
            {group.items.map((item) => {
              const n = item.count && counts ? counts[item.count] : 0
              return (
                <button
                  key={item.key}
                  className={current === item.key ? 'nav-item is-active' : 'nav-item'}
                  onClick={() => onNavigate(item.key)}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {n > 0 && <span className="nav-count">{n}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-foot">
        <button className="sidebar-user" onClick={() => onNavigate('settings')}>
          <span className="sidebar-avatar">{name.charAt(0).toUpperCase()}</span>
          <span className="sidebar-user-txt">
            <b>{name}</b>
            <span>{user ? 'Đã đồng bộ' : 'Chưa đăng nhập'}</span>
          </span>
        </button>
        <button
          className="sidebar-theme"
          onClick={toggle}
          title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          aria-label="Đổi giao diện"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </nav>
  )
}
