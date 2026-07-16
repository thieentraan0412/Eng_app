import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

interface PopupState {
  x: number
  top: number // đỉnh vùng chọn (toạ độ viewport)
  bottom: number // đáy vùng chọn (toạ độ viewport)
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
  pos?: string
}

interface Props {
  onSave: (entry: SaveEntry, deckId?: string) => Promise<void>
}

// Bôi/tô văn bản tiếng Anh bất kỳ (kể cả trong ô nhập) -> dịch sang tiếng Việt.
export default function TranslatePopup({ onSave }: Props) {
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [view, setView] = useState<View>(null)
  const [saved, setSaved] = useState(false)
  const [decks, setDecks] = useState<Deck[]>([])
  const [deckId, setDeckId] = useState('')
  // Nghĩa tiếng Việt SỬA ĐƯỢC trước khi lưu (khởi tạo từ kết quả dịch)
  const [vi, setVi] = useState('')
  // Nghĩa gom theo TỪ LOẠI (n, v, adj…) — bấm chip để đổi nghĩa theo loại
  const [posGroups, setPosGroups] = useState<PosSenses[]>([])
  const [posSel, setPosSel] = useState<string | null>(null)
  // Vị trí top thực tế của popup (đo được sau khi render để lật lên/xuống)
  const popupRef = useRef<HTMLDivElement>(null)
  const [posTop, setPosTop] = useState(0)

  // Kết quả dịch mới -> đổ vào ô nghĩa để người dùng chỉnh
  useEffect(() => {
    if (view?.kind === 'word' || view?.kind === 'online') setVi(view.vi)
    else setVi('')
  }, [view])

  // Từ đơn -> tra đa nghĩa online, gom theo từ loại để hiện dãy chip n/v/adj…
  useEffect(() => {
    const text = popup?.text
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
  }, [popup?.text])

  // Nạp danh sách bộ từ khi popup mở; mặc định chọn bộ dùng gần nhất / mới nhất
  useEffect(() => {
    if (!popup) return
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
  }, [popup?.text])

  // Bắt sự kiện bôi chọn
  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      // Bôi chữ BÊN TRONG popup (VD: đang sửa nghĩa) -> không mở popup mới
      if ((e.target as HTMLElement).closest('.translate-popup')) return
      let text = ''
      let x = 0
      let top = 0
      let bottom = 0

      const active = document.activeElement as HTMLTextAreaElement | HTMLInputElement | null
      if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
        const start = active.selectionStart ?? 0
        const end = active.selectionEnd ?? 0
        if (end > start) {
          text = active.value.substring(start, end).trim()
          x = e.clientX
          top = e.clientY
          bottom = e.clientY + 14
        }
      }
      if (!text) {
        const sel = window.getSelection()
        const t = sel?.toString().trim() ?? ''
        if (t && sel && sel.rangeCount > 0) {
          const rect = sel.getRangeAt(0).getBoundingClientRect()
          text = t
          x = rect.left + rect.width / 2
          top = rect.top
          bottom = rect.bottom
        }
      }

      if (!text || text.length > 200) return
      setSaved(false)
      setPopup({ x, top, bottom, text })
    }

    function handleMouseDown(e: MouseEvent) {
      // Bấm vào thanh chọn màu -> KHÔNG đóng popup dịch (cho 2 popup cùng tồn tại)
      const el = e.target as HTMLElement
      if (!el.closest('.translate-popup') && !el.closest('.hl-toolbar')) setPopup(null)
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

  // Đặt popup dưới vùng chọn; nếu tràn đáy màn hình -> lật lên trên (đo chiều cao thật)
  useLayoutEffect(() => {
    const el = popupRef.current
    if (!popup || !el) return
    const h = el.offsetHeight
    const below = popup.bottom + 8
    const above = popup.top - 8 - h
    setPosTop(below + h <= window.innerHeight - 8 ? below : Math.max(8, above))
  }, [popup, view, vi, posGroups])

  if (!popup || !view) return null

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

  const handleSave = async () => {
    // Lưu nghĩa người dùng đã chỉnh; bỏ trống -> dùng nghĩa dịch gốc
    const meaning = vi.trim() || (view.kind === 'word' || view.kind === 'online' ? view.vi : '')
    if (view.kind === 'word') {
      await onSave(
        { word: view.word, meaning, phonetic: view.phonetic, pos: activePos },
        deckId || undefined,
      )
    } else if (view.kind === 'online') {
      await onSave({ word: view.text, meaning, pos: activePos }, deckId || undefined)
    }
    setSaved(true)
  }

  const canSave = view.kind === 'word' || view.kind === 'online'

  // Dãy chip từ loại — bấm để đổi nghĩa theo n / v / adj / adv…
  const posChips = posGroups.length > 0 && (
    <div className="tp-pos-row">
      {posGroups.map((g) => (
        <button
          key={g.pos}
          type="button"
          className={g.pos === activePos ? 'tp-pos-chip active' : 'tp-pos-chip'}
          title={g.vis.join(', ')}
          onMouseDown={(e) => e.stopPropagation()}
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
      onMouseDown={(e) => e.stopPropagation()}
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
      ref={popupRef}
      className="translate-popup"
      style={{ left: popup.x, top: posTop, transform: 'translateX(-50%)' }}
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
              onMouseDown={(e) => e.stopPropagation()}
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
