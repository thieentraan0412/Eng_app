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
import Icon from '../components/Icon'
import { type SentenceItem, type CefrLevel } from '../data/sentences'
import { errText } from '../services/cloud/cloudError'
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
  countCorrectByFolder,
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

// Số câu hiện lúc đầu ở tab Luyện tập — phần còn lại mở bằng nút "Hiện thêm"
const PAGE_SIZE = 20

const errMsg = errText

// Ô luyện dịch chỉ nhận tiếng Anh: giữ chữ Latin ASCII, số, xuống dòng và
// dấu câu; chuẩn hóa một số dấu câu “thông minh” thường gặp khi dán văn bản.
// Chữ có dấu (bộ gõ tiếng Việt đang bật, hoặc dán văn bản tiếng Việt) được HẠ
// DẤU về chữ cái gốc chứ không xóa — xóa thẳng thì chữ tự dưng biến mất,
// người gõ tưởng ô nhập hỏng.
function sanitizeEnglishInput(value: string): string {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\x20-\x7E\n]/g, '')
}

// Màn hẹp (mobile) -> dùng chế độ luyện tập "tập trung" 1 câu/màn.
// Màn rộng (desktop) -> giữ danh sách như mockup thu-muc.html.
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

function alignAnswerToVisualViewport(answer: HTMLTextAreaElement): void {
  if (!window.matchMedia('(max-width:860px)').matches || !answer.isConnected) return
  const scrollHost = answer.closest<HTMLElement>('.content')
  if (!scrollHost) return
  const viewport = window.visualViewport
  const visibleTop = viewport?.offsetTop ?? 0
  const visibleHeight = viewport?.height ?? window.innerHeight
  const rect = answer.getBoundingClientRect()
  const idealTop = visibleTop + Math.min(250, Math.max(116, visibleHeight * 0.45))
  const latestTop = visibleTop + visibleHeight - rect.height - 18
  scrollHost.scrollBy({ top: rect.top - Math.min(idealTop, latestTop), behavior: 'auto' })
}

function settleFocusedAnswer(answer: HTMLTextAreaElement): void {
  const align = () => {
    if (document.activeElement === answer) alignAnswerToVisualViewport(answer)
  }
  window.requestAnimationFrame(align)
  window.setTimeout(align, 120)
  window.setTimeout(align, 320)
}

