// Thành phần dùng chung của hai trang luyện viết theo bước: Luyện Task 1 và Luyện Task 2.
// Cùng bố cục: danh sách bài → trang làm bài (outline bên trái, các bước bên phải), tự lưu lên cloud.
// Class CSS nằm ở styles/mindmap.css (mt-*) và styles/task2coach.css (tc-*).
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  Fragment,
} from 'react'
import Icon from './Icon'
import type { Seg, Tone } from '../data/task2Outlines'
import { errText } from '../services/cloud/cloudError'

// ------------------------------------------------------------------ Chữ
export const has = (s: string) => s.trim().length > 0
export const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
export const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)

export function appendText(cur: string, add: string): string {
  const c = cur.replace(/\s+$/, '')
  return c ? `${c} ${add}` : add
}

// "Hôm nay · 10:49" · "Hôm qua · 21:12" · "5 ngày trước"
export function relTime(iso: string): string {
  const DAY = 86_400_000
  const d = new Date(iso)
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((midnight.getTime() - d.getTime()) / DAY) + 1
  const hhmm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays <= 0) return `Hôm nay · ${hhmm}`
  if (diffDays === 1) return `Hôm qua · ${hhmm}`
  if (diffDays < 30) return `${diffDays} ngày trước`
  return d.toLocaleDateString('vi-VN')
}

// ------------------------------------------------------------------ Chỗ chọn trong câu mẫu
/** Một chỗ chọn được trong câu mẫu: outline · số câu · vị trí mảnh trong câu. */
export const slotKey = (outlineId: string, no: number, i: number) => `${outlineId}:${no}:${i}`

/** Chữ đã chọn cho các chỗ trống của một câu (theo vị trí mảnh); bỏ chữ không còn trong danh sách. */
export function lineFills(fills: Record<string, string>, outlineId: string, l: { no: number; text: Seg[] }): Record<number, string> {
  const out: Record<number, string> = {}
  l.text.forEach((sg, i) => {
    const v = fills[slotKey(outlineId, l.no, i)]
    if (v && sg.options?.includes(v)) out[i] = v
  })
  return out
}

/** Câu mẫu đã thay chữ người học chọn vào chỗ trống. */
export const withFills = (segs: Seg[], fills: Record<number, string>): Seg[] =>
  segs.map((sg, i) => (fills[i] ? { ...sg, t: fills[i], blank: false, byChoice: undefined } : sg))

// ------------------------------------------------------------------ Tự lưu lên cloud
export type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

/** Tự lưu trạng thái một bài: 800ms sau khi ngừng sửa, khi ẩn cửa sổ và khi rời trang.
 *  flush() lưu ngay bản mới nhất, trả false nếu lỗi. */
export function useAutosave<S, R>(st: S, persist: (s: S) => Promise<R>, onSaved: (row: R) => void) {
  const [save, setSave] = useState<SaveState>('saved')
  const [saveErr, setSaveErr] = useState('')
  const latest = useRef(st)
  latest.current = st
  const savedJson = useRef(JSON.stringify(st)) // bản đang nằm trên cloud
  const inFlight = useRef<Promise<boolean> | null>(null)
  // flush gọi lúc rời trang là bản của lần render đầu: luôn đọc hàm lưu mới nhất qua ref
  const io = useRef({ persist, onSaved })
  io.current = { persist, onSaved }

  /** Lưu bản mới nhất nếu khác bản trên cloud; có thay đổi trong lúc đang lưu thì lưu tiếp. */
  const flush = async (): Promise<boolean> => {
    while (inFlight.current) await inFlight.current
    const s = latest.current
    const json = JSON.stringify(s)
    if (json === savedJson.current) {
      setSave('saved')
      return true
    }
    setSave('saving')
    const run = io.current
      .persist(s)
      .then((row) => {
        savedJson.current = json
        io.current.onSaved(row)
        return true
      })
      .catch((e) => {
        setSaveErr(errText(e))
        return false
      })
      .finally(() => {
        inFlight.current = null
      })
    inFlight.current = run
    if (!(await run)) {
      setSave('error')
      return false
    }
    return flush()
  }

  useEffect(() => {
    if (JSON.stringify(st) === savedJson.current) return
    setSave((v) => (v === 'saving' ? v : 'dirty'))
    const t = window.setTimeout(() => void flush(), 800)
    return () => window.clearTimeout(t)
  }, [st])

  // Rời trang (đổi mục ở thanh bên) hoặc ẩn cửa sổ thì lưu ngay, không chờ hết hẹn giờ
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      void flush()
    }
  }, [])

  return { save, saveErr, flush }
}

