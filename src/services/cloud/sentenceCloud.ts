// ============================================================
// sentenceCloud — kho "Chép câu" chạy trên Supabase (đồng bộ đa thiết bị).
// Thay cho sentenceStore.ts (localStorage) cũ. Ánh xạ bảng Postgres <-> type
// mà SentencePage đang dùng (Folder / StoredSentence / SentenceInput), và tự
// MIGRATE dữ liệu localStorage cũ lên cloud một lần khi tài khoản chưa có gì.
// ============================================================
import {
  CloudApi,
  type CloudSentenceFolder,
  type CloudSentence,
  type CloudSentenceProgress,
  type SentenceStatus,
} from './CloudApiClient'
import { SENTENCES, type SentenceItem, type CefrLevel } from '../../data/sentences'
import { isMissingSchema } from './cloudError'

export type { CefrLevel }

// ---------- Type app-facing (giữ nguyên như store cũ) ----------
export interface Folder {
  id: string
  name: string
  /** Vị trí kéo thả trong lưới; không có = xếp sau cùng theo ngày tạo */
  position?: number
  createdAt: number
}

export interface StoredSentence extends SentenceItem {
  folderId: string
  createdAt: number
}

export interface SentenceInput {
  vi: string
  en: string
  altAnswers: string[]
  hints: string[]
  level?: CefrLevel
  topic?: string
}

// Một bản ghi bài đã làm của 1 câu
export interface PracticeRecord {
  answer: string
  status: SentenceStatus | null
  score: number | null
  revealed: boolean
  /** Thời điểm lưu lần cuối (ms) — chỉ có khi đọc từ cloud, dùng để nhảy tới câu làm gần nhất */
  updatedAt?: number
}

// ---------- Ánh xạ DB -> app ----------
function folderFromCloud(f: CloudSentenceFolder): Folder {
  return {
    id: f.id,
    name: f.name,
    position: f.position ?? undefined,
    createdAt: Date.parse(f.created_at) || 0,
  }
}

// Theo vị trí đã kéo thả; thư mục chưa có vị trí (mới tạo) xếp sau, theo ngày tạo.
// Sắp ở client để DB chưa có cột position vẫn chạy như cũ.
function sortFolders(rows: CloudSentenceFolder[]): Folder[] {
  return rows
    .map(folderFromCloud)
    .sort(
      (a, b) =>
        (a.position ?? Infinity) - (b.position ?? Infinity) || a.createdAt - b.createdAt,
    )
}

function sentenceFromCloud(s: CloudSentence): StoredSentence {
  return {
    id: s.id,
    folderId: s.folder_id,
    vi: s.vi,
    en: s.en ?? '',
    altAnswers: s.alt_answers ?? undefined,
    hints: s.hints ?? undefined,
    level: (s.level as CefrLevel | null) ?? undefined,
    topic: s.topic ?? undefined,
    createdAt: Date.parse(s.created_at) || 0,
  }
}

// Bỏ phần tử rỗng (textarea tách theo dòng có thể để lại dòng trống)
function cleanList(xs?: string[]): string[] | undefined {
  const out = (xs ?? []).map((x) => x.trim()).filter(Boolean)
  return out.length ? out : undefined
}

function inputToNew(i: { vi: string; en?: string; altAnswers?: string[]; hints?: string[]; level?: CefrLevel; topic?: string }) {
  return {
    vi: i.vi.trim(),
    en: i.en?.trim() || undefined,
    alt_answers: cleanList(i.altAnswers),
    hints: cleanList(i.hints),
    level: i.level || undefined,
    topic: i.topic?.trim() || undefined,
  }
}

// ---------- Folder ----------
export async function listFolders(): Promise<Folder[]> {
  return sortFolders(await CloudApi.listSentenceFolders())
}

export async function createFolder(name: string): Promise<Folder> {
  const f = await CloudApi.createSentenceFolder(name.trim() || 'Thư mục mới')
  return folderFromCloud(f)
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  const folder = await CloudApi.renameSentenceFolder(id, name.trim() || 'Thư mục mới')
  return folderFromCloud(folder)
}

