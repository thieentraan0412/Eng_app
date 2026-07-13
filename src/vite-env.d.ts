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
}

export interface EngMasterApi {
  netStatus: () => Promise<{ online: boolean }>
  saveCred: (data: Cred) => Promise<boolean>
  loadCred: () => Promise<Cred | null>
  clearCred: () => Promise<boolean>

  // Dịch nhanh toàn màn hình
  setDesktopTranslate: (enabled: boolean) => Promise<boolean>
  onQuickSave: (cb: (entry: SaveEntry) => void) => () => void
  onDesktopTranslateText: (cb: (text: string) => void) => () => void
  requestDesktopText: () => Promise<string>
  setDesktopHover: (interactive: boolean) => Promise<boolean>
  saveDesktopTranslate: (entry: SaveEntry) => Promise<boolean>
  closeDesktopTranslate: () => Promise<boolean>
}

declare global {
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
