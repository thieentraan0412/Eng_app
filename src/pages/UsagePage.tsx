import { useEffect, useState } from 'react'
import {
  CloudApi,
  type DbStats,
  type StudyStat,
  type Retention,
  type DueBucket,
  type DeckStat,
} from '../services/cloud/CloudApiClient'
import { errText } from '../services/cloud/cloudError'
import { getUsageStats, resetRequestStats, type UsageStats } from '../services/usageStats'
import Heatmap from '../components/Heatmap'
import Icon from '../components/Icon'
import '../styles/usage.css'

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

  const onReset = () => {
    if (!confirm('Đặt lại bộ đếm request (chỉ trên máy này)?')) return
    resetRequestStats()
    setUsage(getUsageStats())
  }

  // Cột đứng cho request 7 ngày gần nhất (mockup .due7)
  const reqMax = Math.max(1, ...usage.byDay.map((d) => d.count))

  return (
    <div className="page usage-page">
      <div className="us-head">
        <div>
          <h1>Thống kê</h1>
          <p>Tiến độ học tập, tỷ lệ nhớ &amp; dung lượng lưu trữ.</p>
        </div>
        <button className="us-btn" onClick={refresh} disabled={loading}>
          <Icon name="refresh" /> {loading ? 'Đang tải…' : 'Làm mới'}
        </button>
      </div>

      {error && <div className="us-error">Không tải được thống kê: {error}</div>}

      {/* -------------------------------------------------- 4 chỉ số */}
      {studyTotals && (
        <section className="us-stats">
          <div className="us-stat">
            <div className="us-stat-top">
              <span className="us-stat-label">Phút học (1 năm)</span>
              <Icon name="clock" />
            </div>
            <div className="us-stat-value">{studyTotals.minutes.toLocaleString('vi-VN')}</div>
          </div>
          <div className="us-stat">
            <div className="us-stat-top">
              <span className="us-stat-label">Lượt ôn thẻ</span>
              <Icon name="repeat" />
            </div>
            <div className="us-stat-value">{studyTotals.cards.toLocaleString('vi-VN')}</div>
          </div>
          <div className="us-stat">
            <div className="us-stat-top">
              <span className="us-stat-label">Từ mới đã thêm</span>
              <Icon name="sparkle" />
            </div>
            <div className="us-stat-value">{studyTotals.words.toLocaleString('vi-VN')}</div>
          </div>
          <div className="us-stat">
            <div className="us-stat-top">
              <span className="us-stat-label">Quiz đã làm</span>
              <Icon name="tasks" />
            </div>
            <div className="us-stat-value">{studyTotals.quizzes.toLocaleString('vi-VN')}</div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- Heatmap */}
      <section className="us-card">
        <div className="us-card-head">
          <h2>
            <Icon name="calendar" /> Lịch học cả năm
          </h2>
          <span className="us-hint">phút học mỗi ngày</span>
        </div>
        <div className="us-card-body">
          {study ? (
            <Heatmap data={heatDays} unit="phút" />
          ) : (
            <p className="us-note">
              Chưa có dữ liệu thống kê học tập. Nếu vừa nâng cấp, hãy chạy lại{' '}
              <code>supabase/schema.sql</code> để thêm hàm ghi thống kê.
            </p>
          )}
        </div>
      </section>

      <div className="us-row2">
        {/* ------------------------------------------------ Tỷ lệ nhớ */}
        {retention && (
          <section className="us-card">
            <div className="us-card-head">
              <h2>
                <Icon name="target" /> Tỷ lệ nhớ
              </h2>
              <span className="us-hint">30 ngày</span>
            </div>
            <div className="us-card-body">
              {retention.total === 0 ? (
                <p className="us-note">Chưa có lượt ôn nào trong 30 ngày qua.</p>
              ) : (
                <>
                  <div className="us-recall-top">
                    <span className="us-recall-num">{Math.round(retention.rate * 100)}%</span>
                    <span className="us-recall-txt">
                      Nhớ {retention.kept.toLocaleString('vi-VN')} /{' '}
                      {retention.total.toLocaleString('vi-VN')} lượt
                      <small>không bấm “Lại”</small>
                    </span>
                  </div>
                  {(['again', 'hard', 'good', 'easy'] as const).map((k) => {
                    const label = { again: 'Lại', hard: 'Khó', good: 'Được', easy: 'Dễ' }[k]
                    const tone = { again: 'red', hard: 'amber', good: 'blue', easy: 'green' }[k]
                    const pct = retention.total
                      ? Math.round((retention.byRating[k] / retention.total) * 100)
                      : 0
                    return (
                      <div className="us-grade" key={k}>
                        <span className="us-grade-name">{label}</span>
                        <span className={`us-bar ${tone}`}>
                          <i style={{ width: `${pct}%` }} />
                        </span>
                        <span className="us-grade-val">
                          {retention.byRating[k]} · {pct}%
                        </span>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </section>
        )}

        {/* --------------------------------------------- Thẻ đến hạn */}
        {forecast && (
          <section className="us-card">
            <div className="us-card-head">
              <h2>
                <Icon name="bell" /> Thẻ đến hạn
              </h2>
              <span className="us-hint">7 ngày tới</span>
            </div>
            <div className="us-card-body">
              <div className="us-cols">
                {(() => {
                  const max = Math.max(1, ...forecast.map((b) => b.count))
                  return forecast.map((b) => (
                    <div
                      className={b.count ? 'us-col' : 'us-col is-zero'}
                      key={b.date || 'overdue'}
                      title={`${b.label}: ${b.count} thẻ`}
                    >
                      <span className="us-col-n">{b.count}</span>
                      <span className="us-col-track">
                        <span
                          className="us-col-fill"
                          style={{ height: b.count ? `${(b.count / max) * 100}%` : '2%' }}
                        />
                      </span>
                      <span className="us-col-d">{b.label}</span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ------------------------------------------------ Theo từng bộ */}
      {deckStats && deckStats.length > 0 && (
        <section className="us-card">
          <div className="us-card-head">
            <h2>
              <Icon name="layers" /> Theo từng bộ từ
            </h2>
          </div>
          {deckStats
            .slice()
            .sort((a, b) => b.total - a.total)
            .map((d) => {
              const pct = d.total ? Math.round((d.learned / d.total) * 100) : 0
              return (
                <div className="us-kv" key={d.deck_id}>
                  <span className="us-kv-k" title={d.name}>
                    {d.name}
                  </span>
                  <span className="us-bar" title={`${pct}% đã học`}>
                    <i style={{ width: `${pct}%` }} />
                  </span>
                  <span className="us-kv-v">
                    {d.learned}/{d.total}
                  </span>
                  {d.due > 0 && <span className="us-badge">{d.due} đến hạn</span>}
                </div>
              )
            })}
        </section>
      )}

      {/* ------------------------------------------- Lưu trữ & đồng bộ */}
      <h2 className="us-section-label">Lưu trữ &amp; đồng bộ</h2>

      <div className="us-row2">
        {/* Dung lượng Database */}
        <section className="us-card">
          <div className="us-card-head">
            <h2>
              <Icon name="database" /> Dung lượng Database
            </h2>
          </div>
          <div className="us-card-body">
            <div className="us-big-row">
              <span className="us-big">
                {db ? fmtBytes(db.db_size_bytes) : '—'} <small>đã dùng</small>
              </span>
              <span className="us-hint">/ 500 MB</span>
            </div>
            <span className="us-bar lg">
              <i style={{ width: `${dbPct}%` }} />
            </span>
            <p className="us-note">
              Đã dùng {dbPct.toFixed(1)}% hạn mức miễn phí ·{' '}
              {totalRows.toLocaleString('vi-VN')} bản ghi
            </p>
          </div>
        </section>

        {/* Số request (đếm phía client) */}
        <section className="us-card">
          <div className="us-card-head">
            <h2>
              <Icon name="activity" /> Request tới Supabase
            </h2>
            <button className="us-hint" onClick={onReset}>
              Đặt lại
            </button>
          </div>
          <div className="us-card-body">
            <div className="us-big-row">
              <span className="us-big">{usage.total.toLocaleString('vi-VN')}</span>
              <span className="us-hint">
                tổng · {usage.today.toLocaleString('vi-VN')} hôm nay
              </span>
            </div>
            <div className="us-cols sm">
              {usage.byDay.map((d) => (
                <div
                  className={d.count ? 'us-col' : 'us-col is-zero'}
                  key={d.date}
                  title={`${d.date}: ${d.count} request`}
                >
                  <span className="us-col-track">
                    <span
                      className="us-col-fill"
                      style={{ height: d.count ? `${(d.count / reqMax) * 100}%` : '3%' }}
                    />
                  </span>
                  <span className="us-col-d">{Number(d.date.slice(8, 10))}</span>
                </div>
              ))}
            </div>
            <p className="us-note">
              Đếm request do app này gọi <strong>trên máy này</strong> — không phải tổng toàn
              hệ thống.
            </p>
          </div>
        </section>
      </div>

      <div className="us-row2">
        {/* Số bản ghi từng bảng */}
        {db && (
          <section className="us-card">
            <div className="us-card-head">
              <h2>
                <Icon name="stack" /> Bản ghi theo bảng
              </h2>
              <span className="us-hint">{totalRows.toLocaleString('vi-VN')} tổng</span>
            </div>
            {Object.entries(db.tables)
              .sort((a, b) => b[1] - a[1])
              .map(([name, cnt]) => (
                <div className="us-kv" key={name}>
                  <span className="us-kv-k">{TABLE_LABEL[name] ?? name}</span>
                  <span className="us-kv-v">{cnt.toLocaleString('vi-VN')}</span>
                </div>
              ))}
          </section>
        )}

        {/* Hạn mức gói Free */}
        <section className="us-card">
          <div className="us-card-head">
            <h2>
              <Icon name="cloud" /> Hạn mức gói Free
            </h2>
            <span className="us-hint">tham khảo</span>
          </div>
          {FREE_LIMITS.map((l) => (
            <div className="us-quota" key={l.label}>
              <b>{l.label}</b>
              <span>
                {l.value}
                {l.note && ` · ${l.note}`}
              </span>
            </div>
          ))}
          <p className="us-foot-note">
            Con số băng thông &amp; tổng request chính xác chỉ xem được ở{' '}
            <strong>Supabase Dashboard → Settings → Usage</strong>.
          </p>
        </section>
      </div>
    </div>
  )
}
