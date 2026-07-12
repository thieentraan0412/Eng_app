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
import { CloudApi, type Writing } from '../services/cloud/CloudApiClient'
import { suggest, type Suggestion } from '../services/suggestion'
import { ignoreWord, isMisspelled, suggestFix, tokenizeWords } from '../services/spellcheck'
import { checkGrammar, type GrammarMatch } from '../services/grammarcheck'

interface SpellItem {
  word: string
  suggestions: string[]
}

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

// ================= TRANG DANH SÁCH BÀI VIẾT =================
export default function WritingPage() {
  const [writings, setWritings] = useState<Writing[]>([])
  const [sel, setSel] = useState<string | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setWritings(await CloudApi.listWritings())
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    load()
  }, [])

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
        onBack={() => {
          setSel(null)
          load()
        }}
        onDelete={current ? () => remove(current.id) : undefined}
      />
    )
  }

  // Trang danh sách
  return (
    <div className="page">
      <div className="list-header">
        <h1 className="page-title">Bài viết</h1>
        <button className="btn primary" onClick={() => setSel('new')}>
          + Bài viết mới
        </button>
      </div>
      {error && <div className="alert error">{error}</div>}

      {writings.length === 0 ? (
        <div className="writing-empty">
          <div className="we-icon">✍️</div>
          <h2>Chưa có bài viết</h2>
          <p className="muted">Bấm “Bài viết mới” để bắt đầu luyện viết.</p>
        </div>
      ) : (
        <div className="deck-grid">
          {writings.map((w) => (
            <div key={w.id} className="deck-card" onClick={() => setSel(w.id)}>
              <div className="deck-name">{w.title || '(chưa có tiêu đề)'}</div>
              <span className="muted">{w.word_count} từ</span>
              <button
                className="btn tiny danger"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(w.id)
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

// ================= TRANG SOẠN THẢO =================
function Editor({
  writing,
  onBack,
  onDelete,
}: {
  writing: Writing | null
  onBack: () => void
  onDelete?: () => void
}) {
  const [id, setId] = useState<string | null>(writing?.id ?? null)
  const [title, setTitle] = useState(writing?.title ?? '')
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

  // Kiểm tra câu (LanguageTool, debounce 1.5s)
  useEffect(() => {
    if (!grammarEnabled || !content.trim()) {
      setGrammar([])
      return
    }
    setGrammarChecking(true)
    const handle = setTimeout(async () => {
      const matches = await checkGrammar(content)
      setGrammar(matches)
      setGrammarChecking(false)
    }, 1500)
    return () => clearTimeout(handle)
  }, [content, grammarEnabled])

  const highlighted = useMemo<ReactNode[]>(() => {
    if (!spellEnabled || badSet.size === 0) return [content]
    return content.split(/([\p{L}\p{M}']+)/u).map((part, i) =>
      /^[\p{L}\p{M}']+$/u.test(part) && badSet.has(part.toLowerCase()) ? (
        <mark className="misspell" key={i}>
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

  const save = async (e?: FormEvent) => {
    e?.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const wc = countWords(content)
      if (id) {
        await CloudApi.updateWriting(id, title, content, wc)
      } else {
        const created = await CloudApi.createWriting(title, content, wc)
        setId(created.id)
      }
      setSavedAt(new Date().toLocaleTimeString('vi-VN'))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const typeLabel: Record<Suggestion['type'], string> = {
    auto: 'gợi ý',
    nextword: 'tiếp theo',
    synonym: 'đồng nghĩa',
  }

  return (
    <form className="writing-editor-page" onSubmit={save}>
      <div className="editor-head">
        <button type="button" className="btn tiny back-btn" onClick={onBack} title="Quay lại">
          ←
        </button>
        <input
          className="writing-title"
          placeholder="Tiêu đề bài viết"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <span className="muted wm-count">
          {countWords(content)} từ · {content.length} ký tự
          {savedAt && ` · Đã lưu ${savedAt}`}
        </span>
        <button className="btn primary" type="submit" disabled={saving}>
          {saving ? 'Đang lưu…' : '💾 Lưu'}
        </button>
        {onDelete && (
          <button type="button" className="btn tiny danger" onClick={onDelete}>
            Xóa
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="ta-wrap">
        <div className="ta-backdrop" ref={backdropRef} aria-hidden="true">
          {highlighted}
          {'\n'}
        </div>
        <textarea
          ref={taRef}
          className="writing-area"
          placeholder="Viết bằng tiếng Anh… (gõ để nhận gợi ý; nhấn Tab để chèn gợi ý đầu tiên)"
          spellCheck={false}
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

      <div className="writing-bottom">
        {grammarEnabled && (grammar.length > 0 || grammarChecking) && (
          <div className="grammar-bar">
            <span className="grammar-label">Kiểm tra câu</span>
            {fixableCount > 1 && (
              <button type="button" className="grammar-fixall" onClick={fixAllGrammar}>
                ✓ Sửa cả câu ({fixableCount})
              </button>
            )}
            {grammar.length === 0 && grammarChecking ? (
              <span className="suggest-hint">Đang kiểm tra…</span>
            ) : (
              grammar.map((m, idx) => (
                <span className="grammar-item" key={idx}>
                  <span className="grammar-err" title={m.message}>
                    {m.errorText || '⚠'}
                  </span>
                  <span className="grammar-arrow">→</span>
                  {m.replacements.length > 0 ? (
                    m.replacements.map((rep) => (
                      <button
                        type="button"
                        key={rep}
                        className="grammar-fix"
                        title={m.message}
                        onClick={() => applyGrammar(m, rep)}
                      >
                        {rep}
                      </button>
                    ))
                  ) : (
                    <span className="grammar-info" title={m.message}>
                      ⓘ
                    </span>
                  )}
                </span>
              ))
            )}
          </div>
        )}
        {spellEnabled && spellList.length > 0 && (
          <div className="spell-bar">
            <span className="spell-label">Chính tả</span>
            {spellList.map((item) => (
              <span className="spell-item" key={item.word}>
                <span className="spell-word">{item.word}</span>
                <span className="spell-arrow">→</span>
                {item.suggestions.length > 0 ? (
                  item.suggestions.map((sug) => (
                    <button
                      type="button"
                      key={sug}
                      className="spell-fix"
                      onClick={() => fixWord(item.word, sug)}
                    >
                      {sug}
                    </button>
                  ))
                ) : (
                  <span className="muted">(không có gợi ý)</span>
                )}
                <button
                  type="button"
                  className="spell-ignore"
                  title="Bỏ qua từ này (thêm vào từ điển cá nhân)"
                  onClick={() => ignore(item.word)}
                >
                  Bỏ qua
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="suggest-bar">
          <span className="suggest-label">Gợi ý</span>
          {suggestEnabled && suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <button
                type="button"
                key={s.text + i}
                className={`suggest-chip ${s.type}`}
                onClick={() => accept(s)}
              >
                {s.text}
                <small>{typeLabel[s.type]}</small>
              </button>
            ))
          ) : (
            <span className="suggest-hint">
              {suggestEnabled ? 'Gõ tiếng Anh để nhận gợi ý…' : 'Đã tắt gợi ý (bật lại ở Cài đặt)'}
            </span>
          )}
        </div>
      </div>
    </form>
  )
}