// ================= TRANG CHÉP CÂU =================
// Bố cục theo mockup 08-chep-cau/index.html: lưới thẻ THƯ MỤC + ô "Tạo thư
// mục mới"; bấm mở 1 thư mục -> chi tiết (Luyện tập / Quản lý câu bên trong).
// Dữ liệu lưu trên Supabase (đồng bộ đa máy).
export default function SentencePage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  // Số câu ĐÃ LÀM (đã chấm) / ĐÚNG theo thư mục — hiện trên thẻ
  const [doneCounts, setDoneCounts] = useState<Record<string, number>>({})
  const [correctCounts, setCorrectCounts] = useState<Record<string, number>>({})
  const [selected, setSelected] = useState<Folder | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Đổi tên thư mục ngay trên thẻ
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingRenameId, setSavingRenameId] = useState<string | null>(null)
  const renameInFlight = useRef<string | null>(null)

  const refresh = async () => {
    const [fs, cs, ds, ok] = await Promise.all([
      listFolders(),
      countByFolder(),
      countDoneByFolder().catch(() => ({})), // lỗi -> chỉ ẩn phần "đã làm"
      countCorrectByFolder().catch(() => ({})),
    ])
    setFolders(fs)
    setCounts(cs)
    setDoneCounts(ds)
    setCorrectCounts(ok)
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
        const [cs, ds, ok] = await Promise.all([
          countByFolder(),
          countDoneByFolder().catch(() => ({})),
          countCorrectByFolder().catch(() => ({})),
        ])
        if (!alive) return
        setCounts(cs)
        setDoneCounts(ds)
        setCorrectCounts(ok)
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

  const openCreate = () => {
    setCreating(true)
    window.setTimeout(() => document.getElementById('ccNewFolder')?.focus(), 0)
  }

  const addFolder = async (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await createFolder(newName)
      setNewName('')
      setCreating(false)
      await refresh()
    } catch (err) {
      alert('Không tạo được thư mục: ' + errMsg(err))
    }
  }

  const startRename = (f: Folder) => {
    if (renameInFlight.current) return
    setEditingId(f.id)
    setEditName(f.name)
  }
  const cancelRename = () => {
    if (renameInFlight.current) return
    setEditingId(null)
    setEditName('')
  }
  const saveRename = async (folderId = editingId) => {
    const id = folderId
    const name = editName.trim()
    if (!id || renameInFlight.current) return

    const current = folders.find((folder) => folder.id === id)
    if (!name || current?.name === name) {
      cancelRename()
      return
    }

    renameInFlight.current = id
    setSavingRenameId(id)
    setFolders((items) =>
      items.map((folder) => (folder.id === id ? { ...folder, name } : folder)),
    )
    setEditingId((editing) => (editing === id ? null : editing))
    try {
      const updated = await renameFolder(id, name)
      setFolders((items) => items.map((folder) => (folder.id === updated.id ? updated : folder)))
      setEditName('')
    } catch (err) {
      if (current) {
        setFolders((items) => items.map((folder) => (folder.id === id ? current : folder)))
      }
      setEditingId(id)
      setEditName(name)
      alert('Không đổi được tên: ' + errMsg(err))
    } finally {
      renameInFlight.current = null
      setSavingRenameId(null)
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
        total={counts[selected.id] ?? 0}
        done={doneCounts[selected.id] ?? 0}
        correct={correctCounts[selected.id] ?? 0}
        onBack={() => {
          setSelected(null)
          refresh()
        }}
      />
    )
  }

  return (
    <div className="page cc-page">
      <div className="cc-head">
        <div>
          <h1>Chép câu</h1>
          <p>
            Tạo thư mục và quản lý các câu luyện dịch Việt → Anh. Dữ liệu đồng bộ đám mây.
          </p>
        </div>
        <div className="cc-head-actions">
          <button className="cc-btn cc-btn-primary" onClick={openCreate}>
            <Icon name="plus" /> Tạo thư mục
          </button>
        </div>
      </div>

      {creating && (
        <form className="cc-create" onSubmit={addFolder}>
          <input
            id="ccNewFolder"
            className="cc-input"
            placeholder="Tên thư mục mới (VD: Session 2)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setCreating(false)}
          />
          <button className="cc-btn cc-btn-primary" type="submit">
            <Icon name="plus" /> Tạo thư mục
          </button>
          <button className="cc-btn cc-btn-ghost" type="button" onClick={() => setCreating(false)}>
            Hủy
          </button>
        </form>
      )}

      {loading ? (
        <p className="cc-loading">Đang tải dữ liệu…</p>
      ) : error ? (
        <div className="cc-empty">
          <Icon name="alert" />
          <b>Không tải được dữ liệu</b>
          <p>{error}</p>
        </div>
      ) : folders.length === 0 ? (
        <div className="cc-empty">
          <Icon name="folder" />
          <b>Chưa có thư mục nào</b>
          <p>Tạo thư mục đầu tiên để nhóm các câu luyện dịch theo buổi học hoặc trình độ.</p>
        </div>
      ) : (
        <section className="cc-grid">
          {folders.map((f) => {
            const total = counts[f.id] ?? 0
            const done = Math.min(doneCounts[f.id] ?? 0, total)
            const ok = Math.min(correctCounts[f.id] ?? 0, total)
            const isEditing = editingId === f.id
            const isSavingRename = savingRenameId === f.id
            return (
              <div
                key={f.id}
                className={isEditing ? 'cc-deck is-renaming' : 'cc-deck'}
                role="button"
                tabIndex={0}
                aria-busy={isSavingRename || undefined}
                onClick={() => (editingId ? undefined : setSelected(f))}
                onBlur={(e) => {
                  if (isEditing && !e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    void saveRename(f.id)
                  }
                }}
                onKeyDown={(e) => {
                  if (!editingId && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    setSelected(f)
                  }
                }}
              >
                <span className="cc-deck-tools">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="cc-ibtn cc-rename-save"
                        title={isSavingRename ? 'Đang lưu…' : 'Lưu tên mới'}
                        aria-label={isSavingRename ? 'Đang lưu tên mới' : 'Lưu tên mới'}
                        disabled={isSavingRename}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation()
                          void saveRename(f.id)
                        }}
                      >
                        <Icon name="check" />
                      </button>
                      <button
                        type="button"
                        className="cc-ibtn"
                        title="Hủy đổi tên"
                        aria-label="Hủy đổi tên"
                        disabled={isSavingRename}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation()
                          cancelRename()
                        }}
                      >
                        <Icon name="x" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="cc-ibtn"
                        title="Đổi tên thư mục"
                        onClick={(e) => {
                          e.stopPropagation()
                          startRename(f)
                        }}
                      >
                        <Icon name="pencil" />
                      </button>
                      <button
                        type="button"
                        className="cc-ibtn danger"
                        title="Xóa thư mục"
                        onClick={(e) => {
                          e.stopPropagation()
                          remove(f)
                        }}
                      >
                        <Icon name="trash" />
                      </button>
                    </>
                  )}
                </span>

                <span className="cc-deck-top">
                  <span className="cc-deck-mark">
                    <Icon name="folder" />
                  </span>
                  <span className="cc-deck-txt">
                    {isEditing ? (
                      <input
                        className="cc-input cc-rename"
                        autoFocus
                        value={editName}
                        disabled={isSavingRename}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.nativeEvent.isComposing) return
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void saveRename(f.id)
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            cancelRename()
                          }
                        }}
                      />
                    ) : (
                      <span className="cc-deck-name">{f.name}</span>
                    )}
                    <span className="cc-deck-desc">
                      Đã làm {done} / {total} câu
                    </span>
                  </span>
                </span>

                <span className="cc-bar">
                  <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                </span>

                <span className="cc-deck-meta">
                  {done > 0 ? (
                    <span className="cc-badge cc-badge-ok">
                      <Icon name="check" /> Đã làm {done}/{total} · {ok} đúng
                    </span>
                  ) : (
                    <span className="cc-badge">Đã làm 0/{total} câu</span>
                  )}
                  <span className="cc-deck-go">
                    Mở thư mục <Icon name="right" />
                  </span>
                </span>
              </div>
            )
          })}

          <button className="cc-new-folder" onClick={openCreate}>
            <Icon name="plus" />
            <b>Tạo thư mục mới</b>
            <span>Nhóm câu luyện dịch theo buổi học hoặc trình độ</span>
          </button>
        </section>
      )}
    </div>
  )
}

