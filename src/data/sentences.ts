// Ngân hàng câu luyện "Chép câu" (Việt → Anh). Dữ liệu tĩnh, offline.
// (thiết kế: chepcau.md)

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface SentenceItem {
  id: string
  vi: string // câu tiếng Việt (đề bài)
  en: string // đáp án tham chiếu chính
  altAnswers?: string[] // các cách dịch đúng khác
  hints?: string[] // gợi ý từ vựng / cấu trúc
  level?: CefrLevel
  topic?: string // chủ đề
}

export const SENTENCES: SentenceItem[] = [
  {
    id: 's1',
    vi: 'Tôi đã học tiếng Anh được ba năm.',
    en: 'I have learned English for three years.',
    altAnswers: ['I have studied English for three years.'],
    hints: ['thì hiện tại hoàn thành', 'for + khoảng thời gian'],
    level: 'B1',
    topic: 'Học tập',
  },
  {
    id: 's2',
    vi: 'Cô ấy sống ở Hà Nội.',
    en: 'She lives in Hanoi.',
    hints: ['thì hiện tại đơn', 'live in + nơi chốn'],
    level: 'A1',
    topic: 'Đời sống',
  },
  {
    id: 's3',
    vi: 'Chúng tôi sẽ đi du lịch Đà Nẵng vào tuần tới.',
    en: 'We will travel to Da Nang next week.',
    altAnswers: ['We are going to travel to Da Nang next week.'],
    hints: ['thì tương lai', 'next week'],
    level: 'A2',
    topic: 'Du lịch',
  },
  {
    id: 's4',
    vi: 'Anh ấy thường thức dậy lúc sáu giờ sáng.',
    en: 'He usually wakes up at six in the morning.',
    altAnswers: ['He usually gets up at six in the morning.'],
    hints: ['trạng từ tần suất', 'wake up / get up'],
    level: 'A2',
    topic: 'Thói quen',
  },
  {
    id: 's5',
    vi: 'Tôi không thích uống cà phê vào buổi tối.',
    en: 'I do not like drinking coffee in the evening.',
    altAnswers: [
      "I don't like drinking coffee in the evening.",
      'I do not like to drink coffee in the evening.',
    ],
    hints: ['phủ định hiện tại đơn', 'like + V-ing'],
    level: 'A2',
    topic: 'Sở thích',
  },
  {
    id: 's6',
    vi: 'Bạn có thể giúp tôi một việc được không?',
    en: 'Can you do me a favor?',
    altAnswers: ['Could you do me a favor?', 'Can you help me with something?'],
    hints: ['câu hỏi lịch sự', 'do someone a favor'],
    level: 'A2',
    topic: 'Giao tiếp',
  },
  {
    id: 's7',
    vi: 'Trời đang mưa rất to.',
    en: 'It is raining heavily.',
    altAnswers: ["It's raining hard.", 'It is raining very hard.'],
    hints: ['thì hiện tại tiếp diễn', 'trạng từ: heavily / hard'],
    level: 'A1',
    topic: 'Thời tiết',
  },
  {
    id: 's8',
    vi: 'Nếu tôi có nhiều thời gian, tôi sẽ đọc nhiều sách hơn.',
    en: 'If I had more time, I would read more books.',
    hints: ['câu điều kiện loại 2', 'would + V'],
    level: 'B1',
    topic: 'Học tập',
  },
  {
    id: 's9',
    vi: 'Cuốn sách này thú vị hơn cuốn kia.',
    en: 'This book is more interesting than that one.',
    hints: ['so sánh hơn', 'more + tính từ dài + than'],
    level: 'A2',
    topic: 'Học tập',
  },
  {
    id: 's10',
    vi: 'Tôi đã sống ở đây từ năm 2015.',
    en: 'I have lived here since 2015.',
    hints: ['hiện tại hoàn thành', 'since + mốc thời gian'],
    level: 'B1',
    topic: 'Đời sống',
  },
  {
    id: 's11',
    vi: 'Bữa tối đã được nấu bởi mẹ tôi.',
    en: 'Dinner was cooked by my mother.',
    altAnswers: ['The dinner was cooked by my mother.'],
    hints: ['câu bị động quá khứ', 'was + V3 + by'],
    level: 'B1',
    topic: 'Đời sống',
  },
  {
    id: 's12',
    vi: 'Tôi đang mong chờ được gặp bạn.',
    en: 'I am looking forward to seeing you.',
    altAnswers: ["I'm looking forward to seeing you."],
    hints: ['look forward to + V-ing'],
    level: 'B1',
    topic: 'Giao tiếp',
  },
]
