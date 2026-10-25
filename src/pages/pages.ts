// Danh sách các trang trong app + nhãn tiếng Việt cho sidebar
import type { IconName } from '../components/Icon'

export type PageKey =
  | 'dashboard'
  | 'vocabulary'
  | 'flashcard'
  | 'exercise'
  | 'grammar'
  | 'reading'
  | 'writing'
  | 'sentence'
  | 'mindmap'
  | 'task1'
  | 'task2'
  | 'usage'
  | 'settings'

export interface NavItem {
  key: PageKey
  label: string
  icon: IconName
  /** Chỉ số hiện bên phải mục: tổng thẻ (cards) hoặc thẻ đến hạn (due) */
  count?: 'cards' | 'due'
}

// Nhóm theo mockup EngMaster_Redesign: nhóm đầu không có nhãn
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: '',
    items: [{ key: 'dashboard', label: 'Trang chủ', icon: 'home' }],
  },
  {
    label: 'Luyện tập',
    items: [
      { key: 'vocabulary', label: 'Từ vựng', icon: 'layers', count: 'cards' },
      { key: 'flashcard', label: 'Ôn tập', icon: 'repeat', count: 'due' },
      { key: 'exercise', label: 'Bài tập', icon: 'tasks' },
      { key: 'grammar', label: 'Ngữ pháp', icon: 'grammar' },
    ],
  },
  {
    label: 'Kỹ năng',
    items: [
      { key: 'reading', label: 'Đọc', icon: 'book' },
      { key: 'writing', label: 'Viết', icon: 'pen' },
      { key: 'task1', label: 'Luyện Task 1', icon: 'bars' },
      { key: 'task2', label: 'Luyện Task 2', icon: 'target' },
      { key: 'sentence', label: 'Chép câu', icon: 'keyboard' },
      { key: 'mindmap', label: 'Tư duy', icon: 'mindmap' },
    ],
  },
  {
    label: 'Khác',
    items: [
      { key: 'usage', label: 'Thống kê', icon: 'chart' },
      { key: 'settings', label: 'Cài đặt', icon: 'settings' },
    ],
  },
]