// ------------------------------------------------------------------ Khung trang làm bài
/** Hàng trên cùng: quay lại danh sách · trạng thái lưu. */
export function EditorTop({
  onBack,
  leaving,
  save,
  saveErr,
  onRetry,
}: {
  onBack: () => void
  leaving: boolean
  save: SaveState
  saveErr: string
  onRetry: () => void
}) {
  return (
    <div className="tc-top">
      <button type="button" className="mt-link" onClick={onBack} disabled={leaving}>
        <Icon name="left" />
        Danh sách bài
      </button>
      {save === 'error' ? (
        <span className="tc-save is-error" role="alert">
          <Icon name="alert" />
          Chưa lưu được: {saveErr}
          <button type="button" className="mt-mini" onClick={onRetry}>
            Thử lại
          </button>
        </span>
      ) : (
        <span className={save === 'saved' ? 'tc-save is-saved' : 'tc-save'} role="status">
          {save === 'saved' ? <Icon name="cloud" /> : <span className="tc-dot" aria-hidden="true" />}
          {save === 'saved' ? 'Đã lưu' : 'Đang lưu…'}
        </span>
      )}
    </div>
  )
}

export interface StepItem {
  no: 1 | 2
  label: string
  done?: number
  total?: number
}

/** Thanh 2 bước ở đầu cột phải. Bước có tiến độ đủ thì hiện dấu tích. */
export function StepTabs({ steps, current, onGo }: { steps: StepItem[]; current: 1 | 2; onGo: (no: 1 | 2) => void }) {
  return (
    <nav className="tc-steps" aria-label="Các bước">
      {steps.map((s, k) => {
        const full = s.total !== undefined && s.done === s.total
        return (
          <button
            key={s.no}
            type="button"
            className={['tc-stepbtn', current === s.no ? 'is-on' : '', full ? 'is-done' : ''].filter(Boolean).join(' ')}
            aria-current={current === s.no ? 'step' : undefined}
            onClick={() => onGo(s.no)}
          >
            <span className="tc-stepno">{full ? <Icon name="check" /> : s.no}</span>
            <span className="tc-steptxt">
              <small>Bước {s.no}</small>
              <b>{s.label}</b>
            </span>
            {s.total !== undefined && <Progress done={s.done ?? 0} total={s.total} />}
            {k === 0 && <span className="tc-steparrow" aria-hidden="true" />}
          </button>
        )
      })}
    </nav>
  )
}

