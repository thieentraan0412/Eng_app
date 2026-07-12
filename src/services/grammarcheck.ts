// ============================================================
// GrammarcheckService — kiểm tra ngữ pháp / cấu trúc câu / collocation
// Dùng LanguageTool API (miễn phí, không cần key). Cần internet.
// ============================================================

export interface GrammarMatch {
  offset: number
  length: number
  message: string
  errorText: string // đoạn văn bản bị lỗi (để đối chiếu khi sửa)
  replacements: string[] // gợi ý sửa
}

export async function checkGrammar(text: string): Promise<GrammarMatch[]> {
  if (!text.trim()) return []
  try {
    const body = new URLSearchParams({
      text,
      language: 'en-US',
      level: 'picky', // bắt thêm cả lỗi văn phong / collocation
    })
    const res = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) return []
    const data = await res.json()
    const matches = (data.matches ?? []) as Array<{
      offset: number
      length: number
      message: string
      replacements: { value: string }[]
      rule?: { issueType?: string; category?: { id?: string } }
    }>
    // Kiểm tra TOÀN DIỆN cả câu: giữ ngữ pháp, văn phong, dùng từ, collocation…
    // Chỉ bỏ lỗi CHÍNH TẢ (đã có bộ kiểm tra chính tả đỏ riêng).
    return matches
      .filter((m) => {
        if (m.rule?.issueType === 'misspelling') return false
        return m.rule?.category?.id !== 'TYPOS'
      })
      .slice(0, 15)
      .map((m) => ({
        offset: m.offset,
        length: m.length,
        message: m.message,
        errorText: text.substr(m.offset, m.length),
        replacements: (m.replacements ?? []).slice(0, 3).map((r) => r.value),
      }))
  } catch {
    return []
  }
}