interface FolderStats {
  total: number
  done: number
  correct: number
}

// ================= CHI TIẾT MỘT THƯ MỤC =================
function FolderDetail({
  folder,
  total,
  done,
  correct,
  onBack,
}: {
  folder: Folder
  total: number
  done: number
  correct: number
  onBack: () => void
}) {
  const [mode, setMode] = useState<'practice' | 'manage'>('practice')
  // Số liệu ở phụ đề: lấy tạm từ lưới thư mục, cập nhật theo phiên luyện tập
  const [stats, setStats] = useState<FolderStats>({ total, done, correct })

  return (
    <div className="page cc-page cc-detail">
      <button className="cc-crumb" onClick={onBack}>
        <Icon name="left" /> Tất cả thư mục
      </button>

      <div className="cc-head">
        <div>
          <h1>{folder.name}</h1>
          <p>
            {stats.total} câu luyện dịch Việt → Anh · đã làm {Math.min(stats.done, stats.total)} ·
            đúng {Math.min(stats.correct, stats.total)}
          </p>
        </div>
      </div>

      <nav className="cc-tabs">
        <button
          className={mode === 'practice' ? 'is-active' : ''}
          onClick={() => setMode('practice')}
        >
          Luyện tập
        </button>
        <button className={mode === 'manage' ? 'is-active' : ''} onClick={() => setMode('manage')}>
          Quản lý câu
        </button>
      </nav>

      {mode === 'practice' ? (
        <PracticeView folder={folder} onStats={setStats} />
      ) : (
        <ManageView folder={folder} />
      )}
    </div>
  )
}

