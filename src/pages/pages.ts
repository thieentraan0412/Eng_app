// Danh sách các trang trong app + nhãn tiếng Việt cho sidebar
export type PageKey =
  | 'dashboard'
  | 'vocabulary'
  | 'flashcard'
  | 'exercise'
  | 'reading'
  | 'writing'
  | 'sentence'
  | 'usage'
  | 'settings'

export const NAV: { key: PageKey; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Trang chủ', icon: '🏠' },
  { key: 'vocabulary', label: 'Từ vựng', icon: '📇' },
  { key: 'flashcard', label: 'Ôn tập', icon: '🔁' },
  { key: 'exercise', label: 'Bài tập', icon: '📝' },
  { key: 'reading', label: 'Đọc', icon: '📖' },
  { key: 'writing', label: 'Viết', icon: '✍️' },
  { key: 'sentence', label: 'Chép câu', icon: '✏️' },
  { key: 'usage', label: 'Thống kê', icon: '📊' },
  { key: 'settings', label: 'Cài đặt', icon: '⚙️' },
]
