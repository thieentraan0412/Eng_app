import { BrowserWindow, screen, ipcMain } from 'electron'
import path from 'node:path'

const DEBUG = false // bật log chẩn đoán ra stdout của main process
const log = (...a: unknown[]) => {
  if (DEBUG) console.log('[sentenceReminder]', ...a)
}

// ============================================================
// Nhắc chép câu: cứ mỗi chu kỳ đưa 1 câu CHƯA LÀM XONG của trang "Chép câu" lên
// một cửa sổ nổi trên mọi ứng dụng — đúng thẻ luyện tập để làm ngay tại đó.
//
// Bộ đếm nằm ở main (không nằm ở renderer) vì Chromium hãm timer của cửa sổ
// bị thu nhỏ — mà thu nhỏ EngMaster để làm việc khác lại đúng lúc cần nhắc.
// Chỉ có MỘT timer: mọi lần đổi trạng thái đều xoá timer cũ trước khi đặt mới,
// và mỗi lượt có số `seq` riêng để bỏ qua phản hồi đến muộn của lượt cũ.
//
// Vòng lặp: chờ intervalMs -> hỏi cửa sổ chính câu kế tiếp (nó đã đăng nhập,
// đọc được dữ liệu) -> hiện thẻ -> không bấm vào trong displayMs thì tự ẩn; đã
// bắt đầu làm thì để yên tới khi người dùng đóng / làm đúng -> chờ intervalMs -> …
// ============================================================

// Main chỉ cần mấy trường này; phần còn lại chuyển nguyên cho cửa sổ câu
export interface SentenceReminderContent {
  item: { id: string; vi: string; en: string }
  durationMs: number
  intervalMs: number
  [key: string]: unknown
}

// Cửa sổ chính không trả lời (đang tải lại, mất mạng lâu…) -> bỏ lượt này
const RESPONSE_TIMEOUT = 15_000
// Rộng như thẻ ở trang Luyện tập; chiều cao theo nội dung (cửa sổ câu tự báo)
const OVERLAY_WIDTH = 900
const SCREEN_MARGIN = 24
// Cửa sổ câu chưa kịp báo chiều cao (lần đầu tải trang) -> vẫn hiện sau chừng này
const REVEAL_FALLBACK_MS = 1500

let enabled = false
let intervalMs = 120_000
let displayMs = 30_000
let timer: ReturnType<typeof setTimeout> | null = null
let seq = 0
let content: SentenceReminderContent | null = null
let held = false // người dùng đã bắt đầu làm -> không tự ẩn nữa
let overlayWin: BrowserWindow | null = null
let overlayArea: Electron.Rectangle | null = null // vùng màn hình đặt thẻ lần này
let recenter = false // thẻ mới -> lần báo chiều cao tới thì canh giữa lại
let pendingReveal = false // chờ biết chiều cao rồi mới hiện, khỏi thấy cửa sổ đổi cỡ
let revealTimer: ReturnType<typeof setTimeout> | null = null
let getMainWindow: () => BrowserWindow | null = () => null
let rendererUrl: { devUrl?: string; fileBase?: string } = {}

// Windows không cho app đang chạy nền tự giành bàn phím (cửa sổ chỉ hiện lên,
// phím gõ vẫn vào app đang dùng) — trừ khi chính tiến trình đó vừa gửi phím.
// Nên ngay trước khi kéo thẻ lên trước, gửi một lần "nhả phím F24" qua
// uiohook-napi (đã dùng cho dịch nhanh): phím không ai dùng, chỉ nhả chứ không
// bấm, nên không app nào phản ứng. Thiếu native thì vẫn hiện, chỉ có thể không
// nhận phím ngay.
type KeyPoster = { keyToggle(key: number, toggle: 'down' | 'up'): void }
let keyPoster: { hook: KeyPoster; f24: number } | null | undefined
function allowForeground() {
  if (process.platform !== 'win32') return
  if (keyPoster === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('uiohook-napi') as {
        uIOhook: KeyPoster
        UiohookKey: Record<string, number>
      }
      keyPoster = { hook: mod.uIOhook, f24: mod.UiohookKey.F24 ?? 107 }
    } catch (err) {
      console.error('[sentenceReminder] Không nạp được uiohook-napi:', err)
      keyPoster = null
    }
  }
  try {
    keyPoster?.hook.keyToggle(keyPoster.f24, 'up')
  } catch {
    // Bản uiohook cũ không có keyToggle — thẻ vẫn hiện, chỉ là có thể chưa nhận phím
  }
}

function clearTimer() {
  if (timer) clearTimeout(timer)
  timer = null
}

function setTimer(ms: number, fn: () => void) {
  clearTimer()
  timer = setTimeout(() => {
    timer = null
    fn()
  }, ms)
}

// Bắt đầu chờ tới lượt kế tiếp
function scheduleNext() {
  if (!enabled) return
  log('chờ', intervalMs, 'ms')
  setTimer(intervalMs, requestSentence)
}

