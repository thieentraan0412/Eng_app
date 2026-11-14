// Trang "Tài liệu" — thư viện tài liệu song ngữ + trình đọc.
//  - Thư viện: thẻ từng tài liệu, các phần chính (bấm để mở đúng phần), tiến độ đọc.
//  - Trình đọc: Song ngữ / Tiếng Việt / English, mục lục bám theo vị trí đọc, bộ lọc pattern
//    của tài liệu, tìm trong tài liệu (Ctrl+F), nhớ chỗ đang đọc để lần sau đọc tiếp.
// Nội dung nằm trong cây DOM của app (không dùng iframe) nên bôi chữ để dịch / lưu từ
// vẫn chạy như ở trang Đọc. Dữ liệu: src/data/documents.ts · src/services/docContent.ts
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react'
import { createPortal, flushSync } from 'react-dom'
import Icon from '../components/Icon'
import { DOCUMENTS, findDocument, type DocMeta } from '../data/documents'
import {
  parseDocument,
  readProgress,
  saveProgress,
  type DocStats,
  type DocTocItem,
  type ParsedDoc,
} from '../services/docContent'
import {
  buildIndex,
  clearMatches,
  findRanges,
  paintMatches,
  type DocSearchIndex,
} from '../services/docSearch'
import '../styles/documents.css'

type LangMode = 'both' | 'vi' | 'en'

const LANG_KEY = 'docs_lang'
const OPEN_KEY = 'docs_open'
const MAX_HITS = 500

const LANG_OPTIONS: { v: LangMode; label: string; short: string; title: string }[] = [
  { v: 'both', label: 'Song ngữ', short: 'VI+EN', title: 'Hiện song song tiếng Việt và tiếng Anh' },
  { v: 'vi', label: 'Tiếng Việt', short: 'VI', title: 'Chỉ hiện tiếng Việt' },
  { v: 'en', label: 'English', short: 'EN', title: 'Chỉ hiện tiếng Anh' },
]

// localStorage có thể bị chặn (cửa sổ riêng tư…) — mọi lần đọc/ghi đều bọc try/catch
function storeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function storeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* bỏ qua */
  }
}

function readLang(): LangMode {
  const v = storeGet(LANG_KEY)
  return v === 'vi' || v === 'en' ? v : 'both'
}

const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Nhãn đầy đủ của một mục: "3. 12 hướng phát triển ý › 1. Chính phủ" */
function placeLabel(toc: DocTocItem[], id: string | undefined): string {
  const item = toc.find((t) => t.id === id)
  if (!item) return ''
  const own = item.num ? `${item.num}. ${item.vi}` : item.vi
  if (item.level === 2) return own
  const parent = toc.find((t) => t.id === item.parent)
  // Mục con đánh số kiểu 2.1 đã tự nói nó thuộc phần nào
  if (!parent || item.num.includes('.')) return own
  return `${parent.num}. ${parent.vi} › ${own}`
}

function StatsList({ stats }: { stats: DocStats }) {
  const items: [number, string][] = [
    [stats.parts, 'phần'],
    [stats.directions, 'hướng phát triển ý'],
    [stats.patterns, 'collocation & pattern'],
    [stats.examples, 'câu mẫu'],
  ]
  return (
    <ul className="doc-stats">
      {items
        .filter(([n]) => n > 0)
        .map(([n, label]) => (
          <li key={label}>
            <b>{n}</b>
            {label}
          </li>
        ))}
    </ul>
  )
}

// ================================================================== Trang
interface OpenState {
  id: string
  /** undefined = đọc tiếp chỗ cũ · null = từ đầu · id = mở đúng mục */
  at?: string | null
}

export default function DocumentsPage() {
  const [open, setOpen] = useState<OpenState | null>(() => {
    const id = storeGet(OPEN_KEY)
    return findDocument(id) ? { id: id as string } : null
  })
  const meta = findDocument(open?.id)

  const openDoc = (id: string, at?: string | null) => {
    storeSet(OPEN_KEY, id)
    setOpen({ id, at })
  }
  const backToLibrary = () => {
    storeSet(OPEN_KEY, null)
    setOpen(null)
  }

  if (meta && open) return <DocReader key={meta.id} meta={meta} at={open.at} onBack={backToLibrary} />
  return <DocLibrary onOpen={openDoc} />
}

