import { useEffect, useState } from 'react'
import { CloudApi, type DbStats } from '../services/cloud/CloudApiClient'
import { getUsageStats, resetRequestStats, type UsageStats } from '../services/usageStats'
import BarChart from '../components/BarChart'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
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
          <p className="page-sub">Dung lượng database & số request đã dùng (gói Supabase Free)</p>
        </div>
        <button className="btn" onClick={refresh} disabled={loading}>
          {loading ? 'Đang tải…' : '↻ Làm mới'}
        </button>
      </div>

      {error && <div className="usage-error">⚠️ Không tải được thống kê: {error}</div>}

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