// ------------------------------------------------------------------ Câu mẫu
/** Câu mẫu trong outline, vế tô màu như ô màu trong sách. Chỗ có danh sách cách điền thì bấm để chọn. */
export function Sentence({
  segs,
  choice,
  fills = {},
  onPick,
}: {
  segs: Seg[]
  choice?: string
  fills?: Record<number, string>
  onPick?: (i: number, v: string | null) => void
}) {
  const groups: { tone?: Tone; segs: { sg: Seg; i: number }[] }[] = []
  segs.forEach((sg, i) => {
    const last = groups[groups.length - 1]
    if (!sg.label && last && last.tone === sg.tone && !last.segs[0].sg.label) last.segs.push({ sg, i })
    else groups.push({ tone: sg.tone, segs: [{ sg, i }] })
  })
  return (
    <p className="mt-sentence tc-otpl" lang="en">
      {groups.map((gr, gi) => {
        const inner = gr.segs.map(({ sg, i: k }) => {
          if (sg.label) return <span key={k} className="mt-lb">{sg.t}</span>
          const preset = choice ? sg.byChoice?.[choice] : undefined
          if (sg.options && onPick) return <SlotPick key={k} seg={sg} value={fills[k] ?? preset} picked={Boolean(fills[k])} onPick={(v) => onPick(k, v)} />
          if (preset) return <span key={k} className="mt-fill">{preset}</span>
          if (sg.blank) return <span key={k} className="mt-blank" aria-label="chỗ trống" />
          return sg.strong ? <b key={k}>{sg.t}</b> : <span key={k}>{sg.t}</span>
        })
        return gr.tone ? (
          <span key={gi} className={`mt-ve t-${gr.tone}`}>
            {inner}
          </span>
        ) : (
          <span key={gi}>{inner}</span>
        )
      })}
    </p>
  )
}

/** Một chỗ trống (hoặc chữ thay được) trong câu mẫu: rê chuột hoặc bấm để mở danh sách cách điền. */
function SlotPick({ seg, value, picked, onPick }: { seg: Seg; value?: string; picked: boolean; onPick: (v: string | null) => void }) {
  // 'hover': đang rê chuột, rời ra là đóng · 'pin': đã bấm (hoặc mở bằng bàn phím), bấm ra ngoài mới đóng
  const [open, setOpen] = useState<false | 'hover' | 'pin'>(false)
  const wrap = useRef<HTMLSpanElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const shown = value ?? seg.t
  const items = () => Array.from(wrap.current?.querySelectorAll<HTMLButtonElement>('.tc-slotopt') ?? [])
  const later = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(fn, ms)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Bấm mở thì đưa con trỏ vào cách đang chọn (rê chuột thì không giành con trỏ); bấm ra ngoài thì đóng
  useEffect(() => {
    if (!open) return
    if (open === 'pin') {
      const list = items()
      ;(list.find((b) => b.getAttribute('aria-checked') === 'true') ?? list[0])?.focus()
    }
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // Chỉ chuột mới mở bằng rê; màn cảm ứng thì bấm
  const onEnter = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse') later(() => setOpen((o) => o || 'hover'), 120)
  }
  const onLeave = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse') later(() => setOpen((o) => (o === 'hover' ? false : o)), 200)
  }

  const onKey = (e: ReactKeyboardEvent) => {
    if (!open) return
    if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false)
      if (e.key === 'Escape') btn.current?.focus()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const list = items()
    const at = list.indexOf(document.activeElement as HTMLButtonElement)
    list[(at + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]?.focus()
  }

  const choose = (v: string | null) => {
    window.clearTimeout(timer.current)
    setOpen(false)
    onPick(v)
    btn.current?.focus()
  }

  return (
    <span className="tc-slot" ref={wrap} onKeyDown={onKey} onPointerEnter={onEnter} onPointerLeave={onLeave}>
      <button
        ref={btn}
        type="button"
        className={picked ? 'tc-slotbtn is-picked' : shown ? 'tc-slotbtn' : 'tc-slotbtn is-blank'}
        aria-haspopup="menu"
        aria-expanded={Boolean(open)}
        aria-label={shown ? undefined : 'Chỗ trống, chọn cách điền'}
        onClick={() => {
          window.clearTimeout(timer.current)
          setOpen((o) => (o === 'pin' ? false : 'pin'))
        }}
      >
        {shown ?? <span className="mt-blank" />}
        <Icon name="down" />
      </button>
      {open && (
        <span className="tc-slotmenu" role="menu" aria-label={seg.menu?.title ?? (seg.blank ? 'Cách điền' : 'Chữ thay được')}>
          <small lang="vi" aria-hidden="true">
            {seg.menu?.title ?? (seg.blank ? 'Chọn cách điền' : 'Đổi chữ cùng nghĩa')}
          </small>
          {seg.options!.map((o) => (
            <button key={o} type="button" role="menuitemradio" aria-checked={o === shown} className="tc-slotopt" onClick={() => choose(o)}>
              <Icon name="check" />
              {o}
            </button>
          ))}
          {picked && (
            <button type="button" role="menuitem" className="tc-slotopt is-reset" lang="vi" onClick={() => choose(null)}>
              <Icon name="undo" />
              {seg.menu?.reset ?? (seg.blank ? 'Để trống lại' : 'Về chữ trong sách')}
            </button>
          )}
        </span>
      )}
    </span>
  )
}

