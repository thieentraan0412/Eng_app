// Trang "Tư duy" — sơ đồ từng bước xử lý một đề IELTS Writing Task 2.
// Sáu bước xếp dọc: Phân tích đề → Dạng đề → Quan điểm → Tìm ý → Outline 13 câu → Viết bài.
// Mỗi bước là một thẻ chứa dữ liệu của riêng bước đó; lựa chọn của bước trên được mang sang
// bước dưới (hiện trên mũi tên nối hai thẻ). Bấm một nút → bảng bên phải hiện chi tiết,
// bấm dạng đề / quan điểm → hiện format bài viết 13 câu (DATA/outline-dang-de.html).
// Dữ liệu: src/data/task2MindMap.ts · src/data/task2Outlines.ts
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import '@fontsource/overpass/600.css'
import '@fontsource/overpass/700.css'
import '@fontsource/overpass/800.css'
import '@fontsource/overpass-mono/500.css'
import '@fontsource/overpass-mono/600.css'
import Icon from '../components/Icon'
import type { PageKey } from './pages'
import { DIRECTIONS, ESSAY_TYPES, SIX_W, findDirection, findEssayType, type Direction, type EssayType } from '../data/task2MindMap'
import {
  OUTLINE_CHOICES,
  defaultChoice,
  findOutline,
  outlineFor,
  segText,
  segsToText,
  type Outline,
  type OutlineLine,
  type Seg,
  type Tone,
} from '../data/task2Outlines'
import { detectEssayType } from '../services/essayType'
import { speak, stopSpeaking, ttsSupported } from '../services/tts'
import { CloudApi } from '../services/cloud/CloudApiClient'
import { errText } from '../services/cloud/cloudError'
import '../styles/mindmap.css'

// ------------------------------------------------------------------ Trạng thái
interface MindState {
  prompt: string
  manualType: string | null // người dùng tự chọn dạng đề (đè lên kết quả dò)
  choices: Record<string, string> // quan điểm / kiểu outline theo từng dạng đề
  picks: string[] // hướng được chọn làm ý cho bài, tối đa MAX_PICKS
  active: string // nút đang xem chi tiết
}

const STORE_KEY = 'mindmap_task2_v3'
const MAX_PICKS = 2
const INITIAL: MindState = {
  prompt: '',
  manualType: null,
  choices: {},
  picks: [],
  active: 'root',
}

function loadState(): MindState {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return { ...INITIAL, ...(JSON.parse(raw) as Partial<MindState>) }
  } catch {
    /* bộ nhớ trình duyệt bị chặn — dùng trạng thái mặc định */
  }
  return INITIAL
}

const TONE_NAME: Record<Tone, string> = {
  g: 'xanh lá',
  r: 'đỏ',
  p: 'tím',
  o: 'cam',
}
const PARTS: { from: number; to: number; title: (o: Outline) => string }[] = [
  { from: 1, to: 2, title: () => 'Mở bài' },
  { from: 3, to: 7, title: (o) => `Thân bài 1 · ${o.bodyNames[0]}` },
  { from: 8, to: 12, title: (o) => `Thân bài 2 · ${o.bodyNames[1]}` },
  { from: 13, to: 13, title: () => 'Kết bài' },
]

const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
const choiceNodeId = (typeId: string, choiceId: string) => `choice.${typeId}.${choiceId}`

/** Tách id nút "choice.<type>.<choice>" → { typeId, choiceId }. */
function parseChoiceNode(id: string): { typeId: string; choiceId: string } | null {
  const m = /^choice\.(type\.[a-z]+)\.([a-z]+)$/.exec(id)
  return m ? { typeId: m[1], choiceId: m[2] } : null
}

// ------------------------------------------------------------------ Sơ đồ từng bước
// Trình tự theo DATA/cac-buoc-lam-bai.html và outline-dang-de.html. Trong thẻ một bước,
// các nút cấp đầu xếp lưới; nút con treo thụt vào dưới nút cha theo kiểu cây.

/** Một nút trong cây của một bước. */
interface TNode {
  id: string
  label: string
  sub?: string
  no?: string
  kind: 'group' | 'leaf'
  tone?: Tone | 'm'
  chosen?: boolean // dạng đề / quan điểm đang dùng
  picked?: boolean // hướng đã chọn làm ý
  minor?: boolean // câu Expand / Example trong outline
  flags?: ReactNode
  kids?: TNode[]
}

type StepStatus = 'done' | 'now' | 'todo'

const STATUS_TEXT: Record<StepStatus, string> = {
  done: 'Xong',
  now: 'Đang làm',
  todo: 'Chưa làm',
}

interface FlowStep {
  id: string
  no: number
  label: string
  time?: string
  done: boolean
  /** Bước trước chưa cho dữ liệu nên bước này chưa làm được. */
  lock?: string
  intro?: ReactNode
  kids: TNode[]
  extra?: ReactNode
  /** Kết quả của bước, mang sang bước sau. */
  carry?: { label: string; value: string; empty: boolean }
}

/** Đường dẫn id từ đầu bước tới nút `target` (để tô sáng cả nhánh đang xem). */
function pathTo(kids: TNode[], target: string): string[] | null {
  for (const k of kids) {
    if (k.id === target) return [k.id]
    const sub = k.kids ? pathTo(k.kids, target) : null
    if (sub) return [k.id, ...sub]
  }
  return null
}

