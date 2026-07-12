import { useEffect, useState } from 'react'
import { CloudApi, computeStreak } from '../services/cloud/CloudApiClient'
import BarChart from '../components/BarChart'
import type { PageKey } from './pages'

export default function DashboardPage({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  const [stats, setStats] = useState<{ decks: number; cards: number; due: number } | null>(null)
  const [byDay, setByDay] = useState<{ date: string; count: number }[]>([])
  const [streak, setStreak] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    CloudApi.summary()
      .then(setStats)
      .catch((e) => setError((e as Error).message))
    CloudApi.reviewsByDay(14)
      .then((d) => {
        setByDay(d)
        setStreak(computeStreak(d))
      })
      .catch((e) => setError((e as Error).message))
  }, [])

  return (
    <div className="page">
      <h1 className="page-title">Trang chủ</h1>
      <p className="muted">Chào mừng bạn quay lại học tiếng Anh 👋</p>

      {error && <div className="alert error">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num">{stats?.decks ?? '—'}</div>
          <div className="stat-label">Bộ từ</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats?.cards ?? '—'}</div>
          <div className="stat-label">Tổng số thẻ</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-num">{stats?.due ?? '—'}</div>
          <div className="stat-label">Thẻ cần ôn hôm nay</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">🔥 {streak}</div>
          <div className="stat-label">Ngày streak</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Số thẻ đã ôn (14 ngày gần nhất)</div>
        <BarChart data={byDay} />
      </div>

      <div className="quick-actions">
        <button className="btn primary" onClick={() => onNavigate('vocabulary')}>
          📇 Quản lý từ vựng
        </button>
        <button className="btn" onClick={() => onNavigate('flashcard')}>
          🔁 Ôn tập ngay
        </button>
        <button className="btn" onClick={() => onNavigate('reading')}>
          📖 Đọc & tra từ
        </button>
      </div>
    </div>
  )
}