export async function deleteFolder(id: string): Promise<void> {
  await CloudApi.deleteSentenceFolder(id)
}

const NEED_POSITION_SQL =
  'Kho dữ liệu chưa có cột lưu vị trí thư mục. Mở Supabase → SQL Editor, chạy file supabase/sentence_folder_position.sql rồi thử lại.'

// Lưu thứ tự mới: `ordered` là danh sách sau khi kéo thả, còn giữ vị trí cũ
// để chỉ ghi những thư mục thật sự đổi chỗ.
export async function reorderFolders(ordered: Folder[]): Promise<void> {
  const changed = ordered.flatMap((f, i) => (f.position === i ? [] : [{ id: f.id, position: i }]))
  try {
    await CloudApi.setSentenceFolderPositions(changed)
  } catch (e) {
    throw isMissingSchema(e, 'position') ? new Error(NEED_POSITION_SQL) : e
  }
}

export async function countByFolder(): Promise<Record<string, number>> {
  return CloudApi.countSentencesByFolder()
}

// Số câu ĐÃ LÀM (đã chấm) theo từng thư mục — hiện "đã làm x/y" trên thẻ
export async function countDoneByFolder(): Promise<Record<string, number>> {
  return CloudApi.countProgressByFolder()
}

// Số câu chấm ĐÚNG theo từng thư mục — nhãn "n đúng" trên thẻ
export async function countCorrectByFolder(): Promise<Record<string, number>> {
  return CloudApi.countCorrectByFolder()
}

// ---------- Câu ----------
export async function listSentences(folderId: string): Promise<StoredSentence[]> {
  const rows = await CloudApi.listSentences(folderId)
  return rows.map(sentenceFromCloud)
}

// Câu của MỌI thư mục còn dùng được, theo thứ tự thư mục trên lưới rồi theo ngày tạo
export async function listAllSentences(folders: Folder[]): Promise<StoredSentence[]> {
  const order = new Map(folders.map((f, i) => [f.id, i]))
  const rows = await CloudApi.listAllSentences()
  return rows
    .map(sentenceFromCloud)
    .filter((s) => order.has(s.folderId)) // bỏ câu của thư mục đã xoá
    .sort((a, b) => order.get(a.folderId)! - order.get(b.folderId)! || a.createdAt - b.createdAt)
}

export async function createSentence(folderId: string, data: SentenceInput): Promise<void> {
  await CloudApi.createSentence(folderId, inputToNew(data))
}

export async function createSentences(folderId: string, rows: SentenceInput[]): Promise<number> {
  return CloudApi.createSentences(folderId, rows.map(inputToNew))
}

export async function updateSentence(id: string, data: SentenceInput): Promise<void> {
  await CloudApi.updateSentence(id, inputToNew(data))
}

export async function deleteSentence(id: string): Promise<void> {
  await CloudApi.deleteSentence(id)
}

// ---------- Bài đã làm (progress) ----------
// Trả về map sentence_id -> bài đã làm
export async function loadProgress(sentenceIds: string[]): Promise<Record<string, PracticeRecord>> {
  return progressMap(await CloudApi.listProgress(sentenceIds))
}

// Như loadProgress nhưng theo thư mục (bỏ trống = mọi thư mục)
export async function loadProgressByFolder(
  folderId?: string,
): Promise<Record<string, PracticeRecord>> {
  return progressMap(await CloudApi.listProgressByFolder(folderId))
}

function progressMap(rows: CloudSentenceProgress[]): Record<string, PracticeRecord> {
  const map: Record<string, PracticeRecord> = {}
  for (const r of rows) {
    map[r.sentence_id] = {
      answer: r.answer ?? '',
      status: r.status,
      score: r.score,
      revealed: r.revealed,
      updatedAt: Date.parse(r.updated_at) || 0,
    }
  }
  return map
}

