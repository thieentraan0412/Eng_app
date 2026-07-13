import { isMisspelled } from './spellcheck'
import type { GrammarMatch } from './grammarcheck'

// ============================================================
// LocalGrammarService — kiểm tra CẤU TRÚC/ngữ pháp cơ bản OFFLINE.
// Bổ trợ cho LanguageTool (bản free hay bỏ sót). Chạy tức thì, không cần mạng.
// Chỉ giữ các luật ĐỘ CHÍNH XÁC CAO để tránh báo sai:
//   1. Sau "to" nguyên mẫu phải là động từ gốc  (to protected -> to protect)
//   2. Mạo từ a/an theo âm đầu                    (a apple -> an apple)
//   3. Lặp từ liên tiếp                            (the the -> the)
// ============================================================

// Một từ có hợp lệ (có trong từ điển) không — dùng để chắc chắn dạng gốc suy ra là từ thật
function valid(w: string): boolean {
  return w.length >= 2 && !isMisspelled(w)
}

// Suy ra động từ nguyên mẫu từ dạng V-ed / V-ing. Trả null nếu không chắc.
function deriveBase(word: string): string | null {
  const w = word.toLowerCase()
  const cands: string[] = []

  if (w.endsWith('ied') && w.length > 4) {
    cands.push(w.slice(0, -3) + 'y') // studied -> study, tried -> try
  }
  if (w.endsWith('ing') && w.length > 4) {
    const s = w.slice(0, -3)
    cands.push(s, s + 'e') // playing -> play, making -> make
    if (s.length >= 2 && s[s.length - 1] === s[s.length - 2]) cands.push(s.slice(0, -1)) // running -> run
  }
  if (w.endsWith('ed') && w.length > 3) {
    const s = w.slice(0, -2)
    cands.push(s, s + 'e') // wanted -> want, created -> create
    if (s.length >= 2 && s[s.length - 1] === s[s.length - 2]) cands.push(s.slice(0, -1)) // stopped -> stop
  }

  for (const c of cands) {
    if (c !== w && valid(c)) return c
  }
  return null
}

// Từ đứng ngay trước "to" khiến "to" là GIỚI TỪ (sau đó V-ing là đúng) -> bỏ qua luật to+Ving
const TO_IS_PREPOSITION = new Set([
  'forward', 'used', 'object', 'objects', 'due', 'prior', 'committed', 'commit', 'dedicated',
  'addicted', 'around', 'opposed', 'accustomed', 'related', 'close', 'key', 'according',
  'subject', 'devoted', 'get', 'gets', 'got', 'getting', 'look', 'looking', 'looks',
])

// a/an: một số từ có chữ đầu là nguyên âm nhưng ĐỌC như phụ âm (và ngược lại)
const SOUNDS_CONSONANT = new Set([
  'university', 'universities', 'unicorn', 'european', 'one', 'once', 'useful', 'unique',
  'user', 'users', 'uniform', 'unit', 'united', 'usage', 'utensil', 'eulogy', 'euro', 'ukulele',
])
const SOUNDS_VOWEL = new Set(['hour', 'hours', 'honest', 'honor', 'honour', 'heir', 'honorable'])

function startsWithVowelSound(word: string): boolean {
  const w = word.toLowerCase()
  if (SOUNDS_VOWEL.has(w)) return true
  if (SOUNDS_CONSONANT.has(w)) return false
  return /^[aeiou]/.test(w)
}

function keepCase(sample: string, word: string): string {
  return /^[A-Z]/.test(sample) ? word[0].toUpperCase() + word.slice(1) : word
}

// Cho phép lặp lại hợp lệ (had had, that that…)
const ALLOW_DOUBLE = new Set(['had', 'that', 'is'])

interface Tok {
  w: string
  i: number
}

export function checkLocalGrammar(text: string): GrammarMatch[] {
  if (!text.trim()) return []
  const toks: Tok[] = []
  const re = /[A-Za-z]+(?:'[A-Za-z]+)?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) toks.push({ w: m[0], i: m.index })

  const out: GrammarMatch[] = []

  for (let k = 0; k < toks.length; k++) {
    const t = toks[k]
    const lw = t.w.toLowerCase()
    const next = toks[k + 1]

    // --- Luật 1: "to" nguyên mẫu + động từ chia sai ---
    if (lw === 'to' && next) {
      const nw = next.w.toLowerCase()
      const isIng = nw.endsWith('ing')
      const isEd = nw.endsWith('ed')
      const prev = toks[k - 1]?.w.toLowerCase()
      const skipIng = isIng && prev && TO_IS_PREPOSITION.has(prev)
      if (isEd || (isIng && !skipIng)) {
        const base = deriveBase(next.w)
        if (base && base !== nw) {
          out.push({
            offset: next.i,
            length: next.w.length,
            message: `Sau "to" nên dùng động từ nguyên mẫu: "${base}".`,
            errorText: next.w,
            replacements: [keepCase(next.w, base)],
          })
        }
      }
    }

    // --- Luật 2: a / an theo âm đầu ---
    if ((lw === 'a' || lw === 'an') && next && /^[A-Za-z]/.test(next.w)) {
      const vowel = startsWithVowelSound(next.w)
      if (lw === 'a' && vowel) {
        out.push({
          offset: t.i,
          length: t.w.length,
          message: `Trước "${next.w}" (âm nguyên âm) nên dùng "an".`,
          errorText: t.w,
          replacements: [keepCase(t.w, 'an')],
        })
      } else if (lw === 'an' && !vowel) {
        out.push({
          offset: t.i,
          length: t.w.length,
          message: `Trước "${next.w}" (âm phụ âm) nên dùng "a".`,
          errorText: t.w,
          replacements: [keepCase(t.w, 'a')],
        })
      }
    }

    // --- Luật 3: lặp từ liên tiếp ---
    if (next && lw === next.w.toLowerCase() && lw.length > 1 && !ALLOW_DOUBLE.has(lw)) {
      const start = t.i
      const end = next.i + next.w.length
      out.push({
        offset: start,
        length: end - start,
        message: `Lặp từ "${t.w}".`,
        errorText: text.slice(start, end),
        replacements: [t.w],
      })
    }
  }

  return out
}
