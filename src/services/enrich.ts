// ============================================================
// EnrichService — gợi ý Collocation / Pattern / Câu ví dụ (online, miễn phí).
//  • Datamuse (api.datamuse.com): từ hay đứng trước/sau -> collocation & pattern
//  • Free Dictionary (dictionaryapi.dev): câu ví dụ thật
// Cần internet. Lỗi/không có mạng -> trả mảng rỗng (app vẫn chạy offline).
// ============================================================

export interface Enrichment {
  collocations: string[]
  patterns: string[]
  examples: string[]
  pos: string[] // từ loại (đã rút gọn: n, v, adj, adv…)
}

// Rút gọn tên từ loại (Free Dictionary trả "noun", "verb"…) -> nhãn ngắn
const POS_SHORT: Record<string, string> = {
  noun: 'n',
  verb: 'v',
  adjective: 'adj',
  adverb: 'adv',
  pronoun: 'pron',
  preposition: 'prep',
  conjunction: 'conj',
  interjection: 'interj',
  determiner: 'det',
  numeral: 'num',
  article: 'art',
}
export function shortPos(pos: string): string {
  return POS_SHORT[pos.trim().toLowerCase()] ?? pos.trim().toLowerCase()
}

// Từ chức năng (mạo từ, giới từ, trợ động từ…) — bỏ khi dựng collocation
const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'is', 'was', 'are',
  'be', 'been', 'am', 'it', 'this', 'that', 'these', 'those', 'no', 'not', 'as', 'with', 'by',
  'from', 'his', 'her', 'their', 'its', 'my', 'your', 'our', 'i', 'you', 'he', 'she', 'we', 'they',
  'will', 'would', 'can', 'could', 'has', 'have', 'had', 'do', 'does', 'did', 'so',
])
// Giới từ/tiểu từ dùng để dựng mẫu câu (pattern) — mở rộng để nhiều từ có pattern hơn
const PREPS = [
  'to', 'for', 'of', 'in', 'on', 'at', 'with', 'about', 'from', 'into', 'as', 'over',
  'against', 'between', 'through', 'under', 'without', 'upon', 'towards', 'toward', 'after',
  'before', 'by', 'off', 'out', 'up', 'down', 'around', 'along', 'across', 'beyond',
]

// Số đếm / lượng từ — là collocation kém (two main, three main…), bỏ khi dựng collocation
const NUM_QUANT = new Set([
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'many', 'much',
  'few', 'several', 'whose', 'each', 'every', 'any', 'all', 'both', 'some', 'most', 'more', 'less',
  'various', 'certain', 'such', 'other', 'another', 'same', 'own', 'first', 'second', 'third',
])

function isContent(t: string): boolean {
  return /^[a-z][a-z-]*$/.test(t) && t.length > 1 && !STOP.has(t)
}
// Collocation chất lượng: là từ nội dung và KHÔNG phải số đếm/lượng từ
function isGoodColloc(t: string): boolean {
  return isContent(t) && !NUM_QUANT.has(t)
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))]
}

interface DMWord {
  word: string
  score?: number
}

async function datamuse(rel: 'rel_bga' | 'rel_bgb', word: string): Promise<DMWord[]> {
  try {
    const res = await fetch(
      `https://api.datamuse.com/words?${rel}=${encodeURIComponent(word)}&max=30`,
    )
    if (!res.ok) return []
    return (await res.json()) as DMWord[]
  } catch {
    return []
  }
}

// Câu ví dụ + từ loại từ Free Dictionary API (một lần gọi)
async function fetchDictionary(word: string): Promise<{ examples: string[]; pos: string[] }> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    )
    if (!res.ok) return { examples: [], pos: [] }
    const data = (await res.json()) as {
      meanings?: { partOfSpeech?: string; definitions?: { example?: string }[] }[]
    }[]
    const examples: string[] = []
    const pos: string[] = []
    for (const entry of data)
      for (const m of entry.meanings ?? []) {
        if (m.partOfSpeech) pos.push(shortPos(m.partOfSpeech))
        for (const d of m.definitions ?? []) if (d.example) examples.push(d.example)
      }
    return { examples: dedupe(examples).slice(0, 6), pos: dedupe(pos) }
  } catch {
    return { examples: [], pos: [] }
  }
}

// Tìm câu ví dụ chứa một cụm từ (collocation/pattern) hoặc từ khóa — nguồn Tatoeba
export async function searchSentences(query: string, limit = 6): Promise<string[]> {
  const q = query.trim()
  if (q.length < 2) return []
  try {
    const res = await fetch(
      `https://tatoeba.org/en/api_v0/search?query=${encodeURIComponent(q)}&from=eng&sort=relevance`,
    )
    if (!res.ok) return []
    const data = (await res.json()) as { results?: { text?: string }[] }
    const out = (data.results ?? []).map((r) => r.text ?? '').filter(Boolean)
    return dedupe(out).slice(0, limit)
  } catch {
    return []
  }
}

// Bỏ ký hiệu chỗ trống trong pattern (sth/sb/do…) để tìm câu tự nhiên hơn
export function cleanPhrase(p: string): string {
  return p
    .replace(/\b(sth|sb|sthg|something|someone|one's|somebody)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Lấy từ loại (n/v/adj/adv) cho các từ theo tiền tố — dùng cho dropdown gợi ý
export async function fetchPosByPrefix(prefix: string): Promise<Record<string, string>> {
  const p = prefix.trim().toLowerCase()
  if (p.length < 2 || !/^[a-z]+$/.test(p)) return {}
  try {
    const res = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(p)}*&md=p&max=30`,
    )
    if (!res.ok) return {}
    const data = (await res.json()) as { word: string; tags?: string[] }[]
    const map: Record<string, string> = {}
    for (const w of data) {
      const pos = (w.tags ?? []).find((t) => t === 'n' || t === 'v' || t === 'adj' || t === 'adv')
      if (pos && /^[a-z]+$/.test(w.word)) map[w.word] = pos
    }
    return map
  } catch {
    return {}
  }
}

// Lấy đồng thời collocation + pattern + ví dụ cho một từ
export async function fetchEnrichment(word: string): Promise<Enrichment> {
  const w = word.trim().toLowerCase()
  if (!/^[a-z]+$/.test(w)) return { collocations: [], patterns: [], examples: [], pos: [] }

  const [after, before, dict] = await Promise.all([
    datamuse('rel_bga', w), // từ đứng sau
    datamuse('rel_bgb', w), // từ đứng trước
    fetchDictionary(w),
  ])

  // Gộp collocation trước/sau, ưu tiên theo điểm phổ biến (datamuse score) -> cụm hay lên đầu
  const collocs = [
    ...before.filter((x) => isGoodColloc(x.word)).map((x) => ({ t: `${x.word} ${w}`, s: x.score ?? 0 })),
    ...after.filter((x) => isGoodColloc(x.word)).map((x) => ({ t: `${w} ${x.word}`, s: x.score ?? 0 })),
  ].sort((a, b) => b.s - a.s)
  const collocations = dedupe(collocs.map((c) => c.t)).slice(0, 8)

  // Chỉ xét giới từ trong TOP đầu (liên kết mạnh theo datamuse) để tránh pattern nhiễu
  const patterns = dedupe(
    after.slice(0, 12).flatMap((x) => {
      const a = x.word
      if (a === 'to') return [`${w} to do sth`]
      if (PREPS.includes(a)) return [`${w} ${a} sth`]
      return []
    }),
  ).slice(0, 5)

  return { collocations, patterns, examples: dict.examples, pos: dict.pos }
}
