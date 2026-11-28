// ============================================================
// Game Mưa từ — engine thuần (không DOM, không React).
// Từ rơi từ trên xuống; người chơi gõ đúng một từ trước khi nó chạm đáy.
// Toạ độ: y ∈ [0, 1] là tỉ lệ chiều cao vùng chơi (0 = vừa ló khỏi mép trên,
// 1 = chạm vạch đáy), nên tốc độ không phụ thuộc cỡ màn hình hay bàn phím ảo.
// Các hàm sửa trực tiếp state (giữ trong ref) và trả về danh sách sự kiện để
// giao diện vẽ hiệu ứng / đọc từ / lưu kết quả.
// ============================================================

export type RainMode = 'word' | 'meaning'

export interface RainEntry {
  /** Chữ phải gõ (viết thường) */
  key: string
  /** Chữ hiển thị — cùng độ dài với key */
  text: string
  /** Nghĩa tiếng Việt (từ thẻ từ vựng) */
  meaning?: string
  cardId?: string
}

export interface RainItem {
  id: number
  entry: RainEntry
  /** Tâm theo chiều ngang, tỉ lệ bề rộng vùng chơi */
  x: number
  lane: number
  y: number
  /** Số giây để rơi hết vùng chơi (tính lúc sinh) */
  fallSec: number
}

export interface RainConfig {
  mode: RainMode
  narrow: boolean
  lives: number
  wordsPerLevel: number
  /** Hệ số tốc độ người chơi chọn: 1 = vừa; > 1 rơi nhanh hơn và dày hơn; < 1 chậm hơn */
  speed?: number
  /** Chơi hết danh sách một lượt thì dừng (ôn từ bị lỡ); không có = chơi tới khi hết mạng */
  finite?: boolean
}

export type RainPhase = 'ready' | 'countdown' | 'playing' | 'paused' | 'over'

export interface RainState {
  phase: RainPhase
  clockMs: number
  countdownMs: number
  nextSpawnMs: number
  nextId: number
  lastLane: number
  items: RainItem[]
  queue: RainEntry[]
  pool: RainEntry[]
  recent: string[]
  buffer: string
  lives: number
  score: number
  combo: number
  maxCombo: number
  level: number
  cleared: number
  okKeys: number
  badKeys: number
  typedChars: number
  missed: RainEntry[]
  lastHit: RainEntry | null
  ended: 'lives' | 'done' | 'quit' | null
}

export type RainEvent =
  | { t: 'spawn'; item: RainItem }
  | { t: 'hit'; item: RainItem; points: number }
  | { t: 'miss'; item: RainItem }
  | { t: 'bad' }
  | { t: 'level'; level: number }
  | { t: 'over' }

export interface RainSummary {
  score: number
  words: number
  missedCount: number
  maxCombo: number
  level: number
  wpm: number
  /** % phím đúng; null khi chưa gõ phím nào */
  accuracy: number | null
  durationMs: number
  okKeys: number
  badKeys: number
  missed: RainEntry[]
  ended: 'lives' | 'done' | 'quit'
}

export type Rng = () => number

export const COUNTDOWN_MS = 1800 // 3 – 2 – 1, mỗi số 600 ms
const RETRY_MS = 250
const LANES_WIDE = 5
const LANES_NARROW = 3

/** Tốc độ theo cấp: thời gian rơi, khoảng cách sinh từ, số từ tối đa trên màn. */
export function levelParams(level: number, cfg: Pick<RainConfig, 'mode' | 'narrow' | 'speed'>) {
  const L = Math.max(1, level)
  let fallSec = Math.max(3.5, 11 * Math.pow(0.92, L - 1))
  let spawnSec = Math.max(0.6, 2.6 * Math.pow(0.9, L - 1))
  if (cfg.narrow) {
    fallSec *= 1.25
    spawnSec *= 1.15
  }
  if (cfg.mode === 'meaning') {
    fallSec *= 1.3
    spawnSec *= 1.2
  }
  // Tốc độ người chơi chọn: rơi nhanh hơn thì từ mới cũng ra dày hơn cùng tỉ lệ
  const speed = cfg.speed && cfg.speed > 0 ? cfg.speed : 1
  fallSec /= speed
  spawnSec /= speed
  const maxOnScreen = Math.min(cfg.narrow ? 5 : 8, 3 + Math.ceil(L / 2))
  return { fallSec, spawnSec, maxOnScreen }
}

