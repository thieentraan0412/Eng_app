// Đọc file Excel/CSV, lấy cột câu tiếng Việt theo tiêu đề.
// (dùng cho tính năng Import câu vào thư mục Chép câu)

import * as XLSX from 'xlsx'
import type { CefrLevel } from '../data/sentences'

// Bỏ dấu tiếng Việt + hạ thường để so khớp tiêu đề linh hoạt
function deaccent(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
}

// Bảng tiêu đề -> trường dữ liệu. Chỉ 'vi' là bắt buộc, còn lại tùy chọn.
const HEADER_ALIASES: Record<ImportField, string[]> = {
  vi: ['cau tieng viet', 'tieng viet', 'vi', 'cau', 'vietnamese', 'vn', 'sentence'],
  en: ['dap an tieng anh', 'tieng anh', 'dap an', 'en', 'english', 'answer'],
  altAnswers: ['dap an khac', 'cach khac', 'alt', 'khac'],
  hints: ['goi y', 'hint', 'hints'],
  level: ['cap do', 'level', 'trinh do', 'cefr'],
  topic: ['chu de', 'topic', 'chude'],
}
type ImportField = 'vi' | 'en' | 'altAnswers' | 'hints' | 'level' | 'topic'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

function matchField(cell: unknown): ImportField | null {
  if (typeof cell !== 'string') return null
  const key = deaccent(cell)
  for (const field of Object.keys(HEADER_ALIASES) as ImportField[]) {
    if (HEADER_ALIASES[field].includes(key)) return field
  }
  return null
}

function cellText(cell: unknown): string {
  if (typeof cell === 'string') return cell.trim()
  return cell != null ? String(cell).trim() : ''
}

// Tách nhiều giá trị: ngăn bởi "|" hoặc xuống dòng (KHÔNG tách bởi dấu phẩy — câu có phẩy)
function splitMulti(cell: unknown): string[] {
  const t = cellText(cell)
  if (!t) return []
  return t
    .split(/\s*[|\n]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseLevel(cell: unknown): string | undefined {
  const t = cellText(cell).toUpperCase()
  return LEVELS.includes(t) ? t : undefined
}

export interface ParsedRow {
  vi: string
  en?: string
  altAnswers?: string[]
  hints?: string[]
  level?: string
  topic?: string
}

export interface ImportResult {
  rows: ParsedRow[] // các câu đọc được (đã lọc dòng trống ở cột tiếng Việt)
  usedColumn: string // mô tả cột tiếng Việt đã dùng
  hasEn: boolean // file có cột đáp án tiếng Anh không
  extraCols: string[] // các cột phụ tìm thấy (để báo cho người dùng)
}

// Đọc file -> danh sách câu có cấu trúc. Chỉ cột tiếng Việt là bắt buộc.
export function parseRowsFromExcel(buffer: ArrayBuffer): ImportResult {
  const empty: ImportResult = { rows: [], usedColumn: '(rỗng)', hasEn: false, extraCols: [] }
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return { ...empty, usedColumn: '(không có sheet)' }

  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: '' })
  if (grid.length === 0) return empty

  const headerRow = grid[0] ?? []
  // Dò cột cho từng trường theo tiêu đề (cột đầu tiên khớp được giữ)
  const colOf: Partial<Record<ImportField, number>> = {}
  headerRow.forEach((cell, idx) => {
    const field = matchField(cell)
    if (field && colOf[field] === undefined) colOf[field] = idx
  })

  const anyHeader = Object.keys(colOf).length > 0
  let dataStart = 1
  let usedColumn: string

  if (colOf.vi !== undefined) {
    usedColumn = `cột "${cellText(headerRow[colOf.vi])}"`
  } else {
    // Không có tiêu đề tiếng Việt -> dùng cột đầu tiên
    colOf.vi = 0
    if (anyHeader) {
      usedColumn = 'cột đầu tiên'
    } else {
      // File hoàn toàn không có tiêu đề: bỏ dòng đầu nếu trông như tiêu đề (ngắn)
      const first = headerRow[0]
      const looksHeader = typeof first === 'string' && first.trim().split(/\s+/).length <= 2
      dataStart = looksHeader ? 1 : 0
      usedColumn = 'cột đầu tiên (không có tiêu đề)'
    }
  }

  const viCol = colOf.vi
  const rows: ParsedRow[] = []
  for (let i = dataStart; i < grid.length; i++) {
    const r = grid[i] ?? []
    const vi = cellText(r[viCol])
    if (!vi) continue // câu tiếng Việt trống -> bỏ
    const row: ParsedRow = { vi }
    if (colOf.en !== undefined) row.en = cellText(r[colOf.en]) || undefined
    if (colOf.altAnswers !== undefined) {
      const a = splitMulti(r[colOf.altAnswers])
      if (a.length) row.altAnswers = a
    }
    if (colOf.hints !== undefined) {
      const h = splitMulti(r[colOf.hints])
      if (h.length) row.hints = h
    }
    if (colOf.level !== undefined) row.level = parseLevel(r[colOf.level])
    if (colOf.topic !== undefined) row.topic = cellText(r[colOf.topic]) || undefined
    rows.push(row)
  }

  const extraCols: string[] = []
  for (const f of ['en', 'altAnswers', 'hints', 'level', 'topic'] as ImportField[]) {
    if (colOf[f] !== undefined) extraCols.push(cellText(headerRow[colOf[f]!]) || f)
  }

  return { rows, usedColumn, hasEn: colOf.en !== undefined, extraCols }
}

