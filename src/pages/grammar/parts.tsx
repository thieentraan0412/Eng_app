import type { ReactNode } from 'react'
import Icon, { type IconName } from '../../components/Icon'
import type { GrammarTopic, TopicProgress } from '../../services/cloud/grammarCloud'
import { daysUntil, isDue } from '../../services/cloud/grammarCloud'

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
  onOpen,
  onEdit,
  onDelete,
}: {
  topic: GrammarTopic
  progress: TopicProgress | undefined
  onOpen: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const mastery = progress?.mastery ?? 0
  return (
    <div
      className="gr-topic"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      {(onEdit || onDelete) && (
        <span className="gr-topic-tools">
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
        <span>{progress ? `Nắm vững ${mastery}%` : 'Chưa bắt đầu'}</span>
      </span>
    </div>
  )
}
