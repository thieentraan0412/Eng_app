import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import Icon, { type IconName } from '../components/Icon'
import { useTheme } from '../contexts/ThemeContext'
import { CloudApi, type Writing } from '../services/cloud/CloudApiClient'
import { errText } from '../services/cloud/cloudError'
import { suggest, type Suggestion } from '../services/suggestion'
import {
  ignoreWord,
  isMisspelled,
  isNonEnglish,
  suggestFix,
  tokenizeWords,
} from '../services/spellcheck'
import { checkGrammar, type GrammarMatch } from '../services/grammarcheck'
import { checkLocalGrammar } from '../services/localgrammar'
import '../styles/writing.css'

// Gộp lỗi offline + LanguageTool, bỏ trùng theo vị trí, sắp theo thứ tự trong câu
function mergeGrammar(a: GrammarMatch[], b: GrammarMatch[]): GrammarMatch[] {
  const seen = new Set<string>()
  const out: GrammarMatch[] = []
  for (const m of [...a, ...b]) {
    const key = `${m.offset}:${m.length}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(m)
  }
  return out.sort((x, y) => x.offset - y.offset).slice(0, 15)
}

interface SpellItem {
  word: string
  suggestions: string[]
  foreign: boolean // chứa ký tự ngoài bảng chữ cái tiếng Anh -> không phải lỗi gõ máy
  pending: boolean // đang tìm gợi ý sửa
}

// Chạy một việc nặng vào lúc trình duyệt rảnh. Có timeout để không bị hoãn mãi
// khi người dùng gõ liên tục.
function whenIdle(fn: () => void): void {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
    .requestIdleCallback
  if (typeof ric === 'function') ric(fn, { timeout: 300 })
  else setTimeout(fn, 0)
}

// Đề bài điền sẵn khi mở bài mới (từ nút gợi ý hoặc thẻ chủ đề)
interface PromptDraft {
  title: string
  topic: string
}

// Chủ đề gợi ý ở cuối trang danh sách — bấm là mở bài mới với đề tương ứng
interface TopicCard extends PromptDraft {
  icon: IconName
  label: string
  level: string
  words: string
}

const TOPIC_CARDS: TopicCard[] = [
  {
    icon: 'pen',
    label: 'Giới thiệu bản thân',
    level: 'A1',
    words: '80–120 từ',
    topic: 'Personal',
    title: 'Introduce yourself: who you are and what you do',
  },
  {
    icon: 'clock',
    label: 'Thói quen hằng ngày',
    level: 'A2',
    words: '100–150 từ',
    topic: 'Daily life',
    title: 'Describe your typical morning routine',
  },
  {
    icon: 'book',
    label: 'Một cuốn sách bạn thích',
    level: 'B1',
    words: '150–200 từ',
    topic: 'Culture',
    title: 'Write about a book you love and why',
  },
  {
    icon: 'trend',
    label: 'Mạng xã hội & giới trẻ',
    level: 'B1',
    words: '180–250 từ',
    topic: 'Technology',
    title: 'Do social networks bring people closer together?',
  },
  {
    icon: 'cloud',
    label: 'Biến đổi khí hậu',
    level: 'B2',
    words: '250–300 từ',
    topic: 'Environment',
    title: 'What can individuals do to slow down climate change?',
  },
  {
    icon: 'target',
    label: 'Mục tiêu 5 năm tới',
    level: 'B2',
    words: '200–280 từ',
    topic: 'Work & Study',
    title: 'Where do you see yourself in five years?',
  },
  {
    icon: 'speak',
    label: 'Thành phố bạn muốn sống',
    level: 'B1',
    words: '150–220 từ',
    topic: 'Opinion',
    title: 'Which city would you most like to live in and why?',
  },
  {
    icon: 'bulb',
    label: 'Công nghệ & việc học',
    level: 'B2',
    words: '220–300 từ',
    topic: 'Technology',
    title: 'How has technology changed the way we study?',
  },
  {
    icon: 'flame',
    label: 'Một ngày đáng nhớ',
    level: 'A2',
    words: '120–180 từ',
    topic: 'Story',
    title: 'Write about the most memorable day of your life',
  },
]

const TOPIC_OPTIONS = [
  ...new Set(TOPIC_CARDS.map((p) => p.topic)),
].sort()

const DAY = 86400000

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
// Vài dòng đầu của bài, gộp lại thành một dòng mô tả trong danh sách
function excerptOf(content: string | null): string {
  const flat = (content ?? '').replace(/\s+/g, ' ').trim()
  return flat.length > 150 ? `${flat.slice(0, 150)}…` : flat
}
function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}
// "Hôm nay · 10:49" · "Hôm qua · 21:12" · "5 ngày trước"
function relTime(iso: string): string {
  const d = new Date(iso)
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((midnight.getTime() - d.getTime()) / DAY) + 1
  const hhmm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays <= 0) return `Hôm nay · ${hhmm}`
  if (diffDays === 1) return `Hôm qua · ${hhmm}`
  if (diffDays < 30) return `${diffDays} ngày trước`
  return d.toLocaleDateString('vi-VN')
}
// Chuỗi ngày viết liên tiếp tính đến hôm nay (hoặc hôm qua nếu hôm nay chưa viết)
function streakOf(days: Set<string>): { now: number; best: number } {
  const sorted = [...days].sort()
  let best = 0
  let run = 0
  let prev: number | null = null
  for (const d of sorted) {
    const t = new Date(`${d}T00:00:00`).getTime()
    run = prev !== null && t - prev === DAY ? run + 1 : 1
    prev = t
    if (run > best) best = run
  }
  // Chuỗi hiện tại: đi ngược từ hôm nay
  let now = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(cursor.toISOString().slice(0, 10))) {
    now++
    cursor.setDate(cursor.getDate() - 1)
  }
  return { now, best }
}

// Màn hình chưa đủ rộng cho hai cột -> trợ lý mở dạng lớp nổi.
function useIsNarrow(maxWidth = 1199): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= maxWidth,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${maxWidth}px)`)
    const onChange = () => setNarrow(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [maxWidth])
  return narrow
}

type Filter = 'all' | 'week' | 'err' | 'clean'
type SortKey = 'new' | 'old' | 'long' | 'az'

