// Trang "Tư duy" — sơ đồ tư duy xử lý một đề IELTS Writing Task 2.
// Thiết kế: Implement/require-tuduy.md · Dữ liệu: src/data/task2MindMap.ts
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Icon from '../components/Icon'
import type { PageKey } from './pages'
import {
  ANGLES,
  CHECKLIST,
  DIRECTIONS,
  ESSAY_TYPES,
  PEEL,
  SIX_W,
  findAngle,
  findDirection,
  findEssayType,
  type Angle,
  type Direction,
  type EssayType,
} from '../data/task2MindMap'
import { detectEssayType } from '../services/essayType'
import { speak, stopSpeaking, ttsSupported } from '../services/tts'
import { CloudApi } from '../services/cloud/CloudApiClient'
import { errText } from '../services/cloud/cloudError'
import '../styles/mindmap.css'

// ------------------------------------------------------------------ Trạng thái
interface MindState {
  prompt: string
  manualType: string | null // người dùng tự chọn dạng đề (đè lên kết quả dò)
  angles: string[] | null // góc lập luận cho 2 thân bài; null = theo gợi ý của dạng đề
  picks: string[] // chủ thể / khía cạnh được đánh ★
  chain: string[] // chuỗi lập luận (id hướng)
  checks: Record<string, boolean>
  open: string[] // nhánh đang mở
  active: string // nút đang xem chi tiết
}

const STORE_KEY = 'mindmap_task2_v1'
const INITIAL: MindState = {
  prompt: '',
  manualType: null,
  angles: null,
  picks: [],
  chain: [],
  checks: {},
  open: ['root', 'step.direction'],
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

// ------------------------------------------------------------------ Cây sơ đồ
interface TNode {
  id: string
  label: string
  sub?: string
  badge?: string
  tone: 'root' | 'step' | 'group' | 'leaf'
  children?: TNode[]
}

const STEP_NO = ['1', '2', '3', '4', '5']

function dirNode(d: Direction): TNode {
  return { id: d.id, label: d.vi, sub: d.en, badge: String(d.no), tone: 'leaf' }
}

function buildTree(chain: string[]): TNode {
  return {
    id: 'root',
    label: 'Đề bài Task 2',
    sub: 'Bắt đầu từ đây',
    tone: 'root',
    children: [
      {
        id: 'step.type',
        label: 'Dạng đề',
        sub: 'Đề hỏi gì?',
        badge: STEP_NO[0],
        tone: 'step',
        children: ESSAY_TYPES.map((t) => ({ id: t.id, label: t.vi, sub: t.en, tone: 'leaf' as const })),
      },
      {
        id: 'step.direction',
        label: 'Hướng phân tích',
        sub: 'Công thức 6 câu hỏi',
        badge: STEP_NO[1],
        tone: 'step',
        children: [
          {
            id: 'group.actor',
            label: 'Chủ thể',
            sub: 'WHO · HOW · 1–5',
            tone: 'group',
            children: DIRECTIONS.filter((d) => d.group === 'actor').map(dirNode),
          },
          {
            id: 'group.aspect',
            label: 'Khía cạnh',
            sub: 'WHAT · WHEN · 6–12',
            tone: 'group',
            children: DIRECTIONS.filter((d) => d.group === 'aspect').map(dirNode),
          },
          {
            id: 'group.angle',
            label: 'Góc lập luận',
            sub: '8 góc · pattern',
            tone: 'group',
            children: ANGLES.map((a) => ({ id: a.id, label: a.vi, sub: a.en, tone: 'leaf' as const })),
          },
        ],
      },
      {
        id: 'step.chain',
        label: 'Chuỗi lập luận',
        sub: chain.length ? `${chain.length} mắt xích` : 'Ý → giải thích → kết quả',
        badge: STEP_NO[2],
        tone: 'step',
        children: chain
          .map((id) => findDirection(id))
          .filter((d): d is Direction => Boolean(d))
          .map(dirNode),
      },
      {
        id: 'step.outline',
        label: 'Dàn bài',
        sub: 'Mở – TB1 – TB2 – Kết',
        badge: STEP_NO[3],
        tone: 'step',
        children: [
          { id: 'outline.intro', label: 'Mở bài', sub: 'Paraphrase + quan điểm', tone: 'leaf' },
          { id: 'outline.body1', label: 'Thân bài 1', sub: 'P–E–E–L', tone: 'leaf' },
          { id: 'outline.body2', label: 'Thân bài 2', sub: 'P–E–E–L', tone: 'leaf' },
          { id: 'outline.conclusion', label: 'Kết bài', sub: 'Tóm ý + khẳng định', tone: 'leaf' },
          { id: 'outline.peel', label: 'Khung P–E–E–L', sub: 'Point · Explain · Example · Link', tone: 'leaf' },
        ],
      },
      {
        id: 'step.check',
        label: 'Kiểm tra',
        sub: '4 tiêu chí chấm',
        badge: STEP_NO[4],
        tone: 'step',
        children: CHECKLIST.map((c) => ({ id: `check.${c.id}`, label: c.criterion, sub: c.short, tone: 'leaf' as const })),
      },
    ],
  }
}

// ------------------------------------------------------------------ Dàn bài
const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)

