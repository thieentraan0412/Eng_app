// ============================================================
// Nhập câu luyện & chủ điểm cho module Ngữ pháp.
//
// 1) Cú pháp DÁN HÀNG LOẠT — một dòng một câu, dạng bài tự nhận diện:
//      Điền chỗ trống   She {has lived} in Hue for six years. (live)
//      Trắc nghiệm      He has worked here {for | since | from} five years.
//      Sửa lỗi sai      My sister is [teacher > a teacher] at school.
//      Viết lại câu     They built it in 1990. >> It was built in 1990.
//    Bổ trợ: (gợi ý) cuối câu điền · // giải thích ở cuối bất kỳ dòng nào ·
//    dòng mở đầu bằng # là ghi chú.
//
// 2) Nhập .csv/.txt — cột "cau" (bắt buộc) + "giai_thich" (tùy chọn),
//    nội dung cột "cau" dùng đúng cú pháp trên.
//
// 3) Nạp cả chủ điểm từ một sổ tính .xlsx gồm 6 sheet (ThongTin, CongThuc,
//    CachDung, DoiChieu, Bay, CauLuyen). Thiếu sheet nào thì phần đó để trống.
// ============================================================
import * as XLSX from 'xlsx'
import type {
  CefrLevel,
  GrammarCompare,
  GrammarFormula,
  GrammarItem,
  GrammarItemKind,
  GrammarTrap,
  GrammarUse,
} from '../data/grammar'
import type { TopicDraft } from './cloud/grammarCloud'
import { TOPIC_ICONS } from './cloud/grammarCloud'

// ---------- Kết quả phân tích một dòng ----------
export interface ParsedDisplay {
  before: string
  highlight: string
  after: string
  note?: string
}

export interface ParsedOk {
  no: number
  ok: true
  raw: string
  kind: GrammarItemKind
  why: string
  answer: string
  options?: string[]
  cue?: string
  prompt: string
  tokens?: string[]
  errIndex?: number
  display: ParsedDisplay
}

export interface ParsedBad {
  no: number
  ok: false
  raw: string
  msg: string
}

export type ParsedLine = ParsedOk | ParsedBad

export const KIND_LABEL: Record<GrammarItemKind, string> = {
  cloze: 'Điền chỗ trống',
  mcq: 'Trắc nghiệm',
  correct: 'Sửa lỗi',
  transform: 'Viết lại câu',
}

export const KIND_ICON: Record<GrammarItemKind, 'pencil' | 'tasks' | 'alert' | 'refresh'> = {
  cloze: 'pencil',
  mcq: 'tasks',
  correct: 'alert',
  transform: 'refresh',
}

