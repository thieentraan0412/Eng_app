// Phím tắt mặc định cho Dịch nhanh. Chuỗi rỗng đã lưu nghĩa là người dùng cố ý
// gỡ phím tắt, nên chỉ dùng mặc định khi chưa từng có cài đặt nào.
export const DEFAULT_QUICK_TRANSLATE_HOTKEY = 'Alt+X'

export function readQuickTranslateHotkey(): string {
  return localStorage.getItem('quick_translate_hotkey') ?? DEFAULT_QUICK_TRANSLATE_HOTKEY
}

// Chuyển sự kiện bàn phím thành accelerator dùng chung cho Electron và web.
// Phím tắt luôn cần Ctrl/Alt/Super để không chiếm các phím nhập văn bản thông thường.
export function accelFromEvent(e: KeyboardEvent): string | null {
  if (!e.ctrlKey && !e.altKey && !e.metaKey) return null
  const k = e.key
  let key: string
  if (/^[a-z]$/i.test(k)) key = k.toUpperCase()
  else if (/^[0-9]$/.test(k)) key = k
  else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(k)) key = k
  else if (k === ' ') key = 'Space'
  else if (k === 'ArrowUp') key = 'Up'
  else if (k === 'ArrowDown') key = 'Down'
  else if (k === 'ArrowLeft') key = 'Left'
  else if (k === 'ArrowRight') key = 'Right'
  else return null

  const mods: string[] = []
  if (e.ctrlKey) mods.push('Ctrl')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  if (e.metaKey) mods.push('Super')
  return [...mods, key].join('+')
}

// Bản web không có globalShortcut của Electron, vì vậy so tổ hợp ngay trong trang.
export function matchesAccelerator(e: KeyboardEvent, accelerator: string): boolean {
  const expected = accelerator.trim().toLowerCase().split('+').filter(Boolean)
  if (expected.length < 2) return false

  const has = (name: string) => expected.includes(name)
  if (e.ctrlKey !== has('ctrl')) return false
  if (e.altKey !== has('alt')) return false
  if (e.shiftKey !== has('shift')) return false
  if (e.metaKey !== (has('super') || has('meta') || has('command'))) return false

  const key = expected.find(
    (part) => !['ctrl', 'alt', 'shift', 'super', 'meta', 'command'].includes(part),
  )
  if (!key) return false
  const actual =
    e.key === ' '
      ? 'space'
      : e.key.startsWith('Arrow')
        ? e.key.slice(5).toLowerCase()
        : e.key.toLowerCase()
  return actual === key
}
