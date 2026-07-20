import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type UIEvent,
} from 'react'
import { type SentenceItem, type CefrLevel } from '../data/sentences'
import { gradeSentence, wrongWordSegments, type GradeResult } from '../services/sentencecheck'
import { suggest, type Suggestion } from '../services/suggestion'
import {
  ensureReady,
  listFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  countByFolder,
  countDoneByFolder,
  listSentences,
  createSentence,
  createSentences,
  updateSentence,
  deleteSentence,
  loadProgress,
  saveProgress,
  clearProgress,
  type Folder,
  type StoredSentence,
  type SentenceInput,
  type PracticeRecord,
} from '../services/cloud/sentenceCloud'
import {
  parseRowsFromExcel,
  downloadSampleExcel,
  exportFolderExcel,
} from '../services/excelImport'
import { translateToEnglish } from '../services/translation'
import { speak, ttsSupported } from '../services/tts'
import '../styles/sentence.css'

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// Màn hẹp (mobile) -> dùng chế độ luyện tập "tập trung" 1 câu/màn.
// Màn rộng (desktop) -> giữ danh sách như cũ.
function useIsNarrow(maxWidth = 860): boolean {
  const [narrow, setNarrow] = useState(
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width:${maxWidth}px)`).matches
      : false,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${maxWidth}px)`)
    const onChange = () => setNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [maxWidth])
  return narrow
}

