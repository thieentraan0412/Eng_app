import { useMemo, useState } from 'react'
import Icon from '../../components/Icon'
import { VN_TRAPS } from '../../data/grammar'
import type { ErrorEntry } from '../../services/cloud/grammarCloud'
import { ERROR_STEPS, daysUntil, todayStr } from '../../services/cloud/grammarCloud'
import { SentencePair } from './parts'

type Filter = 'all' | 'due' | 'repeat' | 'done'

const FILTER_LABEL: Record<Filter, string> = {
  all: 'Tất cả',
  due: 'Đến hạn hôm nay',
  repeat: 'Hay tái phạm',
  done: 'Đã khắc phục',
}

function whenText(due: string): string {
  const d = daysUntil(due)
  if (d <= 0) return 'Hôm nay'
  if (d === 1) return 'Ngày mai'
  return `Sau ${d} ngày`
}

function agoText(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'hôm nay'
  if (days === 1) return 'hôm qua'
  return `${days} ngày trước`
}

export default function ErrorBook({
  errors,
  onBack,
  onReview,
  onDelete,
}: {
  errors: ErrorEntry[]
  onBack: () => void
  onReview: (e: ErrorEntry) => void
  onDelete: (e: ErrorEntry) => void
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const active = errors.filter((e) => e.status === 'active')
  const due = active.filter((e) => e.due <= todayStr())
  const resolved = errors.filter((e) => e.status === 'resolved')
  const repeated = errors.filter((e) => e.hitCount > 1)
  const repeatRate = errors.length > 0 ? Math.round((repeated.length / errors.length) * 100) : 0

  const shown = useMemo(() => {
    switch (filter) {
      case 'due':
        return active.filter((e) => e.due <= todayStr())
      case 'repeat':
        return errors.filter((e) => e.hitCount > 1)
      case 'done':
        return resolved
      default:
        return errors
    }
  }, [filter, errors, active, resolved])

  const dist = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of errors) m.set(e.errorTag, (m.get(e.errorTag) ?? 0) + e.hitCount)
    const known = VN_TRAPS.map((t) => ({ tag: t.tag, name: t.name, n: m.get(t.tag) ?? 0 }))
    // nhóm lỗi ngoài 7 nhóm chuẩn (chủ điểm tự soạn) cũng được liệt kê
    for (const [tag, n] of m) {
      if (!known.some((k) => k.tag === tag)) known.push({ tag, name: tag, n })
    }
    const max = Math.max(1, ...known.map((k) => k.n))
    return known
      .filter((k) => k.n > 0 || VN_TRAPS.some((t) => t.tag === k.tag))
      .sort((a, b) => b.n - a.n)
      .map((k) => ({ ...k, pct: (k.n / max) * 100 }))
  }, [errors])

  return (
    <div className="page gr-page">
      <button className="gr-crumb" onClick={onBack}>
        <Icon name="left" /> Ngữ pháp
      </button>

      <div className="gr-head">
        <div>
          <h1>Sổ lỗi của tôi</h1>
          <p>
            Mỗi lỗi là một thẻ có lịch ôn riêng: mắc lỗi → 1 ngày → 3 → 7 → 21 ngày rồi chuyển sang
            “đã khắc phục”. Tái phạm thì quay lại chặng đầu.
          </p>
        </div>
      </div>

      <section className="gr-stats">
        <div className="gr-stat">
          <span className="gr-stat-top">
            <span className="gr-stat-label">Đang theo dõi</span>
            <Icon name="flag" />
          </span>
          <span className="gr-stat-value">{active.length}</span>
          <span className="gr-stat-sub">Lỗi chưa qua đủ 4 chặng ôn</span>
        </div>
        <div className="gr-stat">
          <span className="gr-stat-top">
            <span className="gr-stat-label">Đến hạn hôm nay</span>
            <Icon name="bell" />
          </span>
          <span className="gr-stat-value">{due.length}</span>
          <span className="gr-stat-sub">Ôn đúng thì giãn cách lần sau</span>
        </div>
        <div className="gr-stat">
          <span className="gr-stat-top">
            <span className="gr-stat-label">Đã khắc phục</span>
            <Icon name="check" />
          </span>
          <span className="gr-stat-value">{resolved.length}</span>
          <span className="gr-stat-sub">Đúng liên tiếp qua cả 4 chặng</span>
        </div>
        <div className="gr-stat">
          <span className="gr-stat-top">
            <span className="gr-stat-label">Tỷ lệ tái phạm</span>
            <Icon name="undo" />
          </span>
          <span className="gr-stat-value">{repeatRate}%</span>
          <span className="gr-stat-sub">{repeated.length} lỗi mắc từ 2 lần trở lên</span>
        </div>
      </section>

      {errors.length > 0 && (
        <section className="gr-card" style={{ marginBottom: 20 }}>
          <div className="gr-card-head">
            <h2>
              <Icon name="chart" /> Bạn hay sai kiểu gì
            </h2>
            <span className="gr-hint">Số lần mắc</span>
          </div>
          {dist.map((d, i) => (
            <div className={i < 2 && d.n > 0 ? 'gr-dist is-top' : 'gr-dist'} key={d.tag}>
              <span className="gr-dist-name">{d.name}</span>
              <span className="gr-dist-bar">
                <i style={{ width: `${d.pct}%` }} />
              </span>
              <span className="gr-dist-n">{d.n}</span>
            </div>
          ))}
        </section>
      )}

      <div className="gr-row" style={{ marginBottom: 14 }}>
        <div className="gr-chipset">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
            <button
              key={f}
              className={filter === f ? 'gr-chip is-active' : 'gr-chip'}
              onClick={() => setFilter(f)}
            >
              {f === 'due' && <Icon name="bell" />}
              {f === 'repeat' && <Icon name="undo" />}
              {f === 'done' && <Icon name="check" />}
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
        <span className="gr-spacer" />
        <span className="gr-count">{shown.length} lỗi</span>
      </div>

      {shown.length === 0 ? (
        <div className="gr-empty">
          <Icon name="check" />
          <b>{errors.length === 0 ? 'Sổ lỗi đang trống' : 'Không có lỗi nào ở nhóm này'}</b>
          <p>
            {errors.length === 0
              ? 'Luyện một phiên bất kỳ — mỗi câu sai sẽ tự được ghi vào đây kèm lịch ôn.'
              : 'Chọn bộ lọc khác, hoặc luyện thêm một phiên để hệ thống ghi nhận điểm yếu mới.'}
          </p>
        </div>
      ) : (
        <section className="gr-card">
          {shown.map((e) => (
            <div className="gr-err" key={e.id}>
              <div className="gr-err-top">
                <span
                  className={
                    e.status === 'resolved'
                      ? 'gr-badge gr-badge-ok gr-badge-dot'
                      : 'gr-badge gr-badge-err gr-badge-dot'
                  }
                >
                  {e.errorTag}
                </span>
                <span className="gr-err-topic">
                  {e.topicName}
                  {e.level ? ` · ${e.level}` : ''}
                </span>
                <span className="gr-err-act">
                  {e.status === 'resolved' ? (
                    <span className="gr-badge gr-badge-ok">
                      <Icon name="check" /> Đã khắc phục
                    </span>
                  ) : (
                    <>
                      <span
                        className={
                          e.due <= todayStr() ? 'gr-badge gr-badge-warn' : 'gr-badge'
                        }
                      >
                        <Icon name={e.due <= todayStr() ? 'bell' : 'calendar'} /> {whenText(e.due)}
                      </span>
                      <button className="gr-btn gr-btn-sm" onClick={() => onReview(e)}>
                        <Icon name="play" /> Ôn ngay
                      </button>
                    </>
                  )}
                  <button
                    className="gr-ibtn danger"
                    title="Xóa khỏi sổ lỗi"
                    onClick={() => onDelete(e)}
                  >
                    <Icon name="trash" />
                  </button>
                </span>
              </div>

              <SentencePair wrong={e.wrong} right={e.right} />

              <div className="gr-err-foot">
                <span>
                  <Icon name="undo" /> Mắc {e.hitCount} lần
                </span>
                <span>
                  <Icon name="calendar" /> Lần cuối {agoText(e.lastSeen)}
                </span>
                <span>
                  <Icon name="repeat" /> Chặng ôn
                  <span className="gr-srs">
                    {ERROR_STEPS.map((_, i) => (
                      <i key={i} className={i <= e.stage ? 'on' : ''} />
                    ))}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="gr-panel" style={{ marginTop: 14 }}>
        <b>
          <Icon name="repeat" /> Lịch ôn của một lỗi
        </b>
        <p>
          Mắc lần đầu → ôn sau <b>1 ngày</b> · đúng lần 1 → <b>3 ngày</b> · đúng lần 2 → <b>7 ngày</b>{' '}
          · đúng lần 3 → <b>21 ngày</b> và chuyển sang “đã khắc phục”. Tái phạm ở bất kỳ chặng nào thì
          quay về đầu, để bạn nhớ quy tắc chứ không nhớ đáp án.
        </p>
      </div>
    </div>
  )
}