// ------------------------------------------------------------------ Trang
export default function MindMapPage({ onNavigate }: { onNavigate?: (p: PageKey) => void }) {
  const [st, setSt] = useState<MindState>(loadState)
  const [copied, setCopied] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const detailRef = useRef<HTMLElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(st))
    } catch {
      /* không lưu được thì thôi, trang vẫn chạy */
    }
  }, [st])

  useEffect(() => () => stopSpeaking(), [])

  // Bấm một phần / một câu ở bước 5 → cuộn bảng bên phải tới đúng chỗ đó.
  useEffect(() => {
    const id = st.active
    if (id.startsWith('line.')) jumpToLine(Number(id.slice(5)))
    else if (id.startsWith('part.')) {
      // Đợi bảng bên phải dựng xong format rồi mới cuộn.
      requestAnimationFrame(() => {
        const el = document.getElementById(`mt-part-${id.slice(5)}`)
        if (el) scrollPanelTo(el, 'start')
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.active])

  const patch = (p: Partial<MindState>) => setSt((s) => ({ ...s, ...p }))

  const detected = useMemo(() => detectEssayType(st.prompt), [st.prompt])
  const typeId = st.manualType ?? detected
  const type = typeId ? findEssayType(typeId) : undefined
  const choiceList = typeId ? (OUTLINE_CHOICES[typeId] ?? []) : []
  const choice = typeId ? (st.choices[typeId] ?? defaultChoice(typeId, st.prompt)) : undefined
  const choiceItem = choiceList.find((c) => c.id === choice)
  const outline = typeId ? outlineFor(typeId, choice) : undefined
  const picks = st.picks.map(findDirection).filter((d): d is Direction => Boolean(d))

  // Dán đề → app nhận ra dạng đề → nhảy thẳng tới format của dạng đó.
  const prevDetected = useRef(detected)
  useEffect(() => {
    if (detected && detected !== prevDetected.current) setSt((s) => ({ ...s, active: detected }))
    prevDetected.current = detected
  }, [detected])

  // ---------------------------------------------------------------- Hành động
  const scrollToDetail = () => {
    if (window.matchMedia('(max-width: 1180px)').matches) {
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      )
    }
  }

  const reveal = (id: string) => {
    patch({ active: id })
    scrollToDetail()
  }

  /** Dùng một dạng đề (và quan điểm nếu có) cho bài đang làm. */
  const useType = (id: string, choiceId?: string) =>
    setSt((s) => ({
      ...s,
      manualType: id === detected ? null : id,
      choices: choiceId ? { ...s.choices, [id]: choiceId } : s.choices,
    }))

  const chooseType = (id: string | null) =>
    setSt((s) => ({
      ...s,
      manualType: id === detected ? null : id,
      active: id ?? 'root',
    }))

  const togglePick = (id: string) =>
    setSt((s) => {
      if (s.picks.includes(id)) return { ...s, picks: s.picks.filter((x) => x !== id) }
      if (s.picks.length >= MAX_PICKS) return s
      return { ...s, picks: [...s.picks, id] }
    })

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

  const say = (key: string, text: string) => {
    if (speaking === key) {
      stopSpeaking()
      setSpeaking(null)
      return
    }
    stopSpeaking()
    setSpeaking(key)
    speak(text, 0.95, () => setSpeaking((k) => (k === key ? null : k)))
  }

  const createDraft = async (t: EssayType, o: Outline, text: string) => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    try {
      const head = st.prompt.trim().replace(/\s+/g, ' ')
      const title = head ? `Task 2 – ${clip(head, 60)}` : `Dàn bài Task 2 – ${o.name}`
      await CloudApi.createWriting(title, text, countWords(text), 'IELTS Task 2')
      useType(t.id)
      setMsg({ ok: true, text: 'Đã tạo bài nháp. Đang mở trang Viết.' })
      onNavigate?.('writing')
    } catch (e) {
      setMsg({
        ok: false,
        text: `Không tạo được bài nháp: ${errText(e)}. Dàn bài vẫn còn ở đây, bạn có thể bấm Chép dàn bài.`,
      })
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    if (!window.confirm('Xóa đề bài, dạng đề, quan điểm và các ý đã chọn? Thao tác này không hoàn tác được.')) return
    stopSpeaking()
    setMsg(null)
    setSt(INITIAL)
  }

  // Cuộn BẢNG bên phải (không cuộn cả trang) tới một phần tử trong format, rồi nháy sáng nó.
  // Màn hẹp thì bảng không còn khung cuộn riêng → cuộn trang như bình thường.
  const scrollPanelTo = (el: HTMLElement, where: 'start' | 'center') => {
    const panel = detailRef.current
    if (panel && panel.scrollHeight > panel.clientHeight) {
      const top = el.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop
      const offset = where === 'center' ? Math.max(0, (panel.clientHeight - el.offsetHeight) / 2) : 12
      panel.scrollTo({ top: Math.max(0, top - offset), behavior: 'smooth' })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: where })
    }
    el.classList.add('is-flash')
    window.setTimeout(() => el.classList.remove('is-flash'), 1200)
  }

  const jumpToLine = (no: number) => {
    const el = document.getElementById(`mt-line-${no}`)
    if (el) scrollPanelTo(el, 'center')
  }

  // ---------------------------------------------------------------- Mảnh UI nhỏ
  const copyBtn = (k: string, text: string, label = 'Chép') => (
    <button type="button" className="mt-mini" onClick={() => copy(k, text)} title="Chép vào bộ nhớ tạm">
      <Icon name={copied === k ? 'check' : 'copy'} />
      {copied === k ? 'Đã chép' : label}
    </button>
  )

  const speakBtn = (k: string, text: string) =>
    ttsSupported ? (
      <button type="button" className="mt-mini" onClick={() => say(k, text)}>
        <Icon name={speaking === k ? 'stop' : 'speak'} />
        {speaking === k ? 'Dừng' : 'Nghe'}
      </button>
    ) : null

  const patternChips = (key: string, list: string[]) => (
    <div className="mt-chips" lang="en">
      {list.map((p, i) => (
        <button type="button" key={p} className="mt-chip" onClick={() => copy(`${key}.${i}`, p)} title="Bấm để chép">
          {copied === `${key}.${i}` && <Icon name="check" />}
          <span dangerouslySetInnerHTML={{ __html: highlightSlots(p) }} />
        </button>
      ))}
    </div>
  )

  // ---------------------------------------------------------------- Dựng các bước
  const promptText = st.prompt.trim().replace(/\s+/g, ' ')
  const draft = type && outline ? buildDraft(st.prompt, type, outline, choice, choiceItem?.label, picks) : ''
  const noOpinion = Boolean(type) && choiceList.length === 0

  const dirLeaf = (d: Direction): TNode => ({
    id: d.id,
    kind: 'leaf',
    label: d.vi,
    sub: d.en,
    no: String(d.no),
    picked: st.picks.includes(d.id),
    flags: st.picks.includes(d.id) ? <Icon name="star" className="mt-star" /> : null,
  })

  const steps: FlowStep[] = [
    {
      id: 'step.analyze',
      no: 1,
      label: 'Phân tích đề',
      time: '2 phút',
      done: Boolean(promptText),
      intro: promptText ? (
        <q className="fl-quote" lang="en">
          {clip(promptText, 180)}
        </q>
      ) : (
        <p className="fl-empty">Dán đề vào ô Đề bài ở trên. App tự nhận dạng đề và điền sẵn bước 2.</p>
      ),
      kids: [
        { id: 'layer.topic', kind: 'leaf', no: 'a', label: 'Chủ đề chung', sub: 'môi trường, giáo dục, công nghệ…' },
        { id: 'layer.issue', kind: 'leaf', no: 'b', label: 'Vấn đề cụ thể', sub: 'khía cạnh hẹp mà đề thật sự hỏi' },
        { id: 'layer.task', kind: 'leaf', no: 'c', label: 'Yêu cầu', sub: 'câu lệnh cuối đề → dạng đề' },
        { id: 'layer.limit', kind: 'leaf', no: 'd', label: 'Từ giới hạn', sub: 'all, only, children…' },
      ],
      carry: { label: 'Đề bài', value: promptText ? clip(promptText, 70) : 'chưa dán đề', empty: !promptText },
    },
    {
      id: 'step.types',
      no: 2,
      label: 'Nhận dạng dạng đề',
      time: '7 dạng',
      done: Boolean(type),
      kids: ESSAY_TYPES.map<TNode>((t) => ({
        id: t.id,
        kind: 'leaf',
        label: t.vi,
        sub: t.en,
        chosen: t.id === typeId,
        flags: t.id === detected ? <span className="mt-tag is-auto">tự nhận</span> : null,
      })),
      carry: { label: 'Dạng đề', value: type ? type.vi : 'chưa chọn', empty: !type },
    },
    {
      id: 'ideas.choice',
      no: 3,
      label: 'Chốt quan điểm',
      done: Boolean(type) && (noOpinion || Boolean(choiceItem)),
      lock: type ? undefined : 'Chọn dạng đề ở bước 2 trước',
      intro: noOpinion ? (
        <p className="fl-empty">{type?.id === 'type.discuss' ? 'Nêu quan điểm ở thân bài 2 và kết bài.' : 'Dạng này không cần ý kiến riêng.'}</p>
      ) : undefined,
      kids: typeId
        ? choiceList.map<TNode>((c) => ({
            id: choiceNodeId(typeId, c.id),
            kind: 'leaf',
            label: c.label,
            sub: findOutline(c.outlineId)?.name,
            chosen: c.id === choice,
          }))
        : [],
      carry: {
        label: 'Quan điểm',
        value: choiceItem ? choiceItem.label : noOpinion ? 'không cần' : 'chưa chọn',
        empty: !choiceItem && !noOpinion,
      },
    },
    {
      id: 'step.ideas',
      no: 4,
      label: 'Tìm ý',
      time: `4 phút · ★ ${picks.length}/${MAX_PICKS}`,
      done: picks.length >= MAX_PICKS,
      kids: [
        {
          id: 'ideas.sixw',
          kind: 'group',
          label: '6 câu hỏi',
          sub: 'tự hỏi đề để ra ý',
          kids: SIX_W.map<TNode>((w) => ({ id: `sixw.${w.key}`, kind: 'leaf', label: w.label, sub: w.question })),
        },
        { id: 'grp.actor', kind: 'group', label: 'Chủ thể', sub: 'WHO · HOW — ai làm gì', kids: DIRECTIONS.filter((d) => d.group === 'actor').map(dirLeaf) },
        { id: 'grp.aspect', kind: 'group', label: 'Khía cạnh', sub: 'WHAT · WHEN — lợi, hại, hệ quả', kids: DIRECTIONS.filter((d) => d.group === 'aspect').map(dirLeaf) },
      ],
      carry: {
        label: `Ý ★ ${picks.length}/${MAX_PICKS}`,
        value: picks.length ? picks.map((d) => d.vi).join(' · ') : 'chưa chọn ý',
        empty: !picks.length,
      },
    },
    {
      id: 'step.outline',
      no: 5,
      label: 'Outline 13 câu',
      time: outline ? (outline.source === 'book' ? 'từ sách' : 'bổ sung') : undefined,
      done: Boolean(outline),
      lock: outline ? undefined : 'Cần dạng đề từ bước 2',
      kids: outline
        ? PARTS.map<TNode>((pt) => {
            const tone: Tone | 'm' = pt.from === 3 ? outline.threads[0] : pt.from === 8 ? outline.threads[1] : 'm'
            return {
              id: `part.${pt.from}`,
              kind: 'group',
              label: pt.title(outline),
              sub: pt.to > pt.from ? `câu ${pt.from}–${pt.to}` : `câu ${pt.from}`,
              tone,
              kids: outline.lines.slice(pt.from - 1, pt.to).map<TNode>((l) => ({
                id: `line.${l.no}`,
                kind: 'leaf',
                label: l.role,
                no: String(l.no),
                tone,
                minor: l.minor,
              })),
            }
          })
        : [],
      carry: { label: 'Outline', value: outline ? outline.name : 'chưa có', empty: !outline },
    },
    {
      id: 'step.write',
      no: 6,
      label: 'Viết bài',
      time: '30 phút',
      done: false,
      lock: outline ? undefined : 'Cần outline từ bước 5',
      kids: [],
      extra:
        type && outline ? (
          <div className="fl-write">
            <p className="fl-empty">Dàn bài gom đủ dữ liệu của 5 bước trên: đề, dạng đề, quan điểm, ý đã chọn và 13 câu.</p>
            <div className="mt-row">
              <button type="button" className="mt-btn is-primary" onClick={() => createDraft(type, outline, draft)} disabled={busy}>
                <Icon name="pen" />
                {busy ? 'Đang tạo bài nháp…' : 'Tạo bài nháp ở trang Viết'}
              </button>
              <button type="button" className="mt-btn" onClick={() => copy('flow.draft', draft)}>
                <Icon name={copied === 'flow.draft' ? 'check' : 'copy'} />
                {copied === 'flow.draft' ? 'Đã chép' : 'Chép dàn bài'}
              </button>
            </div>
            {msg && (
              <p className={msg.ok ? 'mt-note' : 'mt-warn'} role="status">
                {!msg.ok && <Icon name="alert" />}
                {msg.text}
              </p>
            )}
          </div>
        ) : undefined,
    },
  ]
  const firstOpen = steps.findIndex((s) => !s.done)

  const renderNode = (n: TNode, onPath: Set<string>) => {
    const active = st.active === n.id
    const cls = [
      'fl-node',
      `k-${n.kind}`,
      n.tone ? `t-${n.tone}` : '',
      active ? 'is-active' : onPath.has(n.id) ? 'is-path' : '',
      n.chosen ? 'is-chosen' : '',
      n.picked ? 'is-picked' : '',
      n.minor ? 'is-minor' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <button type="button" className={cls} onClick={() => reveal(n.id)} aria-current={active ? 'true' : undefined} title={n.sub ? `${n.label} · ${n.sub}` : n.label}>
        {n.no && <span className="fl-no">{n.no}</span>}
        <span className="fl-txt">
          <b>{n.label}</b>
          {n.sub && <small>{n.sub}</small>}
        </span>
        {n.flags}
      </button>
    )
  }

  const renderTree = (kids: TNode[], onPath: Set<string>, top: boolean): ReactNode => (
    <ul className={top ? 'fl-grid' : 'fl-tree'}>
      {kids.map((k) => (
        <li key={k.id}>
          {renderNode(k, onPath)}
          {k.kids && k.kids.length > 0 && renderTree(k.kids, onPath, false)}
        </li>
      ))}
    </ul>
  )

  const renderStep = (s: FlowStep, i: number) => {
    const status: StepStatus = s.done ? 'done' : i === firstOpen ? 'now' : 'todo'
    const onPath = new Set(pathTo(s.kids, st.active) ?? [])
    const headActive = st.active === s.id
    const cls = ['fl-step', `is-${status}`, s.lock ? 'is-locked' : '', headActive || onPath.size ? 'is-open' : ''].filter(Boolean).join(' ')
    return (
      <li key={s.id} className={cls}>
        <article className="fl-card">
          <button type="button" className={headActive ? 'fl-head is-active' : 'fl-head'} onClick={() => reveal(s.id)} aria-current={headActive ? 'true' : undefined}>
            <span className="fl-badge">{s.done ? <Icon name="check" /> : s.no}</span>
            <span className="fl-title">
              <small>
                Bước {s.no}
                {s.time ? ` · ${s.time}` : ''}
              </small>
              <b>{s.label}</b>
            </span>
            <span className="fl-state">{s.lock ? 'Chờ bước trước' : STATUS_TEXT[status]}</span>
          </button>
          {s.lock ? (
            <p className="fl-empty">{s.lock}.</p>
          ) : (
            <div className="fl-body">
              {s.intro}
              {s.kids.length > 0 && renderTree(s.kids, onPath, true)}
              {s.extra}
            </div>
          )}
        </article>
        {s.carry && (
          <div className={s.carry.empty ? 'fl-carry is-empty' : 'fl-carry'}>
            <span className="fl-carry-pill" title={`Mang sang bước ${s.no + 1}`}>
              <small>{s.carry.label}</small>
              <b>{s.carry.value}</b>
              <span className="mt-sr">, mang sang bước {s.no + 1}</span>
            </span>
          </div>
        )}
      </li>
    )
  }

  // ---------------------------------------------------------------- Câu mẫu có vế màu
  const renderSentence = (segs: Seg[], ch?: string) => {
    // Gộp các mảnh liền nhau cùng màu thành một vệt, như ô màu trong sách.
    const groups: { tone?: Tone; segs: Seg[] }[] = []
    segs.forEach((sg) => {
      const lastG = groups[groups.length - 1]
      if (!sg.label && lastG && lastG.tone === sg.tone && !lastG.segs[0].label) lastG.segs.push(sg)
      else groups.push({ tone: sg.tone, segs: [sg] })
    })
    return (
      <span className="mt-sentence" lang="en">
        {groups.map((gr, i) => {
          const inner = gr.segs.map((sg, k) => {
            if (sg.label)
              return (
                <span key={k} className="mt-lb">
                  {sg.t}
                </span>
              )
            if (ch && sg.byChoice?.[ch])
              return (
                <span key={k} className="mt-fill" title="Điền theo quan điểm bạn đã chọn">
                  {sg.byChoice[ch]}
                </span>
              )
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
      </span>
    )
  }

  const thesisPart = (o: Outline, t: Tone, ch?: string) =>
    o.lines[1].text
      .filter((sg) => !sg.label && sg.tone === t)
      .map((sg) => segText(sg, ch))
      .join('')
      .trim()

  const threadNote = (o: Outline, l: OutlineLine, ch?: string): ReactNode => {
    const [t1, t2] = o.threads
    if (t1 === t2) {
      if (l.no === 2) return <p className="mt-note">Quan điểm ở câu 2 và câu 13 phải giống nhau: cùng đồng ý hoặc cùng không đồng ý.</p>
      return null
    }
    if (l.no === 2)
      return (
        <p className="mt-note">
          Vế <b className={`mt-ink t-${t1}`}>{TONE_NAME[t1]}</b> mở thân bài 1 (câu 3), vế{' '}
          <b className={`mt-ink t-${t2}`}>{TONE_NAME[t2]}</b> mở thân bài 2 (câu 8). Câu 13 gom lại cả hai.
        </p>
      )
    if (l.no === 3 || l.no === 8) {
      const t = l.no === 3 ? t1 : t2
      return (
        <p className="mt-note">
          Viết lại vế {TONE_NAME[t]} của câu 2:{' '}
          <span className={`mt-ve t-${t}`} lang="en">
            {thesisPart(o, t, ch)}
          </span>
        </p>
      )
    }
    if (l.no === 13) return <p className="mt-note">Gom lại hai vế của câu 2, diễn đạt khác đi và không thêm ý mới.</p>
    return null
  }

  // ---------------------------------------------------------------- Format bài viết theo dạng đề
  const renderFormatLine = (o: Outline, l: OutlineLine, tone: Tone | 'm', ch?: string) => (
    <div key={l.no} id={`mt-line-${l.no}`} className={l.minor ? 'mt-fmt-line is-minor' : 'mt-fmt-line'}>
      <span className={`mt-n t-${tone}`}>{l.no}</span>
      <div className="mt-fmt-body">
        <div className="mt-fmt-role">
          <span>{l.role}</span>
          {!l.minor && copyBtn(`${o.id}.${l.no}`, segsToText(l.text, ch))}
        </div>
        {!l.minor && renderSentence(l.text, ch)}
        <p className="mt-fmt-guide">{l.guide}</p>
        {l.hint && <p className="mt-hint">{l.hint}</p>}
        {l.ink?.map((n) => (
          <p key={n} className="mt-handnote" lang="en">
            <span aria-hidden="true">✍ </span>
            <span className="mt-sr">Ghi chú tay trong sách: </span>
            {n}
          </p>
        ))}
        {threadNote(o, l, ch)}
        {l.patterns && patternChips(`${o.id}.${l.no}`, l.patterns)}
      </div>
    </div>
  )

  const renderSample = (o: Outline) => {
    const sm = o.sample!
    const paras = PARTS.map((pt) => sm.sentences.slice(pt.from - 1, pt.to).map((s, i) => ({ no: pt.from + i, s })))
    const full = sm.sentences.join(' ')
    return (
      <details className="mt-fmt-sample">
        <summary>
          <Icon name="right" />
          <b>Bài mẫu viết theo format này</b>
          <small>{countWords(full)} từ · số trước mỗi câu là số câu trong outline</small>
        </summary>
        <p className="mt-prompt-ex" lang="en">
          {sm.prompt}
        </p>
        <div className="mt-sec-head">
          <h3>Bài viết</h3>
          <span className="mt-row">
            {speakBtn('sample', full)}
            {copyBtn('sample', full)}
          </span>
        </div>
        <div className="mt-essay" lang="en">
          {paras.map((ps, i) => (
            <p key={i}>
              {ps.map(({ no, s }) => (
                <span key={no}>
                  <button type="button" className="mt-sn" onClick={() => jumpToLine(no)} aria-label={`Xem câu ${no} trong outline`}>
                    {no}
                  </button>
                  {s}{' '}
                </span>
              ))}
            </p>
          ))}
        </div>
      </details>
    )
  }

  const renderFormat = (t: EssayType, forcedChoice?: string) => {
    const list = OUTLINE_CHOICES[t.id] ?? []
    const ch = forcedChoice ?? st.choices[t.id] ?? defaultChoice(t.id, st.prompt)
    const chItem = list.find((c) => c.id === ch)
    const o = outlineFor(t.id, ch)
    const inUse = typeId === t.id && (list.length === 0 || choice === ch)
    const draft = o ? buildDraft(st.prompt, t, o, ch, chItem?.label, picks) : ''
    const pickChoice = (id: string) =>
      setSt((s) => ({
        ...s,
        choices: { ...s.choices, [t.id]: id },
        active: choiceNodeId(t.id, id),
      }))

    return (
      <>
        <PanelHead
          bullet={<span className="mt-bullet t-m">Dạng đề</span>}
          kicker={detected === t.id ? 'Tự nhận từ đề bài' : 'Chọn trên sơ đồ'}
          title={t.vi}
          sub={t.en}
          text={t.task}
        />
        <div className="mt-tags">
          {inUse && <span className="mt-tag is-on">đang dùng cho bài này</span>}
          {o && (
            <span className={o.source === 'book' ? 'mt-tag' : 'mt-tag is-added'}>
              {o.source === 'book' ? 'outline từ sách' : 'outline bổ sung'}
            </span>
          )}
        </div>
        <dl className="mt-facts is-tight">
          <div>
            <dt>Dấu hiệu</dt>
            <dd lang="en">{t.signal}</dd>
          </div>
          <div>
            <dt>Ý kiến riêng?</dt>
            <dd>{t.opinion}</dd>
          </div>
          <div>
            <dt>Thân bài 1</dt>
            <dd>{o ? o.bodyNames[0] : t.body1}</dd>
          </div>
          <div>
            <dt>Thân bài 2</dt>
            <dd>{o ? o.bodyNames[1] : t.body2}</dd>
          </div>
        </dl>

        {list.length > 0 && (
          <Section title="Quan điểm của bạn">
            <div className="mt-seg" role="group" aria-label="Quan điểm">
              {list.map((c) => (
                <button type="button" key={c.id} aria-pressed={ch === c.id} onClick={() => pickChoice(c.id)}>
                  {ch === c.id && <Icon name="check" />}
                  {c.label}
                </button>
              ))}
            </div>
            <p className="mt-hint">{chItem ? chItem.note : 'Chọn một quan điểm để outline điền sẵn chỗ nêu ý kiến.'}</p>
          </Section>
        )}

        <div className="mt-actions">
          <button type="button" className={inUse ? 'mt-btn is-on' : 'mt-btn is-primary'} onClick={() => useType(t.id, ch)} disabled={inUse}>
            <Icon name={inUse ? 'check' : 'star'} />
            {inUse ? 'Đang dùng dạng đề này' : 'Dùng dạng đề này cho bài'}
          </button>
        </div>

        {o ? (
          <>
            <Section title={`Format bài viết · ${o.name}`} aside={copyBtn(`outline.${o.id}.${ch ?? ''}`, draft, 'Chép dàn bài')}>
              <p className="mt-colorkey" aria-label="Chú giải màu">
                <span>
                  <i className="t-m" /> mở, kết
                </span>
                <span>
                  <i className={`t-${o.threads[0]}`} /> thân bài 1
                </span>
                <span>
                  <i className={`t-${o.threads[1]}`} /> thân bài 2
                </span>
                <span>
                  <i className="is-minor" /> Expand · Example
                </span>
              </p>
              {PARTS.map((pt) => {
                const tone: Tone | 'm' = pt.from === 3 ? o.threads[0] : pt.from === 8 ? o.threads[1] : 'm'
                return (
                  <section key={pt.from} id={`mt-part-${pt.from}`} className={`mt-fmt-part t-${tone}`}>
                    <header>
                      <b>{pt.title(o)}</b>
                      <small>{pt.to > pt.from ? `câu ${pt.from}–${pt.to}` : `câu ${pt.from}`}</small>
                    </header>
                    {o.lines.slice(pt.from - 1, pt.to).map((l) => renderFormatLine(o, l, tone, ch))}
                  </section>
                )
              })}
            </Section>
            {outlineNotes(o).length > 0 && (
              <Section title="Ghi chú trong sách">
                {o.notes?.map((n) => (
                  <p key={n} className="mt-note">
                    {n}
                  </p>
                ))}
                {o.ink?.map((n) => (
                  <p key={n} className="mt-handnote" lang="en">
                    <span aria-hidden="true">✍ </span>
                    <span className="mt-sr">Ghi chú tay trong sách: </span>
                    {n}
                  </p>
                ))}
                <p className="mt-hint">Nguồn: {o.origin}</p>
              </Section>
            )}
            {o.sample && renderSample(o)}
            <div className="mt-actions">
              <button type="button" className="mt-btn is-primary" onClick={() => createDraft(t, o, draft)} disabled={busy}>
                <Icon name="pen" />
                {busy ? 'Đang tạo bài nháp…' : 'Tạo bài nháp ở trang Viết'}
              </button>
              {msg && (
                <p className={msg.ok ? 'mt-note' : 'mt-warn'} role="status">
                  {!msg.ok && <Icon name="alert" />}
                  {msg.text}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="mt-empty">Dạng đề này chưa có outline.</p>
        )}
      </>
    )
  }

  // ---------------------------------------------------------------- Hướng tìm ý
  const renderDirection = (d: Direction) => {
    const picked = st.picks.includes(d.id)
    const full = !picked && st.picks.length >= MAX_PICKS
    return (
      <>
        <PanelHead
          bullet={<span className="mt-bullet t-m">Hướng {d.no}</span>}
          kicker={d.group === 'actor' ? 'Chủ thể · WHO, HOW' : 'Khía cạnh · WHAT, WHEN'}
          title={d.vi}
          sub={d.en}
          text={d.question}
        />
        <div className="mt-actions">
          <button type="button" className={picked ? 'mt-btn is-on' : 'mt-btn is-primary'} onClick={() => togglePick(d.id)} disabled={full}>
            <Icon name={picked ? 'check' : 'star'} />
            {picked ? 'Đã chọn làm ý · bấm để bỏ' : 'Chọn làm ý cho bài'}
          </button>
          {full && <p className="mt-hint">Đã đủ {MAX_PICKS} ý. Bỏ chọn một ý trước khi chọn ý khác.</p>}
        </div>
        <Section title="Cụm từ có thể dùng" aside={<small className="mt-hint">Bấm để chép</small>}>
          <div className="mt-chips">
            {d.phrases.map((p, i) => (
              <button type="button" key={i} className="mt-chip is-phrase" onClick={() => copy(`${d.id}.p${i}`, p.en ?? p.vi)} title={p.vi}>
                {copied === `${d.id}.p${i}` && <Icon name="check" />}
                <span>
                  <b lang="en">{p.en ?? p.vi}</b>
                  {p.en && <small>{p.vi}</small>}
                </span>
              </button>
            ))}
          </div>
        </Section>
        <Section title="Đào sâu bằng 6 câu hỏi">
          <dl className="mt-sixw">
            {SIX_W.map((w) => (
              <div key={w.key}>
                <dt>{w.label}</dt>
                <dd>
                  <span>{d.sixW[w.key].vi}</span>
                  <button type="button" className="mt-en" lang="en" onClick={() => copy(`${d.id}.${w.key}`, d.sixW[w.key].en)}>
                    {d.sixW[w.key].en}
                    <Icon name={copied === `${d.id}.${w.key}` ? 'check' : 'copy'} />
                  </button>
                </dd>
              </div>
            ))}
          </dl>
        </Section>
        <Section title="Chuỗi lập luận mẫu">
          <ol className="mt-flow">
            {d.chain.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        </Section>
        <Section
          title="Đoạn mẫu band 6.0–6.5"
          aside={
            <span className="mt-row">
              {speakBtn(`${d.id}.s`, d.sample)}
              {copyBtn(`${d.id}.s`, d.sample)}
            </span>
          }
        >
          <blockquote className="mt-quote" lang="en">
            {d.sample}
          </blockquote>
        </Section>
      </>
    )
  }

  const renderIdeas = (group: 'grp.actor' | 'grp.aspect' | 'step.ideas' | 'ideas.choice') => {
    const list =
      group === 'grp.actor'
        ? DIRECTIONS.filter((d) => d.group === 'actor')
        : group === 'grp.aspect'
          ? DIRECTIONS.filter((d) => d.group === 'aspect')
          : []
    return (
      <>
        <PanelHead
          bullet={<span className="mt-bullet t-m">{group === 'ideas.choice' ? 'Bước 3' : 'Bước 4 · 4 phút'}</span>}
          kicker={group === 'ideas.choice' ? 'Chốt quan điểm' : 'Tìm ý'}
          title={group === 'grp.actor' ? 'Chủ thể' : group === 'grp.aspect' ? 'Khía cạnh' : 'Chọn quan điểm và tìm ý'}
          sub={group === 'grp.actor' ? 'WHO · HOW — ai làm gì' : group === 'grp.aspect' ? 'WHAT · WHEN — lợi, hại, hệ quả' : undefined}
          text="Chốt quan điểm trước khi viết và giữ nguyên đến hết bài. Giám khảo chấm cách lập luận, không chấm quan điểm."
        />
        <Section title="Quan điểm">
          {!type ? (
            <p className="mt-empty">Chọn dạng đề ở bước 2 trước, rồi quay lại đây để chốt quan điểm.</p>
          ) : choiceList.length ? (
            <>
              <div className="mt-seg" role="group" aria-label="Quan điểm">
                {choiceList.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    aria-pressed={choice === c.id}
                    onClick={() => setSt((s) => ({ ...s, choices: { ...s.choices, [type.id]: c.id }, active: choiceNodeId(type.id, c.id) }))}
                  >
                    {choice === c.id && <Icon name="check" />}
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="mt-hint">{choiceItem ? choiceItem.note : 'Chưa chọn. Outline ở bước 5 sẽ để trống chỗ nêu quan điểm.'}</p>
            </>
          ) : type.id === 'type.discuss' ? (
            <p className="mt-note">Đặt quan điểm bạn ủng hộ ở thân bài 2 và viết đoạn đó mạnh hơn.</p>
          ) : (
            <p className="mt-note">Dạng {type.vi} không bắt buộc nêu quan điểm riêng. Tập trung tìm ý cho hai thân bài.</p>
          )}
        </Section>
        {list.length > 0 && (
          <Section title={`${list.length} hướng · bấm để xem cụm từ và đoạn mẫu`}>
            <div className="mt-chips">
              {list.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  className={st.picks.includes(d.id) ? 'mt-chip is-pick' : 'mt-chip'}
                  onClick={() => reveal(d.id)}
                >
                  {st.picks.includes(d.id) && <Icon name="star" className="mt-star" />}
                  {d.no}. {d.vi}
                </button>
              ))}
            </div>
          </Section>
        )}
        <Section title={`Ý cho bài · ★ ${picks.length}/${MAX_PICKS}`}>
          {picks.length ? (
            <div className="mt-chips">
              {picks.map((p) => (
                <button type="button" key={p.id} className="mt-chip is-pick" onClick={() => reveal(p.id)}>
                  <Icon name="star" className="mt-star" />
                  {p.vi}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-empty">Chưa chọn ý nào. Bấm một hướng ở bước 4 của sơ đồ, rồi bấm Chọn làm ý cho bài.</p>
          )}
        </Section>
        <Section title="Cách tìm ý">
          <ul className="mt-tips">
            <li>Chọn phía mà bạn có nhiều ý và nhiều từ vựng nhất, không nhất thiết là điều bạn tin nhất.</li>
            <li>Tìm ý bằng 6 câu hỏi WHO – WHY – WHAT – HOW – WHEN – WHICH và 12 hướng phát triển ý trên sơ đồ.</li>
            <li>Chỉ giữ lại 2 ý mạnh nhất. Mỗi ý phải viết được 3–4 câu và có một ví dụ cụ thể, không được thì bỏ.</li>
          </ul>
        </Section>
      </>
    )
  }

  const renderTypes = () => (
    <>
      <PanelHead
        bullet={<span className="mt-bullet t-m">Bước 2</span>}
        kicker="Nhận dạng dạng đề"
        title="7 dạng đề Task 2"
        text="Mỗi dạng có cách chia hai đoạn thân bài riêng. Bấm một dạng để xem dấu hiệu và format bài viết của nó."
      />
      <ol className="mt-steps">
        {ESSAY_TYPES.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => reveal(t.id)}>
              <span className={t.id === typeId ? 'mt-stepno is-on' : 'mt-stepno'}>{t.id === typeId ? '✓' : ''}</span>
              <span>
                <b>
                  {t.vi} <span lang="en">· {t.en}</span>
                </b>
                <small lang="en">{t.signal}</small>
              </span>
              <Icon name="right" />
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-warn">
        <Icon name="alert" />
        Bỏ sót một phần của đề (ví dụ đề Discuss both views mà quên nêu ý kiến) thì điểm Task Response thường chỉ được khoảng band 5, dù tiếng Anh tốt.
      </p>
    </>
  )

  const renderDetail = (): ReactNode => {
    const id = st.active
    const t = findEssayType(id)
    if (t) return renderFormat(t)
    const cn = parseChoiceNode(id)
    if (cn) {
      const ct = findEssayType(cn.typeId)
      if (ct) return renderFormat(ct, cn.choiceId)
    }
    const d = findDirection(id)
    if (d) return renderDirection(d)
    if (id === 'grp.actor' || id === 'grp.aspect' || id === 'step.ideas' || id === 'ideas.choice') return renderIdeas(id)
    if (id === 'step.types') return renderTypes()

    if (id === 'step.analyze' || id.startsWith('layer.'))
      return (
        <>
          <PanelHead
            bullet={<span className="mt-bullet t-m">Bước 1 · 2 phút</span>}
            kicker="Phân tích đề"
            title="Đề hỏi gì?"
            text="Gạch chân từ khóa và tách đề thành 4 lớp. Dạng đề quyết định cách chia hai đoạn thân bài."
          />
          <ul className="mt-layers">
            <li>
              <b>Chủ đề chung</b> môi trường, giáo dục, công nghệ…
            </li>
            <li>
              <b>Vấn đề cụ thể</b> khía cạnh hẹp mà đề thật sự hỏi. Nếu chỉ viết về chủ đề chung thì bài bị lạc đề.
            </li>
            <li>
              <b>Yêu cầu</b> câu lệnh ở cuối đề. Nó cho biết dạng đề và bài phải trả lời mấy phần.
            </li>
            <li>
              <b>Từ giới hạn</b> <i lang="en">all, only, children, in developing countries…</i> Bỏ qua những từ này thì bài trả lời lệch đề.
            </li>
          </ul>
          <p className="mt-note">
            {type ? (
              <>
                Dạng đề đang dùng: <b>{type.vi}</b> ({type.en}){detected === type.id && !st.manualType ? ', tự nhận từ đề bài.' : '.'}
              </>
            ) : st.prompt.trim() ? (
              'Chưa nhận ra dạng đề. Bấm một dạng đề ở bước 2 của sơ đồ hoặc chọn trong ô Dạng đề ở trên.'
            ) : (
              'Dán đề vào ô Đề bài ở trên để app tự nhận dạng đề, hoặc bấm một dạng đề ở bước 2 của sơ đồ.'
            )}
          </p>
          <p className="mt-warn">
            <Icon name="alert" />
            Bỏ sót một phần của đề (ví dụ đề Discuss both views mà quên nêu ý kiến) thì điểm TR (Task Response) thường chỉ được khoảng band
            5, dù tiếng Anh tốt.
          </p>
        </>
      )

    if (id === 'ideas.sixw' || id.startsWith('sixw.'))
      return (
        <>
          <PanelHead
            bullet={<span className="mt-bullet t-m">Bước 4</span>}
            kicker="Tìm ý"
            title="6 câu hỏi"
            text="Khi đọc bất kỳ đề nào, tự hỏi 6 câu dưới đây. WHO chọn chủ thể, các câu còn lại đào sâu chủ thể đó."
          />
          <dl className="mt-facts">
            {SIX_W.map((w) => (
              <div key={w.key}>
                <dt lang="en">{w.label}</dt>
                <dd>{w.question}</dd>
              </div>
            ))}
          </dl>
          <Section title="Câu hỏi nào gọi hướng nào?">
            <dl className="mt-facts is-tight">
              <div>
                <dt lang="en">WHO, HOW</dt>
                <dd>Chủ thể 1–5: ai làm gì</dd>
              </div>
              <div>
                <dt lang="en">WHY, WHAT</dt>
                <dd>Khía cạnh 6–11: nguyên nhân, lợi, hại</dd>
              </div>
              <div>
                <dt lang="en">WHEN, WHICH</dt>
                <dd>12 Ngắn hạn – dài hạn, kết hợp với 1–5</dd>
              </div>
            </dl>
          </Section>
        </>
      )

    if (id === 'step.outline' || id.startsWith('part.') || id.startsWith('line.') || id === 'step.write') return type ? renderFormat(type) : emptyOutline()

    // Mặc định: tóm tắt cả 6 bước và dữ liệu mỗi bước đang mang
    return (
      <>
        <PanelHead
          bullet={<span className="mt-bullet t-m">Tổng quan</span>}
          kicker="Tư duy Task 2"
          title="Từ đề bài tới dàn bài 13 câu"
          text="Làm lần lượt từ bước 1 đến bước 6. Mỗi bước dùng kết quả của bước trước: đề bài cho ra dạng đề, dạng đề quyết định quan điểm và outline."
        />
        <ol className="mt-steps">
          {steps.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => reveal(s.id)}>
                <span className={s.done ? 'mt-stepno is-on' : 'mt-stepno'}>{s.done ? '✓' : s.no}</span>
                <span>
                  <b>{s.label}</b>
                  <small>{s.carry ? `${s.carry.label}: ${s.carry.value}` : (s.lock ?? 'Tạo bài nháp hoặc chép dàn bài')}</small>
                </span>
                <Icon name="right" />
              </button>
            </li>
          ))}
        </ol>
        {!st.prompt.trim() && <p className="mt-empty">Chưa có đề. Dán đề Task 2 vào ô Đề bài ở trên để app tự nhận dạng đề.</p>}
      </>
    )
  }

  const emptyOutline = () => (
    <>
      <PanelHead
        bullet={<span className="mt-bullet t-m">Bước 5</span>}
        kicker="Format bài viết"
        title="Chưa có dạng đề"
        text="Format phụ thuộc vào dạng đề. Dán đề ở trên để app tự nhận, hoặc bấm một dạng đề ở bước 2 của sơ đồ."
      />
      <div className="mt-chips">
        {ESSAY_TYPES.map((t) => (
          <button type="button" key={t.id} className="mt-chip" onClick={() => reveal(t.id)}>
            {t.vi}
          </button>
        ))}
      </div>
    </>
  )

  // ---------------------------------------------------------------- Bố cục trang
  return (
    <div className="page mt-page">
      <div className="mt-head">
        <div>
          <h1>Tư duy Task 2</h1>
          <p>Sơ đồ tư duy từ đề bài tới dàn bài: nhận dạng đề, chọn quan điểm và tìm ý, rồi viết theo format 13 câu của đúng dạng đề.</p>
        </div>
        <button type="button" className="mt-btn" onClick={reset}>
          <Icon name="refresh" />
          Làm lại
        </button>
      </div>

      <section className="mt-ticket">
        <label htmlFor="mt-prompt">Đề bài</label>
        <textarea
          id="mt-prompt"
          rows={2}
          lang="en"
          placeholder="Ví dụ: Some people think that advertisements for unhealthy food and drinks should be banned. To what extent do you agree or disagree?"
          value={st.prompt}
          onChange={(e) => patch({ prompt: e.target.value, manualType: null })}
        />
        <div className="mt-ticket-row">
          <label htmlFor="mt-type">Dạng đề</label>
          <select id="mt-type" value={typeId ?? ''} onChange={(e) => chooseType(e.target.value || null)}>
            <option value="">{st.prompt.trim() ? 'Chưa nhận ra — chọn tay' : 'Chọn dạng đề'}</option>
            {ESSAY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.vi} · {t.en}
              </option>
            ))}
          </select>
          {detected && !st.manualType && <span className="mt-tag is-auto">tự nhận</span>}
          {outline && typeId && (
            <button type="button" className="mt-link" onClick={() => reveal(choice ? choiceNodeId(typeId, choice) : typeId)}>
              Format {outline.name}
              <Icon name="right" />
            </button>
          )}
        </div>
      </section>

      <div className="mt-layout">
        <section className="fl-wrap" aria-label="Sơ đồ từng bước">
          <ol className="fl-steps">{steps.map(renderStep)}</ol>
          <div className="mt-legend" aria-label="Chú giải">
            <span>
              <i className="fl-key-carry" /> dữ liệu mang sang bước sau
            </span>
            <span>
              <i className="mt-key-chosen" /> đang dùng cho bài
            </span>
            <span>
              <i className="mt-key-active" /> đang xem
            </span>
            <span>
              <Icon name="star" className="mt-star" /> ý đã chọn
            </span>
            <span>
              <i className="mt-tag is-auto">tự nhận</i> app đoán từ đề bài
            </span>
            <span>
              <i className="mt-key-minor" /> câu Expand · Example
            </span>
          </div>
        </section>

        <aside className="mt-panel" ref={detailRef}>
          {renderDetail()}
        </aside>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Dàn bài dạng chữ
function outlineNotes(o: Outline): string[] {
  return [...(o.notes ?? []), ...(o.ink ?? [])]
}

function buildDraft(
  prompt: string,
  type: EssayType | undefined,
  outline: Outline,
  choice: string | undefined,
  choiceLabel: string | undefined,
  picks: Direction[],
): string {
  const L: string[] = []
  if (prompt.trim()) L.push(`Đề bài: ${prompt.trim()}`)
  if (type) L.push(`Dạng đề: ${type.en} (${type.vi})`)
  L.push(`Outline: ${outline.name}${outline.source === 'added' ? ' (bổ sung, không có trong sách)' : ''}`)
  if (choiceLabel) L.push(`Quan điểm: ${choiceLabel}`)
  if (picks.length) L.push(`Ý đã chọn: ${picks.map((d) => `${d.vi} (${d.en})`).join(', ')}`)
  PARTS.forEach((pt) => {
    L.push('')
    L.push(pt.title(outline).toUpperCase())
    outline.lines.slice(pt.from - 1, pt.to).forEach((l) => {
      L.push(`${l.no}. ${segsToText(l.text, choice, true)}`)
      if (l.patterns) L.push(`   Gợi ý: ${l.patterns.join(' / ')}`)
    })
  })
  return L.join('\n')
}

// ------------------------------------------------------------------ Thành phần dùng chung
const Section = ({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) => (
  <section className="mt-sec">
    <div className="mt-sec-head">
      <h3>{title}</h3>
      {aside}
    </div>
    {children}
  </section>
)

const PanelHead = ({
  bullet,
  kicker,
  title,
  sub,
  text,
}: {
  bullet: ReactNode
  kicker: string
  title: string
  sub?: string
  text?: string
}) => (
  <div className="mt-p-head">
    <div className="mt-kicker">
      {bullet}
      <span>{kicker}</span>
    </div>
    <h2>
      {title}
      {sub && <span lang="en">{sub}</span>}
    </h2>
    {text && <p>{text}</p>}
  </div>
)

// Tô màu các [ô trống] trong mẫu câu. Escape trước để an toàn khi chèn HTML.
function highlightSlots(s: string): string {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(/\[([^\]]+)\]/g, '<mark class="mt-slot">[$1]</mark>')
}