// ================================================================== Thư viện
function DocLibrary({ onOpen }: { onOpen: (id: string, at?: string | null) => void }) {
  const docs = useMemo(() => DOCUMENTS.map((meta) => ({ meta, parsed: parseDocument(meta) })), [])
  const progress = useMemo(readProgress, [])

  useLayoutEffect(() => {
    // Khung cuộn dùng chung giữa các trang: về đầu khi vào thư viện
    document.querySelector('.content')?.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="page doc-lib">
      <header className="doc-lib-head">
        <h1>Tài liệu</h1>
        <p>
          Tài liệu học song ngữ Việt – Anh, đọc được cả trên app lẫn web. Đổi Song ngữ / Tiếng Việt /
          English, tìm nhanh bằng Ctrl+F và đọc tiếp đúng chỗ đã dừng.
        </p>
      </header>

      <ul className="doc-list">
        {docs.map(({ meta, parsed }) => {
          const p = progress[meta.id]
          const pct = p ? Math.max(1, Math.min(100, Math.round(p.pct))) : 0
          const place = p ? placeLabel(parsed.toc, p.section) : ''
          return (
            <li key={meta.id} className="doc-card">
              <button
                type="button"
                className="doc-cover"
                onClick={() => onOpen(meta.id)}
                tabIndex={-1}
                aria-hidden="true"
              >
                <span className="doc-cover-page">
                  <i />
                  <i />
                </span>
                <span className="doc-cover-tag">VI · EN</span>
              </button>

              <div className="doc-card-main">
                <span className="doc-eyebrow">{meta.eyebrow}</span>
                <h2 className="doc-card-title">
                  <button type="button" onClick={() => onOpen(meta.id)}>
                    {parsed.title}
                  </button>
                </h2>
                <p className="doc-card-en" lang="en">
                  {parsed.titleEn}
                </p>
                <p className="doc-card-sum">{meta.summary}</p>
                <StatsList stats={parsed.stats} />
                <div className="doc-parts" aria-label="Mở nhanh một phần">
                  {parsed.toc
                    .filter((t) => t.level === 2)
                    .map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        className="doc-part"
                        onClick={() => onOpen(meta.id, t.id)}
                        title={`Mở phần ${t.num}. ${t.vi}`}
                      >
                        {t.num && <span>{t.num}</span>}
                        {t.vi}
                      </button>
                    ))}
                </div>
              </div>

              <div className="doc-card-side">
                {p ? (
                  <>
                    <div className="doc-prog">
                      <div className="doc-prog-top">
                        <span>Đã đọc</span>
                        <b>{pct}%</b>
                      </div>
                      <div className="doc-prog-bar">
                        <i style={{ width: `${pct}%` }} />
                      </div>
                      {place && <small title={place}>Đang ở: {place}</small>}
                    </div>
                    <button type="button" className="doc-btn doc-btn-primary" onClick={() => onOpen(meta.id)}>
                      Đọc tiếp <Icon name="right" />
                    </button>
                    <button type="button" className="doc-btn doc-btn-ghost" onClick={() => onOpen(meta.id, null)}>
                      Đọc từ đầu
                    </button>
                  </>
                ) : (
                  <button type="button" className="doc-btn doc-btn-primary" onClick={() => onOpen(meta.id)}>
                    Bắt đầu đọc <Icon name="right" />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ================================================================== Trình đọc
// Nội dung tĩnh: chỉ gắn một lần. Bộ lọc, tô sáng… thao tác thẳng trên DOM này.
const DocBody = memo(function DocBody({ html, bodyRef }: { html: string; bodyRef: RefObject<HTMLDivElement> }) {
  return <div className="doc-body" ref={bodyRef} dangerouslySetInnerHTML={{ __html: html }} />
})

interface ReaderProps {
  meta: DocMeta
  at?: string | null
  onBack: () => void
}

function DocReader({ meta, at, onBack }: ReaderProps) {
  const parsed: ParsedDoc = useMemo(() => parseDocument(meta), [meta])
  const toc = parsed.toc

  const [lang, setLang] = useState<LangMode>(readLang)
  const [level, setLevel] = useState('all')
  const [skill, setSkill] = useState('all')
  const [active, setActive] = useState(toc[0]?.id ?? '')
  const [tocOpen, setTocOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<Range[]>([])
  const [hit, setHit] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const tocRef = useRef<HTMLElement>(null)
  const progressRef = useRef<HTMLElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const scrollerRef = useRef<HTMLElement | null>(null)
  const indexRef = useRef<DocSearchIndex | null>(null)
  const placeRef = useRef({ section: '', pct: 0 })

  // ---------- Khoảng bị che bởi các thanh dính phía trên (thanh công cụ, nhãn cột, bộ lọc)
  const stickyOffset = useCallback((el: Element | null) => {
    const root = rootRef.current
    if (!root) return 0
    let off = barRef.current?.offsetHeight ?? 0
    const colbar = root.querySelector<HTMLElement>('.doc-colbar')
    if (colbar && getComputedStyle(colbar).display !== 'none') off += colbar.offsetHeight
    const zone = el?.closest('.dc-patzone')
    const filters = zone?.querySelector<HTMLElement>(':scope > .dc-filters')
    if (filters && getComputedStyle(filters).position === 'sticky') off += filters.offsetHeight
    return off + 12
  }, [])

  const findTarget = useCallback(
    (id: string) => bodyRef.current?.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`) ?? null,
    [],
  )

  const scrollToId = useCallback(
    (id: string, smooth = true) => {
      const sc = scrollerRef.current
      const el = findTarget(id)
      if (!sc || !el) return
      const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - stickyOffset(el)
      sc.scrollTo({ top: Math.max(0, top), behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' })
      setActive(id)
    },
    [findTarget, stickyOffset],
  )

  // ---------- Biến CSS cho các lớp dính:
  //  --doc-bar-h: chiều cao thanh công cụ (nhãn cột, bộ lọc, mục lục dính ngay dưới nó)
  //  --doc-stick: Chrome tính `top` của sticky từ mép padding của khung cuộn, mà .content
  //               có padding-top → bù âm đúng bằng padding để thanh dính sát mép trên.
  useLayoutEffect(() => {
    const bar = barRef.current
    const root = rootRef.current
    if (!bar || !root) return
    const sc = root.closest<HTMLElement>('.content')
    const apply = () => {
      root.style.setProperty('--doc-bar-h', `${bar.offsetHeight}px`)
      const pad = sc ? parseFloat(getComputedStyle(sc).paddingTop) || 0 : 0
      root.style.setProperty('--doc-stick', `${-pad}px`)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(bar)
    if (sc) ro.observe(sc)
    return () => ro.disconnect()
  }, [])

  // ---------- Vị trí mở: mục được chọn / chỗ đọc lần trước / đầu trang
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const sc = (root.closest('.content') as HTMLElement | null) ?? (document.scrollingElement as HTMLElement)
    scrollerRef.current = sc
    const target = at === undefined ? readProgress()[meta.id]?.section : at
    if (!target || !findTarget(target)) {
      sc.scrollTop = 0
      return
    }
    scrollToId(target, false)
    // Phông chữ nạp xong có thể làm phần phía trên dài ra và đẩy lệch mục vừa mở:
    // căn lại vài lần trong lúc đầu, trừ khi người dùng đã tự cuộn / bấm.
    let touched = false
    let cancelled = false
    const mark = () => {
      touched = true
    }
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
    events.forEach((ev) => window.addEventListener(ev, mark, { capture: true, passive: true }))
    const realign = () => {
      if (!touched && !cancelled) scrollToId(target, false)
    }
    void document.fonts?.ready.then(realign)
    const timers = [window.setTimeout(realign, 350), window.setTimeout(realign, 1200)]
    return () => {
      cancelled = true
      timers.forEach((t) => window.clearTimeout(t))
      events.forEach((ev) => window.removeEventListener(ev, mark, { capture: true }))
    }
    // chỉ chạy lúc mở tài liệu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- Theo dõi cuộn: mục đang đọc, % đã đọc, lưu chỗ đọc
  useEffect(() => {
    const sc = scrollerRef.current
    if (!sc) return
    const targets = toc
      .map((t) => ({ id: t.id, el: findTarget(t.id) }))
      .filter((t): t is { id: string; el: HTMLElement } => t.el !== null)
      .map((t) => ({ ...t, inZone: Boolean(t.el.closest('.dc-patzone')) }))

    let raf = 0
    let saveTimer = 0
    const save = () => {
      window.clearTimeout(saveTimer)
      saveTimer = 0
      saveProgress(meta.id, { ...placeRef.current, at: Date.now() })
    }
    const measure = () => {
      raf = 0
      const top = sc.getBoundingClientRect().top
      const baseOff = stickyOffset(null)
      const zoneEl = targets.find((t) => t.inZone)?.el
      const zoneOff = zoneEl ? stickyOffset(zoneEl) : baseOff
      const max = sc.scrollHeight - sc.clientHeight
      const ratio = max > 0 ? sc.scrollTop / max : 1
      // reached = mục cuối cùng đã cuộn tới ('' khi còn ở phần mở đầu, trước mục 1)
      let reached = ''
      if (ratio > 0.995 && targets.length) reached = targets[targets.length - 1].id
      else
        for (const t of targets) {
          const y = t.el.getBoundingClientRect().top - top - (t.inZone ? zoneOff : baseOff)
          if (y <= 24) reached = t.id
          else break
        }
      // Thanh tiến độ cập nhật thẳng trên DOM, không render lại cả trình đọc mỗi khung hình
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio})`
      setActive(reached || targets[0]?.id || '')
      placeRef.current = { section: reached, pct: Math.round(ratio * 1000) / 10 }
    }
    // Chỉ lưu chỗ đọc khi người dùng thật sự cuộn (mở ra rồi thoát ngay thì không tính)
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(save, 600)
    }
    const onResize = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    sc.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      sc.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (raf) cancelAnimationFrame(raf)
      if (saveTimer) save()
    }
  }, [toc, meta.id, findTarget, stickyOffset])

  // ---------- Bộ lọc mức / kỹ năng của bảng pattern (nút nằm sẵn trong nội dung)
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    body.querySelectorAll<HTMLElement>('.dc-seg[data-filter]').forEach((seg) => {
      const value = seg.dataset.filter === 'level' ? level : skill
      seg.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
        b.setAttribute('aria-pressed', String((b.dataset.v ?? 'all') === value))
      })
    })
    const rowShown = (r: HTMLElement) =>
      (level === 'all' || r.dataset.level === level) && (skill === 'all' || (r.dataset.skill ?? '').includes(skill))
    let shown = 0
    body.querySelectorAll<HTMLElement>('.dc-grp').forEach((g) => {
      const rows = Array.from(g.querySelectorAll<HTMLElement>('.dc-pat'))
      const visible = rows.filter((r) => {
        r.classList.remove('dc-first-visible')
        return rowShown(r)
      })
      const empty = visible.length === 0
      g.classList.toggle('dc-is-empty', empty)
      visible[0]?.classList.add('dc-first-visible')
      shown += visible.length
      // Nhóm không có tiêu đề riêng (trong 12 hướng): ẩn luôn nhãn ngay phía trên nó
      const label = g.previousElementSibling
      if (label?.classList.contains('dc-sub') && !g.querySelector('.dc-grp-h')) {
        label.classList.toggle('dc-is-empty', empty)
      }
    })
    const count = body.querySelector('.dc-fcount')
    if (count) count.textContent = `${shown} / ${body.querySelectorAll('.dc-pat').length} mục`
    indexRef.current = null
  }, [level, skill])

  const onBodyClick = (e: ReactMouseEvent) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('.dc-seg[data-filter] button')
    const seg = btn?.closest<HTMLElement>('.dc-seg[data-filter]')
    if (!btn || !seg) return
    const v = btn.dataset.v ?? 'all'
    if (seg.dataset.filter === 'level') setLevel(v)
    else if (seg.dataset.filter === 'skill') setSkill(v)
  }

  // ---------- Đổi ngôn ngữ: giữ nguyên đoạn đang đọc ở đúng chỗ trên màn hình
  const changeLang = (mode: LangMode) => {
    if (mode === lang) return
    storeSet(LANG_KEY, mode)
    const sc = scrollerRef.current
    const body = bodyRef.current
    let anchor: Element | null = null
    let before = 0
    if (sc && body) {
      const box = body.getBoundingClientRect()
      // Mép dưới của các lớp đang dính (thanh công cụ, nhãn cột, bộ lọc) — dò ngay dưới đó
      let y = barRef.current?.getBoundingClientRect().bottom ?? sc.getBoundingClientRect().top
      rootRef.current?.querySelectorAll<HTMLElement>('.doc-colbar, .dc-filters').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.height && r.top <= y + 1 && getComputedStyle(el).position === 'sticky') y = Math.max(y, r.bottom)
      })
      y += 4
      if (box.top < y) {
        const hitEl = document.elementFromPoint(box.left + 24, y)
        anchor = hitEl?.closest('.dc-pair, h2, h3, .dc-sub, .dc-hint, .dc-bi') ?? null
        if (anchor && body.contains(anchor)) before = anchor.getBoundingClientRect().top
        else anchor = null
      }
    }
    indexRef.current = null
    flushSync(() => setLang(mode))
    if (anchor && sc) sc.scrollTop += anchor.getBoundingClientRect().top - before
  }

  // ---------- Tìm trong tài liệu
  useEffect(() => {
    const body = bodyRef.current
    const sc = scrollerRef.current
    if (!body) return
    if (query.trim().length < 2) {
      setHits([])
      setHit(0)
      return
    }
    const timer = window.setTimeout(() => {
      if (!indexRef.current) indexRef.current = buildIndex(body)
      const ranges = findRanges(indexRef.current, query, MAX_HITS)
      // Bắt đầu từ kết quả đầu tiên tính từ chỗ đang đọc, không nhảy ngược về đầu
      let first = 0
      if (sc && ranges.length) {
        const y = sc.getBoundingClientRect().top + stickyOffset(null)
        first = Math.max(
          0,
          ranges.findIndex((r) => r.getBoundingClientRect().top >= y),
        )
      }
      setHits(ranges)
      setHit(first)
    }, 160)
    return () => window.clearTimeout(timer)
  }, [query, lang, level, skill, stickyOffset])

  useEffect(() => {
    paintMatches(hits, hit)
    const range = hits[hit]
    const sc = scrollerRef.current
    if (!range || !sc) return
    const rect = range.getBoundingClientRect()
    const box = sc.getBoundingClientRect()
    const off = stickyOffset(range.startContainer.parentElement)
    if (rect.top < box.top + off || rect.bottom > box.bottom - 24) {
      const goal = off + (sc.clientHeight - off) / 2
      sc.scrollTo({ top: sc.scrollTop + rect.top - box.top - goal })
    }
  }, [hits, hit, stickyOffset])

  useEffect(() => () => clearMatches(), [])

  const step = (dir: 1 | -1) => {
    if (hits.length) setHit((i) => (i + dir + hits.length) % hits.length)
  }

  const onFindKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      step(e.shiftKey ? -1 : 1)
    } else if (e.key === 'Escape') {
      setQuery('')
      e.currentTarget.blur()
    }
  }

  // Ctrl+F / ⌘F: tìm trong tài liệu (Electron không có ô tìm của trình duyệt)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ---------- Mục lục
  useEffect(() => {
    if (!tocOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTocOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tocOpen])

  // Giữ mục đang đọc trong tầm nhìn của cột mục lục (chỉ cuộn cột này, không đụng trang)
  useEffect(() => {
    const nav = tocRef.current
    const item = nav?.querySelector<HTMLElement>('.doc-toc-link.is-active')
    if (!nav || !item || nav.scrollHeight <= nav.clientHeight) return
    const top = item.offsetTop - nav.offsetTop
    if (top < nav.scrollTop + 8 || top + item.offsetHeight > nav.scrollTop + nav.clientHeight - 8) {
      nav.scrollTop = top - nav.clientHeight / 2
    }
  }, [active])

  const activeItem = toc.find((t) => t.id === active)
  const activeParent = activeItem?.parent ?? ''
  const label = (t: DocTocItem) => (lang === 'en' ? t.en : t.vi)

  const renderToc = (expandAll: boolean, onPick?: () => void) => (
    <ol className="doc-toc-list">
      {toc
        .filter((t) => t.level === 2)
        .map((h) => {
          const kids = toc.filter((t) => t.level === 3 && t.parent === h.id)
          const current = activeParent === h.id
          return (
            <li key={h.id}>
              <button
                type="button"
                className={[
                  'doc-toc-link',
                  current ? 'is-current' : '',
                  active === h.id ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={active === h.id ? 'location' : undefined}
                onClick={() => {
                  onPick?.()
                  scrollToId(h.id)
                }}
              >
                <span className="doc-toc-num">{h.num}</span>
                <span>{label(h)}</span>
              </button>
              {kids.length > 0 && (expandAll || current) && (
                <ol>
                  {kids.map((k) => (
                    <li key={k.id}>
                      <button
                        type="button"
                        className={active === k.id ? 'doc-toc-link doc-toc-sub is-active' : 'doc-toc-link doc-toc-sub'}
                        aria-current={active === k.id ? 'location' : undefined}
                        onClick={() => {
                          onPick?.()
                          scrollToId(k.id)
                        }}
                      >
                        <span className="doc-toc-num">{k.num}</span>
                        <span>{label(k)}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          )
        })}
    </ol>
  )

  const parentItem = toc.find((t) => t.id === activeParent)
  const where = [parentItem, activeItem?.level === 3 ? activeItem : undefined]
    .filter((t): t is DocTocItem => Boolean(t))
    .map((t) => `${t.num ? `${t.num}. ` : ''}${label(t)}`)
    .join(' › ')
  const queryReady = query.trim().length >= 2

  return (
    <div className="page page-wide doc-page">
      <div
        className="doc-reader"
        ref={rootRef}
        data-lang={lang === 'both' ? undefined : lang}
        data-level={level === 'all' ? undefined : level}
        data-skill={skill === 'all' ? undefined : skill}
      >
        <div className="doc-bar" ref={barRef}>
          <button type="button" className="doc-back" onClick={onBack} title="Về danh sách tài liệu">
            <Icon name="left" />
            <span>Tài liệu</span>
          </button>
          <div className="doc-bar-title">
            <b>{lang === 'en' ? parsed.titleEn : parsed.title}</b>
            {where && <small>{where}</small>}
          </div>

          <label className="doc-find">
            <Icon name="search" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="Tìm trong tài liệu…"
              title="Tìm trong tài liệu (Ctrl+F) — không cần gõ dấu"
              aria-label="Tìm trong tài liệu"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onFindKey}
            />
            {queryReady && (
              <span className="doc-find-count" aria-live="polite">
                {hits.length ? `${hit + 1}/${hits.length}${hits.length >= MAX_HITS ? '+' : ''}` : 'Không thấy'}
              </span>
            )}
            {hits.length > 1 && (
              <>
                <button type="button" className="doc-find-btn" onClick={() => step(-1)} aria-label="Kết quả trước" title="Kết quả trước (Shift+Enter)">
                  <Icon name="down" className="doc-flip" />
                </button>
                <button type="button" className="doc-find-btn" onClick={() => step(1)} aria-label="Kết quả sau" title="Kết quả sau (Enter)">
                  <Icon name="down" />
                </button>
              </>
            )}
          </label>

          <div className="doc-seg" role="group" aria-label="Ngôn ngữ hiển thị">
            {LANG_OPTIONS.map((o) => (
              <button
                type="button"
                key={o.v}
                aria-pressed={lang === o.v}
                title={o.title}
                onClick={() => changeLang(o.v)}
              >
                <span className="doc-seg-full">{o.label}</span>
                <span className="doc-seg-short">{o.short}</span>
              </button>
            ))}
          </div>

          <button type="button" className="doc-toc-btn" onClick={() => setTocOpen(true)} aria-haspopup="dialog">
            <Icon name="menu" />
            <span>Mục lục</span>
          </button>

          <div className="doc-progress" aria-hidden="true">
            <i ref={progressRef} />
          </div>
        </div>

        <div className="doc-layout">
          <nav className="doc-toc" ref={tocRef} aria-label="Mục lục">
            <p className="doc-toc-label">Mục lục</p>
            {renderToc(false)}
          </nav>

          <article className="doc-main" onClick={onBodyClick}>
            <header className="doc-hero">
              <span className="doc-eyebrow">{meta.eyebrow} · Song ngữ Việt – Anh</span>
              {lang === 'en' ? (
                <h1 className="doc-title" lang="en">
                  {parsed.titleEn}
                </h1>
              ) : (
                <h1 className="doc-title">{parsed.title}</h1>
              )}
              {lang === 'both' && (
                <p className="doc-title-en" lang="en">
                  {parsed.titleEn}
                </p>
              )}
              <StatsList stats={parsed.stats} />
            </header>

            {lang === 'both' && (
              <div className="doc-colbar" aria-hidden="true">
                <span>Tiếng Việt</span>
                <span>English</span>
              </div>
            )}

            <DocBody html={parsed.html} bodyRef={bodyRef} />

            <footer className="doc-end">
              <span>Hết tài liệu.</span>
              <div>
                <button
                  type="button"
                  className="doc-btn doc-btn-ghost"
                  onClick={() => scrollerRef.current?.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' })}
                >
                  Lên đầu trang
                </button>
                <button type="button" className="doc-btn" onClick={onBack}>
                  <Icon name="left" /> Về danh sách tài liệu
                </button>
              </div>
            </footer>
          </article>
        </div>
      </div>

      {tocOpen &&
        createPortal(
          <div className="doc-sheet-wrap" onClick={() => setTocOpen(false)}>
            <div
              className="doc-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Mục lục"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="doc-sheet-head">
                <b>Mục lục</b>
                <button type="button" className="doc-find-btn" onClick={() => setTocOpen(false)} aria-label="Đóng mục lục">
                  <Icon name="x" />
                </button>
              </div>
              <nav className="doc-sheet-body" aria-label="Mục lục">
                {renderToc(true, () => setTocOpen(false))}
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
