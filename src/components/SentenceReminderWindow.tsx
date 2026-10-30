import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { SentenceCard } from '../pages/SentencePage'
import { gradeSentence, type GradeResult } from '../services/sentencecheck'
import { speak } from '../services/tts'
import { loadRate } from '../services/dictation'
import { formatDuration } from '../services/sentenceReminder'
import type { SentenceReminderContent, SentenceReminderProgress } from '../vite-env'
import '../styles/sentencereminder.css'

// Gõ dừng chừng này thì lưu bài — như trang Luyện tập
const SAVE_DEBOUNCE_MS = 800
// Làm đúng 100% -> để kịp thấy kết quả (và nghe câu đọc to) rồi tự đóng
const CLOSE_AFTER_CORRECT_MS = 2500

// Cửa sổ "Nhắc chép câu": main đưa vào 1 câu chưa làm xong, hiện đúng thẻ luyện
// tập để làm ngay. Bài làm gửi về cửa sổ chính (đã đăng nhập) để lưu lên cloud.
// Chưa bấm vào thẻ thì main tự ẩn sau thời gian cài đặt; đã bắt đầu làm thì thẻ
// ở lại tới khi đóng (×, Esc) hoặc làm đúng.
export default function SentenceReminderWindow() {
  const [content, setContent] = useState<SentenceReminderContent | null>(null)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<GradeResult>()
  const [revealed, setRevealed] = useState(false)
  const [held, setHeld] = useState(false) // đã bắt đầu làm -> thôi đếm ngược
  const rootRef = useRef<HTMLDivElement>(null)

  // Giá trị mới nhất cho hẹn giờ lưu / lúc đóng thẻ (callback không phụ thuộc state)
  const latest = useRef({ content, value, result, revealed })
  latest.current = { content, value, result, revealed }
  const heldRef = useRef(false)
  const saveTimer = useRef(0)
  const closeTimer = useRef(0)

  const send = (sentenceId: string, record: SentenceReminderProgress) => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = 0
    void window.api.saveSentenceReminderProgress(sentenceId, record)
  }

  const saveLatest = () => {
    const { content: c, value: answer, result: r, revealed: rv } = latest.current
    if (!c) return
    send(c.item.id, {
      answer,
      status: r?.status ?? null,
      score: r?.score ?? null,
      revealed: rv,
    })
  }

  // Còn bài vừa gõ chưa lưu -> lưu ngay trước khi đổi câu / đóng thẻ
  const flush = () => {
    if (saveTimer.current) saveLatest()
  }

  const close = () => {
    window.clearTimeout(closeTimer.current)
    flush()
    void window.api.dismissSentenceReminder()
  }

  // Bấm vào thẻ / bắt đầu gõ -> báo main thôi tự ẩn
  const hold = () => {
    if (heldRef.current) return
    heldRef.current = true
    setHeld(true)
    void window.api.holdSentenceReminder()
  }

  useEffect(() => {
    const apply = (next: SentenceReminderContent | null) => {
      flush()
      window.clearTimeout(closeTimer.current)
      // Cửa sổ này sống suốt phiên -> đọc lại chủ đề mỗi lần hiện câu
      const theme = localStorage.getItem('theme')
      if (theme) document.documentElement.dataset.theme = theme
      const p = next?.progress
      setContent(next)
      setValue(p?.answer ?? '')
      setRevealed(!!p?.revealed)
      // Đã chấm lần trước -> chấm lại để dựng đủ gợi ý / chính tả như trang Luyện tập
      setResult(next && p?.status && p.answer ? gradeSentence(next.item, p.answer) : undefined)
      heldRef.current = false
      setHeld(false)
    }
    const off = window.api.onSentenceReminderContent(apply)
    void window.api.getSentenceReminderContent().then((c) => c && apply(c))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && latest.current.content) close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      off()
      window.removeEventListener('keydown', onKey)
      flush()
    }
    // Chỉ gắn một lần; các hàm bên trong đọc trạng thái qua ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Thẻ mới -> đặt sẵn con trỏ vào ô nhập (sau bài làm dở): main kéo cửa sổ lên
  // trước và giành bàn phím cho nó, nên vừa hiện là gõ được ngay.
  useEffect(() => {
    if (!content) return
    const ta = rootRef.current?.querySelector<HTMLTextAreaElement>('.cc-answer')
    if (!ta) return
    ta.focus({ preventScroll: true })
    ta.setSelectionRange(ta.value.length, ta.value.length)
  }, [content])

  // Báo chiều cao thật của thẻ để main co cửa sổ ôm vừa nội dung
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const report = () => {
      void window.api.resizeSentenceReminder(Math.ceil(el.getBoundingClientRect().height))
    }
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    return () => ro.disconnect()
  }, [content])

  if (!content) return null

  const onChange = (_id: string, next: string) => {
    hold()
    setValue(next)
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(saveLatest, SAVE_DEBOUNCE_MS)
  }

  const onCheck = (id: string) => {
    hold()
    const answer = latest.current.value
    if (!answer.trim()) return
    const gr = gradeSentence(content.item, answer.trim())
    setResult(gr)
    send(id, { answer, status: gr.status, score: gr.score, revealed: latest.current.revealed })
    window.clearTimeout(closeTimer.current)
    if (gr.status === 'correct') {
      // Hẹn đóng TRƯỚC khi đọc to: đóng thẻ (main đếm lại giờ cho câu tiếp theo)
      // không được phụ thuộc vào việc máy đọc chạy được hay không.
      closeTimer.current = window.setTimeout(close, CLOSE_AFTER_CORRECT_MS)
      // Đọc to câu hoàn chỉnh như trang Luyện tập (tắt được ở Cài đặt › Chép câu)
      if (localStorage.getItem('sc_autospeak') !== '0') speak(gr.bestAnswer, loadRate())
    }
  }

  const onReveal = (id: string) => {
    hold()
    setRevealed(true)
    const { value: answer, result: r } = latest.current
    send(id, { answer, status: r?.status ?? null, score: r?.score ?? null, revealed: true })
  }

  const left = content.remaining - (result?.status === 'correct' ? 1 : 0)

  return (
    <div className="sr-root" ref={rootRef} onPointerDownCapture={hold}>
      <div className="cc-page sr-shell">
        <div className="sr-top">
          <span className="sr-meta">
            <Icon name="keyboard" />
            {content.folderName && <b>{content.folderName}</b>}
            <span>
              Câu {content.index}/{content.total}
            </span>
            <span>· {left > 0 ? `còn ${left} câu chưa xong` : 'đã đúng hết'}</span>
          </span>
          <button
            className="sr-close"
            onClick={close}
            title="Đóng (Esc) — câu kế tiếp hiện ở chu kỳ sau"
            aria-label="Đóng"
          >
            <Icon name="x" />
          </button>
        </div>

        {result?.status === 'correct' ? (
          <div className="sr-notice">
            <Icon name="check" /> Hoàn thành — tự đóng, câu tiếp theo sau{' '}
            {formatDuration(content.intervalMs)}
          </div>
        ) : (
          content.notice && (
            <div className="sr-notice">
              <Icon name="check" /> {content.notice}
            </div>
          )
        )}

        <SentenceCard
          index={content.index}
          item={content.item}
          value={value}
          result={result}
          revealed={revealed}
          rate={loadRate()}
          floating
          onChange={onChange}
          onCheck={onCheck}
          onReveal={onReveal}
        />

        {/* Chưa bấm vào thẻ: thanh mỏng đếm thời gian còn lại trước khi tự ẩn */}
        {!held && (
          <span className="sr-timer" aria-hidden="true">
            <i style={{ animationDuration: `${content.durationMs}ms` }} />
          </span>
        )}
      </div>
    </div>
  )
}
