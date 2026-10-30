// ============================================================
// Nhắc chép câu (chỉ bản desktop): cứ mỗi chu kỳ đưa 1 câu chưa làm xong của
// trang "Chép câu" lên thẻ luyện tập nổi trên mọi ứng dụng. Bộ đếm + cửa sổ nằm
// ở main (electron/sentenceReminder.ts); phía này lo cài đặt, chọn câu và lưu
// bài làm, vì cửa sổ chính đã đăng nhập sẵn nên đọc/ghi được dữ liệu Chép câu.
// ============================================================
import { useEffect, useRef } from 'react'
import { isDesktop } from '../platform'
import {
  listAllSentences,
  listFolders,
  listSentences,
  loadProgressByFolder,
  saveProgress,
  type Folder,
  type PracticeRecord,
  type StoredSentence,
} from './cloud/sentenceCloud'
import type { SentenceReminderContent, SentenceReminderProgress } from '../vite-env'

const ENABLED_KEY = 'sc_reminder' // '1' = bật; mặc định tắt
const FOLDER_KEY = 'sc_reminder_folder' // '' = tất cả thư mục
const LAST_KEY = 'sc_reminder_last' // id câu hiện gần nhất -> chưa xong thì hiện lại
const INTERVAL_KEY = 'sc_reminder_interval' // ms chờ giữa hai lần hiện
const DISPLAY_KEY = 'sc_reminder_display' // ms câu nằm trên màn hình

export interface ReminderTiming {
  intervalMs: number
  displayMs: number
}

// Các lựa chọn trong Cài đặt; giá trị lưu không nằm trong danh sách -> dùng mặc định
export const INTERVAL_OPTIONS = [1, 2, 3, 5, 10, 15, 30].map((m) => m * 60_000)
export const DISPLAY_OPTIONS = [10, 15, 20, 30, 45, 60, 120, 300].map((s) => s * 1000)
const DEFAULT_TIMING: ReminderTiming = { intervalMs: 2 * 60_000, displayMs: 30_000 }

function readOption(key: string, options: number[], fallback: number): number {
  const v = Number(localStorage.getItem(key))
  return options.includes(v) ? v : fallback
}

export function readReminderTiming(): ReminderTiming {
  return {
    intervalMs: readOption(INTERVAL_KEY, INTERVAL_OPTIONS, DEFAULT_TIMING.intervalMs),
    displayMs: readOption(DISPLAY_KEY, DISPLAY_OPTIONS, DEFAULT_TIMING.displayMs),
  }
}

// "2 phút" / "30 giây" / "1 phút 30 giây" — cho dòng mô tả trong Cài đặt
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000)
  const min = Math.floor(total / 60)
  const sec = total % 60
  return [min && `${min} phút`, sec && `${sec} giây`].filter(Boolean).join(' ') || '0 giây'
}

export function readReminderEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === '1'
}

export function readReminderFolder(): string {
  return localStorage.getItem(FOLDER_KEY) ?? ''
}

// Báo main bật/tắt theo cài đặt đã lưu. Bật lại = đếm lại từ đầu chu kỳ.
export function syncSentenceReminder(): void {
  if (!isDesktop) return
  void window.api.setSentenceReminder({ enabled: readReminderEnabled(), ...readReminderTiming() })
}

export function saveReminderEnabled(on: boolean): void {
  localStorage.setItem(ENABLED_KEY, on ? '1' : '0')
  syncSentenceReminder()
}

// Đổi thời lượng -> main nhận giá trị mới và đếm lại chu kỳ từ đầu
export function saveReminderTiming(timing: Partial<ReminderTiming>): void {
  if (timing.intervalMs) localStorage.setItem(INTERVAL_KEY, String(timing.intervalMs))
  if (timing.displayMs) localStorage.setItem(DISPLAY_KEY, String(timing.displayMs))
  syncSentenceReminder()
}

// Đổi thư mục -> lượt sau bắt đầu từ câu chưa xong đầu tiên của thư mục mới
export function saveReminderFolder(folderId: string): void {
  localStorage.setItem(FOLDER_KEY, folderId)
  localStorage.removeItem(LAST_KEY)
}

