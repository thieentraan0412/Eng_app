import { useEffect, useState } from 'react'
import { CloudApi, computeStreak, type StudyStat } from '../services/cloud/CloudApiClient'
import BarChart from '../components/BarChart'
import type { PageKey } from './pages'

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

export default function DashboardPage({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  const [stats, setStats] = useState<{ decks: number; cards: number; due: number } | null>(null)
  const [byDay, setByDay] = useState<{ date: string; count: number }[]>([])
  const [streak, setStreak] = useState(0)
  const [study, setStudy] = useState<StudyStat[] | null>(null)
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
    // Thống kê học tập hôm nay (phút học / từ mới / quiz) — bảng study_stats
    CloudApi.studyStatsByDay(7)
      .then(setStudy)
      .catch(() => setStudy(null))
  }, [])

  const todayStat = study?.[study.length - 1] ?? null

  // Ngày hôm nay dạng "Hôm nay là Thứ Hai, 20/07"
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dateLabel = `Hôm nay là ${WEEKDAYS[now.getDay()]}, ${dd}/${mm} — cùng giữ nhịp học tiếng Anh nhé.`

  // Hiển thị số; khi chưa tải xong (null/undefined) thì hiện "—", còn 0 vẫn hiện "0"
  const fmt = (n: number | null | undefined) => (n == null ? '—' : n)

  return (
    <div className="page page-wide dashboard">
      <div className="dash-head">
        <div>
          <h1 className="dash-title">Chào mừng quay lại 👋</h1>
          <p className="dash-sub">{dateLabel}</p>
        </div>
        <button className="dash-cta" onClick={() => onNavigate('flashcard')}>
          🔁 Ôn tập ngay
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="dash-stats">
        <div className="dash-stat">
          <div className="dash-ico i1">📇</div>
          <div className="dash-num">{fmt(stats?.decks)}</div>
          <div className="dash-lbl">Bộ từ</div>
        </div>
        <div className="dash-stat">
          <div className="dash-ico i2">🗂️</div>
          <div className="dash-num">{fmt(stats?.cards)}</div>
          <div className="dash-lbl">Tổng số thẻ</div>
        </div>
        <div className="dash-stat">
          <div className="dash-ico i3">🔔</div>
          <div className="dash-num">{fmt(stats?.due)}</div>
          <div className="dash-lbl">Thẻ cần ôn hôm nay</div>
        </div>
        <div className="dash-stat">
          <div className="dash-ico i4">🔥</div>
          <div className="dash-num">{streak}</div>
          <div className="dash-lbl">Ngày streak</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-head">
          <div className="dash-card-title">📚 Hôm nay bạn đã học</div>
          <span className="dash-note">Tự động ghi nhận</span>
        </div>
        <div className="dash-mini">
          <div className="dash-mini-item">
            <b>{fmt(todayStat?.minutes_studied)}</b>
            <span>⏱️ Phút học</span>
          </div>
          <div className="dash-mini-item">
            <b>{fmt(todayStat?.cards_reviewed)}</b>
            <span>🔁 Thẻ đã ôn</span>
          </div>
          <div className="dash-mini-item">
            <b>{fmt(todayStat?.new_words)}</b>
            <span>✨ Từ mới</span>
          </div>
          <div className="dash-mini-item">
            <b>{fmt(todayStat?.quizzes_done)}</b>
            <span>📝 Quiz đã làm</span>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-head">
          <div className="dash-card-title">📈 Số thẻ đã ôn</div>
          <span className="dash-note">14 ngày gần nhất</span>
        </div>
        <BarChart data={byDay} />
      </div>

      <div className="dash-quick">
        <button className="dash-quick-card" onClick={() => onNavigate('vocabulary')}>
          <div className="dash-ico i1">📇</div>
          <b>Quản lý từ vựng</b>
          <p>Tạo bộ từ &amp; thêm thẻ mới</p>
        </button>
        <button className="dash-quick-card" onClick={() => onNavigate('flashcard')}>
          <div className="dash-ico i2">🔁</div>
          <b>Ôn tập ngay</b>
          <p>{stats?.due ?? 0} thẻ đang chờ bạn</p>
        </button>
        <button className="dash-quick-card" onClick={() => onNavigate('reading')}>
          <div className="dash-ico i3">📖</div>
          <b>Đọc &amp; tra từ</b>
          <p>Bôi chữ để dịch tức thì</p>
        </button>
      </div>
    </div>
  )
}
