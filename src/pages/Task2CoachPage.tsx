// Trang "Luyện Task 2" — người học tự làm một đề IELTS Writing Task 2 theo từng bước.
//   Bước 1 · Nhận dạng đề: dán đề, tự tách 4 lớp, tự chọn dạng đề rồi mới so với app, chốt quan điểm.
//   Bước 2 · Phát triển ý: 6 câu hỏi tìm ý thô; mỗi thân bài chọn 1 chủ thể + 1–2 khía cạnh và tự viết
//            chuỗi Ý chính → Giải thích → Ví dụ → Kết quả (DATA/huong-dan-song-ngu.md mục 7).
// Bên trái là chỗ tìm ý; bên phải là ĐÚNG 13 câu của outline dạng đề đã chọn (DATA/outline-dang-de.html):
// mỗi câu hiện câu mẫu trong sách (vế màu, mẫu câu Expand/Example) và một ô để người học viết câu đó.
// Ý tìm được ở bước 2 hiện kèm trong khối thân bài để tham chiếu, bấm vào thì nhảy về đúng ô.
// Gợi ý chia hai mức: câu hỏi gợi mở trước, ý và pattern từ tài liệu sau. App không viết sẵn bài luận.
// Dữ liệu: src/data/task2Coach.ts · task2MindMap.ts · task2Outlines.ts · task2Patterns.ts
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import '@fontsource/overpass/600.css'
import '@fontsource/overpass/700.css'
import '@fontsource/overpass/800.css'
import '@fontsource/overpass-mono/500.css'
import '@fontsource/overpass-mono/600.css'
import Icon from '../components/Icon'
import type { PageKey } from './pages'
import { DIRECTIONS, ESSAY_TYPES, SIX_W, findDirection, findEssayType, type Direction, type SixWKey } from '../data/task2MindMap'
import {
  OUTLINE_CHOICES,
  defaultChoice,
  findOutline,
  outlineFor,
  segsToText,
  type Outline,
  type OutlineLine,
  type Seg,
  type Tone,
} from '../data/task2Outlines'
import { findPatternGroup, type PatternGroup } from '../data/task2Patterns'
import {
  ANGLES,
  BODY_TIP,
  CHAIN,
  PICK_TIP,
  SIXW_FIT,
  mainGroups,
  type ChainField,
} from '../data/task2Coach'
import { detectEssayType } from '../services/essayType'
import { CloudApi } from '../services/cloud/CloudApiClient'
import { errText } from '../services/cloud/cloudError'
import '../styles/mindmap.css'
import '../styles/task2coach.css'

// ------------------------------------------------------------------ Trạng thái
interface Body {
  actor: string | null // hướng 1–5
  aspects: string[] // hướng 6–12, tối đa MAX_ASPECTS
  main: string
  explain: string
  example: string
  result: string
}

interface CoachState {
  step: 1 | 2
  prompt: string
  typeId: string | null // người học tự chọn, app chỉ đối chiếu khi được hỏi
  choice: string | null // kiểu outline của dạng Ưu / Nhược điểm: listing · adv · dis
  compared: boolean
  sixw: Record<SixWKey, string>
  bodies: [Body, Body]
  lines: Record<string, string> // câu người học viết cho từng câu 1–13 của outline (khóa = số câu)
}

const STORE_KEY = 'task2_coach_v1'

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
const MAX_ASPECTS = 2
const EMPTY_BODY: Body = { actor: null, aspects: [], main: '', explain: '', example: '', result: '' }
const INITIAL: CoachState = {
  step: 1,
  prompt: '',
  typeId: null,
  choice: null,
  compared: false,
  sixw: { who: '', why: '', what: '', how: '', when: '', which: '' },
  bodies: [EMPTY_BODY, EMPTY_BODY],
  lines: {},
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

function loadState(): CoachState {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const s = JSON.parse(raw) as Partial<CoachState>
      return {
        ...INITIAL,
        ...s,
        // Bản lưu cũ có thể chứa dạng đề không còn luyện, hoặc dạng Ưu / Nhược điểm chưa có kiểu outline
        typeId: isBookType(s.typeId) ? s.typeId : null,
        choice: splitChoices(s.typeId).some((c) => c.id === s.choice) ? s.choice! : (splitChoices(s.typeId)[0]?.id ?? null),
        sixw: { ...INITIAL.sixw, ...s.sixw },
        lines: { ...migrateLines(s as Record<string, string | undefined>), ...s.lines },
        bodies: [
          { ...EMPTY_BODY, ...s.bodies?.[0] },
          { ...EMPTY_BODY, ...s.bodies?.[1] },
        ],
      }
    }
  } catch {
    /* bộ nhớ trình duyệt bị chặn — dùng trạng thái mặc định */
  }
  return INITIAL
}

