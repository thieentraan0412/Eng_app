import { useMemo, useState } from 'react'
import Icon from '../../components/Icon'
import { VN_TRAPS, type CefrLevel } from '../../data/grammar'
import type { ErrorEntry, GrammarTopic, TopicProgress } from '../../services/cloud/grammarCloud'
import { isDue, todayStr } from '../../services/cloud/grammarCloud'
import { SentencePair, TopicCard, TopicStatus, topicIcon } from './parts'

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']

const SUB: Record<string, string> = {
  all: 'Chủ điểm từ A1 đến C1. Học quy tắc, luyện bằng 4 dạng bài, rồi sửa đúng những lỗi bạn hay mắc.',
  weak: 'Những chủ điểm bạn trả lời sai nhiều nhất — luyện ở đây hiệu quả hơn học lại từ đầu.',
  trap: 'Bảy lỗi sinh ra từ khác biệt giữa tiếng Việt và tiếng Anh — nhóm lỗi chiếm phần lớn bài viết của người học Việt.',
}

export default function TopicLibrary({
  topics,
  progress,
  errors,
  hidden,
  onOpenTopic,
  onPractice,
  onOpenErrors,
  onNewTopic,
  onEditTopic,
  onDeleteTopic,
  onRestoreTopic,
}: {
  topics: GrammarTopic[]
  progress: Record<string, TopicProgress>
  errors: ErrorEntry[]
  hidden: { key: string; name: string; level: string }[]
  onOpenTopic: (t: GrammarTopic) => void
  onPractice: (keys: string[]) => void
  onOpenErrors: () => void
  onNewTopic: () => void
  onEditTopic: (t: GrammarTopic) => void
  onDeleteTopic: (t: GrammarTopic) => void
  onRestoreTopic: (key: string) => void
}) {
  const [tab, setTab] = useState<'all' | 'weak' | 'trap'>('all')
  const [level, setLevel] = useState<'all' | CefrLevel>('all')

  const ready = useMemo(() => topics.filter((t) => t.items.length > 0), [topics])
  const shown = useMemo(
    () => (level === 'all' ? topics : topics.filter((t) => t.level === level)),
    [topics, level],
  )

  // ---------- Chỉ số ----------
  const mastered = topics.filter((t) => (progress[t.key]?.mastery ?? 0) >= 80).length
  const attempts = Object.values(progress).reduce((s, p) => s + p.attempts, 0)
  const corrects = Object.values(progress).reduce((s, p) => s + p.correct, 0)
  const accuracy = attempts > 0 ? Math.round((corrects / attempts) * 100) : 0
  const activeErrors = errors.filter((e) => e.status === 'active')
  const dueErrors = activeErrors.filter((e) => e.due <= todayStr())

  // ---------- Ưu tiên hôm nay ----------
  const priority = useMemo(() => {
    const score = (t: GrammarTopic) => {
      const p = progress[t.key]
      if (!p) return 60 // chưa luyện bao giờ
      return (isDue(p) ? 0 : 100) + p.mastery
    }
    return [...ready].sort((a, b) => score(a) - score(b)).slice(0, 3)
  }, [ready, progress])

  const priorityWhy = (t: GrammarTopic): string => {
    const p = progress[t.key]
    if (!p) return 'Chưa luyện lần nào — bắt đầu để hệ thống biết bạn yếu chỗ nào'
    if (isDue(p)) return 'Đến hạn ôn theo lịch giãn cách'
    if (p.mastery < 50) return `Mới đúng ${p.correct}/${p.attempts} câu — đang là điểm yếu`
    return `Nắm vững ${p.mastery}% · ôn thêm để giữ trong trí nhớ dài hạn`
  }

  // ---------- Điểm yếu ----------
  const weak = useMemo(
    () =>
      ready
        .filter((t) => progress[t.key])
        .sort((a, b) => (progress[a.key]?.mastery ?? 0) - (progress[b.key]?.mastery ?? 0))
        .slice(0, 5),
    [ready, progress],
  )

  // ---------- Tần suất 7 nhóm lỗi ----------
  const freq = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of errors) m.set(e.errorTag, (m.get(e.errorTag) ?? 0) + e.hitCount)
    const max = Math.max(1, ...VN_TRAPS.map((t) => m.get(t.tag) ?? 0))
    return VN_TRAPS.map((t) => ({ ...t, n: m.get(t.tag) ?? 0, pct: ((m.get(t.tag) ?? 0) / max) * 100 }))
  }, [errors])

  return (
    <div className="page gr-page">
      <div className="gr-head">
        <div>
          <h1>Ngữ pháp</h1>
          <p>{SUB[tab]}</p>
        </div>
        <div className="gr-head-actions">
          <button className="gr-btn" onClick={onOpenErrors}>
            <Icon name="flag" /> Sổ lỗi
            {activeErrors.length > 0 && (
              <span className="gr-badge gr-badge-err">{activeErrors.length}</span>
            )}
          </button>
          <button className="gr-btn" onClick={onNewTopic}>
            <Icon name="plus" /> Thêm chủ điểm
          </button>
          <button
            className="gr-btn gr-btn-primary"
            disabled={priority.length === 0}
            onClick={() => onPractice(priority.map((t) => t.key))}
          >
            <Icon name="play" /> Luyện 10 phút
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------- Chỉ số */}
      <section className="gr-stats">
        <div className="gr-stat">
          <span className="gr-stat-top">
            <span className="gr-stat-label">Chủ điểm đã nắm</span>
            <Icon name="grammar" />
          </span>
          <span className="gr-stat-value">
            {mastered}
            <small>/{topics.length}</small>
          </span>
          <span className="gr-stat-sub">Mức nắm vững ≥ 80%</span>
        </div>
        <div className="gr-stat">
          <span className="gr-stat-top">
            <span className="gr-stat-label">Độ chính xác</span>
            <Icon name="target" />
          </span>
          <span className="gr-stat-value">{accuracy}%</span>
          <span className="gr-stat-sub">
            {attempts > 0 ? `${corrects}/${attempts} câu đã trả lời` : 'Chưa có dữ liệu'}
          </span>
        </div>
        <div className="gr-stat">
          <span className="gr-stat-top">
            <span className="gr-stat-label">Lỗi đang theo dõi</span>
            <Icon name="flag" />
          </span>
          <span className="gr-stat-value">{activeErrors.length}</span>
          <span className="gr-stat-sub">{dueErrors.length} lỗi đến hạn ôn hôm nay</span>
        </div>
        <div className="gr-stat">
          <span className="gr-stat-top">
            <span className="gr-stat-label">Đã khắc phục</span>
            <Icon name="check" />
          </span>
          <span className="gr-stat-value">{errors.length - activeErrors.length}</span>
          <span className="gr-stat-sub">Đúng liên tiếp qua cả 4 chặng ôn</span>
        </div>
      </section>

      {/* --------------------------------------------- Ưu tiên hôm nay */}
      {priority.length > 0 && (
        <section className="gr-card" style={{ marginBottom: 20 }}>
          <div className="gr-card-head">
            <h2>
              <Icon name="zap" /> Ưu tiên hôm nay
            </h2>
            <span className="gr-hint">Chọn theo lịch ôn và độ chính xác gần đây</span>
          </div>
          {priority.map((t) => {
            const p = progress[t.key]
            return (
              <button key={t.key} className="gr-today" onClick={() => onOpenTopic(t)}>
                <span className="gr-mark">
                  <Icon name={topicIcon(t.icon)} />
                </span>
                <span className="gr-today-main">
                  <span className="gr-today-name">{t.name}</span>
                  <span className="gr-today-why">{priorityWhy(t)}</span>
                </span>
                <span className="gr-today-side">
                  <span className="gr-mini-bar">
                    <i style={{ width: `${p?.mastery ?? 0}%` }} />
                  </span>
                  <span className="gr-mini-num">{p ? `${p.mastery}%` : '—'}</span>
                  <TopicStatus p={p} />
                </span>
              </button>
            )
          })}
          <div className="gr-card-foot">
            <button
              className="gr-btn gr-btn-primary"
              onClick={() => onPractice(priority.map((t) => t.key))}
            >
              <Icon name="play" /> Luyện {priority.length} chủ điểm này
            </button>
            <span className="gr-foot-note">
              {priority.reduce((s, t) => s + Math.min(t.items.length, 6), 0)} câu · trộn cả 4 dạng bài
            </span>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- Tabs */}
      <nav className="gr-tabs">
        <button className={tab === 'all' ? 'is-active' : ''} onClick={() => setTab('all')}>
          <Icon name="grammar" /> Tất cả chủ điểm
        </button>
        <button className={tab === 'weak' ? 'is-active' : ''} onClick={() => setTab('weak')}>
          <Icon name="alert" /> Điểm yếu của tôi
        </button>
        <button className={tab === 'trap' ? 'is-active' : ''} onClick={() => setTab('trap')}>
          <Icon name="lang" /> Bẫy với người Việt
        </button>
      </nav>

      {/* ============================================ TẤT CẢ CHỦ ĐIỂM */}
      {tab === 'all' && (
        <>
          <div className="gr-row" style={{ marginBottom: 14 }}>
            <div className="gr-chipset">
              <button
                className={level === 'all' ? 'gr-chip is-active' : 'gr-chip'}
                onClick={() => setLevel('all')}
              >
                Tất cả
              </button>
              {LEVELS.map((l) => (
                <button
                  key={l}
                  className={level === l ? 'gr-chip is-active' : 'gr-chip'}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
            <span className="gr-spacer" />
            <span className="gr-count">{shown.length} chủ điểm</span>
          </div>

          {shown.length === 0 ? (
            <div className="gr-empty">
              <Icon name="search" />
              <b>Chưa có chủ điểm ở cấp độ này</b>
              <p>Chọn một cấp độ khác, hoặc tự thêm chủ điểm cho cấp độ đang thiếu.</p>
            </div>
          ) : (
            <section className="gr-grid">
              {shown.map((t) => (
                <TopicCard
                  key={t.key}
                  topic={t}
                  progress={progress[t.key]}
                  onOpen={() => onOpenTopic(t)}
                  onEdit={() => onEditTopic(t)}
                  onDelete={() => onDeleteTopic(t)}
                />
              ))}
              <button className="gr-new-topic" onClick={onNewTopic}>
                <Icon name="plus" />
                <b>Thêm chủ điểm</b>
                <span>Soạn mới, chép từ thư viện mẫu, hoặc nạp từ Excel</span>
              </button>
            </section>
          )}

          {/* ------------------------------------------- Chủ điểm đã ẩn */}
          {hidden.length > 0 && (
            <div className="gr-card" style={{ marginTop: 18 }}>
              <div className="gr-card-head">
                <h2>
                  <Icon name="eye" /> {hidden.length} chủ điểm đã ẩn
                </h2>
                <span className="gr-hint">Tiến độ cũ vẫn còn — hiện lại là dùng tiếp</span>
              </div>
              {hidden.map((h) => (
                <div className="gr-today" key={h.key} style={{ cursor: 'default' }}>
                  <span className="gr-mark">
                    <Icon name="grammar" />
                  </span>
                  <span className="gr-today-main">
                    <span className="gr-today-name">
                      {h.name} {h.level && <span className="gr-lv">{h.level}</span>}
                    </span>
                    <span className="gr-today-why">Không hiện trong thư viện và không vào phiên luyện</span>
                  </span>
                  <span className="gr-today-side">
                    <button className="gr-btn" onClick={() => onRestoreTopic(h.key)}>
                      <Icon name="undo" /> Hiện lại
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================================================ ĐIỂM YẾU */}
      {tab === 'weak' && (
        <>
          {weak.length === 0 ? (
            <div className="gr-empty">
              <Icon name="target" />
              <b>Chưa đủ dữ liệu để xếp điểm yếu</b>
              <p>Luyện một vài phiên trước — hệ thống cần biết bạn sai ở đâu mới xếp được thứ tự.</p>
            </div>
          ) : (
            <div className="gr-card" style={{ marginBottom: 14 }}>
              <div className="gr-card-head">
                <h2>
                  <Icon name="alert" /> {weak.length} chủ điểm cần ưu tiên
                </h2>
                <span className="gr-hint">Sắp theo mức nắm vững thấp nhất</span>
              </div>
              {weak.map((t) => {
                const p = progress[t.key]
                return (
                  <button key={t.key} className="gr-today" onClick={() => onOpenTopic(t)}>
                    <span className="gr-mark">
                      <Icon name={topicIcon(t.icon)} />
                    </span>
                    <span className="gr-today-main">
                      <span className="gr-today-name">
                        {t.name} <span className="gr-lv">{t.level}</span>
                      </span>
                      <span className="gr-today-why">
                        {p?.correct ?? 0} / {p?.attempts ?? 0} câu đúng
                        {t.tags.length > 0 && ` · nhóm lỗi: ${t.tags.join(', ')}`}
                      </span>
                    </span>
                    <span className="gr-today-side">
                      <span className="gr-mini-bar">
                        <i style={{ width: `${p?.mastery ?? 0}%` }} />
                      </span>
                      <span className="gr-mini-num">{p?.mastery ?? 0}%</span>
                    </span>
                  </button>
                )
              })}
              <div className="gr-card-foot">
                <button
                  className="gr-btn gr-btn-primary"
                  onClick={() => onPractice(weak.map((t) => t.key))}
                >
                  <Icon name="target" /> Luyện riêng điểm yếu
                </button>
                <button className="gr-btn" onClick={onOpenErrors}>
                  <Icon name="flag" /> Mở sổ lỗi
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================= BẪY NGƯỜI VIỆT */}
      {tab === 'trap' && (
        <>
          <div className="gr-panel" style={{ marginBottom: 14 }}>
            <p style={{ marginTop: 0 }}>
              Tiếng Việt không có đuôi chia thì, không có đuôi số nhiều, không có mạo từ. Vì vậy lỗi
              của người học Việt Nam <b>không rải đều</b> mà dồn vào 7 điểm rất hẹp dưới đây — sửa
              đúng 7 điểm này là xử lý được phần lớn lỗi trong bài viết.
            </p>
          </div>

          <div className="gr-card">
            <div className="gr-card-head">
              <h2>
                <Icon name="lang" /> 7 lỗi thường gặp nhất
              </h2>
              <span className="gr-hint">Thanh bên phải: số lần bạn đã mắc</span>
            </div>
            {freq.map((t, i) => (
              <div className="gr-trap" key={t.tag}>
                <div className="gr-trap-head">
                  <span className="gr-trap-no">{i + 1}</span>
                  <span className="gr-trap-name">{t.name}</span>
                  <span className="gr-trap-freq">
                    <span className="gr-freq-bar">
                      <i style={{ width: `${t.pct}%` }} />
                    </span>
                    <span className="gr-mini-num">{t.n}</span>
                  </span>
                </div>
                <SentencePair wrong={t.wrong} right={t.right} />
                <p className="gr-trap-why">{t.why}</p>
              </div>
            ))}
          </div>

          <div className="gr-row" style={{ marginTop: 14 }}>
            <button
              className="gr-btn gr-btn-primary"
              disabled={ready.length === 0}
              onClick={() =>
                onPractice(ready.filter((t) => t.tags.length > 0).map((t) => t.key))
              }
            >
              <Icon name="target" /> Luyện các chủ điểm có bẫy
            </button>
            <button className="gr-btn" onClick={onOpenErrors}>
              <Icon name="flag" /> Xem lỗi tôi đã mắc
            </button>
          </div>
        </>
      )}
    </div>
  )
}
