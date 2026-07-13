import rawDict from '../data/dictionary.json'
import rawNgrams from '../data/ngrams.json'
import rawThesaurus from '../data/thesaurus.json'
import rawDic from '../data/en.dic?raw'

// ============================================================
// SuggestionService — gợi ý từ khi viết (offline, dữ liệu tĩnh).
//  • Autocomplete: cây tiền tố (Trie) dựng từ vốn từ
//  • Next-word: tra n-gram theo từ liền trước
//  • Synonym: tra từ điển đồng nghĩa
// (thiết kế Mục 5.4.1)
// ============================================================

const ngrams = rawNgrams as Record<string, string[]>
const thesaurus = rawThesaurus as Record<string, string[]>

export type SuggestType = 'auto' | 'nextword' | 'synonym'
export interface Suggestion {
  text: string
  type: SuggestType
}

// ---------- Trie (cây tiền tố) cho autocomplete ----------
class TrieNode {
  children = new Map<string, TrieNode>()
  isWord = false
}

const root = new TrieNode()
// Toàn bộ vốn từ (đã lọc) — dùng cho tìm mờ sửa lỗi chính tả
const vocab: string[] = []

function insert(word: string) {
  let node = root
  for (const ch of word) {
    let next = node.children.get(ch)
    if (!next) {
      next = new TrieNode()
      node.children.set(ch, next)
    }
    node = next
  }
  node.isWord = true
}

// Rút danh sách từ gốc từ từ điển Hunspell (en.dic): mỗi dòng "word/FLAGS".
// Chỉ giữ từ thường viết thường (loại tên riêng, số, dấu nháy) cho gợi ý gọn.
function dicWords(): string[] {
  const lines = rawDic.split('\n')
  const out: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const slash = line.indexOf('/')
    const base = (slash === -1 ? line : line.slice(0, slash)).trim()
    if (base.length >= 2 && /^[a-z]+$/.test(base)) out.push(base)
  }
  return out
}

// Dựng vốn từ: từ điển Hunspell đầy đủ + từ điển Anh-Việt + n-gram + thesaurus
function buildVocabulary() {
  const pool = new Set<string>()
  dicWords().forEach((w) => pool.add(w))
  Object.keys(rawDict).forEach((w) => pool.add(w))
  Object.keys(ngrams).forEach((w) => pool.add(w))
  Object.values(ngrams).forEach((arr) => arr.forEach((w) => pool.add(w)))
  Object.keys(thesaurus).forEach((w) => pool.add(w))
  Object.values(thesaurus).forEach((arr) => arr.forEach((w) => pool.add(w)))
  pool.forEach((w) => {
    const clean = w.trim().toLowerCase()
    if (/^[a-z]+$/.test(clean)) {
      insert(clean)
      vocab.push(clean)
    }
  })
}
buildVocabulary()

// ---------- Tìm mờ (sửa lỗi chính tả) ----------
// Khoảng cách Levenshtein có cắt ngưỡng để chạy nhanh trên vốn từ lớn
function levenshtein(a: string, b: string, max: number): number {
  const m = a.length
  const n = b.length
  if (Math.abs(m - n) > max) return max + 1
  let prev = new Array(n + 1)
  let cur = new Array(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    cur[0] = i
    let best = cur[0]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (cur[j] < best) best = cur[j]
    }
    if (best > max) return max + 1 // cắt sớm: cả hàng đã vượt ngưỡng
    const tmp = prev
    prev = cur
    cur = tmp
  }
  return prev[n]
}

// Gợi ý từ đúng gần nhất khi gõ sai chính tả (dựa trên toàn bộ vốn từ)
export function fuzzyCorrect(word: string, limit = 6): string[] {
  const w = word.trim().toLowerCase()
  if (w.length < 3 || !/^[a-z]+$/.test(w)) return []
  const max = w.length >= 7 ? 3 : 2
  const scored: { word: string; d: number }[] = []
  for (const cand of vocab) {
    if (cand === w) continue
    if (cand[0] !== w[0]) continue // lỗi thường giữ nguyên chữ cái đầu
    if (Math.abs(cand.length - w.length) > max) continue
    const d = levenshtein(w, cand, max)
    if (d <= max) scored.push({ word: cand, d })
  }
  scored.sort((a, b) => a.d - b.d || a.word.length - b.word.length || a.word.localeCompare(b.word))
  const out: string[] = []
  for (const s of scored) {
    if (!out.includes(s.word)) out.push(s.word)
    if (out.length >= limit) break
  }
  return out
}

function collect(node: TrieNode, prefix: string, out: string[], limit: number) {
  if (out.length >= limit) return
  if (node.isWord) out.push(prefix)
  for (const [ch, child] of node.children) {
    if (out.length >= limit) break
    collect(child, prefix + ch, out, limit)
  }
}

export function autocomplete(prefix: string, limit = 6): string[] {
  const p = prefix.toLowerCase()
  let node = root
  for (const ch of p) {
    const next = node.children.get(ch)
    if (!next) return []
    node = next
  }
  // Gom nhiều ứng viên rồi xếp hạng: từ ngắn (thông dụng hơn) lên trước
  const out: string[] = []
  collect(node, p, out, 300)
  return out
    .filter((w) => w !== p)
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .slice(0, limit)
}

export function nextWords(word: string, limit = 6): string[] {
  return (ngrams[word.toLowerCase()] ?? []).slice(0, limit)
}

export function synonyms(word: string, limit = 6): string[] {
  return (thesaurus[word.toLowerCase()] ?? []).slice(0, limit)
}

// Tính gợi ý dựa theo văn bản trước con trỏ
export function suggest(textBeforeCaret: string, limit = 7): Suggestion[] {
  // Đang gõ dở một từ?
  const typing = textBeforeCaret.match(/([A-Za-z]+)$/)
  if (typing) {
    const token = typing[1]
    const out: Suggestion[] = []
    if (token.length >= 2) {
      autocomplete(token, limit).forEach((t) => out.push({ text: t, type: 'auto' }))
      // Nếu gõ đúng một từ có đồng nghĩa -> gợi ý từ hay hơn
      synonyms(token, 3).forEach((t) => {
        if (!out.some((s) => s.text === t)) out.push({ text: t, type: 'synonym' })
      })
    }
    return out.slice(0, limit)
  }

  // Vừa gõ xong 1 từ + dấu cách -> gợi ý từ tiếp theo
  const prev = textBeforeCaret.match(/([A-Za-z]+)\s+$/)
  if (prev) {
    return nextWords(prev[1], limit).map((t) => ({ text: t, type: 'nextword' as const }))
  }
  return []
}
