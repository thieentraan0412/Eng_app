// Nhận diện dạng đề IELTS Writing Task 2 bằng từ khóa (offline).
// Thiết kế: Implement/require-tuduy.md mục 6.1
import { ESSAY_TYPES } from '../data/task2MindMap'

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'?\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const SOLUTION_WORDS = ['solution', 'solutions', 'measures', 'solve', 'tackle', 'what can be done', 'how can']
const CAUSE_WORDS = ['causes', 'cause of', 'reasons', 'why is this', 'why do', 'why are']
const PROBLEM_WORDS = ['problems', 'problem', 'issues']

/** Trả về id dạng đề (vd 'type.discuss') hoặc null nếu không đoán được. */
export function detectEssayType(prompt: string): string | null {
  const text = norm(prompt)
  if (text.length < 12) return null
  const has = (k: string) => text.includes(k)

  // Thứ tự quan trọng: dạng có cụm đặc trưng dài trước.
  if (has('discuss both') || (has('some people') && has('while others') && has('discuss'))) return 'type.discuss'
  if (has('positive or negative') || has('positive or a negative')) return 'type.positive'
  if (has('outweigh') || has('advantages and disadvantages') || has('benefits and drawbacks')) return 'type.advdis'

  const hasSolution = SOLUTION_WORDS.some(has)
  if (hasSolution && CAUSE_WORDS.some(has)) return 'type.causes'
  if (hasSolution && PROBLEM_WORDS.some(has)) return 'type.problem'
  if (CAUSE_WORDS.some(has) && (prompt.match(/\?/g) ?? []).length < 2) return 'type.causes'

  if (has('agree')) return 'type.agree'

  // Còn lại: hai câu hỏi trở lên → câu hỏi hai phần.
  if ((prompt.match(/\?/g) ?? []).length >= 2) return 'type.twopart'

  // Dò từ khóa còn lại trong dữ liệu (ưu tiên cụm dài hơn).
  let best: { id: string; len: number } | null = null
  for (const t of ESSAY_TYPES) {
    for (const k of t.keywords) {
      if (has(k) && (!best || k.length > best.len)) best = { id: t.id, len: k.length }
    }
  }
  if (best) return best.id
  if (has('which') && has('better')) return 'type.discuss'
  return null
}
