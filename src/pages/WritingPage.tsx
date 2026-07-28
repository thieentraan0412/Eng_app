import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type UIEvent,
} from 'react'
import Icon, { type IconName } from '../components/Icon'
import { CloudApi, type Writing } from '../services/cloud/CloudApiClient'
import { suggest, type Suggestion } from '../services/suggestion'
import { ignoreWord, isMisspelled, suggestFix, tokenizeWords } from '../services/spellcheck'
import { checkGrammar, type GrammarMatch } from '../services/grammarcheck'
import { checkLocalGrammar } from '../services/localgrammar'
import '../styles/writing.css'

// Gộp lỗi offline + LanguageTool, bỏ trùng theo vị trí, sắp theo thứ tự trong câu
function mergeGrammar(a: GrammarMatch[], b: GrammarMatch[]): GrammarMatch[] {
  const seen = new Set<string>()
  const out: GrammarMatch[] = []
  for (const m of [...a, ...b]) {
    const key = `${m.offset}:${m.length}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(m)
  }
  return out.sort((x, y) => x.offset - y.offset).slice(0, 15)
}

interface SpellItem {
  word: string
  suggestions: string[]
}

// Đề bài điền sẵn khi mở bài mới (từ nút 🎲 hoặc thẻ chủ đề)
interface PromptDraft {
  title: string
  topic: string
}

// Kho gợi ý ĐỀ BÀI luyện viết — bấm 🎲 lấy ngẫu nhiên (điền chủ đề + tiêu đề)
const WRITING_PROMPTS: PromptDraft[] = [
  { topic: 'Daily life', title: 'Describe your typical morning routine' },
  { topic: 'Daily life', title: 'What did you do last weekend?' },
  { topic: 'Travel', title: 'Describe a place you want to visit and why' },
  { topic: 'Travel', title: 'The most memorable trip you have ever taken' },
  { topic: 'Work & Study', title: 'Why are you learning English?' },
  { topic: 'Work & Study', title: 'Describe your dream job' },
  { topic: 'Technology', title: 'How has technology changed the way we live?' },
  { topic: 'Technology', title: 'Do social networks bring people closer together?' },
  { topic: 'Food', title: 'Describe your favorite Vietnamese dish to a foreigner' },
  { topic: 'Food', title: 'Is it better to cook at home or eat out?' },
  { topic: 'Family & Friends', title: 'Describe a person who influenced you the most' },
  { topic: 'Family & Friends', title: 'What makes a good friend?' },
  { topic: 'Environment', title: 'What can individuals do to protect the environment?' },
  { topic: 'Health', title: 'How do you keep yourself healthy?' },
  { topic: 'Opinion', title: 'Is it better to live in the city or the countryside?' },
  { topic: 'Opinion', title: 'Should students wear uniforms at school?' },
  { topic: 'Story', title: 'Write a short story beginning with “It was raining heavily…”' },
  { topic: 'Culture', title: 'Describe a Vietnamese festival to a foreign friend' },
]

// Chủ đề gợi ý ở cuối trang danh sách — bấm là mở bài mới với đề tương ứng
const TOPIC_CARDS: (PromptDraft & { icon: IconName; label: string })[] = [
  {
    icon: 'pen',
    label: 'Giới thiệu bản thân',
    topic: 'Personal',
    title: 'Introduce yourself: who you are and what you do',
  },
  {
    icon: 'clock',
    label: 'Thói quen hằng ngày',
    topic: 'Daily life',
    title: 'Describe your typical morning routine',
  },
  {
    icon: 'book',
    label: 'Một cuốn sách bạn thích',
    topic: 'Culture',
    title: 'Write about a book you love and why',
  },
  {
    icon: 'trend',
    label: 'Mạng xã hội & giới trẻ',
    topic: 'Technology',
    title: 'Do social networks bring people closer together?',
  },
  {
    icon: 'cloud',
    label: 'Biến đổi khí hậu',
    topic: 'Environment',
    title: 'What can individuals do to slow down climate change?',
  },
  {
    icon: 'target',
    label: 'Mục tiêu 5 năm tới',
    topic: 'Work & Study',
    title: 'Where do you see yourself in five years?',
  },
]

const TOPIC_OPTIONS = [
  ...new Set([...WRITING_PROMPTS, ...TOPIC_CARDS].map((p) => p.topic)),
].sort()

function countWords(text: string): number {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function preserveCase(sample: string, word: string): string {
  return sample[0] === sample[0]?.toUpperCase() ? word[0].toUpperCase() + word.slice(1) : word
}
// Dòng đầu của bài, cắt gọn để làm mô tả trong danh sách
function previewOf(content: string | null): string {
  const line = (content ?? '').trim().split(/\r?\n/).find((l) => l.trim()) ?? ''
  return line.length > 120 ? `${line.slice(0, 120)}…` : line
}
function randomPrompt(exceptTitle?: string): PromptDraft {
  const pool = WRITING_PROMPTS.filter((p) => p.title !== exceptTitle)
  return pool[Math.floor(Math.random() * pool.length)]
}

// ================= TRANG DANH SÁCH BÀI VIẾT =================
export default function WritingPage() {
  const [writings, setWritings] = useState<Writing[]>([])
  const [sel, setSel] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<PromptDraft | null>(null) // đề điền sẵn cho bài mới
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Số lỗi chính tả từng bài — tính trễ sau khi danh sách đã hiện (nặng)
  const [spellCounts, setSpellCounts] = useState<Record<string, number>>({})

  const load = async () => {
    try {
      setWritings(await CloudApi.listWritings())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  // Đếm lỗi chính tả cho badge. Từ điển nspell dựng lần đầu khá tốn thời gian
  // nên hoãn lại để danh sách hiện ra trước.
  useEffect(() => {
    if (localStorage.getItem('spell_enabled') === '0' || writings.length === 0) {
      setSpellCounts({})
      return
    }
    let cancelled = false
    const handle = setTimeout(() => {
      const out: Record<string, number> = {}
      for (const w of writings) {
        const uniq = [...new Set(tokenizeWords((w.content ?? '').slice(0, 4000)))]
        out[w.id] = uniq.filter((t) => isMisspelled(t)).length
      }
      if (!cancelled) setSpellCounts(out)
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [writings])

  const openNew = (prompt: PromptDraft | null) => {
    setDraft(prompt)
    setSel('new')
  }

  const remove = async (id: string) => {
    if (!confirm('Xóa bài viết này?')) return
    await CloudApi.deleteWriting(id)
    if (sel === id) setSel(null)
    load()
  }

  // Trang soạn thảo (khi đã chọn / tạo bài)
  if (sel) {
    const current = sel !== 'new' ? writings.find((w) => w.id === sel) ?? null : null
    return (
      <Editor
        key={sel}
        writing={current}
        initial={sel === 'new' ? draft : null}
        onBack={() => {
          setSel(null)
          setDraft(null)
          load()
        }}
        onDelete={current ? () => remove(current.id) : undefined}
      />
    )
  }

  // Trang danh sách
  return (
    <div className="page write-page">
      <div className="write-head">
        <div className="write-head-text">
          <h1>Bài viết</h1>
          <p>
            Luyện viết tiếng Anh với gợi ý từ, kiểm tra chính tả &amp; ngữ pháp theo thời gian
            thực.
          </p>
        </div>
        <div className="write-head-actions">
          <button className="write-btn" onClick={() => openNew(randomPrompt())}>
            <Icon name="shuffle" /> Gợi ý đề bài
          </button>
          <button className="write-btn write-btn-primary" onClick={() => openNew(null)}>
            <Icon name="plus" /> Bài viết mới
          </button>
        </div>
      </div>

      {error && <div className="write-alert">{error}</div>}

      {loading ? (
        <p className="write-loading">Đang tải bài viết…</p>
      ) : writings.length === 0 ? (
        <div className="write-empty">
          <span className="write-empty-ico">
            <Icon name="pen" />
          </span>
          <h2>Chưa có bài viết nào</h2>
          <p>Bấm “Bài viết mới” hoặc chọn một chủ đề bên dưới để bắt đầu.</p>
        </div>
      ) : (
        <section className="write-list">
          {writings.map((w) => {
            const bad = spellCounts[w.id] ?? 0
            return (
              <div
                key={w.id}
                className="write-row"
                role="button"
                tabIndex={0}
                onClick={() => setSel(w.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSel(w.id)
                  }
                }}
              >
                <span className="write-row-mark">
                  <Icon name="pen" />
                </span>
                <span className="write-row-main">
                  <span className="write-row-title">{w.title || '(chưa có tiêu đề)'}</span>
                  <span className="write-row-sub">
                    {previewOf(w.content) || 'Bài viết trống'}
                  </span>
                </span>
                <span className="write-row-side">
                  {w.topic && <span className="write-badge write-badge-accent">{w.topic}</span>}
                  <span className="write-badge">{w.word_count} từ</span>
                  {bad > 0 && (
                    <span className="write-badge write-badge-warn">
                      <Icon name="alert" /> {bad} lỗi chính tả
                    </span>
                  )}
                  <button
                    className="write-ibtn danger"
                    title="Xóa bài viết"
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(w.id)
                    }}
                  >
                    <Icon name="trash" />
                  </button>
                </span>
              </div>
            )
          })}
        </section>
      )}

      <h2 className="write-label">Chủ đề gợi ý</h2>
      <section className="write-topics">
        {TOPIC_CARDS.map((t) => (
          <button key={t.label} className="write-topic" onClick={() => openNew(t)}>
            <Icon name={t.icon} /> {t.label}
          </button>
        ))}
      </section>
    </div>
  )
}

// ================= TRANG SOẠN THẢO =================
function Editor({
  writing,
  initial,
  onBack,
  onDelete,
}: {
  writing: Writing | null
  initial?: PromptDraft | null
  onBack: () => void
  onDelete?: () => void
}) {
  const [id, setId] = useState<string | null>(writing?.id ?? null)
  const [title, setTitle] = useState(writing?.title ?? initial?.title ?? '')
  const [topic, setTopic] = useState(writing?.topic ?? initial?.topic ?? '')
  const [content, setContent] = useState(writing?.content ?? '')
  const [caret, setCaret] = useState(0)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [badSet, setBadSet] = useState<Set<string>>(new Set())
  const [spellList, setSpellList] = useState<SpellItem[]>([])
  const [spellVersion, setSpellVersion] = useState(0)
  const [grammar, setGrammar] = useState<GrammarMatch[]>([])
  const [grammarChecking, setGrammarChecking] = useState(false)

  const suggestEnabled = localStorage.getItem('suggest_enabled') !== '0'
  const spellEnabled = localStorage.getItem('spell_enabled') !== '0'
  const grammarEnabled = localStorage.getItem('grammar_enabled') !== '0'
  const taRef = useRef<HTMLTextAreaElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const pendingCaret = useRef<number | null>(null)

  // Gợi ý từ
  useEffect(() => {
    if (!suggestEnabled) {
      setSuggestions([])
      return
    }
    setSuggestions(suggest(content.slice(0, caret)))
  }, [content, caret, suggestEnabled])

  // Chính tả (debounce 350ms)
  useEffect(() => {
    if (!spellEnabled) {
      setBadSet(new Set())
      setSpellList([])
      return
    }
    const handle = setTimeout(() => {
      const uniq = [...new Set(tokenizeWords(content))]
      const bad = uniq.filter((t) => isMisspelled(t))
      setBadSet(new Set(bad.map((w) => w.toLowerCase())))
      setSpellList(bad.slice(0, 6).map((w) => ({ word: w, suggestions: suggestFix(w, 3) })))
    }, 350)
    return () => clearTimeout(handle)
  }, [content, spellEnabled, spellVersion])

  // Kiểm tra câu: luật OFFLINE hiện ngay + LanguageTool (online, debounce 1.5s) rồi gộp lại
  useEffect(() => {
    if (!grammarEnabled || !content.trim()) {
      setGrammar([])
      return
    }
    // Luật cục bộ: chạy tức thì để không phải chờ mạng
    const local = checkLocalGrammar(content)
    setGrammar(local)
    setGrammarChecking(true)
    const handle = setTimeout(async () => {
      const remote = await checkGrammar(content)
      setGrammar(mergeGrammar(local, remote))
      setGrammarChecking(false)
    }, 1500)
    return () => clearTimeout(handle)
  }, [content, grammarEnabled])

  // Bấm "Kiểm tra ngay" — không đợi hết debounce
  const runGrammarNow = async () => {
    if (!content.trim() || grammarChecking) return
    setGrammarChecking(true)
    const local = checkLocalGrammar(content)
    const remote = await checkGrammar(content)
    setGrammar(mergeGrammar(local, remote))
    setGrammarChecking(false)
  }

  const highlighted = useMemo<ReactNode[]>(() => {
    if (!spellEnabled || badSet.size === 0) return [content]
    return content.split(/([\p{L}\p{M}']+)/u).map((part, i) =>
      /^[\p{L}\p{M}']+$/u.test(part) && badSet.has(part.toLowerCase()) ? (
        <mark className="write-misspell" key={i}>
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }, [content, badSet, spellEnabled])

  useEffect(() => {
    if (pendingCaret.current != null && taRef.current) {
      const pos = pendingCaret.current
      taRef.current.focus()
      taRef.current.setSelectionRange(pos, pos)
      setCaret(pos)
      pendingCaret.current = null
    }
  }, [content])

  const syncCaret = () => {
    if (taRef.current) setCaret(taRef.current.selectionStart)
  }
  const syncScroll = (e: UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const accept = (s: Suggestion) => {
    const before = content.slice(0, caret)
    const after = content.slice(caret)
    const typing = before.match(/([A-Za-z]+)$/)
    const base = typing ? before.slice(0, before.length - typing[1].length) : before
    const newBefore = base + s.text + ' '
    pendingCaret.current = newBefore.length
    setContent(newBefore + after)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault()
      accept(suggestions[0])
    }
  }

  const ignore = (word: string) => {
    ignoreWord(word)
    setSpellVersion((v) => v + 1)
  }
  const fixWord = (bad: string, good: string) => {
    const re = new RegExp(`\\b${escapeRegExp(bad)}\\b`, 'gi')
    setContent((c) => c.replace(re, (m) => preserveCase(m, good)))
  }
  const applyGrammar = (m: GrammarMatch, replacement: string) => {
    setContent((c) => {
      if (c.substr(m.offset, m.length) !== m.errorText) return c
      return c.slice(0, m.offset) + replacement + c.slice(m.offset + m.length)
    })
  }
  const fixAllGrammar = () => {
    setContent((c) => {
      let out = c
      const items = grammar
        .filter((m) => m.replacements.length > 0)
        .sort((a, b) => b.offset - a.offset)
      for (const m of items) {
        if (out.substr(m.offset, m.length) === m.errorText) {
          out = out.slice(0, m.offset) + m.replacements[0] + out.slice(m.offset + m.length)
        }
      }
      return out
    })
  }
  const fixableCount = grammar.filter((m) => m.replacements.length > 0).length

  // Nội dung đã lưu lần cuối — để autosave biết có thay đổi hay không
  const lastSaved = useRef({
    title: writing?.title ?? '',
    topic: writing?.topic ?? '',
    content: writing?.content ?? '',
  })
  const savingRef = useRef(false) // chặn 2 lượt lưu chạy song song (tránh tạo trùng bài)

  const save = async (e?: FormEvent, auto = false) => {
    e?.preventDefault()
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError(null)
    try {
      const wc = countWords(content)
      if (id) {
        await CloudApi.updateWriting(id, title, content, wc, topic)
      } else {
        const created = await CloudApi.createWriting(title, content, wc, topic)
        setId(created.id)
      }
      lastSaved.current = { title, topic, content }
      setSavedAt(`${new Date().toLocaleTimeString('vi-VN')}${auto ? ' · tự động' : ''}`)
    } catch (err) {
      // Autosave lỗi (mất mạng…) thì im lặng, lần gõ tiếp theo sẽ thử lại
      if (!auto) setError((err as Error).message)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  // Ctrl+S (hoặc Cmd+S trên Mac) để lưu nhanh những gì đã nhập
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        void saveRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // TỰ ĐỘNG LƯU NHÁP: ngừng gõ 2.5s và có thay đổi -> lưu ngầm (không cần Ctrl+S)
  useEffect(() => {
    const changed =
      title !== lastSaved.current.title ||
      topic !== lastSaved.current.topic ||
      content !== lastSaved.current.content
    if (!changed || (!title.trim() && !content.trim())) return
    const h = setTimeout(() => void saveRef.current(undefined, true), 2500)
    return () => clearTimeout(h)
  }, [title, topic, content])

  // Chọn ngẫu nhiên 1 đề bài (khác đề đang hiện) -> điền chủ đề + tiêu đề
  const rollPrompt = () => {
    const p = randomPrompt(title)
    setTitle(p.title)
    setTopic(p.topic)
  }

  const typeLabel: Record<Suggestion['type'], string> = {
    auto: 'gợi ý',
    nextword: 'tiếp theo',
    synonym: 'đồng nghĩa',
  }

  return (
    <form className="page write-editor" onSubmit={save}>
      <button type="button" className="write-crumb" onClick={onBack}>
        <Icon name="left" /> Danh sách bài viết
      </button>

      <div className="write-ehead">
        <input
          className="write-title"
          placeholder="Tiêu đề bài viết…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <span className="write-count">
          {countWords(content)} từ · {content.length} ký tự
          {savedAt && ` · đã lưu ${savedAt}`}
        </span>
        <button
          className="write-btn write-btn-primary"
          type="submit"
          disabled={saving}
          title="Lưu (Ctrl+S)"
        >
          <Icon name="save" /> {saving ? 'Đang lưu…' : 'Lưu'}
        </button>
        {onDelete && (
          <button
            type="button"
            className="write-btn write-btn-icon write-btn-danger"
            onClick={onDelete}
            title="Xóa bài viết"
          >
            <Icon name="trash" />
          </button>
        )}
      </div>

      {/* Chủ đề bài viết + gợi ý đề ngẫu nhiên */}
      <div className="write-meta">
        <input
          className="write-input"
          placeholder="Chủ đề (tùy chọn)…"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          list="writing-topics"
        />
        <datalist id="writing-topics">
          {TOPIC_OPTIONS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <button
          type="button"
          className="write-btn write-btn-sm"
          onClick={rollPrompt}
          title="Lấy đề bài ngẫu nhiên"
        >
          <Icon name="shuffle" /> Gợi ý đề bài
        </button>
      </div>

      {error && <div className="write-alert">{error}</div>}

      <div className="write-ta-wrap">
        <div className="write-backdrop" ref={backdropRef} aria-hidden="true">
          {highlighted}
          {'\n'}
        </div>
        <textarea
          ref={taRef}
          className="write-textarea"
          placeholder="Viết bằng tiếng Anh… (gõ để nhận gợi ý; nhấn Tab để chèn gợi ý đầu tiên)"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          data-lpignore="true"
          data-form-type="other"
          name="write-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setCaret(e.target.selectionStart)
          }}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
        />
      </div>

      {/* ---------- Thanh trợ lý ---------- */}
      <div className="write-assist">
        {spellEnabled && spellList.length > 0 && (
          <div className="write-arow">
            <span className="write-alabel">
              <Icon name="type" /> Chính tả
            </span>
            {spellList.map((item) => (
              <span className="write-aitem" key={item.word}>
                <span className="write-bad">{item.word}</span>
                <Icon name="right" />
                {item.suggestions.length > 0 ? (
                  item.suggestions.map((sug) => (
                    <button
                      type="button"
                      key={sug}
                      className="write-fix"
                      onClick={() => fixWord(item.word, sug)}
                    >
                      {sug}
                    </button>
                  ))
                ) : (
                  <span className="write-ahint">(không có gợi ý)</span>
                )}
                <button
                  type="button"
                  className="write-btn write-btn-sm write-btn-ghost"
                  title="Bỏ qua từ này (thêm vào từ điển cá nhân)"
                  onClick={() => ignore(item.word)}
                >
                  Bỏ qua
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="write-arow">
          <span className="write-alabel">
            <Icon name="sparkle" /> Gợi ý
          </span>
          {suggestEnabled && suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <button
                type="button"
                key={s.text + i}
                className={`write-chip ${s.type}`}
                onClick={() => accept(s)}
              >
                {s.text}
                <small>{typeLabel[s.type]}</small>
              </button>
            ))
          ) : (
            <span className="write-ahint">
              {suggestEnabled
                ? 'Gõ tiếng Anh để nhận gợi ý từ tiếp theo…'
                : 'Đã tắt gợi ý (bật lại ở Cài đặt)'}
            </span>
          )}
        </div>

        <div className="write-arow">
          <span className="write-alabel">
            <Icon name="target" /> Kiểm tra câu
          </span>
          {!grammarEnabled ? (
            <span className="write-ahint">Đã tắt kiểm tra câu (bật lại ở Cài đặt)</span>
          ) : grammar.length === 0 ? (
            <span className="write-ahint">
              {grammarChecking ? 'Đang kiểm tra…' : 'Ngữ pháp, văn phong, dùng từ, collocation'}
            </span>
          ) : (
            grammar.map((m, idx) => (
              <span className="write-aitem" key={idx}>
                <span className="write-gerr" title={m.message}>
                  {m.errorText || '⚠'}
                </span>
                <Icon name="right" />
                {m.replacements.length > 0 ? (
                  m.replacements.map((rep) => (
                    <button
                      type="button"
                      key={rep}
                      className="write-fix"
                      title={m.message}
                      onClick={() => applyGrammar(m, rep)}
                    >
                      {rep}
                    </button>
                  ))
                ) : (
                  <span className="write-ginfo" title={m.message}>
                    ⓘ
                  </span>
                )}
              </span>
            ))
          )}
          {grammarEnabled && (
            <>
              <div className="write-spacer" />
              {fixableCount > 1 && (
                <button type="button" className="write-btn write-btn-sm" onClick={fixAllGrammar}>
                  <Icon name="check" /> Sửa tất cả ({fixableCount})
                </button>
              )}
              <button
                type="button"
                className="write-btn write-btn-sm"
                onClick={runGrammarNow}
                disabled={grammarChecking || !content.trim()}
              >
                <Icon name="refresh" /> {grammarChecking ? 'Đang kiểm tra…' : 'Kiểm tra ngay'}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  )
}
