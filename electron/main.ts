import { app, BrowserWindow, globalShortcut, ipcMain, safeStorage, screen, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import {
  initGlobalTranslate,
  disposeGlobalTranslate,
  setDesktopTranslateEnabled,
  isDesktopTranslateEnabled,
} from './globalTranslate'
import { initAutoUpdate } from './updater'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Thư mục build: dist-electron/ (main, preload) và dist/ (renderer)
process.env.APP_ROOT = path.join(__dirname, '..')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

let win: BrowserWindow | null = null
let quickTranslateWin: BrowserWindow | null = null

function createWindow() {
  // Bỏ thanh menu mặc định (File/Edit/View/Window/Help)
  Menu.setApplicationMenu(null)

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    // Cho phép thu nhỏ cửa sổ desktop xuống kích thước điện thoại để các
    // breakpoint responsive (<= 860px) chuyển sang giao diện mobile.
    minWidth: 360,
    minHeight: 500,
    title: 'EngMaster',
    autoHideMenuBar: true,
    // Tự vẽ toàn bộ thanh cửa sổ để có thể thu gọn nó ngay lập tức mà không
    // phải dựng lại BrowserWindow (việc đó sẽ làm mất trang/nội dung đang nhập).
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Phím điều khiển chrome phải bắt ở main để vẫn hoạt động khi con trỏ đang
  // nằm trong input/textarea. Đây là shortcut cục bộ, không chiếm phím toàn hệ thống.
  win.webContents.on('before-input-event', (event, input) => {
    if (
      input.type === 'keyDown' &&
      !input.isAutoRepeat &&
      (input.control || input.meta) &&
      input.shift &&
      input.key.toLowerCase() === 'h'
    ) {
      event.preventDefault()
      win?.webContents.send('window:chrome-toggle')
      return
    }
    if (
      input.type === 'keyDown' &&
      !input.isAutoRepeat &&
      input.key === 'F11' &&
      !input.control &&
      !input.alt
    ) {
      event.preventDefault()
      toggleFullScreen()
    }
  })
  const sendFullScreen = () => {
    if (win && !win.isDestroyed()) win.webContents.send('window:fullscreen-state', win.isFullScreen())
  }
  win.on('enter-full-screen', sendFullScreen)
  win.on('leave-full-screen', sendFullScreen)
  win.on('maximize', () => {
    // Double-click vùng kéo dùng maximize native, không đi qua IPC của nút tự vẽ.
    // Chuẩn hóa lại normal bounds để lần unmaximize sau không rơi về khung mini.
    if (normalizeNativeMaximizeFromMini()) return
    win?.webContents.send('window:maximized-state', true)
  })
  win.on('unmaximize', () => win?.webContents.send('window:maximized-state', false))

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Đóng cửa sổ chính = thoát hẳn app (kể cả khi popup dịch nổi còn sống).
  // Không xóa dòng này: nếu không, `win` sẽ trỏ tới cửa sổ đã hủy và popup
  // giữ tiến trình sống như "bóng ma" (không có main window, không icon taskbar).
  const self = win
  win.on('closed', () => {
    if (win === self) win = null
    disposeGlobalTranslate()
    app.quit()
  })
}

function toggleFullScreen(next?: boolean): boolean {
  if (!win || win.isDestroyed()) return false
  const value = next ?? !win.isFullScreen()
  // Toàn màn hình và mini là hai chế độ loại trừ nhau. Khôi phục cửa sổ gốc
  // trước khi vào fullscreen để F11 lần nữa trở về đúng kích thước ban đầu.
  if (value && boundsBeforeMini) exitMiniMode(true)
  win.setFullScreen(value)
  return value
}

// ---------- Điều khiển thanh cửa sổ tự vẽ ----------
ipcMain.handle('window:minimize', (): boolean => {
  if (!win || win.isDestroyed()) return false
  win.minimize()
  return true
})
ipcMain.handle('window:maximize:toggle', (): boolean => {
  if (!win || win.isDestroyed()) return false
  const wasMini = boundsBeforeMini !== null
  if (wasMini) exitMiniMode(true)
  if (win.isMaximized() && !wasMini) win.unmaximize()
  else if (!win.isMaximized()) win.maximize()
  return win.isMaximized()
})
ipcMain.handle(
  'window:maximized:get',
  (): boolean => !!win && !win.isDestroyed() && win.isMaximized(),
)
ipcMain.handle('window:close', (): boolean => {
  if (!win || win.isDestroyed()) return false
  win.close()
  return true
})

ipcMain.handle('window:fullscreen:toggle', (_e, next?: boolean): boolean => toggleFullScreen(next))
ipcMain.handle(
  'window:fullscreen:get',
  (): boolean => !!win && !win.isDestroyed() && win.isFullScreen(),
)

// Dịch nhanh toàn màn hình: khởi tạo IPC + hook (bật/tắt điều khiển từ Cài đặt)
function setupGlobalTranslate() {
  initGlobalTranslate({
    getMainWindow: () => win,
    devUrl: VITE_DEV_SERVER_URL,
    fileBase: path.join(RENDERER_DIST, 'index.html'),
  })
}

// Ví dụ kênh IPC: kiểm tra kết nối mạng (net:status) — sẽ mở rộng ở các giai đoạn sau
ipcMain.handle('net:status', () => {
  return { online: true }
})

// ---------- Phím tắt toàn cục: bật/tắt Dịch nhanh toàn màn hình ----------
let translateHotkey = '' // accelerator đang đăng ký ('' = chưa có)

function toggleDesktopTranslate() {
  const next = !isDesktopTranslateEnabled()
  setDesktopTranslateEnabled(next)
  // Báo cửa sổ chính: lưu cài đặt + hiện toast + đồng bộ nút trong trang Cài đặt
  if (win && !win.isDestroyed()) {
    win.webContents.send('desktop-translate:state', next)
  }
}

// Đăng ký phím tắt toàn cục (accel rỗng = gỡ bỏ). Trả về true nếu thành công.
// Renderer gọi khi mở app (theo cài đặt đã lưu) và khi người dùng đổi phím tắt.
ipcMain.handle('hotkey:set', (_e, accel: string): boolean => {
  if (translateHotkey) {
    try {
      globalShortcut.unregister(translateHotkey)
    } catch {
      /* bỏ qua */
    }
    translateHotkey = ''
  }
  if (!accel) return true
  try {
    const ok = globalShortcut.register(accel, toggleDesktopTranslate)
    if (ok) translateHotkey = accel
    return ok // false = tổ hợp đã bị app khác chiếm
  } catch {
    return false // accelerator không hợp lệ
  }
})

// ---------- Cửa sổ nổi (Always on Top) + thu gọn kiểu hình-trong-hình ----------
// Mini dùng lại giao diện mobile của app (breakpoint <= 860px) nên không cần
// layout riêng: chỉ thu nhỏ + ghim cửa sổ vào góc màn hình.
// ---------- Dịch nhanh bằng bàn phím: mở modal trong cửa sổ chính ----------
let quickTranslateHotkey = ''

// Cửa sổ mở thẳng ở khổ 2 cột: ô nhập bên trái, kết quả bên phải cao gần hết
// cửa sổ. Không đổi kích thước giữa chừng nên bố cục đứng yên từ đầu tới cuối.
const QUICK_TRANSLATE_SIZE = { width: 1040, height: 740 }

function createQuickTranslateWindow() {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
  const width = Math.min(QUICK_TRANSLATE_SIZE.width, display.workArea.width - 32)
  const height = Math.min(QUICK_TRANSLATE_SIZE.height, display.workArea.height - 32)
  const x = Math.round(display.workArea.x + (display.workArea.width - width) / 2)
  const y = Math.round(display.workArea.y + (display.workArea.height - height) / 2)

  quickTranslateWin = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 360,
    minHeight: 260,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    title: 'Dịch nhanh — EngMaster',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  quickTranslateWin.setAlwaysOnTop(true, 'floating')
  quickTranslateWin.once('ready-to-show', () => {
    quickTranslateWin?.show()
    quickTranslateWin?.focus()
  })
  quickTranslateWin.on('closed', () => {
    quickTranslateWin = null
  })

  if (VITE_DEV_SERVER_URL) {
    void quickTranslateWin.loadURL(`${VITE_DEV_SERVER_URL}?view=quick-translate`)
  } else {
    void quickTranslateWin.loadFile(path.join(RENDERER_DIST, 'index.html'), {
      query: { view: 'quick-translate' },
    })
  }
}

// Phải khớp DEFAULT_QUICK_TRANSLATE_HOTKEY bên src/services/hotkey.ts — main
// không dùng chung module với renderer.
const DEFAULT_QUICK_TRANSLATE_HOTKEY = 'Alt+X'

// Chữ đang bôi đen ở cửa sổ chính, do renderer gửi lên mỗi khi vùng chọn đổi.
// Dùng một lần rồi xoá: mở lại mà không chọn gì mới thì giữ chữ đang gõ dở.
let quickTranslateSeed = ''

function takeQuickTranslateSeed(): string {
  const seed = quickTranslateSeed
  quickTranslateSeed = ''
  return seed
}

// Phím tắt hoạt động kiểu bật/tắt: đang hiện thì bấm lần nữa là ẩn đi. Ẩn chứ
// không đóng hẳn nên lần gọi sau bật lên tức thì, không phải tải lại cửa sổ.
function toggleQuickTranslate() {
  if (!quickTranslateWin || quickTranslateWin.isDestroyed()) {
    createQuickTranslateWindow()
    return
  }
  if (quickTranslateWin.isVisible()) {
    quickTranslateWin.hide()
    return
  }
  quickTranslateWin.show()
  quickTranslateWin.focus()
  quickTranslateWin.webContents.send('quick-translate:focus', takeQuickTranslateSeed())
}

ipcMain.handle('quick-translate:selection', (_e, text: unknown): boolean => {
  quickTranslateSeed = String(text ?? '').slice(0, 1000)
  return true
})

// Lần mở đầu tiên cửa sổ mới tạo xong mới hỏi được chữ mồi.
ipcMain.handle('quick-translate:seed', (): string => takeQuickTranslateSeed())

ipcMain.handle('quick-translate:open', (): boolean => {
  toggleQuickTranslate()
  return true
})

ipcMain.handle('quick-translate:close', (): boolean => {
  if (!quickTranslateWin || quickTranslateWin.isDestroyed()) return false
  quickTranslateWin.close()
  return true
})

ipcMain.handle('quick-translate:hotkey:set', (_e, accel: string): boolean => {
  if (quickTranslateHotkey) {
    try {
      globalShortcut.unregister(quickTranslateHotkey)
    } catch {
      /* bỏ qua */
    }
    quickTranslateHotkey = ''
  }
  if (!accel) return true
  try {
    const ok = globalShortcut.register(accel, toggleQuickTranslate)
    if (ok) quickTranslateHotkey = accel
    return ok
  } catch {
    return false
  }
})

const MINI_W = 420
const MINI_H = 640
const MINI_MARGIN = 24

// Kích thước/vị trí trước khi thu gọn — null nghĩa là đang ở cửa sổ thường
let boundsBeforeMini: Electron.Rectangle | null = null
// Trạng thái "luôn nổi" trước khi thu gọn, để trả lại nguyên trạng khi thoát mini
let onTopBeforeMini = false
let maximizedBeforeMini = false

type WindowState = { alwaysOnTop: boolean; mini: boolean }

function currentWindowState(): WindowState {
  return {
    alwaysOnTop: !!win && !win.isDestroyed() && win.isAlwaysOnTop(),
    mini: boundsBeforeMini !== null,
  }
}

function sendWindowState() {
  if (win && !win.isDestroyed()) win.webContents.send('window:state', currentWindowState())
}

function exitMiniMode(restoreWindow: boolean) {
  if (!boundsBeforeMini) return
  const restoreBounds = boundsBeforeMini
  const restoreMaximized = maximizedBeforeMini
  boundsBeforeMini = null
  setAlwaysOnTop(onTopBeforeMini)
  if (restoreWindow && win && !win.isDestroyed()) {
    if (win.isMaximized()) win.unmaximize()
    win.setBounds(restoreBounds, false)
    if (restoreMaximized) win.maximize()
  }
  sendWindowState()
}

function normalizeNativeMaximizeFromMini(): boolean {
  if (!boundsBeforeMini || !win || win.isDestroyed()) return false
  const restoreBounds = boundsBeforeMini
  boundsBeforeMini = null
  setAlwaysOnTop(onTopBeforeMini)

  // Đặt lại kích thước thường rồi maximize lại. Nhờ vậy Windows ghi nhớ đúng
  // normal bounds trước mini cho thao tác khôi phục sau này.
  win.unmaximize()
  win.setBounds(restoreBounds, false)
  sendWindowState()
  setImmediate(() => {
    if (win && !win.isDestroyed()) win.maximize()
  })
  return true
}

function setAlwaysOnTop(on: boolean) {
  if (!win || win.isDestroyed()) return false
  // 'floating': nổi trên cửa sổ ứng dụng khác nhưng vẫn dưới menu/thanh hệ thống
  win.setAlwaysOnTop(on, 'floating')
  return win.isAlwaysOnTop()
}

// Bật/tắt cửa sổ luôn nổi trên các ứng dụng khác
ipcMain.handle('window:always-on-top', (_e, on: boolean): boolean => setAlwaysOnTop(on))

// ---------- Phím tắt toàn cục: bật/tắt "Luôn nổi trên cùng" ----------
let alwaysOnTopHotkey = ''

function toggleAlwaysOnTopByHotkey() {
  if (!win || win.isDestroyed() || boundsBeforeMini !== null) return
  const next = setAlwaysOnTop(!win.isAlwaysOnTop())
  win.webContents.send('window:always-on-top-state', next)
}

ipcMain.handle('window:always-on-top-hotkey:set', (_e, accel: string): boolean => {
  if (alwaysOnTopHotkey) {
    try {
      globalShortcut.unregister(alwaysOnTopHotkey)
    } catch {
      /* bỏ qua */
    }
    alwaysOnTopHotkey = ''
  }
  if (!accel) return true
  try {
    const ok = globalShortcut.register(accel, toggleAlwaysOnTopByHotkey)
    if (ok) alwaysOnTopHotkey = accel
    return ok
  } catch {
    return false
  }
})

// Thu gọn về góc phải-dưới màn hình đang chứa cửa sổ / khôi phục kích thước cũ
ipcMain.handle('window:mini', async (_e, on: boolean): Promise<boolean> => {
  if (!win || win.isDestroyed()) return false
  if (on) {
    if (win.isFullScreen()) {
      await new Promise<void>((resolve) => {
        win?.once('leave-full-screen', () => resolve())
        win?.setFullScreen(false)
      })
      if (!win || win.isDestroyed()) return false
    }
    if (!boundsBeforeMini) {
      maximizedBeforeMini = win.isMaximized()
      boundsBeforeMini = maximizedBeforeMini ? win.getNormalBounds() : win.getBounds()
      onTopBeforeMini = win.isAlwaysOnTop()
    }
    if (win.isMaximized()) win.unmaximize()
    if (win.isMinimized()) win.restore()
    const { workArea } = screen.getDisplayMatching(win.getBounds())
    win.setBounds(
      {
        width: MINI_W,
        height: MINI_H,
        x: workArea.x + Math.max(0, workArea.width - MINI_W - MINI_MARGIN),
        y: workArea.y + Math.max(0, workArea.height - MINI_H - MINI_MARGIN),
      },
      true,
    )
    // Hình-trong-hình thì phải nổi trên mọi ứng dụng khác, không cần bật tay
    setAlwaysOnTop(true)
  } else if (boundsBeforeMini) {
    exitMiniMode(true)
  }
  sendWindowState()
  return boundsBeforeMini !== null
})

// Trạng thái thật của cửa sổ — trang Cài đặt đọc lúc mở để công tắc không lệch
ipcMain.handle('window:get-state', (): WindowState => currentWindowState())

// ---------- Lưu thông tin đăng nhập (mã hóa bằng safeStorage/DPAPI) ----------
const credFile = () => path.join(app.getPath('userData'), 'cred.dat')

interface Cred {
  email: string
  password: string
}

// Lưu email + mật khẩu đã mã hóa vào userData (chỉ giải mã được trên máy này)
ipcMain.handle('cred:save', (_e, data: Cred): boolean => {
  try {
    if (!safeStorage.isEncryptionAvailable()) return false
    const encrypted = safeStorage.encryptString(JSON.stringify(data))
    fs.writeFileSync(credFile(), encrypted)
    return true
  } catch {
    return false
  }
})

// Đọc + giải mã thông tin đăng nhập đã lưu
ipcMain.handle('cred:load', (): Cred | null => {
  try {
    if (!fs.existsSync(credFile())) return null
    const buf = fs.readFileSync(credFile())
    return JSON.parse(safeStorage.decryptString(buf)) as Cred
  } catch {
    return null
  }
})

// Xóa thông tin đăng nhập đã lưu
ipcMain.handle('cred:clear', (): boolean => {
  try {
    if (fs.existsSync(credFile())) fs.unlinkSync(credFile())
    return true
  } catch {
    return false
  }
})

app.whenReady().then(() => {
  createWindow()
  // Có phím mặc định ngay cả trước khi renderer/phiên đăng nhập tải xong.
  // AppLayout sẽ thay bằng lựa chọn đã lưu của người dùng ngay sau khi mount.
  try {
    if (globalShortcut.register(DEFAULT_QUICK_TRANSLATE_HOTKEY, toggleQuickTranslate)) {
      quickTranslateHotkey = DEFAULT_QUICK_TRANSLATE_HOTKEY
    }
  } catch {
    /* tổ hợp đang bị ứng dụng khác chiếm */
  }
  setupGlobalTranslate()
  initAutoUpdate(() => win)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    disposeGlobalTranslate()
    app.quit()
    win = null
  }
})

app.on('before-quit', () => {
  disposeGlobalTranslate()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
