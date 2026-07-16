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

// Dịch online — dịch được mọi từ và cả câu. Cần internet.
// Ưu tiên Google Translate (đáng tin cả với từ đơn), dự phòng MyMemory.
// Trả null nếu lỗi/không dịch được (kể cả khi API trả lại đúng từ gốc tiếng Anh).
export async function translateOnline(text: string): Promise<string | null> {
  const g = await googleTranslate(text)
  if (g) return g
  return myMemoryTranslate(text)
}

// Coi như "không dịch được" nếu kết quả rỗng hoặc y hệt đầu vào (API trả lại từ gốc)
function accept(vi: string | undefined | null, src: string): string | null {
  if (typeof vi !== 'string') return null
  const t = vi.trim()
  if (!t || t.toLowerCase() === src.trim().toLowerCase()) return null
  return t
}

// Google Translate (endpoint gtx miễn phí, không cần key, có CORS)
async function googleTranslate(text: string): Promise<string | null> {
  try {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' +
      encodeURIComponent(text)
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    // data[0] = danh sách các đoạn [đoạnDịch, đoạnGốc, …] -> nối lại thành câu
    const segs = data?.[0]
    if (!Array.isArray(segs)) return null
    const vi = segs.map((s: unknown[]) => (typeof s?.[0] === 'string' ? s[0] : '')).join('')
    return accept(vi, text)
  } catch {
    return null
  }
}

// MyMemory (dự phòng)
async function myMemoryTranslate(text: string): Promise<string | null> {
  try {
    const url =
      'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=en|vi'
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return accept(data?.responseData?.translatedText, text)
  } catch {
    return null
  }
}

// ---------- Dịch NGƯỢC: Việt -> Anh (dùng khi import câu tiếng Việt) ----------
// Trả null nếu lỗi/không dịch được. Cần internet.
export async function translateToEnglish(text: string): Promise<string | null> {
  const g = await googleTranslateVE(text)
  if (g) return g
  return myMemoryTranslateVE(text)
}

async function googleTranslateVE(text: string): Promise<string | null> {
  try {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=' +
      encodeURIComponent(text)
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const segs = data?.[0]
    if (!Array.isArray(segs)) return null
    const en = segs.map((s: unknown[]) => (typeof s?.[0] === 'string' ? s[0] : '')).join('')
    return accept(en, text)
  } catch {
    return null
  }
}

async function myMemoryTranslateVE(text: string): Promise<string | null> {
  try {
    const url =
      'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=vi|en'
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return accept(data?.responseData?.translatedText, text)
  } catch {
    return null
  }
}