// ============================================================
// 1. PARSER DÁN HÀNG LOẠT
// ============================================================
export function parseLine(src: string, no: number): ParsedLine | null {
  const raw = String(src).trim()
  let line = raw
  if (!line || line.startsWith('#')) return null

  // tách phần giải thích  // …
  let why = ''
  const wi = line.indexOf('//')
  if (wi > 0) {
    why = line.slice(wi + 2).trim()
    line = line.slice(0, wi).trim()
  }

  const bad = (msg: string): ParsedBad => ({ no, ok: false, raw, msg })

  // ---- Sửa lỗi:  [sai > đúng] ----
  if (line.includes('[') || line.includes(']')) {
    const mc = line.match(/\[([^[\]]*?)>([^[\]]*?)\]/)
    if (!mc) return bad('Dấu […] chưa đúng — cần dạng [từ sai > từ đúng]')
    const wrong = mc[1].trim()
    const right = mc[2].trim()
    if (!wrong || !right) return bad('Thiếu vế sai hoặc vế đúng trong […>…]')

    const head = line.slice(0, mc.index)
    const tail = line.slice((mc.index ?? 0) + mc[0].length)
    const full = (head + wrong + tail).replace(/\s+/g, ' ').trim()
    const tokens = full.split(' ')
    // Vị trí từ sai = số từ đứng trước nó
    const errIndex = head.trim() ? head.trim().split(/\s+/).length : 0

    return {
      no,
      ok: true,
      raw,
      kind: 'correct',
      why,
      answer: right,
      prompt: full,
      tokens,
      errIndex,
      display: { before: head, highlight: `${wrong} → ${right}`, after: tail },
    }
  }

  // ---- Trắc nghiệm / điền:  { … } ----
  const open = (line.match(/\{/g) || []).length
  const close = (line.match(/\}/g) || []).length
  if (open || close) {
    if (open !== close) return bad('Dấu ngoặc { } chưa khép')
    if (open > 1) return bad('Mỗi dòng chỉ được có một cặp { }')
    const mb = line.match(/\{([^{}]*)\}/)
    if (!mb) return bad('Dấu ngoặc { } chưa đúng')
    const inner = mb[1]
    let rest = line.slice((mb.index ?? 0) + mb[0].length)
    let cue = ''
    const mh = rest.match(/\(([^()]+)\)\s*$/)
    if (mh) {
      cue = mh[1].trim()
      rest = rest.slice(0, mh.index)
    }
    const head = line.slice(0, mb.index)

    if (inner.includes('|')) {
      const opts = inner
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
      if (opts.length < 2) return bad('Trắc nghiệm cần ít nhất 2 phương án')
      if (opts.length > 4) return bad('Tối đa 4 phương án cho một câu trắc nghiệm')
      return {
        no,
        ok: true,
        raw,
        kind: 'mcq',
        why,
        answer: opts[0],
        options: opts,
        prompt: `${head}___${rest}`,
        display: {
          before: head,
          highlight: opts[0],
          after: rest,
          note: `phương án: ${opts.slice(1).join(', ')}`,
        },
      }
    }

    const ans = inner.trim()
    if (!ans) return bad('Chỗ trống { } đang rỗng')
    return {
      no,
      ok: true,
      raw,
      kind: 'cloze',
      why,
      answer: ans,
      cue,
      prompt: `${head}___${rest}`,
      display: { before: head, highlight: ans, after: rest, note: cue || undefined },
    }
  }

  // ---- Viết lại câu:  gốc >> đích ----
  if (line.includes('>>')) {
    const parts = line.split('>>')
    if (parts.length !== 2) return bad('Chỉ được có một dấu >> trên mỗi dòng')
    const from = parts[0].trim()
    const to = parts[1].trim()
    if (!from || !to) return bad('Thiếu câu gốc hoặc câu đích quanh dấu >>')
    return {
      no,
      ok: true,
      raw,
      kind: 'transform',
      why,
      answer: to,
      prompt: from,
      display: { before: `${from} → `, highlight: to, after: '' },
    }
  }

  return bad('Không nhận ra dạng bài — thiếu { }, [ > ] hoặc >>')
}

export function parseAll(text: string): ParsedLine[] {
  const out: ParsedLine[] = []
  String(text)
    .split(/\r?\n/)
    .forEach((l, i) => {
      const r = parseLine(l, i + 1)
      if (r) out.push(r)
    })
  return out
}

// Đổi dòng đã phân tích thành câu luyện tập
export function toItem(p: ParsedOk, index: number, errorTag?: string): GrammarItem {
  return {
    id: `new-${index}-${p.no}`,
    kind: p.kind,
    prompt: p.prompt,
    answers: [p.answer],
    options: p.options,
    tokens: p.tokens,
    errIndex: p.errIndex,
    cue: p.cue || undefined,
    explain: p.why || undefined,
    errorTag,
  }
}

// ============================================================
// 1b. NGƯỢC LẠI: câu luyện -> dòng dán, để mở lại chủ điểm cũ trong màn soạn
// ============================================================
function fillBlank(prompt: string, filler: string): string {
  return prompt.includes('___') ? prompt.replace('___', filler) : `${prompt} ${filler}`
}

