import { useEffect, useState } from 'react'
import '../styles/dashboard.css'
import {
  CloudApi,
  computeStreak,
  type DeckStat,
  type StudyStat,
} from '../services/cloud/CloudApiClient'
import Icon from '../components/Icon'
import type { PageKey } from './pages'

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

export default function DashboardPage({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  const [stats, setStats] = useState<{ decks: number; cards: number; due: number } | null>(null)
  const [byDay, setByDay] = useState<{ date: string; count: number }[]>([])
  const [streak, setStreak] = useState(0)
  const [study, setStudy] = useState<StudyStat[] | null>(null)
  const [decks, setDecks] = useState<DeckStat[] | null>(null)
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
    // Tiến độ từng bộ (đã ôn / tổng) cho panel bên phải biểu đồ
    CloudApi.statsByDeck()
      .then(setDecks)
      .catch(() => setDecks(null))
  }, [])

  const todayStat = study?.[study.length - 1] ?? null
  const due = stats?.due ?? 0

  // Ngày hôm nay dạng "Hôm nay là Thứ Hai, 20/07"
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dateLabel = `Hôm nay là ${WEEKDAYS[now.getDay()]}, ${dd}/${mm} — cùng giữ nhịp học tiếng Anh nhé.`

  // Hiển thị số; khi chưa tải xong (null/undefined) thì hiện "—", còn 0 vẫn hiện "0"
  const fmt = (n: number | null | undefined) => (n == null ? '—' : n)

  // Dòng phụ của 2 thẻ đầu: tên các bộ và số thẻ theo từng bộ
  const deckNames = decks?.length ? decks.map((d) => d.name).join(', ') : 'Chưa có bộ từ nào'
  const deckCounts = decks?.length
    ? `${decks.map((d) => d.total).join(' · ')} theo bộ`
    : 'Chưa có thẻ nào'

  // Biểu đồ 14 ngày: cột cao theo tỉ lệ với ngày nhiều nhất
  const maxCount = Math.max(1, ...byDay.map((d) => d.count))

  return (
    <div className="page dashboard">
      {/* ---------------------------------------------------- Lời chào */}
      <section className="dash-hero">
        <div>
          <h1>Chào mừng quay lại</h1>
          <p>{dateLabel}</p>
        </div>
        <div className="dash-hero-due">
          {due > 0 && <span className="dash-badge warn">{due} thẻ đến hạn</span>}
          <button className="dash-btn" onClick={() => onNavigate('flashcard')}>
            <Icon name="repeat" /> Ôn tập ngay
          </button>
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      {/* ------------------------------------------------- 4 chỉ số lớn */}
      <section className="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat-top">
            <span className="dash-stat-label">Bộ từ</span>
            <Icon name="layers" />
          </div>
          <div className="dash-stat-value">{fmt(stats?.decks)}</div>
          <div className="dash-stat-sub" title={deckNames}>
            {deckNames}
          </div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-top">
            <span className="dash-stat-label">Tổng số thẻ</span>
            <Icon name="stack" />
          </div>
          <div className="dash-stat-value">{fmt(stats?.cards)}</div>
          <div className="dash-stat-sub">{deckCounts}</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-top">
            <span className="dash-stat-label">Cần ôn hôm nay</span>
            <Icon name="bell" />
          </div>
          <div className="dash-stat-value">{fmt(stats?.due)}</div>
          <div className="dash-stat-sub">
            {stats && stats.cards > 0 && stats.due === stats.cards ? (
              <span className="dash-badge warn plain">Toàn bộ kho đã đến hạn</span>
            ) : due > 0 ? (
              'Ôn ngay để không dồn thẻ'
            ) : (
              'Không còn thẻ nào đến hạn'
            )}
          </div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-top">
            <span className="dash-stat-label">Ngày streak</span>
            <Icon name="flame" />
          </div>
          <div className="dash-stat-value">{streak}</div>
          <div className="dash-stat-sub">
            {streak > 0 ? 'Giữ nhịp mỗi ngày nhé' : 'Ôn hôm nay để bắt đầu chuỗi'}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Hôm nay */}
      <section className="dash-card">
        <div className="dash-card-head">
          <h2>
            <Icon name="activity" /> Hôm nay bạn đã học
          </h2>
          <span className="dash-card-hint">Tự động ghi nhận</span>
        </div>
        <div className="dash-today">
          <div>
            <b>{fmt(todayStat?.minutes_studied)}</b>
            <span>
              <Icon name="clock" /> Phút học
            </span>
          </div>
          <div>
            <b>{fmt(todayStat?.cards_reviewed)}</b>
            <span>
              <Icon name="repeat" /> Thẻ đã ôn
            </span>
          </div>
          <div>
            <b>{fmt(todayStat?.new_words)}</b>
            <span>
              <Icon name="sparkle" /> Từ mới
            </span>
          </div>
          <div>
            <b>{fmt(todayStat?.quizzes_done)}</b>
            <span>
              <Icon name="tasks" /> Quiz đã làm
            </span>
          </div>
        </div>
      </section>

      {/* --------------------------------------------- Biểu đồ + tiến độ */}
      <section className="dash-row">
        <div className="dash-card">
          <div className="dash-card-head">
            <h2>
              <Icon name="trend" /> Số thẻ đã ôn
            </h2>
            <span className="dash-card-hint">14 ngày gần nhất</span>
          </div>
          <div className="dash-card-body">
            <div className="dash-chart">
              {byDay.map((d, i) => {
                const cls =
                  'dash-chart-col' +
                  (d.count ? '' : ' is-zero') +
                  (i === byDay.length - 1 ? ' is-today' : '')
                const h = d.count ? Math.max(6, Math.round((d.count / maxCount) * 100)) : 2
                return (
                  <div className={cls} key={d.date} title={`${d.date}: ${d.count} thẻ`}>
                    <span className="dash-chart-track">
                      <span className="dash-chart-fill" style={{ height: `${h}%` }} />
                    </span>
                    <span className="dash-chart-x">{Number(d.date.slice(8, 10))}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h2>
              <Icon name="target" /> Tiến độ theo bộ
            </h2>
            <button className="dash-card-hint" onClick={() => onNavigate('usage')}>
              Xem tất cả
            </button>
          </div>
          {decks?.length ? (
            decks.map((d) => (
              <div className="dash-deck" key={d.deck_id}>
                <span className="dash-deck-name" title={d.name}>
                  {d.name}
                </span>
                <span className="dash-bar">
                  <i style={{ width: `${d.total ? (d.learned / d.total) * 100 : 0}%` }} />
                </span>
                <span className="dash-deck-num">
                  {d.learned}/{d.total}
                </span>
              </div>
            ))
          ) : (
            <div className="dash-deck-empty">Chưa có bộ từ nào — tạo bộ đầu tiên ở mục Từ vựng.</div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------- Lối tắt */}
      <h2 className="dash-section-label">Bắt đầu nhanh</h2>
      <section className="dash-shortcuts">
        <button className="dash-shortcut" onClick={() => onNavigate('vocabulary')}>
          <span className="dash-shortcut-mark">
            <Icon name="layers" />
          </span>
          <span className="dash-shortcut-txt">
            <b>Quản lý từ vựng</b>
            <span>Tạo bộ từ &amp; thêm thẻ mới</span>
          </span>
          <Icon name="right" />
        </button>
        <button className="dash-shortcut" onClick={() => onNavigate('flashcard')}>
          <span className="dash-shortcut-mark">
            <Icon name="repeat" />
          </span>
          <span className="dash-shortcut-txt">
            <b>Ôn tập ngay</b>
            <span>{due} thẻ đang chờ bạn</span>
          </span>
          <Icon name="right" />
        </button>
        <button className="dash-shortcut" onClick={() => onNavigate('reading')}>
          <span className="dash-shortcut-mark">
            <Icon name="book" />
          </span>
          <span className="dash-shortcut-txt">
            <b>Đọc &amp; tra từ</b>
            <span>Bôi chữ để dịch tức thì</span>
          </span>
          <Icon name="right" />
        </button>
      </section>
    </div>
  )
}
