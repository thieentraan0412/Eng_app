/// <reference types="vite/client" />

// Khai báo kiểu cho API expose từ preload (window.api)
export interface Cred {
  email: string
  password: string
}

export interface SaveEntry {
  word: string
  meaning: string
  phonetic?: string
  pos?: string // từ loại người dùng đã chọn (n, v, adj…)
  deckId?: string // bộ từ người dùng chọn để lưu vào
}

export type UpdateStatus =
  | { state: 'checking' | 'none' }
  | { state: 'available' | 'ready'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'error'; message: string }

export interface EngMasterApi {
  netStatus: () => Promise<{ online: boolean }>
  saveCred: (data: Cred) => Promise<boolean>
  loadCred: () => Promise<Cred | null>
  clearCred: () => Promise<boolean>

  // Cập nhật ứng dụng
  checkUpdate: () => Promise<unknown>
  installUpdate: () => Promise<void>
  appVersion: () => Promise<string>
  getUpdateStatus: () => Promise<UpdateStatus | null>
  onUpdateStatus: (cb: (status: UpdateStatus) => void) => () => void

  // Cửa sổ (luôn nổi trên cùng / thu gọn hình-trong-hình)
  setAlwaysOnTop: (on: boolean) => Promise<boolean>
  setAlwaysOnTopHotkey: (accel: string) => Promise<boolean>
  onAlwaysOnTopState: (cb: (on: boolean) => void) => () => void
  setMiniWindow: (on: boolean) => Promise<boolean>
  getWindowState: () => Promise<{ alwaysOnTop: boolean; mini: boolean }>

  // Dịch nhanh toàn màn hình
  setDesktopTranslate: (enabled: boolean) => Promise<boolean>
  setTranslateHotkey: (accel: string) => Promise<boolean>
  onDesktopTranslateState: (cb: (enabled: boolean) => void) => () => void
  onQuickSave: (cb: (payload: { entry: SaveEntry; deckId?: string }) => void) => () => void
  onDesktopTranslateText: (cb: (text: string) => void) => () => void
  requestDesktopText: () => Promise<string>
  setDesktopHover: (interactive: boolean) => Promise<boolean>
  saveDesktopTranslate: (entry: SaveEntry, deckId?: string) => Promise<boolean>
  closeDesktopTranslate: () => Promise<boolean>
}

declare global {
  const __APP_VERSION__: string

  interface Window {
    api: EngMasterApi
  }
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