function buildOutline(
  prompt: string,
  type: EssayType | undefined,
  angles: Angle[],
  picks: Direction[],
  chain: Direction[],
): string {
  const L: string[] = []
  if (prompt.trim()) L.push(`Đề bài: ${prompt.trim()}`)
  if (type) L.push(`Dạng đề: ${type.en} (${type.vi})`)
  L.push('')
  L.push('MỞ BÀI')
  L.push('- Paraphrase đề: It is often argued that [viết lại đề bằng từ của bạn].')
  L.push(`- ${type ? type.intro : 'Nêu quan điểm / phạm vi bài viết.'}`)
  angles.slice(0, 2).forEach((a, i) => {
    const dir = picks[i]
    L.push('')
    L.push(`THÂN BÀI ${i + 1} — ${a.en} (${a.vi})`)
    L.push(`P: ${a.patterns[0]}`)
    L.push(`E: ${a.frame[1]} ${a.patterns[2] ?? ''}`.trim())
    L.push(`E: ${a.frame[2]} [địa điểm, con số, tình huống cụ thể]`)
    L.push(`L: ${a.frame[3]}`)
    if (dir) {
      L.push(`  Hướng ý: ${dir.vi} (${dir.en}) — ${dir.phrases.slice(0, 3).map((p) => p.en ?? p.vi).join('; ')}`)
    }
    L.push(`  Từ nối: ${a.linkers.slice(0, 5).join(', ')}`)
  })
  if (chain.length) {
    L.push('')
    L.push(`Chuỗi lập luận: ${chain.map((d) => `${d.vi} (${d.no})`).join(' → ')}`)
  }
  L.push('')
  L.push('KẾT BÀI')
  L.push(`- ${type ? type.conclusion : 'In conclusion, [tóm tắt 2 ý chính và nhắc lại quan điểm].'}`)
  return L.join('\n')
}

