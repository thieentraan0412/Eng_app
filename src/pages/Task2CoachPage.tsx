// Trang "Luyện Task 2" — người học tự làm một đề IELTS Writing Task 2 theo từng bước.
//   Bước 1 · Nhận dạng đề: dán đề, tự tách 4 lớp, tự chọn dạng đề rồi mới so với app, chốt quan điểm.
//   Bước 2 · Phát triển ý: 12 hướng phát triển ý (DATA/huong-dan-song-ngu.html mục 3) — bấm một hướng để xem
//            câu hỏi chính, ý triển khai, 6 câu hỏi kèm câu ví dụ, collocation, chuỗi lập luận, đoạn mẫu.
// Giữa là ĐÚNG 13 câu của outline dạng đề đã chọn (DATA/outline-dang-de.html): mỗi câu hiện câu mẫu
// trong sách (vế màu, mẫu câu Expand/Example) và một ô để người học viết câu đó; bên phải là các bước.
// Tài liệu chỉ để đọc lấy ý, app không viết sẵn bài luận.
// Trang mở ra danh sách bài (bảng task2_essays trên Supabase, đồng bộ app ↔ web); bấm một bài mới vào
// giao diện làm bài ở trên, mọi thay đổi tự lưu sau khi ngừng gõ.
// Dữ liệu: src/data/task2MindMap.ts · task2Outlines.ts · task2DirectionGuides.ts
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import '@fontsource/overpass/600.css'
import '@fontsource/overpass/700.css'
import '@fontsource/overpass/800.css'
import '@fontsource/overpass-mono/500.css'
import '@fontsource/overpass-mono/600.css'
import Icon from '../components/Icon'
import {
  Card,
  EditorTop,
  Field,
  Progress,
  Rich,
  Sentence,
  StepNav,
  StepTabs,
  ToneDots,
  appendText,
  clip,
  countWords,
  has,
  lineFills,
  relTime,
  slotKey,
  useAutosave,
  withFills,
  type StepItem,
} from '../components/CoachKit'
import type { PageKey } from './pages'
import { DIRECTIONS, ESSAY_TYPES, SIX_W, findDirection, findEssayType } from '../data/task2MindMap'
import {
  OUTLINE_CHOICES,
  defaultChoice,
  findOutline,
  outlineFor,
  segsToText,
  type Outline,
  type OutlineLine,
  type Tone,
} from '../data/task2Outlines'
import type { PatternLevel } from '../data/task2Patterns'
import { DIRECTION_GUIDES, type DirectionGuide } from '../data/task2DirectionGuides'
import { ideaSentences } from '../data/task2IdeaSentences'
import { detectEssayType } from '../services/essayType'
import { CloudApi, type Task2Essay } from '../services/cloud/CloudApiClient'
import { errText, isMissingSchema } from '../services/cloud/cloudError'
import '../styles/mindmap.css'
import '../styles/task2coach.css'

// ------------------------------------------------------------------ Trạng thái
// Bản lưu cũ còn trường sixw / bodies của bước 2 cũ (6 câu hỏi, hai thân bài): normalize giữ nguyên
// chúng trong dữ liệu để không mất, chỉ là không hiện nữa.
interface CoachState {
  step: 1 | 2
  prompt: string
  typeId: string | null // người học tự chọn, app chỉ đối chiếu khi được hỏi
  choice: string | null // kiểu outline của dạng Ưu / Nhược điểm: listing · adv · dis
  compared: boolean
  lines: Record<string, string> // câu người học viết cho từng câu 1–13 của outline (khóa = số câu)
  fills: Record<string, string> // chữ chọn cho chỗ trống trong câu mẫu (khóa = slotKey)
}

// Bản cũ chỉ có một bài, lưu trong trình duyệt; lần đầu mở danh sách thì chuyển nó lên cloud.
const STORE_KEY = 'task2_coach_v1'
const NEED_SQL = 'Chưa có bảng lưu bài Luyện Task 2. Mở Supabase → SQL Editor, chạy file supabase/task2_essays.sql rồi tải lại trang.'

// Chỉ luyện 4 dạng đề có outline trong sách (DATA/outline-dang-de.html): Agree – Disagree,
// Advantages – Disadvantages, Causes & Solutions, Problems & Solutions.
const BOOK_TYPES = ESSAY_TYPES.filter((t) => outlineFor(t.id)?.source === 'book')
const isBookType = (id: string | null | undefined): id is string => BOOK_TYPES.some((t) => t.id === id)

/** Một ô chọn ở mục 1.2. Dạng Ưu / Nhược điểm tách thành 3 ô theo 3 outline trong sách. */
interface TypeOption {
  id: string
  typeId: string
  choiceId?: string
  vi: string
  en: string
  signal: string
  note?: string
}
const ADVDIS_SIGNAL: Record<string, string> = {
  listing: 'Discuss the advantages and disadvantages.',
  adv: 'Do the advantages outweigh the disadvantages?',
  dis: 'Do the advantages outweigh the disadvantages?',
}
/** Các quan điểm của một dạng đề CHỈ KHI chúng dẫn tới outline khác nhau (Ưu / Nhược điểm → 3 outline);
 *  Đồng ý / Không đồng ý chung một outline nên vẫn là một ô. */
