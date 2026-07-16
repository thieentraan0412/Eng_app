// Chấm câu "Chép câu": so câu người dùng nhập với đáp án tham chiếu.
//  • Chuẩn hóa khoan dung (bỏ dấu câu, gộp khoảng trắng, thường hóa)
//  • Điểm tương đồng = kết hợp trùng token (Jaccard) + tỉ lệ Levenshtein ký tự
//  • Diff theo từ (LCS) để tô phần thiếu / thừa
//  • Nối chính tả (spellcheck) + ngữ pháp cục bộ (localgrammar)
// (thiết kế: chepcau.md — Mục 6)

import { isMisspelled, suggestFix, tokenizeWords } from './spellcheck'
import { checkLocalGrammar } from './localgrammar'
import type { GrammarMatch } from './grammarcheck'
import type { SentenceItem } from '../data/sentences'

export type SentenceStatus = 'correct' | 'close' | 'wrong'

export interface DiffToken {
  text: string
  op: 'same' | 'add' | 'del' // add: người dùng thừa · del: đáp án có mà thiếu
}

export interface SpellHint {
  word: string
  suggestions: string[]
}

export interface GradeResult {
  status: SentenceStatus
  score: number // 0..1 (độ giống đáp án gần nhất)
  bestAnswer: string // đáp án tham chiếu khớp nhất (để hiển thị)
  diff: DiffToken[] // so người dùng ↔ đáp án khớp nhất
  spell: SpellHint[] // lỗi chính tả trong câu người dùng
  grammar: GrammarMatch[] // gợi ý ngữ pháp (offline)
}

const CLOSE_THRESHOLD = 0.85

// Chuẩn hóa: thường hóa, bỏ dấu câu, gộp khoảng trắng
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"“”'’()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(text: string): string[] {
  const n = normalize(text)
  return n ? n.split(' ') : []
}

// Levenshtein ký tự (không cắt ngưỡng — câu ngắn nên đủ nhanh)
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  const cur = new Array(n + 1)
  for (let i = 1; i <= m; i++) {
    cur[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = cur.slice()
  }
  return prev[n]
}

// Trùng token kiểu Jaccard (đa tập): |giao| / |hợp|
function tokenOverlap(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1
  if (a.length === 0 || b.length === 0) return 0
  const countA = new Map<string, number>()
  for (const t of a) countA.set(t, (countA.get(t) ?? 0) + 1)
  let inter = 0
  const countB = new Map<string, number>()
  for (const t of b) countB.set(t, (countB.get(t) ?? 0) + 1)
  for (const [t, cb] of countB) {
    const ca = countA.get(t) ?? 0
    inter += Math.min(ca, cb)
  }
  const union = a.length + b.length - inter
  return union === 0 ? 1 : inter / union
}

// Điểm tương đồng tổng hợp giữa hai câu (0..1)
function similarity(user: string, ref: string): number {
  const na = normalize(user)
  const nb = normalize(ref)
  if (!na && !nb) return 1
  if (na === nb) return 1
  const dist = levenshtein(na, nb)
  const charRatio = 1 - dist / Math.max(na.length, nb.length, 1)
  const tokRatio = tokenOverlap(tokens(user), tokens(ref))
  // Nghiêng về trùng token (quan trọng hơn khớp ký tự tuyệt đối)
  return 0.6 * tokRatio + 0.4 * charRatio
}

// Diff theo từ (LCS) giữa token người dùng và đáp án
function wordDiff(userToks: string[], refToks: string[]): DiffToken[] {
  const m = userToks.length
  const n = refToks.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] =
        userToks[i] === refToks[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out: DiffToken[] = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (userToks[i] === refToks[j]) {
      out.push({ text: refToks[j], op: 'same' })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ text: userToks[i], op: 'add' }) // người dùng thừa
      i++
    } else {
      out.push({ text: refToks[j], op: 'del' }) // đáp án có mà thiếu
      j++
    }
  }
  while (i < m) out.push({ text: userToks[i++], op: 'add' })
  while (j < n) out.push({ text: refToks[j++], op: 'del' })
  return out
}

// Lỗi chính tả trong câu người dùng
function spellHints(text: string): SpellHint[] {
  const uniq = [...new Set(tokenizeWords(text))]
  return uniq
    .filter((t) => isMisspelled(t))
    .slice(0, 6)
    .map((w) => ({ word: w, suggestions: suggestFix(w, 3) }))
}

// Chấm một câu: chọn đáp án khớp nhất trong [en, ...altAnswers]
export function gradeSentence(item: SentenceItem, userInput: string): GradeResult {
  const answers = [item.en, ...(item.altAnswers ?? [])]
  let best = answers[0]
  let bestScore = -1
  for (const ans of answers) {
    const s = similarity(userInput, ans)
    if (s > bestScore) {
      bestScore = s
      best = ans
    }
  }

  const exact = answers.some((a) => normalize(a) === normalize(userInput))
  const score = exact ? 1 : Math.max(0, bestScore)

  let status: SentenceStatus
  if (score >= 0.999) status = 'correct'
  else if (score >= CLOSE_THRESHOLD) status = 'close'
  else status = 'wrong'

  return {
    status,
    score,
    bestAnswer: best,
    diff: wordDiff(tokens(userInput), tokens(best)),
    spell: spellHints(userInput),
    grammar: checkLocalGrammar(userInput).slice(0, 8),
  }
}