/** Hệ số combo: ×1 → ×1,5 → ×2 → ×2,5 → ×3, tăng mỗi 5 từ liên tiếp. */
export function comboMult(combo: number): number {
  return 1 + 0.5 * Math.min(4, Math.floor(Math.max(0, combo - 1) / 5))
}

function shuffled<T>(list: T[], rng: Rng): T[] {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

export function createRain(pool: RainEntry[], cfg: RainConfig, rng: Rng = Math.random): RainState {
  return {
    phase: 'ready',
    clockMs: 0,
    countdownMs: 0,
    nextSpawnMs: 0,
    nextId: 1,
    lastLane: -1,
    items: [],
    queue: shuffled(pool, rng),
    pool: pool.slice(),
    recent: [],
    buffer: '',
    lives: cfg.lives,
    score: 0,
    combo: 0,
    maxCombo: 0,
    level: 1,
    cleared: 0,
    okKeys: 0,
    badKeys: 0,
    typedChars: 0,
    missed: [],
    lastHit: null,
    ended: null,
  }
}

/** Bắt đầu / tiếp tục: đếm ngược 3-2-1 (chạy trong vòng lặp, không dùng setTimeout). */
export function beginCountdown(s: RainState): void {
  if (s.phase === 'over') return
  s.phase = 'countdown'
  s.countdownMs = COUNTDOWN_MS
}

export function pauseRain(s: RainState): void {
  if (s.phase === 'playing' || s.phase === 'countdown') s.phase = 'paused'
}

/** Kết thúc giữa chừng (người chơi bấm thoát). */
export function quitRain(s: RainState): void {
  if (s.phase === 'over') return
  s.phase = 'over'
  s.ended = 'quit'
}

/** Các từ đang rơi khớp phần đã gõ (để tô sáng). */
export function candidatesOf(s: RainState): RainItem[] {
  if (!s.buffer) return []
  return s.items.filter((it) => it.entry.key.startsWith(s.buffer))
}

/** Mục tiêu chính: ứng viên ở thấp nhất (gần đáy nhất). */
export function targetOf(s: RainState): RainItem | null {
  let best: RainItem | null = null
  for (const it of candidatesOf(s)) if (!best || it.y > best.y) best = it
  return best
}

/**
 * Từ "cần gõ" để tô màu và cho pháo nhắm: đang gõ dở thì là mục tiêu của phần đã gõ;
 * chưa gõ gì thì là từ thấp nhất (gần chạm đáy nhất).
 */
export function focusOf(s: RainState): RainItem | null {
  const t = targetOf(s)
  if (t || s.buffer) return t
  let low: RainItem | null = null
  for (const it of s.items) if (!low || it.y > low.y) low = it
  return low
}

// Hai khoá "đụng nhau" khi một khoá là phần đầu của khoá kia (car / card) —
// không thả cùng lúc để gõ xong một từ không bao giờ trúng nhầm từ khác.
function clashes(entry: RainEntry, items: RainItem[], mode: RainMode): boolean {
  for (const it of items) {
    const a = entry.key
    const b = it.entry.key
    if (a.startsWith(b) || b.startsWith(a)) return true
    if (mode === 'meaning' && entry.meaning && entry.meaning === it.entry.meaning) return true
  }
  return false
}

function pickEntry(s: RainState, cfg: RainConfig, rng: Rng): RainEntry | null {
  if (!s.queue.length) {
    if (cfg.finite) return null
    s.queue = shuffled(s.pool, rng)
  }
  const recentCap = Math.min(4, Math.max(0, s.pool.length - 1))
  const recent = new Set(s.recent.slice(-recentCap))
  let fallback = -1
  for (let i = 0; i < s.queue.length; i++) {
    const e = s.queue[i]
    if (clashes(e, s.items, cfg.mode)) continue
    if (recent.has(e.key)) {
      if (fallback < 0) fallback = i
      continue
    }
    return s.queue.splice(i, 1)[0]
  }
  return fallback >= 0 ? s.queue.splice(fallback, 1)[0] : null
}

function pickLane(s: RainState, lanes: number, rng: Rng): number {
  const free: number[] = []
  for (let lane = 0; lane < lanes; lane++) {
    // Làn còn trống khi từ mới nhất của làn đó đã rơi quá 28% vùng chơi
    let newest = 1
    for (const it of s.items) if (it.lane === lane) newest = Math.min(newest, it.y)
    if (newest > 0.28) free.push(lane)
  }
  if (!free.length) return -1
  const preferred = free.filter((l) => l !== s.lastLane)
  const from = preferred.length ? preferred : free
  return from[Math.floor(rng() * from.length)]
}

function trySpawn(s: RainState, cfg: RainConfig, rng: Rng): RainItem | null {
  const p = levelParams(s.level, cfg)
  if (s.items.length >= p.maxOnScreen) return null
  const lanes = cfg.narrow ? LANES_NARROW : LANES_WIDE
  const lane = pickLane(s, lanes, rng)
  if (lane < 0) return null
  const entry = pickEntry(s, cfg, rng)
  if (!entry) return null
  const jitter = (rng() - 0.5) * 0.5 // ±25% bề rộng làn
  const x = Math.min(0.94, Math.max(0.06, (lane + 0.5 + jitter) / lanes))
  const lenFactor = Math.min(1.5, 1 + 0.05 * Math.max(0, entry.key.length - 5))
  const item: RainItem = { id: s.nextId++, entry, x, lane, y: 0, fallSec: p.fallSec * lenFactor }
  s.items.push(item)
  s.lastLane = lane
  s.recent.push(entry.key)
  if (s.recent.length > 8) s.recent.shift()
  return item
}

/** Một bước của vòng lặp. dtMs nên được giới hạn (≤ 50 ms) để tab ẩn lâu không làm từ "dịch chuyển tức thời". */
export function stepRain(s: RainState, dtMs: number, cfg: RainConfig, rng: Rng = Math.random): RainEvent[] {
  const events: RainEvent[] = []
  if (s.phase === 'countdown') {
    s.countdownMs -= dtMs
    if (s.countdownMs > 0) return events
    s.phase = 'playing'
    dtMs = -s.countdownMs
    s.countdownMs = 0
  }
  if (s.phase !== 'playing') return events

  s.clockMs += dtMs
  // Rơi + chạm đáy
  for (let i = s.items.length - 1; i >= 0; i--) {
    const it = s.items[i]
    it.y += dtMs / 1000 / it.fallSec
    if (it.y < 1) continue
    s.items.splice(i, 1)
    s.lives = Math.max(0, s.lives - 1)
    s.combo = 0
    if (!s.missed.some((m) => m.key === it.entry.key)) s.missed.push(it.entry)
    // Đưa từ bị lỡ quay lại hàng chờ, 3–6 vị trí phía trước
    const at = Math.min(s.queue.length, 3 + Math.floor(rng() * 4))
    s.queue.splice(at, 0, it.entry)
    events.push({ t: 'miss', item: it })
  }
  // Phần đã gõ không còn khớp từ nào (vì từ đó vừa rơi mất) -> xoá, không phạt
  if (s.buffer && !s.items.some((it) => it.entry.key.startsWith(s.buffer))) s.buffer = ''

  if (s.lives <= 0) {
    s.phase = 'over'
    s.ended = 'lives'
    events.push({ t: 'over' })
    return events
  }
  if (cfg.finite && !s.items.length && !s.queue.length) {
    s.phase = 'over'
    s.ended = 'done'
    events.push({ t: 'over' })
    return events
  }

  // Sinh từ mới
  s.nextSpawnMs -= dtMs
  if (s.nextSpawnMs <= 0) {
    const item = trySpawn(s, cfg, rng)
    if (item) {
      events.push({ t: 'spawn', item })
      s.nextSpawnMs = levelParams(s.level, cfg).spawnSec * 1000
    } else {
      s.nextSpawnMs = RETRY_MS
    }
  }
  return events
}

/**
 * Gõ một ký tự (đã chuẩn hoá, viết thường).
 *  - 'skip': dấu cách khi chưa gõ gì (bàn phím điện thoại hay tự chèn) — bỏ qua, không phạt
 *  - 'ok'  : khớp phần đầu của ít nhất một từ đang rơi
 *  - 'hit' : gõ xong một từ -> từ nổ, cộng điểm, phần đã gõ về rỗng
 *  - 'bad' : không khớp từ nào -> ký tự bị từ chối, tính lỗi, mất combo
 */
export function typeChar(s: RainState, c: string, cfg: RainConfig): { kind: 'skip' | 'ok' | 'hit' | 'bad'; events: RainEvent[] } {
  const events: RainEvent[] = []
  if (s.phase !== 'playing') return { kind: 'skip', events }
  if (c === ' ' && !s.buffer) return { kind: 'skip', events }
  const next = s.buffer + c
  const hit = s.items.find((it) => it.entry.key === next)
  if (hit) {
    s.okKeys++
    s.items = s.items.filter((it) => it !== hit)
    s.buffer = ''
    s.combo++
    s.maxCombo = Math.max(s.maxCombo, s.combo)
    const letters = hit.entry.key.replace(/ /g, '').length
    const points = Math.round((10 * letters + 5 * (s.level - 1)) * comboMult(s.combo))
    s.score += points
    s.cleared++
    s.typedChars += hit.entry.key.length
    s.lastHit = hit.entry
    events.push({ t: 'hit', item: hit, points })
    if (s.cleared % cfg.wordsPerLevel === 0) {
      s.level++
      events.push({ t: 'level', level: s.level })
    }
    return { kind: 'hit', events }
  }
  if (s.items.some((it) => it.entry.key.startsWith(next))) {
    s.okKeys++
    s.buffer = next
    return { kind: 'ok', events }
  }
  markBad(s)
  events.push({ t: 'bad' })
  return { kind: 'bad', events }
}

/** Một phím sai (kể cả ký tự gõ thêm sau ký tự sai khi bộ gõ đang soạn chữ). */
export function markBad(s: RainState): void {
  if (s.phase !== 'playing') return
  s.badKeys++
  s.combo = 0
}

/** Xoá bớt phần đã gõ (Backspace) — không phạt. */
export function trimBuffer(s: RainState, len: number): void {
  if (len < s.buffer.length) s.buffer = s.buffer.slice(0, Math.max(0, len))
}

export function summarizeRain(s: RainState): RainSummary {
  const minutes = Math.max(s.clockMs / 60000, 1 / 6)
  const total = s.okKeys + s.badKeys
  return {
    score: s.score,
    words: s.cleared,
    missedCount: s.missed.length,
    maxCombo: s.maxCombo,
    level: s.level,
    wpm: Math.round(s.typedChars / 5 / minutes),
    accuracy: total ? Math.round((s.okKeys / total) * 100) : null,
    durationMs: Math.round(s.clockMs),
    okKeys: s.okKeys,
    badKeys: s.badKeys,
    missed: s.missed.slice(),
    ended: s.ended ?? 'quit',
  }
}

/** Bộ sinh số ngẫu nhiên có hạt giống (mulberry32) — để kiểm thử cho kết quả cố định. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
