import { NAV, type PageKey } from '../pages/pages'

interface Props {
  current: PageKey
  onNavigate: (page: PageKey) => void
  onClose?: () => void // đóng drawer trên mobile
}

export default function Sidebar({ current, onNavigate, onClose }: Props) {
  return (
    <nav className="sidebar">
      <div className="sidebar-head">
        <div className="brand-badge">E</div>
        <div className="brand-text">
          <div className="sidebar-brand">EngMaster</div>
          <div className="sidebar-tag">Học tiếng Anh</div>
        </div>
        {onClose && (
          <button className="sidebar-close" onClick={onClose} aria-label="Đóng menu">
            ✕
          </button>
        )}
      </div>
      <ul className="nav-list">
        {NAV.map((item) => (
          <li key={item.key}>
            <button
              className={current === item.key ? 'nav-item active' : 'nav-item'}
              onClick={() => onNavigate(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-foot">v0.1.0</div>
    </nav>
  )
}
