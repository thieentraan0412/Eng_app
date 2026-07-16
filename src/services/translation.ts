import rawDict from '../data/dictionary.json'
import { shortPos } from './enrich'

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

// Tra ĐA NGHĨA online — dùng chế độ từ điển của Google (dt=bd):
// trả về nhiều nghĩa tiếng Việt, gom theo từ loại. Cần internet.
export interface OnlineSense {
  vi: string
  pos?: string // từ loại (tiếng Anh: noun, verb…) nếu API trả về
}

// Động từ bất quy tắc: dạng chia -> nguyên mẫu (để tra nghĩa verb của "paid", "wound"…)
const IRREGULAR: Record<string, string> = {
  was: 'be', were: 'be', been: 'be', began: 'begin', begun: 'begin', bent: 'bend',
  bit: 'bite', bitten: 'bite', blew: 'blow', blown: 'blow', broke: 'break', broken: 'break',
  brought: 'bring', built: 'build', bought: 'buy', caught: 'catch', chose: 'choose',
  chosen: 'choose', came: 'come', cost: 'cost', cut: 'cut', did: 'do', done: 'do',
  drew: 'draw', drawn: 'draw', drank: 'drink', drunk: 'drink', drove: 'drive',
  driven: 'drive', ate: 'eat', eaten: 'eat', fell: 'fall', fallen: 'fall', fed: 'feed',
  felt: 'feel', fought: 'fight', found: 'find', flew: 'fly', flown: 'fly',
  forgot: 'forget', forgotten: 'forget', froze: 'freeze', frozen: 'freeze', got: 'get',
  gotten: 'get', gave: 'give', given: 'give', went: 'go', gone: 'go', grew: 'grow',
  grown: 'grow', hung: 'hang', had: 'have', heard: 'hear', hid: 'hide', hidden: 'hide',
  hit: 'hit', held: 'hold', hurt: 'hurt', kept: 'keep', knew: 'know', known: 'know',
  laid: 'lay', led: 'lead', learnt: 'learn', left: 'leave', lent: 'lend', lay: 'lie',
  lain: 'lie', lit: 'light', lost: 'lose', made: 'make', meant: 'mean', met: 'meet',
  paid: 'pay', put: 'put', quit: 'quit', rode: 'ride', ridden: 'ride', rang: 'ring',
  rung: 'ring', rose: 'rise', risen: 'rise', ran: 'run', said: 'say', saw: 'see',
  seen: 'see', sold: 'sell', sent: 'send', set: 'set', shook: 'shake', shaken: 'shake',
  shone: 'shine', shot: 'shoot', showed: 'show', shown: 'show', shut: 'shut',
  sang: 'sing', sung: 'sing', sank: 'sink', sunk: 'sink', sat: 'sit', slept: 'sleep',
  spoke: 'speak', spoken: 'speak', spent: 'spend', stood: 'stand', stole: 'steal',
  stolen: 'steal', stuck: 'stick', struck: 'strike', swam: 'swim', swum: 'swim',
  swung: 'swing', took: 'take', taken: 'take', taught: 'teach', tore: 'tear',
  torn: 'tear', told: 'tell', thought: 'think', threw: 'throw', thrown: 'throw',
  understood: 'understand', woke: 'wake', woken: 'wake', wore: 'wear', worn: 'wear',
  wove: 'weave', woven: 'weave', won: 'win', wound: 'wind', wrote: 'write',
  written: 'write', sought: 'seek', spread: 'spread', dealt: 'deal', dug: 'dig',
  fled: 'flee', bore: 'bear', borne: 'bear', beat: 'beat', beaten: 'beat',
}

