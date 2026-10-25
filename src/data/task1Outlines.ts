// Outline và công thức IELTS Writing Task 1 cho trang "Luyện Task 1".
// Nguồn: DATA/compare.md (Structure 2 Compare) · DATA/trendandcompare.md (Linearthinking: Graph with Trend).
// Câu khung, mẫu theo tình huống và bảng công thức chép theo hai file đó. Phần guide (gợi ý ô viết),
// cách chia câu trong outline và mục "Bài mẫu (bổ sung)" của dạng Compare là phần bổ sung như ghi trong file.
import type { Seg, Tone } from './task2Outlines'

export type T1TypeId = 'compare' | 'trend'

/** Một mẫu câu theo tình huống số liệu: bấm để chèn vào ô viết. */
export interface T1Case {
  when: string
  en: string
}

export interface T1Line {
  no: number
  role: string
  /** Câu khung; chỗ có options bấm để chọn rồi ráp thành câu. */
  text: Seg[]
  guide: string
  /** Mở câu: chèn trước mẫu tình huống khi ô còn trống. */
  lead?: string
  cases?: T1Case[]
  /** Bảng đổi Noun Phrase → Noun Clause (Introduction). */
  convert?: { from: string; to: string }[]
  /** Lưu ý ngắn dưới câu khung. */
  tip?: string
}

export interface T1Part {
  title: string
  tone: Tone | 'm'
  lines: T1Line[]
}

/** Một khối trong bảng công thức ở bước 2. Chữ trong **…** là phần in đậm. */
export interface T1Block {
  title?: string
  text?: string
  formula?: string
  head?: string[]
  /** Các hàng của bảng; '\n' trong ô là xuống dòng. */
  rows?: string[][]
  list?: string[]
  /** Bài mẫu: mỗi phần tử một đoạn. */
  essay?: string[]
  /** Ghi chú hiện sau cùng (sau bảng). */
  note?: string
}

export interface T1GuideTab {
  id: string
  label: string
  blocks: T1Block[]
}

export interface T1Type {
  id: T1TypeId
  vi: string
  en: string
  /** Dấu hiệu nhận dạng trong đề. */
  signal: string
  note: string
  parts: T1Part[]
  guide: T1GuideTab[]
}

// ------------------------------------------------------------------ Mảnh ghép
const s = (t: string, extra: Partial<Seg> = {}): Seg => ({ t, ...extra })
/** Chỗ chọn: hiện tên chỗ (vd [Linking word]) cho tới khi người học chọn một cách viết. */
const pick = (t: string, options: string[], title: string): Seg => ({ t, options, menu: { title, reset: 'Bỏ chọn' } })

const VERB = ['illustrates', 'shows']
const INTRO_CONVERT = [
  { from: 'the number of + N', to: 'how many + N' },
  { from: 'the amount of + N', to: 'how much + N' },
  { from: 'N + Ved/3', to: 'N + be + Ved/3 (bị động)' },
  { from: 'N + V-ing', to: 'N + V (chủ động)' },
  { from: 'the proportion of N', to: 'the percentage of N' },
]
const G_INTRO = 'Viết lại đề bằng từ khác: đổi động từ, đổi cụm danh từ thành mệnh đề danh từ, giữ nguyên nơi chốn.'

// Compare · Body: Linking word + Data (số lớn), Comparison (so sánh với số nhỏ hơn)
const CONSIDER = ['Concerning [1],', 'Regarding [1],', 'With regard to [1],', 'Turning to [1],']
const TREND_LINK = ['Similarly,', 'Likewise,', 'In the same way,', 'In contrast,', 'Conversely,', 'Meanwhile,']
const DATA_A = [
  'the number of [A] stood at [data A]',
  'the number of [A] was [data A]',
  '[data A] [A] + verb',
  'there were [data A] [A] who + verb',
]
const COMPARISON = [
  'which was [A − B] higher than the figure for [B].',
  'surpassing the figure for [B] by [A − B].',
  'which was X times as high as the figure for [B].',
  'which was double / triple / quadruple the figure for [B].',
  'while the figure for [B] was considerably / slightly lower, at [data B].',
  'which was similar / equal to the figure for [B].',
]
const compareBody = (no: number, who: string, links: string[], guide: string, cases?: T1Case[]): T1Line => ({
  no,
  role: `Đối tượng ${who}`,
  text: [
    pick('[Linking word]', links.map((x) => x.replace('[1]', who)), 'Chọn từ nối'),
    s(' '),
    pick('[Data A]', DATA_A, 'Nêu số lớn hơn'),
    s(', '),
    pick('[Comparison]', COMPARISON, 'So sánh với số nhỏ hơn'),
  ],
  guide,
  cases,
})
const SECOND_CASES = (y: string): T1Case[] => [
  { when: `${y}: A > B (giống đối tượng trước)`, en: `${y} followed a similar pattern, with respective figures being [data A] and [data B].` },
  {
    when: `${y}: A > B, khoảng cách lớn / nhỏ hơn`,
    en: `${y} followed a similar pattern, albeit with a bigger / smaller difference between [A] and [B], with respective figures being [data A] and [data B].`,
  },
  { when: `${y}: B > A (khác đối tượng trước)`, en: `${y} followed a contrasting pattern, as the number of [B] stood at [data B], surpassing the figure for [A] by [B − A].` },
]

