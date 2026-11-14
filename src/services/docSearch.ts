// Tìm chữ trong trình đọc "Tài liệu" (Electron không có Ctrl+F sẵn như trình duyệt).
//  - Không phân biệt hoa/thường và dấu tiếng Việt: gõ "chinh phu" vẫn ra "Chính phủ".
//  - Chỉ tìm phần đang hiện: cột ngôn ngữ đang ẩn, dòng pattern bị lọc thì bỏ qua.
//  - Tô sáng bằng CSS Custom Highlight API, không chèn thẻ vào nội dung.

// Khối mà một kết quả không được vắt qua (tránh nối đuôi cột Việt với đầu cột Anh)
const BLOCK =
  'div, p, h1, h2, h3, h4, li, section, header, td, th, button, ' +
  '.dc-mean, .dc-ex, .dc-pt, .dc-pchip, .dc-tag, .dc-h-en, .dc-lv, .dc-sk'

export interface DocSearchIndex {
  text: string
  nodes: Text[]
  /** Với mỗi ký tự của `text`: thuộc nút nào (-1 = ký tự ngăn cách) và ở vị trí nào */
  node: Int32Array
  offset: Int32Array
}

const isAsciiUpper = (c: number) => c >= 65 && c <= 90

/** Gập một ký tự: bỏ dấu, chữ thường, đ → d. Có thể ra chuỗi rỗng (dấu rời). */
function foldChar(ch: string): string {
  const code = ch.charCodeAt(0)
  if (code < 128) return isAsciiUpper(code) ? String.fromCharCode(code + 32) : ch
  return ch
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
}

export function foldQuery(query: string): string {
  let out = ''
  for (const ch of query.trim()) out += /\s/.test(ch) ? ' ' : foldChar(ch)
  return out.replace(/ +/g, ' ')
}

function visible(el: Element, memo: Map<Element, boolean>): boolean {
  let v = memo.get(el)
  if (v === undefined) {
    const check = (el as Element & { checkVisibility?: () => boolean }).checkVisibility
    v = check ? check.call(el) : el.getClientRects().length > 0
    memo.set(el, v)
  }
  return v
}

export function buildIndex(root: HTMLElement): DocSearchIndex {
  const nodes: Text[] = []
  const chars: string[] = []
  const nodeOf: number[] = []
  const offOf: number[] = []
  const memo = new Map<Element, boolean>()
  let prevBlock: Element | null = null
  let lastSpace = true

  const push = (c: string, n: number, o: number) => {
    chars.push(c)
    nodeOf.push(n)
    offOf.push(o)
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let cur = walker.nextNode(); cur; cur = walker.nextNode()) {
    const textNode = cur as Text
    const parent = textNode.parentElement
    if (!parent || !textNode.data || !visible(parent, memo)) continue
    const block = parent.closest(BLOCK)
    if (block !== prevBlock) {
      if (chars.length) push('\u0000', -1, 0)
      prevBlock = block
      lastSpace = true
    }
    const n = nodes.push(textNode) - 1
    const data = textNode.data
    for (let i = 0; i < data.length; i++) {
      const ch = data[i]
      if (/\s/.test(ch)) {
        if (!lastSpace) push(' ', n, i)
        lastSpace = true
        continue
      }
      const folded = foldChar(ch)
      for (const f of folded) push(f, n, i)
      if (folded) lastSpace = false
    }
  }
  return {
    text: chars.join(''),
    nodes,
    node: Int32Array.from(nodeOf),
    offset: Int32Array.from(offOf),
  }
}

export function findRanges(index: DocSearchIndex, query: string, limit = 500): Range[] {
  const q = foldQuery(query)
  if (q.length < 2) return []
  const out: Range[] = []
  let from = 0
  while (out.length < limit) {
    const at = index.text.indexOf(q, from)
    if (at < 0) break
    const last = at + q.length - 1
    const startNode = index.node[at]
    const endNode = index.node[last]
    if (startNode >= 0 && endNode >= 0) {
      const range = document.createRange()
      range.setStart(index.nodes[startNode], index.offset[at])
      range.setEnd(index.nodes[endNode], index.offset[last] + 1)
      out.push(range)
    }
    from = at + q.length
  }
  return out
}

// ------------------------------------------------------------- Tô sáng
type HighlightCtor = new (...ranges: Range[]) => object
interface HighlightRegistry {
  set(name: string, value: object): void
  delete(name: string): void
}

function registry(): { reg: HighlightRegistry; Ctor: HighlightCtor } | null {
  const reg = (globalThis.CSS as unknown as { highlights?: HighlightRegistry } | undefined)?.highlights
  const Ctor = (globalThis as unknown as { Highlight?: HighlightCtor }).Highlight
  return reg && Ctor ? { reg, Ctor } : null
}

export function paintMatches(ranges: Range[], current: number) {
  const hl = registry()
  if (!hl) return
  if (ranges.length === 0) {
    clearMatches()
    return
  }
  hl.reg.set('doc-find', new hl.Ctor(...ranges))
  const active = ranges[current]
  if (active) hl.reg.set('doc-find-current', new hl.Ctor(active))
  else hl.reg.delete('doc-find-current')
}

export function clearMatches() {
  const hl = registry()
  if (!hl) return
  hl.reg.delete('doc-find')
  hl.reg.delete('doc-find-current')
}