// Đoán TỪ GỐC (lemma) của một dạng chia + từ loại kỳ vọng cho mỗi ứng viên.
// VD: paid -> [pay, v] · cocoons -> [cocoon, n/v] · landed -> [land, v]
function lemmaCandidates(word: string): { lemma: string; pos: string[] }[] {
  const w = normalize(word)
  const out: { lemma: string; pos: string[] }[] = []
  const push = (lemma: string, pos: string[]) => {
    if (lemma.length >= 2 && lemma !== w && !out.some((x) => x.lemma === lemma))
      out.push({ lemma, pos })
  }
  // Ưu tiên ứng viên có trong từ điển offline (chắc chắn là từ thật)
  const best = (cands: string[]) => cands.find((c) => dict[c]) ?? cands[0]

  if (IRREGULAR[w]) push(IRREGULAR[w], ['v'])
  if (w.endsWith('ied')) push(w.slice(0, -3) + 'y', ['v']) // studied -> study
  else if (w.endsWith('ed')) {
    const base = w.slice(0, -2)
    const undouble = /(.)\1$/.test(base) ? base.slice(0, -1) : base // stopped -> stop
    push(best([base, w.slice(0, -1), undouble]), ['v']) // landed/loved/stopped
  }
  if (w.endsWith('ing')) {
    const base = w.slice(0, -3)
    const undouble = /(.)\1$/.test(base) ? base.slice(0, -1) : base // running -> run
    push(best([base, base + 'e', undouble]), ['v']) // weaving -> weave
  }
  if (w.endsWith('ies')) push(w.slice(0, -3) + 'y', ['n', 'v']) // stories -> story
  else if (w.endsWith('es')) push(best([w.slice(0, -1), w.slice(0, -2)]), ['n', 'v'])
  else if (w.endsWith('s') && !w.endsWith('ss')) push(w.slice(0, -1), ['n', 'v'])
  return out
}

export async function translateSenses(word: string): Promise<OnlineSense[]> {
  const senses = await fetchSensesRaw(word)

  // Từ đang tra là DẠNG CHIA (paid, cocoons, landed…) -> Google thường thiếu
  // từ loại gốc. Bổ sung nghĩa của TỪ GỐC cho các từ loại còn thiếu.
  const have = new Set(senses.filter((s) => s.pos).map((s) => shortPos(s.pos!)))
  for (const c of lemmaCandidates(word).slice(0, 2)) {
    const missing = c.pos.filter((p) => !have.has(p))
    if (missing.length === 0) continue
    const extra = (await fetchSensesRaw(c.lemma)).filter(
      (s) => s.pos && missing.includes(shortPos(s.pos)),
    )
    for (const s of extra) have.add(shortPos(s.pos!))
    senses.push(...extra)
  }
  return senses
}

async function fetchSensesRaw(word: string): Promise<OnlineSense[]> {
  try {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&dt=bd&q=' +
      encodeURIComponent(word)
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()

    const senses: OnlineSense[] = []
    const seen = new Set<string>()
    // data[1] = khối từ điển: [[từ loại, [nghĩa 1, nghĩa 2, …], …], …]
    if (Array.isArray(data?.[1])) {
      for (const block of data[1]) {
        const pos = typeof block?.[0] === 'string' ? block[0] : undefined
        const terms: unknown[] = Array.isArray(block?.[1]) ? block[1] : []
        for (const t of terms) {
          if (typeof t !== 'string') continue
          const vi = t.trim()
          if (!vi || seen.has(vi.toLowerCase())) continue
          seen.add(vi.toLowerCase())
          senses.push({ vi, pos })
        }
      }
    }
    // Từ không có trong từ điển (hiếm) -> dùng bản dịch chính làm 1 nghĩa
    if (!senses.length && Array.isArray(data?.[0])) {
      const vi = accept(
        data[0].map((s: unknown[]) => (typeof s?.[0] === 'string' ? s[0] : '')).join(''),
        word,
      )
      if (vi) senses.push({ vi })
    }
    return senses
  } catch {
    return []
  }
}

// Gom các nghĩa online theo từ loại rút gọn (n, v, adj…) — giữ thứ tự API trả về
export interface PosSenses {
  pos: string // đã rút gọn: n, v, adj, adv…
  vis: string[] // các nghĩa tiếng Việt của từ loại đó
}
export function groupSensesByPos(senses: OnlineSense[]): PosSenses[] {
  const map = new Map<string, string[]>()
  for (const s of senses) {
    if (!s.pos) continue
    const p = shortPos(s.pos)
    const arr = map.get(p) ?? []
    if (!arr.includes(s.vi)) arr.push(s.vi)
    map.set(p, arr)
  }
  return [...map.entries()].map(([pos, vis]) => ({ pos, vis }))
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
