// Mưa từ — lựa chọn và kỷ lục lưu theo TỪNG MÁY (localStorage). Bản cài, bản dev và
// web có localStorage riêng; lịch sử đồng bộ nằm ở bảng typing_sessions trên cloud.
import type { RainConfig, RainEntry, RainMode } from '../../services/wordRain'

// ---------- Tốc độ rơi và số mạng (người chơi chọn ở màn chọn bộ từ) ----------
export type RainSpeed = 'slow' | 'normal' | 'fast' | 'faster'

/** mult nhân vào tốc độ rơi và nhịp ra từ mới (1 = như mặc định của game) */
export const SPEEDS: { id: RainSpeed; label: string; mult: number }[] = [
  { id: 'slow', label: 'Chậm', mult: 0.7 },
  { id: 'normal', label: 'Vừa', mult: 1 },
  { id: 'fast', label: 'Nhanh', mult: 1.3 },
  { id: 'faster', label: 'Rất nhanh', mult: 1.6 },
]
export const LIVES_OPTIONS = [1, 3, 5, 10] as const

export const speedOf = (id: string | undefined) => SPEEDS.find((s) => s.id === id) ?? SPEEDS[1]

/** Nguồn từ duy nhất là bộ thẻ Từ vựng (lượt "Ôn các từ bị lỡ" ghi là 'missed'). */
export interface RainSetupState {
  deckId: string
  mode: RainMode
  firstLetter: boolean
  /** Kiểu "Nhìn chữ": hiện thêm nghĩa tiếng Việt dưới từ đang rơi */
  showMeaning: boolean
  speed: RainSpeed
  lives: number
}

/** Mọi thứ cần để bắt đầu một lượt chơi. */
export interface RainLaunch {
  pool: RainEntry[]
  cfg: RainConfig
  kind: 'deck' | 'missed'
  sourceKey: string
  sourceLabel: string
  speed: RainSpeed
  /** Kỷ lục trước lượt này (máy + cloud), để biết có phá kỷ lục không */
  prevBest: number
  speak: boolean
  firstLetter: boolean
  showMeaning: boolean
}

const SETUP_KEY = 'wr_setup_v1'
const SPEAK_KEY = 'wr_speak'
const BEST_KEY = 'wr_best_v1'

export const DEFAULT_SETUP: RainSetupState = {
  deckId: '',
  mode: 'word',
  firstLetter: true,
  showMeaning: true,
  speed: 'normal',
  lives: 5,
}

export function loadSetup(): RainSetupState {
  try {
    const raw = localStorage.getItem(SETUP_KEY)
    if (raw) {
      // Chỉ lấy các trường còn dùng (bản cũ còn lưu kind / folderId / level của nguồn đã bỏ)
      const s = JSON.parse(raw) as Partial<RainSetupState>
      return {
        deckId: typeof s.deckId === 'string' ? s.deckId : DEFAULT_SETUP.deckId,
        mode: s.mode === 'meaning' ? 'meaning' : 'word',
        firstLetter: s.firstLetter !== false,
        showMeaning: s.showMeaning !== false,
        speed: speedOf(s.speed).id,
        lives: LIVES_OPTIONS.find((n) => n === s.lives) ?? DEFAULT_SETUP.lives,
      }
    }
  } catch {
    /* localStorage bị chặn / dữ liệu hỏng -> dùng mặc định */
  }
  return DEFAULT_SETUP
}

export function saveSetup(s: RainSetupState): void {
  try {
    localStorage.setItem(SETUP_KEY, JSON.stringify(s))
  } catch {
    /* bỏ qua */
  }
}

export function loadSpeak(): boolean {
  try {
    return localStorage.getItem(SPEAK_KEY) !== '0'
  } catch {
    return true
  }
}

export function saveSpeak(on: boolean): void {
  try {
    localStorage.setItem(SPEAK_KEY, on ? '1' : '0')
  } catch {
    /* bỏ qua */
  }
}

/**
 * Khoá kỷ lục: kiểu chơi + nguồn từ + tốc độ + số mạng — kỷ lục ở mức dễ không đè mức khó.
 * Mức mặc định (Vừa, 5 mạng) giữ khoá cũ "word:deck:<id>" để kỷ lục có từ trước vẫn còn.
 */
export function bestKey(mode: RainMode, sourceKey: string, speed: string = 'normal', lives = 5): string {
  const base = `${mode}:${sourceKey}`
  return speed === 'normal' && lives === 5 ? base : `${base}:${speed}:${lives}`
}

export function loadBests(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    if (raw) return JSON.parse(raw) as Record<string, number>
  } catch {
    /* bỏ qua */
  }
  return {}
}

export function saveBest(k: string, score: number): void {
  try {
    const all = loadBests()
    if ((all[k] ?? 0) >= score) return
    all[k] = score
    localStorage.setItem(BEST_KEY, JSON.stringify(all))
  } catch {
    /* bỏ qua */
  }
}

/** Màn hẹp (điện thoại) -> ít làn hơn, từ rơi chậm hơn. */
export function isNarrowScreen(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches
}

/** Thiết bị cảm ứng là chính -> phải chạm nút để mở bàn phím ảo (iOS). */
export function isTouchFirst(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}

export function fmtDuration(ms: number): string {
  const sec = Math.round(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m ? `${m} phút ${s.toString().padStart(2, '0')} giây` : `${s} giây`
}

export function fmtScore(n: number): string {
  return n.toLocaleString('vi-VN')
}