// ------------------------------------------------------------------ Thành phần nhỏ
/** Ô nhập tự giãn theo nội dung. */
export function Field({
  id,
  value,
  onChange,
  placeholder,
  rows = 2,
  lang,
  className = 'tc-input',
  ariaLabel,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  lang?: string
  className?: string
  ariaLabel?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value, placeholder])
  return (
    <textarea
      ref={ref}
      id={id}
      className={className}
      rows={rows}
      lang={lang}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function Card({ no, title, hint, aside, locked, children }: { no: string; title: string; hint?: string; aside?: ReactNode; locked?: string; children: ReactNode }) {
  return (
    <section className={locked ? 'tc-card is-locked' : 'tc-card'}>
      <header className="tc-card-head">
        <span className="tc-cardno">{no}</span>
        <div>
          <h3>{title}</h3>
          {hint && <p>{hint}</p>}
        </div>
        {aside}
      </header>
      {locked ? <p className="mt-empty">{locked}</p> : <div className="tc-card-body">{children}</div>}
    </section>
  )
}

export function Progress({ done, total }: { done: number; total: number }) {
  return (
    <span className={done === total ? 'tc-prog is-full' : 'tc-prog'} aria-label={`${done} trên ${total} mục`}>
      <span className="tc-bar">
        <i style={{ width: `${(done / total) * 100}%` }} />
      </span>
      <b>
        {done}/{total}
      </b>
    </span>
  )
}

export function StepNav({ prev, next, note }: { prev?: { label: string; onClick: () => void }; next?: { label: string; onClick: () => void }; note?: string }) {
  return (
    <div className="tc-stepnav">
      {note && <p className="mt-hint">{note}</p>}
      <div className="mt-row">
        {prev && (
          <button type="button" className="mt-btn" onClick={prev.onClick}>
            <Icon name="undo" />
            {prev.label}
          </button>
        )}
        {next && (
          <button type="button" className="mt-btn is-primary" onClick={next.onClick}>
            {next.label}
            <Icon name="right" />
          </button>
        )}
      </div>
    </div>
  )
}

/** Hai chấm màu = hai tuyến thân bài của outline. */
export function ToneDots({ tones }: { tones?: [Tone, Tone] }) {
  if (!tones) return null
  return (
    <span className="tc-dots" aria-hidden="true">
      <i className={`t-${tones[0]}`} />
      <i className={`t-${tones[1]}`} />
    </span>
  )
}

/** Bảng chép từ tài liệu: ô có **đậm**, '\n' là xuống dòng (dòng sau nhỏ, nhạt hơn). mark = hàng đang áp dụng. */
export function RichTable({ head, rows, mark }: { head?: string[]; rows: string[][]; mark?: number }) {
  return (
    <div className="tc-tablewrap">
      <table className="tc-table">
        {head && (
          <thead>
            <tr>
              {head.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i === mark ? 'is-mark' : undefined}>
              {r.map((c, j) => (
                <td key={j}>
                  {c.split('\n').map((ln, k) => (
                    <Rich key={k} className={k > 0 ? 'tc-cellline is-more' : 'tc-cellline'} text={ln} />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Chữ có đánh dấu **…** của tài liệu → phần in đậm. */
export function Rich({ text, className, lang }: { text: string; className?: string; lang?: string }) {
  return (
    <span className={className} lang={lang}>
      {text.split('**').map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <Fragment key={i}>{p}</Fragment>))}
    </span>
  )
}