function splitChoices(typeId: string | null | undefined) {
  const choices = typeId ? OUTLINE_CHOICES[typeId] ?? [] : []
  return new Set(choices.map((c) => c.outlineId)).size > 1 ? choices : []
}
const TYPE_OPTIONS: TypeOption[] = BOOK_TYPES.flatMap<TypeOption>((t) => {
  const choices = splitChoices(t.id)
  if (!choices.length) return [{ id: t.id, typeId: t.id, vi: t.vi, en: t.en, signal: t.signal }]
  return choices.map((c) => ({
    id: `${t.id}.${c.id}`,
    typeId: t.id,
    choiceId: c.id,
    vi: `${t.vi} · ${c.label.toLowerCase()}`,
    en: findOutline(c.outlineId)?.name ?? t.en,
    signal: ADVDIS_SIGNAL[c.id] ?? t.signal,
    note: c.note,
  }))
})
const optionOf = (typeId: string | null, choice: string | null) =>
  TYPE_OPTIONS.find((o) => o.typeId === typeId && (!o.choiceId || o.choiceId === choice))
const INITIAL: CoachState = {
  step: 1,
  prompt: '',
  typeId: null,
  choice: null,
  compared: false,
  lines: {},
  fills: {},
}

/** Bản lưu cũ có 3 ô Mở bài / Thesis / Kết luận → chuyển thành câu 1, 2, 13. */
function migrateLines(s: { intro?: string; thesis?: string; conclusion?: string }): Record<string, string> {
  const out: Record<string, string> = {}
  if (s.intro) out['1'] = s.intro
  if (s.thesis) out['2'] = s.thesis
  if (s.conclusion) out['13'] = s.conclusion
  return out
}

/** 4 khối của outline 13 câu. */
const OPARTS: { from: number; to: number; title: (names: [string, string]) => string }[] = [
  { from: 1, to: 2, title: () => 'Mở bài' },
  { from: 3, to: 7, title: (n) => `Thân bài 1 · ${n[0]}` },
  { from: 8, to: 12, title: (n) => `Thân bài 2 · ${n[1]}` },
  { from: 13, to: 13, title: () => 'Kết bài' },
]

/** Dữ liệu một bài đọc từ cloud (hoặc bản cũ trong trình duyệt) → trạng thái đủ trường. */
function normalize(raw: unknown): CoachState {
  if (!raw || typeof raw !== 'object') return INITIAL
  const s = raw as Partial<CoachState>
  return {
    ...INITIAL,
    ...s,
    // Bản lưu cũ có thể chứa dạng đề không còn luyện, hoặc dạng Ưu / Nhược điểm chưa có kiểu outline
    typeId: isBookType(s.typeId) ? s.typeId : null,
    choice: splitChoices(s.typeId).some((c) => c.id === s.choice) ? s.choice! : (splitChoices(s.typeId)[0]?.id ?? null),
    lines: { ...migrateLines(s as Record<string, string | undefined>), ...s.lines },
    fills: { ...s.fills },
  }
}

/** Tên bài trong danh sách = câu đầu của đề. */
const titleOf = (s: CoachState) => clip(s.prompt.trim().replace(/\s+/g, ' '), 140)

const hasContent = (s: CoachState) => has(s.prompt) || Boolean(s.typeId) || Object.values(s.lines).some(has)

/** Bài cũ một-bài-duy-nhất trong trình duyệt → một bài trên cloud. Lỗi thì trả bản cũ về chỗ cũ. */
async function importLocal(): Promise<void> {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORE_KEY)
    // Gỡ trước khi chờ mạng để lần gọi thứ hai (StrictMode) không tạo trùng
    if (raw) localStorage.removeItem(STORE_KEY)
  } catch {
    return
  }
  if (!raw) return
  let s: CoachState
  try {
    s = normalize(JSON.parse(raw))
  } catch {
    return // bản lưu hỏng, bỏ
  }
  if (!hasContent(s)) return
  try {
    await CloudApi.createTask2Essay(titleOf(s), s)
  } catch (e) {
    try {
      localStorage.setItem(STORE_KEY, raw)
    } catch {
      /* không trả lại được thì thôi */
    }
    throw e
  }
}

/** Tóm tắt một bài cho thẻ trong danh sách. */
function summarize(s: CoachState) {
  const outline = s.typeId ? outlineFor(s.typeId, s.choice ?? defaultChoice(s.typeId, s.prompt)) : undefined
  const filled = outline ? outline.lines.filter((l) => has(s.lines[String(l.no)] ?? '')).length : 0
  return { outline, filled, option: optionOf(s.typeId, s.choice) }
}

// Bộ lọc danh sách — nhớ trong trình duyệt để quay lại trang vẫn còn
type StatusFilter = 'all' | 'doing' | 'done'
interface ListFilter {
  q: string
  type: string // 'all' · id của TypeOption · 'none' (chưa chọn dạng)
  status: StatusFilter
}
const FILTER_KEY = 'task2_list_filter'
const NO_FILTER: ListFilter = { q: '', type: 'all', status: 'all' }
const STATUSES: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'doing', label: 'Đang làm' },
  { id: 'done', label: 'Xong outline' },
]
function loadFilter(): ListFilter {
  try {
    const raw = localStorage.getItem(FILTER_KEY)
    if (raw) return { ...NO_FILTER, ...(JSON.parse(raw) as Partial<ListFilter>) }
  } catch {
    /* bộ nhớ trình duyệt bị chặn — dùng bộ lọc mặc định */
  }
  return NO_FILTER
}

