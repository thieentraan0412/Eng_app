// ============================================================
// usageStats — đếm số request app gọi tới Supabase (phía client, theo máy).
// Lưu ý: đây là số request DO APP NÀY GỌI TRÊN MÁY NÀY, không phải tổng
// request toàn hệ thống (số chính xác chỉ có ở Supabase Dashboard).
// Lưu bằng localStorage, giữ lại lịch sử ~30 ngày để vẽ biểu đồ.
// ============================================================
const KEY = 'sb_request_stats_v1'
const KEEP_DAYS = 30

interface Stats {
  total: number
  days: Record<string, number> // 'YYYY-MM-DD' -> số request
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function read(): Stats {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Stats>
      return { total: p.total ?? 0, days: p.days ?? {} }
    }
  } catch {
    /* hỏng -> làm lại */
  }
  return { total: 0, days: {} }
}

function write(s: Stats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* hết chỗ -> bỏ qua */
  }
}

// Cắt bớt các ngày quá cũ để không phình localStorage
function prune(days: Record<string, number>): Record<string, number> {
  const keys = Object.keys(days).sort()
  if (keys.length <= KEEP_DAYS) return days
  const drop = keys.slice(0, keys.length - KEEP_DAYS)
  for (const k of drop) delete days[k]
  return days
}

// Tăng 1 mỗi khi có request (gọi từ fetch bọc trong supabaseClient)
export function bumpRequest(): void {
  const s = read()
  s.total += 1
  const d = todayStr()
  s.days[d] = (s.days[d] ?? 0) + 1
  s.days = prune(s.days)
  write(s)
}

export interface UsageStats {
  total: number
  today: number
  byDay: { date: string; count: number }[] // đủ mọi ngày trong `days` gần nhất
}

// Lấy thống kê để hiển thị; byDay trả về `days` ngày gần nhất (kể cả ngày 0)
export function getUsageStats(days = 14): UsageStats {
  const s = read()
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  const byDay: { date: string; count: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(from)
    d.setDate(from.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    byDay.push({ date: key, count: s.days[key] ?? 0 })
  }
  return { total: s.total, today: s.days[todayStr()] ?? 0, byDay }
}

export function resetRequestStats(): void {
  write({ total: 0, days: {} })
}
