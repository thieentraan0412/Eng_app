import rawDict from '../data/dictionary.json'
import rawNgrams from '../data/ngrams.json'
import rawThesaurus from '../data/thesaurus.json'

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

// Dựng vốn từ: gộp từ điển + khóa/giá trị n-gram + thesaurus
function buildVocabulary() {
  const pool = new Set<string>()
  Object.keys(rawDict).forEach((w) => pool.add(w))
  Object.keys(ngrams).forEach((w) => pool.add(w))
  Object.values(ngrams).forEach((arr) => arr.forEach((w) => pool.add(w)))
  Object.keys(thesaurus).forEach((w) => pool.add(w))
  Object.values(thesaurus).forEach((arr) => arr.forEach((w) => pool.add(w)))
  pool.forEach((w) => {
    const clean = w.trim().toLowerCase()
    if (/^[a-z]+$/.test(clean)) insert(clean)
  })
}
buildVocabulary()

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
  const out: string[] = []
  collect(node, p, out, limit + 1)
  return out.filter((w) => w !== p).slice(0, limit) // bỏ chính từ đã gõ đủ
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
