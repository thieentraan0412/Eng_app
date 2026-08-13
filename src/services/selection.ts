// Đoạn chữ người dùng đang bôi đen. Ô nhập liệu phải đọc riêng vì
// window.getSelection() không thấy vùng chọn bên trong <input>/<textarea>.
export function readSelectedText(limit = 1000): string {
  const active = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null
  if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
    const start = active.selectionStart ?? 0
    const end = active.selectionEnd ?? 0
    if (end > start) return active.value.slice(start, end).trim().slice(0, limit)
  }
  return (window.getSelection()?.toString() ?? '').trim().slice(0, limit)
}