// ================= TRANG CHÉP CÂU =================
// Bố cục giống Từ vựng: lưới thẻ THƯ MỤC; bấm mở 1 thư mục -> chi tiết
// (Luyện tập / Quản lý câu bên trong). Dữ liệu lưu trên Supabase (đồng bộ đa máy).
export default function SentencePage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  // Số câu ĐÃ LÀM (đã chấm) theo thư mục — hiện "Đã làm x/y" trên thẻ
  const [doneCounts, setDoneCounts] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Folder | null>(null)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Đổi tên thư mục ngay trên thẻ
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const refresh = async () => {
    const [fs, cs, ds] = await Promise.all([
      listFolders(),
      countByFolder(),
      countDoneByFolder().catch(() => ({})), // lỗi -> chỉ ẩn phần "đã làm"
    ])
    setFolders(fs)
    setCounts(cs)
    setDoneCounts(ds)
  }

  // Nạp lần đầu: đảm bảo tài khoản có dữ liệu (migrate/seed nếu cần)
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const fs = await ensureReady()
        if (!alive) return
        setFolders(fs)
        const [cs, ds] = await Promise.all([countByFolder(), countDoneByFolder().catch(() => ({}))])
        if (!alive) return
        setCounts(cs)
        setDoneCounts(ds)
      } catch (e) {
        if (alive) setError(errMsg(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const addFolder = async (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await createFolder(newName)
      setNewName('')
      await refresh()
    } catch (err) {
      alert('Không tạo được thư mục: ' + errMsg(err))
    }
  }

  const startRename = (f: Folder) => {
    setEditingId(f.id)
    setEditName(f.name)
  }
  const saveRename = async () => {
    const id = editingId
    const name = editName.trim()
    setEditingId(null)
    if (!id || !name) return
    try {
      await renameFolder(id, name)
      await refresh()
    } catch (err) {
      alert('Không đổi được tên: ' + errMsg(err))
    }
  }
  const remove = async (f: Folder) => {
    if (!confirm(`Xóa thư mục "${f.name}" và toàn bộ câu bên trong?`)) return
    try {
      await deleteFolder(f.id)
      if (selected?.id === f.id) setSelected(null)
      await refresh()
    } catch (err) {
      alert('Không xóa được: ' + errMsg(err))
    }
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
      <p className="page-sub">Tạo thư mục và quản lý các câu luyện dịch Việt → Anh · đồng bộ đám mây</p>

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

      {loading ? (
        <p className="muted">Đang tải dữ liệu…</p>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>Không tải được dữ liệu</h3>
          <p className="muted">{error}</p>
        </div>
      ) : folders.length === 0 ? (
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
              <div className="deck-desc">
                Đã làm {Math.min(doneCounts[f.id] ?? 0, counts[f.id] ?? 0)}/{counts[f.id] ?? 0} câu
              </div>
              <div className="sc-deck-progress">
                <div
                  className="sc-deck-progress-fill"
                  style={{
                    width: `${
                      counts[f.id]
                        ? Math.round(
                            (Math.min(doneCounts[f.id] ?? 0, counts[f.id]) / counts[f.id]) * 100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
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
  // Bố cục mockup CHỈ dùng cho mobile (màn hẹp); app/web PC giữ giao diện gốc.
  const narrow = useIsNarrow()

  return (
    <div className="page page-wide sentence-page">
      {narrow ? (
        <>
          <div className="sp-head">
            <button className="sp-back" onClick={onBack}>
              ‹ Quay lại
            </button>
            <h1 className="sp-title">{folder.name}</h1>
            <p className="sp-sub">Luyện dịch câu · nhiều cấp độ &amp; chủ đề</p>
          </div>
          <div className="sp-seg">
            <button
              className={mode === 'practice' ? 'on' : ''}
              onClick={() => setMode('practice')}
            >
              Luyện tập
            </button>
            <button className={mode === 'manage' ? 'on' : ''} onClick={() => setMode('manage')}>
              Quản lý
            </button>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Chỉ số câu hiện tại (chế độ tập trung) + id thẻ cần cuộn tới sau khi nạp
  const [cur, setCur] = useState(0)
  const [jumpId, setJumpId] = useState<string | null>(null)
  // Sau khi gõ Enter ĐÚNG -> id câu kế tiếp cần cuộn ra giữa + focus
  const [advanceTo, setAdvanceTo] = useState<string | null>(null)
  // Chế độ NGHE-CHÉP (dictation): nghe TTS đọc câu tiếng Anh rồi gõ lại
  const [dictation, setDictation] = useState(() => localStorage.getItem('sc_dictation') === '1')
  const toggleDictation = (on: boolean) => {
    setDictation(on)
    localStorage.setItem('sc_dictation', on ? '1' : '0')
  }
  // Lọc câu theo cấp độ (A1–C2) / chủ đề
  const [levelF, setLevelF] = useState('')
  const [topicF, setTopicF] = useState('')

  // Bộ đếm số lượt lưu đang chạy -> hiển thị "đang lưu…"
  const pending = useRef(0)
  const [saving, setSaving] = useState(false)
  // Hẹn giờ debounce khi gõ, theo từng câu
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Ref giữ trạng thái mới nhất để callback ổn định (không phụ thuộc state)
  // -> tránh re-render toàn bộ 100 thẻ mỗi lần gõ 1 phím.
  const itemsRef = useRef(items)
  itemsRef.current = items
  const inputsRef = useRef(inputs)
  inputsRef.current = inputs
  const resultsRef = useRef(results)
  resultsRef.current = results
  const revealedRef = useRef(revealed)
  revealedRef.current = revealed

  // Đổi thư mục -> nạp câu + bài đã làm từ cloud, dựng lại trạng thái
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await listSentences(folder.id)
        if (!alive) return
        setItems(list)
        const prog = await loadProgress(list.map((s) => s.id))
        if (!alive) return
        const byId = new Map(list.map((s) => [s.id, s]))
        const ni: Record<string, string> = {}
        const nr: Record<string, GradeResult> = {}
        const nv: Record<string, boolean> = {}
        for (const [sid, rec] of Object.entries(prog)) {
          if (rec.answer) ni[sid] = rec.answer
          if (rec.revealed) nv[sid] = true
          // Đã chấm trước đó -> chấm lại để dựng đủ diff/chính tả/ngữ pháp
          if (rec.status && rec.answer && byId.has(sid)) {
            nr[sid] = gradeSentence(byId.get(sid)!, rec.answer)
          }
        }
        setInputs(ni)
        setResults(nr)
        setRevealed(nv)
        // Nhảy tới câu làm gần nhất (updated_at mới nhất) thay vì luôn ở câu 1
        let lastSid: string | null = null
        let lastAt = 0
        for (const [sid, rec] of Object.entries(prog)) {
          if (byId.has(sid) && (rec.updatedAt ?? 0) > lastAt) {
            lastAt = rec.updatedAt ?? 0
            lastSid = sid
          }
        }
        if (lastSid) {
          const li = list.findIndex((s) => s.id === lastSid)
          if (li > 0) {
            setCur(li) // chế độ tập trung (mobile)
            setJumpId(lastSid) // chế độ danh sách (desktop): cuộn tới thẻ
          }
        }
      } catch (e) {
        if (alive) setError(errMsg(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [folder.id])

  // Dọn hẹn giờ khi rời trang
  useEffect(() => {
    const timers = saveTimers.current
    return () => {
      Object.values(timers).forEach(clearTimeout)
    }
  }, [])

  // Lưu bài 1 câu lên cloud (best-effort, có chỉ báo "đang lưu…"). Ổn định.
  const persist = useCallback((id: string, rec: PracticeRecord) => {
    pending.current += 1
    setSaving(true)
    saveProgress(id, rec)
      .catch(() => {
        /* lỗi mạng -> bỏ qua, lần thao tác sau sẽ ghi lại */
      })
      .finally(() => {
        pending.current -= 1
        if (pending.current <= 0) {
          pending.current = 0
          setSaving(false)
        }
      })
  }, [])

  // Danh sách sau khi lọc theo cấp độ / chủ đề — dùng cho cả 2 chế độ hiển thị
  const levels = useMemo(
    () => LEVELS.filter((l) => items.some((s) => s.level === l)),
    [items],
  )
  const topics = useMemo(
    () => [...new Set(items.map((s) => s.topic).filter(Boolean))] as string[],
    [items],
  )
  const shown = useMemo(
    () =>
      items.filter(
        (s) => (!levelF || s.level === levelF) && (!topicF || s.topic === topicF),
      ),
    [items, levelF, topicF],
  )
  const shownRef = useRef(shown)
  shownRef.current = shown

  const correctCount = useMemo(
    () => shown.filter((s) => results[s.id]?.status === 'correct').length,
    [shown, results],
  )

  // Chế độ tập trung (mobile): chỉ trỏ 1 câu/màn
  const narrow = useIsNarrow()
  const narrowRef = useRef(narrow)
  narrowRef.current = narrow
  // Giữ chỉ số hợp lệ khi danh sách đổi (nạp xong / xóa câu / đổi bộ lọc)
  useEffect(() => {
    setCur((c) => Math.min(Math.max(0, c), Math.max(0, shown.length - 1)))
  }, [shown.length])

  // Chuyển sang câu KẾ TIẾP (sau khi gõ Enter đúng): chế độ tập trung thì đổi
  // chỉ số câu, chế độ danh sách thì đặt id để effect cuộn ra giữa + focus.
  const goToNext = useCallback((fromId: string) => {
    const list = shownRef.current
    const i = list.findIndex((s) => s.id === fromId)
    if (i < 0 || i + 1 >= list.length) return
    const next = list[i + 1]
    if (narrowRef.current) setCur(i + 1)
    setAdvanceTo(next.id)
  }, [])

  // Cuộn câu kế tiếp ra GIỮA màn hình + focus ô nhập. Chạy sau khi DOM đã cập
  // nhật (câu vừa đúng đã hiện khối kết quả) nên căn giữa mới chính xác.
  useEffect(() => {
    if (!advanceTo) return
    const card = document.getElementById(`sc-${advanceTo}`)
    setAdvanceTo(null)
    if (!card) return
    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
    card.querySelector<HTMLTextAreaElement>('.sc-input')?.focus({ preventScroll: true })
  }, [advanceTo])

  // Cuộn tới thẻ của câu làm gần nhất sau khi nạp xong (chế độ danh sách)
  useEffect(() => {
    if (loading || !jumpId) return
    document.getElementById(`sc-${jumpId}`)?.scrollIntoView({ block: 'center' })
    setJumpId(null)
  }, [loading, jumpId])

  // Gõ 1 câu: chỉ cập nhật input của câu đó + hẹn giờ lưu. Callback ổn định
  // nên chỉ thẻ đang gõ re-render, 99 thẻ còn lại bỏ qua (React.memo).
  const setInput = useCallback(
    (id: string, value: string) => {
      setInputs((m) => ({ ...m, [id]: value }))
      const prev = saveTimers.current[id]
      if (prev) clearTimeout(prev)
      saveTimers.current[id] = setTimeout(() => {
        persist(id, {
          answer: value,
          status: resultsRef.current[id]?.status ?? null,
          score: resultsRef.current[id]?.score ?? null,
          revealed: !!revealedRef.current[id],
        })
      }, 800)
    },
    [persist],
  )

  const checkOne = useCallback(
    (id: string, advance = false) => {
      const item = itemsRef.current.find((s) => s.id === id)
      if (!item) return
      const val = (inputsRef.current[id] ?? '').trim()
      if (!val) return
      const gr = gradeSentence(item, val)
      setResults((m) => ({ ...m, [id]: gr }))
      const t = saveTimers.current[id]
      if (t) clearTimeout(t)
      persist(id, {
        answer: inputsRef.current[id] ?? '',
        status: gr.status,
        score: gr.score,
        revealed: !!revealedRef.current[id],
      })
      // Gõ Enter mà ĐÚNG -> tự nhảy sang câu kế tiếp (cuộn ra giữa + focus)
      if (advance && gr.status === 'correct') goToNext(id)
    },
    [persist, goToNext],
  )

  const checkAll = () => {
    const next: Record<string, GradeResult> = {}
    const toSave: { id: string; rec: PracticeRecord }[] = []
    for (const item of shown) {
      const val = (inputs[item.id] ?? '').trim()
      if (!val) continue
      const gr = gradeSentence(item, val)
      next[item.id] = gr
      toSave.push({
        id: item.id,
        rec: {
          answer: inputs[item.id] ?? '',
          status: gr.status,
          score: gr.score,
          revealed: !!revealed[item.id],
        },
      })
    }
    setResults(next)
    toSave.forEach(({ id, rec }) => persist(id, rec))
  }

  const reveal = useCallback(
    (id: string) => {
      setRevealed((m) => ({ ...m, [id]: true }))
      persist(id, {
        answer: inputsRef.current[id] ?? '',
        status: resultsRef.current[id]?.status ?? null,
        score: resultsRef.current[id]?.score ?? null,
        revealed: true,
      })
    },
    [persist],
  )

  const resetProgress = async () => {
    if (!confirm('Làm lại từ đầu? Toàn bộ câu đã gõ và kết quả của thư mục này sẽ bị xóa.')) return
    try {
      await clearProgress(items.map((s) => s.id))
      Object.values(saveTimers.current).forEach(clearTimeout)
      saveTimers.current = {}
      setInputs({})
      setResults({})
      setRevealed({})
    } catch (e) {
      alert('Không xóa được bài: ' + errMsg(e))
    }
  }

  const pct = shown.length ? Math.round((correctCount / shown.length) * 100) : 0

  if (loading) return <p className="muted">Đang tải bài luyện tập…</p>
  if (error) return <p className="muted">⚠️ {error}</p>
  if (items.length === 0) {
    return (
      <p className="muted">
        Thư mục này chưa có câu nào. Chuyển sang tab <strong>Quản lý</strong> để thêm câu.
      </p>
    )
  }

  // Hàng chọn chế độ luyện + lọc theo cấp độ / chủ đề (dùng chung 2 bố cục)
  // MOBILE (mockup): mode chips + filter chips tách hàng.
  // DESKTOP (gốc): thanh lọc gộp một hàng như cũ.
  const filterRow = narrow ? (
    <div className="sp-controls">
      {ttsSupported && (
        <div className="sp-modes">
          <button
            className={!dictation ? 'sp-mode on' : 'sp-mode'}
            onClick={() => toggleDictation(false)}
            title="Nhìn câu tiếng Việt, dịch sang tiếng Anh"
          >
            ✍️ Dịch
          </button>
          <button
            className={dictation ? 'sp-mode on' : 'sp-mode'}
            onClick={() => toggleDictation(true)}
            title="Nghe máy đọc câu tiếng Anh rồi gõ lại (dictation)"
          >
            🎧 Nghe-chép
          </button>
        </div>
      )}
      {(levels.length > 0 || topics.length > 1) && (
        <div className="sp-filters">
          {levels.length > 0 && (
            <>
              <button
                className={levelF === '' ? 'sp-chip on' : 'sp-chip'}
                onClick={() => setLevelF('')}
              >
                Tất cả
              </button>
              {levels.map((l) => (
                <button
                  key={l}
                  className={levelF === l ? 'sp-chip on' : 'sp-chip'}
                  onClick={() => setLevelF(l)}
                >
                  {l}
                </button>
              ))}
            </>
          )}
          {topics.length > 1 && (
            <select
              className="sp-topic"
              value={topicF}
              onChange={(e) => setTopicF(e.target.value)}
              title="Lọc theo chủ đề"
            >
              <option value="">Mọi chủ đề</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  ) : (
    <div className="sp-filter">
      {ttsSupported && (
        <div className="tabs">
          <button
            className={!dictation ? 'tab active' : 'tab'}
            onClick={() => toggleDictation(false)}
            title="Nhìn câu tiếng Việt, dịch sang tiếng Anh"
          >
            ✍️ Dịch
          </button>
          <button
            className={dictation ? 'tab active' : 'tab'}
            onClick={() => toggleDictation(true)}
            title="Nghe máy đọc câu tiếng Anh rồi gõ lại (dictation)"
          >
            🎧 Nghe-chép
          </button>
        </div>
      )}
      {levels.length > 0 && (
        <div className="sp-chipset">
          <button className={levelF === '' ? 'tab active' : 'tab'} onClick={() => setLevelF('')}>
            Tất cả
          </button>
          {levels.map((l) => (
            <button
              key={l}
              className={levelF === l ? 'tab active' : 'tab'}
              onClick={() => setLevelF(l)}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      {topics.length > 1 && (
        <select
          className="level-select"
          value={topicF}
          onChange={(e) => setTopicF(e.target.value)}
          title="Lọc theo chủ đề"
        >
          <option value="">Mọi chủ đề</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      )}
    </div>
  )

  if (shown.length === 0) {
    return (
      <>
        {filterRow}
        <p className="muted">Không có câu nào khớp bộ lọc. Chọn cấp độ/chủ đề khác nhé.</p>
      </>
    )
  }

  // ===== Chế độ TẬP TRUNG (mobile): 1 câu/màn + điều hướng Trước/Tiếp =====
  if (narrow) {
    const idx = Math.min(cur, shown.length - 1)
    const item = shown[idx]
    const done = results[item.id] // đã chấm câu này chưa
    return (
      <div className="practice-focus">
        {filterRow}
        <div className="pf-progress">
          <div className="pf-top">
            <span className="pf-count">
              Câu <strong>{idx + 1}</strong>
              <span className="pf-count-total">/ {shown.length}</span>
            </span>
            <span className="pf-correct">
              <span className="pf-correct-ico">✓</span>
              <strong>{correctCount}</strong> đúng
              {saving && <span className="muted sp-saving"> · đang lưu…</span>}
            </span>
          </div>
          <div className="pf-bar">
            <div
              className="pf-bar-fill"
              style={{ width: `${((idx + 1) / shown.length) * 100}%` }}
            />
          </div>
        </div>

        <SentenceCard
          key={item.id}
          index={idx + 1}
          item={item}
          value={inputs[item.id] ?? ''}
          result={results[item.id]}
          revealed={!!revealed[item.id]}
          dictation={dictation}
          focus
          onChange={setInput}
          onCheck={checkOne}
          onReveal={reveal}
        />

        <div className="pf-nav">
          <button className="btn" disabled={idx === 0} onClick={() => setCur(idx - 1)}>
            ‹ Trước
          </button>
          <button
            className={done ? 'btn primary' : 'btn'}
            disabled={idx >= shown.length - 1}
            onClick={() => setCur(idx + 1)}
          >
            Tiếp ›
          </button>
        </div>

        <div className="pf-tools">
          <button className="btn tiny" onClick={checkAll}>
            Kiểm tra tất cả
          </button>
          <button className="btn tiny" onClick={resetProgress} title="Xóa bài đã làm">
            Làm lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {filterRow}
      <div className="practice-bar">
        <span className="sp-count">
          Đúng <strong>{correctCount}</strong> / {shown.length}
        </span>
        <div className="sp-bar">
          <div className="sp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        {saving && <span className="muted sp-saving">đang lưu…</span>}
        <button className="btn primary" onClick={checkAll}>
          Kiểm tra tất cả
        </button>
        <button className="btn tiny" onClick={resetProgress} title="Xóa bài đã làm và bắt đầu lại">
          Làm lại
        </button>
      </div>

      <div className="sentence-list">
        {shown.map((item, idx) => (
          <SentenceCard
            key={item.id}
            index={idx + 1}
            item={item}
            value={inputs[item.id] ?? ''}
            result={results[item.id]}
            revealed={!!revealed[item.id]}
            dictation={dictation}
            onChange={setInput}
            onCheck={checkOne}
            onReveal={reveal}
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
// Bọc memo + callback ổn định (nhận id) -> gõ ở 1 thẻ không re-render 99 thẻ kia.
const SentenceCard = memo(function SentenceCard({
  index,
  item,
  value,
  result,
  revealed,
  dictation = false,
  focus = false,
  onChange,
  onCheck,
  onReveal,
}: {
  index: number
  item: SentenceItem
  value: string
  result?: GradeResult
  revealed: boolean
  dictation?: boolean // nghe-chép: nghe TTS đọc câu tiếng Anh rồi gõ lại
  focus?: boolean // true = bố cục MOBILE (mockup); false = bố cục DESKTOP gốc
  onChange: (id: string, v: string) => void
  onCheck: (id: string, advance?: boolean) => void
  onReveal: (id: string) => void
}) {
  const suggestEnabled = localStorage.getItem('suggest_enabled') !== '0'
  const taRef = useRef<HTMLTextAreaElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const pendingCaret = useRef<number | null>(null)

  // Sau khi chấm (sai/gần đúng): tô ĐỎ các từ gõ sai vị trí ngay trong ô nhập.
  // Tính lại theo văn bản hiện tại nên tự cập nhật khi người dùng sửa từ.
  const wrongSegs = useMemo(() => {
    if (!result || result.status === 'correct') return null
    return wrongWordSegments(value, result.bestAnswer)
  }, [result, value])
  const showOverlay = !!wrongSegs && wrongSegs.some((s) => s.wrong)

  const [caret, setCaret] = useState(0)
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Chỉ tính gợi ý cho ô ĐANG focus (không chạy nền cho hàng trăm thẻ)
    if (!suggestEnabled || !focused) {
      setSuggestions([])
      setOpen(false)
      return
    }
    const h = setTimeout(() => {
      const list = suggest(value.slice(0, caret))
      setSuggestions(list)
      setActive(0)
      setOpen(list.length > 0)
    }, 120)
    return () => clearTimeout(h)
  }, [value, caret, suggestEnabled, focused])

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
  // Cuộn ô nhập -> cuộn lớp phủ theo để chữ đỏ luôn khớp vị trí
  const syncScroll = (e: UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const accept = (s: Suggestion) => {
    const before = value.slice(0, caret)
    const after = value.slice(caret)
    const typing = before.match(/([A-Za-z]+)$/)
    const base = typing ? before.slice(0, before.length - typing[1].length) : before
    const newBefore = base + s.text + ' '
    pendingCaret.current = newBefore.length
    setOpen(false)
    onChange(item.id, newBefore + after)
  }

  // Chuyển focus sang ô nhập của câu kế tiếp (dir=1) hoặc trước đó (dir=-1)
  const focusSibling = (dir: 1 | -1) => {
    const inputs = Array.from(
      document.querySelectorAll<HTMLTextAreaElement>('.sc-input')
    )
    const cur = taRef.current ? inputs.indexOf(taRef.current) : -1
    const next = inputs[cur + dir]
    if (next) next.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter (không Shift) → kiểm tra đáp án; đúng thì tự nhảy sang câu kế tiếp.
    // Shift+Enter để xuống dòng.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      setOpen(false)
      onCheck(item.id, true)
      return
    }
    // Tab → nếu đang mở gợi ý thì nhận gợi ý, ngược lại nhảy sang ô câu kế tiếp
    // (Shift+Tab quay lại ô trước đó).
    if (e.key === 'Tab') {
      if (!e.shiftKey && open && suggestions.length > 0) {
        e.preventDefault()
        accept(suggestions[active])
        return
      }
      e.preventDefault()
      setOpen(false)
      focusSibling(e.shiftKey ? -1 : 1)
      return
    }
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  const statusClass = result ? `is-${result.status}` : ''
  // Nghe-chép chỉ dùng được khi câu CÓ đáp án tiếng Anh để máy đọc
  const dict = dictation && !!item.en
  // Đề tiếng Việt bị GIẤU khi nghe-chép, chỉ lộ sau khi chấm / xem đáp án
  const hidePrompt = dict && !result && !revealed

  return (
    <div id={`sc-${item.id}`} className={`sentence-card ${statusClass}`}>
      {focus ? (
        /* ===== Bố cục MOBILE (mockup): badge → đề → tag → nhãn ===== */
        <>
          <div className="sc-top">
            <span className="sc-qnum">{index}</span>
            <span className="sc-badge-lang">{dict ? '🎧 NGHE' : '🇻🇳 VN'}</span>
            {dict && (
              <span className="sc-listen">
                <button type="button" className="btn tiny" onClick={() => speak(item.en)}>
                  🔊 Nghe
                </button>
                <button
                  type="button"
                  className="btn tiny"
                  title="Đọc chậm"
                  onClick={() => speak(item.en, 0.65)}
                >
                  🐢 Chậm
                </button>
              </span>
            )}
            {item.level && <span className="sc-level">{item.level}</span>}
          </div>

          {hidePrompt ? (
            <p className="sc-prompt is-muted">Nghe máy đọc rồi gõ lại câu tiếng Anh…</p>
          ) : (
            <p className="sc-prompt">{item.vi}</p>
          )}

          {item.hints && item.hints.length > 0 && !hidePrompt && (
            <div className="sc-tags">
              {item.hints.map((h, i) => (
                <span key={h} className={`sc-tag ${i % 2 ? 'v' : 'g'}`}>
                  <span className="sc-tag-dot" />
                  {h}
                </span>
              ))}
            </div>
          )}

          <div className="sc-ans-label">
            <span className="sc-ans-ico">✎</span>
            {dict ? 'Câu bạn nghe được' : 'Bản dịch của bạn'}
          </div>
        </>
      ) : (
        /* ===== Bố cục DESKTOP (gốc): đề + gợi ý trên cùng một khối ===== */
        <>
          <div className="sc-vi">
            <span className="sc-index">{index}</span>
            <span className="sc-flag">{dict ? '🎧' : '🇻🇳'}</span>
            {hidePrompt ? (
              <span className="sc-vi-text muted">Nghe máy đọc rồi gõ lại câu tiếng Anh…</span>
            ) : (
              <span className="sc-vi-text">{item.vi}</span>
            )}
            {dict && (
              <span className="sc-listen">
                <button type="button" className="btn tiny" onClick={() => speak(item.en)}>
                  🔊 Nghe
                </button>
                <button
                  type="button"
                  className="btn tiny"
                  title="Đọc chậm"
                  onClick={() => speak(item.en, 0.65)}
                >
                  🐢 Chậm
                </button>
              </span>
            )}
            {item.level && <span className="sc-level">{item.level}</span>}
          </div>

          {item.hints && item.hints.length > 0 && !hidePrompt && (
            <div className="sc-hints">
              {item.hints.map((h) => (
                <span key={h} className="sc-hint">
                  💡 {h}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <div className="sc-input-wrap">
        {showOverlay && wrongSegs && (
          <div className="sc-backdrop" ref={backdropRef} aria-hidden="true">
            {wrongSegs.map((s, i) =>
              s.wrong ? (
                <mark className="sc-wrong" key={i}>
                  {s.text}
                </mark>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
            {'\n'}
          </div>
        )}
        <textarea
          ref={taRef}
          className={`sc-input${showOverlay ? ' has-overlay' : ''}`}
          placeholder={
            dict
              ? 'Gõ lại câu bạn nghe được… (Enter để kiểm tra)'
              : 'Nhập câu tiếng Anh của bạn… (Enter để kiểm tra)'
          }
          spellCheck={false}
          rows={2}
          value={value}
          onChange={(e) => {
            onChange(item.id, e.target.value)
            setCaret(e.target.selectionStart)
          }}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            setTimeout(() => setOpen(false), 120)
          }}
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
        <button type="button" className="btn tiny" onClick={() => onReveal(item.id)}>
          Xem đáp án
        </button>
        <button type="button" className="btn primary" onClick={() => onCheck(item.id, true)}>
          Kiểm tra
        </button>
      </div>

      {revealed && !result && (
        <div className="sc-answer">
          Đáp án: <strong>{item.en}</strong>
        </div>
      )}

      {result && <ResultBox item={item} result={result} revealed={revealed} />}
    </div>
  )
})

// ---------- Khối kết quả sau khi chấm ----------
// Chỉ gợi ý MỘT từ kế tiếp — người học tự nghĩ ra phần còn lại.
// Cả câu chỉ hiện khi người dùng chủ động bấm "Xem đáp án".
function ResultBox({
  item,
  result,
  revealed,
}: {
  item: SentenceItem
  result: GradeResult
  revealed: boolean
}) {
  const hint = result.nextWord
  return (
    <div className={`sc-result is-${result.status}`}>
      <div className="sc-status">
        {STATUS_TEXT[result.status]}
        <span className="sc-score">{Math.round(result.score * 100)}%</span>
      </div>

      {result.status !== 'correct' && (
        <div className="sc-compare">
          <span className="sc-compare-label">Gợi ý:</span>
          <span className="sc-next-word">
            {!hint ? (
              'Câu của bạn đủ ý nhưng đang thừa từ — hãy bỏ bớt.'
            ) : hint.okCount > 0 ? (
              <>
                Đúng {hint.okCount} từ đầu · từ tiếp theo là <strong>{hint.word}</strong>
              </>
            ) : (
              <>
                Câu bắt đầu bằng <strong>{hint.word}</strong>
              </>
            )}
          </span>
        </div>
      )}

      {revealed && (
        <div className="sc-answer">
          Đáp án: <strong>{item.en}</strong>
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

// ================= CHẾ ĐỘ QUẢN LÝ =================
const EMPTY_FORM: SentenceInput = { vi: '', en: '', altAnswers: [], hints: [], level: undefined, topic: '' }

function ManageView({ folder, onChanged }: { folder: Folder; onChanged: () => void }) {
  const [items, setItems] = useState<StoredSentence[]>([])
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listSentences(folder.id))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    setEditingId(null)
    setSelected(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder.id])

  const afterMutate = async () => {
    await load()
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
  const deleteSelected = async () => {
    if (selected.size === 0) return
    if (!confirm(`Xóa ${selected.size} câu đã chọn?`)) return
    try {
      for (const id of selected) await deleteSentence(id)
      await afterMutate()
    } catch (e) {
      alert('Xóa thất bại: ' + errMsg(e))
    }
  }

  const save = async (data: SentenceInput, id?: string) => {
    if (!data.vi.trim() || !data.en.trim()) {
      alert('Cần nhập cả câu tiếng Việt và đáp án tiếng Anh.')
      return
    }
    try {
      if (id) await updateSentence(id, data)
      else await createSentence(folder.id, data)
      await afterMutate()
    } catch (e) {
      alert('Lưu câu thất bại: ' + errMsg(e))
    }
  }

  const remove = async (s: StoredSentence) => {
    if (!confirm(`Xóa câu:\n"${s.vi}"?`)) return
    try {
      await deleteSentence(s.id)
      await afterMutate()
    } catch (e) {
      alert('Xóa thất bại: ' + errMsg(e))
    }
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
        altAnswers: r.altAnswers ?? [],
        hints: r.hints ?? [],
        level: (r.level as CefrLevel | undefined) || undefined,
        topic: r.topic,
      })
      setProgress({ done: i + 1, total: parsed.length })
    }
    try {
      const added = await createSentences(folder.id, rows)
      const missing = rows.filter((r) => !r.en.trim()).length
      setImportMsg(
        `✅ Đã thêm ${added} câu` +
          (needTranslate > 0 ? ` · tự dịch ${translated}/${needTranslate} câu thiếu đáp án` : '') +
          (missing > 0 ? ` · còn ${missing} câu chưa có đáp án (hãy sửa thủ công).` : '.'),
      )
      await afterMutate()
    } catch (err) {
      setImportMsg('❌ Lưu lên đám mây thất bại: ' + errMsg(err))
    } finally {
      setImporting(false)
    }
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

      {loading ? (
        <p className="muted">Đang tải câu…</p>
      ) : error ? (
        <p className="muted">⚠️ {error}</p>
      ) : items.length === 0 && editingId !== 'new' ? (
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