// ------------------------------------------------------------------ Trang
export default function MindMapPage({ onNavigate }: { onNavigate?: (p: PageKey) => void }) {
  const [st, setSt] = useState<MindState>(loadState)
  const [copied, setCopied] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const detailRef = useRef<HTMLElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(st))
    } catch {
      /* không lưu được thì thôi, trang vẫn chạy */
    }
  }, [st])

  useEffect(() => () => stopSpeaking(), [])

  // Sơ đồ rộng hơn khung thì cuộn ngang để nút đang chọn luôn nằm trong tầm nhìn.
  const mapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const map = mapRef.current
    const node = map?.querySelector<HTMLElement>('.mm-node.is-active')
    if (!map || !node || map.scrollWidth <= map.clientWidth) return
    const m = map.getBoundingClientRect()
    const n = node.getBoundingClientRect()
    if (n.right > m.right - 12) map.scrollBy({ left: n.right - m.right + 24, behavior: 'smooth' })
    else if (n.left < m.left + 12) map.scrollBy({ left: n.left - m.left - 24, behavior: 'smooth' })
  }, [st.active, st.open])

  const patch = (p: Partial<MindState>) => setSt((s) => ({ ...s, ...p }))

  const detected = useMemo(() => detectEssayType(st.prompt), [st.prompt])
  const typeId = st.manualType ?? detected
  const type = typeId ? findEssayType(typeId) : undefined
  const angleIds = st.angles ?? type?.angles ?? []
  const angles = angleIds.map(findAngle).filter((a): a is Angle => Boolean(a))
  const picks = st.picks.map(findDirection).filter((d): d is Direction => Boolean(d))
  const chain = st.chain.map(findDirection).filter((d): d is Direction => Boolean(d))
  const suggested = new Set(type?.angles ?? [])
  const tree = useMemo(() => buildTree(st.chain), [st.chain])
  const outline = buildOutline(st.prompt, type, angles, picks, chain)
  const checkTotal = CHECKLIST.reduce((n, c) => n + c.items.length, 0)
  const checkDone = CHECKLIST.reduce((n, c) => n + c.items.filter((i) => st.checks[i.id]).length, 0)

  // ---------------------------------------------------------------- Hành động
  // Quan hệ cha–con trên cây, để mở theo kiểu "một nhánh một lúc" cho sơ đồ gọn.
  const { parentOf, branches } = useMemo(() => {
    const parentOf: Record<string, string> = {}
    const branches = new Set<string>()
    const walk = (n: TNode) => {
      if (n.children?.length) branches.add(n.id)
      n.children?.forEach((c) => {
        if (!(c.id in parentOf)) parentOf[c.id] = n.id
        walk(c)
      })
    }
    walk(tree)
    return { parentOf, branches }
  }, [tree])

  const ancestors = (id: string): string[] => {
    const out: string[] = []
    for (let p = parentOf[id]; p; p = parentOf[p]) out.push(p)
    return out
  }

  const openNode = (id: string, hasChildren: boolean) => {
    setSt((s) => {
      if (!hasChildren) return { ...s, active: id }
      const isOpen = s.open.includes(id)
      // Bấm lại vào nhánh đang xem thì thu lại; bấm nhánh khác thì mở nó và
      // đóng các nhánh anh em để sơ đồ không phình quá cao.
      if (isOpen && s.active === id) {
        return { ...s, active: id, open: s.open.filter((x) => x !== id && !ancestors(x).includes(id)) }
      }
      const keepInside = s.open.filter((x) => ancestors(x).includes(id))
      return { ...s, active: id, open: [...new Set([...ancestors(id), id, ...keepInside])] }
    })
    // Màn hẹp: bảng chi tiết nằm dưới sơ đồ, chỉ cuộn xuống khi bấm nút lá.
    if (!hasChildren && window.matchMedia('(max-width: 1180px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  // Mở thẳng một nút từ bảng chi tiết: bung đúng đường đi tới nút đó trên sơ đồ.
  const reveal = (id: string) => {
    const path = [...ancestors(id), ...(branches.has(id) ? [id] : [])]
    setSt((s) => ({ ...s, active: id, open: path }))
  }

  const togglePick = (id: string) =>
    setSt((s) => ({
      ...s,
      picks: s.picks.includes(id) ? s.picks.filter((x) => x !== id) : [...s.picks, id],
    }))

  const toggleAngle = (id: string) =>
    setSt((s) => {
      const current = s.angles ?? (findEssayType(s.manualType ?? detected ?? '')?.angles ?? [])
      if (current.includes(id)) return { ...s, angles: current.filter((x) => x !== id) }
      // Mỗi bài chỉ cần 2 góc: chọn góc thứ ba thì bỏ góc cũ nhất.
      return { ...s, angles: [...current, id].slice(-2) }
    })

  const addChain = (id: string) => setSt((s) => ({ ...s, chain: [...s.chain, id].slice(0, 6) }))
  const removeChain = (i: number) => setSt((s) => ({ ...s, chain: s.chain.filter((_, k) => k !== i) }))

  const chooseType = (id: string | null) => patch({ manualType: id, angles: null })

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

  const createDraft = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const head = st.prompt.trim().replace(/\s+/g, ' ')
      const title = head ? `Task 2 – ${head.slice(0, 60)}${head.length > 60 ? '…' : ''}` : 'Dàn bài Task 2'
      await CloudApi.createWriting(title, outline, countWords(outline), 'IELTS Task 2')
      setMsg('Đã tạo bài nháp. Mở trang Viết để viết tiếp.')
      onNavigate?.('writing')
    } catch (e) {
      setMsg(`Không tạo được bài nháp: ${errText(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    if (!window.confirm('Xóa đề bài và mọi lựa chọn trên sơ đồ?')) return
    stopSpeaking()
    setSt(INITIAL)
  }

  // ---------------------------------------------------------------- Mảnh UI nhỏ
  const copyBtn = (k: string, text: string, label = 'Chép') => (
    <button type="button" className="mm-mini" onClick={() => copy(k, text)} title="Chép vào bộ nhớ tạm">
      <Icon name={copied === k ? 'check' : 'copy'} />
      {copied === k ? 'Đã chép' : label}
    </button>
  )

  const speakBtn = (k: string, text: string) =>
    ttsSupported ? (
      <button type="button" className="mm-mini" onClick={() => say(k, text)}>
        <Icon name={speaking === k ? 'stop' : 'speak'} />
        {speaking === k ? 'Dừng' : 'Nghe'}
      </button>
    ) : null


  // ---------------------------------------------------------------- Vẽ cây
  const renderNode = (n: TNode): ReactNode => {
    const hasChildren = Boolean(n.children && n.children.length)
    const isOpen = st.open.includes(n.id)
    const cls = [
      'mm-node',
      `is-${n.tone}`,
      st.active === n.id ? 'is-active' : '',
      st.picks.includes(n.id) || angleIds.includes(n.id) || n.id === typeId ? 'is-picked' : '',
      suggested.has(n.id) ? 'is-suggested' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <div className="mm-branch" key={n.id}>
        <button
          type="button"
          className={cls}
          onClick={() => openNode(n.id, hasChildren)}
          aria-expanded={hasChildren ? isOpen : undefined}
        >
          {n.badge && <span className="mm-badge">{n.badge}</span>}
          <span className="mm-node-text">
            <b>{n.label}</b>
            {n.sub && <small>{n.sub}</small>}
          </span>
          {(st.picks.includes(n.id) || angleIds.includes(n.id) || n.id === typeId) && (
            <Icon name="star" className="mm-star" />
          )}
          {hasChildren && n.tone !== 'root' && (
            <Icon name={isOpen ? 'left' : 'right'} className="mm-caret" />
          )}
        </button>
        {hasChildren && isOpen && (
          <div className="mm-children">
            {n.children!.map((c) => (
              <div className="mm-item" key={`${n.id}:${c.id}`}>
                {renderNode(c)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------- Bảng chi tiết
  const renderDirection = (d: Direction) => {
    const picked = st.picks.includes(d.id)
    return (
      <>
        <div className="mm-d-head">
          <span className="mm-kicker">
            {d.group === 'actor' ? 'Chủ thể' : 'Khía cạnh'} · {d.no}
          </span>
          <h2>
            {d.vi} <span>{d.en}</span>
          </h2>
          <p>{d.question}</p>
          <div className="mm-d-actions">
            <button type="button" className={picked ? 'mm-btn is-on' : 'mm-btn'} onClick={() => togglePick(d.id)}>
              <Icon name="star" />
              {picked ? 'Đã chọn' : 'Chọn cho bài'}
            </button>
            <button type="button" className="mm-btn" onClick={() => addChain(d.id)}>
              <Icon name="plus" />
              Thêm vào chuỗi
            </button>
          </div>
        </div>

        <Section title="Cụm từ có thể dùng" aside={<small className="mm-hint">Bấm để chép</small>}>
          <div className="mm-chips">
            {d.phrases.map((p, i) => (
              <button
                type="button"
                key={i}
                className="mm-chip mm-chip-phrase"
                onClick={() => copy(`${d.id}.p${i}`, p.en ?? p.vi)}
                title={p.vi}
              >
                {copied === `${d.id}.p${i}` ? <Icon name="check" /> : null}
                <span>
                  <b>{p.en ?? p.vi}</b>
                  {p.en && <small>{p.vi}</small>}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Đào sâu bằng 6 câu hỏi">
          <dl className="mm-sixw">
            {SIX_W.map((w) => (
              <div key={w.key}>
                <dt>{w.label}</dt>
                <dd>
                  <span>{d.sixW[w.key].vi}</span>
                  <button type="button" className="mm-en" onClick={() => copy(`${d.id}.${w.key}`, d.sixW[w.key].en)}>
                    {d.sixW[w.key].en}
                    <Icon name={copied === `${d.id}.${w.key}` ? 'check' : 'copy'} />
                  </button>
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Chuỗi lập luận mẫu">
          <ol className="mm-flow">
            {d.chain.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        </Section>

        <Section
          title="Đoạn mẫu band 6.0–6.5"
          aside={
            <span className="mm-row">
              {speakBtn(`${d.id}.s`, d.sample)}
              {copyBtn(`${d.id}.s`, d.sample)}
            </span>
          }
        >
          <blockquote className="mm-quote">{d.sample}</blockquote>
        </Section>
      </>
    )
  }

  const renderAngle = (a: Angle) => {
    const on = angleIds.includes(a.id)
    return (
      <>
        <div className="mm-d-head">
          <span className="mm-kicker">
            Góc lập luận{suggested.has(a.id) ? ' · gợi ý cho dạng đề này' : ''}
          </span>
          <h2>
            {a.vi} <span>{a.en}</span>
          </h2>
          <p>{a.question}</p>
          <div className="mm-d-actions">
            <button type="button" className={on ? 'mm-btn is-on' : 'mm-btn'} onClick={() => toggleAngle(a.id)}>
              <Icon name="star" />
              {on ? `Đang dùng cho thân bài ${angleIds.indexOf(a.id) + 1}` : 'Dùng cho thân bài'}
            </button>
          </div>
        </div>

        <Section title="Khung đoạn" aside={<small className="mm-hint">{a.chain}</small>}>
          <ol className="mm-frame">
            {a.frame.map((f, i) => (
              <li key={i}>
                <span className="mm-peel-key">{PEEL[i].key}</span>
                {f}
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Pattern câu" aside={<small className="mm-hint">Giữ nguyên [ô trống] rồi điền</small>}>
          <ul className="mm-patterns">
            {a.patterns.map((p, i) => (
              <li key={i}>
                <span dangerouslySetInnerHTML={{ __html: highlightSlots(p) }} />
                {copyBtn(`${a.id}.pt${i}`, p)}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Từ nối hay dùng" aside={<small className="mm-hint">Bấm để chép</small>}>
          <div className="mm-chips">
            {a.linkers.map((l, i) => (
              <button type="button" key={i} className="mm-chip" onClick={() => copy(`${a.id}.l${i}`, l)}>
                {copied === `${a.id}.l${i}` ? <Icon name="check" /> : null}
                {l}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title="Đoạn ví dụ"
          aside={
            <span className="mm-row">
              {speakBtn(`${a.id}.s`, a.sample)}
              {copyBtn(`${a.id}.s`, a.sample)}
            </span>
          }
        >
          <p className="mm-prompt-ex">{a.prompt}</p>
          <blockquote className="mm-quote">{a.sample}</blockquote>
          <p className="mm-vi">Dịch ý: {a.sampleVi}</p>
        </Section>
      </>
    )
  }

  const renderType = (t: EssayType) => {
    const on = typeId === t.id
    return (
      <>
        <div className="mm-d-head">
          <span className="mm-kicker">Dạng đề{detected === t.id ? ' · dò được từ đề bài' : ''}</span>
          <h2>
            {t.vi} <span>{t.en}</span>
          </h2>
          <p>{t.task}</p>
          <div className="mm-d-actions">
            <button type="button" className={on ? 'mm-btn is-on' : 'mm-btn'} onClick={() => chooseType(on && st.manualType ? null : t.id)}>
              <Icon name="star" />
              {on ? 'Đang dùng dạng này' : 'Chọn dạng đề này'}
            </button>
          </div>
        </div>
        <Section title="Cách triển khai">
          <dl className="mm-facts">
            <div>
              <dt>Thân bài</dt>
              <dd>{t.bodies}</dd>
            </div>
            <div>
              <dt>Quan điểm</dt>
              <dd>{t.opinion}</dd>
            </div>
            {t.keywords.length > 0 && (
              <div>
                <dt>Nhận diện</dt>
                <dd>
                  {t.keywords.map((k) => (
                    <code key={k}>{k}</code>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Section>
        <Section title="Hướng ghép gợi ý" aside={<small className="mm-hint">Bấm để xem pattern</small>}>
          <p className="mm-note">{t.note}</p>
          <div className="mm-chips">
            {t.angles.map((id) => {
              const a = findAngle(id)!
              return (
                <button type="button" key={id} className="mm-chip is-accent" onClick={() => reveal(id)}>
                  {a.en} · {a.vi}
                </button>
              )
            })}
          </div>
        </Section>
        <Section title="Câu mở bài / kết bài mẫu">
          <ul className="mm-patterns">
            <li>
              <span dangerouslySetInnerHTML={{ __html: highlightSlots(t.intro) }} />
              {copyBtn(`${t.id}.i`, t.intro)}
            </li>
            <li>
              <span dangerouslySetInnerHTML={{ __html: highlightSlots(t.conclusion) }} />
              {copyBtn(`${t.id}.c`, t.conclusion)}
            </li>
          </ul>
        </Section>
      </>
    )
  }

  const renderDirList = (group: 'actor' | 'aspect') => (
    <div className="mm-cards">
      {DIRECTIONS.filter((d) => d.group === group).map((d) => (
        <button type="button" key={d.id} className="mm-card" onClick={() => reveal(d.id)}>
          <span className="mm-badge">{d.no}</span>
          <span>
            <b>
              {d.vi}
              {st.picks.includes(d.id) && <Icon name="star" className="mm-star" />}
            </b>
            <small>{d.question}</small>
          </span>
        </button>
      ))}
    </div>
  )

  const renderDetail = (): ReactNode => {
    const id = st.active
    const d = findDirection(id)
    if (d) return renderDirection(d)
    const a = findAngle(id)
    if (a) return renderAngle(a)
    const t = findEssayType(id)
    if (t) return renderType(t)

    if (id === 'step.type')
      return (
        <>
          <Head kicker="Bước 1" title="Dạng đề" text="Đọc câu hỏi cuối đề để biết phải trả lời mấy phần. Dạng đề quyết định 2 góc lập luận cho 2 thân bài." />
          <div className="mm-cards">
            {ESSAY_TYPES.map((t) => (
              <button type="button" key={t.id} className={typeId === t.id ? 'mm-card is-on' : 'mm-card'} onClick={() => reveal(t.id)}>
                <span>
                  <b>{t.vi}</b>
                  <small>{t.en}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )

    if (id === 'step.direction')
      return (
        <>
          <Head kicker="Bước 2" title="Hướng phân tích" text="Khi đọc bất kỳ đề nào, tự hỏi 6 câu dưới đây. WHO chọn chủ thể, WHY/WHAT/HOW/WHEN/WHICH đào sâu chủ thể đó." />
          <dl className="mm-facts">
            {SIX_W.map((w) => (
              <div key={w.key}>
                <dt>{w.label}</dt>
                <dd>{w.question}</dd>
              </div>
            ))}
          </dl>
          <Section title="Câu hỏi nào gọi hướng nào?">
            <table className="mm-table">
              <tbody>
                <tr><td>WHO, HOW</td><td>Chủ thể 1–5 (ai làm gì)</td></tr>
                <tr><td>WHY, WHAT</td><td>Khía cạnh 6–11 (nguyên nhân, lợi, hại)</td></tr>
                <tr><td>WHEN, WHICH</td><td>12 Ngắn hạn – dài hạn, kết hợp 1–5</td></tr>
              </tbody>
            </table>
            <p className="mm-note">Mỗi đoạn thân bài chỉ cần 1 chủ thể + 1–2 khía cạnh, triển khai theo Ý chính → Giải thích → Ví dụ → Kết quả.</p>
          </Section>
          <div className="mm-chips">
            <button type="button" className="mm-chip is-accent" onClick={() => reveal('group.actor')}>Chủ thể 1–5</button>
            <button type="button" className="mm-chip is-accent" onClick={() => reveal('group.aspect')}>Khía cạnh 6–12</button>
            <button type="button" className="mm-chip is-accent" onClick={() => reveal('group.angle')}>8 góc lập luận</button>
          </div>
        </>
      )

    if (id === 'group.actor')
      return (
        <>
          <Head kicker="WHO / HOW" title="Chủ thể" text="Ai liên quan và ai nên hành động? Chọn 1 chủ thể cho mỗi thân bài. Bấm vào thẻ để xem cụm từ." />
          {renderDirList('actor')}
        </>
      )
    if (id === 'group.aspect')
      return (
        <>
          <Head kicker="WHY / WHAT / WHEN" title="Khía cạnh" text="Ý của bạn tác động tới mặt nào của đời sống? Dùng để trả lời WHAT và WHEN cho mọi chủ thể." />
          {renderDirList('aspect')}
        </>
      )
    if (id === 'group.angle')
      return (
        <>
          <Head kicker="Góc lập luận" title="8 góc lập luận" text="Mỗi góc có khung đoạn, pattern câu và từ nối riêng. Dạng đề đã chọn sẽ gợi ý 2 góc." />
          <div className="mm-cards">
            {ANGLES.map((a) => (
              <button
                type="button"
                key={a.id}
                className={['mm-card', angleIds.includes(a.id) ? 'is-on' : '', suggested.has(a.id) ? 'is-suggested' : ''].join(' ')}
                onClick={() => reveal(a.id)}
              >
                <span>
                  <b>
                    {a.vi} · {a.en}
                  </b>
                  <small>{a.question}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )

    if (id === 'step.chain') return renderChain()
    if (id === 'outline.peel')
      return (
        <>
          <Head kicker="Bước 4" title="Khung P–E–E–L" text="Mọi đoạn thân bài đi theo đúng thứ tự này. Mỗi góc lập luận chỉ thay đổi nội dung 4 bước, thứ tự giữ nguyên." />
          <ol className="mm-peel">
            {PEEL.map((p, i) => (
              <li key={i}>
                <span className="mm-peel-key">{p.key}</span>
                <span>
                  <b>{p.name}</b> — {p.task}
                  <small>Tự kiểm: {p.check}</small>
                </span>
              </li>
            ))}
          </ol>
        </>
      )
    if (id === 'step.outline' || id.startsWith('outline.')) return renderOutline(id)
    if (id === 'step.check' || id.startsWith('check.')) return renderCheck(id)

    // root
    return (
      <>
        <Head
          kicker="Sơ đồ tư duy"
          title="Xử lý một đề Task 2"
          text="Đi theo 5 nhánh từ trái sang phải. Bấm vào bất kỳ nút nào để xem chủ thể, cụm từ và câu mẫu có thể dùng để giải thích ý."
        />
        <ol className="mm-steps">
          {(tree.children ?? []).map((s, i) => (
            <li key={s.id}>
              <button type="button" onClick={() => reveal(s.id)}>
                <span className="mm-badge">{STEP_NO[i]}</span>
                <span>
                  <b>{s.label}</b>
                  <small>{s.sub}</small>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <p className="mm-note">
          Trong phòng thi, chỉ chọn <b>hai hướng mạnh nhất</b> và viết sâu. Các hướng trên sơ đồ là công cụ tìm ý, không phải danh sách phải viết hết.
        </p>
      </>
    )
  }


  const renderChain = () => {
    const first = chain[0]
    const aspects = chain.filter((d) => d.group === 'aspect').length
    const hints: string[] = []
    if (chain.length && first?.group !== 'actor') hints.push('Nên mở đầu chuỗi bằng một chủ thể (1–5): ai làm gì?')
    if (chain.length > 0 && chain.length < 3) hints.push('Một chuỗi tốt có 3–4 mắt xích.')
    if (aspects > 3) hints.push('Quá nhiều khía cạnh, đoạn văn sẽ dàn trải. Giữ 1–3 khía cạnh.')
    return (
      <>
        <Head
          kicker="Bước 3"
          title="Chuỗi lập luận"
          text="Nối 1 chủ thể với 1–2 khía cạnh thành chuỗi nguyên nhân – kết quả. Ví dụ: Chính phủ đánh thuế đồ ngọt → Sức khỏe: giảm béo phì → Kinh tế: giảm chi phí y tế → Dài hạn: xã hội khỏe hơn."
        />
        {chain.length > 0 ? (
          <ol className="mm-chain">
            {chain.map((d, i) => (
              <li key={`${d.id}-${i}`}>
                <button type="button" className="mm-chain-pill" onClick={() => reveal(d.id)}>
                  <span className="mm-badge">{d.no}</span>
                  {d.vi}
                </button>
                <button type="button" className="mm-x" onClick={() => removeChain(i)} aria-label={`Bỏ ${d.vi}`}>
                  <Icon name="x" />
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mm-empty">Chưa có mắt xích nào. Thêm từ danh sách bên dưới.</p>
        )}
        {hints.map((h) => (
          <p className="mm-warn" key={h}>
            <Icon name="alert" />
            {h}
          </p>
        ))}
        <Section title="Thêm mắt xích">
          <div className="mm-chips">
            {DIRECTIONS.map((d) => (
              <button type="button" key={d.id} className={d.group === 'actor' ? 'mm-chip is-accent' : 'mm-chip'} onClick={() => addChain(d.id)}>
                <Icon name="plus" />
                {d.no}. {d.vi}
              </button>
            ))}
          </div>
        </Section>
        <Section title="Từ nối giữa các mắt xích">
          <div className="mm-chips">
            {['lead to', 'as a result', 'in turn', 'which means that', 'consequently', 'this would help to'].map((l) => (
              <button type="button" key={l} className="mm-chip" onClick={() => copy(`chain.${l}`, l)}>
                {copied === `chain.${l}` ? <Icon name="check" /> : null}
                {l}
              </button>
            ))}
          </div>
        </Section>
        {chain.length > 0 && (
          <Section title="Chuỗi mẫu của các hướng đã chọn">
            {[...new Set(chain)].map((d) => (
              <p className="mm-note" key={d.id}>
                <b>{d.vi}:</b> {d.chain.join(' → ')}
              </p>
            ))}
          </Section>
        )}
      </>
    )
  }

  const renderOutline = (focus: string) => (
    <>
      <Head
        kicker="Bước 4"
        title="Dàn bài 4 đoạn"
        text="Dàn bài tự ghép từ dạng đề, 2 góc lập luận, các hướng đã ★ và chuỗi lập luận. Đổi lựa chọn trên sơ đồ là dàn bài cập nhật theo."
      />
      <dl className="mm-facts">
        <div>
          <dt>Dạng đề</dt>
          <dd>{type ? `${type.vi} · ${type.en}` : <button type="button" className="mm-link" onClick={() => reveal('step.type')}>Chưa chọn — chọn dạng đề</button>}</dd>
        </div>
        <div className={focus === 'outline.body1' ? 'is-focus' : ''}>
          <dt>Thân bài 1</dt>
          <dd>{angles[0] ? `${angles[0].vi} · ${angles[0].en}` : <button type="button" className="mm-link" onClick={() => reveal('group.angle')}>Chọn góc lập luận</button>}{picks[0] ? ` + ${picks[0].vi}` : ''}</dd>
        </div>
        <div className={focus === 'outline.body2' ? 'is-focus' : ''}>
          <dt>Thân bài 2</dt>
          <dd>{angles[1] ? `${angles[1].vi} · ${angles[1].en}` : <button type="button" className="mm-link" onClick={() => reveal('group.angle')}>Chọn góc lập luận</button>}{picks[1] ? ` + ${picks[1].vi}` : ''}</dd>
        </div>
      </dl>
      {(focus === 'outline.intro' || focus === 'outline.conclusion') && type && (
        <Section title={focus === 'outline.intro' ? 'Câu mở bài mẫu' : 'Câu kết bài mẫu'}>
          <ul className="mm-patterns">
            <li>
              <span dangerouslySetInnerHTML={{ __html: highlightSlots(focus === 'outline.intro' ? type.intro : type.conclusion) }} />
              {copyBtn(`${focus}.t`, focus === 'outline.intro' ? type.intro : type.conclusion)}
            </li>
          </ul>
        </Section>
      )}
      <Section title="Dàn bài" aside={copyBtn('outline', outline, 'Chép dàn bài')}>
        <pre className="mm-outline">{outline}</pre>
      </Section>
      <div className="mm-d-actions">
        <button type="button" className="mm-btn is-primary" onClick={createDraft} disabled={busy}>
          <Icon name="pen" />
          {busy ? 'Đang tạo…' : 'Tạo bài viết nháp từ dàn bài'}
        </button>
      </div>
      {msg && <p className="mm-note">{msg}</p>}
    </>
  )

  const renderCheck = (focus: string) => (
    <>
      <Head kicker="Bước 5" title="Kiểm tra trước khi nộp" text={`Đã tích ${checkDone}/${checkTotal}. Bám theo 4 tiêu chí chấm chính thức của IELTS.`} />
      {CHECKLIST.map((c) => (
        <section key={c.id} className={focus === `check.${c.id}` ? 'mm-sec is-focus' : 'mm-sec'}>
          <div className="mm-sec-head">
            <h3>
              {c.criterion} <span className="mm-hint">{c.short}</span>
            </h3>
          </div>
          <ul className="mm-checks">
            {c.items.map((i) => (
              <li key={i.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(st.checks[i.id])}
                    onChange={(e) => patch({ checks: { ...st.checks, [i.id]: e.target.checked } })}
                  />
                  <span>{i.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {checkDone > 0 && (
        <button type="button" className="mm-btn" onClick={() => patch({ checks: {} })}>
          <Icon name="refresh" />
          Bỏ tích tất cả
        </button>
      )}
    </>
  )

  // ---------------------------------------------------------------- Bố cục trang
  return (
    <div className="page mm-page">
      <div className="mm-head">
        <div>
          <h1>Tư duy Task 2</h1>
          <p>Sơ đồ tư duy xử lý một đề IELTS Writing Task 2: nhận dạng đề, chọn hướng, lập chuỗi lập luận, ra dàn bài và tự kiểm tra.</p>
        </div>
        <button type="button" className="mm-btn" onClick={reset}>
          <Icon name="refresh" />
          Làm lại
        </button>
      </div>

      <section className="mm-promptbox">
        <label htmlFor="mm-prompt">Đề bài</label>
        <textarea
          id="mm-prompt"
          rows={2}
          placeholder="Dán đề Task 2 vào đây, ví dụ: Some people believe that governments should take responsibility for protecting the environment, while others think individuals should be responsible. Discuss both views and give your opinion."
          value={st.prompt}
          onChange={(e) => patch({ prompt: e.target.value, manualType: null, angles: null })}
        />
        <div className="mm-detect">
          <span className="mm-detect-label">Dạng đề</span>
          <select
            value={typeId ?? ''}
            onChange={(e) => chooseType(e.target.value || null)}
            aria-label="Dạng đề"
          >
            <option value="">{st.prompt.trim() ? 'Chưa nhận ra — chọn tay' : 'Chọn dạng đề'}</option>
            {ESSAY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.vi} · {t.en}
              </option>
            ))}
          </select>
          {detected && !st.manualType && <span className="mm-tag">Tự nhận diện</span>}
          {type && (
            <>
              <span className="mm-detect-label">Thân bài</span>
              {angles.length ? (
                angles.map((a, i) => (
                  <button type="button" key={a.id} className="mm-chip is-accent" onClick={() => reveal(a.id)}>
                    {i + 1}. {a.en}
                  </button>
                ))
              ) : (
                <button type="button" className="mm-link" onClick={() => reveal('group.angle')}>
                  chọn góc lập luận
                </button>
              )}
            </>
          )}
        </div>
      </section>

      <div className="mm-layout">
        <section className="mm-mapcard" aria-label="Sơ đồ tư duy">
          <div className="mm-map" ref={mapRef}>
            {renderNode(tree)}
          </div>
          <div className="mm-legend">
            <span>
              <Icon name="star" className="mm-star" /> đã chọn
            </span>
            <span>
              <i className="mm-dot" /> gợi ý theo dạng đề
            </span>
            <span>Bấm nút để mở nhánh và xem chi tiết</span>
          </div>
        </section>

        <aside className="mm-detail" ref={detailRef} aria-live="polite">
          {renderDetail()}
        </aside>
      </div>
    </div>
  )
}


const Section = ({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) => (
  <section className="mm-sec">
    <div className="mm-sec-head">
      <h3>{title}</h3>
      {aside}
    </div>
    {children}
  </section>
)

const Head = ({ kicker, title, text }: { kicker: string; title: string; text: string }) => (
  <div className="mm-d-head">
    <span className="mm-kicker">{kicker}</span>
    <h2>{title}</h2>
    <p>{text}</p>
  </div>
)

// Tô màu các [ô trống] trong pattern. Escape trước để an toàn khi chèn HTML.
function highlightSlots(s: string): string {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(/\[([^\]]+)\]/g, '<mark class="mm-slot">[$1]</mark>')
}