// Vài câu ví dụ cho file mẫu (đúng định dạng như file xuất — 7 cột).
// Có dòng đầy đủ và dòng chỉ có tiếng Việt để minh họa "các cột khác là tùy chọn".
const SAMPLE_ROWS: ParsedRow[] = [
  {
    vi: 'Tôi đã học tiếng Anh được ba năm.',
    en: 'I have learned English for three years.',
    altAnswers: ['I have studied English for three years.'],
    hints: ['thì hiện tại hoàn thành', 'for + khoảng thời gian'],
    level: 'B1',
    topic: 'Học tập',
  },
  {
    vi: 'Cô ấy sống ở Hà Nội.',
    en: 'She lives in Hanoi.',
    hints: ['thì hiện tại đơn'],
    level: 'A1',
    topic: 'Đời sống',
  },
  // Các dòng dưới chỉ có tiếng Việt — app sẽ tự dịch & bỏ trống phần còn lại
  { vi: 'Trời đang mưa rất to.' },
  { vi: 'Bạn có thể giúp tôi một việc được không?' },
]

// Tạo & tải file Excel mẫu (đúng 7 cột như file xuất)
export function downloadSampleExcel(fileName = 'mau-chep-cau.xlsx'): void {
  writeRowsToExcel(SAMPLE_ROWS, fileName)
}

// ---------- Xuất toàn bộ dữ liệu của một thư mục ----------
export interface ExportRow {
  vi: string
  en: string
  altAnswers?: string[]
  hints?: string[]
  level?: CefrLevel
  topic?: string
}

// Bỏ ký tự không hợp lệ cho tên file
function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'chep-cau'
}

// Xuất tất cả câu (đầy đủ cột) ra .xlsx để sao lưu / chia sẻ
export function exportFolderExcel(folderName: string, rows: ExportRow[]): void {
  writeRowsToExcel(rows, `chep-cau-${safeFileName(folderName)}.xlsx`)
}

// ---------- Dựng file .xlsx 7 cột từ danh sách câu (dùng chung: mẫu + xuất) ----------
interface SheetRow {
  vi: string
  en?: string
  altAnswers?: string[]
  hints?: string[]
  level?: string
  topic?: string
}

function writeRowsToExcel(rows: SheetRow[], fileName: string): void {
  const aoa: (string | number)[][] = [
    ['STT', 'Câu tiếng Việt', 'Đáp án tiếng Anh', 'Đáp án khác', 'Gợi ý', 'Cấp độ', 'Chủ đề'],
  ]
  rows.forEach((r, i) =>
    aoa.push([
      i + 1,
      r.vi,
      r.en ?? '',
      (r.altAnswers ?? []).join(' | '),
      (r.hints ?? []).join(' | '),
      r.level ?? '',
      r.topic ?? '',
    ]),
  )

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [
    { wch: 5 },
    { wch: 40 },
    { wch: 40 },
    { wch: 34 },
    { wch: 28 },
    { wch: 8 },
    { wch: 16 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ChepCau')
  downloadWorkbook(wb, fileName)
}

// ---------- Tải workbook về máy (Blob + anchor) ----------
function downloadWorkbook(wb: XLSX.WorkBook, fileName: string): void {
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
