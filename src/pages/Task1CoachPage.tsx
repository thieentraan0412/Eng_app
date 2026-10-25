// Trang "Luyện Task 1" — người học tự làm một đề IELTS Writing Task 1 theo từng bước, cùng bố cục với Luyện Task 2.
//   Bước 1 · Nhận dạng đề: dán đề, tự chọn dạng (Compare / Trend + Compare) rồi mới so với app.
//   Bước 2 · Công thức: bảng công thức và mẫu câu của dạng đã chọn (DATA/compare.md · DATA/trendandcompare.md).
// Bên trái là outline của dạng đề: mỗi câu có câu khung (bấm chỗ [..] để chọn cách viết), mẫu câu theo tình huống
// số liệu và một ô để người học viết câu đó. Tài liệu chỉ để chọn mẫu, app không viết sẵn bài.
// Trang mở ra danh sách bài (bảng task1_essays trên Supabase, đồng bộ app ↔ web); mọi thay đổi tự lưu sau khi ngừng gõ.
// Dữ liệu: src/data/task1Outlines.ts
import { useEffect, useMemo, useRef, useState } from 'react'
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
  RichTable,
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
import { T1_TYPES, detectT1Type, findT1Type, t1Lines, type T1Block, type T1Line, type T1Type, type T1TypeId } from '../data/task1Outlines'
import { segsToText, type Tone } from '../data/task2Outlines'
import { CloudApi, type Task1Essay } from '../services/cloud/CloudApiClient'
import { errText, isMissingSchema } from '../services/cloud/cloudError'
import '../styles/mindmap.css'
import '../styles/task2coach.css'
import '../styles/task1coach.css'

// ------------------------------------------------------------------ Trạng thái
interface T1State {
  step: 1 | 2
  prompt: string
  typeId: T1TypeId | null // người học tự chọn, app chỉ đối chiếu khi được hỏi
  compared: boolean
  lines: Record<string, string> // câu người học viết, khóa = lineKey (dạng đề · số câu)
  fills: Record<string, string> // chữ chọn cho chỗ [..] trong câu khung (khóa = slotKey)
}

const NEED_SQL = 'Chưa có bảng lưu bài Luyện Task 1. Mở Supabase → SQL Editor, chạy file supabase/task1_essays.sql rồi tải lại trang.'
const MIN_WORDS = 150

const INITIAL: T1State = {
  step: 1,
  prompt: '',
  typeId: null,
  compared: false,
  lines: {},
  fills: {},
}

/** Câu viết tách theo dạng đề: đổi dạng không đè mất câu đã viết của dạng kia. */
const lineKey = (typeId: T1TypeId, no: number) => `${typeId}.${no}`

/** Hai tuyến màu của một dạng = màu Body 1 và Body 2 (mép thẻ, chấm lọc). */
const threadsOf = (t: T1Type): [Tone, Tone] => {
  const bodies = t.parts.slice(-2).map((p) => (p.tone === 'm' ? 'o' : p.tone))
  return [bodies[0], bodies[1]]
}

/** Dữ liệu một bài đọc từ cloud → trạng thái đủ trường. */
function normalize(raw: unknown): T1State {
  if (!raw || typeof raw !== 'object') return INITIAL
  const s = raw as Partial<T1State>
  return {
    ...INITIAL,
    ...s,
    typeId: findT1Type(s.typeId) ? s.typeId! : null,
    lines: { ...s.lines },
    fills: { ...s.fills },
  }
}

/** Tên bài trong danh sách = câu đầu của đề. */
const titleOf = (s: T1State) => clip(s.prompt.trim().replace(/\s+/g, ' '), 140)

/** Câu người học đã viết cho outline của dạng đang chọn. */
const writtenOf = (s: T1State, t: T1Type) => t1Lines(t).map((l) => (s.lines[lineKey(t.id, l.no)] ?? '').trim())

/** Tóm tắt một bài cho thẻ trong danh sách. */
function summarize(s: T1State) {
  const type = findT1Type(s.typeId)
  const written = type ? writtenOf(s, type) : []
  return { type, filled: written.filter(has).length, total: type ? written.length : 0 }
}

// Bộ lọc danh sách — nhớ trong trình duyệt để quay lại trang vẫn còn
type StatusFilter = 'all' | 'doing' | 'done'
interface ListFilter {
  q: string
  type: string // 'all' · id dạng đề · 'none' (chưa chọn dạng)
  status: StatusFilter
}
const FILTER_KEY = 'task1_list_filter'
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

