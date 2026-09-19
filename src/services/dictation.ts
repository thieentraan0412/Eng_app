// ============================================================
// NGHE–CHÉP (dictation) — điều khiển lượt đọc của máy:
//  • Tốc độ đọc: 0,5× … 1,5×
//  • Nghe lại: 1 lần / 2 lần / lặp lại tới khi gõ đúng
// Mỗi lúc chỉ có MỘT câu đang được đọc (speechSynthesis dùng chung), nên
// trạng thái để ở cấp module: bắt đầu đọc câu mới là tự dừng câu cũ.
// ============================================================
import { speak, stopSpeaking, ttsSupported } from './tts'

export const DICT_RATES = [0.5, 0.75, 1, 1.25, 1.5] as const
export type DictRate = (typeof DICT_RATES)[number]

// 1 / 2 = đọc đúng số lần đó rồi thôi; 'loop' = đọc lại mãi tới khi gõ đúng
// hoặc chuyển sang câu khác.
export type DictRepeat = 1 | 2 | 'loop'

// Trạng thái báo về cho thẻ câu để đổi nút "Nghe" ↔ "Dừng" và hiện lượt thứ mấy.
export type DictState = {
  playing: boolean
  round: number // lượt đọc hiện tại (1, 2, 3…)
  total: number | null // null = lặp vô hạn
}

const IDLE: DictState = { playing: false, round: 0, total: null }

// Nghỉ giữa hai lượt đọc để người học kịp gõ nốt câu vừa nghe.
const GAP_MS = 900

const RATE_KEY = 'sc_dict_rate'
const REPEAT_KEY = 'sc_dict_repeat'

export function loadRate(): DictRate {
  const n = Number(localStorage.getItem(RATE_KEY))
  return (DICT_RATES as readonly number[]).includes(n) ? (n as DictRate) : 1
}
export function saveRate(r: DictRate): void {
  localStorage.setItem(RATE_KEY, String(r))
}
export function loadRepeat(): DictRepeat {
  const v = localStorage.getItem(REPEAT_KEY)
  if (v === '2') return 2
  if (v === 'loop') return 'loop'
  return 1
}
export function saveRepeat(r: DictRepeat): void {
  localStorage.setItem(REPEAT_KEY, String(r))
}

type Session = {
  owner: string // id câu đang được đọc
  round: number
  total: number | null
  timer: ReturnType<typeof setTimeout> | null
  stopped: boolean
  onState?: (s: DictState) => void
}

let current: Session | null = null

function end(s: Session): void {
  if (s.stopped) return
  s.stopped = true
  if (s.timer) clearTimeout(s.timer)
  s.timer = null
  if (current === s) current = null
  s.onState?.(IDLE)
}

// Dừng hẳn lượt đọc đang chạy (nếu có)
export function stopDictation(): void {
  if (current) end(current)
  stopSpeaking()
}

// Đang đọc câu KHÁC thì dừng — dùng khi người học chuyển sang câu khác.
export function stopDictationExcept(owner: string): void {
  if (current && current.owner !== owner) stopDictation()
}

// Dừng đúng câu này (chấm đúng, rời thẻ…). Câu khác đang đọc thì để yên.
export function stopDictationOf(owner: string): void {
  if (current && current.owner === owner) stopDictation()
}

export function isDictating(owner: string): boolean {
  return !!current && current.owner === owner
}

// Đọc câu `text` cho thẻ `owner`. Gọi lại khi đang đọc -> dừng lượt cũ, đọc lượt mới.
export function playDictation(
  owner: string,
  text: string,
  opts: { rate: number; repeat: DictRepeat; onState?: (s: DictState) => void },
): void {
  stopDictation()
  if (!ttsSupported || !text.trim()) return

  const total = opts.repeat === 'loop' ? null : opts.repeat
  const s: Session = { owner, round: 0, total, timer: null, stopped: false, onState: opts.onState }
  current = s

  const next = () => {
    if (s.stopped || current !== s) return
    s.round += 1
    s.onState?.({ playing: true, round: s.round, total })
    // speak() gọi cancel() trước khi đọc — lượt cũ (nếu còn) bị ngắt, nhưng
    // callback của nó đã bị vô hiệu bằng cờ stopped nên không nối tiếp nhầm.
    // done: onend và onerror của cùng một lượt đều gọi callback này ở vài trình
    // duyệt — không chặn thì một lượt đọc lại xếp hàng hai lượt kế tiếp.
    let done = false
    speak(text, opts.rate, () => {
      if (done || s.stopped || current !== s) return
      done = true
      if (total != null && s.round >= total) {
        end(s)
        return
      }
      s.timer = setTimeout(next, GAP_MS)
    })
  }
  next()
}
