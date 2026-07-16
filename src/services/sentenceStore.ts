// Kho lưu "Chép câu": thư mục (folder) + câu, lưu offline bằng localStorage.
// Lần đầu chạy sẽ seed từ dữ liệu mẫu SENTENCES vào một thư mục mặc định.
// (thiết kế: chepcau.md — phần Quản lý & chia thư mục)

import { SENTENCES, type SentenceItem, type CefrLevel } from '../data/sentences'

export type { CefrLevel }

export interface Folder {
  id: string
  name: string
  createdAt: number
}

export interface StoredSentence extends SentenceItem {
  folderId: string
  createdAt: number
}

interface StoreState {
  folders: Folder[]
  sentences: StoredSentence[]
}

const KEY = 'sentence_store_v1'

// ---------- id đơn giản, đủ duy nhất trong app ----------
let seq = 0
function uid(prefix: string): string {
  seq += 1
  return `${prefix}_${Date.now().toString(36)}_${seq}`
}

// ---------- đọc / ghi ----------
function seed(): StoreState {
  const folder: Folder = { id: uid('f'), name: 'Câu mẫu', createdAt: Date.now() }
  const sentences: StoredSentence[] = SENTENCES.map((s, i) => ({
    ...s,
    folderId: folder.id,
    createdAt: Date.now() + i,
  }))
  return { folders: [folder], sentences }
}

function read(): StoreState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState
      if (parsed && Array.isArray(parsed.folders) && Array.isArray(parsed.sentences)) {
        return parsed
      }
    }
  } catch {
    /* hỏng dữ liệu -> seed lại */
  }
  const fresh = seed()
  write(fresh)
  return fresh
}

function write(state: StoreState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

// ---------- Folder ----------
export function listFolders(): Folder[] {
  return read().folders.slice().sort((a, b) => a.createdAt - b.createdAt)
}

export function createFolder(name: string): Folder {
  const state = read()
  const folder: Folder = { id: uid('f'), name: name.trim() || 'Thư mục mới', createdAt: Date.now() }
  state.folders.push(folder)
  write(state)
  return folder
}

export function renameFolder(id: string, name: string): void {
  const state = read()
  const f = state.folders.find((x) => x.id === id)
  if (f) {
    f.name = name.trim() || f.name
    write(state)
  }
}

// Xóa thư mục và toàn bộ câu bên trong
export function deleteFolder(id: string): void {
  const state = read()
  state.folders = state.folders.filter((f) => f.id !== id)
  state.sentences = state.sentences.filter((s) => s.folderId !== id)
  write(state)
}

export function countByFolder(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of read().sentences) out[s.folderId] = (out[s.folderId] ?? 0) + 1
  return out
}

// ---------- Câu ----------
export function listSentences(folderId: string): StoredSentence[] {
  return read()
    .sentences.filter((s) => s.folderId === folderId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export type SentenceInput = {
  vi: string
  en: string
  altAnswers?: string[]
  hints?: string[]
  level?: CefrLevel
  topic?: string
}

export function createSentence(folderId: string, data: SentenceInput): StoredSentence {
  const state = read()
  const item: StoredSentence = {
    id: uid('s'),
    folderId,
    createdAt: Date.now(),
    vi: data.vi.trim(),
    en: data.en.trim(),
    altAnswers: clean(data.altAnswers),
    hints: clean(data.hints),
    level: data.level,
    topic: data.topic?.trim() || undefined,
  }
  state.sentences.push(item)
  write(state)
  return item
}

// Tạo nhiều câu một lần (import) — ghi localStorage 1 lần cho nhanh
export function createSentences(folderId: string, list: SentenceInput[]): number {
  const state = read()
  let n = 0
  for (const data of list) {
    if (!data.vi.trim()) continue
    state.sentences.push({
      id: uid('s'),
      folderId,
      createdAt: Date.now() + n,
      vi: data.vi.trim(),
      en: data.en.trim(),
      altAnswers: clean(data.altAnswers),
      hints: clean(data.hints),
      level: data.level,
      topic: data.topic?.trim() || undefined,
    })
    n += 1
  }
  write(state)
  return n
}

export function updateSentence(id: string, patch: SentenceInput): void {
  const state = read()
  const s = state.sentences.find((x) => x.id === id)
  if (!s) return
  s.vi = patch.vi.trim()
  s.en = patch.en.trim()
  s.altAnswers = clean(patch.altAnswers)
  s.hints = clean(patch.hints)
  s.level = patch.level
  s.topic = patch.topic?.trim() || undefined
  write(state)
}

export function deleteSentence(id: string): void {
  const state = read()
  state.sentences = state.sentences.filter((s) => s.id !== id)
  write(state)
}

function clean(arr?: string[]): string[] | undefined {
  if (!arr) return undefined
  const out = arr.map((x) => x.trim()).filter(Boolean)
  return out.length ? out : undefined
}
