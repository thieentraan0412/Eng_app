import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { type SentenceItem, type CefrLevel } from '../data/sentences'
import { gradeSentence, type GradeResult, type DiffToken } from '../services/sentencecheck'
import { suggest, type Suggestion } from '../services/suggestion'
import {
  listFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  countByFolder,
  listSentences,
  createSentence,
  createSentences,
  updateSentence,
  deleteSentence,
  type Folder,
  type StoredSentence,
  type SentenceInput,
} from '../services/sentenceStore'
import {
  parseRowsFromExcel,
  downloadSampleExcel,
  exportFolderExcel,
} from '../services/excelImport'
import { translateToEnglish } from '../services/translation'

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']

// ================= TRANG CHÉP CÂU =================
// Bố cục giống Từ vựng: lưới thẻ THƯ MỤC; bấm mở 1 thư mục -> chi tiết
// (Luyện tập / Quản lý câu bên trong).
export default function SentencePage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Folder | null>(null)
  const [newName, setNewName] = useState('')
  // Đổi tên thư mục ngay trên thẻ
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const refresh = () => {
    setFolders(listFolders())
    setCounts(countByFolder())
  }
  useEffect(() => {
    refresh()
  }, [])

  const addFolder = (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    createFolder(newName)
    setNewName('')
    refresh()
  }

  const startRename = (f: Folder) => {
    setEditingId(f.id)
    setEditName(f.name)
  }
  const saveRename = () => {
    const id = editingId
    const name = editName.trim()
    setEditingId(null)
    if (!id || !name) return
    renameFolder(id, name)
    refresh()
  }
  const remove = (f: Folder) => {
    if (!confirm(`Xóa thư mục "${f.name}" và toàn bộ câu bên trong?`)) return
    deleteFolder(f.id)
    if (selected?.id === f.id) setSelected(null)
    refresh()
  }

  if (selected) {
    return (
      <FolderDetail
        folder={selected}
        onBack={() => {
          setSelected(null)
          refresh()
        }}
      />
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Chép câu</h1>
      <p className="page-sub">Tạo thư mục và quản lý các câu luyện dịch Việt → Anh</p>

      <form className="inline-form" onSubmit={addFolder}>
        <input
          placeholder="Tên thư mục mới (VD: Thì hiện tại hoàn thành)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn primary" type="submit">
          + Tạo thư mục
        </button>
      </form>

      {folders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✏️</div>
          <h3>Chưa có thư mục nào</h3>
          <p className="muted">Tạo thư mục đầu tiên ở ô phía trên để bắt đầu.</p>
        </div>
      ) : (
        <div className="deck-grid">
          {folders.map((f) => (
            <div
              key={f.id}
              className="deck-card"
              onClick={() => (editingId === f.id ? undefined : setSelected(f))}
            >
              <button
                className="deck-edit"
                title="Đổi tên thư mục"
                onClick={(e) => {
                  e.stopPropagation()
                  startRename(f)
                }}
              >
                ✎
              </button>
              <button
                className="deck-del"
                title="Xóa thư mục"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(f)
                }}
              >
                ✕
              </button>
              <div className="deck-icon">📁</div>
              {editingId === f.id ? (
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
                <div className="deck-name">{f.name}</div>
              )}
              <div className="deck-desc">{counts[f.id] ?? 0} câu</div>
              <div className="deck-foot">
                <span>Mở thư mục</span>
                <span className="deck-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ================= CHI TIẾT MỘT THƯ MỤC =================
function FolderDetail({ folder, onBack }: { folder: Folder; onBack: () => void }) {
  const [mode, setMode] = useState<'practice' | 'manage'>('practice')

  return (
    <div className="page page-wide sentence-page">
      <button className="btn tiny" onClick={onBack}>
        ← Quay lại
      </button>
      <div className="sentence-head">
        <h1 className="page-title">{folder.name}</h1>
        <div className="tabs">
          <button
            className={mode === 'practice' ? 'tab active' : 'tab'}
            onClick={() => setMode('practice')}
          >
            Luyện tập
          </button>
          <button
            className={mode === 'manage' ? 'tab active' : 'tab'}
            onClick={() => setMode('manage')}
          >
            Quản lý
          </button>
        </div>
      </div>

      {mode === 'practice' ? (
        <PracticeView folder={folder} />
      ) : (
        <ManageView folder={folder} onChanged={() => {}} />
      )}
    </div>
  )
}

// ================= CHẾ ĐỘ LUYỆN TẬP =================
function PracticeView({ folder }: { folder: Folder }) {
  const [items, setItems] = useState<StoredSentence[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, GradeResult>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  // Đổi thư mục -> nạp lại câu và xóa trạng thái làm bài
  useEffect(() => {
    setItems(listSentences(folder.id))
    setInputs({})
    setResults({})
    setRevealed({})
  }, [folder.id])

  const correctCount = useMemo(
    () => Object.values(results).filter((r) => r.status === 'correct').length,
    [results],
  )

  const setInput = (id: string, value: string) => setInputs((m) => ({ ...m, [id]: value }))
  const checkOne = (item: SentenceItem) => {
    const val = (inputs[item.id] ?? '').trim()
    if (!val) return
    setResults((m) => ({ ...m, [item.id]: gradeSentence(item, val) }))
  }
  const checkAll = () => {
    const next: Record<string, GradeResult> = {}
    for (const item of items) {
      const val = (inputs[item.id] ?? '').trim()
      if (val) next[item.id] = gradeSentence(item, val)
    }
    setResults(next)
  }
  const reveal = (id: string) => setRevealed((m) => ({ ...m, [id]: true }))

  const pct = items.length ? Math.round((correctCount / items.length) * 100) : 0

  if (items.length === 0) {
    return (
      <p className="muted">
        Thư mục này chưa có câu nào. Chuyển sang tab <strong>Quản lý</strong> để thêm câu.
      </p>
    )
  }

  return (
    <>
      <div className="practice-bar">
        <span className="sp-count">
          Đúng <strong>{correctCount}</strong> / {items.length}
        </span>
        <div className="sp-bar">
          <div className="sp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <button className="btn primary" onClick={checkAll}>
          Kiểm tra tất cả
        </button>
      </div>

      <div className="sentence-list">
        {items.map((item, idx) => (
          <SentenceCard
            key={item.id}
            index={idx + 1}
            item={item}
            value={inputs[item.id] ?? ''}
            result={results[item.id]}
            revealed={!!revealed[item.id]}
            onChange={(v) => setInput(item.id, v)}
            onCheck={() => checkOne(item)}
            onReveal={() => reveal(item.id)}
          />
        ))}
      </div>
    </>
  )
}

// ---------- Nhãn / icon cho loại gợi ý ----------
const SUGGEST_ICON: Record<Suggestion['type'], string> = {
  auto: '⌨',
  nextword: '→',
  synonym: '≈',
}
const STATUS_TEXT: Record<GradeResult['status'], string> = {
  correct: '✅ Đúng',
  close: '🟡 Gần đúng',
  wrong: '❌ Chưa đúng',
}

// ================= THẺ MỘT CÂU (luyện tập) =================
function SentenceCard({
  index,
  item,
  value,
  result,
  revealed,
  onChange,
  onCheck,
  onReveal,
}: {
  index: number
  item: SentenceItem
  value: string
  result?: GradeResult
  revealed: boolean
  onChange: (v: string) => void
  onCheck: () => void
  onReveal: () => void
}) {
  const suggestEnabled = localStorage.getItem('suggest_enabled') !== '0'
  const taRef = useRef<HTMLTextAreaElement>(null)
  const pendingCaret = useRef<number | null>(null)

  const [caret, setCaret] = useState(0)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!suggestEnabled) {
      setSuggestions([])
      return
    }
    const h = setTimeout(() => {
      const list = suggest(value.slice(0, caret))
      setSuggestions(list)
      setActive(0)
      setOpen(list.length > 0)
    }, 120)
    return () => clearTimeout(h)
  }, [value, caret, suggestEnabled])

  useEffect(() => {
    if (pendingCaret.current != null && taRef.current) {
      const pos = pendingCaret.current
      taRef.current.focus()
      taRef.current.setSelectionRange(pos, pos)
      setCaret(pos)
      pendingCaret.current = null
    }
  }, [value])

  const syncCaret = () => {
    if (taRef.current) setCaret(taRef.current.selectionStart)
  }

  const accept = (s: Suggestion) => {
    const before = value.slice(0, caret)
    const after = value.slice(caret)
    const typing = before.match(/([A-Za-z]+)$/)
    const base = typing ? before.slice(0, before.length - typing[1].length) : before
    const newBefore = base + s.text + ' '
    pendingCaret.current = newBefore.length
    setOpen(false)
    onChange(newBefore + after)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      setOpen(false)
      onCheck()
      return
    }
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      accept(suggestions[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  const statusClass = result ? `is-${result.status}` : ''

  return (
    <div className={`sentence-card ${statusClass}`}>
      <div className="sc-vi">
        <span className="sc-index">{index}</span>
        <span className="sc-flag">🇻🇳</span>
        <span className="sc-vi-text">{item.vi}</span>
        {item.level && <span className="sc-level">{item.level}</span>}
      </div>

      {item.hints && item.hints.length > 0 && (
        <div className="sc-hints">
          {item.hints.map((h) => (
            <span key={h} className="sc-hint">
              💡 {h}
            </span>
          ))}
        </div>
      )}

      <div className="sc-input-wrap">
        <textarea
          ref={taRef}
          className="sc-input"
          placeholder="Nhập câu tiếng Anh của bạn… (Ctrl+Enter để kiểm tra)"
          spellCheck={false}
          rows={2}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setCaret(e.target.selectionStart)
          }}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
        {suggestEnabled && open && suggestions.length > 0 && (
          <ul className="sc-suggest" role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={s.text + i}
                role="option"
                aria-selected={i === active}
                className={`sc-suggest-item ${s.type} ${i === active ? 'active' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  accept(s)
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="sc-suggest-icon">{SUGGEST_ICON[s.type]}</span>
                {s.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sc-actions">
        <button type="button" className="btn tiny" onClick={onReveal}>
          Xem đáp án
        </button>
        <button type="button" className="btn primary" onClick={onCheck}>
          Kiểm tra
        </button>
      </div>

      {revealed && !result && (
        <div className="sc-answer">
          Đáp án: <strong>{item.en}</strong>
        </div>
      )}

      {result && <ResultBox item={item} result={result} />}
    </div>
  )
}

// ---------- Khối kết quả sau khi chấm ----------
function ResultBox({ item, result }: { item: SentenceItem; result: GradeResult }) {
  return (
    <div className={`sc-result is-${result.status}`}>
      <div className="sc-status">
        {STATUS_TEXT[result.status]}
        <span className="sc-score">{Math.round(result.score * 100)}%</span>
      </div>

      {result.status !== 'correct' && (
        <div className="sc-compare">
          <span className="sc-compare-label">Gợi ý:</span>
          <span className="sc-diff">
            {result.diff.map((t, i) => (
              <DiffChunk key={i} token={t} />
            ))}
          </span>
        </div>
      )}

      {result.status !== 'correct' && result.bestAnswer !== item.en && (
        <div className="sc-answer">
          Đáp án mẫu: <strong>{item.en}</strong>
        </div>
      )}

      {result.spell.length > 0 && (
        <div className="sc-notes">
          <span className="sc-notes-label">Chính tả:</span>
          {result.spell.map((s) => (
            <span key={s.word} className="sc-note">
              {s.word}
              {s.suggestions.length > 0 && <em> → {s.suggestions.join(', ')}</em>}
            </span>
          ))}
        </div>
      )}

      {result.grammar.length > 0 && (
        <div className="sc-notes">
          <span className="sc-notes-label">Ngữ pháp:</span>
          {result.grammar.map((g, i) => (
            <span key={i} className="sc-note" title={g.message}>
              {g.errorText || '⚠'}
              {g.replacements.length > 0 && <em> → {g.replacements[0]}</em>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function DiffChunk({ token }: { token: DiffToken }) {
  if (token.op === 'same') return <span className="d-same">{token.text} </span>
  if (token.op === 'del') return <span className="d-del">{token.text} </span>
  return <span className="d-add">{token.text} </span>
}

// ================= CHẾ ĐỘ QUẢN LÝ =================
const EMPTY_FORM: SentenceInput = { vi: '', en: '', altAnswers: [], hints: [], level: undefined, topic: '' }

function ManageView({ folder, onChanged }: { folder: Folder; onChanged: () => void }) {
  const [items, setItems] = useState<StoredSentence[]>([])
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const load = () => setItems(listSentences(folder.id))
  useEffect(() => {
    load()
    setEditingId(null)
    setSelected(new Set())
  }, [folder.id])

  const afterMutate = () => {
    load()
    onChanged()
    setEditingId(null)
    setSelected(new Set())
  }

  // ----- Chọn nhiều / chọn tất cả -----
  const allSelected = items.length > 0 && selected.size === items.length
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const toggleAll = () =>
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((s) => s.id))))
  const deleteSelected = () => {
    if (selected.size === 0) return
    if (!confirm(`Xóa ${selected.size} câu đã chọn?`)) return
    selected.forEach((id) => deleteSentence(id))
    afterMutate()
  }

  const save = (data: SentenceInput, id?: string) => {
    if (!data.vi.trim() || !data.en.trim()) {
      alert('Cần nhập cả câu tiếng Việt và đáp án tiếng Anh.')
      return
    }
    if (id) updateSentence(id, data)
    else createSentence(folder.id, data)
    afterMutate()
  }

  const remove = (s: StoredSentence) => {
    if (!confirm(`Xóa câu:\n"${s.vi}"?`)) return
    deleteSentence(s.id)
    afterMutate()
  }

  // Import Excel: bắt buộc cột tiếng Việt; các cột khác nếu có thì lấy,
  // thiếu đáp án tiếng Anh thì tự dịch VI→EN.
  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // cho phép chọn lại cùng file
    if (!file) return

    setImportMsg(null)
    let result
    try {
      const buf = await file.arrayBuffer()
      result = parseRowsFromExcel(buf)
    } catch {
      setImportMsg('❌ Không đọc được file. Hãy dùng file .xlsx / .xls / .csv hợp lệ.')
      return
    }

    const parsed = result.rows
    if (parsed.length === 0) {
      setImportMsg(`Không tìm thấy câu nào (đã đọc ${result.usedColumn}).`)
      return
    }

    // Số câu thiếu đáp án tiếng Anh -> cần tự dịch
    const needTranslate = parsed.filter((r) => !r.en?.trim()).length
    const extra = result.extraCols.length ? `\nCột phụ đọc được: ${result.extraCols.join(', ')}.` : ''
    if (
      !confirm(
        `Tìm thấy ${parsed.length} câu ở ${result.usedColumn}.${extra}\n` +
          (needTranslate > 0
            ? `${needTranslate} câu chưa có đáp án tiếng Anh sẽ được tự dịch (cần internet).\n`
            : '') +
          `Thêm vào "${folder.name}"? Tiếp tục?`,
      )
    )
      return

    setImporting(true)
    setProgress({ done: 0, total: parsed.length })
    const rows: SentenceInput[] = []
    let translated = 0
    for (let i = 0; i < parsed.length; i++) {
      const r = parsed[i]
      let en = r.en?.trim() ?? ''
      if (!en) {
        try {
          en = (await translateToEnglish(r.vi)) ?? ''
        } catch {
          en = ''
        }
        if (en) translated += 1
      }
      rows.push({
        vi: r.vi,
        en,
        altAnswers: r.altAnswers,
        hints: r.hints,
        level: (r.level as CefrLevel | undefined) || undefined,
        topic: r.topic,
      })
      setProgress({ done: i + 1, total: parsed.length })
    }
    const added = createSentences(folder.id, rows)
    const missing = rows.filter((r) => !r.en.trim()).length
    setImporting(false)
    setImportMsg(
      `✅ Đã thêm ${added} câu` +
        (needTranslate > 0 ? ` · tự dịch ${translated}/${needTranslate} câu thiếu đáp án` : '') +
        (missing > 0 ? ` · còn ${missing} câu chưa có đáp án (hãy sửa thủ công).` : '.'),
    )
    afterMutate()
  }

  return (
    <div className="manage-view">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={onPickFile}
      />
      <div className="manage-head">
        <h2 className="manage-title">
          Quản lý câu · <span className="muted">{folder.name}</span> ({items.length})
        </h2>
        <div className="manage-head-actions">
          <ExcelMenu
            disabled={importing}
            canExport={items.length > 0}
            onSample={() => downloadSampleExcel()}
            onImport={() => fileRef.current?.click()}
            onExport={() => exportFolderExcel(folder.name, items)}
          />
          {editingId !== 'new' && (
            <button className="btn primary" onClick={() => setEditingId('new')} disabled={importing}>
              + Thêm câu
            </button>
          )}
        </div>
      </div>

      {importing && (
        <div className="import-progress">
          Đang dịch &amp; nhập… {progress.done}/{progress.total}
          <div className="sp-bar">
            <div
              className="sp-bar-fill"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
      {importMsg && !importing && <div className="import-msg">{importMsg}</div>}

      {editingId === 'new' && (
        <SentenceForm
          key="new"
          initial={EMPTY_FORM}
          onSave={(d) => save(d)}
          onCancel={() => setEditingId(null)}
        />
      )}

      {items.length === 0 && editingId !== 'new' ? (
        <p className="muted">Chưa có câu nào. Bấm “+ Thêm câu”.</p>
      ) : (
        <>
          {items.length > 0 && (
            <div className="manage-toolbar">
              <label className="select-all">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                Chọn tất cả
              </label>
              {selected.size > 0 && (
                <>
                  <span className="sel-count">{selected.size} đã chọn</span>
                  <button className="btn tiny danger" onClick={deleteSelected}>
                    🗑 Xóa đã chọn ({selected.size})
                  </button>
                </>
              )}
            </div>
          )}
          <div className="manage-list">
            {items.map((s, i) =>
              editingId === s.id ? (
                <SentenceForm
                  key={s.id}
                  initial={toForm(s)}
                  onSave={(d) => save(d, s.id)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div
                  key={s.id}
                  className={`manage-row ${selected.has(s.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="mr-check"
                    checked={selected.has(s.id)}
                    onChange={() => toggleOne(s.id)}
                  />
                  <div className="mr-num">{i + 1}</div>
                  <div className="mr-body">
                    <div className="mr-vi">{s.vi}</div>
                    <div className="mr-en">{s.en || <em className="mr-empty">(chưa có đáp án)</em>}</div>
                    <div className="mr-meta">
                      {s.level && <span className="mr-tag">{s.level}</span>}
                      {s.topic && <span className="mr-tag">{s.topic}</span>}
                      {s.altAnswers && s.altAnswers.length > 0 && (
                        <span className="mr-tag">+{s.altAnswers.length} cách khác</span>
                      )}
                    </div>
                  </div>
                  <div className="mr-actions">
                    <button className="btn tiny" onClick={() => setEditingId(s.id)}>
                      Sửa
                    </button>
                    <button className="btn tiny danger" onClick={() => remove(s)}>
                      Xóa
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ---------- Nút Excel dạng dropdown (Mẫu / Nhập / Xuất) ----------
function ExcelMenu({
  disabled,
  canExport,
  onSample,
  onImport,
  onExport,
}: {
  disabled: boolean
  canExport: boolean
  onSample: () => void
  onImport: () => void
  onExport: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const pick = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="btn"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        title="Thao tác Excel"
      >
        📊 Excel ▾
      </button>
      {open && (
        <div className="dropdown-menu">
          <button className="dropdown-item" onClick={() => pick(onImport)}>
            ⬆ Nhập từ Excel
          </button>
          <button
            className="dropdown-item"
            onClick={() => pick(onExport)}
            disabled={!canExport}
          >
            ⬇ Xuất ra Excel
          </button>
          <div className="dropdown-sep" />
          <button className="dropdown-item" onClick={() => pick(onSample)}>
            ↓ Tải file mẫu
          </button>
        </div>
      )}
    </div>
  )
}

function toForm(s: StoredSentence): SentenceInput {
  return {
    vi: s.vi,
    en: s.en,
    altAnswers: s.altAnswers ?? [],
    hints: s.hints ?? [],
    level: s.level,
    topic: s.topic ?? '',
  }
}

// ---------- Form thêm / sửa câu ----------
function SentenceForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: SentenceInput
  onSave: (data: SentenceInput) => void
  onCancel: () => void
}) {
  const [vi, setVi] = useState(initial.vi)
  const [en, setEn] = useState(initial.en)
  const [alt, setAlt] = useState((initial.altAnswers ?? []).join('\n'))
  const [hints, setHints] = useState((initial.hints ?? []).join('\n'))
  const [level, setLevel] = useState<CefrLevel | ''>(initial.level ?? '')
  const [topic, setTopic] = useState(initial.topic ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      vi,
      en,
      altAnswers: alt.split('\n'),
      hints: hints.split('\n'),
      level: level || undefined,
      topic,
    })
  }

  return (
    <form className="sentence-form" onSubmit={submit}>
      <label className="sf-field">
        <span>Câu tiếng Việt *</span>
        <input value={vi} onChange={(e) => setVi(e.target.value)} placeholder="VD: Cô ấy sống ở Hà Nội." />
      </label>
      <label className="sf-field">
        <span>Đáp án tiếng Anh *</span>
        <input value={en} onChange={(e) => setEn(e.target.value)} placeholder="VD: She lives in Hanoi." />
      </label>
      <div className="sf-row">
        <label className="sf-field">
          <span>Đáp án khác (mỗi dòng 1 câu)</span>
          <textarea rows={2} value={alt} onChange={(e) => setAlt(e.target.value)} />
        </label>
        <label className="sf-field">
          <span>Gợi ý (mỗi dòng 1 ý)</span>
          <textarea rows={2} value={hints} onChange={(e) => setHints(e.target.value)} />
        </label>
      </div>
      <div className="sf-row">
        <label className="sf-field sf-narrow">
          <span>Cấp độ</span>
          <select value={level} onChange={(e) => setLevel(e.target.value as CefrLevel | '')}>
            <option value="">—</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="sf-field">
          <span>Chủ đề</span>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="VD: Du lịch" />
        </label>
      </div>
      <div className="sf-actions">
        <button type="button" className="btn tiny" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="btn primary">
          Lưu câu
        </button>
      </div>
    </form>
  )
}
