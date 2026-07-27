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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Đóng cửa sổ chính = thoát hẳn app (kể cả khi popup dịch nổi còn sống).
  // Không xóa dòng này: nếu không, `win` sẽ trỏ tới cửa sổ đã hủy và popup
  // giữ tiến trình sống như "bóng ma" (không có main window, không icon taskbar).
  win.on('closed', () => {
    win = null
    disposeGlobalTranslate()
    app.quit()
  })
}

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
const MINI_W = 420
const MINI_H = 640
const MINI_MARGIN = 24

// Kích thước/vị trí trước khi thu gọn — null nghĩa là đang ở cửa sổ thường
let boundsBeforeMini: Electron.Rectangle | null = null
// Trạng thái "luôn nổi" trước khi thu gọn, để trả lại nguyên trạng khi thoát mini
let onTopBeforeMini = false

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
ipcMain.handle('window:mini', (_e, on: boolean): boolean => {
  if (!win || win.isDestroyed()) return false
  if (on) {
    if (!boundsBeforeMini) {
      boundsBeforeMini = win.getBounds()
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
    win.setBounds(boundsBeforeMini, true)
    boundsBeforeMini = null
    setAlwaysOnTop(onTopBeforeMini)
  }
  return on
})

// Trạng thái thật của cửa sổ — trang Cài đặt đọc lúc mở để công tắc không lệch
ipcMain.handle('window:get-state', (): { alwaysOnTop: boolean; mini: boolean } => ({
  alwaysOnTop: !!win && !win.isDestroyed() && win.isAlwaysOnTop(),
  mini: boundsBeforeMini !== null,
}))

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