// ================= CHẾ ĐỘ LUYỆN TẬP =================
function PracticeView({
  folder,
  onStats,
}: {
  folder: Folder
  onStats: (s: FolderStats) => void
}) {
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
  const focusMoveRef = useRef(0)
  // Số câu đang hiện trong danh sách (mockup: nút "Hiện thêm (… câu còn lại)")
  const [limit, setLimit] = useState(PAGE_SIZE)
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
            // Mở đủ số câu để thẻ cần cuộn tới đã được render
            setLimit(Math.max(PAGE_SIZE, Math.ceil((li + 1) / PAGE_SIZE) * PAGE_SIZE))
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

  // Lưu bài 1 câu lên cloud — ÂM THẦM, không hiện chỉ báo nào.
  // Trước đây có dòng "đang lưu…" hiện/ẩn liên tục khi gõ, làm hàng tiến độ
  // co giãn và cả trang nhảy lên nhảy xuống trên điện thoại.
  const persist = useCallback((id: string, rec: PracticeRecord) => {
    saveProgress(id, rec).catch(() => {
      /* lỗi mạng -> bỏ qua, lần thao tác sau sẽ ghi lại */
    })
  }, [])

  // Danh sách sau khi lọc theo cấp độ / chủ đề — dùng cho cả 2 chế độ hiển thị
  const levels = useMemo(() => LEVELS.filter((l) => items.some((s) => s.level === l)), [items])
  const topics = useMemo(
    () => [...new Set(items.map((s) => s.topic).filter(Boolean))] as string[],
    [items],
  )
  const shown = useMemo(
    () => items.filter((s) => (!levelF || s.level === levelF) && (!topicF || s.topic === topicF)),
    [items, levelF, topicF],
  )
  const shownRef = useRef(shown)
  shownRef.current = shown

  const correctCount = useMemo(
    () => shown.filter((s) => results[s.id]?.status === 'correct').length,
    [shown, results],
  )

  // Báo số liệu lên phụ đề của thư mục (đã làm / đúng)
  useEffect(() => {
    onStats({
      total: items.length,
      done: items.filter((s) => results[s.id]).length,
      correct: items.filter((s) => results[s.id]?.status === 'correct').length,
    })
  }, [items, results, onStats])

  // Chế độ tập trung (mobile): chỉ trỏ 1 câu/màn
  const narrow = useIsNarrow()
  const narrowRef = useRef(narrow)
  narrowRef.current = narrow
  // Giữ chỉ số hợp lệ khi danh sách đổi (nạp xong / xóa câu / đổi bộ lọc)
  useEffect(() => {
    setCur((c) => Math.min(Math.max(0, c), Math.max(0, shown.length - 1)))
  }, [shown.length])
  // Đổi bộ lọc -> danh sách hiện lại từ đầu
  useEffect(() => {
    setLimit(PAGE_SIZE)
  }, [levelF, topicF])

  // Chuyển sang câu KẾ TIẾP (sau khi gõ Enter đúng): chế độ tập trung thì đổi
  // chỉ số câu, chế độ danh sách thì đặt id để effect cuộn ra giữa + focus.
  const goToNext = useCallback((fromId: string) => {
    const list = shownRef.current
    const i = list.findIndex((s) => s.id === fromId)
    if (i < 0 || i + 1 >= list.length) return
    const next = list[i + 1]
    if (narrowRef.current) setCur(i + 1)
    // Câu kế tiếp có thể đang nằm ngoài phần đã hiện -> mở thêm cho đủ
    setLimit((l) => (i + 2 > l ? Math.ceil((i + 2) / PAGE_SIZE) * PAGE_SIZE : l))
    setAdvanceTo(next.id)
  }, [])

  // Focus câu mới và đặt ô nhập vào vùng nhìn thấy phía trên bàn phím ảo.
  // visualViewport phản ánh phần màn hình thật còn lại trên Safari/Chrome mobile,
  // trong khi scrollIntoView(block:center) chỉ căn theo layout viewport nên dễ
  // đẩy textarea xuống sát hoặc lọt sau bàn phím.
  useEffect(() => {
    if (!advanceTo) return
    const card = document.getElementById(`cc-${advanceTo}`)
    if (!card) {
      setAdvanceTo(null)
      return
    }

    const token = ++focusMoveRef.current
    const answer = card.querySelector<HTMLTextAreaElement>('.cc-answer')
    answer?.focus({ preventScroll: true })

    const alignAnswer = () => {
      if (token !== focusMoveRef.current || !answer?.isConnected) return
      // Đặt ô nhập ở khoảng 45% vùng nhìn thấy: còn đủ chỗ đọc đề ở trên và
      // gợi ý/đáp án ở dưới, kể cả khi bàn phím đang mở.
      alignAnswerToVisualViewport(answer)
    }

    const frame = window.requestAnimationFrame(alignAnswer)
    const afterKeyboardStarts = window.setTimeout(alignAnswer, 120)
    const afterKeyboardSettles = window.setTimeout(alignAnswer, 320)
    const finish = window.setTimeout(() => setAdvanceTo(null), 400)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(afterKeyboardStarts)
      window.clearTimeout(afterKeyboardSettles)
      window.clearTimeout(finish)
    }
  }, [advanceTo])

  // Cuộn tới thẻ của câu làm gần nhất sau khi nạp xong (chế độ danh sách)
  useEffect(() => {
    if (loading || !jumpId) return
    document.getElementById(`cc-${jumpId}`)?.scrollIntoView({ block: 'center' })
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
    // Gộp thay vì thay cả map: kết quả của câu đang bị bộ lọc ẩn (hoặc câu chưa
    // gõ gì) không bị mất khi bấm "Kiểm tra tất cả".
    setResults((m) => ({ ...m, ...next }))
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

  if (loading) return <p className="cc-loading">Đang tải bài luyện tập…</p>
  if (error) {
    return (
      <div className="cc-empty">
        <Icon name="alert" />
        <b>Không tải được bài luyện tập</b>
        <p>{error}</p>
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="cc-empty">
        <Icon name="file" />
        <b>Thư mục này chưa có câu nào</b>
        <p>Chuyển sang tab “Quản lý câu” để thêm câu hoặc nhập từ file Excel.</p>
      </div>
    )
  }

  // Hàng lọc: kiểu luyện (Dịch / Nghe–chép) · chip cấp độ · chọn chủ đề
  const filterRow = (
    <div className="cc-filters">
      {ttsSupported && (
        <div className="cc-seg">
          <button
            className={!dictation ? 'is-active' : ''}
            onClick={() => toggleDictation(false)}
            title="Nhìn câu tiếng Việt, dịch sang tiếng Anh"
          >
            <Icon name="pen" /> Dịch
          </button>
          <button
            className={dictation ? 'is-active' : ''}
            onClick={() => toggleDictation(true)}
            title="Nghe máy đọc câu tiếng Anh rồi gõ lại (dictation)"
          >
            <Icon name="headphone" /> Nghe–chép
          </button>
        </div>
      )}
      {levels.length > 0 && (
        <div className="cc-chipset">
          <button
            className={levelF === '' ? 'cc-chip is-active' : 'cc-chip'}
            onClick={() => setLevelF('')}
          >
            Tất cả
          </button>
          {levels.map((l) => (
            <button
              key={l}
              className={levelF === l ? 'cc-chip is-active' : 'cc-chip'}
              onClick={() => setLevelF(l)}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      <div className="cc-spacer" />
      {topics.length > 1 && (
        <select
          className="cc-select"
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
        <div className="cc-empty">
          <Icon name="search" />
          <b>Không có câu nào khớp bộ lọc</b>
          <p>Chọn cấp độ hoặc chủ đề khác nhé.</p>
        </div>
      </>
    )
  }

  // ===== Chế độ TẬP TRUNG (mobile): 1 câu/màn + điều hướng Trước/Tiếp =====
  if (narrow) {
    const idx = Math.min(cur, shown.length - 1)
    const item = shown[idx]
    return (
      <div className="cc-focus">
        {filterRow}
        <div className="cc-progress">
          <span className="cc-pb-num">
            Câu <b>{idx + 1}</b> / {shown.length}
          </span>
          <span className="cc-bar cc-bar-ok cc-bar-lg">
            <i style={{ width: `${((idx + 1) / shown.length) * 100}%` }} />
          </span>
          <span className="cc-pb-num">
            <b>{correctCount}</b> đúng
          </span>
        </div>

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

        <div className="cc-focus-nav">
          <button
            className="cc-btn"
            disabled={idx === 0}
            onClick={() => {
              const previous = shown[idx - 1]
              if (!previous) return
              setCur(idx - 1)
              setAdvanceTo(previous.id)
            }}
          >
            <Icon name="left" /> Trước
          </button>
          <button
            className="cc-btn"
            disabled={idx >= shown.length - 1}
            onClick={() => {
              const next = shown[idx + 1]
              if (!next) return
              setCur(idx + 1)
              setAdvanceTo(next.id)
            }}
          >
            Tiếp <Icon name="right" />
          </button>
        </div>

        <div className="cc-focus-tools">
          <button className="cc-btn cc-btn-sm" onClick={checkAll}>
            <Icon name="check" /> Kiểm tra tất cả
          </button>
          <button
            className="cc-btn cc-btn-sm"
            onClick={resetProgress}
            title="Xóa bài đã làm của thư mục này"
          >
            <Icon name="refresh" /> Làm lại
          </button>
        </div>
      </div>
    )
  }

  const rest = shown.length - Math.min(limit, shown.length)

  return (
    <>
      {filterRow}

      <div className="cc-progress">
        <span className="cc-pb-num">
          <b>{correctCount}</b> đúng / {shown.length}
        </span>
        <span className="cc-bar cc-bar-ok cc-bar-lg">
          <i style={{ width: `${pct}%` }} />
        </span>
        <button className="cc-btn cc-btn-primary cc-btn-sm" onClick={checkAll}>
          <Icon name="check" /> Kiểm tra tất cả
        </button>
        <button
          className="cc-btn cc-btn-sm"
          onClick={resetProgress}
          title="Xóa bài đã làm và bắt đầu lại"
        >
          <Icon name="refresh" /> Làm lại
        </button>
      </div>

      <section>
        {shown.slice(0, limit).map((item, idx) => (
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
      </section>

      {rest > 0 && (
        <div className="cc-more">
          <button className="cc-btn" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            <Icon name="down" /> Hiện thêm ({rest} câu còn lại)
          </button>
        </div>
      )}
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
  correct: 'Đúng',
  close: 'Gần đúng',
  wrong: 'Chưa đúng',
}
const STATUS_BADGE: Record<GradeResult['status'], string> = {
  correct: 'cc-badge cc-badge-ok',
  close: 'cc-badge cc-badge-warn',
  wrong: 'cc-badge cc-badge-err',
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
  onChange: (id: string, v: string) => void
  onCheck: (id: string, advance?: boolean) => void
  onReveal: (id: string) => void
}) {
  const suggestEnabled = localStorage.getItem('suggest_enabled') !== '0'
  const taRef = useRef<HTMLTextAreaElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const pendingCaret = useRef<number | null>(null)
  // Bộ gõ (tiếng Việt, tiếng Nhật…) đang soạn dở một chữ: cấm đụng vào giá trị
  // ô nhập cho tới khi soạn xong, nếu không chữ sẽ bị nuốt và chèn lặp.
  const composing = useRef(false)

  const [caret, setCaret] = useState(0)
  const [focused, setFocused] = useState(false)

  // Sau khi chấm (sai/gần đúng): tô ĐỎ các từ gõ sai vị trí ngay trong ô nhập.
  // Tính lại theo văn bản hiện tại nên tự cập nhật khi người dùng sửa từ.
  const wrongSegs = useMemo(() => {
    if (!result || result.status === 'correct') return null
    return wrongWordSegments(value, result.bestAnswer)
  }, [result, value])
  // Giữ lớp đánh dấu cả khi đang focus để vị trí sai luôn hiện đỏ ngay trong ô.
  const showOverlay = !!wrongSegs && wrongSegs.some((s) => s.wrong)
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
    const inputs = Array.from(document.querySelectorAll<HTMLTextAreaElement>('.cc-answer'))
    const cur = taRef.current ? inputs.indexOf(taRef.current) : -1
    const next = inputs[cur + dir]
    if (next) next.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter/Tab lúc bộ gõ đang chọn chữ là để CHỐT chữ đó, không phải để chấm bài
    if (composing.current || (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing) {
      return
    }
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

  const statusClass = result ? ` is-${result.status}` : ''
  // Nghe-chép chỉ dùng được khi câu CÓ đáp án tiếng Anh để máy đọc
  const dict = dictation && !!item.en
  // Đề tiếng Việt bị GIẤU khi nghe-chép, chỉ lộ sau khi chấm / xem đáp án
  const hidePrompt = dict && !result && !revealed

  return (
    <article id={`cc-${item.id}`} className={`cc-sent${statusClass}`}>
      <div className="cc-sent-vi">
        <span className="cc-sent-i">{index}</span>
        <span className={hidePrompt ? 'cc-sent-txt is-hidden' : 'cc-sent-txt'}>
          {hidePrompt ? 'Nghe máy đọc rồi gõ lại câu tiếng Anh…' : item.vi}
        </span>
        {dict && (
          <span className="cc-listen">
            <button type="button" className="cc-btn cc-btn-sm" onClick={() => speak(item.en)}>
              <Icon name="speak" /> Nghe
            </button>
            <button
              type="button"
              className="cc-btn cc-btn-sm"
              title="Đọc chậm"
              onClick={() => speak(item.en, 0.65)}
            >
              <Icon name="clock" /> Chậm
            </button>
          </span>
        )}
        {item.level && <span className="cc-badge">{item.level}</span>}
      </div>

      {item.hints && item.hints.length > 0 && !hidePrompt && (
        <div className="cc-hints">
          {item.hints.map((h) => (
            <span key={h} className="cc-hint">
              <Icon name="bulb" /> {h}
            </span>
          ))}
        </div>
      )}

      <div className="cc-input-wrap">
        {showOverlay && wrongSegs && (
          <div className="cc-backdrop" ref={backdropRef} aria-hidden="true">
            {wrongSegs.map((s, i) =>
              s.wrong ? (
                <mark className="cc-wrong" key={i}>
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
          className={`cc-answer${showOverlay ? ' has-overlay' : ''}`}
          placeholder={
            dict
              ? 'Gõ lại câu bạn nghe được… (Enter để kiểm tra)'
              : 'Nhập câu tiếng Anh của bạn… (Enter để kiểm tra)'
          }
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          data-lpignore="true"
          data-form-type="other"
          name="cc-translation"
          rows={2}
          value={value}
          onChange={(e) => {
            const raw = e.target.value
            // Đang soạn dở bằng bộ gõ -> nhận nguyên chuỗi thô, lọc sau khi chốt
            const isComposing =
              composing.current || Boolean((e.nativeEvent as InputEvent).isComposing)
            const nextValue = isComposing ? raw : sanitizeEnglishInput(raw)
            onChange(item.id, nextValue)
            setCaret(Math.min(e.target.selectionStart, nextValue.length))
          }}
          onCompositionStart={() => {
            composing.current = true
          }}
          onCompositionEnd={(e) => {
            composing.current = false
            const el = e.currentTarget
            const nextValue = sanitizeEnglishInput(el.value)
            onChange(item.id, nextValue)
            setCaret(Math.min(el.selectionStart, nextValue.length))
          }}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
          onFocus={(e) => {
            setFocused(true)
            settleFocusedAnswer(e.currentTarget)
          }}
          onBlur={() => {
            setFocused(false)
            setTimeout(() => setOpen(false), 120)
          }}
        />
        {suggestEnabled && open && suggestions.length > 0 && (
          <ul className="cc-suggest" role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={s.text + i}
                role="option"
                aria-selected={i === active}
                className={`cc-suggest-item ${s.type} ${i === active ? 'active' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  accept(s)
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="cc-suggest-icon">{SUGGEST_ICON[s.type]}</span>
                {s.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="cc-sent-actions">
        <button
          type="button"
          className="cc-btn cc-btn-primary cc-btn-sm"
          onClick={() => onCheck(item.id, true)}
        >
          <Icon name="check" /> Kiểm tra
        </button>
        <button type="button" className="cc-btn cc-btn-sm" onClick={() => onReveal(item.id)}>
          <Icon name="eye" /> Xem đáp án
        </button>
      </div>

      {revealed && !result && (
        <div className="cc-result">
          <span className="cc-note cc-reveal">
            Đáp án: <strong>{item.en}</strong>
          </span>
        </div>
      )}

      {result && <ResultRow item={item} result={result} revealed={revealed} />}
    </article>
  )
})

// ---------- Hàng kết quả sau khi chấm (mockup .sent-result) ----------
// Chỉ gợi ý MỘT từ kế tiếp — người học tự nghĩ ra phần còn lại.
// Cả câu chỉ hiện khi người dùng chủ động bấm "Xem đáp án".
function ResultRow({
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
    <div className="cc-result">
      <span className={STATUS_BADGE[result.status]}>
        {result.status === 'correct' && <Icon name="check" />}
        {STATUS_TEXT[result.status]} · {Math.round(result.score * 100)}%
      </span>

      {result.status !== 'correct' && (
        <span className="cc-note cc-next-word">
          <span className="cc-note-key">Gợi ý:</span>{' '}
          {!hint ? (
            'câu của bạn đủ ý nhưng đang thừa từ — hãy bỏ bớt.'
          ) : hint.okCount > 0 ? (
            <>
              đúng {hint.okCount} từ đầu · từ tiếp theo là <strong>{hint.word}</strong>
            </>
          ) : (
            <>
              câu bắt đầu bằng <strong>{hint.word}</strong>
            </>
          )}
        </span>
      )}

      {revealed && (
        <span className="cc-note cc-reveal">
          Đáp án: <strong>{item.en}</strong>
        </span>
      )}

      {result.spell.length > 0 && (
        <span className="cc-note">
          <span className="cc-note-key">Chính tả:</span>{' '}
          {result.spell.map((s, i) => (
            <span key={s.word}>
              {i > 0 && ', '}
              <b>{s.word}</b>
              {s.suggestions.length > 0 && <em> → {s.suggestions.join(', ')}</em>}
            </span>
          ))}
        </span>
      )}

      {result.grammar.length > 0 && (
        <span className="cc-note">
          <span className="cc-note-key">Ngữ pháp:</span>{' '}
          {result.grammar.map((g, i) => (
            <span key={i} title={g.message}>
              {i > 0 && ', '}
              <b>{g.errorText || '⚠'}</b>
              {g.replacements.length > 0 && <em> → {g.replacements[0]}</em>}
            </span>
          ))}
        </span>
      )}
    </div>
  )
}

// ================= CHẾ ĐỘ QUẢN LÝ =================
const EMPTY_FORM: SentenceInput = {
  vi: '',
  en: '',
  altAnswers: [],
  hints: [],
  level: undefined,
  topic: '',
}

function ManageView({ folder }: { folder: Folder }) {
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
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={onPickFile}
      />

      <div className="cc-manage-head">
        <h2 className="cc-manage-title">
          Quản lý câu <span>· {items.length} câu</span>
        </h2>
        <div className="cc-manage-actions">
          <ExcelMenu
            disabled={importing}
            canExport={items.length > 0}
            onSample={() => downloadSampleExcel()}
            onImport={() => fileRef.current?.click()}
            onExport={() => exportFolderExcel(folder.name, items)}
          />
          {editingId !== 'new' && (
            <button
              className="cc-btn cc-btn-primary"
              onClick={() => setEditingId('new')}
              disabled={importing}
            >
              <Icon name="plus" /> Thêm câu
            </button>
          )}
        </div>
      </div>

      {importing && (
        <div className="cc-import">
          <span>
            Đang dịch &amp; nhập… {progress.done}/{progress.total}
          </span>
          <span className="cc-bar cc-bar-lg">
            <i style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
          </span>
        </div>
      )}
      {importMsg && !importing && <div className="cc-import-msg">{importMsg}</div>}

      {editingId === 'new' && (
        <SentenceForm
          key="new"
          initial={EMPTY_FORM}
          onSave={(d) => save(d)}
          onCancel={() => setEditingId(null)}
        />
      )}

      {loading ? (
        <p className="cc-loading">Đang tải câu…</p>
      ) : error ? (
        <div className="cc-empty">
          <Icon name="alert" />
          <b>Không tải được danh sách câu</b>
          <p>{error}</p>
        </div>
      ) : items.length === 0 && editingId !== 'new' ? (
        <div className="cc-empty">
          <Icon name="file" />
          <b>Chưa có câu nào</b>
          <p>Bấm “Thêm câu” để nhập tay, hoặc dùng menu Excel để nhập hàng loạt.</p>
        </div>
      ) : (
        <>
          {items.length > 0 && (
            <div className="cc-manage-toolbar">
              <label className="cc-check">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                Chọn tất cả
              </label>
              {selected.size > 0 && (
                <>
                  <span>{selected.size} đã chọn</span>
                  <button className="cc-btn cc-btn-sm cc-btn-danger" onClick={deleteSelected}>
                    <Icon name="trash" /> Xóa đã chọn ({selected.size})
                  </button>
                </>
              )}
            </div>
          )}

          <div className="cc-list">
            {items.map((s, i) =>
              editingId === s.id ? (
                <SentenceForm
                  key={s.id}
                  initial={toForm(s)}
                  onSave={(d) => save(d, s.id)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={s.id} className={`cc-row${selected.has(s.id) ? ' is-selected' : ''}`}>
                  <label className="cc-check">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                    />
                  </label>
                  <div className="cc-row-num">{i + 1}</div>
                  <div className="cc-row-body">
                    <div className="cc-row-vi">{s.vi}</div>
                    <div className="cc-row-en">{s.en || <em>(chưa có đáp án)</em>}</div>
                    {(s.level || s.topic || (s.altAnswers && s.altAnswers.length > 0)) && (
                      <div className="cc-row-meta">
                        {s.level && <span className="cc-badge">{s.level}</span>}
                        {s.topic && <span className="cc-badge">{s.topic}</span>}
                        {s.altAnswers && s.altAnswers.length > 0 && (
                          <span className="cc-badge">+{s.altAnswers.length} cách khác</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="cc-row-side">
                    <button className="cc-ibtn" title="Sửa câu" onClick={() => setEditingId(s.id)}>
                      <Icon name="pencil" />
                    </button>
                    <button className="cc-ibtn danger" title="Xóa câu" onClick={() => remove(s)}>
                      <Icon name="trash" />
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
    <div className="cc-menu" ref={ref}>
      <button
        className="cc-btn"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        title="Thao tác Excel"
      >
        <Icon name="grid" /> Excel <Icon name="down" />
      </button>
      {open && (
        <div className="cc-menu-list">
          <button className="cc-menu-item" onClick={() => pick(onImport)}>
            <Icon name="save" /> Nhập từ Excel
          </button>
          <button className="cc-menu-item" onClick={() => pick(onExport)} disabled={!canExport}>
            <Icon name="down" /> Xuất ra Excel
          </button>
          <div className="cc-menu-sep" />
          <button className="cc-menu-item" onClick={() => pick(onSample)}>
            <Icon name="file" /> Tải file mẫu
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
    <form className="cc-form" onSubmit={submit}>
      <label className="cc-field">
        <span>Câu tiếng Việt *</span>
        <input
          className="cc-input"
          value={vi}
          onChange={(e) => setVi(e.target.value)}
          placeholder="VD: Cô ấy sống ở Hà Nội."
        />
      </label>
      <label className="cc-field">
        <span>Đáp án tiếng Anh *</span>
        <input
          className="cc-input"
          value={en}
          onChange={(e) => setEn(e.target.value)}
          placeholder="VD: She lives in Hanoi."
        />
      </label>
      <div className="cc-form-row">
        <label className="cc-field">
          <span>Đáp án khác (mỗi dòng 1 câu)</span>
          <textarea rows={2} value={alt} onChange={(e) => setAlt(e.target.value)} />
        </label>
        <label className="cc-field">
          <span>Gợi ý (mỗi dòng 1 ý)</span>
          <textarea rows={2} value={hints} onChange={(e) => setHints(e.target.value)} />
        </label>
      </div>
      <div className="cc-form-row">
        <label className="cc-field is-narrow">
          <span>Cấp độ</span>
          <select
            className="cc-select"
            value={level}
            onChange={(e) => setLevel(e.target.value as CefrLevel | '')}
          >
            <option value="">—</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="cc-field">
          <span>Chủ đề</span>
          <input
            className="cc-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="VD: Du lịch"
          />
        </label>
      </div>
      <div className="cc-form-actions">
        <button type="button" className="cc-btn cc-btn-ghost" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="cc-btn cc-btn-primary">
          <Icon name="save" /> Lưu câu
        </button>
      </div>
    </form>
  )
}
