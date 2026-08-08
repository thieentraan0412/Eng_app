import Icon from '../../components/Icon'
import type { ErrorEntry, GrammarTopic, TopicProgress } from '../../services/cloud/grammarCloud'
import { Hl, SentencePair, Struct, TopicStatus, topicIcon } from './parts'

const USE_ICONS = ['target', 'zap', 'clock', 'sparkle'] as const

export default function TopicLesson({
  topic,
  progress,
  errors,
  onBack,
  onPractice,
  onOpenErrors,
  onEdit,
  onDelete,
  onRevert,
  onToggleLearned,
}: {
  topic: GrammarTopic
  progress: TopicProgress | undefined
  errors: ErrorEntry[]
  onBack: () => void
  onPractice: () => void
  onOpenErrors: () => void
  onEdit: () => void
  onDelete: () => void
  /** chỉ có ở bản sửa của chủ điểm dựng sẵn — bỏ bản sửa, quay về nội dung gốc */
  onRevert: () => void
  onToggleLearned: (learned: boolean) => void
}) {
  const mastery = progress?.mastery ?? 0
  const marked = progress?.learned === true
  const myErrors = errors.filter((e) => e.topicKey === topic.key && e.status === 'active')
  const empty =
    topic.formulas.length === 0 &&
    topic.uses.length === 0 &&
    topic.traps.length === 0 &&
    topic.items.length === 0

  return (
    <div className="page gr-page is-narrow">
      <button className="gr-crumb" onClick={onBack}>
        <Icon name="left" /> Tất cả chủ điểm
      </button>

      <div className="gr-head">
        <div>
          <h1>{topic.name}</h1>
          <p>
            {topic.nameEn && <>{topic.nameEn} — </>}
            {topic.description}
          </p>
          <div className="gr-row" style={{ marginTop: 10 }}>
            <span className="gr-lv">{topic.level}</span>
            {topic.group && <span className="gr-badge">{topic.group}</span>}
            <span className="gr-badge">
              <Icon name="grammar" /> {topic.formulas.length} quy tắc
            </span>
            <span className="gr-badge">
              <Icon name="tasks" /> {topic.items.length} câu luyện
            </span>
            <TopicStatus p={progress} />
          </div>
        </div>
        <div className="gr-head-actions">
          <span
            className="gr-ring"
            style={{ ['--p' as string]: mastery }}
            title={`Mức nắm vững ${mastery}%`}
          >
            <span>{mastery}%</span>
          </span>
          <button
            className={marked ? 'gr-btn is-learned' : 'gr-btn'}
            aria-pressed={marked}
            title={
              marked
                ? 'Bỏ đánh dấu — chủ điểm quay lại danh sách cần ôn'
                : 'Đánh dấu đã học — thẻ chuyển xanh và thôi nhắc ôn'
            }
            onClick={() => onToggleLearned(!marked)}
          >
            <Icon name="check" /> {marked ? 'Đã học' : 'Đánh dấu đã học'}
          </button>
          <button className="gr-btn" onClick={onEdit}>
            <Icon name="pencil" /> Sửa
          </button>
          {topic.sourceKey && (
            <button className="gr-btn" title="Bỏ bản sửa, dùng lại nội dung dựng sẵn" onClick={onRevert}>
              <Icon name="undo" /> Về bản gốc
            </button>
          )}
          <button
            className="gr-btn gr-btn-ghost"
            title={topic.builtin ? 'Ẩn chủ điểm khỏi thư viện' : 'Xóa chủ điểm'}
            onClick={onDelete}
          >
            <Icon name="trash" /> {topic.builtin ? 'Ẩn' : 'Xóa'}
          </button>
          <button
            className="gr-btn gr-btn-primary"
            disabled={topic.items.length === 0}
            onClick={onPractice}
          >
            <Icon name="play" /> Luyện chủ điểm này
          </button>
        </div>
      </div>

      {empty && (
        <div className="gr-empty" style={{ marginBottom: 14 }}>
          <Icon name="file" />
          <b>Chủ điểm này chưa có nội dung</b>
          <p>
            Phần lý thuyết và câu luyện chưa được soạn. Bấm “Sửa” để nhập công thức, trường hợp dùng
            và bộ câu luyện cho chính chủ điểm này — nội dung lưu riêng cho tài khoản của bạn.
          </p>
          <button className="gr-btn gr-btn-primary" style={{ marginTop: 12 }} onClick={onEdit}>
            <Icon name="pencil" /> Soạn nội dung cho chủ điểm này
          </button>
        </div>
      )}

      {/* ------------------------------------------------- 1. Công thức */}
      {topic.formulas.length > 0 && (
        <section className="gr-card" style={{ marginBottom: 14 }}>
          <div className="gr-card-head">
            <h2>
              <Icon name="grammar" /> Công thức
            </h2>
            <span className="gr-hint">V3 = quá khứ phân từ</span>
          </div>
          <table className="gr-table">
            <thead>
              <tr>
                <th>Dạng</th>
                <th>Cấu trúc</th>
                <th>Ví dụ</th>
              </tr>
            </thead>
            <tbody>
              {topic.formulas.map((f, i) => (
                <tr key={i}>
                  <td className="gr-k" data-label="Dạng">{f.form}</td>
                  <td data-label="Cấu trúc">
                    <Struct text={f.structure} />
                  </td>
                  <td data-label="Ví dụ">
                    <span>
                      <Hl text={f.example} />
                    </span>
                    {f.exampleVi && <span className="gr-ex-vi">{f.exampleVi}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* -------------------------------------------- 2. Dòng thời gian */}
      {topic.timeline && (
        <section className="gr-card" style={{ marginBottom: 14 }}>
          <div className="gr-card-head">
            <h2>
              <Icon name="activity" /> Nhìn trên dòng thời gian
            </h2>
            <span className="gr-hint">Vì sao “đã” trong tiếng Việt không đủ để phân biệt</span>
          </div>
          <div className="gr-tl-wrap">
            <svg
              className="gr-tl"
              viewBox="0 0 640 132"
              role="img"
              aria-label="Dòng thời gian so sánh quá khứ đơn và hiện tại hoàn thành"
            >
              <line x1="24" y1="92" x2="600" y2="92" stroke="var(--border-strong)" strokeWidth="1.4" />
              <path d="M600 92 l-8 -4 v8 z" fill="var(--border-strong)" />
              <line
                x1="470"
                y1="34"
                x2="470"
                y2="104"
                stroke="var(--muted)"
                strokeWidth="1.4"
                strokeDasharray="3 4"
              />
              <text x="470" y="120" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-soft)">
                BÂY GIỜ
              </text>
              <text x="70" y="120" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--muted)">
                QUÁ KHỨ
              </text>

              <circle cx="150" cy="92" r="4.6" fill="var(--muted)" />
              <line x1="150" y1="92" x2="150" y2="64" stroke="var(--muted)" strokeWidth="1.2" />
              <text x="150" y="56" textAnchor="middle" fontSize="11.5" fill="var(--text-soft)">
                I lived in Hue.
              </text>
              <text x="150" y="42" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--muted)">
                QUÁ KHỨ ĐƠN · đã xong hẳn
              </text>

              <line
                x1="270"
                y1="92"
                x2="470"
                y2="92"
                stroke="var(--primary)"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
              <circle cx="270" cy="92" r="4.6" fill="var(--primary)" />
              <circle cx="470" cy="92" r="4.6" fill="var(--primary)" />
              <line x1="370" y1="92" x2="370" y2="70" stroke="var(--primary)" strokeWidth="1.2" />
              <text x="370" y="62" textAnchor="middle" fontSize="11.5" fill="var(--primary)">
                I have lived in Hue for 6 years.
              </text>
              <text x="370" y="48" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--primary)">
                HIỆN TẠI HOÀN THÀNH · còn kéo dài
              </text>
            </svg>
          </div>
          <div className="gr-tl-legend">
            <span>
              <i className="gr-tl-key" style={{ background: 'var(--muted)' }} /> Quá khứ đơn — sự việc{' '}
              <b>khép lại</b> trong quá khứ, không dính tới hiện tại
            </span>
            <span>
              <i className="gr-tl-key" style={{ background: 'var(--primary)' }} /> Hiện tại hoàn thành —
              sự việc <b>bắc cầu</b> từ quá khứ tới bây giờ
            </span>
          </div>
        </section>
      )}

      {/* ------------------------------------------ 3. Trường hợp dùng */}
      {topic.uses.length > 0 && (
        <section className="gr-card" style={{ marginBottom: 14 }}>
          <div className="gr-card-head">
            <h2>
              <Icon name="bulb" /> {topic.uses.length} trường hợp dùng
            </h2>
          </div>
          <div className="gr-card-body">
            <div className="gr-uses">
              {topic.uses.map((u, i) => (
                <div className="gr-use" key={i}>
                  <b>
                    <Icon name={USE_ICONS[i % USE_ICONS.length]} /> {i + 1} · {u.name}
                  </b>
                  <span className="gr-use-sample">
                    <Hl text={u.sample} as="u" />
                    {u.note && <span className="gr-use-note">{u.note}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------- 4. Từ tín hiệu */}
      {topic.signals.length > 0 && (
        <section className="gr-card" style={{ marginBottom: 14 }}>
          <div className="gr-card-head">
            <h2>
              <Icon name="search" /> Từ tín hiệu
            </h2>
            <span className="gr-hint">Thấy những từ này thì nghĩ ngay tới chủ điểm này</span>
          </div>
          <div className="gr-card-body">
            <div className="gr-signals">
              {topic.signals.map((s) => (
                <span className="gr-sig" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------ 5. Đối chiếu */}
      {topic.compare && topic.compare.rows.length > 0 && (
        <section className="gr-card" style={{ marginBottom: 14 }}>
          <div className="gr-card-head">
            <h2>
              <Icon name="shuffle" /> Đối chiếu với {topic.compare.with}
            </h2>
            <span className="gr-hint">Phần được tra nhiều nhất</span>
          </div>
          <div className="gr-cmp">
            <div>
              <div className="gr-cmp-head">
                <Icon name="undo" /> {topic.compare.with}
              </div>
              {topic.compare.rows.map((r, i) => (
                <div className="gr-cmp-row" key={i}>
                  <b>{r.key}</b>
                  {r.other}
                </div>
              ))}
            </div>
            <div>
              <div className="gr-cmp-head">
                <Icon name={topicIcon(topic.icon)} /> {topic.name}
              </div>
              {topic.compare.rows.map((r, i) => (
                <div className="gr-cmp-row" key={i}>
                  <b>{r.key}</b>
                  {r.self}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------- 6. Bẫy người Việt */}
      {topic.traps.length > 0 && (
        <section className="gr-card" style={{ marginBottom: 14 }}>
          <div className="gr-card-head">
            <h2>
              <Icon name="lang" /> {topic.traps.length} bẫy với người học Việt
            </h2>
            <span className="gr-hint">Chỗ tiếng mẹ đẻ kéo bạn đi sai hướng</span>
          </div>
          {topic.traps.map((t, i) => (
            <div className="gr-trap" key={i}>
              <div className="gr-trap-head">
                <span className="gr-trap-no">{i + 1}</span>
                <span className="gr-trap-name">{t.why.split('.')[0]}</span>
              </div>
              <SentencePair wrong={t.wrong} right={t.right} />
              <p className="gr-trap-why">{t.why}</p>
            </div>
          ))}
        </section>
      )}

      {/* ------------------------------------------------------ 7. CTA */}
      {topic.items.length > 0 && (
        <div className="gr-cta">
          <span className="gr-mark">
            <Icon name="play" />
          </span>
          <span className="gr-cta-txt">
            <b>Sẵn sàng luyện chưa?</b>
            <span>
              {topic.items.length} câu trộn các dạng bài · mỗi câu sai sẽ được ghi vào sổ lỗi kèm lịch
              ôn
            </span>
          </span>
          <button className="gr-btn" onClick={onOpenErrors}>
            <Icon name="flag" /> Lỗi của tôi ở chủ điểm này ({myErrors.length})
          </button>
          <button className="gr-btn gr-btn-primary" onClick={onPractice}>
            <Icon name="play" /> Bắt đầu luyện
          </button>
        </div>
      )}
    </div>
  )
}
