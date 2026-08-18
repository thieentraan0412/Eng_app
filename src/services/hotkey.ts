// Phím tắt mặc định cho Dịch nhanh. Chuỗi rỗng đã lưu nghĩa là người dùng cố ý
// gỡ phím tắt, nên chỉ dùng mặc định khi chưa từng có cài đặt nào.
export const DEFAULT_QUICK_TRANSLATE_HOTKEY = 'Alt+X'

export function readQuickTranslateHotkey(): string {
  return localStorage.getItem('quick_translate_hotkey') ?? DEFAULT_QUICK_TRANSLATE_HOTKEY
}

// Tên phím suy từ MÃ PHÍM VẬT LÝ (e.code) thay vì ký tự nhận được (e.key).
//
// Vì sao cần: bàn phím tiếng Việt, AltGr hay layout không phải US cho e.key ra
// ký tự khác hẳn — giữ Alt rồi gõ X có thể ra "≈", "̀" hoặc chuỗi rỗng. Chỉ so
// e.key thì phím tắt im lặng không ăn, mà nhìn bên ngoài y như hỏng. Extension
// của trình duyệt cũng phải so theo e.code vì đúng lý do này.
function keyFromCode(code: string): string | null {
  if (!code) return null
  const letter = /^Key([A-Z])$/.exec(code)
  if (letter) return letter[1]
  const digit = /^(?:Digit|Numpad)([0-9])$/.exec(code)
  if (digit) return digit[1]
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code
  if (code === 'Space') return 'Space'
  const arrow = /^Arrow(Up|Down|Left|Right)$/.exec(code)
  if (arrow) return arrow[1]
  return null
}

function keyFromKey(k: string): string | null {
  if (/^[a-z]$/i.test(k)) return k.toUpperCase()
  if (/^[0-9]$/.test(k)) return k
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(k)) return k
  if (k === ' ') return 'Space'
  if (k === 'ArrowUp') return 'Up'
  if (k === 'ArrowDown') return 'Down'
  if (k === 'ArrowLeft') return 'Left'
  if (k === 'ArrowRight') return 'Right'
  return null
}

// Chuyển sự kiện bàn phím thành accelerator dùng chung cho Electron và web.
// Phím tắt luôn cần Ctrl/Alt/Super để không chiếm các phím nhập văn bản thông thường.
export function accelFromEvent(e: KeyboardEvent): string | null {
  if (!e.ctrlKey && !e.altKey && !e.metaKey) return null
  // Mã phím vật lý trước: ghi phím tắt bằng layout nào thì lúc bấm cũng khớp.
  const key = keyFromCode(e.code) ?? keyFromKey(e.key)
  if (!key) return null

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

  // Khớp một trong hai là được: mã phím vật lý (chắc ăn với mọi layout) hoặc ký
  // tự nhận được (dành cho bàn phím ảo, chỗ e.code để trống).
  if ((keyFromCode(e.code) ?? '').toLowerCase() === key) return true
  const actual =
    e.key === ' '
      ? 'space'
      : e.key.startsWith('Arrow')
        ? e.key.slice(5).toLowerCase()
        : e.key.toLowerCase()
  return actual === key
}
