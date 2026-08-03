import type { ReactNode } from 'react'
import Icon, { type IconName } from '../../components/Icon'
import type { GrammarTopic, TopicProgress } from '../../services/cloud/grammarCloud'
import { daysUntil, isDue, isLearned } from '../../services/cloud/grammarCloud'

// Bộ icon người dùng chọn được cho chủ điểm — quy về IconName đã có sẵn
export function topicIcon(name: string): IconName {
  const known: IconName[] = [
    'clock',
    'layers',
    'type',
    'shuffle',
    'stack',
    'repeat',
    'trend',
    'speak',
    'pen',
    'bulb',
    'target',
    'sparkle',
    'check',
    'undo',
    'grammar',
  ]
  return (known as string[]).includes(name) ? (name as IconName) : 'clock'
}

// Câu ví dụ dùng { } để đánh dấu phần cần nhấn — quy ước chung của cả module
export function Hl({ text, as = 'b' }: { text: string; as?: 'b' | 'u' | 'em' }): ReactNode {
  const parts = String(text).split(/(\{[^{}]*\})/g)
  return (
    <>
      {parts.map((p, i) => {
        if (!p.startsWith('{') || !p.endsWith('}')) return <span key={i}>{p}</span>
        const inner = p.slice(1, -1)
        if (as === 'u') return <u key={i}>{inner}</u>
        if (as === 'em') return <em key={i}>{inner}</em>
        return <b key={i}>{inner}</b>
      })}
    </>
  )
}

// **…** trong cột "Cấu trúc" của bảng công thức
export function Struct({ text }: { text: string }): ReactNode {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return (
    <span className="gr-form-str">
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <b key={i}>{p.slice(2, -2)}</b>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  )
}

// Cặp câu sai → câu đúng (dùng ở bẫy người Việt và sổ lỗi)
export function SentencePair({ wrong, right }: { wrong: string; right: string }) {
  return (
    <>
      <p className="gr-sent gr-sent-bad">
        <span className="gr-sent-tag">✕</span>
        <span>
          <Hl text={wrong} as="em" />
        </span>
      </p>
      <p className="gr-sent gr-sent-good">
        <span className="gr-sent-tag">✓</span>
        <span>
          <Hl text={right} as="em" />
        </span>
      </p>
    </>
  )
}

// Nhãn trạng thái ôn của một chủ điểm
export function TopicStatus({ p }: { p: TopicProgress | undefined }) {
  if (!p) return <span className="gr-badge">Chưa bắt đầu</span>
  // Dòng tiến độ có thể được tạo ra chỉ vì bấm "Đã học" — chưa trả lời câu nào
  // thì đừng nói về lịch ôn hay điểm số.
  if (p.attempts === 0 && !isLearned(p)) return <span className="gr-badge">Chưa bắt đầu</span>
  // "Đã học" đè lên mọi trạng thái khác: đã nắm rồi thì không nhắc đến hạn/yếu nữa
  if (isLearned(p)) {
    return (
      <span className="gr-badge gr-badge-ok gr-badge-dot">
        <Icon name="check" /> Đã học
      </span>
    )
  }
  if (isDue(p)) {
    return (
      <span className="gr-badge gr-badge-warn gr-badge-dot">
        <Icon name="bell" /> Đến hạn
      </span>
    )
  }
  if (p.mastery < 50) {
    return (
      <span className="gr-badge gr-badge-err gr-badge-dot">
        <Icon name="alert" /> Yếu
      </span>
    )
  }
  const d = daysUntil(p.due)
  return (
    <span className="gr-badge">
      <Icon name="calendar" /> {d <= 0 ? 'Hôm nay' : `${d} ngày`}
    </span>
  )
}

// Thẻ chủ điểm trong lưới thư viện
export function TopicCard({
  topic,
  progress,
  selecting = false,
  selected = false,
  onOpen,
  onEdit,
  onDelete,
  onToggleLearned,
}: {
  topic: GrammarTopic
  progress: TopicProgress | undefined
  /** đang ở chế độ chọn nhiều: bấm thẻ = tick chọn, không mở bài học */
  selecting?: boolean
  selected?: boolean
  onOpen: () => void
  onEdit?: () => void
  onDelete?: () => void
  onToggleLearned?: () => void
}) {
  const mastery = progress?.mastery ?? 0
  const learned = isLearned(progress)
  // Đạt ngưỡng nắm vững thì thẻ đã xanh sẵn — nút chỉ bỏ được dấu đánh TAY
  const marked = progress?.learned === true
  const cls = `gr-topic${selecting ? ' is-selecting' : ''}${selected ? ' is-picked' : ''}${
    learned ? ' is-learned' : ''
  }`
  return (
    <div
      className={cls}
      role={selecting ? 'checkbox' : 'button'}
      aria-checked={selecting ? selected : undefined}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      {selecting && (
        <span className={selected ? 'gr-tick is-on' : 'gr-tick'} aria-hidden="true">
          {selected && <Icon name="check" />}
        </span>
      )}
      {!selecting && (onEdit || onDelete || onToggleLearned) && (
        <span className="gr-topic-tools">
          {onToggleLearned && (
            <button
              className={marked ? 'gr-ibtn gr-ibtn-learn is-learned' : 'gr-ibtn gr-ibtn-learn'}
              title={marked ? 'Bỏ đánh dấu đã học' : 'Đánh dấu đã học'}
              aria-pressed={marked}
              onClick={(e) => {
                e.stopPropagation()
                onToggleLearned()
              }}
            >
              <Icon name="check" />
            </button>
          )}
          {onEdit && (
            <button
              className="gr-ibtn"
              title="Sửa chủ điểm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Icon name="pencil" />
            </button>
          )}
          {onDelete && (
            <button
              className="gr-ibtn danger"
              // Chủ điểm dựng sẵn không xóa được khỏi code — chỉ ẩn khỏi thư viện
              title={topic.builtin ? 'Ẩn chủ điểm khỏi thư viện' : 'Xóa chủ điểm'}
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Icon name="trash" />
            </button>
          )}
        </span>
      )}
      <span className="gr-topic-top">
        <span className="gr-mark">
          <Icon name={topicIcon(topic.icon)} />
        </span>
        <span className="gr-topic-txt">
          <span className="gr-topic-name">{topic.name}</span>
          <span className="gr-topic-tags">
            <span className="gr-lv">{topic.level}</span>
            {topic.tags.length > 0 && (
              <span className="gr-badge gr-badge-err gr-badge-dot">Bẫy người Việt</span>
            )}
            {topic.sourceKey ? (
              <span className="gr-badge">Đã sửa</span>
            ) : (
              !topic.builtin && <span className="gr-badge">Tự soạn</span>
            )}
          </span>
        </span>
      </span>
      <span className="gr-bar">
        <i style={{ width: `${mastery}%` }} />
      </span>
      <span className="gr-topic-foot">
        <span>
          {topic.formulas.length} quy tắc · {topic.items.length} câu
        </span>
        {learned ? (
          <span className="gr-topic-done">
            <Icon name="check" /> Đã học{progress?.attempts ? ` · ${mastery}%` : ''}
          </span>
        ) : (
          <span>{progress?.attempts ? `Nắm vững ${mastery}%` : 'Chưa bắt đầu'}</span>
        )}
      </span>
    </div>
  )
}
