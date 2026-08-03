import nspell from 'nspell'
// Nạp từ điển tiếng Anh chuẩn (Hunspell) dưới dạng chuỗi thô, đóng gói kèm app.
// File lấy từ gói dictionary-en (giấy phép: src/data/en-dictionary-LICENSE.txt).
import aff from '../data/en.aff?raw'
import dic from '../data/en.dic?raw'

// ============================================================
// SpellcheckService — kiểm tra chính tả tiếng Anh (offline).
// Dùng nspell + dictionary-en: hiểu số nhiều, chia động từ, v.v.
// Khởi tạo lười (chỉ dựng khi lần đầu cần) để không làm chậm mở app.
//
// HIỆU NĂNG: nspell.suggest() phải quét gần như toàn bộ từ điển để tính
// khoảng cách sửa lỗi, tốn khoảng 150ms cho MỘT từ. Vì vậy ở đây:
//   1. Không bao giờ gọi suggest() cho từ có ký tự ngoài bảng chữ cái tiếng Anh
//      (chữ Việt có dấu…) — từ điển tiếng Anh không có gợi ý nào có nghĩa.
//   2. Nhớ lại kết quả theo từng từ, gõ lại từ cũ không phải tính lại.
// ============================================================

let speller: ReturnType<typeof nspell> | null = null
function getSpeller() {
  if (!speller) speller = nspell(aff, dic)
  return speller
}

// ---------- Bộ nhớ đệm ----------
// Một bài viết thường lặp lại rất nhiều từ, và mỗi lần gõ thêm một ký tự là
// toàn bộ bài được quét lại. Không có đệm thì cùng một từ bị tra hàng trăm lần.
const CACHE_MAX = 4000
const checkCache = new Map<string, boolean>()
const fixCache = new Map<string, string[]>()

function remember<T>(cache: Map<string, T>, key: string, value: T): T {
  if (cache.size >= CACHE_MAX) cache.clear()
  cache.set(key, value)
  return value
}

// ---------- Từ điển cá nhân (bỏ qua) ----------
const IGNORE_KEY = 'ignore_words'
function loadIgnore(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(IGNORE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}
const ignore = loadIgnore()

// Thêm một từ vào danh sách bỏ qua (không báo sai nữa)
export function ignoreWord(word: string): void {
  ignore.add(word.toLowerCase())
  localStorage.setItem(IGNORE_KEY, JSON.stringify([...ignore]))
  checkCache.clear() // kết quả cũ của từ này không còn đúng nữa
}

// Token có chứa ký tự ngoài bảng chữ cái tiếng Anh (chữ Việt có dấu, ký tự lạ)
const NON_ASCII = /[^\x00-\x7F]/
export function isNonEnglish(token: string): boolean {
  return NON_ASCII.test(token)
}

// Một token có phải từ viết sai không
export function isMisspelled(token: string): boolean {
  // Từ đã cho vào "bỏ qua"
  if (ignore.has(token.toLowerCase())) return false
  // Chứa ký tự KHÔNG phải tiếng Anh (dấu tiếng Việt, ký tự lạ…) -> lỗi ngay
  if (isNonEnglish(token)) return true
  if (token.length < 2) return false
  // Từ viết hoa chữ đầu -> coi là TÊN RIÊNG, bỏ qua (không báo lỗi)
  if (/^[A-Z]/.test(token)) return false

  const hit = checkCache.get(token)
  if (hit !== undefined) return hit
  const s = getSpeller()
  return remember(checkCache, token, !s.correct(token) && !s.correct(token.toLowerCase()))
}

// Gợi ý sửa cho một từ sai.
// CHÚ Ý: đây là lời gọi ĐẮT NHẤT của cả module (~150ms mỗi từ chưa có trong đệm).
// Người gọi nên chạy rải ra từng từ một chứ đừng gọi liên tiếp cho cả danh sách.
export function suggestFix(word: string, limit = 4): string[] {
  // Chữ Việt hoặc ký tự lạ: từ điển tiếng Anh không có gợi ý nào có nghĩa.
  // Bỏ qua ở đây tiết kiệm được toàn bộ chi phí quét từ điển.
  if (isNonEnglish(word) || word.length < 2) return []
  const hit = fixCache.get(word)
  if (hit) return hit.slice(0, limit)
  return remember(fixCache, word, getSpeller().suggest(word)).slice(0, limit)
}

// Tách văn bản thành các token (gồm cả chữ có dấu / ký tự lạ để bắt lỗi tiếng Việt)
export function tokenizeWords(text: string): string[] {
  return text.match(/[\p{L}\p{M}']+/gu) ?? []
}
