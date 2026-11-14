// Đọc một trang HTML song ngữ trong DATA/ thành nội dung cho trình đọc "Tài liệu".
//  - Chỉ giữ <main>: bỏ thanh điều hướng giữa các file, mục lục tĩnh và <script> của trang gốc
//    (trình đọc tự dựng lại: đổi ngôn ngữ, bộ lọc pattern, mục lục bám theo vị trí đọc).
//  - Mọi class được thêm tiền tố "dc-" để CSS của tài liệu và của app không đè lên nhau.
//  - Mục lục lấy từ tiêu đề có id: h2 là cấp 2; h3 có id và <section id> là cấp 3.
import type { DocMeta } from '../data/documents'

export interface DocTocItem {
  id: string
  level: 2 | 3
  /** Mục cấp 2 chứa mục này (chính nó nếu là cấp 2) */
  parent: string
  num: string
  vi: string
  en: string
}

export interface DocStats {
  parts: number
  directions: number
  patterns: number
  examples: number
}

export interface ParsedDoc {
  title: string
  titleEn: string
  html: string
  toc: DocTocItem[]
  stats: DocStats
}

const CLASS_PREFIX = 'dc-'
const cache = new Map<string, ParsedDoc>()

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()

/** Nhãn hai thứ tiếng của một tiêu đề: <span lang="vi"> + <span lang="en"> */
function labelOf(el: Element): { vi: string; en: string } {
  const vi = clean(el.querySelector(':scope > [lang="vi"]')?.textContent)
  const en = clean(el.querySelector(':scope > [lang="en"]')?.textContent)
  if (!vi && !en) {
    const text = clean(el.textContent)
    return { vi: text, en: text }
  }
  return { vi: vi || en, en: en || vi }
}

/** Tách số thứ tự đầu tiêu đề: "1. Công thức…" → ["1", "Công thức…"] */
function splitNum(text: string): [string, string] {
  const m = /^(\d+(?:\.\d+)*)\.?\s+(.*)$/.exec(text)
  return m ? [m[1], m[2]] : ['', text]
}

/**
 * Gom phần có bảng pattern (từ thanh lọc đến hết mục chứa bảng pattern cuối cùng) vào
 * một khối riêng, để thanh lọc chỉ bám trên đầu trong vùng còn dùng tới nó.
 */
function wrapPatternZone(doc: Document, main: Element) {
  const filters = main.querySelector(`:scope > .${CLASS_PREFIX}filters`)
  const rows = main.querySelectorAll(`.${CLASS_PREFIX}pat`)
  if (!filters || rows.length === 0) return
  const kids = Array.from(main.children)
  const start = kids.indexOf(filters)
  const lastRow = rows[rows.length - 1]
  const lastTop = kids.findIndex((k) => k.contains(lastRow))
  if (start < 0 || lastTop < start) return
  let end = kids.findIndex((k, i) => i > lastTop && k.tagName === 'H2')
  if (end < 0) end = kids.length
  const zone = doc.createElement('div')
  zone.className = `${CLASS_PREFIX}patzone`
  main.insertBefore(zone, filters)
  for (const k of kids.slice(start, end)) zone.appendChild(k)
}

export function parseDocument(meta: DocMeta): ParsedDoc {
  const hit = cache.get(meta.id)
  if (hit) return hit

  const doc = new DOMParser().parseFromString(meta.raw, 'text/html')
  const main = doc.querySelector('main') ?? doc.body
  main.querySelectorAll('script, style, link, .colbar').forEach((n) => n.remove())

  const h1 = main.querySelector('h1')
  const heading = h1 ? labelOf(h1) : { vi: clean(doc.title), en: clean(doc.title) }
  h1?.remove()

  main.querySelectorAll('[class]').forEach((el) => {
    const names = Array.from(el.classList).map((c) => CLASS_PREFIX + c)
    el.setAttribute('class', names.join(' '))
  })
  main.querySelectorAll('button:not([type])').forEach((b) => b.setAttribute('type', 'button'))
  wrapPatternZone(doc, main)

  const toc: DocTocItem[] = []
  let parent = ''
  main.querySelectorAll('h2[id], h3[id], section[id]').forEach((el) => {
    if (el.tagName === 'H2') {
      parent = el.id
      const { vi, en } = labelOf(el)
      const [num, viText] = splitNum(vi)
      toc.push({ id: el.id, level: 2, parent, num, vi: viText, en: splitNum(en)[1] })
      return
    }
    const title = el.tagName === 'SECTION' ? el.querySelector('h3') : el
    if (!title) return
    const num = clean(el.querySelector(`.${CLASS_PREFIX}gnum, .${CLASS_PREFIX}num`)?.textContent)
    const { vi, en } = labelOf(title)
    toc.push({ id: el.id, level: 3, parent: parent || el.id, num, vi, en })
  })

  const parsed: ParsedDoc = {
    title: heading.vi,
    titleEn: heading.en,
    html: main.innerHTML,
    toc,
    stats: {
      parts: main.querySelectorAll('h2').length,
      directions: main.querySelectorAll(`section.${CLASS_PREFIX}dir`).length,
      patterns: main.querySelectorAll(`.${CLASS_PREFIX}pat`).length,
      examples: main.querySelectorAll(`.${CLASS_PREFIX}idea`).length,
    },
  }
  cache.set(meta.id, parsed)
  return parsed
}

// ------------------------------------------------------------- Vị trí đọc
// Lưu theo máy (localStorage): mục đang đọc + phần trăm đã cuộn của từng tài liệu.
export interface DocProgress {
  section: string
  pct: number
  at: number
}

const PROGRESS_KEY = 'docs_progress_v1'

export function readProgress(): Record<string, DocProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (raw) return JSON.parse(raw) as Record<string, DocProgress>
  } catch {
    /* bộ nhớ bị chặn hoặc dữ liệu hỏng — coi như chưa đọc */
  }
  return {}
}

export function saveProgress(docId: string, progress: DocProgress) {
  try {
    const all = readProgress()
    all[docId] = progress
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all))
  } catch {
    /* không lưu được thì thôi */
  }
}
