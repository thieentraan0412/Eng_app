import rawDict from '../data/dictionary.json'

// ============================================================
// TranslationService — tra từ Anh→Việt bằng từ điển tĩnh (offline).
// Từ điển đóng gói kèm app (dictionary.json), nạp vào bộ nhớ.
// Đây là OfflineDictionaryProvider mặc định (xem thiết kế Mục 5.5).
// ============================================================

export interface DictEntry {
  phonetic?: string
  pos?: string
  vi: string
}

const dict = rawDict as Record<string, DictEntry>

export interface TranslateResult {
  word: string
  phonetic?: string
  pos?: string
  vi: string | null // null nếu không tìm thấy
}

// Chuẩn hóa: bỏ khoảng trắng thừa, hạ chữ thường, bỏ dấu câu ở đầu/cuối
function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '')
}

export function translate(text: string): TranslateResult {
  const word = normalize(text)
  const entry = dict[word]
  return {
    word,
    phonetic: entry?.phonetic,
    pos: entry?.pos,
    vi: entry?.vi ?? null,
  }
}

// Kiểm tra 1 chuỗi có phải "một từ đơn" không (để quyết định tra từ hay dịch cụm)
export function isSingleWord(text: string): boolean {
  return normalize(text).length > 0 && !/\s/.test(text.trim())
}

// Dịch cụm nhiều từ: tra nghĩa từng từ (offline)
export interface WordGloss {
  word: string
  vi: string | null
}
export function glossPhrase(text: string): WordGloss[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 12)
    .map((w) => {
      const r = translate(w)
      return { word: r.word || w, vi: r.vi }
    })
}

// Dịch online (API MyMemory, miễn phí) — dịch được mọi từ và cả câu.
// Cần internet. Trả về null nếu lỗi/không dịch được.
export async function translateOnline(text: string): Promise<string | null> {
  try {
    const url =
      'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(text) +
      '&langpair=en|vi'
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const vi = data?.responseData?.translatedText
    return typeof vi === 'string' && vi.trim() ? vi.trim() : null
  } catch {
    return null
  }
}
