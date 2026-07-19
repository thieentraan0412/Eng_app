import { useEffect, useState } from 'react'
import {
  CloudApi,
  type DbStats,
  type StudyStat,
  type Retention,
  type DueBucket,
  type DeckStat,
} from '../services/cloud/CloudApiClient'
import { getUsageStats, resetRequestStats, type UsageStats } from '../services/usageStats'
import BarChart from '../components/BarChart'
import Heatmap from '../components/Heatmap'

// Hạn mức gói Supabase Free (tham khảo — nên đối chiếu Dashboard cho chính xác)
const DB_FREE_BYTES = 500 * 1024 * 1024 // 500 MB
const FREE_LIMITS: { label: string; value: string; note: string }[] = [
  { label: 'Database', value: '500 MB', note: 'đo được ở trên' },
  { label: 'Băng thông (egress)', value: '5 GB / tháng', note: 'chỉ xem được ở Dashboard' },
  { label: 'File Storage', value: '1 GB', note: '' },
  { label: 'Người dùng hoạt động / tháng', value: '50.000', note: '' },
]

const TABLE_LABEL: Record<string, string> = {
  decks: 'Bộ từ',
  cards: 'Thẻ từ',
  sentences: 'Câu (Chép câu)',
  sentence_folders: 'Thư mục câu',
  sentence_progress: 'Bài đã làm',
  readings: 'Bài đọc',
  writings: 'Bài viết',
  lessons: 'Bài ngữ pháp',
  questions: 'Câu hỏi',
  review_logs: 'Lịch sử ôn',
}

