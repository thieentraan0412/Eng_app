// ============================================================
// Lỗi trả về từ Supabase (PostgrestError) là OBJECT THƯỜNG
// {message, details, hint, code} chứ không phải instance của Error, nên
// `String(e)` cho ra "[object Object]" và người dùng không biết hỏng ở đâu.
// Mọi chỗ hiển thị lỗi nên đi qua errText().
// ============================================================

export function errText(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>
    const parts = [o.message, o.details, o.hint].filter(Boolean).map(String)
    if (parts.length) return parts.join(' · ')
    try {
      return JSON.stringify(e)
    } catch {
      /* object có vòng lặp -> rơi xuống String() bên dưới */
    }
  }
  return String(e)
}

// Cột / bảng chưa có trong DB (chưa chạy file SQL bổ sung). PostgREST báo
// PGRST204 khi thiếu cột, Postgres báo 42703 (cột) / 42P01 (bảng).
export function isMissingSchema(e: unknown, ...names: string[]): boolean {
  const o = (e && typeof e === 'object' ? e : {}) as Record<string, unknown>
  const code = String(o.code ?? '')
  const text = errText(e).toLowerCase()
  const known = code === 'PGRST204' || code === '42703' || code === '42P01'
  const missing = /could not find|does not exist|schema cache/.test(text)
  if (!known && !missing) return false
  return names.length === 0 || names.some((n) => text.includes(n.toLowerCase()))
}
