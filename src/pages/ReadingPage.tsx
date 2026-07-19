import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { CloudApi, type Reading, type ReadingHighlight } from '../services/cloud/CloudApiClient'
import { bestEnglishVoice, speak, ttsSupported } from '../services/tts'

// Bảng màu bôi (highlight) — class CSS tương ứng: .hl-yellow, .hl-green…
const HL_COLORS = ['yellow', 'green', 'blue', 'pink'] as const

// Cấp độ CEFR cho bài đọc (cột `level` trong DB)
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

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

// Thêm vùng bôi mới (đè lên vùng cũ nếu chồng lấn), gộp các vùng liền kề
// cùng màu — nhưng KHÔNG gộp khi ghi chú khác nhau (kẻo mất/ghép nhầm ghi chú)
function addRange(ranges: ReadingHighlight[], h: ReadingHighlight): ReadingHighlight[] {
  const out = [...subtractRange(ranges, h.start, h.end), h].sort((a, b) => a.start - b.start)
  const merged: ReadingHighlight[] = []
  for (const r of out) {
    const last = merged[merged.length - 1]
    if (
      last &&
      last.color === r.color &&
      r.start <= last.end &&
      (last.note ?? '') === (r.note ?? '')
    ) {
      last.end = Math.max(last.end, r.end)
    } else merged.push({ ...r })
  }
  return merged
}

// Tách bài thành từng đoạn ngắn (~180 ký tự, cắt theo câu) để đọc TTS —
// đọc 1 utterance quá dài Chrome sẽ tự ngắt giữa chừng
function splitChunks(text: string): string[] {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*\s*/g) ?? [text]
  const chunks: string[] = []
  let cur = ''
  for (const s of sentences) {
    if ((cur + s).length > 180 && cur.trim()) {
      chunks.push(cur)
      cur = s
    } else cur += s
  }
  if (cur.trim()) chunks.push(cur)
  return chunks
}

interface ViewerProps {
  reading: Reading
  onBack: () => void
  onHighlightsChange: (highlights: ReadingHighlight[]) => void
}

