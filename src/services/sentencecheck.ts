// Chấm câu "Chép câu": so câu người dùng nhập với đáp án tham chiếu.
//  • Chuẩn hóa khoan dung (bỏ dấu câu, gộp khoảng trắng, thường hóa)
//  • Điểm tương đồng = kết hợp trùng token (Jaccard) + tỉ lệ Levenshtein ký tự
//  • Diff theo từ (LCS) -> suy ra từ đúng kế tiếp cần gõ (không lộ cả câu)
//  • Nối chính tả (spellcheck) + ngữ pháp cục bộ (localgrammar)
// (thiết kế: Implement/chepcau.md — Mục 6)

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

export interface NextWordHint {
  word: string // từ đúng kế tiếp cần gõ (giữ nguyên dạng gốc trong đáp án)
  okCount: number // số từ đầu câu người dùng đã gõ khớp đáp án
}

export interface GradeResult {
  status: SentenceStatus
  score: number // 0..1 (độ giống đáp án gần nhất)
  bestAnswer: string // đáp án tham chiếu khớp nhất (để hiển thị)
  diff: DiffToken[] // so người dùng ↔ đáp án khớp nhất
  nextWord: NextWordHint | null // gợi ý 1 từ kế tiếp (null: không còn từ nào thiếu)
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

// Tách từ giống hệt normalize() nhưng giữ nguyên dạng gốc (hoa/thường)
// -> cùng số lượng, cùng thứ tự với tokens(), nên chỉ số dùng chung được.
function rawTokens(text: string): string[] {
  return text.split(/[.,!?;:"“”'’()\-\s]+/).filter(Boolean)
}

// Từ đúng kế tiếp = từ đáp án tại CHỖ SAI ĐẦU TIÊN. Đếm số từ khớp liên tục
// từ đầu (tiền tố đúng) rồi DỪNG ở token 'add'/'del' đầu tiên — token 'same'
// nằm SAU lỗi (do LCS ghép được) không được tính là "đúng từ đầu", nếu không
// gợi ý sẽ mâu thuẫn với từ được tô đỏ trong ô nhập.
// Trả null khi người dùng chỉ THỪA từ ở cuối (đã gõ hết đáp án).
function nextWordHint(diff: DiffToken[], ref: string): NextWordHint | null {
  const raw = rawTokens(ref)
  let okCount = 0 // số từ ĐÚNG LIÊN TỤC tính từ đầu câu
  for (const t of diff) {
    if (t.op === 'same') {
      okCount++
      continue
    }
    // Chỗ lệch đầu tiên: từ đúng cần gõ là từ đáp án thứ okCount (0-based).
    // Đã gõ hết số từ của đáp án -> chỉ là thừa từ, không gợi ý.
    return okCount < raw.length ? { word: raw[okCount], okCount } : null
  }
  return null
}

// Một đoạn của câu người dùng để tô màu trong ô nhập (lớp phủ)
export interface WrongSegment {
  text: string
  wrong: boolean // true = từ gõ SAI VỊ TRÍ so với đáp án (tô đỏ)
}

// Cùng tập ký tự ngăn cách với normalize() -> mỗi "từ" khớp đúng 1 token
// của tokens(), nên chỉ số op dùng chung được với diff.
const WORD_RE = /[^\s.,!?;:"“”'’()\-]+/g

// Chia câu người dùng thành các đoạn (từ + dấu ngăn cách) để dựng lại y hệt
// trong lớp phủ; từ nào là 'add' theo diff LCS (không khớp vị trí trong đáp án)
// -> wrong=true. Tính lại trực tiếp từ văn bản HIỆN TẠI nên tô màu luôn khớp
// với chữ đang hiển thị, và tự cập nhật khi người dùng sửa.
export function wrongWordSegments(userInput: string, refAnswer: string): WrongSegment[] {
  const diff = wordDiff(tokens(userInput), tokens(refAnswer))
  // Op của từng từ người dùng theo thứ tự. Nếu đáp án thiếu một từ ('del'),
  // đánh dấu từ người dùng ngay sau chỗ thiếu là sai vị trí để người học nhìn
  // thấy chính xác nơi cần chèn từ (VD: thiếu "this" trước "road" -> "road" đỏ).
  const userOps: Array<'same' | 'add'> = []
  let hasMissingBefore = false
  for (const token of diff) {
    if (token.op === 'del') {
      hasMissingBefore = true
      continue
    }
    userOps.push(token.op === 'add' || hasMissingBefore ? 'add' : 'same')
    hasMissingBefore = false
  }

  const segs: WrongSegment[] = []
  let last = 0
  let wi = 0
  let m: RegExpExecArray | null
  WORD_RE.lastIndex = 0
  while ((m = WORD_RE.exec(userInput)) !== null) {
    if (m.index > last) segs.push({ text: userInput.slice(last, m.index), wrong: false })
    segs.push({ text: m[0], wrong: userOps[wi] === 'add' })
    wi++
    last = m.index + m[0].length
  }
  if (last < userInput.length) segs.push({ text: userInput.slice(last), wrong: false })
  return segs
}

// ---------- Đọc từng từ khi gõ (Cài đặt › Chép câu) ----------
// Vị trí trong đáp án của `count` từ cuối người dùng gõ, nếu tất cả đều ĐÚNG
// CHỖ theo diff LCS. Như tô đỏ sau khi chấm, từ khớp nằm ngay sau chỗ THIẾU từ
// (VD bỏ sót "provide") là sai chỗ; riêng khi người dùng đã gõ một từ khác vào
// chỗ đó ("give" thay "provide") thì từ khớp sau nó vẫn tính là đúng chỗ.
// atEnd: chỉ nhận khi đó là TỪ CUỐI của đáp án và câu không thiếu từ nào (từ
// nào của đáp án cũng đã gõ, đúng hoặc sai) — tức người dùng vừa gõ xong cả câu.
function tailMatch(
  userToks: string[],
  refToks: string[],
  count: number,
  atEnd: boolean,
): number[] | null {
  const at: number[] = [] // vị trí trong đáp án của từng từ người dùng (-1 = sai)
  let j = 0
  let extra = 0 // số từ thừa / thiếu kể từ từ khớp gần nhất
  let missing = 0
  let extraAll = 0 // … và tính trên cả câu
  let missingAll = 0
  for (const t of wordDiff(userToks, refToks)) {
    if (t.op === 'add') {
      at.push(-1)
      extra++
      extraAll++
      continue
    }
    if (t.op === 'same') {
      at.push(missing > extra ? -1 : j)
      extra = 0
      missing = 0
    } else {
      missing++
      missingAll++
    }
    j++
  }
  const tail = at.slice(-count)
  if (tail.length < count || tail.includes(-1)) return null
  if (atEnd && (tail[tail.length - 1] !== refToks.length - 1 || missingAll > extraAll)) return null
  return tail
}

// Gõ xong một từ: `typed` là phần chữ tới hết từ đó — trước dấu cách / dấu câu
// / Enter vừa gõ, hoặc (atEnd) tới chữ cuối vừa gõ của từ cuối câu.
// Từ đó đúng chỗ trong một đáp án -> trả về từ đó theo dạng gốc trong đáp án
// (hoa/thường, dấu nháy: "US", "don't") để máy đọc; sai -> null.
export function typedWordMatch(item: SentenceItem, typed: string, atEnd = false): string | null {
  const word = /[^\s.,!?;:"“”()]+$/.exec(typed)?.[0] ?? ''
  const count = tokens(word).length // "don't" = 2 token: don + t
  if (!count) return null
  const userToks = tokens(typed)
  for (const ans of [item.en, ...(item.altAnswers ?? [])]) {
    const at = tailMatch(userToks, tokens(ans), count, atEnd)
    if (!at) continue
    const words = [...ans.matchAll(WORD_RE)]
    const first = words[at[0]]
    const last = words[at[at.length - 1]]
    return ans.slice(first.index ?? 0, (last.index ?? 0) + last[0].length)
  }
  return null
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

  const diff = wordDiff(tokens(userInput), tokens(best))

  return {
    status,
    score,
    bestAnswer: best,
    diff,
    nextWord: nextWordHint(diff, best),
    spell: spellHints(userInput),
    grammar: checkLocalGrammar(userInput).slice(0, 8),
  }
}
