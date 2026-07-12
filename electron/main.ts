import { app, BrowserWindow, ipcMain, safeStorage, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

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
    minWidth: 900,
    minHeight: 600,
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
}

// Ví dụ kênh IPC: kiểm tra kết nối mạng (net:status) — sẽ mở rộng ở các giai đoạn sau
ipcMain.handle('net:status', () => {
  return { online: true }
})

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

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
