import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

interface Cred {
  email: string
  password: string
}

interface SaveEntry {
  word: string
  meaning: string
  phonetic?: string
  pos?: string // từ loại người dùng đã chọn (n, v, adj…)
  deckId?: string // bộ từ người dùng chọn để lưu vào
}

type UpdateStatus =
  | { state: 'checking' | 'none' }
  | { state: 'available' | 'ready'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'error'; message: string }

// Cầu nối an toàn giữa Renderer (React) và Main.
// Renderer chỉ gọi được đúng các hàm expose ở đây (contextIsolation bật).
contextBridge.exposeInMainWorld('api', {
  // Kiểm tra trạng thái kết nối
  netStatus: (): Promise<{ online: boolean }> => ipcRenderer.invoke('net:status'),

  // Ghi nhớ đăng nhập (mã hóa bằng safeStorage)
  saveCred: (data: Cred): Promise<boolean> => ipcRenderer.invoke('cred:save', data),
  loadCred: (): Promise<Cred | null> => ipcRenderer.invoke('cred:load'),
  clearCred: (): Promise<boolean> => ipcRenderer.invoke('cred:clear'),

  // ----- Cập nhật ứng dụng -----
  checkUpdate: (): Promise<unknown> => ipcRenderer.invoke('update:check'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('update:install'),
  appVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  getUpdateStatus: (): Promise<UpdateStatus | null> => ipcRenderer.invoke('update:get-status'),
  onUpdateStatus: (cb: (status: UpdateStatus) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, status: UpdateStatus) => cb(status)
    ipcRenderer.on('update:status', handler)
    return () => ipcRenderer.removeListener('update:status', handler)
  },

  // ----- Dịch nhanh toàn màn hình -----
  // (Cửa sổ chính) Bật/tắt tính năng tô-chữ-để-dịch trên toàn desktop
  setDesktopTranslate: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('desktop-translate:set', enabled),
  // (Cửa sổ chính) Nghe yêu cầu "Lưu vào bộ từ" đến từ popup toàn cục (kèm bộ từ đã chọn)
  onQuickSave: (cb: (payload: { entry: SaveEntry; deckId?: string }) => void): (() => void) => {
    const h = (_e: IpcRendererEvent, payload: { entry: SaveEntry; deckId?: string }) => cb(payload)
    ipcRenderer.on('vocab:quick-save', h)
    return () => ipcRenderer.removeListener('vocab:quick-save', h)
  },
  // (Cửa sổ chính) Đặt phím tắt toàn cục bật/tắt dịch nhanh (accel rỗng = gỡ bỏ)
  setTranslateHotkey: (accel: string): Promise<boolean> => ipcRenderer.invoke('hotkey:set', accel),
  // (Cửa sổ chính) Nghe trạng thái dịch nhanh đổi do phím tắt (để lưu cài đặt + toast)
  onDesktopTranslateState: (cb: (enabled: boolean) => void): (() => void) => {
    const h = (_e: IpcRendererEvent, on: boolean) => cb(on)
    ipcRenderer.on('desktop-translate:state', h)
    return () => ipcRenderer.removeListener('desktop-translate:state', h)
  },

  // (Cửa sổ popup) Nhận đoạn chữ cần dịch từ main
  onDesktopTranslateText: (cb: (text: string) => void): (() => void) => {
    const h = (_e: IpcRendererEvent, text: string) => cb(text)
    ipcRenderer.on('desktop-translate:text', h)
    return () => ipcRenderer.removeListener('desktop-translate:text', h)
  },
  // (Cửa sổ popup) Hỏi đoạn chữ hiện tại ngay khi vừa mount
  requestDesktopText: (): Promise<string> => ipcRenderer.invoke('desktop-translate:get'),
  // (Cửa sổ popup) Con trỏ vào/ra thẻ -> bật/tắt nhận chuột (vùng trong suốt xuyên qua)
  setDesktopHover: (interactive: boolean): Promise<boolean> =>
    ipcRenderer.invoke('desktop-translate:hover', interactive),
  // (Cửa sổ popup) Lưu từ (kèm bộ từ đã chọn) / đóng popup
  saveDesktopTranslate: (entry: SaveEntry, deckId?: string): Promise<boolean> =>
    ipcRenderer.invoke('desktop-translate:save', { entry, deckId }),
  closeDesktopTranslate: (): Promise<boolean> => ipcRenderer.invoke('desktop-translate:close'),
})
