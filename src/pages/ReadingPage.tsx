import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { CloudApi, type Reading, type ReadingHighlight } from '../services/cloud/CloudApiClient'

// Bảng màu bôi (highlight) — class CSS tương ứng: .hl-yellow, .hl-green…
const HL_COLORS = ['yellow', 'green', 'blue', 'pink'] as const

// Bỏ phần giao nhau với [start, end) khỏi danh sách vùng bôi (cắt đôi nếu cần)
function subtractRange(ranges: ReadingHighlight[], start: number, end: number): ReadingHighlight[] {
  const out: ReadingHighlight[] = []
  for (const r of ranges) {
    if (r.end <= start || r.start >= end) {
      out.push(r)
      continue
    }
    if (r.start < start) out.push({ ...r, end: start })
    if (r.end > end) out.push({ ...r, start: end })
  }
  return out
}

// Thêm vùng bôi mới (đè lên vùng cũ nếu chồng lấn), gộp các vùng liền kề cùng màu
function addRange(ranges: ReadingHighlight[], h: ReadingHighlight): ReadingHighlight[] {
  const out = [...subtractRange(ranges, h.start, h.end), h].sort((a, b) => a.start - b.start)
  const merged: ReadingHighlight[] = []
  for (const r of out) {
    const last = merged[merged.length - 1]
    if (last && last.color === r.color && r.start <= last.end) last.end = Math.max(last.end, r.end)
    else merged.push({ ...r })
  }
  return merged
}

interface ViewerProps {
  reading: Reading
  onBack: () => void
  onHighlightsChange: (highlights: ReadingHighlight[]) => void
}

// Trình đọc 1 bài: bôi chọn văn bản -> thanh chọn màu hiện phía trên vùng chọn
function ReadingViewer({ reading, onBack, onHighlightsChange }: ViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const text = reading.content ?? ''
  const storageKey = `reading_hl_${reading.id}`

  const [highlights, setHighlights] = useState<ReadingHighlight[]>(() => {
    if (reading.highlights?.length) return reading.highlights
    // Dự phòng: bản lưu cục bộ (khi cloud chưa có cột highlights)
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as ReadingHighlight[]
    } catch {
      return []
    }
  })
  // Thanh chọn màu nổi: vị trí (viewport) + vùng ký tự đang chọn
  const [bar, setBar] = useState<{ x: number; y: number; start: number; end: number } | null>(null)

  // Đóng thanh màu khi bấm ra ngoài
  useEffect(() => {
    if (!bar) return
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.hl-toolbar')) setBar(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [bar])

  // Bôi chọn xong -> tính offset ký tự trong content và hiện thanh màu
  const handleMouseUp = () => {
    const el = contentRef.current
    const sel = window.getSelection()
    if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return
    const pre = range.cloneRange()
    pre.selectNodeContents(el)
    pre.setEnd(range.startContainer, range.startOffset)
    const start = pre.toString().length
    const end = start + range.toString().length
    if (end <= start) return
    const rect = range.getBoundingClientRect()
    setBar({ x: rect.left + rect.width / 2, y: rect.top - 8, start, end })
  }

  const save = (next: ReadingHighlight[]) => {
    setHighlights(next)
    onHighlightsChange(next)
    CloudApi.updateReadingHighlights(reading.id, next)
      .then(() => localStorage.removeItem(storageKey))
      .catch(() => localStorage.setItem(storageKey, JSON.stringify(next))) // cloud lỗi -> giữ bản cục bộ
  }

  const applyColor = (color: string) => {
    if (!bar) return
    save(addRange(highlights, { start: bar.start, end: bar.end, color }))
    setBar(null)
    window.getSelection()?.removeAllRanges()
  }

  const erase = () => {
    if (!bar) return
    save(subtractRange(highlights, bar.start, bar.end))
    setBar(null)
    window.getSelection()?.removeAllRanges()
  }

  // Dựng nội dung: chèn <mark> cho từng vùng bôi
  const parts: ReactNode[] = []
  let pos = 0
  for (const h of highlights) {
    if (h.start > pos) parts.push(text.slice(pos, h.start))
    parts.push(
      <mark key={`${h.start}-${h.end}`} className={`hl hl-${h.color}`}>
        {text.slice(h.start, h.end)}
      </mark>,
    )
    pos = h.end
  }
  if (pos < text.length) parts.push(text.slice(pos))

  return (
    <div className="page page-wide">
      <button className="btn tiny" onClick={onBack}>
        ← Danh sách bài đọc
      </button>
      <h1 className="page-title">{reading.title}</h1>
      <div className="reading-text" ref={contentRef} onMouseUp={handleMouseUp}>
        {parts}
      </div>

      {bar && (
        <div className="hl-toolbar" style={{ left: bar.x, top: bar.y }}>
          {HL_COLORS.map((c) => (
            <button
              key={c}
              className={`hl-dot hl-${c}`}
              title="Bôi màu"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyColor(c)}
            />
          ))}
          <button
            className="hl-eraser"
            title="Xóa bôi màu"
            onMouseDown={(e) => e.preventDefault()}
            onClick={erase}
          >
            ⌫
          </button>
        </div>
      )}
    </div>
  )
}

// Trang Đọc — danh sách bài đọc (lưu cloud); mở bài để đọc + bôi màu tra từ.
export default function ReadingPage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [selected, setSelected] = useState<Reading | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })

  const load = async () => {
    try {
      setReadings(await CloudApi.listReadings())
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    try {
      const r = await CloudApi.createReading(form.title.trim(), form.content.trim())
      setReadings((x) => [r, ...x])
      setForm({ title: '', content: '' })
      setAdding(false)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const remove = async (r: Reading) => {
    if (!confirm(`Xóa bài "${r.title}"?`)) return
    await CloudApi.deleteReading(r.id)
    setReadings((x) => x.filter((y) => y.id !== r.id))
  }

  if (selected) {
    return (
      <ReadingViewer
        reading={selected}
        onBack={() => setSelected(null)}
        onHighlightsChange={(hs) => {
          setSelected((s) => (s ? { ...s, highlights: hs } : s))
          setReadings((x) => x.map((r) => (r.id === selected.id ? { ...r, highlights: hs } : r)))
        }}
      />
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Đọc & tra từ</h1>
      {error && <div className="alert error">{error}</div>}

      <div className="toolbar">
        <button className="btn primary" onClick={() => setAdding((a) => !a)}>
          {adding ? '× Đóng' : '+ Thêm bài đọc'}
        </button>
      </div>

      {adding && (
        <form className="card-form" onSubmit={create} style={{ flexDirection: 'column' }}>
          <input
            placeholder="Tiêu đề bài đọc"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="reading-editor"
            placeholder="Dán/nhập nội dung tiếng Anh…"
            rows={8}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <button className="btn primary" type="submit">
            Lưu bài đọc
          </button>
        </form>
      )}

      {readings.length === 0 ? (
        <p className="muted">Chưa có bài đọc nào. Thêm bài đầu tiên để luyện đọc & tra từ.</p>
      ) : (
        <div className="deck-grid">
          {readings.map((r) => (
            <div key={r.id} className="deck-card" onClick={() => setSelected(r)}>
              <div className="deck-name">{r.title}</div>
              <span className="muted">{(r.content ?? '').slice(0, 60)}…</span>
              <button
                className="btn tiny danger"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(r)
                }}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