// Hết giờ chờ -> xin câu kế tiếp từ cửa sổ chính
function requestSentence() {
  const win = getMainWindow()
  if (!enabled) return
  if (!win || win.isDestroyed()) {
    scheduleNext()
    return
  }
  seq += 1
  log('due seq=', seq)
  win.webContents.send('sentence-reminder:due', seq)
  setTimer(RESPONSE_TIMEOUT, scheduleNext)
}

function ensureOverlay(): BrowserWindow {
  if (overlayWin && !overlayWin.isDestroyed()) return overlayWin

  overlayWin = new BrowserWindow({
    width: OVERLAY_WIDTH,
    height: 380,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    // Nhận bàn phím để gõ bài: hiện lên là giành focus, con trỏ nằm sẵn trong ô nhập
    focusable: true,
    hasShadow: false,
    title: 'Chép câu — EngMaster',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  overlayWin.setAlwaysOnTop(true, 'screen-saver')

  if (rendererUrl.devUrl) {
    void overlayWin.loadURL(`${rendererUrl.devUrl}?view=sentence-reminder`)
  } else if (rendererUrl.fileBase) {
    void overlayWin.loadFile(rendererUrl.fileBase, { search: 'view=sentence-reminder' })
  }

  const win = overlayWin
  win.on('closed', () => {
    // Cửa sổ cũ bị đóng chủ động (xem hideOverlay) -> cửa sổ đang dùng không đổi
    if (overlayWin !== win) return
    overlayWin = null
    // Bị đóng ngang (Alt+F4…) khi đang hiện câu -> coi như bấm đóng, chu kỳ chạy tiếp
    if (content) {
      content = null
      held = false
      scheduleNext()
    }
  })
  return win
}

function sendContent(win: BrowserWindow) {
  win.webContents.send('sentence-reminder:content', content)
}

// Đặt giữa màn hình đang có con trỏ chuột — nơi người dùng đang nhìn. Chưa hiện
// ngay: đợi cửa sổ câu báo chiều cao thật của thẻ (xem fitOverlay).
function showOverlay(next: SentenceReminderContent) {
  const win = ensureOverlay()
  const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  overlayArea = area
  const width = Math.min(OVERLAY_WIDTH, area.width - SCREEN_MARGIN * 2)
  const height = Math.min(380, area.height - SCREEN_MARGIN * 2)
  win.setBounds({
    x: Math.round(area.x + (area.width - width) / 2),
    y: Math.round(area.y + (area.height - height) / 2),
    width,
    height,
  })

  content = next
  held = false
  recenter = true
  pendingReveal = true
  if (revealTimer) clearTimeout(revealTimer)
  revealTimer = setTimeout(reveal, REVEAL_FALLBACK_MS)
  if (win.webContents.isLoading()) win.webContents.once('did-finish-load', () => sendContent(win))
  else sendContent(win)
}

function reveal() {
  if (revealTimer) clearTimeout(revealTimer)
  revealTimer = null
  if (!pendingReveal || !content || !overlayWin || overlayWin.isDestroyed()) return
  pendingReveal = false
  // Hiện lên và giành bàn phím: ô nhập đã đặt sẵn con trỏ nên gõ được ngay
  allowForeground()
  overlayWin.show()
  overlayWin.setAlwaysOnTop(true, 'screen-saver')
  overlayWin.focus()
  overlayWin.webContents.focus()
}

// Cửa sổ câu báo chiều cao thật của thẻ -> co giãn theo, để không có vùng trong
// suốt thừa chắn chuột của ứng dụng bên dưới.
function fitOverlay(height: number) {
  const win = overlayWin
  const area = overlayArea
  if (!content || !win || win.isDestroyed() || !area || !(height > 0)) return
  const b = win.getBounds()
  const h = Math.min(Math.round(height), area.height - SCREEN_MARGIN * 2)
  // Thẻ mới: canh giữa. Thẻ dài ra (hiện kết quả / đáp án): giữ mép trên, chỉ
  // đẩy lên khi tràn đáy màn hình — ô đang gõ không nhảy dưới tay.
  let y = recenter ? Math.round(area.y + (area.height - h) / 2) : b.y
  y = Math.min(y, area.y + area.height - SCREEN_MARGIN - h)
  y = Math.max(y, area.y + SCREEN_MARGIN)
  recenter = false
  win.setBounds({ x: b.x, y, width: b.width, height: h })
  reveal()
}

// Xoá câu trước khi ẩn để lần hiện sau không loé lại câu cũ
function hideOverlay() {
  content = null
  held = false
  pendingReveal = false
  if (revealTimer) clearTimeout(revealTimer)
  revealTimer = null
  if (!overlayWin || overlayWin.isDestroyed()) return
  // Thẻ đang giữ bàn phím: ĐÓNG hẳn cửa sổ để Windows trả bàn phím về app người
  // dùng đang dùng trước đó. Chỉ ẩn thì Chromium không kích hoạt cửa sổ nào khác
  // và phím gõ rơi vào cửa sổ đã ẩn. Lần hiện sau tạo cửa sổ mới. Đóng ở nhịp
  // sau để IPC đang trả lời (VD lệnh "đóng" từ chính thẻ) kịp về tới nơi.
  if (overlayWin.isFocused()) {
    const win = overlayWin
    overlayWin = null
    setTimeout(() => {
      if (!win.isDestroyed()) win.destroy()
    }, 0)
    return
  }
  sendContent(overlayWin)
  if (overlayWin.isVisible()) overlayWin.hide()
}

function setEnabled(opts: { enabled: boolean; intervalMs?: number; displayMs?: number }) {
  enabled = !!opts.enabled
  if (opts.intervalMs && opts.intervalMs > 0) intervalMs = opts.intervalMs
  if (opts.displayMs && opts.displayMs > 0) displayMs = opts.displayMs
  seq += 1 // phản hồi của lượt đang chờ (nếu có) thành lỗi thời
  log('set enabled=', enabled, 'seq=', seq)
  clearTimer()
  hideOverlay()
  scheduleNext()
  return enabled
}

// ---------- API cho main.ts ----------
export function initSentenceReminder(opts: {
  getMainWindow: () => BrowserWindow | null
  devUrl?: string
  fileBase?: string
}) {
  getMainWindow = opts.getMainWindow
  rendererUrl = { devUrl: opts.devUrl, fileBase: opts.fileBase }

  // (Cửa sổ chính) Bật/tắt theo cài đặt — gọi lúc mở app và khi đổi công tắc
  ipcMain.handle(
    'sentence-reminder:set',
    (_e, opts: { enabled: boolean; intervalMs?: number; displayMs?: number }) => setEnabled(opts),
  )

  // (Cửa sổ chính) Trả lời lượt `due`: câu cần hiện, hoặc null khi không có câu.
  // Trả về true nếu câu thật sự được hiện (renderer mới ghi nhận đã dùng câu đó).
  ipcMain.handle(
    'sentence-reminder:show',
    (_e, answerSeq: number, next: SentenceReminderContent | null): boolean => {
      if (!enabled || answerSeq !== seq) {
        log('bỏ phản hồi lỗi thời seq=', answerSeq, 'hiện tại=', seq)
        return false
      }
      if (!next?.item || !(next.item.vi || next.item.en)) {
        log('không có câu -> bỏ lượt')
        scheduleNext()
        return false
      }
      log('hiện câu', JSON.stringify(next.item.vi))
      showOverlay({ ...next, durationMs: displayMs, intervalMs })
      // Hẹn giờ tự ẩn — bị huỷ ngay khi người dùng bắt đầu làm (sentence-reminder:hold)
      setTimer(displayMs, () => {
        log('hết giờ, chưa làm -> ẩn')
        hideOverlay()
        scheduleNext()
      })
      return true
    },
  )

  // (Cửa sổ câu) Người dùng bấm vào thẻ / bắt đầu gõ -> thôi tự ẩn. Chu kỳ dừng
  // ở đây tới khi thẻ được đóng (sentence-reminder:dismiss).
  ipcMain.handle('sentence-reminder:hold', () => {
    if (!content || held) return false
    held = true
    log('bắt đầu làm -> thôi tự ẩn')
    clearTimer() // lúc thẻ đang hiện, timer duy nhất chính là hẹn giờ tự ẩn
    return true
  })

  // (Cửa sổ câu) Chiều cao thẻ vừa đổi (câu mới, hiện kết quả, xem đáp án…)
  ipcMain.handle('sentence-reminder:resize', (_e, height: number) => {
    fitOverlay(Number(height))
    return true
  })

  // (Cửa sổ câu) Bài làm -> chuyển cho cửa sổ chính lưu lên cloud (nó đã đăng nhập)
  ipcMain.handle('sentence-reminder:progress', (_e, sentenceId: string, record: unknown) => {
    const win = getMainWindow()
    if (!win || win.isDestroyed()) return false
    win.webContents.send('sentence-reminder:progress', sentenceId, record)
    return true
  })

  // (Cửa sổ câu) Bấm đóng / Esc / làm đúng xong -> ẩn, chờ đủ chu kỳ rồi mới sang câu sau
  ipcMain.handle('sentence-reminder:dismiss', () => {
    if (!content) return false
    log('đóng')
    hideOverlay()
    scheduleNext()
    return true
  })

  // (Cửa sổ câu) Vừa mount -> hỏi lại câu hiện tại (tránh rớt tin lần đầu)
  ipcMain.handle('sentence-reminder:get', () => content)
}

export function disposeSentenceReminder() {
  enabled = false
  clearTimer()
  if (revealTimer) clearTimeout(revealTimer)
  revealTimer = null
  content = null
  if (overlayWin && !overlayWin.isDestroyed()) overlayWin.destroy()
  overlayWin = null
}
