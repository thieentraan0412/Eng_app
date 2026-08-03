// ============================================================
// Module Ngữ pháp (module 11 · thiết kế trong
// EngMaster_Redesign/11-ngu-phap/THIET-KE.md) — KIỂU DỮ LIỆU + 7 nhóm lỗi
// người Việt hay mắc (VN_TRAPS).
//
// Nội dung 24 chủ điểm dựng sẵn (A1→C1) nằm ở ./grammarTopics.ts, sinh tự
// động từ các sổ tính EngMaster_Redesign/Excel/*.xlsx. Người dùng vẫn bổ sung
// chủ điểm riêng bằng màn "Thêm chủ điểm" (soạn tay hoặc nạp sổ tính Excel).
// ============================================================

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface GrammarFormula {
  form: string // Khẳng định / Phủ định / Nghi vấn…
  structure: string // S + have/has + V3   (phần trong ** ** được tô nhấn)
  example: string // câu ví dụ, phần trong { } được tô đậm
  exampleVi?: string
}

export interface GrammarUse {
  name: string
  sample: string // câu ví dụ, phần trong { } được tô nhấn
  note: string
}

export interface GrammarTrap {
  wrong: string // câu sai, phần trong { } bị gạch đỏ
  right: string // câu đúng, phần trong { } tô xanh
  why: string
}

export interface GrammarCompare {
  with: string // tên chủ điểm dễ nhầm
  rows: { key: string; other: string; self: string }[]
}

export type GrammarItemKind = 'cloze' | 'mcq' | 'correct' | 'transform'

export interface GrammarItem {
  id: string
  kind: GrammarItemKind
  /** cloze/mcq: câu có ___ · correct: câu đầy đủ (kèm tokens) · transform: câu gốc */
  prompt: string
  answers: string[]
  options?: string[] // mcq — phương án đầu tiên là đáp án đúng
  tokens?: string[] // correct — các từ trong câu
  errIndex?: number // correct — vị trí từ sai
  cue?: string // cloze — từ gốc cần chia, hiện trong ngoặc
  hint?: string // transform — gợi ý số từ / mở đầu
  explain?: string // phần "Vì sao" sau khi chấm
  errorTag?: string // 1 trong 7 nhóm lỗi người Việt
}

export interface GrammarTopic {
  /** slug (chủ điểm dựng sẵn) hoặc id Supabase (chủ điểm tự soạn) — khóa của tiến độ & sổ lỗi */
  key: string
  builtin: boolean
  /** id bản ghi Supabase — có ở chủ điểm tự soạn và bản sửa của chủ điểm dựng sẵn */
  cloudId?: string
  /** slug chủ điểm dựng sẵn mà bản này thay thế (bản sửa của chủ điểm dựng sẵn) */
  sourceKey?: string
  name: string
  nameEn: string
  level: CefrLevel
  group: string
  description: string
  icon: string
  /** nhóm lỗi người Việt liên quan — quyết định tab "Bẫy với người Việt" */
  tags: string[]
  signals: string[]
  formulas: GrammarFormula[]
  uses: GrammarUse[]
  traps: GrammarTrap[]
  compare: GrammarCompare | null
  /** true = vẽ dòng thời gian so sánh với quá khứ đơn (chỉ hợp chủ điểm về thì) */
  timeline?: boolean
  items: GrammarItem[]
}

// ============================================================
// 7 NHÓM LỖI ĐẶC THÙ CỦA NGƯỜI HỌC VIỆT NAM (tab "Bẫy với người Việt")
// ============================================================
export interface VnTrap {
  tag: string
  name: string
  wrong: string
  right: string
  why: string
}

export const VN_TRAPS: VnTrap[] = [
  {
    tag: 'Thiếu -s số nhiều',
    name: 'Thiếu đuôi -s số nhiều',
    wrong: 'I bought three {book} yesterday.',
    right: 'I bought three {books} yesterday.',
    why: 'Tiếng Việt không đánh dấu số nhiều trên danh từ — “ba quyển sách” đã đủ nghĩa nên đuôi -s dễ bị bỏ quên.',
  },
  {
    tag: 'Thiếu mạo từ',
    name: 'Thiếu hoặc thừa mạo từ',
    wrong: 'My sister is {teacher} at a primary school.',
    right: 'My sister is {a teacher} at a primary school.',
    why: 'Tiếng Việt không có a / an / the. Quy tắc gốc: danh từ đếm được số ít luôn cần một từ hạn định đứng trước.',
  },
  {
    tag: 'Thiếu -s ngôi 3',
    name: 'Thiếu -s ở ngôi thứ ba số ít',
    wrong: 'He {go} to the gym every morning.',
    right: 'He {goes} to the gym every morning.',
    why: 'Động từ tiếng Việt không đổi theo chủ ngữ, nên bước hòa hợp chủ ngữ – động từ hoàn toàn không tồn tại trong tiếng mẹ đẻ.',
  },
  {
    tag: 'Nhầm thì',
    name: 'Quá khứ đơn thay cho hiện tại hoàn thành',
    wrong: 'I {already finished} my homework.',
    right: 'I {have already finished} my homework.',
    why: 'Một chữ “đã” trong tiếng Việt gánh cả quá khứ đơn lẫn hiện tại hoàn thành, nên người học không thấy lý do phải phân biệt.',
  },
  {
    tag: 'Thiếu to be',
    name: 'Thiếu động từ to be trước tính từ',
    wrong: 'She {very tired} after the trip.',
    right: 'She {is very tired} after the trip.',
    why: 'Tiếng Việt nói thẳng “Cô ấy rất mệt”, không cần hệ từ. Trong tiếng Anh, tính từ làm vị ngữ bắt buộc có be.',
  },
  {
    tag: 'Trật tự từ',
    name: 'Trật tự tính từ – danh từ',
    wrong: 'He drives a {car red}.',
    right: 'He drives a {red car}.',
    why: 'Tiếng Việt đặt tính từ sau danh từ (“xe màu đỏ”), tiếng Anh đặt trước.',
  },
  {
    tag: 'Giới từ',
    name: 'Giới từ dịch từng chữ',
    wrong: 'It {depends of} the weather.',
    right: 'It {depends on} the weather.',
    why: '“Phụ thuộc vào” không dịch thành of. Giới từ phải học theo cụm cố định, không dịch rời từng chữ.',
  },
]

// Ngân hàng chủ điểm dựng sẵn nằm ở ./grammarTopics.ts — sinh tự động từ các
// sổ tính trong EngMaster_Redesign/Excel. Re-export ở đây để mọi nơi đang
// `import { BUILTIN_TOPICS } from '../data/grammar'` không phải đổi.
export { BUILTIN_TOPICS } from './grammarTopics'
