import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { CloudApi, type Deck, type Card } from '../services/cloud/CloudApiClient'
import { autocomplete, fuzzyCorrect, nextWords } from '../services/suggestion'
import { isMisspelled, suggestFix } from '../services/spellcheck'
import {
  translate,
  translateOnline,
  translateSenses,
  type OnlineSense,
} from '../services/translation'
import {
  cleanPhrase,
  fetchEnrichment,
  fetchPosByPrefix,
  searchSentences,
  shortPos,
  type Enrichment,
} from '../services/enrich'

// Tách nghĩa tiếng Việt (dạng "a, b; c") thành từng lựa chọn riêng
function splitVi(vi: string): string[] {
  return vi
    .split(/[;,/]|\bhoặc\b/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// Gợi ý nghĩa offline từ từ điển tĩnh
function offlineMeanings(word: string): string[] {
  const r = translate(word)
  return r.vi ? splitVi(r.vi) : []
}

// Gợi ý collocation: dựng từ n-gram (từ hay đi ngay sau từ đang tra)
function collocationSuggestions(word: string): string[] {
  const w = word.trim().toLowerCase()
  if (!/^[a-z]+$/.test(w)) return []
  return nextWords(w, 8).map((n) => `${w} ${n}`)
}

export default function VocabularyPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [selected, setSelected] = useState<Deck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newDeckName, setNewDeckName] = useState('')
  // Đổi tên (tiêu đề) bộ từ ngay trên thẻ
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const startRename = (deck: Deck) => {
    setEditingId(deck.id)
    setEditName(deck.name)
  }
  const saveRename = async () => {
    const id = editingId
    const name = editName.trim()
    setEditingId(null)
    if (!id || !name) return
    const cur = decks.find((d) => d.id === id)
    if (cur && cur.name === name) return // không đổi -> bỏ qua
    try {
      const updated = await CloudApi.renameDeck(id, name)
      setDecks((d) => d.map((x) => (x.id === updated.id ? updated : x)))
      if (selected?.id === updated.id) setSelected(updated)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const loadDecks = async () => {
    try {
      setDecks(await CloudApi.listDecks())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    loadDecks()
  }, [])

  const createDeck = async (e: FormEvent) => {
    e.preventDefault()
    if (!newDeckName.trim()) return
    try {
      const deck = await CloudApi.createDeck(newDeckName.trim())
      setNewDeckName('')
      setDecks((d) => [deck, ...d])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const removeDeck = async (deck: Deck) => {
    if (!confirm(`Xóa bộ "${deck.name}"?`)) return
    await CloudApi.deleteDeck(deck.id)
    setDecks((d) => d.filter((x) => x.id !== deck.id))
    if (selected?.id === deck.id) setSelected(null)
  }

  if (selected) {
    return <DeckDetail deck={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="page">
      <h1 className="page-title">Từ vựng</h1>
      <p className="page-sub">Tạo và quản lý các bộ từ của bạn</p>
      {error && <div className="alert error">{error}</div>}

      <form className="inline-form" onSubmit={createDeck}>
        <input
          placeholder="Tên bộ từ mới (VD: IELTS Vocab 1)"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
        />
        <button className="btn primary" type="submit">
          + Tạo bộ
        </button>
      </form>

      {decks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>Chưa có bộ từ nào</h3>
          <p className="muted">Tạo bộ từ đầu tiên ở ô phía trên để bắt đầu học.</p>
        </div>
      ) : (
        <div className="deck-grid">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="deck-card"
              onClick={() => (editingId === deck.id ? undefined : setSelected(deck))}
            >
              <button
                className="deck-edit"
                title="Đổi tên bộ từ"
                onClick={(e) => {
                  e.stopPropagation()
                  startRename(deck)
                }}
              >
                ✎
              </button>
              <button
                className="deck-del"
                title="Xóa bộ từ"
                onClick={(e) => {
                  e.stopPropagation()
                  removeDeck(deck)
                }}
              >
                ✕
              </button>
              <div className="deck-icon">{deck.name.trim().charAt(0).toUpperCase() || '📚'}</div>
              {editingId === deck.id ? (
                <input
                  className="deck-rename"
                  autoFocus
                  value={editName}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={saveRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      saveRename()
                    } else if (e.key === 'Escape') {
                      setEditingId(null)
                    }
                  }}
                />
              ) : (
                <div className="deck-name">{deck.name}</div>
              )}
              <div className="deck-desc">{deck.description || 'Bộ từ vựng'}</div>
              <div className="deck-foot">
                <span>Mở bộ</span>
                <span className="deck-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Ô nhập nhiều giá trị (chip) + dropdown gợi ý ----------
interface MultiFieldProps {
  placeholder: string
  values: string[]
  onChange: (v: string[]) => void
  suggestions: string[]
  loading: boolean
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  tag?: string
  wide?: boolean
  multiline?: boolean
  onQueryChange?: (q: string) => void
}

function MultiField(props: MultiFieldProps) {
  const [draft, setDraft] = useState('')
  const add = (v: string) => {
    const t = v.trim()
    if (t && !props.values.includes(t)) props.onChange([...props.values, t])
  }
  const remove = (v: string) => props.onChange(props.values.filter((x) => x !== v))
  const avail = props.suggestions.filter((s) => !props.values.includes(s))

  return (
    <div className={props.wide ? 'field-wrap wide' : 'field-wrap'}>
      <div className="multi-input">
        {props.values.map((v) => (
          <span className="multi-chip" key={v}>
            {v}
            <button
              type="button"
              className="multi-x"
              onMouseDown={(e) => {
                e.preventDefault()
                remove(v)
              }}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          placeholder={props.values.length ? '+ thêm…' : props.placeholder}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            props.onOpen()
            props.onQueryChange?.(e.target.value)
          }}
          onFocus={props.onOpen}
          onBlur={() => {
            // Rời ô -> tự ghi nhận nội dung đang gõ (khỏi mất khi bấm Lưu)
            if (draft.trim()) {
              add(draft)
              setDraft('')
            }
            props.onClose()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(draft)
              setDraft('')
            } else if (e.key === 'Backspace' && !draft && props.values.length) {
              remove(props.values[props.values.length - 1])
            }
          }}
        />
      </div>
      {props.isOpen && (avail.length > 0 || props.loading) && (
        <div className="suggest-dropdown">
          {avail.map((s) => (
            <button
              key={s}
              type="button"
              className={props.multiline ? 'suggest-option example' : 'suggest-option'}
              // Không đóng dropdown -> chọn được nhiều mục liên tiếp
              onMouseDown={(e) => {
                e.preventDefault()
                add(s)
              }}
            >
              <span>{s}</span>
              {props.tag && <span className="so-tag">{props.tag}</span>}
            </button>
          ))}
          {props.loading && avail.length === 0 && (
            <div className="suggest-loading">Đang tải gợi ý…</div>
          )}
          {!props.loading && props.suggestions.length === 0 && (
            <div className="suggest-loading">Không có gợi ý</div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------- Sửa thẻ từ: form inline thay chỗ nội dung thẻ ----------
function CardEditor({
  card,
  onSave,
  onCancel,
}: {
  card: Card
  onSave: (updated: Card) => void
  onCancel: () => void
}) {
  // ',' là sentinel "không có" của collocation/pattern -> hiển thị rỗng khi sửa
  const clean = (v: string | null) => (!v || v === ',' ? '' : v)
  const [word, setWord] = useState(card.word)
  const [pos, setPos] = useState(card.pos ?? '')
  const [meaning, setMeaning] = useState(card.meaning ?? '')
  const [colloc, setColloc] = useState(clean(card.collocation))
  const [pattern, setPattern] = useState(clean(card.pattern))
  const [example, setExample] = useState(card.example ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    const w = word.trim()
    if (!w) return
    setSaving(true)
    setErr(null)
    // Nhiều giá trị mỗi ô = mỗi dòng một mục; bỏ dòng trống
    const norm = (s: string) =>
      s
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean)
        .join('\n')
    try {
      const updated = await CloudApi.updateCard(card.id, {
        word: w,
        meaning: meaning.trim() || undefined,
        pos: pos.trim() || undefined,
        // Giữ quy ước sẵn có: trống -> ',' (đánh dấu "không có")
        collocation: norm(colloc) || ',',
        pattern: norm(pattern) || ',',
        example: norm(example) || undefined,
      })
      onSave(updated)
    } catch (e) {
      setErr((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="wc-edit">
      {err && <div className="alert error">{err}</div>}
      <div className="wc-edit-row">
        <input
          className="wc-edit-word"
          autoFocus
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Từ tiếng Anh *"
        />
        <input
          className="wc-edit-pos"
          value={pos}
          onChange={(e) => setPos(e.target.value)}
          placeholder="Từ loại (n, v…)"
        />
      </div>
      <input
        value={meaning}
        onChange={(e) => setMeaning(e.target.value)}
        placeholder="Nghĩa tiếng Việt"
      />
      <textarea
        rows={2}
        value={colloc}
        onChange={(e) => setColloc(e.target.value)}
        placeholder="Collocation — mỗi dòng một cụm"
      />
      <textarea
        rows={2}
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
        placeholder="Pattern — mỗi dòng một mẫu"
      />
      <textarea
        rows={3}
        value={example}
        onChange={(e) => setExample(e.target.value)}
        placeholder="Câu ví dụ — mỗi dòng một câu"
      />
      <div className="wc-edit-actions">
        <button className="btn primary small" onClick={save} disabled={saving || !word.trim()}>
          {saving ? 'Đang lưu…' : '💾 Lưu'}
        </button>
        <button className="btn small" onClick={onCancel} disabled={saving}>
          Hủy
        </button>
      </div>
    </div>
  )
}

// ---------- Chi tiết một bộ: danh sách thẻ + thêm thẻ ----------
type DropKey = 'word' | 'meaning' | 'collocation' | 'pattern' | 'example' | null

function DeckDetail({ deck, onBack }: { deck: Deck; onBack: () => void }) {
  const [cards, setCards] = useState<Card[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ word: '', pos: '' })
  // Cho phép chọn NHIỀU nghĩa / collocation / pattern / câu ví dụ
  const [means, setMeans] = useState<string[]>([])
  const [cols, setCols] = useState<string[]>([])
  const [pats, setPats] = useState<string[]>([])
  const [exs, setExs] = useState<string[]>([])

  // Trạng thái dropdown gợi ý
  const [open, setOpen] = useState<DropKey>(null)
  const [online, setOnline] = useState<{ word: string; senses: OnlineSense[] } | null>(null)
  const [loadingMeaning, setLoadingMeaning] = useState(false)
  const [saving, setSaving] = useState(false)
  // Gợi ý online cho collocation / pattern / câu ví dụ
  const [enrich, setEnrich] = useState<({ word: string } & Enrichment) | null>(null)
  const [loadingEnrich, setLoadingEnrich] = useState(false)
  // Từ loại (n/v/adj/adv) cho các từ trong dropdown gợi ý
  const [posMap, setPosMap] = useState<Record<string, string>>({})
  // Câu ví dụ: gợi ý động theo chữ đang gõ / collocation / pattern (Tatoeba)
  const [exampleQuery, setExampleQuery] = useState('')
  const [exampleSugs, setExampleSugs] = useState<string[]>([])
  const closeTimer = useRef<number | undefined>(undefined)

  // Tải từ loại theo tiền tố (debounce) để hiện trong dropdown gợi ý từ
  useEffect(() => {
    const w = form.word.trim().toLowerCase()
    if (w.length < 2 || !/^[a-z]+$/.test(w)) return
    const id = window.setTimeout(async () => {
      const m = await fetchPosByPrefix(w)
      if (Object.keys(m).length) setPosMap((prev) => ({ ...prev, ...m }))
    }, 250)
    return () => window.clearTimeout(id)
  }, [form.word])

  // Gợi ý câu ví dụ động: theo chữ đang gõ -> collocation -> pattern -> từ.
  // Nguồn Tatoeba (tìm câu chứa cụm), kèm ví dụ từ điển của từ.
  useEffect(() => {
    const w = form.word.trim().toLowerCase()
    // Ví dụ từ điển: câu ĐÚNG TỪ LOẠI đang chọn lên trước, rồi tới các câu còn lại
    const dictEx =
      enrich && enrich.word === w
        ? [...new Set([...(enrich.examplesByPos[form.pos] ?? []), ...enrich.examples])]
        : []
    // Chỉ tìm câu khi người dùng thực sự dùng ô ví dụ (tránh gọi mạng mỗi phím gõ từ)
    const active =
      exampleQuery.trim().length > 0 || cols.length > 0 || pats.length > 0 || open === 'example'
    if (!active) {
      setExampleSugs(dictEx)
      return
    }
    // Ưu tiên: chữ đang gõ > collocation đã chọn > pattern đã chọn > chính từ
    const query =
      exampleQuery.trim() || cleanPhrase(cols[0] ?? '') || cleanPhrase(pats[0] ?? '') || w
    if (query.length < 2) {
      setExampleSugs(dictEx)
      return
    }
    const id = window.setTimeout(async () => {
      const sents = await searchSentences(query, 20)
      // Cụm quá hẹp, ít câu -> tìm bổ sung theo chính từ cho phong phú
      const extra = sents.length < 8 && query !== w ? await searchSentences(w, 12) : []
      // Gộp câu tìm được + ví dụ từ điển, loại trùng
      setExampleSugs([...new Set([...sents, ...extra, ...dictEx])].slice(0, 25))
    }, 300)
    return () => window.clearTimeout(id)
  }, [exampleQuery, cols, pats, form.word, form.pos, enrich, open])

  const load = async () => {
    try {
      setCards(await CloudApi.listCards(deck.id))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id])

  // ----- Gợi ý -----
  // Ô từ: autocomplete theo tiền tố; nếu gõ sai chính tả -> gợi ý từ đúng
  const wordSugs = useMemo<{ text: string; fix: boolean }[]>(() => {
    const w = form.word.trim()
    if (!w) return []
    const lw = w.toLowerCase()
    const seen = new Set<string>()
    const out: { text: string; fix: boolean }[] = []
    // Nếu chính từ đang gõ là từ hợp lệ -> đưa lên đầu để xem ngay từ loại
    if (/^[a-z]+$/.test(lw) && lw.length >= 2 && !isMisspelled(lw)) {
      seen.add(lw)
      out.push({ text: lw, fix: false })
    }
    for (const t of autocomplete(w, 8)) {
      if (!seen.has(t)) {
        seen.add(t)
        out.push({ text: t, fix: false })
      }
    }
    // Chưa có/ít gợi ý theo tiền tố và từ viết sai -> đề xuất từ đúng
    if (out.length < 3 && w.length >= 3 && isMisspelled(w)) {
      const fixes = [...suggestFix(w, 6), ...fuzzyCorrect(w, 6)]
      for (const f of fixes) {
        const t = f.toLowerCase()
        if (!seen.has(t) && /^[a-z]+$/.test(t)) {
          seen.add(t)
          out.push({ text: t, fix: true })
        }
      }
    }
    return out.slice(0, 8)
  }, [form.word])
  // Từ loại của chính từ đang gõ — hiện ngay trong ô từ
  const wordPos = useMemo<string[]>(() => {
    const w = form.word.trim().toLowerCase()
    if (!/^[a-z]+$/.test(w)) return []
    if (enrich && enrich.word === w && enrich.pos.length) return enrich.pos
    if (posMap[w]) return [posMap[w]]
    const off = translate(w).pos
    return off ? [shortPos(off)] : []
  }, [form.word, enrich, posMap])
  // Collocation: gộp gợi ý offline (n-gram) + online (Datamuse)
  const collocSugs = useMemo(() => {
    const w = form.word.trim().toLowerCase()
    const on = enrich && enrich.word === w ? enrich.collocations : []
    return [...new Set([...on, ...collocationSuggestions(w)])].slice(0, 8)
  }, [form.word, enrich])
  const patternSugs = useMemo(() => {
    const w = form.word.trim().toLowerCase()
    return enrich && enrich.word === w ? enrich.patterns : []
  }, [form.word, enrich])
  // Nghĩa: gộp từ điển offline + ĐA NGHĨA online (Google dictionary, gom theo từ loại)
  const meaningSugs = useMemo(() => {
    const w = form.word.trim().toLowerCase()
    const out = new Set<string>(offlineMeanings(w))
    if (online && online.word === w) online.senses.forEach((s) => out.add(s.vi))
    return [...out].slice(0, 12)
  }, [form.word, online])

  // Mở/đóng dropdown (đóng có trễ để kịp bắt sự kiện click chọn)
  const openDrop = (k: DropKey) => {
    window.clearTimeout(closeTimer.current)
    setOpen(k)
  }
  const closeDrop = () => {
    closeTimer.current = window.setTimeout(() => setOpen(null), 160)
  }

  // Tra đa nghĩa online khi bấm vào ô "Nghĩa tiếng Việt"
  const fetchMeaning = async () => {
    const w = form.word.trim().toLowerCase()
    if (!w || (online && online.word === w)) return
    setLoadingMeaning(true)
    const senses = await translateSenses(w)
    setOnline({ word: w, senses })
    setLoadingMeaning(false)
  }

  // Tải collocation/pattern/ví dụ khi bấm vào 1 trong 3 ô đó
  const fetchEnrich = async () => {
    const w = form.word.trim().toLowerCase()
    if (!/^[a-z]+$/.test(w) || (enrich && enrich.word === w)) return
    setLoadingEnrich(true)
    const data = await fetchEnrichment(w)
    setEnrich({ word: w, ...data })
    // Tự chọn từ loại nếu chưa chọn: ưu tiên online, dự phòng từ điển offline
    const offPos = translate(w).pos
    const auto = data.pos[0] ?? (offPos ? shortPos(offPos) : '')
    if (auto) setForm((f) => (f.pos ? f : { ...f, pos: auto }))
    setLoadingEnrich(false)
  }

  const addCard = async (e: FormEvent) => {
    e.preventDefault()
    const w = form.word.trim()
    if (!w) return
    setError(null)
    setSaving(true)
    try {
      const lw = w.toLowerCase()
      // Lấy dữ liệu gợi ý cho từ (dùng lại nếu đã tải, chưa có thì tải ngay khi lưu)
      const data =
        enrich && enrich.word === lw
          ? enrich
          : { word: lw, ...(await fetchEnrichment(lw)) }

      // Nghĩa: đã chọn -> giữ; trống -> gộp offline + đa nghĩa online (tối đa 3)
      let meaningList = means
      if (!meaningList.length) {
        const senses = online && online.word === lw ? online.senses : await translateSenses(lw)
        meaningList = [...new Set([...offlineMeanings(lw), ...senses.map((s) => s.vi)])].slice(0, 3)
        // Không tra được nghĩa nào -> dịch thường (1 nghĩa) làm dự phòng
        if (!meaningList.length) {
          const vi = await translateOnline(lw)
          if (vi) meaningList = [vi]
        }
      }
      const meaning = meaningList.join('; ')
      // Từ loại: đã có -> giữ; trống -> tối ưu từ gợi ý
      let pos = form.pos
      if (!pos) {
        const off = translate(lw).pos
        pos = data.pos[0] ?? (off ? shortPos(off) : '')
      }
      // Ô trống -> tự điền giá trị TỐI ƯU NHẤT (đứng đầu danh sách gợi ý)
      const finalCols = cols.length ? cols : data.collocations.slice(0, 1)
      const finalPats = pats.length ? pats : data.patterns.slice(0, 1)
      // Ví dụ: đã chọn -> giữ; trống -> tự lấy tối đa 3 câu
      // (ưu tiên câu ĐÚNG TỪ LOẠI, rồi câu gợi ý động, rồi ví dụ từ điển chung)
      const finalExs = exs.length
        ? exs
        : [
            ...new Set([...(data.examplesByPos[pos] ?? []), ...exampleSugs, ...data.examples]),
          ].slice(0, 3)

      const card = await CloudApi.createCard(deck.id, {
        word: w,
        meaning,
        // Nhiều giá trị nối bằng xuống dòng; không có -> tự thêm dấu ","
        collocation: finalCols.length ? finalCols.join('\n') : ',',
        pattern: finalPats.length ? finalPats.join('\n') : ',',
        example: finalExs.join('\n'),
        pos: pos || undefined,
      })
      setCards((c) => [card, ...c])
      setForm({ word: '', pos: '' })
      setMeans([])
      setCols([])
      setPats([])
      setExs([])
      setExampleQuery('')
      setExampleSugs([])
      setOnline(null)
      setEnrich(null)
      setOpen(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const removeCard = async (id: string) => {
    await CloudApi.deleteCard(id)
    setCards((c) => c.filter((x) => x.id !== id))
  }

  // Thẻ đang được sửa (mở form inline thay chỗ nội dung)
  const [editingCard, setEditingCard] = useState<string | null>(null)

  // Ô "Từ tiếng Anh" kiêm ô tìm kiếm: gõ vào lọc luôn thẻ đã có (theo từ/nghĩa)
  const filteredCards = useMemo(() => {
    const q = form.word.trim().toLowerCase()
    if (!q) return cards
    return cards.filter(
      (c) =>
        c.word.toLowerCase().includes(q) || (c.meaning ?? '').toLowerCase().includes(q),
    )
  }, [cards, form.word])

  return (
    <div className="page deck-detail">
      <button className="btn tiny" onClick={onBack}>
        ← Quay lại
      </button>
      <h1 className="page-title">{deck.name}</h1>
      {error && <div className="alert error">{error}</div>}

      <form className="card-form" onSubmit={addCard}>
        {/* Từ tiếng Anh + autocomplete */}
        <div className="field-wrap">
          <input
            className="word-input"
            placeholder="Từ tiếng Anh *"
            value={form.word}
            onChange={(e) => {
              setForm({ ...form, word: e.target.value })
              openDrop('word')
            }}
            onFocus={() => {
              openDrop('word')
              const w = form.word.trim().toLowerCase()
              if (/^[a-z]+$/.test(w) && w.length >= 2 && !posMap[w]) {
                fetchPosByPrefix(w).then((m) => {
                  if (Object.keys(m).length) setPosMap((prev) => ({ ...prev, ...m }))
                })
              }
            }}
            onBlur={() => {
              closeDrop()
              fetchEnrich()
            }}
          />
          {wordPos.length > 0 && <span className="word-pos-inline">{wordPos.join(' · ')}</span>}
          {open === 'word' && wordSugs.length > 0 && (
            <div className="suggest-dropdown">
              {wordSugs.map((w) => (
                <button
                  key={w.text}
                  type="button"
                  className="suggest-option"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    // Chọn đúng từ đang gõ -> chỉ đóng dropdown, giữ nguyên dữ liệu đã điền
                    if (form.word.trim().toLowerCase() === w.text) {
                      setOpen(null)
                      return
                    }
                    setForm((f) => ({ ...f, word: w.text, pos: '' }))
                    setMeans([])
                    setCols([])
                    setPats([])
                    setExs([])
                    setOnline(null)
                    setEnrich(null)
                    setOpen(null)
                  }}
                >
                  <span>{w.text}</span>
                  <span
                    className={
                      w.fix ? 'so-tag fix' : posMap[w.text] ? 'so-tag pos' : 'so-tag'
                    }
                  >
                    {w.fix ? 'sửa' : (posMap[w.text] ?? 'từ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nghĩa tiếng Việt — chọn NHIỀU nghĩa (offline + đa nghĩa online) */}
        <MultiField
          placeholder="Nghĩa tiếng Việt"
          values={means}
          onChange={setMeans}
          suggestions={meaningSugs}
          loading={loadingMeaning}
          isOpen={open === 'meaning'}
          onOpen={() => {
            openDrop('meaning')
            fetchMeaning()
          }}
          onClose={closeDrop}
          tag="nghĩa"
        />

        {/* Collocation — chọn nhiều (offline n-gram + online Datamuse) */}
        <MultiField
          placeholder="Collocation"
          values={cols}
          onChange={setCols}
          suggestions={collocSugs}
          loading={loadingEnrich}
          isOpen={open === 'collocation'}
          onOpen={() => {
            openDrop('collocation')
            fetchEnrich()
          }}
          onClose={closeDrop}
          tag="cụm"
        />

        {/* Pattern (mẫu câu) — chọn nhiều */}
        <MultiField
          placeholder="Pattern (mẫu câu)"
          values={pats}
          onChange={setPats}
          suggestions={patternSugs}
          loading={loadingEnrich}
          isOpen={open === 'pattern'}
          onOpen={() => {
            openDrop('pattern')
            fetchEnrich()
          }}
          onClose={closeDrop}
          tag="mẫu"
        />

        {/* Câu ví dụ — chọn nhiều (Free Dictionary) */}
        <MultiField
          placeholder="Câu ví dụ"
          values={exs}
          onChange={setExs}
          suggestions={exampleSugs}
          loading={loadingEnrich}
          isOpen={open === 'example'}
          onOpen={() => {
            openDrop('example')
            fetchEnrich()
          }}
          onClose={closeDrop}
          onQueryChange={setExampleQuery}
          wide
          multiline
        />

        <button className="btn primary" type="submit" disabled={saving}>
          {saving ? 'Đang lưu…' : '+ Thêm thẻ'}
        </button>
      </form>

      <p className="muted">
        {form.word.trim() ? `${filteredCards.length} / ${cards.length} thẻ` : `${cards.length} thẻ`}
      </p>
      {form.word.trim() && filteredCards.length === 0 && cards.length > 0 && (
        <p className="muted">
          Không có thẻ khớp “{form.word.trim()}”. Bấm “+ Thêm thẻ” để tạo mới.
        </p>
      )}
      <div className="card-list">
        {filteredCards.map((card) =>
          editingCard === card.id ? (
            <div key={card.id} className="word-card editing">
              <CardEditor
                card={card}
                onSave={(u) => {
                  setCards((c) => c.map((x) => (x.id === u.id ? u : x)))
                  setEditingCard(null)
                }}
                onCancel={() => setEditingCard(null)}
              />
            </div>
          ) : (
          <div key={card.id} className="word-card">
            <div className="wc-main">
              <span className="wc-word">{card.word}</span>
              {card.pos && <span className="wc-pos">{card.pos}</span>}
            </div>
            {card.meaning && <div className="wc-meaning">{card.meaning}</div>}
            {card.collocation && card.collocation !== ',' && (
              <div className="wc-extra">
                <span className="wc-tag">Collocation</span>
                <span className="wc-vals">
                  {card.collocation
                    .split('\n')
                    .filter(Boolean)
                    .map((v, i) => (
                      <span className="wc-chip" key={i}>
                        {v}
                      </span>
                    ))}
                </span>
              </div>
            )}
            {card.pattern && card.pattern !== ',' && (
              <div className="wc-extra">
                <span className="wc-tag">Pattern</span>
                <span className="wc-vals">
                  {card.pattern
                    .split('\n')
                    .filter(Boolean)
                    .map((v, i) => (
                      <span className="wc-chip" key={i}>
                        {v}
                      </span>
                    ))}
                </span>
              </div>
            )}
            {card.example &&
              card.example
                .split('\n')
                .filter(Boolean)
                .map((ex, i) => (
                  <div className="wc-example" key={i}>
                    “{ex}”
                  </div>
                ))}
            <button
              className="btn tiny wc-edit-btn"
              title="Sửa thẻ"
              onClick={() => setEditingCard(card.id)}
            >
              Sửa
            </button>
            <button className="btn tiny danger" onClick={() => removeCard(card.id)}>
              Xóa
            </button>
          </div>
          ),
        )}
      </div>
    </div>
  )
}
