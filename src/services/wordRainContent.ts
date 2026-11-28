// Game Mưa từ — dựng danh sách từ để rơi từ bộ thẻ Từ vựng.
// Mỗi mục có `key` (chữ thường, thứ người chơi phải gõ) và `text` (chữ hiển thị,
// CÙNG ĐỘ DÀI với key — chỉ khác hoa/thường) để tô phần đã gõ theo đúng vị trí.
import type { Card } from './cloud/CloudApiClient'
import type { RainEntry } from './wordRain'
import { sanitizeEnglishInput } from './englishInput'

/** Một lượt chơi cần tối thiểu từng này từ (riêng "Ôn các từ bị lỡ" chỉ cần 1). */
export const MIN_POOL = 5

// Chuẩn hoá chữ hiển thị: dấu nháy/gạch "thông minh" về ASCII, gộp khoảng trắng.
function tidy(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[‘’ʼ´`]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Khoá để so khi gõ: như chữ hiển thị nhưng viết thường. */
export function typingKey(s: string): string {
  return tidy(s).toLowerCase()
}

/** Chữ người chơi gõ vào ô -> dạng so được với key (hạ dấu, bỏ xuống dòng, viết thường). */
export function sanitizeTyping(raw: string): string {
  return sanitizeEnglishInput(raw.replace(/[\r\n]+/g, '')).toLowerCase()
}

const PLAYABLE = /^[a-z](?:[a-z' -]*[a-z])?$/

/** Khoá có chơi được không: chỉ chữ cái, nháy, gạch, dấu cách; 2–20 ký tự (điện thoại 16); ≤ 3 từ. */
export function isPlayableKey(key: string, narrow = false): boolean {
  if (key.length < 2 || key.length > (narrow ? 16 : 20)) return false
  if (!PLAYABLE.test(key)) return false
  return key.split(' ').length <= 3
}

// Từ "giữ chỗ" trong mục từ vựng: "look after sb", "take care of sth"…
const PLACEHOLDERS = new Set(['sth', 'sb', 'smb', 'smth', 'someone', 'something', 'somebody', "one's", "someone's", "sb's"])

/** Làm sạch chữ của một thẻ từ vựng: dòng đầu, bỏ ngoặc, lấy phương án đầu, bỏ từ giữ chỗ. */
export function cleanWord(raw: string): string {
  let s = (raw || '').split(/\r?\n/)[0] || ''
  s = s.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
  s = s.split(/[\/,;|]/)[0] || ''
  s = tidy(s)
    .split(' ')
    .filter((w) => !PLACEHOLDERS.has(w.toLowerCase().replace(/[.]/g, '')))
    .join(' ')
  return s.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '')
}

/** Nghĩa ngắn để hiện khi từ đang rơi: dòng đầu, bỏ nhãn từ loại ở đầu, ≤ 40 ký tự. */
export function cleanMeaning(raw: string | null | undefined): string {
  let s = tidy((raw || '').split(/\r?\n/)[0] || '')
  // "(n) …", "(adj): …", "n. …", "v: …", "[noun] …"
  s = s.replace(/^\s*[([]?\s*(n|v|adj|adv|prep|conj|phr|phrv|pron|noun|verb|adjective|adverb)\s*[)\].:]+\s*/i, '')
  s = s.replace(/^[-–:•\s]+/, '').trim()
  if (s.length > 40) s = s.slice(0, 39).trimEnd() + '…'
  return s
}

function makeEntry(text: string, extra: Partial<RainEntry> = {}): RainEntry {
  const t = tidy(text)
  return { key: t.toLowerCase(), text: t, ...extra }
}

/** Từ bộ thẻ. Kiểu "meaning" chỉ lấy thẻ có nghĩa. Bỏ trùng theo khoá. */
export function entriesFromCards(cards: Card[], mode: 'word' | 'meaning', narrow = false): RainEntry[] {
  const seen = new Set<string>()
  const out: RainEntry[] = []
  for (const c of cards) {
    const text = cleanWord(c.word)
    const e = makeEntry(text, { cardId: c.id })
    if (!isPlayableKey(e.key, narrow) || seen.has(e.key)) continue
    const meaning = cleanMeaning(c.meaning)
    if (mode === 'meaning' && !meaning) continue
    if (meaning) e.meaning = meaning
    seen.add(e.key)
    out.push(e)
  }
  return out
}

export interface MaskCell {
  ch: string
  typed: boolean
  space: boolean
}

/**
 * Mặt nạ gợi ý ở kiểu "Nhìn nghĩa": chữ đã gõ hiện ra; chữ cái đầu mỗi từ hiện sẵn
 * (nếu bật gợi ý); còn lại là dấu chấm giữa. Giữ khoảng trắng để thấy số từ.
 */
export function hintMask(key: string, typedLen: number, firstLetter: boolean): MaskCell[] {
  const cells: MaskCell[] = []
  for (let i = 0; i < key.length; i++) {
    const ch = key[i]
    if (ch === ' ') {
      cells.push({ ch: ' ', typed: i < typedLen, space: true })
      continue
    }
    const typed = i < typedLen
    const show = typed || /['-]/.test(ch) || (firstLetter && (i === 0 || key[i - 1] === ' '))
    cells.push({ ch: show ? ch : '·', typed, space: false })
  }
  return cells
}