// Lỗi Supabase (PostgrestError) là object thường {message, details, hint, code}
// -> lấy đúng message thay vì in ra "[object Object]".
function errText(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>
    const parts = [o.message, o.details, o.hint].filter(Boolean).map(String)
    if (parts.length) return parts.join(' · ')
  }
  return String(e)
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export default function UsagePage() {
  const [db, setDb] = useState<DbStats | null>(null)
  const [usage, setUsage] = useState<UsageStats>(() => getUsageStats())
  const [study, setStudy] = useState<StudyStat[] | null>(null)
  const [retention, setRetention] = useState<Retention | null>(null)
  const [forecast, setForecast] = useState<DueBucket[] | null>(null)
  const [deckStats, setDeckStats] = useState<DeckStat[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    // Thống kê học tập — mỗi phần độc lập, phần nào lỗi/thiếu migration thì bỏ qua
    CloudApi.studyStatsByDay(364).then(setStudy).catch(() => setStudy(null))
    CloudApi.retention(30).then(setRetention).catch(() => setRetention(null))
    CloudApi.dueForecast(7).then(setForecast).catch(() => setForecast(null))
    CloudApi.statsByDeck().then(setDeckStats).catch(() => setDeckStats(null))
    try {
      setDb(await CloudApi.getDbStats())
      setUsage(getUsageStats())
    } catch (e) {
      setError(errText(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const dbPct = db ? Math.min(100, (db.db_size_bytes / DB_FREE_BYTES) * 100) : 0
  const totalRows = db ? Object.values(db.tables).reduce((a, b) => a + b, 0) : 0

  // Tổng hợp thống kê học tập cho các thẻ số & heatmap
  const studyTotals = study
    ? study.reduce(
        (a, s) => ({
          minutes: a.minutes + s.minutes_studied,
          cards: a.cards + s.cards_reviewed,
          words: a.words + s.new_words,
          quizzes: a.quizzes + s.quizzes_done,
        }),
        { minutes: 0, cards: 0, words: 0, quizzes: 0 },
      )
    : null
  const heatDays = study?.map((s) => ({ date: s.date, value: s.minutes_studied })) ?? []
  const maxForecast = forecast ? Math.max(1, ...forecast.map((b) => b.count)) : 1

  const onReset = () => {
    if (!confirm('Đặt lại bộ đếm request (chỉ trên máy này)?')) return
    resetRequestStats()
    setUsage(getUsageStats())
  }

  return (
    <div className="page usage-page">
      <div className="usage-head">
        <div>
          <h1 className="page-title">Thống kê</h1>
          <p className="page-sub">Tiến độ học tập, tỷ lệ nhớ & dung lượng lưu trữ</p>
        </div>
        <button className="btn" onClick={refresh} disabled={loading}>
          {loading ? 'Đang tải…' : '↻ Làm mới'}
        </button>
      </div>

      {error && <div className="usage-error">⚠️ Không tải được thống kê: {error}</div>}

      {/* Tổng quan học tập (30–365 ngày) */}
      {studyTotals && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-num">⏱️ {studyTotals.minutes.toLocaleString('vi-VN')}</div>
            <div className="stat-label">Phút học (1 năm)</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">🔁 {studyTotals.cards.toLocaleString('vi-VN')}</div>
            <div className="stat-label">Lượt ôn thẻ</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">✨ {studyTotals.words.toLocaleString('vi-VN')}</div>
            <div className="stat-label">Từ mới đã thêm</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">📝 {studyTotals.quizzes.toLocaleString('vi-VN')}</div>
            <div className="stat-label">Quiz đã làm</div>
          </div>
        </div>
      )}

      {/* Heatmap kiểu GitHub — phút học từng ngày trong 1 năm */}
      <div className="usage-card">
        <div className="usage-card-head">
          <h2>🗓️ Lịch học cả năm</h2>
          <span className="muted">phút học mỗi ngày</span>
        </div>
        {study ? (
          <Heatmap data={heatDays} unit="phút" />
        ) : (
          <p className="muted">
            Chưa có dữ liệu thống kê học tập. Nếu vừa nâng cấp, hãy chạy lại{' '}
            <code>supabase/schema.sql</code> để thêm hàm ghi thống kê.
          </p>
        )}
      </div>

      {/* Tỷ lệ nhớ (retention) 30 ngày */}
      {retention && (
        <div className="usage-card">
          <div className="usage-card-head">
            <h2>🧠 Tỷ lệ nhớ (30 ngày)</h2>
            <span className="usage-big">
              {retention.total ? `${Math.round(retention.rate * 100)}%` : '—'}
            </span>
          </div>
          {retention.total === 0 ? (
            <p className="muted">Chưa có lượt ôn nào trong 30 ngày qua.</p>
          ) : (
            <>
              <div className="sp-bar usage-bar">
                <div
                  className={`sp-bar-fill ${
                    retention.rate >= 0.85 ? '' : retention.rate >= 0.6 ? 'is-warn' : 'is-danger'
                  }`}
                  style={{ width: `${Math.round(retention.rate * 100)}%` }}
                />
              </div>
              <div className="usage-meta">
                <span className="muted">
                  Nhớ {retention.kept.toLocaleString('vi-VN')} / {retention.total.toLocaleString('vi-VN')} lượt
                  (không bấm “Lại”)
                </span>
              </div>
              <div className="retention-breakdown">
                {(['again', 'hard', 'good', 'easy'] as const).map((k) => {
                  const label = { again: 'Lại', hard: 'Khó', good: 'Được', easy: 'Dễ' }[k]
                  const pct = retention.total
                    ? Math.round((retention.byRating[k] / retention.total) * 100)
                    : 0
                  return (
                    <div key={k} className={`ret-item ret-${k}`}>
                      <span className="ret-label">{label}</span>
                      <span className="ret-count">{retention.byRating[k]}</span>
                      <span className="ret-pct muted">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Dự báo thẻ đến hạn 7 ngày tới */}
      {forecast && (
        <div className="usage-card">
          <div className="usage-card-head">
            <h2>🔮 Thẻ đến hạn (7 ngày tới)</h2>
          </div>
          <div className="forecast">
            {forecast.map((b) => (
              <div className="fc-bar-col" key={b.date || 'overdue'}>
                <div className="fc-bar-track">
                  <div
                    className={`fc-bar-fill ${b.date === '' ? 'overdue' : ''}`}
                    style={{ height: `${(b.count / maxForecast) * 100}%` }}
                    title={`${b.label}: ${b.count} thẻ`}
                  />
                </div>
                <span className="fc-bar-count">{b.count}</span>
                <span className="fc-bar-label muted">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thống kê theo từng bộ từ */}
      {deckStats && deckStats.length > 0 && (
        <div className="usage-card">
          <div className="usage-card-head">
            <h2>📚 Theo từng bộ từ</h2>
          </div>
          <div className="deckstat-list">
            {deckStats
              .slice()
              .sort((a, b) => b.total - a.total)
              .map((d) => {
                const pct = d.total ? Math.round((d.learned / d.total) * 100) : 0
                return (
                  <div className="deckstat-row" key={d.deck_id}>
                    <div className="deckstat-top">
                      <span className="deckstat-name">{d.name}</span>
                      <span className="muted">
                        {d.learned}/{d.total} đã học · {pct}%
                        {d.due > 0 && <span className="deckstat-due"> · 🔔 {d.due} đến hạn</span>}
                      </span>
                    </div>
                    <div className="ex-deck-bar">
                      <div style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Dung lượng Database */}
      <div className="usage-card">
        <div className="usage-card-head">
          <h2>💾 Dung lượng Database</h2>
          {db && (
            <span className="usage-big">
              {fmtBytes(db.db_size_bytes)} <span className="muted">/ 500 MB</span>
            </span>
          )}
        </div>
        <div className="sp-bar usage-bar">
          <div
            className={`sp-bar-fill ${dbPct >= 80 ? 'is-danger' : dbPct >= 50 ? 'is-warn' : ''}`}
            style={{ width: `${dbPct}%` }}
          />
        </div>
        <div className="usage-meta">
          <span>Đã dùng {dbPct.toFixed(1)}% hạn mức miễn phí</span>
          <span className="muted">{totalRows.toLocaleString('vi-VN')} bản ghi</span>
        </div>
      </div>

      {/* Số bản ghi từng bảng */}
      {db && (
        <div className="usage-card">
          <div className="usage-card-head">
            <h2>📋 Số bản ghi theo bảng</h2>
          </div>
          <div className="usage-rows">
            {Object.entries(db.tables)
              .sort((a, b) => b[1] - a[1])
              .map(([name, cnt]) => (
                <div className="usage-row" key={name}>
                  <span className="usage-row-name">{TABLE_LABEL[name] ?? name}</span>
                  <span className="usage-row-count">{cnt.toLocaleString('vi-VN')}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Số request (đếm phía client) */}
      <div className="usage-card">
        <div className="usage-card-head">
          <h2>📡 Số request tới Supabase</h2>
          <div className="usage-req-nums">
            <span className="usage-big">{usage.total.toLocaleString('vi-VN')}</span>
            <span className="muted">tổng · {usage.today.toLocaleString('vi-VN')} hôm nay</span>
          </div>
        </div>
        <BarChart data={usage.byDay} />
        <div className="usage-meta">
          <span className="muted">
            Đếm request do app này gọi <strong>trên máy này</strong> — không phải tổng toàn hệ thống.
          </span>
          <button className="btn tiny" onClick={onReset}>
            Đặt lại
          </button>
        </div>
      </div>

      {/* Hạn mức gói Free */}
      <div className="usage-card">
        <div className="usage-card-head">
          <h2>🆓 Hạn mức gói Free (tham khảo)</h2>
        </div>
        <div className="usage-rows">
          {FREE_LIMITS.map((l) => (
            <div className="usage-row" key={l.label}>
              <span className="usage-row-name">{l.label}</span>
              <span className="usage-row-count">
                {l.value}
                {l.note && <em className="usage-note"> · {l.note}</em>}
              </span>
            </div>
          ))}
        </div>
        <p className="muted usage-foot">
          Con số băng thông & tổng request chính xác chỉ xem được ở{' '}
          <strong>Supabase Dashboard → Settings → Usage</strong>.
        </p>
      </div>
    </div>
  )
}
