import { app, BrowserWindow, ipcMain } from 'electron'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'

type GetMainWindow = () => BrowserWindow | null

type UpdateStatus =
  | { state: 'checking' | 'none' }
  | { state: 'available' | 'ready'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'error'; message: string }

/**
 * Khởi tạo cơ chế cập nhật cho bản desktop đã đóng gói.
 *
 * Trong môi trường dev, các IPC vẫn được đăng ký để UI có thể đọc version,
 * nhưng app không kết nối GitHub Releases hoặc cố cài đặt bản cập nhật.
 */
export function initAutoUpdate(getMainWindow: GetMainWindow) {
  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  let lastStatus: UpdateStatus | null = null

  const sendStatus = (payload: UpdateStatus) => {
    lastStatus = payload
    const window = getMainWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send('update:status', payload)
    }
  }

  autoUpdater.on('checking-for-update', () => {
    sendStatus({ state: 'checking' })
  })
  autoUpdater.on('update-available', (info) => {
    sendStatus({ state: 'available', version: info.version })
  })
  autoUpdater.on('update-not-available', () => {
    sendStatus({ state: 'none' })
  })
  autoUpdater.on('download-progress', (progress) => {
    sendStatus({
      state: 'downloading',
      percent: Math.round(progress.percent),
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    sendStatus({ state: 'ready', version: info.version })
  })
  autoUpdater.on('error', (error) => {
    sendStatus({ state: 'error', message: String(error) })
  })

  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('update:get-status', () => lastStatus)
  ipcMain.handle('update:check', async () => {
    if (!app.isPackaged) return null
    return autoUpdater.checkForUpdates().catch(() => null)
  })
  ipcMain.handle('update:install', () => {
    if (!app.isPackaged) return
    autoUpdater.quitAndInstall()
  })

  if (!app.isPackaged) {
    log.info('Auto-update disabled in development mode')
    return
  }

  // Đợi renderer dựng xong rồi kiểm tra; sau đó kiểm tra lại mỗi 6 giờ.
  setTimeout(() => {
    void autoUpdater.checkForUpdates().catch(() => null)
  }, 8_000)

  setInterval(() => {
    void autoUpdater.checkForUpdates().catch(() => null)
  }, 6 * 60 * 60 * 1_000)
}