// Trend · Body 1: Ranking + Data
const DATA_ONE = [', at [data].', ', with [data].', ', as its figure stood at [data].']
const DATA_MANY = [', with respective figures being [data B and C].', ', with corresponding figures being [data B and C].']

// Trend · Body 2: Subject + Trend & Degree + Data + Time
const SUBJECT = ['The number of [A]', 'The amount of [A]', 'The percentage of [A]', 'The proportion of [A]', 'The figure for [A]']
const TREND_VERB = [
  'increased',
  'went up',
  'rose',
  'grew',
  'decreased',
  'dropped',
  'fell',
  'went down',
  'declined',
  'jumped',
  'surged',
  'plunged',
  'plummeted',
  'fluctuated',
  'remained stable',
  'remained unchanged',
  'peaked',
  'hit a low',
]
const DEGREE = ['significantly', 'remarkably', 'considerably', 'dramatically', 'sharply', 'moderately', 'noticeably', 'slightly', 'modestly', 'mildly', 'wildly']
const TREND_DATA = ['to [data]', 'by [data]', 'at [data]', 'of [data]', 'between [data] and [data]']
const TIME = ['in [year]', 'from [year] to [year]', 'between [year] and [year]', 'over the next X years', 'for the following X years']
const trendLine = (no: number, role: string, guide: string, cases: T1Case[], tip?: string): T1Line => ({
  no,
  role,
  text: [
    pick('[Subject]', SUBJECT, 'Chủ ngữ số lượng'),
    s(' '),
    pick('[Verb]', TREND_VERB, 'Động từ xu hướng'),
    s(' '),
    pick('[Degree]', DEGREE, 'Mức độ (trạng từ)'),
    s(' '),
    pick('[Data]', TREND_DATA, 'Số liệu'),
    s(' '),
    pick('[Time]', TIME, 'Thời gian'),
    s('.'),
  ],
  guide,
  cases,
  tip,
})

