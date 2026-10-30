/// <reference types="vite/client" />

import type { SentenceItem } from './data/sentences'

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

// Bài đã làm của 1 câu (cùng dạng PracticeRecord của trang Chép câu)
export interface SentenceReminderProgress {
  answer: string
  status: 'correct' | 'close' | 'wrong' | null
  score: number | null
  revealed: boolean
}

// Một câu hiện trên cửa sổ "Nhắc chép câu" — làm ngay trong thẻ như trang Luyện tập
export interface SentenceReminderContent {
  item: SentenceItem
  folderName: string
  /** Số thứ tự câu trong thư mục (từ 1) — như ở trang Luyện tập */
  index: number
  /** Số câu của thư mục */
  total: number
  /** Số câu chưa đúng 100% còn lại (tính cả câu này) */
  remaining: number
  /** Bài làm dở lần trước (null = chưa làm) */
  progress: SentenceReminderProgress | null
  /** Thông báo kèm theo, VD vừa tự chuyển sang bộ kế tiếp */
  notice?: string
  /** Không bấm vào thẻ trong khoảng này thì tự ẩn — main đặt theo cài đặt */
  durationMs: number
  /** Đóng thẻ rồi thì chờ chừng này mới hiện câu tiếp theo — main đặt theo cài đặt */
  intervalMs: number
}

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
  onWindowState: (
    cb: (state: { alwaysOnTop: boolean; mini: boolean }) => void,
  ) => () => void

  // Thanh cửa sổ tự vẽ + toàn màn hình
  minimizeWindow: () => Promise<boolean>
  toggleMaximizeWindow: () => Promise<boolean>
  getMaximizedWindow: () => Promise<boolean>
  closeWindow: () => Promise<boolean>
  onMaximizedState: (cb: (on: boolean) => void) => () => void
  onWindowChromeToggle: (cb: () => void) => () => void
  getFullScreen: () => Promise<boolean>
  toggleFullScreen: (next?: boolean) => Promise<boolean>
  onFullScreenState: (cb: (on: boolean) => void) => () => void

  // Dịch nhanh toàn màn hình
  setDesktopTranslate: (enabled: boolean) => Promise<boolean>
  setTranslateHotkey: (accel: string) => Promise<boolean>
  onDesktopTranslateState: (cb: (enabled: boolean) => void) => () => void
  setQuickTranslateHotkey: (accel: string) => Promise<boolean>
  openQuickTranslateWindow: () => Promise<boolean>
  closeQuickTranslateWindow: () => Promise<boolean>
  onQuickTranslateFocus: (cb: (seed: string) => void) => () => void
  setQuickTranslateSelection: (text: string) => Promise<boolean>
  getQuickTranslateSeed: () => Promise<string>
  onQuickSave: (cb: (payload: { entry: SaveEntry; deckId?: string }) => void) => () => void
  onDesktopTranslateText: (cb: (text: string) => void) => () => void
  requestDesktopText: () => Promise<string>
  setDesktopHover: (interactive: boolean) => Promise<boolean>
  saveDesktopTranslate: (entry: SaveEntry, deckId?: string) => Promise<boolean>
  closeDesktopTranslate: () => Promise<boolean>

  // Nhắc chép câu (cửa sổ câu lớn nổi trên mọi ứng dụng)
  setSentenceReminder: (opts: {
    enabled: boolean
    intervalMs?: number
    displayMs?: number
  }) => Promise<boolean>
  onSentenceReminderDue: (cb: (seq: number) => void) => () => void
  showSentenceReminder: (seq: number, content: SentenceReminderContent | null) => Promise<boolean>
  onSentenceReminderProgress: (
    cb: (sentenceId: string, record: SentenceReminderProgress) => void,
  ) => () => void
  onSentenceReminderContent: (cb: (content: SentenceReminderContent | null) => void) => () => void
  getSentenceReminderContent: () => Promise<SentenceReminderContent | null>
  dismissSentenceReminder: () => Promise<boolean>
  holdSentenceReminder: () => Promise<boolean>
  resizeSentenceReminder: (height: number) => Promise<boolean>
  saveSentenceReminderProgress: (
    sentenceId: string,
    record: SentenceReminderProgress,
  ) => Promise<boolean>
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