// Sự kiện trên window của cửa sổ chính: một câu vừa được làm trong cửa sổ nhắc
// -> trang Luyện tập (nếu đang mở thư mục đó) cập nhật thẻ tương ứng.
export const REMINDER_PROGRESS_EVENT = 'sentence-reminder-progress'
export interface ReminderProgressDetail {
  sentenceId: string
  record: SentenceReminderProgress
}

// Sự kiện: vừa hiện câu / tự chuyển bộ / tự tắt vì xong hết / vừa làm một câu
// -> trang Cài đặt đọc lại công tắc, bộ đang dùng và câu tiếp theo.
export const REMINDER_UPDATED_EVENT = 'sentence-reminder-updated'

// Câu sẽ hiện ở lượt tới
export interface ReminderPlan {
  item: StoredSentence
  record?: PracticeRecord // bài làm dở lần trước
  folder?: Folder // bộ chứa câu
  index: number // số thứ tự trong bộ — khớp số ở trang Luyện tập
  total: number // số câu của bộ
  remaining: number // số câu chưa đúng 100% trong phạm vi đang dùng (bộ / tất cả)
  allFolders: boolean // đang dùng "Tất cả thư mục"
  switchFrom?: Folder // bộ đang chọn đã xong -> lượt này chuyển sang bộ khác
}

// 'done' = mọi câu đều đã đúng 100%; null = chưa có câu nào để hiện
export type ReminderNext = ReminderPlan | 'done' | null

// Câu chưa đúng 100% đầu tiên, tính TỪ CHÍNH câu hiện gần nhất: câu đó chưa làm
// xong thì lần này hiện lại nó, xong rồi mới sang câu chưa xong kế tiếp (hết
// danh sách thì vòng lại đầu).
function pickFrom(
  list: StoredSentence[],
  progress: Record<string, PracticeRecord>,
  lastId: string | null,
  folders: Folder[],
  allFolders: boolean,
): ReminderPlan | null {
  const todo = (s: StoredSentence) => !!s.vi.trim() && progress[s.id]?.status !== 'correct'
  const start = Math.max(0, list.findIndex((s) => s.id === lastId))
  const item = list.map((_, k) => list[(start + k) % list.length]).find(todo)
  if (!item) return null
  const inFolder = allFolders ? list.filter((s) => s.folderId === item.folderId) : list
  return {
    item,
    record: progress[item.id],
    folder: folders.find((f) => f.id === item.folderId),
    index: inFolder.indexOf(item) + 1,
    total: inFolder.length,
    remaining: list.filter(todo).length,
    allFolders,
  }
}

// Câu sẽ hiện ở lượt tới. Bộ đang chọn đã xong -> bộ kế tiếp (theo thứ tự lưới)
// còn câu chưa xong; đang ở bộ cuối thì vòng lại từ bộ đầu. Bộ đã chọn không còn
// nữa -> coi như "Tất cả thư mục". Chỉ đọc, không ghi gì — trang Cài đặt cũng
// gọi để xem trước câu tiếp theo.
export async function planNextSentence(): Promise<ReminderNext> {
  const folders = await listFolders()
  const chosen = folders.find((f) => f.id === readReminderFolder())
  const lastId = localStorage.getItem(LAST_KEY)

  if (!chosen) {
    const [all, progress] = await Promise.all([listAllSentences(folders), loadProgressByFolder()])
    return pickFrom(all, progress, lastId, folders, true) ?? (all.length > 0 ? 'done' : null)
  }

  const [list, progress] = await Promise.all([
    listSentences(chosen.id),
    loadProgressByFolder(chosen.id),
  ])
  const here = pickFrom(list, progress, lastId, folders, false)
  if (here) return here

  const [all, allProgress] = await Promise.all([listAllSentences(folders), loadProgressByFolder()])
  const at = folders.indexOf(chosen)
  for (let k = 1; k < folders.length; k++) {
    const f = folders[(at + k) % folders.length]
    const next = pickFrom(
      all.filter((s) => s.folderId === f.id),
      allProgress,
      null,
      folders,
      false,
    )
    if (next) return { ...next, switchFrom: chosen }
  }
  // Không còn câu chưa xong ở đâu. Chưa có câu nào thì KHÔNG coi là xong, để
  // không tự tắt nhầm khi dữ liệu tải về rỗng.
  return all.length > 0 ? 'done' : null
}