export function itemToPasteLine(item: GrammarItem): string {
  const why = item.explain ? ` // ${item.explain}` : ''
  const answer = item.answers[0] ?? ''

  if (item.kind === 'mcq') {
    const rest = (item.options ?? []).filter((o) => o !== answer)
    return fillBlank(item.prompt, `{${[answer, ...rest].join(' | ')}}`) + why
  }

  if (item.kind === 'cloze') {
    const cue = item.cue ? ` (${item.cue})` : ''
    return fillBlank(item.prompt, `{${answer}}`) + cue + why
  }

  if (item.kind === 'correct') {
    const tokens = item.tokens?.length ? item.tokens : item.prompt.split(/\s+/)
    const i = item.errIndex ?? 0
    const line = tokens
      .map((t, k) => (k === i ? `[${t} > ${answer}]` : t))
      .join(' ')
    return line + why
  }

  return `${item.prompt} >> ${answer}${why}`
}

export function itemsToPasteText(items: GrammarItem[]): string {
  return items.map(itemToPasteLine).join('\n')
}

export const SAMPLE_PASTE = [
  '# Mỗi dòng một câu. Dòng bắt đầu bằng # là ghi chú, sẽ bị bỏ qua.',
  'She {has lived} in Da Nang for six years. (live) // Khoảng thời gian chưa kết thúc → hiện tại hoàn thành.',
  'They {have not finished} the report yet. (not finish)',
  'Have you ever {been} to Hue? (be)',
  'She has {written} three emails today. (write) // Sau have/has luôn là V3, không phải V2.',
  'He has worked here {for | since | from | during} five years. // for đi với độ dài, since đi với mốc thời gian.',
  'I {have seen | saw | see | had seen} that film three times.',
  'My sister is [teacher > a teacher] at a primary school. // Danh từ đếm được số ít luôn cần mạo từ đứng trước.',
  'I bought three [book > books] at the fair yesterday.',
  'My brother [go > goes] to the gym every morning.',
  'The company launched a new app last month. >> A new app was launched by the company last month.',
  'People speak English all over the world. >> English is spoken all over the world.',
].join('\n')

// ============================================================
// 2. NHẬP TỪ .CSV / .TXT
// ============================================================
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',' || ch === ';') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

// Trả về các dòng đã ghép "câu // giải thích" để đưa vào parser
export function csvToPasteText(text: string): string {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return ''

  const first = splitCsvLine(lines[0]).map((c) => deaccent(c))
  const hasHeader = first.some((c) => ['cau', 'câu', 'sentence', 'noi dung'].includes(c))
  let iSent = 0
  let iWhy = -1
  if (hasHeader) {
    iSent = first.findIndex((c) => ['cau', 'sentence', 'noi dung'].includes(c))
    iWhy = first.findIndex((c) => ['giai thich', 'giaithich', 'vi sao', 'why', 'explain'].includes(c))
    if (iSent < 0) iSent = 0
  }

  return lines
    .slice(hasHeader ? 1 : 0)
    .map((l) => {
      const cells = splitCsvLine(l)
      const sentence = (cells[iSent] ?? '').trim()
      if (!sentence) return ''
      const why = iWhy >= 0 ? (cells[iWhy] ?? '').trim() : ''
      return why && !sentence.includes('//') ? `${sentence} // ${why}` : sentence
    })
    .filter(Boolean)
    .join('\n')
}

export const SAMPLE_CSV = [
  'cau,giai_thich',
  '"She {has lived} in Da Nang for six years. (live)","Khoảng thời gian chưa kết thúc"',
  '"He has worked here {for | since | from} five years.","for đi với độ dài thời gian"',
  '"My sister is [teacher > a teacher] at a primary school.","Danh từ đếm được số ít cần mạo từ"',
  '"They built it in 1990. >> It was built in 1990.","Bị động quá khứ đơn: was/were + V3"',
].join('\n')

export function downloadSampleCsv(): void {
  const blob = new Blob(['﻿' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, 'mau-cau-luyen-ngu-phap.csv')
}

// ============================================================
// 3. NẠP CẢ CHỦ ĐIỂM TỪ SỔ TÍNH .XLSX
// ============================================================
function deaccent(s: unknown): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
}
// Bỏ luôn khoảng trắng để "Cách dùng" == "cachdung"
function key(s: unknown): string {
  return deaccent(s).replace(/[^a-z0-9]/g, '')
}

