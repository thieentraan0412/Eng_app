import { useEffect, useState } from 'react'
import { translate, translateOnline, isSingleWord } from '../services/translation'

interface PopupState {
  x: number
  y: number
  text: string
}

// Kết quả hiển thị trong popup
type View =
  | { kind: 'word'; word: string; phonetic?: string; pos?: string; vi: string } // từ điển offline
  | { kind: 'online'; text: string; vi: string } // dịch online
  | { kind: 'loading' }
  | { kind: 'error' }
  | null

interface SaveEntry {
  word: string
  meaning: string
  phonetic?: string
}

interface Props {
  onSave: (entry: SaveEntry) => Promise<void>
}

// Bôi/tô văn bản tiếng Anh bất kỳ (kể cả trong ô nhập) -> dịch sang tiếng Việt.
export default function TranslatePopup({ onSave }: Props) {
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [view, setView] = useState<View>(null)
  const [saved, setSaved] = useState(false)

  // Bắt sự kiện bôi chọn
  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      let text = ''
      let x = 0
      let y = 0

      const active = document.activeElement as HTMLTextAreaElement | HTMLInputElement | null
      if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
        const start = active.selectionStart ?? 0
        const end = active.selectionEnd ?? 0
        if (end > start) {
          text = active.value.substring(start, end).trim()
          x = e.clientX
          y = e.clientY + 14
        }
      }
      if (!text) {
        const sel = window.getSelection()
        const t = sel?.toString().trim() ?? ''
        if (t && sel && sel.rangeCount > 0) {
          const rect = sel.getRangeAt(0).getBoundingClientRect()
          text = t
          x = rect.left + rect.width / 2
          y = rect.bottom + 8
        }
      }

      if (!text || text.length > 200) return
      setSaved(false)
      setPopup({ x, y, text })
    }

    function handleMouseDown(e: MouseEvent) {
      const el = e.target as HTMLElement
      if (!el.closest('.translate-popup')) setPopup(null)
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Dịch khi có vùng chọn mới: offline trước, không có thì online
  useEffect(() => {
    const text = popup?.text
    if (!text) {
      setView(null)
      return
    }
    let cancelled = false

    if (isSingleWord(text)) {
      const r = translate(text)
      if (r.vi) {
        setView({ kind: 'word', word: r.word, phonetic: r.phonetic, pos: r.pos, vi: r.vi })
        return
      }
    }

    setView({ kind: 'loading' })
    translateOnline(text).then((vi) => {
      if (cancelled) return
      setView(vi ? { kind: 'online', text, vi } : { kind: 'error' })
    })
    return () => {
      cancelled = true
    }
  }, [popup?.text])

  if (!popup || !view) return null

  const handleSave = async () => {
    if (view.kind === 'word') {
      await onSave({ word: view.word, meaning: view.vi, phonetic: view.phonetic })
    } else if (view.kind === 'online') {
      await onSave({ word: view.text, meaning: view.vi })
    }
    setSaved(true)
  }

  const canSave = view.kind === 'word' || view.kind === 'online'

  return (
    <div
      className="translate-popup"
      style={{ left: popup.x, top: popup.y, transform: 'translateX(-50%)' }}
    >
      {view.kind === 'loading' && <div className="tp-vi tp-empty">Đang dịch…</div>}

      {view.kind === 'error' && (
        <div className="tp-vi tp-empty">Không dịch được (cần kết nối mạng)</div>
      )}

      {view.kind === 'word' && (
        <>
          <div className="tp-word">
            {view.word}
            {view.phonetic && <span className="tp-phonetic">{view.phonetic}</span>}
          </div>
          <div className="tp-vi">
            {view.pos && <span className="tp-pos">{view.pos}</span>}
            {view.vi}
          </div>
        </>
      )}

      {view.kind === 'online' && (
        <>
          <div className="tp-word">{view.text}</div>
          <div className="tp-vi">
            {view.vi}
            <span className="tp-source">🌐 dịch online</span>
          </div>
        </>
      )}

      {canSave && (
        <button className="btn small full" onClick={handleSave} disabled={saved}>
          {saved ? '✓ Đã lưu' : '➕ Lưu vào bộ từ'}
        </button>
      )}
    </div>
  )
}
