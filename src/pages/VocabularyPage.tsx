import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import '../styles/vocabulary.css'
import { CloudApi, type Deck, type Card, type DeckStat } from '../services/cloud/CloudApiClient'
import Icon from '../components/Icon'
import { speak } from '../services/tts'
import { track } from '../services/studyTracker'
import type { PageKey } from './pages'
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

// Bộ "Từ đã lưu khi đọc" do AppLayout tạo — hiện icon bóng đèn thay chữ cái đầu
const SAVED_DECK_NAME = 'Từ đã lưu khi đọc'

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

type SortKey = 'new' | 'name' | 'cards' | 'progress'
type ViewKey = 'grid' | 'list'

export default function VocabularyPage({ onNavigate }: { onNavigate?: (p: PageKey) => void } = {}) {
  const [decks, setDecks] = useState<Deck[]>([])
  const [selected, setSelected] = useState<Deck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newDeckName, setNewDeckName] = useState('')
  // Đổi tên (tiêu đề) bộ từ ngay trên thẻ
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  // Thanh công cụ: tìm / sắp xếp / dạng hiển thị · form tạo bộ mở khi cần
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('new')
  const [view, setView] = useState<ViewKey>('grid')
  const [creating, setCreating] = useState(false)
  // Số thẻ / đã học từng bộ — cho thanh tiến độ trên thẻ bộ
  const [deckStats, setDeckStats] = useState<Record<string, DeckStat>>({})

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

  // Thống kê từng bộ (tổng thẻ / đã học) — chỉ để hiển thị, lỗi thì bỏ qua
  const loadStats = async () => {
    try {
      const rows = await CloudApi.statsByDeck()
      setDeckStats(Object.fromEntries(rows.map((r) => [r.deck_id, r])))
    } catch {
      /* giữ nguyên số liệu cũ */
    }
  }

  useEffect(() => {
    loadDecks()
    loadStats()
  }, [])

  // Quay lại danh sách sau khi sửa thẻ -> làm mới số liệu tiến độ
  useEffect(() => {
    if (!selected) loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const createDeck = async (e: FormEvent) => {
    e.preventDefault()
    if (!newDeckName.trim()) return
    try {
      const deck = await CloudApi.createDeck(newDeckName.trim())
      setNewDeckName('')
      setCreating(false)
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
    return (
      <DeckDetail
        deck={selected}
        onBack={() => setSelected(null)}
        onNavigate={onNavigate}
      />
    )
  }

  // Lọc theo ô tìm + sắp xếp theo lựa chọn trên thanh công cụ
  const shownDecks = (() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? decks.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            (d.description ?? '').toLowerCase().includes(q),
        )
      : [...decks]
    const pct = (d: Deck) => {
      const s = deckStats[d.id]
      return s && s.total ? s.learned / s.total : 0
    }
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    else if (sort === 'cards')
      list.sort((a, b) => (deckStats[b.id]?.total ?? 0) - (deckStats[a.id]?.total ?? 0))
    else if (sort === 'progress') list.sort((a, b) => pct(a) - pct(b))
    return list
  })()

  const openCreate = () => {
    setCreating(true)
    window.setTimeout(() => document.getElementById('vocabNewDeck')?.focus(), 0)
  }

  return (
    <div className="page vocab-page">
      <div className="vocab-head">
        <div>
          <h1>Từ vựng</h1>
          <p>
            Tạo và quản lý các bộ từ của bạn. Mỗi thẻ có thể kèm collocation, pattern và câu
            ví dụ.
          </p>
        </div>
        <div className="vocab-head-actions">
          <button className="vocab-btn vocab-btn-primary" onClick={openCreate}>
            <Icon name="plus" /> Tạo bộ từ
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* ------------------------------------------------ Thanh công cụ */}
      <div className="vocab-toolbar">
        <label className="vocab-search">
          <Icon name="search" />
          <input
            className="vocab-input"
            type="search"
            placeholder="Tìm bộ từ…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="vocab-spacer" />
        <select
          className="vocab-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="new">Sắp xếp: Mới nhất</option>
          <option value="name">Tên A → Z</option>
          <option value="cards">Số thẻ nhiều nhất</option>
          <option value="progress">Tiến độ thấp nhất</option>
        </select>
        <div className="vocab-seg">
          <button
            className={view === 'grid' ? 'is-active' : ''}
            title="Dạng lưới"
            onClick={() => setView('grid')}
          >
            <Icon name="grid" />
          </button>
          <button
            className={view === 'list' ? 'is-active' : ''}
            title="Dạng danh sách"
            onClick={() => setView('list')}
          >
            <Icon name="stack" />
          </button>
        </div>
      </div>

      {/* --------------------------------------------- Form tạo bộ mới */}
      {creating && (
        <form className="vocab-create" onSubmit={createDeck}>
          <input
            id="vocabNewDeck"
            className="vocab-input"
            placeholder="Tên bộ từ mới (VD: IELTS Vocab 1)"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setCreating(false)}
          />
          <button className="vocab-btn vocab-btn-primary" type="submit">
            <Icon name="plus" /> Tạo bộ
          </button>
          <button
            className="vocab-btn vocab-btn-ghost"
            type="button"
            onClick={() => setCreating(false)}
          >
            Hủy
          </button>
        </form>
      )}

      {/* ------------------------------------------------- Lưới bộ từ */}
      {decks.length === 0 ? (
        <div className="vocab-empty">
          <Icon name="layers" />
          <b>Chưa có bộ từ nào</b>
          <p>Tạo bộ từ đầu tiên để bắt đầu gom thẻ theo chủ đề hoặc bài học.</p>
        </div>
      ) : shownDecks.length === 0 ? (
        <div className="vocab-empty">
          <Icon name="search" />
          <b>Không tìm thấy bộ từ</b>
          <p>Không có bộ nào khớp “{query.trim()}”. Thử từ khóa khác nhé.</p>
        </div>
      ) : (
        <div className={view === 'list' ? 'vocab-grid is-list' : 'vocab-grid'}>
          {shownDecks.map((deck) => {
            const s = deckStats[deck.id]
            const total = s?.total ?? 0
            const learned = s?.learned ?? 0
            const isSaved = deck.name.trim() === SAVED_DECK_NAME
            return (
              <div
                key={deck.id}
                className="vocab-deck"
                role="button"
                tabIndex={0}
                onClick={() => (editingId === deck.id ? undefined : setSelected(deck))}
                onKeyDown={(e) => {
                  if (editingId !== deck.id && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    setSelected(deck)
                  }
                }}
              >
                <span className="vocab-deck-tools">
                  <button
                    className="vocab-ibtn"
                    title="Đổi tên bộ từ"
                    onClick={(e) => {
                      e.stopPropagation()
                      startRename(deck)
                    }}
                  >
                    <Icon name="pencil" />
                  </button>
                  <button
                    className="vocab-ibtn danger"
                    title="Xóa bộ từ"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeDeck(deck)
                    }}
                  >
                    <Icon name="trash" />
                  </button>
                </span>

                <span className="vocab-deck-top">
                  <span className="vocab-deck-mark">
                    {isSaved ? <Icon name="bulb" /> : deck.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="vocab-deck-txt">
                    {editingId === deck.id ? (
                      <input
                        className="vocab-rename"
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
                      <span className="vocab-deck-name">{deck.name}</span>
                    )}
                    <span className="vocab-deck-desc">{deck.description || 'Bộ từ vựng'}</span>
                  </span>
                </span>

                <span className="vocab-bar">
                  <i style={{ width: `${total ? (learned / total) * 100 : 0}%` }} />
                </span>

                <span className="vocab-deck-meta">
                  <span className="vocab-deck-stats">
                    {total} thẻ <i className="vocab-dot" />{' '}
                    {learned ? `đã học ${learned}` : 'chưa học'}
                  </span>
                  <span className="vocab-deck-go">
                    Mở bộ <Icon name="right" />
                  </span>
                </span>
              </div>
            )
          })}

          <button className="vocab-new-deck" onClick={openCreate}>
            <Icon name="plus" />
            <b>Tạo bộ từ mới</b>
            <span>Nhóm các thẻ theo chủ đề hoặc bài học</span>
          </button>
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

// ---------- Sửa thẻ từ: MODAL nổi giữa màn hình, nhãn rõ từng ô ----------
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

  // Esc để đóng modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    // Bấm nền mờ bên ngoài -> đóng (chỉ khi bấm đúng nền, không phải nội dung)
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-title">
            ✏️ Sửa thẻ · <strong>{card.word}</strong>
          </div>
          <button className="modal-close" onClick={onCancel} title="Đóng (Esc)">
            ✕
          </button>
        </div>

        {err && <div className="alert error">{err}</div>}

        <div className="modal-body">
          <div className="m-row">
            <label className="m-field grow">
              <span className="m-label">
                Từ tiếng Anh <em>*</em>
              </span>
              <input autoFocus value={word} onChange={(e) => setWord(e.target.value)} />
            </label>
            <label className="m-field m-pos">
              <span className="m-label">Từ loại</span>
              <input
                value={pos}
                onChange={(e) => setPos(e.target.value)}
                placeholder="n / v / adj…"
              />
            </label>
          </div>

          <label className="m-field">
            <span className="m-label">Nghĩa tiếng Việt</span>
            <input
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Nhiều nghĩa cách nhau bằng dấu ;"
            />
          </label>

          <label className="m-field">
            <span className="m-label">
              Collocation <small>· mỗi dòng một cụm</small>
            </span>
            <textarea
              rows={3}
              value={colloc}
              onChange={(e) => setColloc(e.target.value)}
              placeholder={'great blessing\nblessing upon'}
            />
          </label>

          <label className="m-field">
            <span className="m-label">
              Pattern (mẫu câu) <small>· mỗi dòng một mẫu</small>
            </span>
            <textarea
              rows={3}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={'blessing of sth\nblessing to do sth'}
            />
          </label>

          <label className="m-field">
            <span className="m-label">
              Câu ví dụ <small>· mỗi dòng một câu</small>
            </span>
            <textarea
              rows={4}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="Mỗi dòng một câu ví dụ…"
            />
          </label>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onCancel} disabled={saving}>
            Hủy
          </button>
          <button className="btn primary" onClick={save} disabled={saving || !word.trim()}>
            {saving ? 'Đang lưu…' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Chi tiết một bộ: danh sách thẻ + thêm thẻ ----------
type DropKey = 'word' | 'meaning' | 'collocation' | 'pattern' | 'example' | null

function DeckDetail({
  deck,
  onBack,
  onNavigate,
}: {
  deck: Deck
  onBack: () => void
  onNavigate?: (p: PageKey) => void
}) {
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
      track.newWords(1) // đếm vào study_stats: +1 từ mới hôm nay
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

  // Form thêm thẻ: mở khi bấm "Thêm thẻ" (mockup) — gõ tìm không còn phải mở form
  const [adding, setAdding] = useState(false)
  // Ô tìm riêng + lọc theo từ loại (chipset trong mockup)
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState<string>('')

  // Nhóm từ loại cho chipset — dựa trên card.pos ('n' / 'v' / 'adj'…)
  const POS_GROUPS: { key: string; label: string; match: (c: Card) => boolean }[] = [
    { key: 'n', label: 'Danh từ', match: (c) => (c.pos ?? '').startsWith('n') },
    { key: 'v', label: 'Động từ', match: (c) => (c.pos ?? '').startsWith('v') },
    { key: 'adj', label: 'Tính từ', match: (c) => (c.pos ?? '').startsWith('adj') },
    { key: 'phrase', label: 'Cụm từ', match: (c) => c.word.trim().includes(' ') },
  ]

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = cards
    if (q) {
      list = list.filter(
        (c) =>
          c.word.toLowerCase().includes(q) || (c.meaning ?? '').toLowerCase().includes(q),
      )
    }
    if (posFilter) {
      const g = POS_GROUPS.find((x) => x.key === posFilter)
      if (g) list = list.filter(g.match)
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, search, posFilter])

  // Số thẻ đã ôn ≥ 1 lần — cho dòng tóm tắt dưới tiêu đề
  const learned = cards.filter((c) => c.srs_reps > 0).length
  const pct = cards.length ? Math.round((learned / cards.length) * 100) : 0

  // ----- Phân trang khi bộ từ lớn: chỉ render PAGE_SIZE thẻ đầu,
  // cuộn tới cuối tự nạp thêm (IntersectionObserver) hoặc bấm "Hiện thêm" -----
  const PAGE_SIZE = 30
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Đổi bộ / đổi từ khóa lọc -> quay về trang đầu
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [deck.id, search, posFilter])

  const visibleCards = filteredCards.slice(0, visibleCount)
  const hasMore = filteredCards.length > visibleCount

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((n) => n + PAGE_SIZE)
      },
      { rootMargin: '400px' }, // nạp sớm trước khi chạm đáy cho mượt
    )
    io.observe(sentinelRef.current)
    return () => io.disconnect()
  }, [hasMore, visibleCount])

  return (
    <div className="page deck-detail">
      <button className="vocab-crumb" onClick={onBack}>
        <Icon name="left" /> Tất cả bộ từ
      </button>

      <div className="vocab-head">
        <div>
          <h1>{deck.name}</h1>
          <p>
            {cards.length} thẻ · đã học {learned} · tỷ lệ hoàn thành {pct}%
          </p>
        </div>
        <div className="vocab-head-actions">
          {onNavigate && (
            <button className="vocab-btn" onClick={() => onNavigate('flashcard')}>
              <Icon name="repeat" /> Ôn bộ này
            </button>
          )}
          <button
            className="vocab-btn vocab-btn-primary"
            onClick={() => {
              setAdding(true)
              window.setTimeout(
                () => document.querySelector<HTMLInputElement>('.vocab-addcard .word-input')?.focus(),
                0,
              )
            }}
          >
            <Icon name="plus" /> Thêm thẻ
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* --------------------------------------------- Form thêm thẻ */}
      <form
        className="vocab-card-box vocab-addcard"
        onSubmit={addCard}
        style={adding ? undefined : { display: 'none' }}
      >
        <div className="vocab-card-head">
          <h2>
            <Icon name="plus" /> Thêm thẻ mới
          </h2>
          <button
            className="vocab-ibtn"
            type="button"
            title="Đóng"
            onClick={() => setAdding(false)}
          >
            <Icon name="x" />
          </button>
        </div>
        <div className="vocab-card-body">
          <div className="vocab-add-grid">
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
          </div>
          <div className="vocab-add-foot">
            <button className="vocab-btn vocab-btn-primary" type="submit" disabled={saving}>
              <Icon name="plus" /> {saving ? 'Đang lưu…' : 'Thêm thẻ'}
            </button>
            <span className="vocab-add-hint">
              Ô để trống sẽ được tự điền từ gợi ý khi lưu
            </span>
          </div>
        </div>
      </form>

      {/* ---------------------------------------- Tìm + lọc theo từ loại */}
      <div className="vocab-filter">
        <label className="vocab-search">
          <Icon name="search" />
          <input
            className="vocab-input"
            type="search"
            placeholder={`Tìm trong ${cards.length} thẻ…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="vocab-spacer" />
        <div className="vocab-chipset">
          <button
            className={posFilter ? 'vocab-chip' : 'vocab-chip is-active'}
            onClick={() => setPosFilter('')}
          >
            Tất cả {cards.length}
          </button>
          {POS_GROUPS.map((g) => {
            const n = cards.filter(g.match).length
            if (!n) return null
            return (
              <button
                key={g.key}
                className={posFilter === g.key ? 'vocab-chip is-active' : 'vocab-chip'}
                onClick={() => setPosFilter(posFilter === g.key ? '' : g.key)}
              >
                {g.label} {n}
              </button>
            )
          })}
        </div>
      </div>

      {/* -------------------------------------------------- Lưới thẻ từ */}
      {filteredCards.length === 0 ? (
        <div className="vocab-empty">
          <Icon name={cards.length ? 'search' : 'layers'} />
          <b>{cards.length ? 'Không có thẻ nào khớp' : 'Bộ từ còn trống'}</b>
          <p>
            {cards.length
              ? 'Thử từ khóa khác hoặc bỏ bộ lọc từ loại.'
              : 'Bấm “Thêm thẻ” để tạo thẻ đầu tiên cho bộ này.'}
          </p>
        </div>
      ) : (
        <section className="vocab-word-grid">
          {visibleCards.map((card) => {
            const cols = (card.collocation ?? '') !== ',' ? (card.collocation ?? '').split('\n').filter(Boolean) : []
            const pats = (card.pattern ?? '') !== ',' ? (card.pattern ?? '').split('\n').filter(Boolean) : []
            const exs = (card.example ?? '').split('\n').filter(Boolean)
            const simple = !cols.length && !pats.length && !exs.length
            return (
              <article
                key={card.id}
                className={simple ? 'vocab-word is-simple' : 'vocab-word'}
              >
                <div className="vocab-word-head">
                  <span className="vocab-word-en">{card.word}</span>
                  {card.pos && <span className="vocab-pos">{card.pos}</span>}
                  <span className="vocab-word-tools">
                    <button
                      className="vocab-ibtn"
                      title="Nghe phát âm"
                      onClick={() => speak(card.word)}
                    >
                      <Icon name="speak" />
                    </button>
                    <button
                      className="vocab-ibtn"
                      title="Sửa thẻ"
                      onClick={() => setEditingCard(card.id)}
                    >
                      <Icon name="pencil" />
                    </button>
                    <button
                      className="vocab-ibtn danger"
                      title="Xóa thẻ"
                      onClick={() => removeCard(card.id)}
                    >
                      <Icon name="trash" />
                    </button>
                  </span>
                </div>

                {card.meaning && <p className="vocab-word-vi">{card.meaning}</p>}

                {cols.length > 0 && (
                  <div className="vocab-meta-row">
                    <span className="vocab-meta-key">Collocation</span>
                    <span className="vocab-meta-vals">
                      {cols.map((v, i) => (
                        <span className="vocab-tok" key={i} title={v}>
                          {v}
                        </span>
                      ))}
                    </span>
                  </div>
                )}

                {pats.length > 0 && (
                  <div className="vocab-meta-row">
                    <span className="vocab-meta-key">Pattern</span>
                    <span className="vocab-meta-vals">
                      {pats.map((v, i) => (
                        <span className="vocab-tok is-pattern" key={i} title={v}>
                          {v}
                        </span>
                      ))}
                    </span>
                  </div>
                )}

                {exs.length > 0 && (
                  <div className="vocab-examples">
                    {exs.map((ex, i) => (
                      <p className="vocab-ex" key={i}>
                        {ex}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}

      {hasMore && (
        <div ref={sentinelRef} className="vocab-more-row">
          <button className="vocab-btn" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
            <Icon name="down" /> Hiện thêm ({filteredCards.length - visibleCount} thẻ còn lại)
          </button>
        </div>
      )}

      {/* Modal sửa thẻ — nổi giữa màn hình, nền mờ phía sau */}
      {(() => {
        const editing = cards.find((c) => c.id === editingCard)
        return editing ? (
          <CardEditor
            card={editing}
            onSave={(u) => {
              setCards((c) => c.map((x) => (x.id === u.id ? u : x)))
              setEditingCard(null)
            }}
            onCancel={() => setEditingCard(null)}
          />
        ) : null
      })()}
    </div>
  )
}