// Dòng "câu tiếp theo" ở trang Cài đặt
export function describeNext(next: ReminderNext): string {
  if (next === 'done') return 'Tất cả các bộ đã đúng 100% — tính năng sẽ tự tắt ở lượt tới'
  if (!next) return 'Chưa có câu nào để hiện'
  const pos = `câu số ${next.index}/${next.total}`
  const name = next.folder ? `“${next.folder.name}”` : ''
  if (next.switchFrom) return `Bộ này đã xong — lượt tới chuyển sang bộ ${name}, ${pos}`
  return `Câu tiếp theo: ${pos}${next.allFolders ? ` của bộ ${name}` : ''} · còn ${
    next.remaining
  } câu chưa xong`
}

function toContent(next: ReminderPlan): SentenceReminderContent {
  const rec = next.record
  const timing = readReminderTiming()
  return {
    item: next.item,
    folderName: next.folder?.name ?? '',
    index: next.index,
    total: next.total,
    remaining: next.remaining,
    progress: rec
      ? { answer: rec.answer, status: rec.status, score: rec.score, revealed: rec.revealed }
      : null,
    notice:
      next.switchFrom && next.folder
        ? `Bộ “${next.switchFrom.name}” đã làm xong — chuyển sang bộ “${next.folder.name}”`
        : undefined,
    durationMs: timing.displayMs,
    intervalMs: timing.intervalMs,
  }
}

// Gắn ở AppLayout (sống suốt phiên đăng nhập): chuyển trang không khởi động
// lại bộ đếm; đăng xuất thì tắt hẳn. onNotice: báo người dùng (toast).
export function useSentenceReminder(onNotice?: (message: string) => void): void {
  const noticeRef = useRef(onNotice)
  noticeRef.current = onNotice

  useEffect(() => {
    if (!isDesktop) return
    syncSentenceReminder()
    const updated = () => window.dispatchEvent(new Event(REMINDER_UPDATED_EVENT))
    const off = window.api.onSentenceReminderDue(async (seq) => {
      try {
        const next = await planNextSentence()
        if (next === 'done') {
          // Mọi bộ đã đúng hết -> tự tắt, như người dùng tắt trong Cài đặt
          saveReminderEnabled(false)
          noticeRef.current?.('🎉 Đã làm xong tất cả các bộ câu — đã tắt Tự động hiển thị câu chép')
          updated()
          return
        }
        const shown = await window.api.showSentenceReminder(seq, next ? toContent(next) : null)
        // Chỉ ghi nhận khi main thật sự hiện câu (lượt cũ bị bỏ thì thôi)
        if (shown && next) {
          if (next.switchFrom && next.folder) localStorage.setItem(FOLDER_KEY, next.folder.id)
          localStorage.setItem(LAST_KEY, next.item.id)
          updated()
        }
      } catch {
        // Mất mạng / lỗi tải -> bỏ lượt này, chờ chu kỳ sau
        void window.api.showSentenceReminder(seq, null)
      }
    })
    // Bài làm trong cửa sổ nhắc -> lưu lên cloud như ở trang Luyện tập
    const offProgress = window.api.onSentenceReminderProgress((sentenceId, record) => {
      saveProgress(sentenceId, record)
        .catch(() => {
          /* lỗi mạng -> bỏ qua, lần làm sau sẽ ghi lại */
        })
        .finally(updated) // câu vừa đúng 100% -> "câu tiếp theo" trong Cài đặt đổi theo
      window.dispatchEvent(
        new CustomEvent<ReminderProgressDetail>(REMINDER_PROGRESS_EVENT, {
          detail: { sentenceId, record },
        }),
      )
    })
    return () => {
      off()
      offProgress()
      void window.api.setSentenceReminder({ enabled: false })
    }
  }, [])
}