// Trình đọc 1 bài: bôi chọn văn bản -> thanh chọn màu hiện phía trên vùng chọn;
// bấm vào vùng đã bôi -> thêm/sửa ghi chú; nghe đọc cả bài bằng TTS.
function ReadingViewer({ reading, onBack, onHighlightsChange }: ViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const text = reading.content ?? ''
  const storageKey = `reading_hl_${reading.id}`
  const lookupKey = `reading_lookups_${reading.id}`

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
  // Popover ghi chú của 1 vùng bôi đang mở
  const [notePop, setNotePop] = useState<{
    x: number
    y: number
    start: number
    end: number
    draft: string
  } | null>(null)
  // Các từ đã tra trong bài này (bôi chọn từ/cụm ngắn -> popup dịch hiện ra)
  const [lookups, setLookups] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(lookupKey) ?? '[]') as string[]
    } catch {
      return []
    }
  })
  // Trạng thái đọc bài bằng TTS
  const [tts, setTts] = useState<'idle' | 'playing' | 'paused'>('idle')

  // Đóng thanh màu / popover ghi chú khi bấm ra ngoài
  useEffect(() => {
    if (!bar && !notePop) return
    const close = (e: MouseEvent) => {
      // Bấm vào popup dịch/lưu từ -> KHÔNG đóng (cho các popup cùng tồn tại)
      const t = e.target as HTMLElement
      if (t.closest('.hl-toolbar') || t.closest('.translate-popup') || t.closest('.hl-note-pop'))
        return
      setBar(null)
      setNotePop(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [bar, notePop])

  // Rời trang -> dừng đọc
  useEffect(() => () => stopRead(), []) // eslint-disable-line react-hooks/exhaustive-deps

  // Bôi chọn xong -> tính offset ký tự trong content và hiện thanh màu.
  // Chọn 1 từ/cụm ngắn cũng được tính là "tra từ" (popup dịch sẽ hiện).
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

    // Thống kê từ đã tra: chỉ tính cụm ngắn dạng chữ (≤3 từ, ≤40 ký tự)
    const selText = range.toString().trim()
    if (
      /^[A-Za-z][A-Za-z' -]*$/.test(selText) &&
      selText.length <= 40 &&
      selText.split(/\s+/).length <= 3
    ) {
      const w = selText.toLowerCase()
      setLookups((ls) => {
        if (ls.includes(w)) return ls
        const next = [...ls, w]
        try {
          localStorage.setItem(lookupKey, JSON.stringify(next))
        } catch {
          /* đầy -> bỏ qua */
        }
        return next
      })
    }
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

  // Lưu / xóa ghi chú của vùng bôi đang mở popover
  const saveNote = () => {
    if (!notePop) return
    save(
      highlights.map((h) =>
        h.start === notePop.start && h.end === notePop.end
          ? { ...h, note: notePop.draft.trim() || undefined }
          : h,
      ),
    )
    setNotePop(null)
  }

  const clearLookups = () => {
    setLookups([])
    localStorage.removeItem(lookupKey)
  }

  // ----- TTS đọc cả bài: xếp hàng từng đoạn ngắn, tạm dừng / tiếp tục được -----
  const startRead = () => {
    if (!ttsSupported) return
    const synth = window.speechSynthesis
    synth.cancel()
    const chunks = splitChunks(text)
    const voice = bestEnglishVoice()
    chunks.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c)
      u.lang = 'en-US'
      u.rate = 0.95
      if (voice) u.voice = voice
      if (i === chunks.length - 1) u.onend = () => setTts('idle')
      synth.speak(u)
    })
    setTts('playing')
  }
  const pauseRead = () => {
    window.speechSynthesis.pause()
    setTts('paused')
  }
  const resumeRead = () => {
    window.speechSynthesis.resume()
    setTts('playing')
  }
  const stopRead = () => {
    if (ttsSupported) window.speechSynthesis.cancel()
    setTts('idle')
  }

  // Dựng nội dung: chèn <mark> cho từng vùng bôi; bấm vào mark để ghi chú
  const parts: ReactNode[] = []
  let pos = 0
  for (const h of highlights) {
    if (h.start > pos) parts.push(text.slice(pos, h.start))
    parts.push(
      <mark
        key={`${h.start}-${h.end}`}
        className={`hl hl-${h.color}${h.note ? ' has-note' : ''}`}
        title={h.note || 'Bấm để thêm ghi chú'}
        onClick={(e) => {
          // Đang bôi chọn chữ -> không mở ghi chú (để dịch/bôi màu như thường)
          const sel = window.getSelection()
          if (sel && !sel.isCollapsed) return
          e.stopPropagation()
          const rect = (e.target as HTMLElement).getBoundingClientRect()
          setBar(null)
          setNotePop({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
            start: h.start,
            end: h.end,
            draft: h.note ?? '',
          })
        }}
      >
        {text.slice(h.start, h.end)}
        {h.note && <span className="hl-note-dot">📝</span>}
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
      <h1 className="page-title">
        {reading.title} {reading.level && <span className="level-badge">{reading.level}</span>}
      </h1>

      {/* Thanh công cụ: nghe đọc bài + gợi ý thao tác */}
      <div className="reading-tools">
        {ttsSupported &&
          (tts === 'idle' ? (
            <button className="btn small" onClick={startRead}>
              🔊 Nghe đọc bài
            </button>
          ) : (
            <>
              {tts === 'playing' ? (
                <button className="btn small" onClick={pauseRead}>
                  ⏸ Tạm dừng
                </button>
              ) : (
                <button className="btn small" onClick={resumeRead}>
                  ▶️ Tiếp tục
                </button>
              )}
              <button className="btn small" onClick={stopRead}>
                ⏹ Dừng
              </button>
            </>
          ))}
        <span className="muted reading-hint">
          Bôi chữ để dịch/bôi màu · bấm vùng đã bôi để thêm ghi chú
        </span>
      </div>

      {/* Thống kê từ đã tra trong bài này */}
      {lookups.length > 0 && (
        <details className="lookup-stats">
          <summary>
            🔍 Đã tra <strong>{lookups.length}</strong> từ trong bài
          </summary>
          <div className="lookup-chips">
            {lookups.map((w) => (
              <span className="wc-chip" key={w}>
                {w}
              </span>
            ))}
          </div>
          <button className="btn tiny" onClick={clearLookups}>
            Xóa lịch sử tra
          </button>
        </details>
      )}

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
          {ttsSupported && (
            <button
              className="hl-eraser"
              title="Đọc đoạn đang chọn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => speak(text.slice(bar.start, bar.end))}
            >
              🔊
            </button>
          )}
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

      {/* Popover ghi chú cho vùng bôi màu */}
      {notePop && (
        <div className="hl-note-pop" style={{ left: notePop.x, top: notePop.y }}>
          <div className="hl-note-title">📝 Ghi chú cho “{text.slice(notePop.start, notePop.end).slice(0, 40)}”</div>
          <textarea
            autoFocus
            rows={3}
            placeholder="Nhập ghi chú của bạn…"
            value={notePop.draft}
            onChange={(e) => setNotePop({ ...notePop, draft: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNote()
              if (e.key === 'Escape') setNotePop(null)
            }}
          />
          <div className="hl-note-actions">
            <button className="btn tiny primary" onClick={saveNote}>
              💾 Lưu
            </button>
            {notePop.draft.trim() && (
              <button
                className="btn tiny danger"
                onClick={() => {
                  setNotePop({ ...notePop, draft: '' })
                  save(
                    highlights.map((h) =>
                      h.start === notePop.start && h.end === notePop.end
                        ? { ...h, note: undefined }
                        : h,
                    ),
                  )
                  setNotePop(null)
                }}
              >
                Xóa ghi chú
              </button>
            )}
            <button className="btn tiny" onClick={() => setNotePop(null)}>
              Đóng
            </button>
          </div>
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
  const [form, setForm] = useState({ title: '', content: '', level: '' })
  // Lọc danh sách theo cấp độ (chip A1–C2)
  const [levelFilter, setLevelFilter] = useState('')

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
      const r = await CloudApi.createReading(form.title.trim(), form.content.trim(), form.level)
      setReadings((x) => [r, ...x])
      setForm({ title: '', content: '', level: '' })
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

  const shown = levelFilter ? readings.filter((r) => r.level === levelFilter) : readings
  // Chỉ hiện hàng lọc khi có bài gắn cấp độ
  const hasLevels = readings.some((r) => r.level)

  return (
    <div className="page">
      <h1 className="page-title">Đọc & tra từ</h1>
      {error && <div className="alert error">{error}</div>}

      <div className="toolbar">
        <button className="btn primary" onClick={() => setAdding((a) => !a)}>
          {adding ? '× Đóng' : '+ Thêm bài đọc'}
        </button>
        {hasLevels && (
          <div className="level-filter">
            <button
              className={levelFilter === '' ? 'tab active' : 'tab'}
              onClick={() => setLevelFilter('')}
            >
              Tất cả
            </button>
            {LEVELS.filter((l) => readings.some((r) => r.level === l)).map((l) => (
              <button
                key={l}
                className={levelFilter === l ? 'tab active' : 'tab'}
                onClick={() => setLevelFilter(l)}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {adding && (
        <form className="card-form" onSubmit={create} style={{ flexDirection: 'column' }}>
          <div className="reading-form-row">
            <input
              placeholder="Tiêu đề bài đọc"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <select
              className="level-select"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              title="Cấp độ CEFR của bài (tùy chọn)"
            >
              <option value="">Cấp độ…</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
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
          {shown.map((r) => (
            <div key={r.id} className="deck-card" onClick={() => setSelected(r)}>
              <div className="deck-name">
                {r.title} {r.level && <span className="level-badge">{r.level}</span>}
              </div>
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
