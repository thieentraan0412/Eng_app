import { NAV, type PageKey } from '../pages/pages'

interface Props {
  current: PageKey
  onNavigate: (page: PageKey) => void
}

export default function Sidebar({ current, onNavigate }: Props) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">EngMaster</div>
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
    </nav>
  )
}