const has = (s: string) => s.trim().length > 0
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)
const fieldId = (key: string) => `tc-f-${key.replace(/\./g, '-')}`
const ACTORS = DIRECTIONS.filter((d) => d.group === 'actor')
const ASPECTS = DIRECTIONS.filter((d) => d.group === 'aspect')

// ------------------------------------------------------------------ Trang
export default function Task2CoachPage({ onNavigate }: { onNavigate?: (p: PageKey) => void }) {
  const [st, setSt] = useState<CoachState>(loadState)
  const [copied, setCopied] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const workRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(st))
    } catch {
      /* không lưu được thì thôi, trang vẫn chạy */
    }
  }, [st])

  const patch = (p: Partial<CoachState>) => setSt((s) => ({ ...s, ...p }))
  const patchBody = (i: 0 | 1, p: Partial<Body>) =>
    setSt((s) => {
      const bodies: [Body, Body] = [...s.bodies]
      bodies[i] = { ...bodies[i], ...p }
      return { ...s, bodies }
    })

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

  // Thesis chưa viết thì ghép tạm từ hai ý chính ở bước 2 — vẫn là chữ của người học.
  const mains = st.bodies.map((b) => b.main.trim()).filter(Boolean)
  const thesisDraft = mains.join(' và ')

  const step1Checks = [
    { key: 'prompt', label: 'Dán đề bài', ok: has(st.prompt) },
    { key: 'type', label: 'Chọn dạng đề', ok: Boolean(type) },
  ]
  const bodyChecks = (b: Body) => [
    { key: 'dirs', label: '1 chủ thể + 1–2 khía cạnh', ok: Boolean(b.actor) && b.aspects.length > 0 },
    ...CHAIN.map((c) => ({ key: c.key, label: c.label, ok: has(b[c.key]) })),
  ]
  const step2Checks = [...bodyChecks(st.bodies[0]), ...bodyChecks(st.bodies[1])]
  const done1 = step1Checks.filter((c) => c.ok).length
  const done2 = step2Checks.filter((c) => c.ok).length

  // ---------------------------------------------------------------- Hành động
  /** Chuyển bước rồi đưa con trỏ vào đúng ô (dùng khi bấm một dòng của outline). */
  const goTo = (step: 1 | 2, key?: string) => {
    patch({ step })
    requestAnimationFrame(() => {
      if (!key) {
        // Đổi bước: đưa cột phải về đầu để còn thấy thanh bước
        workRef.current?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      const el = document.getElementById(fieldId(key))
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      {
        ;(el as HTMLElement).focus({ preventScroll: true })
        el.closest('.tc-field')?.classList.add('is-flash')
        window.setTimeout(() => el.closest('.tc-field')?.classList.remove('is-flash'), 1200)
      }
    })
  }

  const chooseOption = (o: TypeOption) => patch({ typeId: o.typeId, choice: o.choiceId ?? null })

  const toggleAspect = (i: 0 | 1, id: string) => {
    const b = st.bodies[i]
    if (b.aspects.includes(id)) patchBody(i, { aspects: b.aspects.filter((x) => x !== id) })
    else if (b.aspects.length < MAX_ASPECTS) patchBody(i, { aspects: [...b.aspects, id] })
  }

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

  const outlineText = buildOutlineText(st, outline, type?.en, type?.vi, bodyNames, thesisDraft)

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

  const reset = () => {
    if (!window.confirm('Xóa đề bài và toàn bộ nội dung bạn đã viết ở cả hai bước? Thao tác này không hoàn tác được.')) return
    setMsg(null)
    setSt(INITIAL)
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

  // ---------------------------------------------------------------- Bước 2
  const renderBody = (i: 0 | 1) => {
    const b = st.bodies[i]
    const actor = b.actor ? findDirection(b.actor) : undefined
    const picked = [actor, ...b.aspects.map(findDirection)].filter((d): d is Direction => Boolean(d))
    const checks = bodyChecks(b)
    return (
      <Card key={i} no={`2.${i + 2}`} title={`Thân bài ${i + 1} · ${bodyNames[i]}`} hint={BODY_TIP} aside={<Progress done={checks.filter((c) => c.ok).length} total={checks.length} />}>
        <div className="tc-field" id={fieldId(`body${i}.dirs`)} tabIndex={-1}>
          <span className="tc-flabel">
            <b>Chủ thể · WHO</b>
            <small>Ai làm, hoặc ai chịu ảnh hưởng? Chọn 1.</small>
          </span>
          <div className="mt-chips">
            {ACTORS.map((d) => (
              <button
                type="button"
                key={d.id}
                className={b.actor === d.id ? 'mt-chip tc-pick is-on' : 'mt-chip tc-pick'}
                aria-pressed={b.actor === d.id}
                onClick={() => patchBody(i, { actor: b.actor === d.id ? null : d.id })}
                title={d.question}
              >
                {d.no}. {d.vi}
              </button>
            ))}
          </div>
          <span className="tc-flabel">
            <b>Khía cạnh · WHAT / WHEN</b>
            <small>
              Tác động nằm ở mặt nào? Chọn 1–2 ({b.aspects.length}/{MAX_ASPECTS}).
            </small>
          </span>
          <div className="mt-chips">
            {ASPECTS.map((d) => {
              const on = b.aspects.includes(d.id)
              return (
                <button
                  type="button"
                  key={d.id}
                  className={on ? 'mt-chip tc-pick is-on' : 'mt-chip tc-pick'}
                  aria-pressed={on}
                  disabled={!on && b.aspects.length >= MAX_ASPECTS}
                  onClick={() => toggleAspect(i, d.id)}
                  title={d.question}
                >
                  {d.no}. {d.vi}
                </button>
              )
            })}
          </div>
        </div>

        <ol className="tc-chain">
          {CHAIN.map((c) => (
            <li key={c.key} className={has(b[c.key]) ? 'tc-field is-done' : 'tc-field'}>
              <span className="tc-flabel">
                <b>{c.label}</b>
                <small>{c.tag}</small>
              </span>
              <Field id={fieldId(`body${i}.${c.key}`)} value={b[c.key]} onChange={(v) => patchBody(i, { [c.key]: v } as Partial<Body>)} placeholder={c.asks[0]} />
              <HintBox
                field={c}
                picked={picked}
                groups={c.key === 'main' ? mainGroups(bodyNames[i]) : c.groups}
                bodyName={bodyNames[i]}
                onInsert={(p) => patchBody(i, { [c.key]: appendText(b[c.key], p) } as Partial<Body>)}
              />
            </li>
          ))}
        </ol>
      </Card>
    )
  }

  const renderStep2 = () => (
    <>
      <div className="tc-carry" aria-label="Mang từ bước 1">
        <span>
          <small>Đề</small>
          <b lang="en">{has(st.prompt) ? clip(st.prompt.trim(), 90) : 'chưa dán đề'}</b>
        </span>
        <span>
          <small>Dạng đề</small>
          <b>{option ? option.vi : type ? type.vi : 'chưa chọn'}</b>
        </span>
        <button type="button" className="mt-link" onClick={() => goTo(1)}>
          Sửa ở bước 1
          <Icon name="right" />
        </button>
      </div>

      <Card no="2.1" title="Tìm ý thô bằng 6 câu hỏi" hint="Ghi nhanh vài từ cho mỗi câu, chưa cần đúng ngữ pháp. Câu có nhãn là câu hợp với dạng đề của bạn.">
        <div className="tc-sixw">
          {SIX_W.map((w) => {
            const fit = SIXW_FIT[w.key]
            const match = Boolean(type) && (fit.types === '*' || fit.types.includes(type!.id))
            return (
              <label key={w.key} className={match ? 'tc-field is-fit' : 'tc-field'}>
                <span className="tc-flabel">
                  <b lang="en">{w.label}</b>
                  <small>
                    {w.question} <i>Nghĩ tới {fit.dirs}.</i>
                  </small>
                  {match && <span className="mt-tag is-on">hợp dạng đề</span>}
                </span>
                <Field id={fieldId(`sixw.${w.key}`)} rows={1} value={st.sixw[w.key]} onChange={(v) => patch({ sixw: { ...st.sixw, [w.key]: v } })} placeholder="Ghi nhanh ý của bạn" />
              </label>
            )
          })}
        </div>
        <details className="tc-more">
          <summary>
            <Icon name="right" />
            Bí ý? Thử 8 góc phân tích
          </summary>
          <dl className="mt-facts is-tight">
            {ANGLES.map((a) => (
              <div key={a.en}>
                <dt>
                  {a.vi} <span lang="en">· {a.en}</span>
                </dt>
                <dd>{a.ask}</dd>
              </div>
            ))}
          </dl>
        </details>
        <p className="mt-hint">{PICK_TIP}</p>
      </Card>

      {renderBody(0)}
      {renderBody(1)}

      <StepNav prev={{ label: 'Về bước 1', onClick: () => goTo(1) }} note="Đọc lại outline bên phải: hai ý chính có trả lời đúng phần đề mà mỗi đoạn lo không?" />
    </>
  )

  // ---------------------------------------------------------------- Outline bên phải: đúng 13 câu của outline đã chọn
  const setLine = (no: number, v: string) => setSt((s) => ({ ...s, lines: { ...s.lines, [String(no)]: v } }))
  const lineOf = (no: number) => st.lines[String(no)] ?? ''

  /** Ý đã tìm ở bước 2 cho một thân bài — hiện trong khối để tham chiếu khi viết, bấm thì về đúng ô. */
  const renderBodyIdeas = (i: 0 | 1) => {
    const b = st.bodies[i]
    const dirs = [b.actor, ...b.aspects].map((id) => (id ? findDirection(id) : undefined)).filter((d): d is Direction => Boolean(d))
    const ideas = CHAIN.filter((c) => has(b[c.key]))
    return (
      <div className="tc-oideas">
        <button type="button" className={dirs.length ? 'tc-odirs' : 'tc-odirs is-empty'} onClick={() => goTo(2, `body${i}.dirs`)}>
          {dirs.length ? dirs.map((d) => <span key={d.id}>{d.vi}</span>) : 'Chưa chọn chủ thể và khía cạnh ở bước 2'}
        </button>
        {ideas.length > 0 && (
          <ul className="tc-oidea-list">
            {ideas.map((c) => (
              <li key={c.key}>
                <button type="button" className="tc-olabel" onClick={() => goTo(2, `body${i}.${c.key}`)} title="Mở ô này ở bước 2">
                  {c.label}
                  <Icon name="right" />
                </button>
                <span>{b[c.key]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const renderOutlineLine = (l: OutlineLine, tone: Tone | 'm') => {
    const no = l.no
    const value = lineOf(no)
    const template = segsToText(l.text, st.choice ?? undefined)
    const placeholder = no === 2 && has(thesisDraft) ? `Ghép tạm từ hai ý chính: ${thesisDraft}` : l.guide
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
        {!l.minor && <Sentence segs={l.text} choice={st.choice ?? undefined} />}
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
        <Field id={`tc-o-${no}`} rows={1} value={value} onChange={(v) => setLine(no, v)} placeholder={placeholder} className="tc-oinput" ariaLabel={`Câu ${no} · ${l.role}`} />
        {no === 2 && !has(value) && has(thesisDraft) && (
          <button type="button" className="mt-mini tc-use" onClick={() => setLine(2, thesisDraft)}>
            <Icon name="pencil" />
            Lấy bản ghép tạm để sửa
          </button>
        )}
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
            <p className="mt-hint">
              13 câu đúng như outline {outline.name} trong sách. Mỗi câu: câu mẫu ở trên, ô viết của bạn ở dưới. Bấm “Dùng khung” hoặc một mẫu câu để chèn vào ô rồi thay S + V bằng ý của bạn.
            </p>
            {OPARTS.map((pt) => {
              const tone: Tone | 'm' = pt.from === 3 ? outline.threads[0] : pt.from === 8 ? outline.threads[1] : 'm'
              const bodyIdx: 0 | 1 | null = pt.from === 3 ? 0 : pt.from === 8 ? 1 : null
              return (
                <section key={pt.from} className={`tc-opart t-${tone}`}>
                  <header>
                    <b>{pt.title(bodyNames)}</b>
                    <small>{pt.to > pt.from ? `câu ${pt.from}–${pt.to}` : `câu ${pt.from}`}</small>
                  </header>
                  {bodyIdx !== null && renderBodyIdeas(bodyIdx)}
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
  const steps = [
    { no: 1 as const, label: 'Nhận dạng đề', done: done1, total: step1Checks.length },
    { no: 2 as const, label: 'Phát triển ý', done: done2, total: step2Checks.length },
  ]
  return (
    <div className="page mt-page tc-page">
      <div className="mt-head">
        <div>
          <h1>Luyện Task 2</h1>
          <p>Viết 13 câu outline ở giữa. Cột bên phải dẫn từng bước: nhận dạng đề rồi tìm ý cho hai thân bài. App chỉ đặt câu hỏi và đưa tài liệu, không viết sẵn bài cho bạn.</p>
        </div>
        <button type="button" className="mt-btn" onClick={reset}>
          <Icon name="refresh" />
          Làm lại
        </button>
      </div>

      <div className="tc-layout">
        {/* Giữa: outline 13 câu là chỗ viết chính */}
        <section className="tc-main tc-outline" aria-label="Outline">
          {renderOutline()}
        </section>

        {/* Phải: các bước hỗ trợ tìm ý, dính khi cuộn */}
        <aside className="mt-panel tc-side" aria-label="Hỗ trợ viết">
          <nav className="tc-steps" aria-label="Các bước">
            {steps.map((s, k) => (
              <button
                key={s.no}
                type="button"
                className={['tc-stepbtn', st.step === s.no ? 'is-on' : '', s.done === s.total ? 'is-done' : ''].filter(Boolean).join(' ')}
                aria-current={st.step === s.no ? 'step' : undefined}
                onClick={() => goTo(s.no)}
              >
                <span className="tc-stepno">{s.done === s.total ? <Icon name="check" /> : s.no}</span>
                <span className="tc-steptxt">
                  <small>Bước {s.no}</small>
                  <b>{s.label}</b>
                </span>
                <Progress done={s.done} total={s.total} />
                {k === 0 && <span className="tc-steparrow" aria-hidden="true" />}
              </button>
            ))}
          </nav>
          <div className="tc-work" ref={workRef} aria-label={`Bước ${st.step}`}>
            {st.step === 1 ? renderStep1() : renderStep2()}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Outline dạng chữ
function appendText(cur: string, add: string): string {
  const c = cur.replace(/\s+$/, '')
  return c ? `${c} ${add}` : add
}

function buildOutlineText(
  st: CoachState,
  outline: Outline | undefined,
  typeEn: string | undefined,
  typeVi: string | undefined,
  bodyNames: [string, string],
  thesisDraft: string,
): string {
  const L: string[] = []
  if (has(st.prompt)) L.push(`Đề bài: ${st.prompt.trim()}`)
  if (typeEn) L.push(`Dạng đề: ${typeEn} (${typeVi})${outline ? ` · outline ${outline.name}` : ''}`)
  if (!outline) return L.join('\n')
  OPARTS.forEach((pt) => {
    L.push('', pt.title(bodyNames).toUpperCase())
    if (pt.from === 3 || pt.from === 8) {
      const b = st.bodies[pt.from === 3 ? 0 : 1]
      const dirs = [b.actor, ...b.aspects]
        .map((id) => (id ? findDirection(id)?.vi : undefined))
        .filter(Boolean)
        .join(', ')
      if (dirs) L.push(`(${dirs})`)
    }
    outline.lines.slice(pt.from - 1, pt.to).forEach((l) => {
      const mine = (st.lines[String(l.no)] ?? '').trim() || (l.no === 2 ? thesisDraft : '')
      const tpl = l.minor ? (l.patterns ?? []).join(' / ') : segsToText(l.text, st.choice ?? undefined)
      L.push(`${l.no}. ${l.role}: ${mine || `[${tpl}]`}`)
    })
  })
  return L.join('\n')
}

/** Câu mẫu trong outline, vế tô màu như ô màu trong sách. */
function Sentence({ segs, choice }: { segs: Seg[]; choice?: string }) {
  const groups: { tone?: Tone; segs: Seg[] }[] = []
  segs.forEach((sg) => {
    const last = groups[groups.length - 1]
    if (!sg.label && last && last.tone === sg.tone && !last.segs[0].label) last.segs.push(sg)
    else groups.push({ tone: sg.tone, segs: [sg] })
  })
  return (
    <p className="mt-sentence tc-otpl" lang="en">
      {groups.map((gr, i) => {
        const inner = gr.segs.map((sg, k) => {
          if (sg.label) return <span key={k} className="mt-lb">{sg.t}</span>
          if (choice && sg.byChoice?.[choice]) return <span key={k} className="mt-fill">{sg.byChoice[choice]}</span>
          if (sg.blank) return <span key={k} className="mt-blank" aria-label="chỗ trống" />
          return sg.strong ? <b key={k}>{sg.t}</b> : <span key={k}>{sg.t}</span>
        })
        return gr.tone ? (
          <span key={i} className={`mt-ve t-${gr.tone}`}>
            {inner}
          </span>
        ) : (
          <span key={i}>{inner}</span>
        )
      })}
    </p>
  )
}

// ------------------------------------------------------------------ Thành phần dùng chung
/** Ô nhập tự giãn theo nội dung. */
function Field({
  id,
  value,
  onChange,
  placeholder,
  rows = 2,
  lang,
  className = 'tc-input',
  ariaLabel,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  lang?: string
  className?: string
  ariaLabel?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value, placeholder])
  return (
    <textarea
      ref={ref}
      id={id}
      className={className}
      rows={rows}
      lang={lang}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function Card({ no, title, hint, aside, locked, children }: { no: string; title: string; hint?: string; aside?: ReactNode; locked?: string; children: ReactNode }) {
  return (
    <section className={locked ? 'tc-card is-locked' : 'tc-card'}>
      <header className="tc-card-head">
        <span className="tc-cardno">{no}</span>
        <div>
          <h3>{title}</h3>
          {hint && <p>{hint}</p>}
        </div>
        {aside}
      </header>
      {locked ? <p className="mt-empty">{locked}</p> : <div className="tc-card-body">{children}</div>}
    </section>
  )
}

function Progress({ done, total }: { done: number; total: number }) {
  return (
    <span className={done === total ? 'tc-prog is-full' : 'tc-prog'} aria-label={`${done} trên ${total} mục`}>
      <span className="tc-bar">
        <i style={{ width: `${(done / total) * 100}%` }} />
      </span>
      <b>
        {done}/{total}
      </b>
    </span>
  )
}

function StepNav({ prev, next, note }: { prev?: { label: string; onClick: () => void }; next?: { label: string; onClick: () => void }; note?: string }) {
  return (
    <div className="tc-stepnav">
      {note && <p className="mt-hint">{note}</p>}
      <div className="mt-row">
        {prev && (
          <button type="button" className="mt-btn" onClick={prev.onClick}>
            <Icon name="undo" />
            {prev.label}
          </button>
        )}
        {next && (
          <button type="button" className="mt-btn is-primary" onClick={next.onClick}>
            {next.label}
            <Icon name="right" />
          </button>
        )}
      </div>
    </div>
  )
}

/** Danh sách pattern của vài nhóm ở mục 2; bấm một pattern để chèn khung câu vào ô đang viết. */
function PatternBox({ title, groups, onInsert }: { title: string; groups: string[]; onInsert: (p: string) => void }) {
  const list = groups.map(findPatternGroup).filter((g): g is PatternGroup => Boolean(g))
  return (
    <details className="tc-more">
      <summary>
        <Icon name="right" />
        {title}
      </summary>
      {list.map((g) => (
        <div key={g.id} className="tc-pgroup">
          <h4>
            {g.vi} <span lang="en">· {g.en}</span>
          </h4>
          <div className="mt-chips">
            {g.items
              .filter((it) => it.skill !== 'S')
              .map((it) => (
                <button type="button" key={it.pattern} className={`mt-chip is-phrase tc-pat lv-${it.level}`} onClick={() => onInsert(it.pattern)} title={`${it.ex}\n${it.exVi}`}>
                  <span>
                    <b lang="en">{it.pattern}</b>
                    <small>{it.vi}</small>
                  </span>
                </button>
              ))}
          </div>
        </div>
      ))}
      <p className="mt-hint">Bấm để chèn khung câu vào ô, rồi thay sb / sth bằng ý của bạn. Rê chuột lên để xem câu ví dụ.</p>
    </details>
  )
}

/** Gợi ý hai mức cho một câu trong chuỗi lập luận: câu hỏi gợi mở → ý mẫu từ tài liệu. */
function HintBox({ field, picked, groups, bodyName, onInsert }: { field: ChainField; picked: Direction[]; groups: string[]; bodyName: string; onInsert: (p: string) => void }) {
  const [level, setLevel] = useState(0)
  if (level === 0)
    return (
      <button type="button" className="tc-hintbtn" onClick={() => setLevel(1)}>
        <Icon name="bulb" />
        Cần gợi ý?
      </button>
    )
  const asks = field.key === 'main' ? [`Đoạn này lo phần "${bodyName}" của đề.`, ...picked.slice(0, 1).map((d) => d.question), ...field.asks.slice(1)] : field.asks
  return (
    <div className="tc-hint">
      <ul className="tc-asks">
        {asks.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      {level === 1 ? (
        <button type="button" className="tc-hintbtn" onClick={() => setLevel(2)}>
          <Icon name="book" />
          Vẫn bí? Xem ý từ tài liệu
        </button>
      ) : (
        <>
          {picked.length === 0 ? (
            <p className="mt-hint">Chọn chủ thể và khía cạnh ở trên để xem ý mẫu của đúng hướng đó.</p>
          ) : (
            picked.map((d) => <DirectionIdeas key={d.id} d={d} field={field} />)
          )}
          <PatternBox title="Pattern hợp với câu này" groups={groups} onInsert={onInsert} />
        </>
      )}
      <button type="button" className="tc-hintclose" onClick={() => setLevel(0)} aria-label="Ẩn gợi ý">
        Ẩn gợi ý
      </button>
    </div>
  )
}

/** Ý mẫu của một hướng cho đúng câu đang viết: ý triển khai, hàng 6 câu hỏi, chuỗi lập luận. */
function DirectionIdeas({ d, field }: { d: Direction; field: ChainField }) {
  const rows: ReactNode[] = []
  if (field.key === 'main')
    rows.push(
      <div key="ideas" className="mt-chips">
        {d.phrases.map((p) => (
          <span key={p.vi} className="tc-idea" title={p.en}>
            {p.vi}
            {p.en && <small lang="en">{p.en}</small>}
          </span>
        ))}
      </div>,
    )
  field.sixw
    .filter((k) => k !== 'who')
    .forEach((k) =>
      rows.push(
        <p key={k} className="tc-sixrow">
          <b lang="en">{k.toUpperCase()}</b>
          <span>
            {d.sixW[k].vi}
            <small lang="en">{d.sixW[k].en}</small>
          </span>
        </p>,
      ),
    )
  if (field.key === 'example' || field.key === 'result')
    rows.push(
      <p key="chain" className="tc-sixrow">
        <b>Chuỗi mẫu</b>
        <span>{d.chain.join(' → ')}</span>
      </p>,
    )
  return (
    <div className="tc-dir">
      <h4>
        {d.no}. {d.vi} <span lang="en">· {d.en}</span>
      </h4>
      {rows}
    </div>
  )
}