// ------------------------------------------------------------------ Trang: danh sách bài
export default function Task1CoachPage({ onNavigate }: { onNavigate?: (p: PageKey) => void }) {
  const [essays, setEssays] = useState<Task1Essay[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ListFilter>(loadFilter)

  const fail = (e: unknown) => setError(isMissingSchema(e, 'task1_essays') ? NEED_SQL : errText(e))

  const load = async (alive: () => boolean = () => true) => {
    setLoading(true)
    setError(null)
    try {
      const rows = await CloudApi.listTask1Essays()
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

  const items = useMemo(
    () =>
      essays.map((e) => {
        const s = normalize(e.data)
        const sum = summarize(s)
        return { e, s, ...sum, typeKey: sum.type?.id ?? 'none', done: sum.total > 0 && sum.filled === sum.total }
      }),
    [essays],
  )
  // Nút lọc chỉ hiện dạng đề đang có bài, "chưa chọn" ở cuối
  const typeChips = useMemo(() => {
    const count = (key: string) => items.filter((it) => it.typeKey === key).length
    const chips: { id: string; label: string; tones?: [Tone, Tone]; count: number }[] = T1_TYPES.filter((t) => count(t.id) > 0).map((t) => ({
      id: t.id,
      label: t.en,
      tones: threadsOf(t),
      count: count(t.id),
    }))
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
      const row = await CloudApi.createTask1Essay('', INITIAL)
      setEssays((l) => [row, ...l])
      setOpenId(row.id)
    } catch (e) {
      fail(e)
    } finally {
      setCreating(false)
    }
  }

  const remove = async (e: Task1Essay) => {
    if (!window.confirm(`Xóa bài "${e.title || 'chưa có đề'}"? Thao tác này không hoàn tác được.`)) return
    setError(null)
    try {
      await CloudApi.deleteTask1Essay(e.id)
      setEssays((l) => l.filter((x) => x.id !== e.id))
    } catch (err) {
      fail(err)
    }
  }

  // Editor lưu xong một lần thì cập nhật dòng đó, đẩy lên đầu danh sách
  const onSaved = (row: Task1Essay) => setEssays((l) => [row, ...l.filter((x) => x.id !== row.id)])

  const open = essays.find((e) => e.id === openId)
  if (open) return <Task1Editor key={open.id} essay={open} onBack={() => setOpenId(null)} onSaved={onSaved} onNavigate={onNavigate} />

  const patchFilter = (p: Partial<ListFilter>) => setFilter((f) => ({ ...f, ...p }))

  return (
    <div className="page mt-page tc-page">
      <div className="tc-lib">
        <div className="mt-head">
          <div>
            <h1>Luyện Task 1</h1>
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
        ) : !error || items.length ? (
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
                type={it.type}
                state={it.s}
                filled={it.filled}
                total={it.total}
                onOpen={() => setOpenId(it.e.id)}
                onDelete={() => remove(it.e)}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

/** Thẻ một bài: mép trên hai màu thân bài, đề bài, dải ô theo các phần của outline. */
function EssayCard({
  title,
  updated,
  type,
  state,
  filled,
  total,
  onOpen,
  onDelete,
}: {
  title: string
  updated: string
  type?: T1Type
  state: T1State
  filled: number
  total: number
  onOpen: () => void
  onDelete: () => void
}) {
  const tones = type ? threadsOf(type) : undefined
  const done = total > 0 && filled === total
  // Chưa chọn dạng: dải xám theo khung của dạng đầu tiên
  const frame = type ?? T1_TYPES[0]
  return (
    <li className={tones ? 'tc-ecard' : 'tc-ecard is-untyped'}>
      <span className="tc-estripe" aria-hidden="true">
        <i className={tones ? `t-${tones[0]}` : undefined} />
        <i className={tones ? `t-${tones[1]}` : undefined} />
      </span>
      <span className="tc-etype">
        <ToneDots tones={tones} />
        {type?.en ?? 'Chưa chọn dạng đề'}
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
        <span className="tc-strip" role="img" aria-label={type ? `Đã viết ${filled} trên ${total} câu outline` : 'Chưa chọn dạng đề'}>
          {frame.parts.flatMap((pt, k) =>
            pt.lines.map((l, j) => {
              const on = type && has(state.lines[lineKey(type.id, l.no)] ?? '')
              const cls = [type ? `t-${pt.tone}` : 't-x', on ? 'is-on' : '', k > 0 && j === 0 ? 'is-gap' : '']
              return <i key={l.no} className={cls.filter(Boolean).join(' ')} />
            }),
          )}
        </span>
        <b className={done ? 'tc-ecount is-full' : 'tc-ecount'}>{type ? `${filled}/${total}` : '–'}</b>
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
function Task1Editor({
  essay,
  onBack,
  onSaved,
  onNavigate,
}: {
  essay: Task1Essay
  onBack: () => void
  onSaved: (row: Task1Essay) => void
  onNavigate?: (p: PageKey) => void
}) {
  const [st, setSt] = useState<T1State>(() => normalize(essay.data))
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [tab, setTab] = useState<string>('') // phần công thức đang xem ở bước 2
  const workRef = useRef<HTMLDivElement>(null)

  const { save, saveErr, flush } = useAutosave(st, (s) => CloudApi.updateTask1Essay(essay.id, titleOf(s), s), onSaved)

  const back = async () => {
    setLeaving(true)
    const ok = await flush()
    setLeaving(false)
    if (!ok && !window.confirm('Chưa lưu được thay đổi mới nhất lên cloud. Vẫn quay lại danh sách? Phần chưa lưu sẽ mất.')) return
    onBack()
  }

  const patch = (p: Partial<T1State>) => setSt((s) => ({ ...s, ...p }))

  // ---------------------------------------------------------------- Dữ liệu suy ra
  const detected = useMemo(() => detectT1Type(st.prompt), [st.prompt])
  const type = findT1Type(st.typeId)
  const lines = type ? t1Lines(type) : []

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

  const essayText = type ? buildEssayText(st, type) : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(essayText)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = essayText
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const createDraft = async () => {
    if (busy || !type) return
    setBusy(true)
    setMsg(null)
    try {
      const head = st.prompt.trim().replace(/\s+/g, ' ')
      const title = head ? `Task 1 – ${clip(head, 60)}` : 'Bài Task 1'
      await CloudApi.createWriting(title, essayText, countWords(essayText), 'IELTS Task 1')
      setMsg({ ok: true, text: 'Đã tạo bài nháp từ các câu đã viết. Đang mở trang Viết.' })
      onNavigate?.('writing')
    } catch (e) {
      setMsg({ ok: false, text: `Không tạo được bài nháp: ${errText(e)}. Bài vẫn còn ở đây, bạn có thể bấm Chép bài.` })
    } finally {
      setBusy(false)
    }
  }

  // ---------------------------------------------------------------- Bước 1
  const renderStep1 = () => (
    <>
      <Card no="1.1" title="Đề bài" hint="Dán nguyên văn đề, kể cả câu mô tả biểu đồ.">
        <Field
          id="t1-prompt"
          lang="en"
          rows={3}
          value={st.prompt}
          onChange={(v) => patch({ prompt: v, compared: false })}
          placeholder="Ví dụ: The bar chart shows the number of male and female students enrolled in four courses at a college in 2023."
        />
      </Card>

      <Card
        no="1.2"
        title="Đây là dạng đề nào?"
        hint="Nhìn mốc thời gian trong đề: một năm (hoặc không có năm) là so sánh; nhiều năm, số liệu thay đổi qua thời gian là xu hướng. Chọn xong mới so với app."
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
          {T1_TYPES.map((t) => {
            const on = type?.id === t.id
            const appPick = st.compared && t.id === detected
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={['tc-type', on ? 'is-on' : '', appPick ? 'is-app' : ''].filter(Boolean).join(' ')}
                onClick={() => patch({ typeId: t.id })}
              >
                <span className="tc-radio" aria-hidden="true">
                  {on && <Icon name="check" />}
                </span>
                <span className="tc-type-txt">
                  <b>{t.vi}</b>
                  <small>{t.note}</small>
                  <small lang="en">Ví dụ: {t.signal}</small>
                  <small lang="en" className="tc-outline-name">
                    Outline: {t.en}
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
              'App cũng nhận ra dạng này. Bạn đọc đúng mốc thời gian.'
            ) : (
              <>
                <Icon name="alert" />
                App đoán là {findT1Type(detected)?.vi}. Đọc lại mốc thời gian trong đề: có mấy năm? App chỉ dò số năm nên có thể sai, bạn quyết định.
              </>
            )}
          </p>
        )}
      </Card>

      <StepNav
        next={{ label: 'Sang bước 2 · Công thức', onClick: () => goTo(2) }}
        note={done1 < step1Checks.length ? `Còn ${step1Checks.length - done1} mục chưa xong. Bạn vẫn sang bước 2 được, rồi quay lại sau.` : undefined}
      />
    </>
  )

  // ---------------------------------------------------------------- Bước 2: bảng công thức của dạng đề
  const renderStep2 = () => {
    if (!type) {
      return (
        <Card no="2.1" title="Công thức và mẫu câu" locked="Chọn dạng đề ở mục 1.2 để xem công thức của dạng đó.">
          {null}
        </Card>
      )
    }
    const cur = type.guide.find((g) => g.id === tab) ?? type.guide[0]
    return (
      <Card no="2.1" title={`Công thức · ${type.en}`} hint="Chép theo tài liệu. Đọc số liệu của đề rồi chọn đúng mẫu theo tình huống; câu khung bên trái dùng chung các công thức này.">
        <section className="tc-guide t-m" aria-label={`Công thức ${type.en}`}>
          <div className="mt-seg tc-gtabs" role="group" aria-label="Phần của bài">
            {type.guide.map((g) => (
              <button type="button" key={g.id} aria-pressed={cur.id === g.id} onClick={() => setTab(g.id)}>
                {g.label}
              </button>
            ))}
          </div>
          {cur.blocks.map((b, i) => (
            <GuideBlock key={i} b={b} />
          ))}
        </section>
      </Card>
    )
  }

  // ---------------------------------------------------------------- Outline bên trái
  const lineOf = (no: number) => (type ? st.lines[lineKey(type.id, no)] ?? '' : '')
  const setLine = (no: number, v: string) => {
    if (!type) return
    setSt((s) => ({ ...s, lines: { ...s.lines, [lineKey(type.id, no)]: v } }))
  }

  /** Chọn chữ cho một chỗ [..]. Ô còn trống thì ráp luôn câu vào ô; ô đang chứa câu khung cũ thì thay
   *  bằng câu mới; câu người học đã tự sửa thì để nguyên. */
  const pickSlot = (l: T1Line, i: number, v: string | null) => {
    if (!type) return
    const id = type.id
    const key = lineKey(id, l.no)
    setSt((s) => {
      const fills = { ...s.fills }
      if (v) fills[slotKey(id, l.no, i)] = v
      else delete fills[slotKey(id, l.no, i)]
      const before = segsToText(withFills(l.text, lineFills(s.fills, id, l)))
      const after = segsToText(withFills(l.text, lineFills(fills, id, l)))
      const cur = s.lines[key] ?? ''
      const line = !has(cur) ? (v ? after : cur) : cur.includes(before) ? cur.replace(before, after) : cur
      return { ...s, fills, lines: { ...s.lines, [key]: line } }
    })
  }

  const renderLine = (l: T1Line, tone: Tone | 'm') => {
    const no = l.no
    const value = lineOf(no)
    const fills = type ? lineFills(st.fills, type.id, l) : {}
    // Câu có mở câu (Overview) thì khung là phần mở, mẫu tình huống nối tiếp phía sau
    const template = l.lead ?? segsToText(withFills(l.text, fills))
    return (
      <div key={no} className={has(value) ? 'tc-oline' : 'tc-oline is-empty'}>
        <div className="tc-oline-head">
          <span className={`mt-n t-${tone}`}>{no}</span>
          <span className="tc-orole">{l.role}</span>
          <button type="button" className="mt-mini" onClick={() => setLine(no, appendText(value, template))} title="Chèn câu khung vào ô để sửa">
            <Icon name="pencil" />
            Dùng khung
          </button>
        </div>
        <Sentence segs={l.text} fills={fills} onPick={(i, v) => pickSlot(l, i, v)} />
        {l.tip && <p className="mt-hint t1-tip">{l.tip}</p>}
        {l.convert && (
          <div className="t1-convert" aria-label="Đổi Noun Phrase thành Noun Clause">
            <small>Trong đề → khi viết lại</small>
            <ul lang="en">
              {l.convert.map((c) => (
                <li key={c.from}>
                  <span>{c.from}</span>
                  <Icon name="right" />
                  <b>{c.to}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
        {l.cases && (
          <div className="t1-cases" role="group" aria-label="Mẫu theo tình huống số liệu">
            {l.cases.map((c) => (
              <button
                type="button"
                key={c.when}
                className="mt-chip is-phrase t1-case"
                onClick={() => setLine(no, appendText(has(value) ? value : l.lead ?? '', c.en))}
                title="Bấm để chèn vào ô"
              >
                <span>
                  <small>{c.when}</small>
                  <span lang="en">{c.en}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        <Field id={`t1-o-${no}`} rows={1} lang="en" value={value} onChange={(v) => setLine(no, v)} placeholder={l.guide} className="tc-oinput" ariaLabel={`Câu ${no} · ${l.role}`} />
      </div>
    )
  }

  const renderOutline = () => {
    const filled = lines.filter((l) => has(lineOf(l.no))).length
    const words = type ? countWords(writtenOf(st, type).join(' ')) : 0
    let from = 0
    return (
      <>
        <div className="tc-ohead">
          <div>
            <span className="mt-kicker">
              <span className="mt-bullet t-m">Outline</span>
              <span>{type ? type.en : 'chưa có dạng đề'}</span>
            </span>
            <h2>Dàn bài của bạn</h2>
          </div>
          {type && (
            <span className="t1-ostat">
              <span className={words >= MIN_WORDS ? 't1-words is-full' : 't1-words'} title={`Task 1 cần tối thiểu ${MIN_WORDS} từ`}>
                {words}/{MIN_WORDS} từ
              </span>
              <Progress done={filled} total={lines.length} />
            </span>
          )}
        </div>
        {!type ? (
          <p className="mt-empty">Chọn dạng đề ở mục 1.2 để hiện outline của dạng đó.</p>
        ) : (
          type.parts.map((pt) => {
            const a = from + 1
            from += pt.lines.length
            return (
              <section key={pt.title} className={`tc-opart t-${pt.tone}`}>
                <header>
                  <b>{pt.title}</b>
                  <small>{from > a ? `câu ${a}–${from}` : `câu ${a}`}</small>
                </header>
                {pt.lines.map((l) => renderLine(l, pt.tone))}
              </section>
            )
          })
        )}

        <div className="mt-actions">
          <button type="button" className="mt-btn is-primary" onClick={createDraft} disabled={busy || !type}>
            <Icon name="pen" />
            {busy ? 'Đang tạo bài nháp…' : 'Viết bài từ dàn bài này'}
          </button>
          <button type="button" className="mt-btn" onClick={() => void copy()} disabled={!type}>
            <Icon name={copied ? 'check' : 'copy'} />
            {copied ? 'Đã chép' : 'Chép bài'}
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
  const steps: StepItem[] = [
    { no: 1, label: 'Nhận dạng đề', done: done1, total: step1Checks.length },
    { no: 2, label: 'Công thức' },
  ]
  return (
    <div className="page mt-page tc-page tc-editor">
      <EditorTop onBack={back} leaving={leaving} save={save} saveErr={saveErr} onRetry={() => void flush()} />
      <div className="tc-layout">
        {/* Trái: outline là chỗ viết chính */}
        <section className="tc-main tc-outline" aria-label="Outline">
          {renderOutline()}
        </section>

        {/* Phải: các bước hỗ trợ */}
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

// ------------------------------------------------------------------ Bài dạng chữ
/** Đề + các đoạn Intro / Overview / Body; câu chưa viết thì để câu khung trong [ngoặc]. */
function buildEssayText(st: T1State, type: T1Type): string {
  const L: string[] = []
  if (has(st.prompt)) L.push(`Đề bài: ${st.prompt.trim()}`)
  L.push(`Dạng đề: ${type.en}`)
  type.parts.forEach((pt) => {
    const para = pt.lines.map((l) => {
      const mine = (st.lines[lineKey(type.id, l.no)] ?? '').trim()
      return mine || `[${l.lead ?? segsToText(withFills(l.text, lineFills(st.fills, type.id, l)))}]`
    })
    L.push('', para.join(' '))
  })
  return L.join('\n')
}

// ------------------------------------------------------------------ Bảng công thức
/** Một khối trong bảng công thức: tiêu đề, giải thích, khung công thức, danh sách, bảng, bài mẫu, ghi chú. */
function GuideBlock({ b }: { b: T1Block }) {
  return (
    <div className="tc-gblock t1-block">
      {b.title && <small>{b.title}</small>}
      {b.text && (
        <p>
          <Rich text={b.text} />
        </p>
      )}
      {b.formula && (
        <p className="t1-formula" lang="en">
          {b.formula}
        </p>
      )}
      {b.list && (
        <ul className="tc-gex is-plain">
          {b.list.map((x) => (
            <li key={x}>
              <Rich className="tc-gen" text={x} />
            </li>
          ))}
        </ul>
      )}
      {b.rows && <RichTable head={b.head} rows={b.rows} />}
      {b.essay && (
        <div className="t1-essay" lang="en">
          {b.essay.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      )}
      {b.note && (
        <p className="tc-gvi">
          <Rich text={b.note} />
        </p>
      )}
    </div>
  )
}
