import { useEffect, useState } from 'react'
import { translate, translateOnline, isSingleWord } from '../services/translation'
import { CloudApi, type Deck } from '../services/cloud/CloudApiClient'

// Kết quả hiển thị trong popup toàn màn hình
type View =
  | { kind: 'word'; word: string; phonetic?: string; pos?: string; vi: string } // từ điển offline
  | { kind: 'online'; text: string; vi: string } // dịch online
  | { kind: 'loading' }
  | { kind: 'error' }
  | null

// Cửa sổ popup dịch nhanh khi bôi chữ ở BẤT KỲ đâu trên desktop.
// Nhận đoạn chữ từ main (IPC) -> dịch offline trước, không có thì online.
export default function DesktopTranslatePopup() {
  const [text, setText] = useState('')
  const [view, setView] = useState<View>(null)
  const [saved, setSaved] = useState(false)
  const [decks, setDecks] = useState<Deck[]>([])
  const [deckId, setDeckId] = useState('')

  // Nhận đoạn chữ cần dịch từ tiến trình main
  useEffect(() => {
    const off = window.api.onDesktopTranslateText((t) => {
      setSaved(false)
      setText(t)
    })
    // Vừa mount: chủ động hỏi đoạn chữ hiện tại (phòng khi main đã gửi trước lúc sẵn sàng)
    window.api.requestDesktopText().then((t) => {
      if (t) {
        setSaved(false)
        setText(t)
      }
    })
    // Esc để đóng
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.api.closeDesktopTranslate()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      off()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // Nạp danh sách bộ từ mỗi khi có đoạn chữ mới; mặc định chọn bộ dùng gần nhất / mới nhất.
  // Cửa sổ popup dùng chung session Supabase (localStorage cùng origin) nên gọi được CloudApi.
  useEffect(() => {
    if (!text) return
    CloudApi.listDecks()
      .then((ds) => {
        setDecks(ds)
        setDeckId((cur) => {
          if (cur && ds.some((d) => d.id === cur)) return cur
          const last = localStorage.getItem('last_deck_id')
          if (last && ds.some((d) => d.id === last)) return last
          return ds[0]?.id ?? ''
        })
      })
      .catch(() => {})
  }, [text])

  // Dịch khi có đoạn chữ mới
  useEffect(() => {
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
  }, [text])

  if (!view) return null

  const canSave = view.kind === 'word' || view.kind === 'online'

  const handleSave = () => {
    if (view.kind === 'word') {
      window.api.saveDesktopTranslate(
        { word: view.word, meaning: view.vi, phonetic: view.phonetic },
        deckId || undefined,
      )
    } else if (view.kind === 'online') {
      window.api.saveDesktopTranslate({ word: view.text, meaning: view.vi }, deckId || undefined)
    }
    setSaved(true)
  }

  return (
    <div
      className="translate-popup desktop"
      // Vào thẻ -> bật nhận chuột (để bấm nút); rời thẻ -> để click xuyên qua
      onMouseEnter={() => window.api.setDesktopHover(true)}
      onMouseLeave={() => window.api.setDesktopHover(false)}
    >
      <button
        className="tp-close"
        title="Đóng (Esc)"
        onClick={() => window.api.closeDesktopTranslate()}
      >
        ✕
      </button>

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
        <>
          {decks.length > 0 && (
            <select
              className="tp-deck"
              value={deckId}
              disabled={saved}
              onChange={(e) => setDeckId(e.target.value)}
              title="Chọn bộ từ để lưu vào"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          <button className="btn small full" onClick={handleSave} disabled={saved}>
            {saved ? '✓ Đã lưu' : '➕ Lưu vào bộ từ'}
          </button>
        </>
      )}
    </div>
  )
}