const fieldId = (key: string) => `tc-f-${key.replace(/\./g, '-')}`
// Bước 2: 12 hướng chia 2 nhóm như tài liệu — đối tượng (1–5) và khía cạnh (6–12)
const DIR_GROUPS = [
  { kind: 'actor', label: 'Đối tượng · Actor · WHO', tone: 'm', dirs: DIRECTIONS.filter((d) => DIRECTION_GUIDES[d.id]?.kind === 'actor') },
  { kind: 'aspect', label: 'Khía cạnh · Aspect · WHAT / WHEN', tone: 'g', dirs: DIRECTIONS.filter((d) => DIRECTION_GUIDES[d.id]?.kind === 'aspect') },
]
const LEVEL_VI: Record<PatternLevel, string> = { basic: 'Cơ bản', mid: 'Trung cấp', adv: 'Nâng cao' }

// ------------------------------------------------------------------ Trang: danh sách bài
export default function Task2CoachPage({ onNavigate }: { onNavigate?: (p: PageKey) => void }) {
  const [essays, setEssays] = useState<Task2Essay[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ListFilter>(loadFilter)

  const fail = (e: unknown) => setError(isMissingSchema(e, 'task2_essays') ? NEED_SQL : errText(e))

  const load = async (alive: () => boolean = () => true) => {
    setLoading(true)
    setError(null)
    try {
      await importLocal()
      const rows = await CloudApi.listTask2Essays()
      if (alive()) setEssays(rows)
    } catch (e) {
      if (alive()) fail(e)
    } finally {
      if (alive()) setLoading(false)
    }
  }

  useEffect(() => {
    let alive = true
    void load(() => alive)
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(filter))
    } catch {
      /* không nhớ được bộ lọc thì thôi */
    }
  }, [filter])

  // Mỗi bài tóm tắt một lần; bộ lọc và thẻ dùng chung
  const items = useMemo(
    () =>
      essays.map((e) => {
        const s = normalize(e.data)
        const sum = summarize(s)
        return { e, s, ...sum, typeKey: sum.option?.id ?? 'none', done: sum.filled === 13 }
      }),
    [essays],
  )
  // Nút lọc chỉ hiện dạng đề đang có bài, theo thứ tự ở mục 1.2, "chưa chọn" ở cuối
  const typeChips = useMemo(() => {
    const count = (key: string) => items.filter((it) => it.typeKey === key).length
    const chips = TYPE_OPTIONS.filter((o) => count(o.id) > 0).map((o) => {
      const outline = outlineFor(o.typeId, o.choiceId ?? defaultChoice(o.typeId, ''))
      return { id: o.id, label: o.vi, tones: outline?.threads, count: count(o.id) }
    })
    if (count('none')) chips.push({ id: 'none', label: 'Chưa chọn dạng đề', tones: undefined, count: count('none') })
    return chips
  }, [items])
  const q = filter.q.trim().toLowerCase()
  const shown = items.filter(
    (it) =>
      (filter.type === 'all' || it.typeKey === filter.type) &&
      (filter.status === 'all' || (filter.status === 'done') === it.done) &&
      (!q || it.s.prompt.toLowerCase().includes(q)),
  )
  const filtered = filter.q.trim() !== '' || filter.type !== 'all' || filter.status !== 'all'
  const doneCount = items.filter((it) => it.done).length

  const create = async () => {
    if (creating) return
    setCreating(true)
    setError(null)
    try {
      const row = await CloudApi.createTask2Essay('', INITIAL)
      setEssays((l) => [row, ...l])
      setOpenId(row.id)
    } catch (e) {
      fail(e)
    } finally {
      setCreating(false)
    }
  }

  const remove = async (e: Task2Essay) => {
    if (!window.confirm(`Xóa bài "${e.title || 'chưa có đề'}"? Thao tác này không hoàn tác được.`)) return
    setError(null)
    try {
      await CloudApi.deleteTask2Essay(e.id)
      setEssays((l) => l.filter((x) => x.id !== e.id))
    } catch (err) {
      fail(err)
    }
  }

  // Editor lưu xong một lần thì cập nhật dòng đó, đẩy lên đầu danh sách
  const onSaved = (row: Task2Essay) => setEssays((l) => [row, ...l.filter((x) => x.id !== row.id)])

  const open = essays.find((e) => e.id === openId)
  if (open) return <Task2Editor key={open.id} essay={open} onBack={() => setOpenId(null)} onSaved={onSaved} onNavigate={onNavigate} />

  const patchFilter = (p: Partial<ListFilter>) => setFilter((f) => ({ ...f, ...p }))

  return (
    <div className="page mt-page tc-page">
      <div className="tc-lib">
        <div className="mt-head">
          <div>
            <h1>Luyện Task 2</h1>
            <p>
              {loading
                ? 'Đang tải danh sách bài…'
                : `${filtered ? `Hiện ${shown.length} / ` : ''}${items.length} bài · ${doneCount} xong outline`}
            </p>
          </div>
          <button type="button" className="mt-btn is-primary" onClick={create} disabled={creating || loading}>
            <Icon name="plus" />
            {creating ? 'Đang tạo…' : 'Bài mới'}
          </button>
        </div>

        {error && (
          <div className="mt-warn tc-liberr" role="alert">
            <Icon name="alert" />
            <span>{error}</span>
            <button type="button" className="mt-mini" onClick={() => void load()} disabled={loading}>
              <Icon name="refresh" />
              Tải lại
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className="tc-tools">
            <div className="tc-toolrow">
              <label className="tc-search">
                <Icon name="search" />
                <span className="mt-sr">Tìm trong đề bài</span>
                <input type="search" lang="en" value={filter.q} onChange={(e) => patchFilter({ q: e.target.value })} placeholder="Tìm trong đề bài…" />
              </label>
              <div className="mt-seg" role="group" aria-label="Trạng thái">
                {STATUSES.map((st) => (
                  <button type="button" key={st.id} aria-pressed={filter.status === st.id} onClick={() => patchFilter({ status: st.id })}>
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="tc-fchips" role="group" aria-label="Dạng đề">
              <button type="button" className="tc-fchip" aria-pressed={filter.type === 'all'} onClick={() => patchFilter({ type: 'all' })}>
                Mọi dạng đề
                <small>{items.length}</small>
              </button>
              {typeChips.map((c) => (
                <button type="button" key={c.id} className="tc-fchip" aria-pressed={filter.type === c.id} onClick={() => patchFilter({ type: c.id })}>
                  <ToneDots tones={c.tones} />
                  {c.label}
                  <small>{c.count}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && !items.length ? (
          <ul className="tc-grid" aria-busy="true" aria-label="Đang tải danh sách bài">
            {[0, 1, 2].map((k) => (
              <li key={k} className="tc-ecard is-skel" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </li>
            ))}
          </ul>
        ) : filtered && !shown.length ? (
          <div className="mt-empty tc-noresult">
            <p>
              Không có bài nào khớp bộ lọc
              {filter.q.trim() ? (
                <>
                  {' '}
                  có chữ “<span lang="en">{filter.q.trim()}</span>”
                </>
              ) : null}
              .
            </p>
            <button type="button" className="mt-mini" onClick={() => setFilter(NO_FILTER)}>
              <Icon name="x" />
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          !error || items.length ? (
            <ul className="tc-grid">
              {!filtered && (
                <li className="tc-newcard">
                  <button type="button" onClick={create} disabled={creating || loading}>
                    <span className="tc-newplus" aria-hidden="true">
                      <Icon name="plus" />
                    </span>
                    <b>{creating ? 'Đang tạo…' : 'Bài mới'}</b>
                    <small>{items.length ? 'Dán một đề khác rồi làm theo hai bước.' : 'Chưa có bài nào. Tạo bài đầu tiên, dán đề rồi làm theo hai bước.'}</small>
                  </button>
                </li>
              )}
              {shown.map((it) => (
                <EssayCard
                  key={it.e.id}
                  title={it.e.title || ''}
                  updated={it.e.updated_at}
                  typeLabel={it.option?.vi}
                  outline={it.outline}
                  lines={it.s.lines}
                  filled={it.filled}
                  onOpen={() => setOpenId(it.e.id)}
                  onDelete={() => remove(it.e)}
                />
              ))}
            </ul>
          ) : null
        )}
      </div>
    </div>
  )
}

/** Thẻ một bài: mép trên hai màu vế, đề bài, dải 13 ô (Mở 2 · Thân 1 5 · Thân 2 5 · Kết 1). */
function EssayCard({
  title,
  updated,
  typeLabel,
  outline,
  lines,
  filled,
  onOpen,
  onDelete,
}: {
  title: string
  updated: string
  typeLabel?: string
  outline?: Outline
  lines: Record<string, string>
  filled: number
  onOpen: () => void
  onDelete: () => void
}) {
  const tones = outline?.threads
  const done = filled === 13
  return (
    <li className={tones ? 'tc-ecard' : 'tc-ecard is-untyped'}>
      <span className="tc-estripe" aria-hidden="true">
        <i className={tones ? `t-${tones[0]}` : undefined} />
        <i className={tones ? `t-${tones[1]}` : undefined} />
      </span>
      <span className="tc-etype">
        <ToneDots tones={tones} />
        {typeLabel ?? 'Chưa chọn dạng đề'}
      </span>
      <button type="button" className="tc-eopen" onClick={onOpen}>
        <span className="mt-sr">Mở bài: </span>
        {title ? (
          <span className="tc-eprompt" lang="en">
            {title}
          </span>
        ) : (
          <span className="tc-eprompt is-empty">Bài chưa có đề</span>
        )}
      </button>
      <span className="tc-strip-row">
        <span className="tc-strip" role="img" aria-label={`Đã viết ${filled} trên 13 câu outline`}>
          {OPARTS.flatMap((pt, k) => {
            const tone = !outline ? 'x' : pt.from === 3 ? outline.threads[0] : pt.from === 8 ? outline.threads[1] : 'm'
            return Array.from({ length: pt.to - pt.from + 1 }, (_, j) => {
              const no = pt.from + j
              const cls = [`t-${tone}`, outline && has(lines[String(no)] ?? '') ? 'is-on' : '', k > 0 && j === 0 ? 'is-gap' : '']
              return <i key={no} className={cls.filter(Boolean).join(' ')} />
            })
          })}
        </span>
        <b className={done ? 'tc-ecount is-full' : 'tc-ecount'}>{filled}/13</b>
      </span>
      <span className="tc-efoot">
        <span>{relTime(updated)}</span>
        {done ? (
          <span className="tc-estate is-done">
            <Icon name="check" />
            Xong outline
          </span>
        ) : (
          <span className="tc-estate">Đang làm</span>
        )}
      </span>
      <button type="button" className="tc-edel" onClick={onDelete} title="Xóa bài" aria-label={`Xóa bài ${title || 'chưa có đề'}`}>
        <Icon name="trash" />
      </button>
    </li>
  )
}

// ------------------------------------------------------------------ Trang: làm một bài
function Task2Editor({
  essay,
  onBack,
  onSaved,
  onNavigate,
}: {
  essay: Task2Essay
  onBack: () => void
  onSaved: (row: Task2Essay) => void
  onNavigate?: (p: PageKey) => void
}) {
  const [st, setSt] = useState<CoachState>(() => normalize(essay.data))
  const [copied, setCopied] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [leaving, setLeaving] = useState(false)
  // Hướng đang mở ở bước 2 (null = chưa mở hướng nào)
  const [dir, setDir] = useState<string | null>(null)
  const workRef = useRef<HTMLDivElement>(null)
  const dirRef = useRef<HTMLDivElement>(null)

  // Tự lưu lên cloud
  const { save, saveErr, flush } = useAutosave(st, (s) => CloudApi.updateTask2Essay(essay.id, titleOf(s), s), onSaved)

  const back = async () => {
    setLeaving(true)
    const ok = await flush()
    setLeaving(false)
    if (!ok && !window.confirm('Chưa lưu được thay đổi mới nhất lên cloud. Vẫn quay lại danh sách? Phần chưa lưu sẽ mất.')) return
    onBack()
  }

  const patch = (p: Partial<CoachState>) => setSt((s) => ({ ...s, ...p }))

  // ---------------------------------------------------------------- Dữ liệu suy ra
  // App chỉ đoán trong 4 dạng đang luyện; đề thuộc dạng khác thì coi như không đoán được.
  const detected = useMemo(() => {
    const id = detectEssayType(st.prompt)
    return isBookType(id) ? id : null
  }, [st.prompt])
  const type = st.typeId ? findEssayType(st.typeId) : undefined
  const option = optionOf(st.typeId, st.choice)
  const outline = st.typeId ? outlineFor(st.typeId, st.choice ?? defaultChoice(st.typeId, st.prompt)) : undefined
  const bodyNames: [string, string] = outline?.bodyNames ?? (type ? [type.body1, type.body2] : ['Thân bài 1', 'Thân bài 2'])

  const step1Checks = [
    { key: 'prompt', label: 'Dán đề bài', ok: has(st.prompt) },
    { key: 'type', label: 'Chọn dạng đề', ok: Boolean(type) },
  ]
  const done1 = step1Checks.filter((c) => c.ok).length

  // ---------------------------------------------------------------- Hành động
  /** Chuyển bước rồi đưa cột phải về đầu để còn thấy thanh bước. */
  const goTo = (step: 1 | 2) => {
    patch({ step })
    requestAnimationFrame(() => workRef.current?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  const chooseOption = (o: TypeOption) => patch({ typeId: o.typeId, choice: o.choiceId ?? null })

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(key)
    window.setTimeout(() => setCopied((k) => (k === key ? null : k)), 1400)
  }

  const outlineText = buildOutlineText(st, outline, type?.en, type?.vi, bodyNames)

  const createDraft = async () => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    try {
      const head = st.prompt.trim().replace(/\s+/g, ' ')
      const title = head ? `Task 2 – ${clip(head, 60)}` : 'Dàn bài Task 2'
      await CloudApi.createWriting(title, outlineText, countWords(outlineText), 'IELTS Task 2')
      setMsg({ ok: true, text: 'Đã tạo bài nháp có sẵn outline. Đang mở trang Viết.' })
      onNavigate?.('writing')
    } catch (e) {
      setMsg({ ok: false, text: `Không tạo được bài nháp: ${errText(e)}. Outline vẫn còn ở đây, bạn có thể bấm Chép outline.` })
    } finally {
      setBusy(false)
    }
  }

  // ---------------------------------------------------------------- Bước 1
  const renderStep1 = () => (
    <>
      <Card no="1.1" title="Đề bài" hint="Dán nguyên văn đề, kể cả câu lệnh ở cuối.">
        <Field
          id={fieldId('prompt')}
          lang="en"
          rows={3}
          value={st.prompt}
          onChange={(v) => patch({ prompt: v, compared: false })}
          placeholder="Ví dụ: Some people think that advertisements for unhealthy food and drinks should be banned. To what extent do you agree or disagree?"
        />
      </Card>

      <Card
        no="1.2"
        title="Đây là dạng đề nào?"
        hint={`${TYPE_OPTIONS.length} kiểu outline trong sách. Đọc lại câu lệnh ở cuối đề rồi tự chọn; đề hỏi outweigh thì chọn luôn phía bạn nghiêng về. Chọn xong mới so với app.`}
        aside={
          type && detected ? (
            <button type="button" className="mt-btn" onClick={() => patch({ compared: true })} disabled={st.compared}>
              <Icon name="eye" />
              So với app
            </button>
          ) : null
        }
      >
        <div className="tc-types" role="radiogroup" aria-label="Dạng đề">
          {TYPE_OPTIONS.map((o) => {
            const on = option?.id === o.id
            // Với dạng Ưu / Nhược điểm, app gợi kiểu outline theo chữ "outweigh" trong đề
            const appPick = st.compared && o.typeId === detected && (!o.choiceId || o.choiceId === defaultChoice(detected, st.prompt))
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={['tc-type', on ? 'is-on' : '', appPick ? 'is-app' : ''].filter(Boolean).join(' ')}
                onClick={() => chooseOption(o)}
              >
                <span className="tc-radio" aria-hidden="true">
                  {on && <Icon name="check" />}
                </span>
                <span className="tc-type-txt">
                  <b>{o.vi}</b>
                  <small lang="en">{o.signal}</small>
                  {o.note && <small>{o.note}</small>}
                  <small lang="en" className="tc-outline-name">
                    Outline: {o.en}
                  </small>
                </span>
                {appPick && <span className="mt-tag is-auto">app đoán</span>}
              </button>
            )
          })}
        </div>
        {st.compared && type && detected && (
          <p className={detected === type.id ? 'mt-note' : 'mt-warn'} role="status">
            {detected === type.id ? (
              'App cũng nhận ra dạng này. Bạn đọc đúng câu lệnh.'
            ) : (
              <>
                <Icon name="alert" />
                App đoán là {findEssayType(detected)?.vi}. Đọc lại câu lệnh cuối đề: dấu hiệu nào khớp hơn? App chỉ dò từ khóa nên có thể sai, bạn quyết định.
              </>
            )}
          </p>
        )}
      </Card>

      <StepNav
        next={{ label: 'Sang bước 2 · Phát triển ý', onClick: () => goTo(2) }}
        note={done1 < step1Checks.length ? `Còn ${step1Checks.length - done1} mục chưa xong. Bạn vẫn sang bước 2 được, rồi quay lại sau.` : undefined}
      />
    </>
  )

  // ---------------------------------------------------------------- Bước 2: 12 hướng phát triển ý (DATA/huong-dan-song-ngu.html mục 3)
  /** Mở một hướng (bấm lại hướng đang mở thì đóng) rồi đưa phần nội dung vào tầm nhìn. */
  const openDir = (id: string) => {
    setDir((cur) => (cur === id ? null : id))
    requestAnimationFrame(() => dirRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const renderStep2 = () => {
    const g = dir ? DIRECTION_GUIDES[dir] : undefined
    return (
      <>
        <Card no="2.1" title="12 hướng phát triển ý" hint="Bấm một hướng để xem nội dung trong tài liệu. Đọc để lấy ý, rồi tự viết lại bằng chữ của bạn.">
          {DIR_GROUPS.map((gr) => (
            <div key={gr.kind} className="tc-field">
              <span className="tc-flabel">
                <b>{gr.label}</b>
              </span>
              <div className="tc-dirs">
                {gr.dirs.map((d) => {
                  const x = DIRECTION_GUIDES[d.id]
                  const on = d.id === dir
                  return (
                    <button key={d.id} type="button" className={`tc-dir t-${gr.tone}${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => openDir(d.id)}>
                      <span className="tc-gno">{d.no}</span>
                      <span className="tc-dirtxt">
                        <b>{x.name.vi}</b>
                        <small lang="en">{x.name.en}</small>
                        <span>{x.question.vi}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>
        {g && dir && (
          <div ref={dirRef} className="tc-dirwrap">
            <DirectionView id={dir} no={findDirection(dir)?.no ?? 0} g={g} onClose={() => setDir(null)} />
          </div>
        )}
        <StepNav prev={{ label: 'Về bước 1 · Nhận dạng đề', onClick: () => goTo(1) }} />
      </>
    )
  }

  // ---------------------------------------------------------------- Outline bên phải: đúng 13 câu của outline đã chọn
  const setLine = (no: number, v: string) => setSt((s) => ({ ...s, lines: { ...s.lines, [String(no)]: v } }))
  const lineOf = (no: number) => st.lines[String(no)] ?? ''

  /** Chọn chữ cho một chỗ trống. Ô còn trống thì ráp luôn câu vào ô; ô đang chứa câu khung cũ thì thay
   *  bằng câu mới; câu người học đã tự sửa thì để nguyên. */
  const pickSlot = (l: OutlineLine, i: number, v: string | null) => {
    if (!outline) return
    const id = outline.id
    setSt((s) => {
      const fills = { ...s.fills }
      if (v) fills[slotKey(id, l.no, i)] = v
      else delete fills[slotKey(id, l.no, i)]
      const before = segsToText(withFills(l.text, lineFills(s.fills, id, l)), s.choice ?? undefined)
      const after = segsToText(withFills(l.text, lineFills(fills, id, l)), s.choice ?? undefined)
      const cur = s.lines[String(l.no)] ?? ''
      const line = !has(cur) ? (v ? after : cur) : cur.includes(before) ? cur.replace(before, after) : cur
      return { ...s, fills, lines: { ...s.lines, [String(l.no)]: line } }
    })
  }

  const renderOutlineLine = (l: OutlineLine, tone: Tone | 'm') => {
    const no = l.no
    const value = lineOf(no)
    const fills = outline ? lineFills(st.fills, outline.id, l) : {}
    const template = segsToText(withFills(l.text, fills), st.choice ?? undefined)
    return (
      <div key={no} className={has(value) ? 'tc-oline' : 'tc-oline is-empty'}>
        <div className="tc-oline-head">
          <span className={`mt-n t-${tone}`}>{no}</span>
          <span className="tc-orole">{l.role}</span>
          {!l.minor && (
            <button type="button" className="mt-mini" onClick={() => setLine(no, appendText(value, template))} title="Chèn câu mẫu vào ô để sửa">
              <Icon name="pencil" />
              Dùng khung
            </button>
          )}
        </div>
        {!l.minor && <Sentence segs={l.text} choice={st.choice ?? undefined} fills={fills} onPick={(i, v) => pickSlot(l, i, v)} />}
        {l.ink?.map((n) => (
          <p key={n} className="mt-handnote" lang="en">
            <span aria-hidden="true">✍ </span>
            {n}
          </p>
        ))}
        {l.patterns && (
          <div className="mt-chips tc-opatterns" lang="en">
            {l.patterns.map((pt) => (
              <button type="button" key={pt} className="mt-chip" onClick={() => setLine(no, appendText(value, pt))} title="Bấm để chèn vào ô">
                {pt}
              </button>
            ))}
          </div>
        )}
        <Field id={`tc-o-${no}`} rows={1} value={value} onChange={(v) => setLine(no, v)} placeholder={l.guide} className="tc-oinput" ariaLabel={`Câu ${no} · ${l.role}`} />
      </div>
    )
  }

  const renderOutline = () => {
    const filled = outline ? outline.lines.filter((l) => has(lineOf(l.no))).length : 0
    return (
      <>
        <div className="tc-ohead">
          <div>
            <span className="mt-kicker">
              <span className="mt-bullet t-m">Outline</span>
              <span>{outline ? outline.name : 'chưa có dạng đề'}</span>
            </span>
            <h2>Dàn bài của bạn</h2>
          </div>
          <Progress done={filled} total={13} />
        </div>
        {!outline ? (
          <p className="mt-empty">Chọn dạng đề ở mục 1.2 để hiện đúng 13 câu outline của dạng đó.</p>
        ) : (
          <>
            {OPARTS.map((pt) => {
              const tone: Tone | 'm' = pt.from === 3 ? outline.threads[0] : pt.from === 8 ? outline.threads[1] : 'm'
              return (
                <section key={pt.from} className={`tc-opart t-${tone}`}>
                  <header>
                    <b>{pt.title(bodyNames)}</b>
                    <small>{pt.to > pt.from ? `câu ${pt.from}–${pt.to}` : `câu ${pt.from}`}</small>
                  </header>
                  {outline.lines.slice(pt.from - 1, pt.to).map((l) => renderOutlineLine(l, tone))}
                </section>
              )
            })}
            {(outline.notes?.length || outline.ink?.length) ? (
              <p className="mt-hint">Ghi chú trong sách: {[...(outline.notes ?? []), ...(outline.ink ?? [])].join(' · ')}</p>
            ) : null}
          </>
        )}

        <div className="mt-actions">
          <button type="button" className="mt-btn is-primary" onClick={createDraft} disabled={busy || !outline}>
            <Icon name="pen" />
            {busy ? 'Đang tạo bài nháp…' : 'Viết bài từ outline này'}
          </button>
          <button type="button" className="mt-btn" onClick={() => copy('outline', outlineText)} disabled={!outline}>
            <Icon name={copied === 'outline' ? 'check' : 'copy'} />
            {copied === 'outline' ? 'Đã chép' : 'Chép outline'}
          </button>
          {msg && (
            <p className={msg.ok ? 'mt-note' : 'mt-warn'} role="status">
              {!msg.ok && <Icon name="alert" />}
              {msg.text}
            </p>
          )}
        </div>
      </>
    )
  }

  // ---------------------------------------------------------------- Bố cục trang
  // Bước 2 chỉ để xem tài liệu nên không có tiến độ
  const steps: StepItem[] = [
    { no: 1, label: 'Nhận dạng đề', done: done1, total: step1Checks.length },
    { no: 2, label: 'Phát triển ý' },
  ]
  return (
    <div className="page mt-page tc-page tc-editor">
      <EditorTop onBack={back} leaving={leaving} save={save} saveErr={saveErr} onRetry={() => void flush()} />
      <div className="tc-layout">
        {/* Giữa: outline 13 câu là chỗ viết chính */}
        <section className="tc-main tc-outline" aria-label="Outline">
          {renderOutline()}
        </section>

        {/* Phải: các bước hỗ trợ tìm ý, dính khi cuộn */}
        <aside className="mt-panel tc-side" aria-label="Hỗ trợ viết">
          <StepTabs steps={steps} current={st.step} onGo={goTo} />
          <div className="tc-work" ref={workRef} aria-label={`Bước ${st.step}`}>
            {st.step === 1 ? renderStep1() : renderStep2()}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Outline dạng chữ
function buildOutlineText(
  st: CoachState,
  outline: Outline | undefined,
  typeEn: string | undefined,
  typeVi: string | undefined,
  bodyNames: [string, string],
): string {
  const L: string[] = []
  if (has(st.prompt)) L.push(`Đề bài: ${st.prompt.trim()}`)
  if (typeEn) L.push(`Dạng đề: ${typeEn} (${typeVi})${outline ? ` · outline ${outline.name}` : ''}`)
  if (!outline) return L.join('\n')
  OPARTS.forEach((pt) => {
    L.push('', pt.title(bodyNames).toUpperCase())
    outline.lines.slice(pt.from - 1, pt.to).forEach((l) => {
      const mine = (st.lines[String(l.no)] ?? '').trim()
      const tpl = l.minor ? (l.patterns ?? []).join(' / ') : segsToText(withFills(l.text, lineFills(st.fills, outline.id, l)), st.choice ?? undefined)
      L.push(`${l.no}. ${l.role}: ${mine || `[${tpl}]`}`)
    })
  })
  return L.join('\n')
}

/** Nội dung một hướng ở mục 3 của tài liệu, đủ các phần theo đúng thứ tự: câu hỏi chính, ý triển khai,
 *  đào sâu bằng 6 câu hỏi, collocation & pattern áp dụng, chuỗi lập luận, đoạn mẫu. */
function DirectionView({ id, no, g, onClose }: { id: string; no: number; g: DirectionGuide; onClose: () => void }) {
  return (
    <section className={`tc-guide ${g.kind === 'actor' ? 't-m' : 't-g'}`} aria-label={`Hướng ${no}: ${g.name.vi}`}>
      <header className="tc-ghead">
        <span className="tc-gno">{no}</span>
        <span className="tc-gname">
          <b>{g.name.vi}</b>
          <small lang="en">{g.name.en}</small>
        </span>
        <span className="mt-tag">{g.kind === 'actor' ? 'Đối tượng · WHO' : 'Khía cạnh · WHAT / WHEN'}</span>
        <button type="button" className="mt-mini" onClick={onClose}>
          <Icon name="x" />
          Đóng
        </button>
      </header>
      <p className="tc-gq">
        {g.question.vi}
        <small lang="en">{g.question.en}</small>
      </p>

      <DirSection
        title="Ý triển khai"
        en="Ideas to develop"
        hint="Dưới mỗi ý là câu hoàn chỉnh dùng được cho mọi đề (phần bổ sung, không có trong tài liệu): thay “this problem / this policy” bằng chủ đề của đề."
      >
        <ul className="tc-gex is-plain">
          {g.ideas.map((p) => {
            const ex = ideaSentences(id, p.en)
            return (
              <li key={p.vi}>
                <span className="tc-gvi is-main">{p.vi}</span>
                <Rich className="tc-gen is-sub" lang="en" text={p.en} />
                {ex.length > 0 && (
                  <ul className="tc-ideaex" aria-label="Câu hoàn chỉnh">
                    {ex.map((e) => (
                      <li key={e.en}>
                        <Rich className="tc-gen" lang="en" text={e.en} />
                        <span className="tc-gvi">{e.vi}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </DirSection>

      <DirSection
        title="Đào sâu bằng 6 câu hỏi · ý triển khai"
        en="Six questions · ideas to develop"
        hint="Mỗi câu tiếng Anh áp dụng một pattern ở mục 2; nhãn dưới câu là pattern đó và mức độ."
      >
        {SIX_W.map((w) => {
          const row = g.six[w.key]
          return (
            <div key={w.key} className="tc-wblock">
              <p className="tc-gsum">
                <span className="tc-wtag">{w.label}</span>
                <span>{row.vi}</span>
                <Rich lang="en" text={row.en} />
              </p>
              <ol className="tc-gex">
                {row.ex.map((e) => (
                  <li key={e.en}>
                    <Rich className="tc-gen" lang="en" text={e.en} />
                    <span className="tc-gvi">{e.vi}</span>
                    <PatTag pattern={e.pattern} meaning={e.meaning} level={e.level} />
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
      </DirSection>

      <DirSection title="Collocation & pattern áp dụng" en="Collocations & patterns in use">
        <ul className="tc-gex is-plain">
          {g.colls.map((c) => (
            <li key={c.pattern}>
              <PatTag pattern={c.pattern} meaning={c.meaning} level={c.level} />
              <Rich className="tc-gen" lang="en" text={c.en} />
              <span className="tc-gvi">{c.vi}</span>
            </li>
          ))}
        </ul>
      </DirSection>

      <DirSection title="Chuỗi lập luận" en="Line of reasoning">
        <p className="tc-gvi is-main">{g.chain.vi}</p>
        <p className="tc-gen is-sub" lang="en">
          {g.chain.en}
        </p>
      </DirSection>

      <DirSection title="Đoạn mẫu · band 6.0–6.5" en="Model paragraph">
        <p className="tc-gen" lang="en">
          {g.sample.en}
        </p>
        <p className="tc-gvi">{g.sample.vi}</p>
      </DirSection>
    </section>
  )
}

/** Một phần của hướng, tiêu đề song ngữ như tài liệu. */
function DirSection({ title, en, hint, children }: { title: string; en: string; hint?: string; children: ReactNode }) {
  return (
    <div className="tc-gblock tc-dirsec">
      <small>
        {title} <span lang="en">· {en}</span>
      </small>
      {hint && <p className="mt-hint">{hint}</p>}
      {children}
    </div>
  )
}

/** Nhãn pattern dưới câu ví dụ: khung câu, nghĩa (nếu có), mức độ. */
function PatTag({ pattern, meaning, level }: { pattern: string; meaning?: string; level: PatternLevel }) {
  return (
    <span className={`tc-gpat lv-${level}`}>
      <code lang="en">{pattern}</code>
      <span>{meaning ? `${meaning} · ${LEVEL_VI[level]}` : LEVEL_VI[level]}</span>
    </span>
  )
}