// ================= TRANG DANH SÁCH BÀI VIẾT =================
export default function WritingPage() {
  const [writings, setWritings] = useState<Writing[]>([])
  const [sel, setSel] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<PromptDraft | null>(null) // đề điền sẵn cho bài mới
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Số lỗi chính tả từng bài — tính trễ sau khi danh sách đã hiện (nặng)
  const [spellCounts, setSpellCounts] = useState<Record<string, number>>({})
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<SortKey>('new')
  const [topicSeed, setTopicSeed] = useState(0)

  const load = async () => {
    try {
      setWritings(await CloudApi.listWritings())
    } catch (e) {
      setError(errText(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  // Đếm lỗi chính tả cho nhãn cảnh báo. Từ điển nspell dựng lần đầu khá tốn
  // thời gian nên hoãn lại để danh sách hiện ra trước.
  useEffect(() => {
    if (localStorage.getItem('spell_enabled') === '0' || writings.length === 0) {
      setSpellCounts({})
      return
    }
    let cancelled = false
    const handle = setTimeout(() => {
      const out: Record<string, number> = {}
      for (const w of writings) {
        const uniq = [...new Set(tokenizeWords((w.content ?? '').slice(0, 4000)))]
        out[w.id] = uniq.filter((t) => isMisspelled(t)).length
      }
      if (!cancelled) setSpellCounts(out)
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [writings])

  const openNew = (prompt: PromptDraft | null) => {
    setDraft(prompt)
    setSel('new')
  }

  const remove = async (id: string) => {
    if (!confirm('Xóa bài viết này?')) return
    try {
      await CloudApi.deleteWriting(id)
      if (sel === id) setSel(null)
      load()
    } catch (e) {
      setError(errText(e))
    }
  }

  // ---------- Chỉ số ----------
  const stats = useMemo(() => {
    const now = Date.now()
    const week = writings.filter((w) => now - Date.parse(w.created_at) < 7 * DAY)
    const totalWords = writings.reduce((s, w) => s + (w.word_count ?? 0), 0)
    const weekWords = week.reduce((s, w) => s + (w.word_count ?? 0), 0)
    const days = new Set<string>()
    for (const w of writings) {
      days.add(dayKey(w.created_at))
      days.add(dayKey(w.updated_at))
    }
    const { now: streak, best } = streakOf(days)
    const errWritings = writings.filter((w) => (spellCounts[w.id] ?? 0) > 0)
    const errTotal = errWritings.reduce((s, w) => s + (spellCounts[w.id] ?? 0), 0)
    return {
      total: writings.length,
      weekCount: week.length,
      totalWords,
      weekWords,
      avgWords: writings.length ? Math.round(totalWords / writings.length) : 0,
      streak,
      best,
      errTotal,
      errDocs: errWritings.length,
    }
  }, [writings, spellCounts])

  // ---------- Lọc + sắp xếp ----------
  const counts = useMemo(() => {
    const now = Date.now()
    return {
      all: writings.length,
      week: writings.filter((w) => now - Date.parse(w.updated_at) < 7 * DAY).length,
      err: writings.filter((w) => (spellCounts[w.id] ?? 0) > 0).length,
      clean: writings.filter((w) => (spellCounts[w.id] ?? 0) === 0).length,
    }
  }, [writings, spellCounts])

  const shown = useMemo(() => {
    const kw = query.trim().toLowerCase()
    const now = Date.now()
    const list = writings.filter((w) => {
      const bad = spellCounts[w.id] ?? 0
      const okFilter =
        filter === 'all' ||
        (filter === 'week' && now - Date.parse(w.updated_at) < 7 * DAY) ||
        (filter === 'err' && bad > 0) ||
        (filter === 'clean' && bad === 0)
      const okQuery =
        !kw ||
        (w.title ?? '').toLowerCase().includes(kw) ||
        (w.content ?? '').toLowerCase().includes(kw) ||
        (w.topic ?? '').toLowerCase().includes(kw)
      return okFilter && okQuery
    })
    const by: Record<SortKey, (a: Writing, b: Writing) => number> = {
      new: (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
      old: (a, b) => Date.parse(a.updated_at) - Date.parse(b.updated_at),
      long: (a, b) => (b.word_count ?? 0) - (a.word_count ?? 0),
      az: (a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'en'),
    }
    return [...list].sort(by[sort])
  }, [writings, spellCounts, query, filter, sort])

  // 6 thẻ chủ đề, đổi bộ khác khi bấm "Đổi chủ đề khác"
  const topics = useMemo(() => {
    const start = (topicSeed * 3) % TOPIC_CARDS.length
    return Array.from({ length: 6 }, (_, i) => TOPIC_CARDS[(start + i) % TOPIC_CARDS.length])
  }, [topicSeed])

  const filtering = query.trim() !== '' || filter !== 'all'

  // Trang soạn thảo (khi đã chọn / tạo bài)
  if (sel) {
    const current = sel !== 'new' ? writings.find((w) => w.id === sel) ?? null : null
    return (
      <Editor
        key={sel}
        writing={current}
        initial={sel === 'new' ? draft : null}
        onBack={() => {
          setSel(null)
          setDraft(null)
          load()
        }}
        onDelete={current ? () => remove(current.id) : undefined}
      />
    )
  }

  // ---------------------------------------------------------------- Danh sách
  return (
    <div className="page write-page">
      <div className="write-head">
        <div>
          <h1>Bài viết</h1>
          <p>
            Luyện viết tiếng Anh với gợi ý từ, kiểm tra chính tả &amp; ngữ pháp theo thời gian
            thực.
          </p>
        </div>
        <div className="write-head-actions">
          <button className="write-btn write-btn-primary" onClick={() => openNew(null)}>
            <Icon name="plus" /> Bài viết mới
          </button>
        </div>
      </div>

      {error && <div className="write-alert">{error}</div>}

      {/* ---------------------------------------------------------- Chỉ số */}
      <section className="write-stats">
        <div className="write-stat">
          <span className="write-stat-top">
            <span className="write-stat-label">Bài viết</span>
            <Icon name="pen" />
          </span>
          <span className="write-stat-value">{stats.total}</span>
          <span className="write-stat-sub">
            {stats.weekCount > 0 ? `${stats.weekCount} bài trong tuần này` : 'Chưa có bài mới tuần này'}
          </span>
        </div>
        <div className="write-stat">
          <span className="write-stat-top">
            <span className="write-stat-label">Tổng số từ</span>
            <Icon name="type" />
          </span>
          <span className="write-stat-value">{stats.totalWords.toLocaleString('vi-VN')}</span>
          <span className="write-stat-sub">
            {stats.weekWords > 0 ? (
              <>
                <span className="write-delta">+{stats.weekWords.toLocaleString('vi-VN')}</span> từ ở
                bài viết tuần này
              </>
            ) : (
              `Trung bình ${stats.avgWords} từ mỗi bài`
            )}
          </span>
        </div>
        <div className="write-stat">
          <span className="write-stat-top">
            <span className="write-stat-label">Chuỗi ngày viết</span>
            <Icon name="flame" />
          </span>
          <span className="write-stat-value">{stats.streak}</span>
          <span className="write-stat-sub">
            {stats.best > 0 ? `Kỷ lục ${stats.best} ngày` : 'Viết hôm nay để bắt đầu chuỗi'}
          </span>
        </div>
        <div className="write-stat">
          <span className="write-stat-top">
            <span className="write-stat-label">Lỗi chưa sửa</span>
            <Icon name="alert" />
          </span>
          <span className="write-stat-value">{stats.errTotal}</span>
          <span className="write-stat-sub">
            {stats.errTotal > 0 ? `Ở ${stats.errDocs} bài viết` : 'Không còn lỗi chính tả'}
          </span>
        </div>
      </section>

      {/* ------------------------------------------------- Thanh lọc + tìm */}
      {writings.length > 0 && (
        <div className="write-toolbar">
          <div className="write-search">
            <Icon name="search" />
            <input
              className="write-input"
              type="search"
              placeholder="Tìm theo tiêu đề hoặc nội dung…"
              aria-label="Tìm bài viết"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="write-chipset">
            {(
              [
                ['all', 'Tất cả'],
                ['week', 'Tuần này'],
                ['err', 'Có lỗi'],
                ['clean', 'Không lỗi'],
              ] as [Filter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                className={filter === key ? 'write-chip is-active' : 'write-chip'}
                onClick={() => setFilter(key)}
              >
                {label} <span className="write-chip-count">{counts[key]}</span>
              </button>
            ))}
          </div>
          <span className="write-spacer" />
          <select
            className="write-select"
            aria-label="Sắp xếp"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="new">Mới nhất</option>
            <option value="old">Cũ nhất</option>
            <option value="long">Dài nhất</option>
            <option value="az">Theo tên A→Z</option>
          </select>
        </div>
      )}

      {/* --------------------------------------------------------- Danh sách */}
      {loading ? (
        <p className="write-loading">Đang tải bài viết…</p>
      ) : writings.length === 0 ? (
        <div className="write-empty">
          <Icon name="pen" />
          <b>Chưa có bài viết nào</b>
          <p>Bấm “Bài viết mới” hoặc chọn một chủ đề bên dưới để bắt đầu.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="write-empty">
          <Icon name="search" />
          <b>Không tìm thấy bài viết nào</b>
          <p>Thử từ khóa khác hoặc bỏ bớt bộ lọc đang chọn.</p>
          <button
            className="write-btn write-btn-sm"
            style={{ marginTop: 12 }}
            onClick={() => {
              setQuery('')
              setFilter('all')
            }}
          >
            <Icon name="refresh" /> Xóa bộ lọc
          </button>
        </div>
      ) : (
        <section className="write-list">
          {shown.map((w) => {
            const bad = spellCounts[w.id] ?? 0
            const words = w.word_count ?? 0
            return (
              <div
                key={w.id}
                className="write-row"
                role="button"
                tabIndex={0}
                onClick={() => setSel(w.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSel(w.id)
                  }
                }}
              >
                <span className="write-row-mark">
                  <Icon name="pen" />
                </span>
                <span className="write-row-main">
                  <span className="write-row-title">{w.title || '(chưa có tiêu đề)'}</span>
                  <span className="write-row-excerpt">
                    {excerptOf(w.content) || 'Bài viết trống'}
                  </span>
                  <span className="write-row-meta">
                    <span>{relTime(w.updated_at)}</span>
                    <i className="write-sep" />
                    <span>{words} từ</span>
                    <i className="write-sep" />
                    <span>{(w.content ?? '').length} ký tự</span>
                    {w.topic && (
                      <>
                        <i className="write-sep" />
                        <span>{w.topic}</span>
                      </>
                    )}
                  </span>
                </span>
                <span className="write-row-side">
                  {bad > 0 ? (
                    <span className="write-badge write-badge-warn write-hide-sm">
                      <Icon name="alert" /> {bad} lỗi
                    </span>
                  ) : (
                    <span className="write-badge write-badge-ok write-hide-sm">
                      <Icon name="check" /> Không lỗi
                    </span>
                  )}
                  <button
                    className="write-ibtn danger"
                    title="Xóa bài viết"
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(w.id)
                    }}
                  >
                    <Icon name="trash" />
                  </button>
                </span>
              </div>
            )
          })}
        </section>
      )}

      {/* ----------------------------------------------------- Chủ đề gợi ý */}
      <div className="write-sec-head">
        <h2 className="write-label">Chủ đề gợi ý</h2>
        <button
          className="write-btn write-btn-sm write-btn-ghost"
          onClick={() => setTopicSeed((s) => s + 1)}
        >
          <Icon name="shuffle" /> Đổi chủ đề khác
        </button>
      </div>
      <section className="write-topics">
        {topics.map((t) => (
          <button key={t.label} className="write-topic" onClick={() => openNew(t)}>
            <Icon name={t.icon} />
            <span>
              <b>{t.label}</b>
              <small>
                {t.level} · {t.words}
              </small>
            </span>
          </button>
        ))}
      </section>

      {filtering && shown.length > 0 && (
        <p className="write-note" style={{ textAlign: 'center' }}>
          Đang hiện {shown.length} / {writings.length} bài viết
        </p>
      )}
    </div>
  )
}

// ================= MÀN SOẠN THẢO =================
type PaneKey = 'spell' | 'grammar' | 'hint' | 'stats'

interface ViewPrefs {
  w: string // chiều rộng tờ giấy
  f: string // kiểu chữ
  s: string // cỡ chữ
  l: string // giãn dòng
}
const VIEW_DEFAULT: ViewPrefs = { w: '1120px', f: 'var(--font-sans)', s: '16.5px', l: '1.85' }
const WIDTHS: [string, string][] = [
  ['760px', 'Hẹp'],
  ['960px', 'Vừa'],
  ['1120px', 'Rộng'],
  ['100%', 'Tràn'],
]
const FONTS: [string, string, string][] = [
  ['var(--font-sans)', 'Sans', 'write-f-sans'],
  ['var(--font-serif)', 'Serif', 'write-f-serif'],
  ['ui-monospace, Menlo, Consolas, monospace', 'Mono', 'write-f-mono'],
]
const SIZES: [string, number][] = [
  ['15px', 12.5],
  ['16.5px', 14],
  ['18px', 15.5],
  ['20px', 17],
]
const LINES: [string, string][] = [
  ['1.6', 'Chặt'],
  ['1.85', 'Vừa'],
  ['2.1', 'Thoáng'],
]

// Toạ độ con trỏ trong ô nhập — dựng một bản sao ẩn của textarea rồi đo vị trí
// ký tự tại con trỏ (textarea không cho hỏi trực tiếp).
const MIRROR_PROPS = [
  'boxSizing',
  'width',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'lineHeight',
  'wordSpacing',
] as const

// Bản sao ẩn của ô soạn thảo, dùng để tìm tọa độ con trỏ.
// Giữ lại và dùng lại một phần tử duy nhất: hàm này chạy mỗi lần gõ phím, nếu
// tạo mới rồi xóa đi thì trình duyệt phải tính lại layout cả trang hai lượt.
let mirrorEl: HTMLDivElement | null = null
let mirrorMark: HTMLSpanElement | null = null
let mirrorSig = ''

function getMirror(ta: HTMLTextAreaElement): { box: HTMLDivElement; mark: HTMLSpanElement; lh: number } {
  if (!mirrorEl) {
    mirrorEl = document.createElement('div')
    mirrorEl.setAttribute('aria-hidden', 'true')
    mirrorEl.style.position = 'absolute'
    mirrorEl.style.top = '0'
    mirrorEl.style.left = '-9999px'
    mirrorEl.style.visibility = 'hidden'
    mirrorEl.style.whiteSpace = 'pre-wrap'
    mirrorEl.style.overflowWrap = 'break-word'
    mirrorEl.style.height = 'auto'
    mirrorMark = document.createElement('span')
    mirrorEl.appendChild(mirrorMark)
    document.body.appendChild(mirrorEl)
  }
  const cs = getComputedStyle(ta)
  // Chỉ chép lại kiểu chữ khi có gì đó thật sự đổi (đổi cỡ chữ, đổi độ rộng…)
  const sig = `${cs.font}|${cs.width}|${cs.padding}|${cs.letterSpacing}|${cs.lineHeight}`
  if (sig !== mirrorSig) {
    mirrorSig = sig
    for (const prop of MIRROR_PROPS) {
      const kebab = prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
      mirrorEl.style.setProperty(kebab, cs.getPropertyValue(kebab))
    }
  }
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.6
  return { box: mirrorEl, mark: mirrorMark!, lh }
}

function caretPoint(ta: HTMLTextAreaElement, pos: number): { left: number; top: number; lh: number } {
  const { box, mark, lh } = getMirror(ta)
  // Phần văn bản trước con trỏ nằm thẳng trong box, phần sau nằm trong mark
  if (box.firstChild !== mark) box.insertBefore(document.createTextNode(''), mark)
  ;(box.firstChild as Text).data = ta.value.slice(0, pos)
  mark.textContent = ta.value.slice(pos) || '.'
  const left = mark.offsetLeft
  const top = mark.offsetTop
  const r = ta.getBoundingClientRect()
  return { left: r.left + left - ta.scrollLeft, top: r.top + top - ta.scrollTop, lh }
}

// Icon của thanh định dạng — vẽ thẳng theo mockup (bộ Icon chung không có)
const FMT_ICONS = {
  bullet: (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.6" cy="6.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="4.6" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="4.6" cy="17.5" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  ),
  number: (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M9.5 6.5h11M9.5 12h11M9.5 17.5h11" />
      <path d="M3 4.6h1.4v3.8M2.6 8.4h2.6" strokeWidth="1.4" />
      <path d="M2.6 10.9h2.2l-2.2 3h2.4M2.6 16.2h2.2l-1.3 1.5h.3a1.1 1.1 0 1 1-.9 1.7" strokeWidth="1.4" />
    </svg>
  ),
  quote: (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 5.2v13.6" />
      <path d="M9 8h11M9 12h8M9 16h11" />
    </svg>
  ),
}

function loadView(): ViewPrefs {
  try {
    const raw = localStorage.getItem('write_view')
    if (raw) {
      const stored = { ...VIEW_DEFAULT, ...(JSON.parse(raw) as Partial<ViewPrefs>) }
      // Các độ rộng cũ không còn khớp bố cục studio mới.
      if (!WIDTHS.some(([width]) => width === stored.w)) stored.w = VIEW_DEFAULT.w
      return stored
    }
  } catch {
    /* dữ liệu hỏng -> dùng mặc định */
  }
  return VIEW_DEFAULT
}

function Editor({
  writing,
  initial,
  onBack,
  onDelete,
}: {
  writing: Writing | null
  initial?: PromptDraft | null
  onBack: () => void
  onDelete?: () => void
}) {
  const [id, setId] = useState<string | null>(writing?.id ?? null)
  const [title, setTitle] = useState(writing?.title ?? initial?.title ?? '')
  const [topic, setTopic] = useState(writing?.topic ?? initial?.topic ?? '')
  const [content, setContent] = useState(writing?.content ?? '')
  const [caret, setCaret] = useState(0)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [spellList, setSpellList] = useState<SpellItem[]>([])
  const [spellVersion, setSpellVersion] = useState(0)
  const [grammar, setGrammar] = useState<GrammarMatch[]>([])
  const [grammarChecking, setGrammarChecking] = useState(false)
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

  const narrow = useIsNarrow()
  const { theme, toggle } = useTheme()
  // Chỉ dock panel khi đủ rộng; tablet/mobile mở theo yêu cầu dưới dạng lớp nổi.
  const [panelOpen, setPanelOpen] = useState(!narrow)
  const [pane, setPane] = useState<PaneKey>('spell')
  const [popView, setPopView] = useState(false)
  const [view, setView] = useState<ViewPrefs>(loadView)

  const [suggestOn, setSuggestOn] = useState(localStorage.getItem('suggest_enabled') !== '0')
  // Bảng gợi ý nổi ngay dưới con trỏ (như mockup) — chỉ khi ô viết đang focus
  const [ghost, setGhost] = useState<{ left: number; top: number } | null>(null)
  const [ghostIdx, setGhostIdx] = useState(0)
  const [focused, setFocused] = useState(false)
  const spellEnabled = localStorage.getItem('spell_enabled') !== '0'
  const grammarEnabled = localStorage.getItem('grammar_enabled') !== '0'
  const taRef = useRef<HTMLTextAreaElement>(null)
  const pendingCaret = useRef<number | null>(null)
  const pendingSel = useRef<{ start: number; end: number } | null>(null)
  const composing = useRef(false)

  useEffect(() => {
    setPanelOpen(!narrow)
  }, [narrow])

  useEffect(() => {
    localStorage.setItem('write_view', JSON.stringify(view))
  }, [view])

  // Gợi ý từ
  useEffect(() => {
    if (!suggestOn) {
      setSuggestions([])
      return
    }
    setSuggestions(suggest(content.slice(0, caret)))
  }, [content, caret, suggestOn])

  // Đặt bảng gợi ý ngay dưới con trỏ, lùi vào trong nếu chạm mép phải màn hình
  useEffect(() => {
    const ta = taRef.current
    if (!suggestOn || !focused || suggestions.length === 0 || !ta) {
      setGhost(null)
      return
    }
    const pt = caretPoint(ta, caret)
    const box = ta.getBoundingClientRect()
    // Con trỏ cuộn ra ngoài vùng nhìn thấy thì không hiện
    if (pt.top < box.top - 8 || pt.top > box.bottom - 4) {
      setGhost(null)
      return
    }
    setGhost({
      left: Math.min(pt.left, window.innerWidth - 190),
      top: Math.min(pt.top + pt.lh + 4, window.innerHeight - 160),
    })
    setGhostIdx(0)
  }, [suggestions, caret, suggestOn, focused])

  // Chính tả (debounce 350ms) — chỉ liệt kê trong trợ lý, KHÔNG gạch chân trong bài.
  //
  // Chia làm HAI BƯỚC vì suggestFix() tốn khoảng 150ms cho mỗi từ chưa có trong đệm:
  //   1. Dò từ sai (rẻ) rồi hiện danh sách ngay.
  //   2. Tìm gợi ý sửa từng từ một trong lúc trình duyệt rảnh.
  // Làm gộp một lượt như trước sẽ khóa main thread vài giây mỗi lần ngừng gõ.
  useEffect(() => {
    if (!spellEnabled) {
      setSpellList([])
      return
    }
    let alive = true
    const handle = setTimeout(() => {
      const uniq = [...new Set(tokenizeWords(content))]
      const bad = uniq.filter((t) => isMisspelled(t)).slice(0, 20)
      if (!alive) return

      // Bước 1: danh sách hiện ngay. Từ tiếng Việt không bao giờ có gợi ý tiếng Anh
      // nên đánh dấu xong luôn, không cần chờ.
      setSpellList(
        bad.map((w) => ({
          word: w,
          suggestions: [],
          foreign: isNonEnglish(w),
          pending: !isNonEnglish(w),
        })),
      )

      // Bước 2: rải việc tìm gợi ý ra từng nhịp rảnh
      const queue = bad.filter((w) => !isNonEnglish(w))
      let i = 0
      const step = () => {
        if (!alive || i >= queue.length) return
        const w = queue[i++]
        const fix = suggestFix(w, 3)
        if (!alive) return
        setSpellList((prev) =>
          prev.map((it) => (it.word === w ? { ...it, suggestions: fix, pending: false } : it)),
        )
        whenIdle(step)
      }
      if (queue.length) whenIdle(step)
    }, 350)
    return () => {
      alive = false
      clearTimeout(handle)
    }
  }, [content, spellEnabled, spellVersion])

  // Kiểm tra câu: luật OFFLINE (debounce ngắn) + LanguageTool (online, debounce 1.5s) rồi gộp lại.
  // checkLocalGrammar() quét lại toàn bài nên không chạy thẳng trong lúc gõ.
  useEffect(() => {
    if (!grammarEnabled || !content.trim()) {
      setGrammar([])
      setGrammarChecking(false)
      return
    }
    let alive = true
    setGrammarChecking(true)
    const fast = setTimeout(() => {
      if (alive) setGrammar(checkLocalGrammar(content))
    }, 250)
    const slow = setTimeout(async () => {
      const local = checkLocalGrammar(content)
      const remote = await checkGrammar(content)
      if (!alive) return
      setGrammar(mergeGrammar(local, remote))
      setGrammarChecking(false)
    }, 1500)
    return () => {
      alive = false
      clearTimeout(fast)
      clearTimeout(slow)
    }
  }, [content, grammarEnabled])

  const runGrammarNow = async () => {
    if (!content.trim() || grammarChecking) return
    setGrammarChecking(true)
    const local = checkLocalGrammar(content)
    const remote = await checkGrammar(content)
    setGrammar(mergeGrammar(local, remote))
    setGrammarChecking(false)
  }

  const grammarShown = useMemo(
    () => grammar.filter((m) => !skipped.has(`${m.offset}:${m.errorText}`)),
    [grammar, skipped],
  )

  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    if (pendingCaret.current != null) {
      const pos = pendingCaret.current
      ta.focus()
      ta.setSelectionRange(pos, pos)
      setCaret(pos)
      pendingCaret.current = null
    }
    // Sau khi bấm nút định dạng: chọn lại đúng đoạn vừa bọc để gõ đè được ngay
    if (pendingSel.current) {
      const { start, end } = pendingSel.current
      ta.focus()
      ta.setSelectionRange(start, end)
      setCaret(end)
      pendingSel.current = null
    }
  }, [content])

  const syncCaret = () => {
    if (taRef.current) setCaret(taRef.current.selectionStart)
  }
  // ---------- Thanh định dạng ----------
  // Bài viết lưu dạng VĂN BẢN THUẦN nên định dạng dùng ký hiệu Markdown:
  // **đậm** · *nghiêng* · _gạch chân_ · "- " danh sách · "1. " đánh số · "> " trích dẫn.
  const applyToSelection = (fn: (sel: string) => { text: string; start: number; end: number }) => {
    const ta = taRef.current
    if (!ta) return
    const s = ta.selectionStart
    const e = ta.selectionEnd
    const { text, start, end } = fn(content.slice(s, e))
    const next = content.slice(0, s) + text + content.slice(e)
    pendingSel.current = { start: s + start, end: s + end }
    setContent(next)
  }
  const wrapWith = (mark: string, placeholder: string) => {
    const ta = taRef.current
    if (!ta) return
    const s = ta.selectionStart
    const e = ta.selectionEnd
    const sel = content.slice(s, e)
    const m = mark.length
    // Dấu bọc nằm NGAY NGOÀI vùng chọn (vừa bấm xong, đang chọn phần bên trong)
    // -> bấm lần nữa là gỡ. Với "*" phải chắc đó không phải nửa của "**" (đậm).
    const italicInsideBold =
      mark === '*' && (content.slice(s - 2, s) === '**' || content.slice(e, e + 2) === '**')
    if (content.slice(s - m, s) === mark && content.slice(e, e + m) === mark && !italicInsideBold) {
      setContent(content.slice(0, s - m) + sel + content.slice(e + m))
      pendingSel.current = { start: s - m, end: e - m }
      return
    }
    applyToSelection((text) => {
      // Chính vùng chọn đang mang dấu bọc -> gỡ
      if (text.startsWith(mark) && text.endsWith(mark) && text.length > m * 2) {
        const inner = text.slice(m, -m)
        return { text: inner, start: 0, end: inner.length }
      }
      const body = text || placeholder
      return { text: `${mark}${body}${mark}`, start: m, end: m + body.length }
    })
  }
  const prefixLines = (make: (i: number) => string) =>
    applyToSelection((sel) => {
      const lines = (sel || '').split('\n')
      const out = lines
        .map((l, i) => {
          const bare = l.replace(/^(\s*)([-*]\s+|\d+\.\s+|>\s+)/, '$1')
          return bare.trim() ? bare.replace(/^(\s*)/, `$1${make(i)}`) : bare
        })
        .join('\n')
      return { text: out, start: 0, end: out.length }
    })

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
    if (composing.current || (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing) {
      return
    }
    const list = suggestions.slice(0, 5)
    if (e.key === 'Tab' && list.length > 0) {
      e.preventDefault()
      accept(list[ghost ? ghostIdx : 0])
      setGhost(null)
      return
    }
    if (!ghost || list.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setGhostIdx((i) => (i + 1) % list.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setGhostIdx((i) => (i - 1 + list.length) % list.length)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setGhost(null)
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
      const items = grammarShown
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
  const fixableCount = grammarShown.filter((m) => m.replacements.length > 0).length

  // Nội dung đã lưu lần cuối — để autosave biết có thay đổi hay không
  const lastSaved = useRef({
    title: writing?.title ?? '',
    topic: writing?.topic ?? '',
    content: writing?.content ?? '',
  })
  const savingRef = useRef(false) // chặn 2 lượt lưu song song (tránh tạo trùng bài)

  const save = async (e?: FormEvent, auto = false) => {
    e?.preventDefault()
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError(null)
    try {
      const wc = countWords(content)
      if (id) {
        await CloudApi.updateWriting(id, title, content, wc, topic)
      } else {
        const created = await CloudApi.createWriting(title, content, wc, topic)
        setId(created.id)
      }
      lastSaved.current = { title, topic, content }
      setSavedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      // Autosave lỗi (mất mạng…) thì im lặng, lần gõ tiếp theo sẽ thử lại
      if (!auto) setError(errText(err))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const dirty =
    title !== lastSaved.current.title ||
    topic !== lastSaved.current.topic ||
    content !== lastSaved.current.content

  // TỰ ĐỘNG LƯU NHÁP: ngừng gõ 2.5s và có thay đổi -> lưu ngầm
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    if (!dirty || (!title.trim() && !content.trim())) return
    const h = setTimeout(() => void saveRef.current(undefined, true), 2500)
    return () => clearTimeout(h)
  }, [title, topic, content, dirty])

  // Phím tắt định dạng gọi lại hàm mới nhất mà không phải gắn lại listener
  const fmtRef = useRef((k: string) => {
    if (k === 'b') wrapWith('**', 'đậm')
    else if (k === 'i') wrapWith('*', 'nghiêng')
    else wrapWith('_', 'gạch chân')
  })
  fmtRef.current = (k: string) => {
    if (k === 'b') wrapWith('**', 'đậm')
    else if (k === 'i') wrapWith('*', 'nghiêng')
    else wrapWith('_', 'gạch chân')
  }

  const exit = useCallback(() => {
    if (popView) {
      setPopView(false)
      return
    }
    if (narrow && panelOpen) {
      setPanelOpen(false)
      return
    }
    onBack()
  }, [popView, narrow, panelOpen, onBack])

  // Phím tắt: Ctrl+S lưu · Ctrl+J ẩn/hiện trợ lý · Esc thoát
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        void saveRef.current()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault()
        setPanelOpen((v) => !v)
        return
      }
      // Định dạng chỉ áp dụng khi con trỏ đang ở trong ô viết
      if ((e.ctrlKey || e.metaKey) && document.activeElement === taRef.current) {
        const k = e.key.toLowerCase()
        if (k === 'b' || k === 'i' || k === 'u') {
          e.preventDefault()
          fmtRef.current(k)
          return
        }
      }
      if (e.key === 'Escape') {
        // Đang gõ giữa bài thì Esc chỉ đóng bảng đang mở, không thoát đột ngột
        const inDoc = document.activeElement === taRef.current
        if (inDoc && !popView) return
        e.preventDefault()
        exit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exit, popView])

  const typeLabel: Record<Suggestion['type'], string> = {
    auto: 'gợi ý',
    nextword: 'từ tiếp theo',
    synonym: 'đồng nghĩa',
  }

  // ---------- Thống kê bài viết ----------
  const stats = useMemo(() => {
    const words = countWords(content)
    const sentences = (content.match(/[^.!?]+[.!?]+/g) ?? []).filter((s) => s.trim()).length
    const longWords = (content.match(/[A-Za-z]{7,}/g) ?? []).length
    const avg = sentences ? Math.round(words / sentences) : words
    const longPct = words ? longWords / words : 0
    const level =
      words < 30 ? '—' : avg >= 20 && longPct > 0.2 ? 'B2+' : avg >= 15 ? 'B1' : avg >= 10 ? 'A2' : 'A1'
    return {
      words,
      chars: content.length,
      sentences,
      avg,
      longWords,
      level,
      read: Math.max(1, Math.round(words / 200)),
      goalPct: Math.min(100, Math.round((words / 250) * 100)),
    }
  }, [content])

  const issueCount = spellList.length + grammarShown.length
  const saveClass = saving ? 'write-save is-saving' : dirty ? 'write-save is-dirty' : 'write-save'

  return (
    <form
      className={panelOpen ? 'write-ed' : 'write-ed is-collapsed'}
      onSubmit={save}
      style={
        {
          '--w-sheet': view.w,
          '--w-font': view.f,
          '--w-size': view.s,
          '--w-lh': view.l,
        } as React.CSSProperties
      }
    >
      {/* ------------------------------------------------------ Thanh tài liệu */}
      <header className="write-ed-bar">
        <div className="write-ed-bar-inner">
          <div className="write-ed-heading">
            <button
              type="button"
              className="write-ibtn write-ed-exit"
              onClick={onBack}
              title="Thoát (Esc)"
              aria-label="Thoát, về danh sách bài viết"
            >
              <Icon name="left" />
            </button>

            <div className="write-ed-title-block">
              <span className="write-ed-kicker">
                <Icon name="pen" /> Bài viết tiếng Anh
              </span>
              <div className="write-ed-title-line">
                <input
                  className="write-ed-title"
                  placeholder="Tiêu đề bài viết…"
                  aria-label="Tiêu đề bài viết"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <span className={saveClass} role="status" aria-live="polite">
                  <i />
                  <span>
                    {saving
                      ? 'Đang lưu…'
                      : dirty
                        ? 'Chưa lưu'
                        : savedAt
                          ? `Đã lưu ${savedAt}`
                          : 'Bản nháp'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <span className="write-spacer" />

          <span className="write-ed-tools" role="toolbar" aria-label="Công cụ tài liệu">
            <button
              type="button"
              className="write-ibtn write-theme-btn"
              onClick={toggle}
              title={theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
              aria-label="Đổi giao diện"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button
              type="button"
              className={popView ? 'write-ibtn write-view-btn is-active' : 'write-ibtn write-view-btn'}
              onClick={() => setPopView((v) => !v)}
              title="Tùy chọn hiển thị"
              aria-label="Tùy chọn hiển thị"
              aria-expanded={popView}
            >
              <Icon name="type" />
            </button>
            <button
              type="button"
              className={
                panelOpen
                  ? 'write-ibtn write-assistant-btn is-active'
                  : 'write-ibtn write-assistant-btn'
              }
              onClick={() => setPanelOpen((v) => !v)}
              title="Ẩn / hiện trợ lý (Ctrl+J)"
              aria-label="Ẩn hiện trợ lý"
              aria-expanded={panelOpen}
              aria-controls="writing-assistant"
            >
              <Icon name="sparkle" />
            </button>
            {onDelete && (
              <button
                type="button"
                className="write-btn write-btn-sm write-btn-danger write-btn-icon"
                onClick={onDelete}
                title="Xóa bài viết"
                aria-label="Xóa bài viết"
              >
                <Icon name="trash" />
              </button>
            )}
          </span>

          <button
            className="write-btn write-btn-primary write-ed-submit"
            type="submit"
            disabled={saving}
            title="Lưu (Ctrl+S)"
          >
            <Icon name="save" /> <span>Lưu bài</span>
          </button>
        </div>
      </header>

      {/* --------------------------------------------- Bảng tùy chọn hiển thị */}
      {popView && (
        <div className="write-pop" role="dialog" aria-label="Tùy chọn hiển thị">
          <div className="write-pop-title">Hiển thị</div>

          <div className="write-pop-row">
            <div className="write-pop-lab">
              <span>Chiều rộng vùng viết</span>
              <b>{WIDTHS.find(([v]) => v === view.w)?.[1] ?? 'Vừa'}</b>
            </div>
            <div className="write-seg">
              {WIDTHS.map(([val, name]) => (
                <button
                  type="button"
                  key={val}
                  className={view.w === val ? 'is-active' : ''}
                  onClick={() => setView((v) => ({ ...v, w: val }))}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="write-pop-row">
            <div className="write-pop-lab">
              <span>Kiểu chữ</span>
              <b>{FONTS.find(([v]) => v === view.f)?.[1] ?? 'Sans'}</b>
            </div>
            <div className="write-seg">
              {FONTS.map(([val, name, cls]) => (
                <button
                  type="button"
                  key={name}
                  className={view.f === val ? `${cls} is-active` : cls}
                  onClick={() => setView((v) => ({ ...v, f: val }))}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="write-pop-row">
            <div className="write-pop-lab">
              <span>Cỡ chữ</span>
              <b>{view.s}</b>
            </div>
            <div className="write-seg">
              {SIZES.map(([val, px]) => (
                <button
                  type="button"
                  key={val}
                  style={{ fontSize: px }}
                  className={view.s === val ? 'is-active' : ''}
                  onClick={() => setView((v) => ({ ...v, s: val }))}
                >
                  A
                </button>
              ))}
            </div>
          </div>

          <div className="write-pop-row">
            <div className="write-pop-lab">
              <span>Giãn dòng</span>
              <b>{view.l}</b>
            </div>
            <div className="write-seg">
              {LINES.map(([val, name]) => (
                <button
                  type="button"
                  key={val}
                  className={view.l === val ? 'is-active' : ''}
                  onClick={() => setView((v) => ({ ...v, l: val }))}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="write-pop-foot">
            <button
              type="button"
              className="write-btn write-btn-sm"
              onClick={() => setView(VIEW_DEFAULT)}
            >
              <Icon name="refresh" /> Mặc định
            </button>
            <span className="write-spacer" />
            <button
              type="button"
              className="write-btn write-btn-sm write-btn-ghost"
              onClick={() => setPopView(false)}
            >
              Xong
            </button>
          </div>
        </div>
      )}

      <div className="write-ed-body">
        {/* --------------------------------------------------- Vùng soạn thảo */}
        <div className="write-stage">
          <div className="write-sheet">
            <div className="write-sheet-head">
              <label className="write-prompt">
                <span className="write-prompt-label">
                  <Icon name="target" /> Chủ đề
                </span>
                <input
                  className="write-input"
                  placeholder="Chọn hoặc nhập chủ đề…"
                  aria-label="Chủ đề"
                  list="writing-topics"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <datalist id="writing-topics">
                  {TOPIC_OPTIONS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </label>

              <div className="write-sheet-stats" aria-label="Thống kê nhanh">
                <span>
                  <b>{stats.words}</b> từ
                </span>
                <i aria-hidden="true" />
                <span>
                  <b>{stats.chars}</b> ký tự
                </span>
                <i aria-hidden="true" />
                <span>{stats.read} phút đọc</span>
              </div>
            </div>

            {error && (
              <div className="write-alert" role="alert">
                {error}
              </div>
            )}

            <section className="write-canvas" aria-label="Trình soạn thảo">
              <div className="write-canvas-bar">
                <div className="write-fmt" role="toolbar" aria-label="Định dạng">
                  <button
                    type="button"
                    onClick={() => wrapWith('**', 'đậm')}
                    title="Đậm (Ctrl+B) — bọc **…**"
                    aria-label="Đậm"
                  >
                    <span className="write-fmt-txt">B</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => wrapWith('*', 'nghiêng')}
                    title="Nghiêng (Ctrl+I) — bọc *…*"
                    aria-label="Nghiêng"
                  >
                    <span className="write-fmt-txt is-i">I</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => wrapWith('_', 'gạch chân')}
                    title="Gạch chân (Ctrl+U) — bọc _…_"
                    aria-label="Gạch chân"
                  >
                    <span className="write-fmt-txt is-u">U</span>
                  </button>
                  <span className="write-fmt-sep" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => prefixLines(() => '- ')}
                    title="Danh sách chấm"
                    aria-label="Danh sách chấm"
                  >
                    {FMT_ICONS.bullet}
                  </button>
                  <button
                    type="button"
                    onClick={() => prefixLines((i) => `${i + 1}. `)}
                    title="Danh sách số"
                    aria-label="Danh sách số"
                  >
                    {FMT_ICONS.number}
                  </button>
                  <button
                    type="button"
                    onClick={() => prefixLines(() => '> ')}
                    title="Trích dẫn"
                    aria-label="Trích dẫn"
                  >
                    {FMT_ICONS.quote}
                  </button>
                </div>

                <span className="write-spacer" />

                <div className="write-goal" title={`${stats.goalPct}% mục tiêu 250 từ`}>
                  <span className="write-goal-copy">
                    <span>Mục tiêu</span>
                    <b>{stats.words}/250 từ</b>
                  </span>
                  <span className="write-goal-track" aria-hidden="true">
                    <i style={{ width: `${stats.goalPct}%` }} />
                  </span>
                </div>
              </div>

              <div className="write-doc">
                <textarea
                  ref={taRef}
                  className="write-paper write-textarea"
                  placeholder="Bắt đầu viết bằng tiếng Anh…"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  data-lpignore="true"
                  data-form-type="other"
                  name="write-content"
                  aria-label="Nội dung bài viết"
                  aria-autocomplete="list"
                  aria-controls={ghost && suggestions.length > 0 ? 'writing-suggestions' : undefined}
                  aria-activedescendant={
                    ghost && suggestions.length > 0
                      ? `writing-suggestion-${ghostIdx}`
                      : undefined
                  }
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    setCaret(e.target.selectionStart)
                  }}
                  onCompositionStart={() => {
                    composing.current = true
                  }}
                  onCompositionEnd={() => {
                    composing.current = false
                  }}
                  onKeyUp={syncCaret}
                  onClick={syncCaret}
                  onKeyDown={onKeyDown}
                  onScroll={() => setGhost(null)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false)
                    setTimeout(() => setGhost(null), 120)
                  }}
                />
              </div>

              <div className="write-canvas-foot">
                <span className={issueCount > 0 ? 'write-quality has-issues' : 'write-quality'}>
                  <Icon name={issueCount > 0 ? 'sparkle' : 'check'} />
                  {issueCount > 0
                    ? `${issueCount} điểm cần xem lại`
                    : 'Chưa thấy điểm cần xem lại'}
                </span>

                <div className="write-canvas-shortcuts" aria-label="Phím tắt">
                  <span>
                    <span className="write-kbd">Ctrl S</span> Lưu
                  </span>
                  <span>
                    <span className="write-kbd">Ctrl J</span> Trợ lý
                  </span>
                  <span>
                    <span className="write-kbd">Tab</span> Gợi ý
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ------------------------------------------------------ Trợ lý viết */}
        {panelOpen && (
          <aside className="write-panel" id="writing-assistant" aria-label="Trợ lý viết">
            <span className="write-grab" aria-hidden="true" />
            <div className="write-panel-head">
              <span className="write-panel-title">
                <span className="write-panel-icon">
                  <Icon name="sparkle" />
                </span>
                <span>
                  <b>Trợ lý viết</b>
                  <small>Phân tích trong khi bạn gõ</small>
                </span>
              </span>

              <span className={issueCount > 0 ? 'write-panel-status has-issues' : 'write-panel-status'}>
                {issueCount > 0 ? `${issueCount} lưu ý` : 'Sẵn sàng'}
              </span>

              <button
                type="button"
                className="write-ibtn write-panel-close"
                onClick={() => setPanelOpen(false)}
                aria-label="Đóng trợ lý"
              >
                <Icon name="x" />
              </button>
            </div>

            <div className="write-pn-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={pane === 'spell'}
                aria-controls="writing-assistant-pane"
                className={pane === 'spell' ? 'is-active' : ''}
                onClick={() => setPane('spell')}
              >
                Chính tả
                {spellList.length > 0 && <span className="write-pn-count">{spellList.length}</span>}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={pane === 'grammar'}
                aria-controls="writing-assistant-pane"
                className={pane === 'grammar' ? 'is-active' : ''}
                onClick={() => setPane('grammar')}
              >
                Câu
                {grammarShown.length > 0 && (
                  <span className="write-pn-count">{grammarShown.length}</span>
                )}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={pane === 'hint'}
                aria-controls="writing-assistant-pane"
                className={pane === 'hint' ? 'is-active' : ''}
                onClick={() => setPane('hint')}
              >
                Gợi ý
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={pane === 'stats'}
                aria-controls="writing-assistant-pane"
                className={pane === 'stats' ? 'is-active' : ''}
                onClick={() => setPane('stats')}
              >
                Thống kê
              </button>
            </div>

            <div className="write-pn-body" id="writing-assistant-pane" role="tabpanel">
              {/* ---------- Chính tả ---------- */}
              {pane === 'spell' &&
                (!spellEnabled ? (
                  <div className="write-off">
                    <Icon name="type" />
                    <b>Kiểm tra chính tả đang tắt</b>
                    <p>Bật lại trong Cài đặt để thấy từ sai được gạch chân ngay khi gõ.</p>
                  </div>
                ) : spellList.length === 0 ? (
                  <div className="write-off">
                    <Icon name="check" />
                    <b>Không còn lỗi chính tả</b>
                    <p>Toàn bộ từ trong bài đều nằm trong từ điển.</p>
                  </div>
                ) : (
                  spellList.map((item, i) => (
                    <div className="write-issue" key={item.word}>
                      <div className="write-issue-top">
                        <span
                          className={
                            item.foreign
                              ? 'write-badge write-badge-warn write-badge-dot'
                              : 'write-badge write-badge-err write-badge-dot'
                          }
                        >
                          {item.foreign ? 'Không phải tiếng Anh' : 'Sai chính tả'}
                        </span>
                        <span className="write-spacer" />
                        <span className="write-issue-kind">Lỗi {i + 1}</span>
                      </div>
                      <div className="write-issue-txt">
                        <span className="write-bad">{item.word}</span>
                      </div>
                      <div className="write-fix-row">
                        {item.pending ? (
                          <span className="write-issue-kind">Đang tìm gợi ý…</span>
                        ) : item.suggestions.length > 0 ? (
                          item.suggestions.map((sug) => (
                            <button
                              type="button"
                              key={sug}
                              className="write-fix"
                              onClick={() => fixWord(item.word, sug)}
                            >
                              {sug}
                            </button>
                          ))
                        ) : (
                          <span className="write-issue-kind">Không có gợi ý</span>
                        )}
                        <button
                          type="button"
                          className="write-skip"
                          title="Thêm vào từ điển cá nhân"
                          onClick={() => ignore(item.word)}
                        >
                          Bỏ qua
                        </button>
                      </div>
                    </div>
                  ))
                ))}

              {/* ---------- Câu / ngữ pháp ---------- */}
              {pane === 'grammar' &&
                (!grammarEnabled ? (
                  <div className="write-off">
                    <Icon name="target" />
                    <b>Kiểm tra câu đang tắt</b>
                    <p>Bật lại trong Cài đặt để nhận góp ý về ngữ pháp, văn phong và collocation.</p>
                  </div>
                ) : (
                  <>
                    {grammarShown.length === 0 ? (
                      <div className="write-off">
                        <Icon name={grammarChecking ? 'refresh' : 'check'} />
                        <b>{grammarChecking ? 'Đang kiểm tra…' : 'Chưa thấy lỗi câu nào'}</b>
                        <p>Ngữ pháp, văn phong, dùng từ và collocation đều được soi tự động.</p>
                      </div>
                    ) : (
                      grammarShown.map((m, idx) => (
                        <div className="write-issue" key={`${m.offset}-${idx}`}>
                          <div className="write-issue-top">
                            <span className="write-badge write-badge-accent write-badge-dot">
                              Câu
                            </span>
                            <span className="write-spacer" />
                            <span className="write-issue-kind">Câu {idx + 1}</span>
                          </div>
                          <div className="write-issue-txt">
                            <span className="write-bad">{m.errorText || '⚠'}</span>
                            {m.replacements.length > 0 && (
                              <>
                                {' → '}
                                <span className="write-good">{m.replacements[0]}</span>
                              </>
                            )}
                            {m.message && <> — {m.message}</>}
                          </div>
                          <div className="write-fix-row">
                            {m.replacements.length > 0 && (
                              <button
                                type="button"
                                className="write-fix"
                                onClick={() => applyGrammar(m, m.replacements[0])}
                              >
                                <Icon name="check" /> Áp dụng
                              </button>
                            )}
                            {m.replacements.slice(1, 3).map((rep) => (
                              <button
                                type="button"
                                key={rep}
                                className="write-fix"
                                onClick={() => applyGrammar(m, rep)}
                              >
                                {rep}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="write-skip"
                              onClick={() =>
                                setSkipped((s) => new Set(s).add(`${m.offset}:${m.errorText}`))
                              }
                            >
                              Bỏ qua
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="write-fix-row" style={{ marginTop: 4 }}>
                      {fixableCount > 1 && (
                        <button
                          type="button"
                          className="write-btn write-btn-sm"
                          onClick={fixAllGrammar}
                        >
                          <Icon name="check" /> Sửa tất cả ({fixableCount})
                        </button>
                      )}
                      <button
                        type="button"
                        className="write-btn write-btn-sm write-btn-block"
                        onClick={runGrammarNow}
                        disabled={grammarChecking || !content.trim()}
                      >
                        <Icon name="refresh" />{' '}
                        {grammarChecking ? 'Đang kiểm tra…' : 'Kiểm tra lại toàn bài'}
                      </button>
                    </div>
                  </>
                ))}

              {/* ---------- Gợi ý từ ---------- */}
              {pane === 'hint' &&
                (!suggestOn ? (
                  <div className="write-off">
                    <Icon name="sparkle" />
                    <b>Gợi ý từ đang tắt</b>
                    <p>
                      Bật để nhận gợi ý từ tiếp theo ngay khi bạn gõ. Nhấn{' '}
                      <span className="write-kbd">Tab</span> để chấp nhận gợi ý đầu tiên.
                    </p>
                    <div className="write-off-row">
                      <button
                        type="button"
                        className="write-btn write-btn-sm write-btn-primary"
                        onClick={() => {
                          localStorage.setItem('suggest_enabled', '1')
                          setSuggestOn(true)
                        }}
                      >
                        <Icon name="zap" /> Bật ngay
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="write-pn-note">
                      <b>Gợi ý đang bật</b>
                      Gõ tiếng Anh rồi dừng một nhịp — danh sách bên dưới đổi theo con trỏ.{' '}
                      <span className="write-kbd">Tab</span> chèn gợi ý đầu tiên.
                    </div>
                    {suggestions.length === 0 ? (
                      <p className="write-note">Chưa có gợi ý cho vị trí con trỏ hiện tại.</p>
                    ) : (
                      suggestions.map((s, i) => (
                        <button
                          type="button"
                          key={s.text + i}
                          className="write-sug"
                          onClick={() => accept(s)}
                        >
                          {s.text}
                          <small>{typeLabel[s.type]}</small>
                        </button>
                      ))
                    )}
                    <div className="write-off-row" style={{ justifyContent: 'flex-start' }}>
                      <button
                        type="button"
                        className="write-btn write-btn-sm write-btn-ghost"
                        onClick={() => {
                          localStorage.setItem('suggest_enabled', '0')
                          setSuggestOn(false)
                        }}
                      >
                        Tắt gợi ý
                      </button>
                    </div>
                  </>
                ))}

              {/* ---------- Thống kê ---------- */}
              {pane === 'stats' && (
                <>
                  <div className="write-kv">
                    <span>Số từ</span>
                    <b>{stats.words}</b>
                  </div>
                  <div className="write-kv">
                    <span>Ký tự</span>
                    <b>{stats.chars}</b>
                  </div>
                  <div className="write-kv">
                    <span>Số câu</span>
                    <b>{stats.sentences}</b>
                  </div>
                  <div className="write-kv">
                    <span>Độ dài TB câu</span>
                    <b>{stats.avg}</b>
                  </div>
                  <div className="write-kv">
                    <span>Từ dài (&gt;6 chữ)</span>
                    <b>{stats.longWords}</b>
                  </div>
                  <div className="write-kv">
                    <span>Trình độ ước lượng</span>
                    <b>{stats.level}</b>
                  </div>
                  <div className="write-kv">
                    <span>Thời gian đọc</span>
                    <b>{stats.read} phút</b>
                  </div>

                  <div className="write-goal">
                    <div className="write-goal-top">
                      <span>Mục tiêu 250 từ</span>
                      <b>{stats.goalPct}%</b>
                    </div>
                    <div className="write-bar">
                      <i style={{ width: `${stats.goalPct}%` }} />
                    </div>
                  </div>

                  <p className="write-note">
                    Trình độ ước lượng dựa trên độ dài câu và tỷ lệ từ dài — chỉ mang tính tham
                    khảo.
                  </p>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bảng gợi ý từ nổi ngay dưới con trỏ — Tab để nhận */}
      {ghost && suggestions.length > 0 && (
        <div
          className="write-ghost"
          id="writing-suggestions"
          style={{ left: ghost.left, top: ghost.top }}
          role="listbox"
        >
          <div className="write-ghost-head">Gợi ý từ tiếp theo</div>
          {suggestions.slice(0, 5).map((s, i) => (
            <button
              type="button"
              key={s.text + i}
              id={`writing-suggestion-${i}`}
              role="option"
              aria-selected={i === ghostIdx}
              className={i === ghostIdx ? 'write-ghost-item is-sel' : 'write-ghost-item'}
              onMouseDown={(e) => {
                e.preventDefault()
                accept(s)
                setGhost(null)
              }}
              onMouseEnter={() => setGhostIdx(i)}
            >
              {s.text}
              {i === ghostIdx && <span className="write-kbd">Tab</span>}
            </button>
          ))}
        </div>
      )}

      {/* Lớp phủ khi trợ lý mở dạng bottom sheet (mobile) */}
      {narrow && panelOpen && (
        <div className="write-scrim" onClick={() => setPanelOpen(false)} aria-hidden="true" />
      )}

      {/* Nút nổi mở trợ lý (mobile) */}
      {!panelOpen && (
        <button
          type="button"
          className="write-fab"
          onClick={() => setPanelOpen(true)}
          aria-label="Mở trợ lý viết"
        >
          <Icon name="sparkle" />
          <span className="write-fab-txt">Trợ lý</span>
          {issueCount > 0 && <span className="write-fab-count">{issueCount}</span>}
        </button>
      )}
    </form>
  )
}