const SHEET_KEYS: [keyof SheetHits, string[]][] = [
  ['info', ['thongtin', 'thongtinchung']],
  ['formulas', ['congthuc', 'cautruc']],
  ['uses', ['cachdung', 'truonghopdung', 'truonghop']],
  ['compare', ['doichieu', 'sosanh']],
  ['items', ['cauluyen', 'cauluyentap', 'baitap', 'cauhoi']],
  ['traps', ['bay', 'baynguoiviet', 'loithuonggap']],
]

const INFO_LABELS: [string[], keyof InfoFields][] = [
  [['tenchudiem', 'tenchude', 'ten', 'chudiem'], 'name'],
  [['tentienganh', 'tienganh', 'nameen', 'tenen'], 'nameEn'],
  [['capdo', 'cap', 'cefr', 'trinhdo'], 'level'],
  [['nhomloi', 'nhomloinguoiviet', 'nhanloi'], 'tags'],
  [['nhom', 'nhomchudiem'], 'group'],
  [['mota', 'motangan'], 'desc'],
  [['icon', 'bieutuong'], 'icon'],
  [['tutinhieu', 'tinhieu'], 'signals'],
  [['chudiemdenham', 'denham', 'doichieuvoi', 'sosanhvoi'], 'cmpWith'],
]

interface InfoFields {
  name: string
  nameEn: string
  level: string
  group: string
  desc: string
  icon: string
  tags: string
  signals: string
  cmpWith: string
}

interface SheetHits {
  info?: string
  formulas?: string
  uses?: string
  compare?: string
  items?: string
  traps?: string
}

export interface SheetReport {
  label: string
  sheet: string | null
  rows: number
  note: string
}

export interface WorkbookResult {
  draft: TopicDraft
  parsed: ParsedLine[]
  reports: SheetReport[]
  warnings: string[]
}

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function grid(wb: XLSX.WorkBook, name: string | undefined): string[][] {
  if (!name) return []
  const sheet = wb.Sheets[name]
  if (!sheet) return []
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
  })
  return rows.map((r) => (r as unknown[]).map((c) => String(c ?? '').trim()))
}

// Bỏ dòng tiêu đề nếu ô đầu trùng một trong các nhãn cột
function dropHeader(rows: string[][], headers: string[]): string[][] {
  if (rows.length === 0) return rows
  const first = key(rows[0][0])
  return headers.some((h) => first === key(h)) ? rows.slice(1) : rows
}

