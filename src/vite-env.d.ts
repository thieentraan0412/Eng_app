/// <reference types="vite/client" />

// Khai báo kiểu cho API expose từ preload (window.api)
export interface Cred {
  email: string
  password: string
}

export interface EngMasterApi {
  netStatus: () => Promise<{ online: boolean }>
  saveCred: (data: Cred) => Promise<boolean>
  loadCred: () => Promise<Cred | null>
  clearCred: () => Promise<boolean>
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