export async function saveProgress(sentenceId: string, rec: PracticeRecord): Promise<void> {
  await CloudApi.saveProgress(sentenceId, rec)
}

export async function clearProgress(sentenceIds: string[]): Promise<void> {
  await CloudApi.clearProgress(sentenceIds)
}

// ============================================================
// MIGRATE / SEED — chạy 1 lần khi mở trang.
// - Cloud đã có thư mục  -> dùng luôn (cloud là nguồn chuẩn).
// - Cloud trống + máy còn dữ liệu localStorage cũ (chưa migrate) -> đẩy lên.
// - Cloud trống + không có gì -> seed bộ "Câu mẫu" mặc định.
// ============================================================
const LEGACY_STORE_KEY = 'sentence_store_v1'
const LEGACY_PRACTICE_PREFIX = 'sentence_practice_v1'
const LOCAL_MIGRATED_FLAG = 'sentence_local_migrated' // theo máy, tránh migrate lại

interface LegacyStore {
  folders: { id: string; name: string; createdAt: number }[]
  sentences: (StoredSentence & { folderId: string })[]
}
interface LegacyPractice {
  inputs: Record<string, string>
  results: Record<string, { status?: SentenceStatus; score?: number }>
  revealed: Record<string, boolean>
}

function readLegacyStore(): LegacyStore | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as LegacyStore
    if (p && Array.isArray(p.folders) && Array.isArray(p.sentences)) return p
  } catch {
    /* hỏng -> bỏ qua */
  }
  return null
}

function readLegacyPractice(folderId: string): LegacyPractice {
  try {
    const raw = localStorage.getItem(`${LEGACY_PRACTICE_PREFIX}:${folderId}`)
    if (raw) {
      const p = JSON.parse(raw) as Partial<LegacyPractice>
      return { inputs: p.inputs ?? {}, results: p.results ?? {}, revealed: p.revealed ?? {} }
    }
  } catch {
    /* bỏ qua */
  }
  return { inputs: {}, results: {}, revealed: {} }
}

async function migrateLegacy(store: LegacyStore): Promise<void> {
  const folders = [...store.folders].sort((a, b) => a.createdAt - b.createdAt)
  for (const lf of folders) {
    const cf = await CloudApi.createSentenceFolder(lf.name)
    const localSents = store.sentences
      .filter((s) => s.folderId === lf.id)
      .sort((a, b) => a.createdAt - b.createdAt)
    const practice = readLegacyPractice(lf.id)
    for (const ls of localSents) {
      const ns = await CloudApi.createSentence(cf.id, inputToNew(ls))
      const ans = practice.inputs[ls.id]
      const res = practice.results[ls.id]
      const rev = practice.revealed[ls.id]
      if (ans || res || rev) {
        await CloudApi.saveProgress(ns.id, {
          answer: ans ?? '',
          status: res?.status ?? null,
          score: res?.score ?? null,
          revealed: !!rev,
        })
      }
    }
  }
}

async function seedDefault(): Promise<void> {
  const cf = await CloudApi.createSentenceFolder('Câu mẫu')
  await CloudApi.createSentences(cf.id, SENTENCES.map(inputToNew))
}

// Đảm bảo tài khoản có dữ liệu; trả về danh sách thư mục sau cùng.
export async function ensureReady(): Promise<Folder[]> {
  let folders = await CloudApi.listSentenceFolders()
  if (folders.length > 0) return sortFolders(folders)

  // Cloud trống
  const alreadyMigrated = localStorage.getItem(LOCAL_MIGRATED_FLAG) === '1'
  const legacy = alreadyMigrated ? null : readLegacyStore()
  if (legacy && legacy.folders.length > 0) {
    await migrateLegacy(legacy)
    localStorage.setItem(LOCAL_MIGRATED_FLAG, '1')
  } else {
    await seedDefault()
  }

  folders = await CloudApi.listSentenceFolders()
  return sortFolders(folders)
}