export function readTopicWorkbook(buffer: ArrayBuffer): WorkbookResult {
  const wb = XLSX.read(buffer, { type: 'array' })
  const hits: SheetHits = {}
  for (const name of wb.SheetNames) {
    const k = key(name)
    for (const [field, aliases] of SHEET_KEYS) {
      if (!hits[field] && aliases.some((a) => k.includes(a))) hits[field] = name
    }
  }

  const warnings: string[] = []
  const info: InfoFields = {
    name: '',
    nameEn: '',
    level: 'B1',
    group: '',
    desc: '',
    icon: 'clock',
    tags: '',
    signals: '',
    cmpWith: '',
  }

  // ---- ThongTin: cột Nhãn · Giá trị ----
  const infoRows = dropHeader(grid(wb, hits.info), ['Nhãn', 'Nhan', 'Label'])
  let infoCount = 0
  for (const row of infoRows) {
    const label = key(row[0])
    const value = (row[1] ?? '').trim()
    if (!label || !value) continue
    // Khớp CHÍNH XÁC trước; nếu không có thì mới lấy alias dài nhất khớp tiền tố.
    // (nếu dùng includes ngay từ đầu thì "chudiemdenham" sẽ dính alias "chudiem"
    //  của Tên chủ điểm và ghi đè mất tên)
    let field: keyof InfoFields | null = null
    for (const [aliases, f] of INFO_LABELS) {
      if (!field && aliases.some((a) => label === a)) field = f
    }
    if (!field) {
      let best = 0
      for (const [aliases, f] of INFO_LABELS) {
        for (const a of aliases) {
          if (label.startsWith(a) && a.length > best) {
            best = a.length
            field = f
          }
        }
      }
    }
    if (!field) {
      warnings.push(`Không hiểu nhãn “${row[0]}” ở sheet ThongTin — đã bỏ qua.`)
      continue
    }
    info[field] = value
    infoCount++
  }

  let level = (info.level || 'B1').toUpperCase().replace(/\s/g, '') as CefrLevel
  if (!LEVELS.includes(level)) {
    if (info.level) warnings.push(`Cấp độ “${info.level}” không thuộc A1–C2 — tạm đặt B1.`)
    level = 'B1'
  }
  let icon = (info.icon || 'clock').toLowerCase()
  if (!(TOPIC_ICONS as readonly string[]).includes(icon)) {
    if (info.icon) warnings.push(`Icon “${info.icon}” không có trong bộ — tạm dùng clock.`)
    icon = 'clock'
  }

  const splitList = (s: string): string[] =>
    s
      .split(/[,;\n]/)
      .map((x) => x.trim())
      .filter(Boolean)

  // ---- CongThuc ----
  const formulaRows = dropHeader(grid(wb, hits.formulas), ['Dạng', 'Dang', 'Form'])
  const formulas: GrammarFormula[] = formulaRows
    .filter((r) => r.some(Boolean))
    .map((r) => ({ form: r[0] ?? '', structure: r[1] ?? '', example: r[2] ?? '' }))

  // ---- CachDung ----
  const useRows = dropHeader(grid(wb, hits.uses), ['Trường hợp', 'Truong hop', 'Case'])
  const uses: GrammarUse[] = useRows
    .filter((r) => r.some(Boolean))
    .map((r) => ({ name: r[0] ?? '', sample: r[1] ?? '', note: r[2] ?? '' }))

  // ---- DoiChieu ----
  const cmpRows = dropHeader(grid(wb, hits.compare), ['Tiêu chí', 'Tieu chi', 'Criteria'])
  const compareRows = cmpRows
    .filter((r) => r.some(Boolean))
    .map((r) => ({ key: r[0] ?? '', other: r[1] ?? '', self: r[2] ?? '' }))
  const compare: GrammarCompare | null =
    compareRows.length > 0 ? { with: info.cmpWith || 'Chủ điểm dễ nhầm', rows: compareRows } : null

  // ---- Bay ----
  const trapRows = dropHeader(grid(wb, hits.traps), ['Câu sai', 'Cau sai', 'Wrong'])
  const traps: GrammarTrap[] = trapRows
    .filter((r) => r.some(Boolean))
    .map((r) => ({ wrong: r[0] ?? '', right: r[1] ?? '', why: r[2] ?? '' }))

  // ---- CauLuyen ----
  const itemRows = dropHeader(grid(wb, hits.items), ['Câu', 'Cau', 'Sentence'])
  const pasteText = itemRows
    .filter((r) => (r[0] ?? '').trim())
    .map((r) => {
      const sentence = r[0].trim()
      const why = (r[1] ?? '').trim()
      return why && !sentence.includes('//') ? `${sentence} // ${why}` : sentence
    })
    .join('\n')
  const parsed = parseAll(pasteText)
  const tags = splitList(info.tags)

  const draft: TopicDraft = {
    name: info.name.trim(),
    nameEn: info.nameEn.trim(),
    level,
    group: info.group.trim(),
    description: info.desc.trim(),
    icon,
    tags,
    signals: splitList(info.signals),
    formulas,
    uses,
    traps,
    compare,
    items: parsed
      .filter((p): p is ParsedOk => p.ok)
      .map((p, i) => toItem(p, i, tags[0])),
  }

  const reports: SheetReport[] = [
    {
      label: 'ThongTin',
      sheet: hits.info ?? null,
      rows: infoCount,
      note: draft.name ? `Chủ điểm “${draft.name}” · ${level}` : 'Thiếu Tên chủ điểm',
    },
    {
      label: 'CongThuc',
      sheet: hits.formulas ?? null,
      rows: formulas.length,
      note: formulas.length ? 'Hiện ở đầu trang bài học' : 'Không có — bài học sẽ trống phần công thức',
    },
    {
      label: 'CachDung',
      sheet: hits.uses ?? null,
      rows: uses.length,
      note: uses.length ? 'Lưới thẻ giữa trang bài học' : 'Không có',
    },
    {
      label: 'DoiChieu',
      sheet: hits.compare ?? null,
      rows: compareRows.length,
      note: compare ? `Đối chiếu với “${compare.with}”` : 'Không có — bảng đối chiếu sẽ không hiện',
    },
    {
      label: 'Bay',
      sheet: hits.traps ?? null,
      rows: traps.length,
      note: traps.length ? 'Bẫy với người học Việt' : 'Không có',
    },
    {
      label: 'CauLuyen',
      sheet: hits.items ?? null,
      rows: parsed.filter((p) => p.ok).length,
      note: `${parsed.filter((p) => !p.ok).length} dòng lỗi cú pháp sẽ bị bỏ qua`,
    },
  ]

  return { draft, parsed, reports, warnings }
}

