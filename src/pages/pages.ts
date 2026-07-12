// Danh sách các trang trong app + nhãn tiếng Việt cho sidebar
export type PageKey =
  | 'dashboard'
  | 'vocabulary'
  | 'flashcard'
  | 'grammar'
  | 'reading'
  | 'writing'
  | 'settings'

export const NAV: { key: PageKey; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Trang chủ', icon: '🏠' },
  { key: 'vocabulary', label: 'Từ vựng', icon: '📇' },
  { key: 'flashcard', label: 'Ôn tập', icon: '🔁' },
  { key: 'grammar', label: 'Ngữ pháp', icon: '📝' },
  { key: 'reading', label: 'Đọc', icon: '📖' },
  { key: 'writing', label: 'Viết', icon: '✍️' },
  { key: 'settings', label: 'Cài đặt', icon: '⚙️' },
]
