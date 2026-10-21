// Dữ liệu hướng dẫn cho trang "Luyện Task 2" — câu hỏi gợi mở, không phải câu viết sẵn.
// Nguồn: DATA/huong-dan-song-ngu.md (mục 1 công thức 6 câu hỏi, mục 4 tám góc phân tích,
// mục 6 bảng tra nhanh, mục 7 mẹo viết thân bài).
import type { SixWKey } from './task2MindMap'

// ------------------------------------------------------------------ Bước 2: tìm ý thô
/** Mục 6 — câu hỏi nào gọi hướng nào, hợp với dạng đề nào. '*' = mọi dạng đề. */
export const SIXW_FIT: Record<SixWKey, { dirs: string; types: string[] | '*' }> = {
  who: { dirs: 'hướng 1–5: chủ thể', types: ['type.discuss', 'type.agree'] },
  why: { dirs: 'hướng 6–11: nguyên nhân thuộc khía cạnh nào', types: ['type.causes', 'type.problem'] },
  what: { dirs: 'hướng 6–11: lợi, hại theo từng khía cạnh', types: ['type.advdis', 'type.positive'] },
  how: { dirs: 'hướng 1–5: ai làm gì', types: ['type.causes', 'type.problem'] },
  when: { dirs: 'hướng 12: ngắn hạn, dài hạn', types: '*' },
  which: { dirs: 'hướng 12 kết hợp 1–5', types: ['type.discuss', 'type.advdis', 'type.agree'] },
}

/** Mục 4 — tám góc giúp tìm ý ngay cả khi không biết nhiều về chủ đề. */
export const ANGLES: { en: string; vi: string; ask: string }[] = [
  { en: 'Causes', vi: 'Nguyên nhân', ask: 'Tại sao vấn đề này xảy ra?' },
  { en: 'Effects', vi: 'Tác động', ask: 'Nó gây ra những hậu quả gì?' },
  { en: 'Benefits', vi: 'Lợi ích', ask: 'Nó mang lại điều gì tích cực?' },
  { en: 'Drawbacks', vi: 'Bất lợi', ask: 'Nó gây ra vấn đề gì?' },
  { en: 'Solutions', vi: 'Giải pháp', ask: 'Làm thế nào để giải quyết?' },
  { en: 'Responsibility', vi: 'Trách nhiệm', ask: 'Ai nên chịu trách nhiệm?' },
  { en: 'Comparison', vi: 'So sánh', ask: 'Phương án A tốt hơn B ở điểm nào?' },
  { en: 'Future', vi: 'Tương lai', ask: 'Điều gì có thể xảy ra trong dài hạn?' },
]

/** Mục 7 — mẹo viết thân bài. */
export const BODY_TIP =
  'Mỗi đoạn thân bài chỉ cần 1 chủ thể (WHO) và 1–2 khía cạnh (WHAT/WHEN), triển khai theo chuỗi Ý chính → Giải thích → Ví dụ → Kết quả.'

export const PICK_TIP =
  'Một chủ đề có nhiều hướng, nhưng trong bài thi chỉ chọn 2 ý chính đủ mạnh và giải thích sâu, đừng nhồi mọi hướng vào bài.'

// ------------------------------------------------------------------ Chuỗi lập luận của một thân bài
export type ChainKey = 'main' | 'explain' | 'example' | 'result'

export interface ChainField {
  key: ChainKey
  label: string
  tag: string
  /** Câu hỏi gợi mở, mức gợi ý 1. */
  asks: string[]
  /** Nhóm pattern ở mục 2 hợp với câu này. */
  groups: string[]
  /** Hàng nào trong bảng 6 câu hỏi của hướng đã chọn là ý mẫu cho câu này (mức gợi ý 2). */
  sixw: SixWKey[]
}

export const CHAIN: ChainField[] = [
  {
    key: 'main',
    label: 'Ý chính',
    tag: 'Topic sentence',
    asks: ['Trả lời thẳng phần đề mà đoạn này lo, trong một câu.', 'Chủ thể bạn chọn làm gì, hoặc bị ảnh hưởng ra sao?'],
    groups: [],
    sixw: ['who'],
  },
  {
    key: 'explain',
    label: 'Giải thích',
    tag: 'WHY · HOW',
    asks: ['Vì sao ý chính đúng?', 'Nó diễn ra theo cách nào, qua những bước nào?'],
    groups: ['p3', 'p10'],
    sixw: ['why', 'how'],
  },
  {
    key: 'example',
    label: 'Ví dụ',
    tag: 'Example',
    asks: ['Một nơi, một nhóm người hay một con số cụ thể nào minh họa được ý này?', 'Bạn hoặc người quen đã gặp trường hợp này chưa?'],
    groups: ['p7'],
    sixw: [],
  },
  {
    key: 'result',
    label: 'Kết quả',
    tag: 'WHAT · WHEN',
    asks: ['Cuối cùng điều này dẫn tới hệ quả gì?', 'Tác động trước mắt khác về lâu dài ra sao?'],
    groups: ['p3', 'p11', 'p9'],
    sixw: ['what', 'when'],
  },
]

/** Pattern cho câu ý chính tùy vai trò của đoạn thân bài (tên đoạn lấy từ outline của dạng đề). */
export function mainGroups(bodyName: string): string[] {
  const n = bodyName.toLowerCase()
  if (n.includes('giải pháp')) return ['p8', 'p1']
  if (n.includes('nguyên nhân') || n.includes('vấn đề')) return ['p3', 'p2']
  if (n.includes('bất lợi') || n.includes('tiêu cực') || n.includes('hại')) return ['p2', 'p12']
  if (n.includes('lợi ích') || n.includes('tích cực')) return ['p1', 'p12']
  return ['p4', 'p12']
}