// ---------- Sổ tính mẫu (.xlsx) ----------
export function downloadSampleWorkbook(): void {
  const wb = XLSX.utils.book_new()
  const add = (name: string, aoa: string[][]) =>
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name)

  add('ThongTin', [
    ['Nhãn', 'Giá trị'],
    ['Tên chủ điểm', 'Thì quá khứ hoàn thành'],
    ['Tên tiếng Anh', 'Past perfect'],
    ['Cấp độ', 'B2'],
    ['Nhóm', 'Thì động từ'],
    ['Mô tả', 'Diễn tả việc xảy ra trước một mốc khác trong quá khứ.'],
    ['Icon', 'clock'],
    ['Nhóm lỗi', 'Nhầm thì'],
    ['Từ tín hiệu', 'before, after, by the time, already'],
    ['Chủ điểm dễ nhầm', 'Quá khứ đơn'],
  ])
  add('CongThuc', [
    ['Dạng', 'Cấu trúc', 'Ví dụ'],
    ['Khẳng định', 'S + had + V3', 'She {had left} before I arrived.'],
    ['Phủ định', 'S + had not + V3', 'They {had not finished} the report.'],
    ['Nghi vấn', 'Had + S + V3 ?', '{Had} you {seen} him before?'],
  ])
  add('CachDung', [
    ['Trường hợp', 'Câu ví dụ', 'Giải thích'],
    ['Việc xảy ra trước', 'The train {had left} when we arrived.', 'Tàu chạy trước lúc chúng tôi tới.'],
    ['Sau by the time', 'By the time he called, I {had gone} to bed.', 'Mốc quá khứ nằm ở mệnh đề kia.'],
  ])
  add('DoiChieu', [
    ['Tiêu chí', 'Chủ điểm kia', 'Chủ điểm này'],
    ['Thứ tự thời gian', 'Việc xảy ra sau', 'Việc xảy ra trước'],
    ['Ví dụ', 'I arrived at eight.', 'The train had left at seven.'],
  ])
  add('Bay', [
    ['Câu sai', 'Câu đúng', 'Vì sao'],
    [
      'When I arrived, the train already left.',
      'When I arrived, the train had already left.',
      'Tiếng Việt chỉ có một chữ “đã” nên bước lùi thì bị bỏ.',
    ],
  ])
  add('CauLuyen', [
    ['Câu', 'Giải thích'],
    ['The train {had left} before we arrived. (leave)', 'Việc xảy ra trước một mốc quá khứ.'],
    ['By the time he called, I {had gone | went | have gone} to bed.', 'Lùi thì so với mốc quá khứ.'],
    ['When I arrived, the train [already left > had already left].', 'Thiếu had trong quá khứ hoàn thành.'],
    ['She finished her work. Then she went home. >> After she had finished her work, she went home.', ''],
  ])

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  triggerDownload(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'mau-chu-diem-ngu-phap.xlsx',
  )
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
