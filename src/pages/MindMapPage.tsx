// Trang "Tư duy" — sơ đồ tư duy xử lý một đề IELTS Writing Task 2, vẽ theo kiểu bản đồ tuyến (metro).
// Nội dung: DATA/cac-buoc-lam-bai.html (bước 1–2), DATA/outline-dang-de.html (outline 13 câu),
// DATA/huong-dan-song-ngu.md (6 câu hỏi, 12 hướng).
// Dữ liệu: src/data/task2MindMap.ts · src/data/task2Outlines.ts
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import '@fontsource/overpass/600.css'
import '@fontsource/overpass/700.css'
import '@fontsource/overpass/800.css'
import '@fontsource/overpass-mono/500.css'
import '@fontsource/overpass-mono/600.css'
import Icon from '../components/Icon'
import type { PageKey } from './pages'
import {
  DIRECTIONS,
  ESSAY_TYPES,
  SIX_W,
  findDirection,
  findEssayType,
  type Direction,
  type EssayType,
} from '../data/task2MindMap'
import {
  OUTLINE_CHOICES,
  defaultChoice,
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
type StepId = 'step.analyze' | 'step.ideas' | 'step.outline'

interface MindState {
  prompt: string
  manualType: string | null // người dùng tự chọn dạng đề (đè lên kết quả dò)
  choices: Record<string, string> // quan điểm / kiểu outline theo từng dạng đề
  picks: string[] // hướng được chọn làm ý cho bài, tối đa MAX_PICKS
  openStep: StepId | null // tuyến nhánh đang mở trên bản đồ
  active: string // ga đang xem chi tiết
}

const STORE_KEY = 'mindmap_task2_v2'
const MAX_PICKS = 2
const INITIAL: MindState = {
  prompt: '',
  manualType: null,
  choices: {},
  picks: [],
  openStep: 'step.analyze',
  active: 'step.analyze',
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

const STEPS: { id: StepId; no: string; label: string; minutes: string }[] = [
  { id: 'step.analyze', no: '1', label: 'Phân tích đề', minutes: '2 phút' },
  { id: 'step.ideas', no: '2', label: 'Quan điểm & ý', minutes: '4 phút' },
  { id: 'step.outline', no: '3', label: 'Outline 13 câu', minutes: 'khi viết' },
]

const TONE_NAME: Record<Tone, string> = { g: 'xanh lá', r: 'đỏ', p: 'tím', o: 'cam' }
const PARTS: { from: number; to: number; title: (o: Outline) => string }[] = [
  { from: 1, to: 2, title: () => 'Mở bài' },
  { from: 3, to: 7, title: (o) => `Thân bài 1 · ${o.bodyNames[0]}` },
  { from: 8, to: 12, title: (o) => `Thân bài 2 · ${o.bodyNames[1]}` },
  { from: 13, to: 13, title: () => 'Kết bài' },
]

/** Bước chứa một ga, để mở đúng tuyến nhánh khi nhảy tới ga đó. */
function stepOf(id: string): StepId | null {
  if (id.startsWith('step.')) return id as StepId
  if (id.startsWith('type.')) return 'step.analyze'
  if (id === 'ideas.sixw' || id.startsWith('dir.')) return 'step.ideas'
  if (id.startsWith('line.')) return 'step.outline'
  return null
}

const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

// ------------------------------------------------------------------ Bản đồ
type LineTone = Tone | 'm' // 'm' = tuyến chính
type Kind = 'step' | 'stop' | 'hub' | 'minor' | 'end'

interface StationM {
  id: string
  x: number
  y: number
  kind: Kind
  side: 'up' | 'right' | 'left'
  tone: LineTone
  label: string
  sub?: string
  no?: string
  chosen?: boolean
  flags?: ReactNode
}

interface PathM {
  d: string
  tone: LineTone
}

interface LineNameM {
  x: number
  y: number
  side: 'left' | 'right'
  tone: LineTone
  label: string
  sub: string
}

interface BranchM {
  key: string
  height: number
  paths: PathM[]
  stations: StationM[]
  names: LineNameM[]
}

// Toạ độ cố định: trục chính nằm ngang, nhánh rơi xuống dưới bước đang mở.
const W = 660
const TY = 82 // y của tuyến chính
const ROOT_X = 40
const STEP_X: Record<StepId, number> = { 'step.analyze': 190, 'step.ideas': 345, 'step.outline': 500 }
const BX = 330 // trục giữa của nhánh outline
const D = 52 // nửa khoảng cách hai tuyến song song
const ROW = 46
const C = 14 // vát góc 45°
const MARK: Record<Kind, number> = { step: 15, end: 14, hub: 11, stop: 8, minor: 3 }

/** Đường từ ga bước xuống trục nhánh, rẽ 45° như bản đồ tàu điện. */
function drop(sx: number, bx: number, yTurn: number, yEnd: number): string {
  if (sx === bx) return `M ${sx} ${TY} V ${yEnd}`
  const dir = bx > sx ? 1 : -1
  return `M ${sx} ${TY} V ${yTurn - C} L ${sx + dir * C} ${yTurn} H ${bx - dir * C} L ${bx} ${yTurn + C} V ${yEnd}`
}

// ------------------------------------------------------------------ Trang
export default function MindMapPage({ onNavigate }: { onNavigate?: (p: PageKey) => void }) {
  const [st, setSt] = useState<MindState>(loadState)
  const [copied, setCopied] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const detailRef = useRef<HTMLElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(st))
    } catch {
      /* không lưu được thì thôi, trang vẫn chạy */
    }
  }, [st])

  useEffect(() => () => stopSpeaking(), [])

  // Bản đồ rộng hơn khung thì cuộn ngang để ga đang chọn luôn nằm trong tầm nhìn.
  useEffect(() => {
    const map = mapRef.current
    const node = map?.querySelector<HTMLElement>('.mt-st.is-active')
    if (!map || !node || map.scrollWidth <= map.clientWidth) return
    const m = map.getBoundingClientRect()
    const n = node.getBoundingClientRect()
    if (n.right > m.right - 12) map.scrollBy({ left: n.right - m.right + 24, behavior: 'smooth' })
    else if (n.left < m.left + 12) map.scrollBy({ left: n.left - m.left - 24, behavior: 'smooth' })
  }, [st.active, st.openStep])

  const patch = (p: Partial<MindState>) => setSt((s) => ({ ...s, ...p }))

  const detected = useMemo(() => detectEssayType(st.prompt), [st.prompt])
  const typeId = st.manualType ?? detected
  const type = typeId ? findEssayType(typeId) : undefined
  const choiceList = typeId ? OUTLINE_CHOICES[typeId] ?? [] : []
  const choice = typeId ? st.choices[typeId] ?? defaultChoice(typeId, st.prompt) : undefined
  const choiceItem = choiceList.find((c) => c.id === choice)
  const outline = typeId ? outlineFor(typeId, choice) : undefined
  const picks = st.picks.map(findDirection).filter((d): d is Direction => Boolean(d))

  // ---------------------------------------------------------------- Hành động
  const scrollToDetail = () => {
    if (window.matchMedia('(max-width: 1180px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  const reveal = (id: string) => {
    const step = stepOf(id)
    setSt((s) => ({ ...s, active: id, openStep: step ?? s.openStep }))
  }

  const select = (m: StationM) => {
    if (m.kind === 'step') {
      const id = m.id as StepId
      setSt((s) =>
        s.openStep === id && s.active === id ? { ...s, openStep: null } : { ...s, openStep: id, active: id },
      )
      return
    }
    patch({ active: m.id })
    scrollToDetail()
  }

  const chooseType = (id: string | null) => patch({ manualType: id })
  const setChoice = (id: string) => typeId && setSt((s) => ({ ...s, choices: { ...s.choices, [typeId]: id } }))

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

  const draft = outline ? buildDraft(st.prompt, type, outline, choice, choiceItem?.label, picks) : ''

  const createDraft = async () => {
    if (busy || !outline) return
    setBusy(true)
    setMsg(null)
    try {
      const head = st.prompt.trim().replace(/\s+/g, ' ')
      const title = head ? `Task 2 – ${clip(head, 60)}` : `Dàn bài Task 2 – ${outline.name}`
      await CloudApi.createWriting(title, draft, countWords(draft), 'IELTS Task 2')
      setMsg({ ok: true, text: 'Đã tạo bài nháp. Đang mở trang Viết.' })
      onNavigate?.('writing')
    } catch (e) {
      setMsg({ ok: false, text: `Không tạo được bài nháp: ${errText(e)}. Dàn bài vẫn còn ở đây, bạn có thể bấm Chép dàn bài.` })
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

  const choiceBar = (compact = false) =>
    choiceList.length > 0 && (
      <div className={compact ? 'mt-seg is-compact' : 'mt-seg'} role="group" aria-label="Quan điểm">
        {choiceList.map((c) => (
          <button type="button" key={c.id} aria-pressed={choice === c.id} onClick={() => setChoice(c.id)}>
            {choice === c.id && <Icon name="check" />}
            {c.label}
          </button>
        ))}
      </div>
    )

  // ---------------------------------------------------------------- Dựng bản đồ
  const trunk: StationM[] = [
    {
      id: 'root',
      x: ROOT_X,
      y: TY,
      kind: 'end',
      side: 'up',
      tone: 'm',
      label: 'Đề bài',
      sub: st.prompt.trim() ? 'Đã có đề' : 'Chưa có đề',
    },
    ...STEPS.map<StationM>((s) => ({
      id: s.id,
      x: STEP_X[s.id],
      y: TY,
      kind: 'step',
      side: 'up',
      tone: 'm',
      no: s.no,
      label: s.label,
      sub:
        s.id === 'step.analyze'
          ? type
            ? type.vi
            : st.prompt.trim()
              ? 'Chưa nhận ra dạng đề'
              : 'Đề hỏi gì?'
          : s.id === 'step.ideas'
            ? `${choiceItem ? choiceItem.label : 'Tìm ý'} · ★ ${picks.length}/${MAX_PICKS}`
            : outline
              ? outline.name
              : 'Cần chọn dạng đề',
    })),
  ]

  const branch = useMemo<BranchM | null>(() => {
    if (st.openStep === 'step.analyze') {
      const x = STEP_X['step.analyze']
      const y0 = TY + 66
      const stations = ESSAY_TYPES.map<StationM>((t, i) => ({
        id: t.id,
        x,
        y: y0 + i * ROW,
        kind: 'stop',
        side: 'right',
        tone: 'm',
        label: t.vi,
        sub: t.en,
        chosen: t.id === typeId,
        flags: (
          <>
            {t.id === typeId && <span className="mt-tag is-on">đang dùng</span>}
            {t.id === detected && <span className="mt-tag">tự nhận</span>}
          </>
        ),
      }))
      const last = y0 + (ESSAY_TYPES.length - 1) * ROW
      return { key: 'analyze', height: last + 44, paths: [{ d: `M ${x} ${TY} V ${last}`, tone: 'm' }], stations, names: [] }
    }

    if (st.openStep === 'step.ideas') {
      const ySix = TY + 78
      const yFork = ySix + 26
      const yCol = yFork + D
      const y0 = yCol + 40
      const cx = STEP_X['step.ideas']
      const actors = DIRECTIONS.filter((d) => d.group === 'actor')
      const aspects = DIRECTIONS.filter((d) => d.group === 'aspect')
      const dirStation = (d: Direction, i: number, side: 'left' | 'right'): StationM => ({
        id: d.id,
        x: side === 'left' ? cx - D : cx + D,
        y: y0 + i * ROW,
        kind: 'stop',
        side,
        tone: 'm',
        no: String(d.no),
        label: d.vi,
        sub: d.en,
        chosen: st.picks.includes(d.id),
        flags: st.picks.includes(d.id) ? <Icon name="star" className="mt-star" /> : null,
      })
      const lastL = y0 + (actors.length - 1) * ROW
      const lastR = y0 + (aspects.length - 1) * ROW
      return {
        key: 'ideas',
        height: lastR + 44,
        paths: [
          { d: `M ${cx} ${TY} V ${yFork}`, tone: 'm' },
          { d: `M ${cx} ${yFork} L ${cx - D} ${yCol} V ${lastL}`, tone: 'm' },
          { d: `M ${cx} ${yFork} L ${cx + D} ${yCol} V ${lastR}`, tone: 'm' },
        ],
        stations: [
          { id: 'ideas.sixw', x: cx, y: ySix, kind: 'hub', side: 'right', tone: 'm', label: '6 câu hỏi', sub: 'WHO → WHICH' },
          ...actors.map((d, i) => dirStation(d, i, 'left')),
          ...aspects.map((d, i) => dirStation(d, i, 'right')),
        ],
        names: [
          { x: cx - D, y: yCol + 2, side: 'left', tone: 'm', label: 'Chủ thể', sub: 'WHO · HOW' },
          { x: cx + D, y: yCol + 2, side: 'right', tone: 'm', label: 'Khía cạnh', sub: 'WHAT · WHEN' },
        ],
      }
    }

    if (st.openStep === 'step.outline' && outline) {
      const y1 = TY + 70
      const y2 = y1 + ROW
      const yCol = y2 + D
      const y0 = yCol + 26
      const last = y0 + 4 * ROW
      const yMerge = last + 16
      const y13 = yMerge + D + 22
      const ySample = y13 + ROW
      const lines = outline.lines
      const at = (n: number) => lines[n - 1]
      const lineStation = (l: OutlineLine, x: number, y: number, side: StationM['side'], tone: LineTone, kind: Kind): StationM => ({
        id: `line.${l.no}`,
        x,
        y,
        kind,
        side,
        tone,
        no: String(l.no),
        label: l.role,
      })
      const [t1, t2] = outline.threads
      const stations: StationM[] = [
        lineStation(at(1), BX, y1, 'right', 'm', 'stop'),
        lineStation(at(2), BX, y2, 'right', 'm', 'hub'),
        ...[3, 4, 5, 6, 7].map((n, i) => lineStation(at(n), BX - D, y0 + i * ROW, 'left', t1, at(n).minor ? 'minor' : 'stop')),
        ...[8, 9, 10, 11, 12].map((n, i) => lineStation(at(n), BX + D, y0 + i * ROW, 'right', t2, at(n).minor ? 'minor' : 'stop')),
        lineStation(at(13), BX, y13, 'right', 'm', 'hub'),
      ]
      const paths: PathM[] = [
        { d: drop(STEP_X['step.outline'], BX, TY + 34, y2), tone: 'm' },
        { d: `M ${BX} ${y2} L ${BX - D} ${yCol} V ${yMerge} L ${BX} ${yMerge + D} V ${y13}`, tone: t1 },
        { d: `M ${BX} ${y2} L ${BX + D} ${yCol} V ${yMerge} L ${BX} ${yMerge + D} V ${y13}`, tone: t2 },
      ]
      if (outline.sample) {
        stations.push({ id: 'line.sample', x: BX, y: ySample, kind: 'end', side: 'right', tone: 'm', label: 'Bài mẫu', sub: '13 câu theo outline' })
        paths.push({ d: `M ${BX} ${y13} V ${ySample}`, tone: 'm' })
      }
      return {
        key: `outline.${outline.id}`,
        height: (outline.sample ? ySample : y13) + 44,
        paths,
        stations,
        names: [
          { x: BX - D, y: yCol - 12, side: 'left', tone: t1, label: 'Thân bài 1', sub: outline.bodyNames[0] },
          { x: BX + D, y: yCol - 12, side: 'right', tone: t2, label: 'Thân bài 2', sub: outline.bodyNames[1] },
        ],
      }
    }
    return null
  }, [st.openStep, st.picks, outline, typeId, detected])

  const mapHeight = branch ? branch.height : TY + 70

  const renderStation = (m: StationM, i: number) => {
    const active = st.active === m.id
    const cls = [
      'mt-st',
      `is-${m.kind}`,
      `side-${m.side}`,
      `t-${m.tone}`,
      active ? 'is-active' : '',
      m.chosen ? 'is-chosen' : '',
    ]
      .filter(Boolean)
      .join(' ')
    const half = MARK[m.kind]
    const style: CSSProperties =
      m.side === 'up'
        ? { left: m.x, top: m.y + half }
        : m.side === 'right'
          ? { left: m.x - 18, top: m.y - 18 }
          : { left: m.x + 18, top: m.y - 18 }
    ;(style as Record<string, string | number>)['--i'] = i
    const title = m.sub ? `${m.label} · ${m.sub}` : m.label
    return (
      <button
        key={m.id}
        type="button"
        className={cls}
        style={style}
        onClick={() => select(m)}
        aria-current={active ? 'true' : undefined}
        aria-expanded={m.kind === 'step' ? st.openStep === m.id : undefined}
        title={title}
      >
        <span className="mt-mark" aria-hidden="true">
          {m.kind === 'step' ? m.no : null}
        </span>
        {m.no && m.kind !== 'step' && (
          <span className="mt-no">
            <span className="mt-sr">Ga </span>
            {m.no}
          </span>
        )}
        <span className="mt-name">
          <b>{m.label}</b>
          {m.sub && <small>{m.sub}</small>}
        </span>
        {m.flags}
      </button>
    )
  }

  // ---------------------------------------------------------------- Bảng ga
  const renderSentence = (segs: Seg[]) => {
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
            if (sg.label) return <span key={k} className="mt-lb">{sg.t}</span>
            if (choice && sg.byChoice?.[choice]) return <span key={k} className="mt-fill" title="Điền theo quan điểm bạn đã chọn">{sg.byChoice[choice]}</span>
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

  const thesisPart = (o: Outline, t: Tone) =>
    o.lines[1].text
      .filter((sg) => !sg.label && sg.tone === t)
      .map((sg) => segText(sg, choice))
      .join('')
      .trim()

  const threadNote = (o: Outline, l: OutlineLine): ReactNode => {
    const [t1, t2] = o.threads
    if (t1 === t2) {
      if (l.no === 2 || l.no === 13) return <p className="mt-note">Quan điểm ở câu 2 và câu 13 phải giống nhau: cùng đồng ý hoặc cùng không đồng ý.</p>
      return null
    }
    if (l.no === 2)
      return (
        <p className="mt-note">
          Vế <b className={`mt-ink t-${t1}`}>{TONE_NAME[t1]}</b> mở thân bài 1 (câu 3), vế <b className={`mt-ink t-${t2}`}>{TONE_NAME[t2]}</b> mở thân bài 2 (câu 8). Câu 13 gom lại cả hai.
        </p>
      )
    if (l.no === 3 || l.no === 8) {
      const t = l.no === 3 ? t1 : t2
      return (
        <p className="mt-note">
          Viết lại vế {TONE_NAME[t]} của câu 2: <span className={`mt-ve t-${t}`} lang="en">{thesisPart(o, t)}</span>
        </p>
      )
    }
    if (l.no === 13) return <p className="mt-note">Gom lại hai vế của câu 2, diễn đạt khác đi và không thêm ý mới.</p>
    return null
  }

  const renderLine = (o: Outline, l: OutlineLine) => {
    const part = PARTS.find((pt) => l.no >= pt.from && l.no <= pt.to)!
    const tone: LineTone = l.no >= 3 && l.no <= 7 ? o.threads[0] : l.no >= 8 && l.no <= 12 ? o.threads[1] : 'm'
    const prev = l.no > 1 ? o.lines[l.no - 2] : null
    const next = l.no < 13 ? o.lines[l.no] : null
    const text = segsToText(l.text, choice)
    return (
      <>
        <PanelHead
          bullet={<span className={`mt-bullet t-${tone}`}>Ga {l.no}</span>}
          kicker={part.title(o)}
          title={l.role}
          text={l.guide}
        />
        <section className="mt-sec">
          <div className="mt-sec-head">
            <h3>{l.minor ? 'Trong sách' : 'Câu mẫu trong outline'}</h3>
            {!l.minor && copyBtn(`${l.no}.t`, text)}
          </div>
          {renderSentence(l.text)}
          {l.hint && <p className="mt-hint">{l.hint}</p>}
          {l.ink?.map((n) => (
            <p key={n} className="mt-handnote" lang="en">
              <span aria-hidden="true">✍ </span>
              <span className="mt-sr">Ghi chú tay trong sách: </span>
              {n}
            </p>
          ))}
          {threadNote(o, l)}
        </section>
        {l.patterns && (
          <section className="mt-sec">
            <div className="mt-sec-head">
              <h3>Mẫu câu để bắt đầu</h3>
              <small className="mt-hint">Bấm để chép</small>
            </div>
            {patternChips(`line.${o.id}.${l.no}`, l.patterns)}
          </section>
        )}
        <nav className="mt-stepnav" aria-label="Chuyển ga">
          {prev ? (
            <button type="button" className="mt-btn" onClick={() => reveal(`line.${prev.no}`)}>
              <Icon name="left" />
              Ga {prev.no} · {prev.role}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button type="button" className="mt-btn" onClick={() => reveal(`line.${next.no}`)}>
              Ga {next.no} · {next.role}
              <Icon name="right" />
            </button>
          ) : o.sample ? (
            <button type="button" className="mt-btn" onClick={() => reveal('line.sample')}>
              Bài mẫu
              <Icon name="right" />
            </button>
          ) : null}
        </nav>
      </>
    )
  }

  const renderSample = (o: Outline) => {
    const sm = o.sample!
    const paras = PARTS.map((pt) => sm.sentences.slice(pt.from - 1, pt.to).map((s, i) => ({ no: pt.from + i, s })))
    const full = sm.sentences.join(' ')
    return (
      <>
        <PanelHead
          bullet={<span className="mt-bullet t-m">Ga cuối</span>}
          kicker={`Bài mẫu · ${o.name}`}
          title="Bài mẫu theo outline"
          text={`Mỗi câu đánh số đúng như ga trên bản đồ. Bài dài ${countWords(full)} từ.`}
        />
        <section className="mt-sec">
          <div className="mt-sec-head">
            <h3>Đề luyện tập</h3>
          </div>
          <p className="mt-prompt-ex" lang="en">
            {sm.prompt}
          </p>
        </section>
        <section className="mt-sec">
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
                    <button type="button" className="mt-sn" onClick={() => reveal(`line.${no}`)} aria-label={`Xem ga ${no}`}>
                      {no}
                    </button>
                    {s}{' '}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </section>
      </>
    )
  }

  const renderType = (t: EssayType) => {
    const on = typeId === t.id
    const outlines = (OUTLINE_CHOICES[t.id]?.map((c) => outlineFor(t.id, c.id)) ?? [outlineFor(t.id)]).filter(
      (x, i, arr): x is Outline => Boolean(x) && arr.indexOf(x) === i,
    )
    return (
      <>
        <PanelHead
          bullet={<span className="mt-bullet t-m">Bước 1</span>}
          kicker={`Dạng đề${detected === t.id ? ' · tự nhận từ đề bài' : ''}`}
          title={t.vi}
          sub={t.en}
          text={t.task}
        />
        <div className="mt-actions">
          <button type="button" className={on ? 'mt-btn is-on' : 'mt-btn is-primary'} onClick={() => chooseType(on && st.manualType ? null : t.id)} disabled={on && !st.manualType}>
            <Icon name={on ? 'check' : 'star'} />
            {on ? (st.manualType ? 'Đang dùng · bấm để về dạng tự nhận' : 'Đang dùng dạng này') : 'Dùng dạng đề này'}
          </button>
        </div>
        <dl className="mt-facts">
          <div>
            <dt>Dấu hiệu</dt>
            <dd lang="en">{t.signal}</dd>
          </div>
          <div>
            <dt>Cần ý kiến riêng?</dt>
            <dd>{t.opinion}</dd>
          </div>
          <div>
            <dt>Thân bài 1</dt>
            <dd>{t.body1}</dd>
          </div>
          <div>
            <dt>Thân bài 2</dt>
            <dd>{t.body2}</dd>
          </div>
          <div>
            <dt>Outline</dt>
            <dd>
              {outlines.map((x) => (
                <span key={x.id} className="mt-outline-name">
                  {x.name}
                  <span className={x.source === 'book' ? 'mt-tag' : 'mt-tag is-added'}>{x.source === 'book' ? 'từ sách' : 'bổ sung'}</span>
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </>
    )
  }

  const renderDirection = (d: Direction) => {
    const picked = st.picks.includes(d.id)
    const full = !picked && st.picks.length >= MAX_PICKS
    return (
      <>
        <PanelHead
          bullet={<span className="mt-bullet t-m">Ga {d.no}</span>}
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

  const renderDetail = (): ReactNode => {
    const id = st.active
    const t = findEssayType(id)
    if (t) return renderType(t)
    const d = findDirection(id)
    if (d) return renderDirection(d)

    if (id.startsWith('line.')) {
      if (!outline) return emptyOutline()
      if (id === 'line.sample' && outline.sample) return renderSample(outline)
      const l = outline.lines[Number(id.slice(5)) - 1]
      if (l) return renderLine(outline, l)
    }

    if (id === 'step.analyze')
      return (
        <>
          <PanelHead
            bullet={<span className="mt-bullet t-m">Bước 1 · 2 phút</span>}
            kicker="Ga đổi tuyến"
            title="Phân tích đề"
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
              'Chưa nhận ra dạng đề. Chọn một ga dạng đề trên bản đồ hoặc trong ô Dạng đề ở trên.'
            ) : (
              'Dán đề vào ô Đề bài ở trên để app tự nhận dạng đề, hoặc chọn một ga dạng đề trên bản đồ.'
            )}
          </p>
          <p className="mt-warn">
            <Icon name="alert" />
            Bỏ sót một phần của đề (ví dụ đề Discuss both views mà quên nêu ý kiến) thì điểm TR (Task Response) thường chỉ được khoảng band 5, dù tiếng Anh tốt.
          </p>
        </>
      )

    if (id === 'step.ideas')
      return (
        <>
          <PanelHead
            bullet={<span className="mt-bullet t-m">Bước 2 · 4 phút</span>}
            kicker="Ga đổi tuyến"
            title="Chọn quan điểm và tìm ý"
            text="Chốt quan điểm trước khi viết và giữ nguyên đến hết bài. Giám khảo chấm cách lập luận, không chấm quan điểm."
          />
          <Section title="Quan điểm">
            {!type ? (
              <p className="mt-empty">Chọn dạng đề ở bước 1 trước, rồi quay lại đây để chọn quan điểm.</p>
            ) : choiceList.length ? (
              <>
                {choiceBar()}
                <p className="mt-hint">{choiceItem ? choiceItem.note : 'Chưa chọn. Outline ở bước 3 sẽ để trống chỗ nêu quan điểm.'}</p>
              </>
            ) : type.id === 'type.discuss' ? (
              <p className="mt-note">Đặt quan điểm bạn ủng hộ ở thân bài 2 và viết đoạn đó mạnh hơn.</p>
            ) : (
              <p className="mt-note">Dạng {type.vi} không bắt buộc nêu quan điểm riêng. Tập trung tìm ý cho hai thân bài.</p>
            )}
          </Section>
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
              <p className="mt-empty">Chưa chọn ý nào. Bấm một ga Chủ thể hoặc Khía cạnh trên bản đồ, rồi bấm Chọn làm ý cho bài.</p>
            )}
          </Section>
          <Section title="Cách tìm ý">
            <ul className="mt-tips">
              <li>Chọn phía mà bạn có nhiều ý và nhiều từ vựng nhất, không nhất thiết là điều bạn tin nhất.</li>
              <li>Tìm ý bằng 6 câu hỏi WHO – WHY – WHAT – HOW – WHEN – WHICH và 12 hướng phát triển ý trên bản đồ.</li>
              <li>Chỉ giữ lại 2 ý mạnh nhất. Mỗi ý phải viết được 3–4 câu và có một ví dụ cụ thể, không được thì bỏ.</li>
            </ul>
          </Section>
        </>
      )

    if (id === 'ideas.sixw')
      return (
        <>
          <PanelHead
            bullet={<span className="mt-bullet t-m">Ga đổi tuyến</span>}
            kicker="Bước 2 · Tìm ý"
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

    if (id === 'step.outline') {
      if (!outline) return emptyOutline()
      return (
        <>
          <PanelHead
            bullet={<span className="mt-bullet t-m">Bước 3</span>}
            kicker={outline.source === 'book' ? `Từ sách · ${outline.origin}` : 'Bổ sung · không có trong sách'}
            title={`Outline ${outline.name}`}
            text="Hai thân bài là hai tuyến song song: tách ra ở câu 2 (Thesis) và nhập lại ở câu 13 (Kết bài). Bấm từng ga trên bản đồ để xem câu mẫu và mẫu câu."
          />
          {choiceList.length > 0 && (
            <Section title="Kiểu outline theo quan điểm">
              {choiceBar(true)}
            </Section>
          )}
          {(outline.notes?.length || outline.ink?.length) && (
            <Section title="Ghi chú trong sách">
              {outline.notes?.map((n) => (
                <p key={n} className="mt-note">
                  {n}
                </p>
              ))}
              {outline.ink?.map((n) => (
                <p key={n} className="mt-handnote" lang="en">
                  <span aria-hidden="true">✍ </span>
                  <span className="mt-sr">Ghi chú tay trong sách: </span>
                  {n}
                </p>
              ))}
            </Section>
          )}
          <Section title="Cả outline" aside={copyBtn('outline', draft, 'Chép dàn bài')}>
            <ol className="mt-all">
              {outline.lines.map((l) => {
                const tone: LineTone = l.no >= 3 && l.no <= 7 ? outline.threads[0] : l.no >= 8 && l.no <= 12 ? outline.threads[1] : 'm'
                return (
                  <li key={l.no} className={l.minor ? 'is-minor' : ''}>
                    <button type="button" onClick={() => reveal(`line.${l.no}`)}>
                      <span className={`mt-n t-${tone}`}>{l.no}</span>
                      {renderSentence(l.text)}
                    </button>
                  </li>
                )
              })}
            </ol>
          </Section>
          <div className="mt-actions">
            <button type="button" className="mt-btn is-primary" onClick={createDraft} disabled={busy}>
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
      )
    }

    // Ga đầu tuyến
    return (
      <>
        <PanelHead
          bullet={<span className="mt-bullet t-m">Ga đầu tuyến</span>}
          kicker="Tư duy Task 2"
          title="Từ đề bài tới dàn bài 13 câu"
          text="Đi theo tuyến chính từ trái sang phải. Mỗi bước là một ga đổi tuyến; bấm vào để mở tuyến nhánh bên dưới."
        />
        <ol className="mt-steps">
          {STEPS.map((s, i) => (
            <li key={s.id}>
              <button type="button" onClick={() => reveal(s.id)}>
                <span className="mt-stepno">{s.no}</span>
                <span>
                  <b>{s.label}</b>
                  <small>{trunk[i + 1].sub}</small>
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
        bullet={<span className="mt-bullet t-m">Bước 3</span>}
        kicker="Outline 13 câu"
        title="Chưa có dạng đề"
        text="Outline phụ thuộc vào dạng đề. Dán đề ở trên để app tự nhận, hoặc chọn một ga dạng đề ở bước 1."
      />
      <div className="mt-actions">
        <button type="button" className="mt-btn is-primary" onClick={() => reveal('step.analyze')}>
          <Icon name="left" />
          Mở bước 1: chọn dạng đề
        </button>
      </div>
    </>
  )

  // ---------------------------------------------------------------- Bố cục trang
  return (
    <div className="page mt-page">
      <div className="mt-head">
        <div>
          <h1>Tư duy Task 2</h1>
          <p>Đi theo tuyến từ đề bài tới dàn bài: phân tích đề, chọn quan điểm và tìm ý, rồi viết theo outline 13 câu của đúng dạng đề.</p>
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
          {detected && !st.manualType && <span className="mt-tag">tự nhận</span>}
          {outline && (
            <button type="button" className="mt-link" onClick={() => reveal('step.outline')}>
              Outline {outline.name}
              <Icon name="right" />
            </button>
          )}
        </div>
      </section>

      <div className="mt-layout">
        <section className="mt-mapcard" aria-label="Bản đồ tuyến">
          <div className="mt-map" ref={mapRef}>
            <div className="mt-canvas" style={{ width: W, height: mapHeight }}>
              <svg className="mt-svg" width={W} height={mapHeight} viewBox={`0 0 ${W} ${mapHeight}`} aria-hidden="true">
                <path className="mt-ln t-m" d={`M ${ROOT_X} ${TY} H ${STEP_X['step.outline']}`} />
                {branch && (
                  <g key={branch.key} className="mt-draw">
                    {branch.paths.map((p, i) => (
                      <path key={i} className={`mt-ln t-${p.tone}`} d={p.d} pathLength={1} />
                    ))}
                  </g>
                )}
              </svg>
              {trunk.map(renderStation)}
              {branch && (
                <div key={branch.key} className="mt-branch">
                  {branch.names.map((n) => (
                    <span
                      key={n.label}
                      className={`mt-linename side-${n.side} t-${n.tone}`}
                      style={n.side === 'left' ? { left: n.x - 16, top: n.y } : { left: n.x + 16, top: n.y }}
                    >
                      <b>{n.label}</b>
                      <small>{n.sub}</small>
                    </span>
                  ))}
                  {branch.stations.map(renderStation)}
                </div>
              )}
              {!branch && (
                <p className="mt-maphint" style={{ top: TY + 30 }}>
                  {st.openStep === 'step.outline' ? 'Tuyến outline mở khi đã có dạng đề.' : 'Bấm một ga trên tuyến chính để mở tuyến nhánh.'}
                </p>
              )}
            </div>
          </div>
          <div className="mt-legend" aria-label="Chú giải">
            <span>
              <i className="mt-key t-m" /> tuyến chính
            </span>
            <span>
              <i className="mt-key t-g" /> vế 1 · thân bài 1
            </span>
            <span>
              <i className="mt-key t-r" /> vế 2 · thân bài 2
            </span>
            <span>
              <i className="mt-key t-p" /> giải pháp
            </span>
            <span>
              <i className="mt-key t-o" /> quan điểm
            </span>
            <span>
              <i className="mt-key-st" /> ga
            </span>
            <span>
              <i className="mt-key-hub" /> ga đổi tuyến
            </span>
            <span>
              <i className="mt-key-minor" /> ga phụ: Expand · Example
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

const PanelHead = ({ bullet, kicker, title, sub, text }: { bullet: ReactNode; kicker: string; title: string; sub?: string; text?: string }) => (
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