// ------------------------------------------------------------------ Hai dạng đề
export const T1_TYPES: T1Type[] = [
  {
    id: 'compare',
    vi: 'So sánh (không có mốc thời gian)',
    en: 'Structure 2 · Compare',
    signal: 'The bar chart shows the number of male and female students in four courses in 2023.',
    note: 'Không tả xu hướng qua các năm, có 2 nhóm categories (vd: các khóa học và nam / nữ).',
    parts: [
      {
        title: 'Introduction',
        tone: 'm',
        lines: [
          {
            no: 1,
            role: 'Paraphrase đề',
            text: [s('[Tên biểu đồ] '), pick('illustrates', VERB, 'Động từ'), s(' [Noun Clause] [Time] [Place].')],
            guide: G_INTRO,
            convert: [...INTRO_CONVERT, { from: 'from A to B', to: 'between A and B' }],
            tip: 'Time: in [năm] giữ nguyên. Place: giữ nguyên.',
          },
        ],
      },
      {
        title: 'Overview',
        tone: 'o',
        lines: [
          {
            no: 2,
            role: 'Câu 1 · So sánh hơn',
            text: [s('What is notable from the [tên biểu đồ] is that …')],
            lead: 'What is notable from the [tên biểu đồ] is that',
            guide: 'So sánh A và B trên mọi đối tượng [1234].',
            cases: [
              { when: '[1234]: A > B', en: 'all [categories] had more [A] than [B].' },
              { when: '[12]: A > B · [34]: A < B', en: 'while [1] and [2] had more [A] than [B], the reverse pattern could be observed in the remaining groups.' },
              { when: 'Có [5]: A = B (thêm cuối câu)', en: 'except [5], which had equal numbers.' },
            ],
            tip: 'Tài liệu gạch chữ "that" trong "from that": viết "from the [tên biểu đồ]".',
          },
          {
            no: 3,
            role: 'Câu 2 · So sánh nhất',
            text: [s('Among all the [categories], …')],
            lead: 'Among all the [categories],',
            guide: 'Đối tượng nào có số liệu lớn nhất.',
            cases: [
              { when: '[1]: A + B lớn nhất', en: '[1] had the highest figures for both [A] and [B].' },
              {
                when: '[1]: A lớn nhất · [2]: B lớn nhất',
                en: '[1] had the highest number / amount / percentage of [A], whereas the highest figure for [B] belonged to [2].',
              },
            ],
          },
        ],
      },
      {
        title: 'Body 01 · nửa đầu đối tượng',
        tone: 'g',
        lines: [
          compareBody(4, '[1]', CONSIDER, 'Đối tượng [1]: mở bằng từ nối, nêu số lớn hơn, rồi so sánh với số nhỏ hơn.'),
          compareBody(5, '[2]', [...CONSIDER, ...TREND_LINK], 'Đối tượng [2]: viết như câu 4, hoặc dùng mẫu "followed a … pattern".', SECOND_CASES('[2]')),
        ],
      },
      {
        title: 'Body 02 · nửa còn lại',
        tone: 'g',
        lines: [
          compareBody(6, '[3]', [...CONSIDER, ...TREND_LINK], 'Đối tượng [3]: viết theo công thức hoặc so với đối tượng trước.', SECOND_CASES('[3]')),
          compareBody(7, '[4]', [...CONSIDER, ...TREND_LINK], 'Đối tượng [4]: từ câu thứ 2 trở đi dùng từ nối xu hướng.', SECOND_CASES('[4]')),
        ],
      },
    ],
    guide: [
      {
        id: 'frame',
        label: 'Khung bài',
        blocks: [
          {
            text: 'Structure 2 Compare dùng cho biểu đồ **không có mốc thời gian** (không tả xu hướng tăng giảm qua các năm) và có **2 nhóm categories**, ví dụ một nhóm là các khóa học, nhóm kia là nam và nữ.',
          },
          {
            title: 'Khung bài Structure 2',
            head: ['Phần', 'Nội dung'],
            rows: [
              ['**Intro**', 'paraphrase: viết lại đề bài bằng từ khác'],
              ['**Purpose**', 'Tài liệu để trống mục này và không giải thích thêm.'],
              ['**Overview**', '2 câu so sánh: câu 1 so sánh hơn, câu 2 so sánh nhất'],
              ['**Body 01**', 'Nửa đầu các đối tượng của nhóm nhiều thành phần hơn, ví dụ [1] và [2]'],
              ['**Body 02**', 'Nửa còn lại, ví dụ [3] và [4]'],
            ],
          },
          {
            title: 'Ký hiệu 1234 và A, B',
            list: [
              'Nhóm có **từ 3 đối tượng trở lên** thì các đối tượng được kí hiệu là **1234**.',
              'Nhóm có **2 đối tượng** thì các đối tượng được kí hiệu là **A và B**.',
            ],
            note: 'Ví dụ (bổ sung): biểu đồ số sinh viên nam và nữ ở 4 khóa học. Nhóm khóa học có 4 đối tượng nên là [1] [2] [3] [4]. Nhóm giới tính có 2 đối tượng nên nam là A, nữ là B. Trong các công thức ở mục Body, **data A** là số lớn hơn và **B** là số nhỏ hơn của cùng một đối tượng [1].',
          },
        ],
      },
      {
        id: 'intro',
        label: 'Intro',
        blocks: [
          { formula: 'Tên biểu đồ + show(s) / illustrate(s) + Noun Phrase → Noun Clause + Time + Place' },
          {
            title: 'Đổi Noun Phrase thành Noun Clause',
            head: ['Trong đề', 'Khi viết lại', 'Ví dụ (bổ sung)'],
            rows: [
              ['the number of', 'how many', 'the number of tourists → how many tourists'],
              ['the amount of', 'how much', 'the amount of water → how much water'],
              ['N + Ved/3', 'N + be + Ved (bị động)', 'the amount of water used → how much water was used'],
              ['N + V-ing', 'N + V (chủ động)', 'the number of people using buses → how many people used buses'],
              ['the proportion of N', 'the percentage of N', 'the proportion of households → the percentage of households'],
            ],
          },
          {
            title: 'Time và Place',
            head: ['Phần', 'Trong đề', 'Khi viết lại'],
            rows: [
              ['Time', 'in [năm]', 'giữ nguyên'],
              ['Time', 'from A to B', 'between A and B'],
              ['Place', '', 'giữ nguyên'],
            ],
          },
          {
            title: 'Ví dụ cả câu (bổ sung)',
            list: [
              'Đề: The bar chart shows the number of male and female students enrolled in four courses at a college in 2023.',
              'Viết lại: The bar chart illustrates how many male and female students enrolled in four courses at a college in 2023.',
            ],
          },
        ],
      },
      {
        id: 'overview',
        label: 'Overview',
        blocks: [
          { text: 'Overview có 2 câu: câu 1 dùng so sánh hơn, câu 2 dùng so sánh nhất.' },
          {
            title: 'Câu 1 · so sánh hơn',
            formula: 'What is notable from the [tên biểu đồ] is that …',
            head: ['Số liệu', 'Viết tiếp sau "is that …"'],
            rows: [
              ['[1234]: A > B', 'all [categories] had more A than B.\nVí dụ (bổ sung): all four courses had more male than female students.'],
              [
                '[12]: A > B\n[34]: A < B',
                'while [1 and 2] had more A than B, the reverse pattern could be observed in the remaining groups.\nVí dụ (bổ sung): while engineering and IT had more male than female students, the reverse pattern could be observed in the remaining courses.',
              ],
              ['Có [5]: A = B', 'thêm vào cuối câu: except V which had equal numbers (V là tên đối tượng [5]).\nVí dụ (bổ sung): …, except business, which had equal numbers.'],
            ],
          },
          {
            title: 'Câu 2 · so sánh nhất',
            formula: 'Among all the [categories], …',
            head: ['Số liệu', 'Viết tiếp'],
            rows: [
              ['[1]: A + B = lớn nhất', '[1] had the highest figures for both A and B.\nVí dụ (bổ sung): engineering had the highest figures for both male and female students.'],
              [
                '[1]: A lớn nhất\n[2]: B lớn nhất',
                '[1] had the highest number/amount/percentage of A whereas the highest figure for B belonged to [2].\nVí dụ (bổ sung): engineering had the highest number of male students, whereas the highest figure for female students belonged to nursing.',
              ],
            ],
          },
        ],
      },
      {
        id: 'body',
        label: 'Body',
        blocks: [
          {
            text: 'Chia body dựa trên nhóm có nhiều thành phần hơn. Ví dụ (bổ sung): nhóm khóa học có 4 đối tượng, nhóm giới tính có 2, thì chia theo khóa học. Body 01 viết [1] và [2], Body 02 viết [3] và [4].',
          },
          {
            title: 'Công thức một câu',
            formula: 'Linking word + Data (số lớn) , Comparison (so sánh với số nhỏ hơn)',
            note: 'Mỗi câu nói về một đối tượng [1]: mở bằng từ nối, nêu số lớn hơn trước, rồi sau dấu phẩy so sánh với số nhỏ hơn.',
          },
          {
            title: 'Linking word',
            list: ['Xem xét số liệu của [1]: **Concerning** / **Regarding** / **With regard to** / **Turning to** + noun, …'],
            head: ['Từ nối xu hướng (từ câu thứ 2) · dùng khi', 'Từ nối'],
            rows: [
              ['Tương tự', 'Similarly / Likewise / In the same way'],
              ['Tương phản', 'In contrast / Conversely'],
              ['Nối 2 xu hướng không liên quan tới nhau', 'Meanwhile'],
            ],
          },
          {
            title: 'Data (số lớn)',
            head: ['Cấu trúc', 'Ví dụ (bổ sung)'],
            rows: [
              ['The number/amount/percentage of [1] was/stood at [data A]', 'the number of male students stood at 420'],
              ['[data A] + verb', '420 male students studied engineering'],
              ['There was/were + [data A] + who/which + verb', 'there were 420 male students who studied engineering'],
            ],
          },
          {
            title: 'Comparison (so sánh với số nhỏ hơn)',
            head: ['Cách', 'Cấu trúc', 'Ví dụ (bổ sung) · 420 và 140'],
            rows: [
              ['Toán trừ', '(which was) [data A trừ B] higher than the figure for B.\nsurpassing/exceeding the figure for B by [data A trừ data B]', 'which was 280 higher than the figure for female students.'],
              [
                'Toán chia',
                '(which was) (less than / more than) X times as high as the figure for B.\n(which was) (less than / more than) double/triple/quadruple the figure for B.',
                'which was three times as high as the figure for female students.',
              ],
              ['Số liệu thật', 'while the figure for B was considerably/slightly lower, at [data].', 'while the figure for female students was considerably lower, at 140.'],
              ['A = B', '(which was) similar/equal to the figure for B.', 'the number of male students stood at 200, which was equal to the figure for female students.'],
            ],
          },
          {
            title: 'Đối tượng thứ hai (Y là tên đối tượng [2])',
            head: ['Số liệu của [2]', 'Cấu trúc'],
            rows: [
              ['[2]: A > B (2 giống 1)', 'Y followed a similar pattern, with respective figures being [data A and B].'],
              ['[2]: A > B, khoảng cách lớn/nhỏ hơn [1]', 'Y followed a similar pattern, albeit with a bigger/smaller difference between [A and B], with respective figures being [data A and B].'],
              ['[2]: B > A (2 khác 1)', 'Y followed a contrasting pattern, as the number/amount/percentage of B stood at [data B], surpassing the figure A by [B − A].\nTài liệu ghi "the figure A"; viết đầy đủ là "the figure for A".'],
            ],
          },
        ],
      },
      {
        id: 'sample',
        label: 'Bài mẫu',
        blocks: [
          {
            text: 'Phần bổ sung, không có trong tài liệu: một đề tự đặt với số liệu giả định, viết đúng theo các công thức để thấy cách ráp từng câu.',
            formula: 'The bar chart shows the number of male and female students enrolled in four courses at a college in 2023.',
          },
          {
            title: 'Số liệu',
            head: ['Khóa học', 'Nam (A)', 'Nữ (B)', 'Nhận xét'],
            rows: [
              ['[1] Engineering', '420', '140', 'A > B, A gấp 3 lần B, cách nhau 280. A lớn nhất.'],
              ['[2] IT', '360', '180', 'A > B, cách nhau 180 (nhỏ hơn [1]).'],
              ['[3] Nursing', '90', '310', 'B > A, cách nhau 220. B lớn nhất.'],
              ['[4] Languages', '150', '270', 'B > A.'],
            ],
          },
          {
            title: 'Bài viết · 154 từ',
            essay: [
              '(I) The bar chart illustrates how many male and female students enrolled in four courses at a college in 2023.',
              '(O1) What is notable from the bar chart is that while engineering and IT had more male than female students, the reverse pattern could be observed in the remaining courses. (O2) Among all the courses, engineering had the highest number of male students, whereas the highest figure for female students belonged to nursing.',
              '(B1) Concerning engineering, the number of male students stood at 420, which was three times as high as the figure for female students. (B2) IT followed a similar pattern, albeit with a smaller difference between male and female students, with respective figures being 360 and 180.',
              '(B3) Nursing followed a contrasting pattern, as the number of female students stood at 310, surpassing the figure for male students by 220. (B4) Similarly, 270 female students enrolled in languages, while the figure for male students was considerably lower, at 150.',
            ],
          },
          {
            title: 'Mỗi câu dùng công thức nào',
            head: ['Câu', 'Công thức'],
            rows: [
              ['I', 'show → illustrate, the number of → how many; time "in 2023" và place "at a college" giữ nguyên.'],
              ['O1', 'Overview câu 1, trường hợp [12]: A > B, [34]: A < B.'],
              ['O2', 'Overview câu 2, trường hợp "[1]: A lớn nhất, [2]: B lớn nhất". Đối tượng có B lớn nhất là Nursing.'],
              ['B1', 'Linking word Concerning + Data "The number of … stood at" + Comparison toán chia "X times as high as".'],
              ['B2', 'Đối tượng thứ hai: A > B nhưng khoảng cách nhỏ hơn [1] (180 so với 280).'],
              ['B3', 'Cấu trúc "2 khác 1": B > A, surpassing the figure for … by [B − A] (310 − 90 = 220).'],
              ['B4', 'Linking word Similarly (cùng xu hướng với B3) + Data "[data A] + verb" + Comparison dùng số liệu thật.'],
            ],
          },
          {
            title: 'Một số liệu, nhiều cách viết (Engineering: nam 420, nữ 140)',
            head: ['Data + Comparison', 'Câu'],
            rows: [
              ['stood at + toán trừ', 'Regarding engineering, the number of male students stood at 420, which was 280 higher than the figure for female students.'],
              ['was + toán trừ', 'With regard to engineering, the number of male students was 420, exceeding the figure for female students by 280.'],
              ['[data A] + verb + toán chia', 'Concerning engineering, 420 male students enrolled in this course, triple the figure for female students.'],
              ['There were … who + toán chia', 'Turning to engineering, there were 420 male students who studied this subject, which was three times as high as the figure for female students.'],
              ['There were … who + số liệu thật', 'Concerning engineering, there were 420 male students who took this course, while the figure for female students was considerably lower, at 140.'],
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'trend',
    vi: 'Xu hướng + So sánh (có mốc thời gian)',
    en: 'Trend + Compare',
    signal: 'The line graph shows the number of people using three types of public transport in London from 2005 to 2015.',
    note: 'Số liệu thay đổi qua nhiều mốc thời gian: tả xu hướng tăng giảm và so sánh các đối tượng.',
    parts: [
      {
        title: 'Introduction',
        tone: 'm',
        lines: [
          {
            no: 1,
            role: 'Paraphrase đề',
            text: [s('[Tên biểu đồ] '), pick('illustrates', VERB, 'Động từ'), s(' [Noun Clause] [Place] [Time].')],
            guide: G_INTRO,
            convert: [...INTRO_CONVERT, { from: 'from A to B', to: 'between A and B' }],
            tip: 'Time: in [năm] giữ nguyên. Place: giữ nguyên. Đề đã qua thì chia động từ quá khứ (people using → people used).',
          },
        ],
      },
      {
        title: 'Overview',
        tone: 'o',
        lines: [
          {
            no: 2,
            role: 'Trend · xu hướng',
            text: [s('What is notable from the [tên biểu đồ] is that …')],
            lead: 'What is notable from the [tên biểu đồ] is that',
            guide: 'Xu hướng chung của các đối tượng: tăng, giảm hay ngược nhau.',
            cases: [
              { when: 'Tất cả chung một xu hướng', en: 'all [categories] witnessed an upward / a downward trend.' },
              { when: 'Chung một xu hướng, một nhóm đi ngược', en: 'all [categories] witnessed an upward / a downward trend with the exception of [A].' },
              { when: 'A, B tăng · C, D giảm', en: 'A and B witnessed an upward / a downward trend whereas C and D exhibited a contrasting pattern.' },
            ],
            tip: 'Nhóm thứ nhất có thể là ba đối tượng (A, B and C); có thể dùng show thay cho exhibit.',
          },
          {
            no: 3,
            role: 'Compare · so sánh',
            text: [s('Among all the [categories], …')],
            lead: 'Among all the [categories],',
            guide: 'Đối tượng nào đứng đầu, trong suốt giai đoạn hay chỉ một phần.',
            cases: [
              { when: 'A luôn đứng đầu', en: 'A held the top spot during the entire surveyed period.' },
              { when: 'A đứng đầu lúc đầu → B đứng đầu cuối kỳ', en: 'A held the top spot at the start; however, this position belonged to B at the end of the period.' },
              { when: 'A đứng đầu hầu hết, trừ 1–2 mốc B dẫn', en: 'A held the top spot during almost the entire surveyed period except [year/period] when B took the leading position.' },
            ],
            tip: 'spot = vị trí, điểm (top spot = vị trí đứng đầu).',
          },
        ],
      },
      {
        title: 'Body 1 · Ranking + Data',
        tone: 'g',
        lines: [
          {
            no: 4,
            role: 'Hạng 1',
            text: [s('A held the highest position'), pick(', [Data]', DATA_ONE, 'Gắn 1 số liệu')],
            guide: 'Đối tượng đứng đầu, kèm số liệu ở cuối câu.',
          },
          {
            no: 5,
            role: 'Hạng 2 (+ 3)',
            text: [
              pick(
                '[Hạng 2]',
                ['This was followed by B', 'This was followed by B and C', 'Far below was B', 'Slightly below was B', 'Far below were B and C', 'Slightly below were B and C'],
                'Xếp hạng 2 (+ 3)',
              ),
              pick(', [Data]', [...DATA_ONE, ...DATA_MANY], 'Gắn số liệu'),
            ],
            guide: 'Đối tượng xếp sau. Far = cách xa, slightly = sát nhau.',
            tip: 'Câu đảo ngữ (below was / bottom … was): một đối tượng dùng was, hai đối tượng trở lên dùng were.',
          },
          {
            no: 6,
            role: 'Hạng cuối',
            text: [
              pick('[Hạng cuối]', ['At the bottom of the list was D', 'At the bottom of the list were D and E'], 'Xếp hạng cuối'),
              pick(', [Data]', [...DATA_ONE, ...DATA_MANY], 'Gắn số liệu'),
            ],
            guide: 'Đối tượng đứng cuối. Nhiều đối tượng số liệu nhỏ thì gộp nhóm.',
            cases: [{ when: 'Từ 3 đối tượng trở lên, số liệu nhỏ', en: 'The figures for the remaining categories varied slightly, ranging from [data] to [data].' }],
          },
        ],
      },
      {
        title: 'Body 2 · Trend Language',
        tone: 'p',
        lines: [
          trendLine(
            7,
            'Xu hướng 1',
            'Subject + Trend & Degree + Data + Time. Jump / surge / plunge / plummet không dùng trạng từ.',
            [
              { when: 'Cách 2 · chủ ngữ khác + saw', en: '[Year / A] saw a sharp increase to [data] in the number of [A] in [year].' },
              { when: 'Cách 3 · was seen', en: 'A sharp increase to [data] was seen in the number of [A] in [year].' },
              { when: 'Cách 4 · There + be', en: 'There was a sharp increase to [data] in the number of [A] in [year].' },
            ],
            'Chủ ngữ khác (năm, quốc gia, nhóm người…) + register / record / see / witness / undergo / experience + a + Adj + Noun.',
          ),
          trendLine(8, 'Xu hướng 2', 'Xu hướng tiếp theo, hoặc nối 2 xu hướng trong 1 câu.', [
            { when: 'Nối 2 xu hướng · before … was recorded', en: '[S] increased sharply to [data] in [year] before a slight drop to [data] was recorded in [year].' },
            { when: 'Nối 2 xu hướng · followed by', en: '[A] witnessed a sharp increase to [data] in [year], followed by a slight drop to [data] in [year].' },
          ]),
        ],
      },
    ],
    guide: [
      {
        id: 'intro',
        label: 'Intro',
        blocks: [
          { text: 'Ưu tiên số 1: **TIME-SAVING + ACCURATE** (viết nhanh và chính xác). Phần trong [ngoặc vuông] là chỗ thay bằng thông tin của đề.' },
          {
            formula: '[Tên biểu đồ] + shows / illustrates + [Noun Clause] + [Place] + [Time]',
            text: 'Đề bài thường viết bằng **cụm danh từ (Noun Phrase)**. Khi paraphrase, đổi sang **mệnh đề danh từ (Noun Clause)**:',
          },
          {
            head: ['Đề bài (Noun Phrase)', 'Viết lại (Noun Clause)'],
            rows: INTRO_CONVERT.map((c) => [c.from, c.to]),
          },
          {
            head: ['Thành phần', 'Cách xử lý'],
            rows: [
              ['**Time**', 'in [năm] → giữ nguyên\nfrom A to B → between A and B'],
              ['**Place**', 'Giữ nguyên'],
            ],
          },
          {
            title: 'Ví dụ',
            list: [
              'Đề: The line graph **shows** **the number of** people **using** three types of public transport in London **from 2005 to 2015**.',
              'Viết lại: The line graph **illustrates** **how many** people **used** three types of public transport in London **between 2005 and 2015**.',
            ],
            head: ['Phần', 'Trong đề', 'Khi viết lại'],
            rows: [
              ['Tên biểu đồ', 'The line graph', 'giữ nguyên'],
              ['Động từ', 'shows', 'illustrates'],
              ['Noun Phrase → Noun Clause', 'the number of people', 'how many people'],
              ['N + V-ing → N + V', 'people using', 'people used (quá khứ, vì 2005–2015 đã qua)'],
              ['Place', 'in London', 'giữ nguyên'],
              ['Time', 'from 2005 to 2015', 'between 2005 and 2015'],
            ],
          },
        ],
      },
      {
        id: 'overview',
        label: 'Overview',
        blocks: [
          {
            list: ['Mở câu chung cho nhóm **Trend**: What is notable from the [tên biểu đồ] is that …', 'Mở câu chung cho nhóm **Compare**: Among all the [categories], …'],
          },
          {
            title: 'Trend (xu hướng)',
            head: ['Tình huống', 'Mẫu câu'],
            rows: [
              ['Tất cả chung một xu hướng', 'What is notable from the [tên biểu đồ] is that all [categories] witnessed an upward / a downward trend.'],
              ['Tất cả chung một xu hướng nhưng có một nhóm đi ngược lại', '… all [categories] witnessed an upward / a downward trend **with the exception of [A]**.'],
              ['A, B tăng // C, D giảm', '… A and B witnessed an upward / a downward trend **whereas C and D exhibited a contrasting pattern**.'],
            ],
            note: 'Ghi chú tay: nhóm thứ nhất có thể là ba đối tượng (A, B and C); có thể dùng **show** thay cho **exhibit**.',
          },
          {
            title: 'Compare (so sánh)',
            head: ['Tình huống', 'Mẫu câu'],
            rows: [
              ['A luôn đứng đầu', 'Among all the [categories], A held the top spot during the entire surveyed period.'],
              ['A đứng đầu lúc đầu → B đứng đầu từ sau cho tới cuối', 'Among all the [categories], A held the top spot at the start**; however, this position belonged to B at the end of the period**.'],
              ['A đứng đầu hầu hết các mốc, trừ 1–2 mốc ở giữa là B đứng đầu', 'Among all the [categories], A held the top spot during **almost** the entire surveyed period **except [year/period] when B took the leading position**.'],
            ],
            note: 'Ghi chú tay: **spot** = vị trí, điểm (top spot = vị trí đứng đầu).',
          },
        ],
      },
      {
        id: 'body1',
        label: 'Body 1',
        blocks: [
          {
            title: 'Ranking (xếp hạng)',
            head: ['Thứ hạng', 'Mẫu câu'],
            rows: [
              ['**1st**', 'A held the highest position'],
              ['**2nd (+ 3rd)**', 'This was followed by B (and C).\nFar / Slightly below **was** B. (Far / Slightly below **were** B and C.)'],
              ['**Last**', 'At the bottom of the list **was** D. (At the bottom of the list **were** D and E.)'],
            ],
          },
          {
            list: [
              '**far** = khoảng cách hai số liệu xa nhau',
              '**slightly** = khoảng cách hai số liệu gần nhau',
              'Câu đảo ngữ (below was / bottom … was): động từ chia theo chủ ngữ đứng sau → một đối tượng dùng **was**, hai đối tượng trở lên dùng **were**.',
            ],
          },
          {
            title: 'Data (gắn số liệu vào cuối câu)',
            head: ['Số lượng số liệu', 'Mẫu'],
            rows: [
              ['**1 số liệu**', '…, at [data]\n…, with [data]\n…, as its figure stood at [data]'],
              ['**Từ 2 số liệu trở lên**', '…, with respective figures being [data B and C]\n…, with corresponding figures being [data B and C]'],
            ],
          },
          {
            title: 'Gộp nhóm số liệu',
            text: 'Dùng khi có **từ 3 đối tượng trở lên với số liệu nhỏ**:',
            formula: 'The figures for the remaining categories varied slightly, ranging from … to …',
          },
        ],
      },
      {
        id: 'body2',
        label: 'Body 2',
        blocks: [
          { formula: 'Subject + Trend & Degree + Data + Time' },
          {
            title: 'Cách 1 · Chủ ngữ số lượng + Động từ + Trạng từ',
            text: '**Subject (số lượng):** the number of … · the amount of … · the percentage of … · the proportion of … · the figure for …',
            head: ['Xu hướng', 'Động từ', 'Mức độ (trạng từ)'],
            rows: [
              ['**Tăng**', 'increase · go up · rise · grow', '**Mạnh:** significantly · remarkably · considerably · dramatically · sharply\n**Vừa:** moderately · noticeably\n**Nhẹ:** slightly · modestly'],
              ['**Giảm**', 'decrease · drop · fall · go down · decline', '(như trên)'],
              ['**Tăng mạnh** (không dùng ADV)', 'jump · surge', '—'],
              ['**Giảm mạnh** (không dùng ADV)', 'plunge · plummet', '—'],
              ['**Biến động**', 'fluctuate', '**Nhẹ:** mildly · **Mạnh:** wildly'],
              ['**Giữ nguyên**', 'remain stable / unchanged', '—'],
              ['**Đạt đỉnh**', 'peak', '—'],
              ['**Chạm đáy**', 'hit a low', '—'],
            ],
          },
          {
            title: 'Cách 2 · Chủ ngữ khác + Động từ + Tính từ + Danh từ',
            text: 'Dùng cho **các chủ ngữ còn lại** (năm, quốc gia, nhóm người…):',
            formula: 'Subject + register / record / see / witness / undergo / experience + a + [Adj] + [Noun]',
            head: ['Mức độ / Xu hướng', 'Tính từ (Adj) / Danh từ (Noun)'],
            rows: [
              ['**Mạnh**', 'significant · remarkable · considerable · dramatic · sharp'],
              ['**Vừa**', 'moderate · noticeable'],
              ['**Nhẹ**', 'slight · modest'],
              ['**Tăng**', 'increase (cN) · rise (cN) · growth (**ucN**)'],
              ['**Giảm**', 'decrease (cN) · drop (cN) · fall (cN)'],
              ['**Biến động**', 'fluctuation (cN)'],
            ],
            note: 'cN = danh từ đếm được (dùng a); **ucN = danh từ không đếm được** → growth không đi với a.',
          },
          {
            title: 'Data',
            head: ['Giới từ', 'Ý nghĩa', 'Ví dụ'],
            rows: [
              ['**to** 60%', 'tăng/giảm **đến** mức', 'rose to 60%'],
              ['**by** 20%', 'tăng/giảm **thêm một khoảng** (40 → 60%, 30 → 50%)', 'rose by 20%'],
              ['**at** 80%', 'đứng ở mức (giữ nguyên, đạt đỉnh)', 'remained stable at 80% · peaked at 80%'],
              ['**of** 20%', 'đi sau danh từ', 'hit a low of 20% · a rise of 20%'],
              ['**between … and …**', 'dao động trong khoảng', 'fluctuated between 20% and 30%'],
            ],
          },
          {
            title: 'Time',
            list: ['in June · in 2010', 'from 2005 to 2010 · between 2005 and 2010', 'over the next X months / years', 'for the following X months / years'],
          },
          {
            title: 'Paraphrase một câu theo 4 cấu trúc',
            text: 'Câu gốc: Số phần trăm người dùng Facebook giảm mạnh xuống 38% vào năm 2010.',
            head: ['#', 'Cấu trúc', 'Câu'],
            rows: [
              ['1', 'S (số lượng) + ADV + Verb + Data + Time', 'The percentage of Facebook users **decreased significantly** to 38% in 2010.'],
              ['2', 'S (khác) + saw + Noun Phrase + Data + trong con số + Time', 'Facebook **saw a sharp decrease** to 38% in the percentage of users in 2010.\n2010 **saw a sharp decrease** to 38% in the percentage of Facebook users.'],
              ['3', 'Noun Phrase + Data + was seen + trong con số + Time', '**A sharp decrease** to 38% **was seen** in the percentage of Facebook users in 2010.'],
              ['4', 'There + be + Noun Phrase + Data + trong con số + Time', '**There was a sharp decrease** to 38% in the percentage of Facebook users in 2010.'],
            ],
          },
          {
            text: '**Lưu ý sửa bài viết tay:** câu 1 viết tay trong tài liệu là "the percentage of FB user significantly decrease to 38%" → phải là **users** (số nhiều) và **decreased** (quá khứ, vì năm 2010 đã qua).',
          },
          {
            title: 'Nối 2 xu hướng trong 1 câu',
            head: ['Mẫu', 'Ví dụ'],
            rows: [
              ['S + V [trend 1], before [trend 2] was recorded', 'The number of visitors to France increased sharply to 6M in 2009 **before a slight drop to 5M was recorded** in 2010.'],
              ['S + V [trend 1], followed by [trend 2]', 'France witnessed a sharp increase to 6M visitors in 2009, **followed by a slight drop to 5M** in 2010.'],
            ],
            note: '[trend 2] luôn ở dạng **cụm danh từ** (a + Adj + Noun + Data + Time), lấy từ bảng ở Cách 2.',
          },
        ],
      },
    ],
  },
]

export const findT1Type = (id: string | null | undefined) => T1_TYPES.find((t) => t.id === id)

/** Mọi câu của outline một dạng, theo thứ tự. */
export const t1Lines = (t: T1Type) => t.parts.flatMap((p) => p.lines)

const MONTHS = 'january|february|march|april|may|june|july|august|september|october|november|december'

/** App đoán dạng theo mốc thời gian trong đề: từ 2 năm (hoặc khoảng thời gian) trở lên là Trend + Compare,
 *  một năm hoặc không có năm là Compare. Chỉ dò chữ nên có thể sai. */
export function detectT1Type(prompt: string): T1TypeId | null {
  const p = prompt.toLowerCase()
  if (!p.trim()) return null
  const years = new Set(p.match(/\b(1[89]\d{2}|20\d{2})\b/g) ?? [])
  if (years.size >= 2) return 'trend'
  if (new RegExp(`\\b(from|between) (${MONTHS})\\b`).test(p)) return 'trend'
  if (/\bover (a|the) (\d+|[a-z]+)[- ](year|month|decade)\b|\bover the period\b|\bchanges? in\b/.test(p)) return 'trend'
  return 'compare'
}
