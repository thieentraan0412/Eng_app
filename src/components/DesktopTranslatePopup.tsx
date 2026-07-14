import { useEffect, useState } from 'react'
import {
  translate,
  translateOnline,
  translateSenses,
  groupSensesByPos,
  isSingleWord,
  type PosSenses,
} from '../services/translation'
import { shortPos } from '../services/enrich'
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
  // Nghĩa tiếng Việt SỬA ĐƯỢC trước khi lưu (khởi tạo từ kết quả dịch)
  const [vi, setVi] = useState('')
  // Nghĩa gom theo TỪ LOẠI (n, v, adj…) — bấm chip để đổi nghĩa theo loại
  const [posGroups, setPosGroups] = useState<PosSenses[]>([])
  const [posSel, setPosSel] = useState<string | null>(null)
  // Bộ từ đích để lưu vào (dùng chung phiên đăng nhập với cửa sổ chính)
  const [decks, setDecks] = useState<Deck[]>([])
  const [deckId, setDeckId] = useState('')

  // Nạp danh sách bộ từ khi có đoạn chữ mới; mặc định chọn bộ dùng gần nhất / mới nhất
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
      .catch(() => {}) // chưa đăng nhập/mất mạng -> ẩn dropdown, lưu vẫn theo bộ mặc định
  }, [text])

  // Kết quả dịch mới -> đổ vào ô nghĩa để người dùng chỉnh
  useEffect(() => {
    if (view?.kind === 'word' || view?.kind === 'online') setVi(view.vi)
    else setVi('')
  }, [view])

  // Từ đơn -> tra đa nghĩa online, gom theo từ loại để hiện dãy chip n/v/adj…
  useEffect(() => {
    setPosSel(null)
    setPosGroups([])
    if (!text || !isSingleWord(text)) return
    let cancelled = false
    translateSenses(text.trim().toLowerCase()).then((list) => {
      if (!cancelled) setPosGroups(groupSensesByPos(list))
    })
    return () => {
      cancelled = true
    }
  }, [text])

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

  // Từ loại đang chọn: người dùng bấm chip > loại từ điển offline > loại đầu danh sách
  const defaultPos = view.kind === 'word' && view.pos ? shortPos(view.pos) : undefined
  const activePos =
    posSel ??
    (defaultPos && posGroups.some((g) => g.pos === defaultPos) ? defaultPos : posGroups[0]?.pos)

  const pickPos = (g: PosSenses) => {
    setPosSel(g.pos)
    setVi(g.vis.slice(0, 3).join(', ')) // nghĩa đổi theo từ loại (tối đa 3 nghĩa)
    setSaved(false)
  }

  const handleSave = () => {
    // Lưu nghĩa người dùng đã chỉnh; bỏ trống -> dùng nghĩa dịch gốc
    const meaning = vi.trim() || (view.kind === 'word' || view.kind === 'online' ? view.vi : '')
    if (view.kind === 'word') {
      window.api.saveDesktopTranslate({
        word: view.word,
        meaning,
        phonetic: view.phonetic,
        pos: activePos,
        deckId: deckId || undefined,
      })
    } else if (view.kind === 'online') {
      window.api.saveDesktopTranslate({
        word: view.text,
        meaning,
        pos: activePos,
        deckId: deckId || undefined,
      })
    }
    if (deckId) localStorage.setItem('last_deck_id', deckId) // nhớ bộ gần nhất
    setSaved(true)
  }

  // Dãy chip từ loại — bấm để đổi nghĩa theo n / v / adj / adv…
  const posChips = posGroups.length > 0 && (
    <div className="tp-pos-row">
      {posGroups.map((g) => (
        <button
          key={g.pos}
          type="button"
          className={g.pos === activePos ? 'tp-pos-chip active' : 'tp-pos-chip'}
          title={g.vis.join(', ')}
          onClick={() => pickPos(g)}
        >
          {g.pos}
        </button>
      ))}
    </div>
  )

  // Ô nghĩa sửa được — textarea tự giãn theo nội dung (nghĩa dài không bị cắt);
  // Enter = lưu luôn, Shift+Enter = xuống dòng
  const viInput = (
    <textarea
      className="tp-edit"
      rows={1}
      value={vi}
      title="Sửa nghĩa trước khi lưu"
      onChange={(e) => {
        setVi(e.target.value)
        setSaved(false) // sửa lại sau khi lưu -> cho lưu tiếp
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && canSave && !saved) {
          e.preventDefault()
          handleSave()
        }
      }}
    />
  )

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
          {posChips}
          <div className="tp-vi edit">
            {/* Chưa tải được nhóm từ loại -> vẫn hiện nhãn loại từ điển offline */}
            {!posGroups.length && view.pos && <span className="tp-pos">{view.pos}</span>}
            {viInput}
          </div>
        </>
      )}

      {view.kind === 'online' && (
        <>
          <div className="tp-word">{view.text}</div>
          {posChips}
          <div className="tp-vi edit">{viInput}</div>
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
