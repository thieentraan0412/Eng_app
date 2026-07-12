import nspell from 'nspell'
// Nạp từ điển tiếng Anh chuẩn (Hunspell) dưới dạng chuỗi thô, đóng gói kèm app.
// File lấy từ gói dictionary-en (giấy phép: src/data/en-dictionary-LICENSE.txt).
import aff from '../data/en.aff?raw'
import dic from '../data/en.dic?raw'

// ============================================================
// SpellcheckService — kiểm tra chính tả tiếng Anh (offline).
// Dùng nspell + dictionary-en: hiểu số nhiều, chia động từ, v.v.
// Khởi tạo lười (chỉ dựng khi lần đầu cần) để không làm chậm mở app.
// ============================================================

let speller: ReturnType<typeof nspell> | null = null
function getSpeller() {
  if (!speller) speller = nspell(aff, dic)
  return speller
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
}

// Một token có phải từ viết sai không
export function isMisspelled(token: string): boolean {
  // Từ đã cho vào "bỏ qua"
  if (ignore.has(token.toLowerCase())) return false
  // Chứa ký tự KHÔNG phải tiếng Anh (dấu tiếng Việt, ký tự lạ…) -> lỗi ngay
  if (/[^\x00-\x7F]/.test(token)) return true
  if (token.length < 2) return false
  // Từ viết hoa chữ đầu -> coi là TÊN RIÊNG, bỏ qua (không báo lỗi)
  if (/^[A-Z]/.test(token)) return false
  const s = getSpeller()
  return !s.correct(token) && !s.correct(token.toLowerCase())
}

// Gợi ý sửa cho một từ sai
export function suggestFix(word: string, limit = 4): string[] {
  return getSpeller().suggest(word).slice(0, limit)
}

// Tách văn bản thành các token (gồm cả chữ có dấu / ký tự lạ để bắt lỗi tiếng Việt)
export function tokenizeWords(text: string): string[] {
  return text.match(/[\p{L}\p{M}']+/gu) ?? []
}
