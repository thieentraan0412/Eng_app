// ============================================================
// Thư viện chủ điểm MẪU (màn "Thêm chủ điểm" → Chép từ thư viện mẫu).
// Mỗi mẫu điền sẵn cả 4 bước của wizard; người dùng sửa lại thoải mái
// trước khi lưu. Nội dung port từ mockup 11-ngu-phap/them-chu-diem.html.
// ============================================================
import type { CefrLevel } from './grammar'

export interface TopicTemplate {
  name: string
  nameEn: string
  level: CefrLevel
  icon: string
  group: string
  description: string
  tags: string[]
  /** [tên trường hợp, câu ví dụ (dùng { } để nhấn), giải thích] */
  uses: [string, string, string][]
  compare?: { with: string; rows: [string, string, string][] }
  /** câu luyện theo cú pháp dán hàng loạt */
  paste: string
}

export const TOPIC_TEMPLATES: TopicTemplate[] = [
  {
    name: 'Thì quá khứ hoàn thành',
    nameEn: 'Past perfect',
    level: 'B1',
    icon: 'undo',
    group: 'Thì động từ',
    description:
      'Diễn tả việc xảy ra trước một mốc quá khứ khác. Người Việt hay bỏ qua vì tiếng Việt chỉ dùng “đã”.',
    tags: ['Nhầm thì'],
    uses: [
      [
        'Việc xảy ra trước một mốc quá khứ',
        'When I arrived, the train {had already left}.',
        'Tàu chạy TRƯỚC lúc tôi đến — hai việc đều trong quá khứ.',
      ],
      [
        'Nguyên nhân của một việc quá khứ',
        'He could not open the door because he {had lost} his keys.',
        'Mất chìa trước, không mở được cửa sau.',
      ],
      [
        'Trong câu tường thuật',
        'She told me she {had finished} the report.',
        'Lùi một bậc so với “has finished” của lời gốc.',
      ],
    ],
    compare: {
      with: 'Quá khứ đơn',
      rows: [
        ['Số mốc thời gian', 'Một mốc duy nhất', 'Hai mốc — việc này trước việc kia'],
        ['Ví dụ', 'The train left at 6pm.', 'The train had left when I arrived.'],
        ['Từ đi kèm', 'yesterday · last week · ago', 'before · after · by the time · when'],
      ],
    },
    paste: [
      'When I arrived, the train {had already left}. (already leave) // Việc xảy ra TRƯỚC một mốc quá khứ khác.',
      'She told me she [have finished > had finished] the report.',
      'He lost the keys. Then he could not open the door. >> He could not open the door because he had lost the keys.',
      'By the time we {had arrived | arrived | arrive | were arriving}, the film had started.',
    ].join('\n'),
  },
  {
    name: 'Thì tương lai',
    nameEn: 'Future forms',
    level: 'A2',
    icon: 'trend',
    group: 'Thì động từ',
    description:
      'will · be going to · hiện tại tiếp diễn chỉ tương lai. Ba cách nói cùng một chuyện, khác nhau ở ý định.',
    tags: [],
    uses: [
      [
        'Dự đoán có căn cứ ở hiện tại',
        'Look at those clouds — it {is going to} rain.',
        'Thấy dấu hiệu ngay trước mắt → be going to.',
      ],
      [
        'Quyết định ngay lúc nói',
        'The phone is ringing. I {will} get it.',
        'Không hề định trước → will.',
      ],
      [
        'Lịch đã hẹn chắc chắn',
        'I {am meeting} my dentist at 3pm tomorrow.',
        'Đã đặt lịch → hiện tại tiếp diễn, không dùng will.',
      ],
    ],
    compare: {
      with: 'will',
      rows: [
        ['Thời điểm quyết định', 'Ngay lúc đang nói', 'Đã định từ trước'],
        ['Căn cứ', 'Cảm nhận, ý kiến', 'Dấu hiệu nhìn thấy được'],
        ['Ví dụ', 'I think it will rain.', 'Look at the sky — it is going to rain.'],
      ],
    },
    paste: [
      'Look at those clouds — it {is going to} rain. // Có dấu hiệu ở hiện tại → be going to.',
      'I think she {will | is going to | goes | will be} pass the exam.',
      'I [will meet > am meeting] my dentist at 3pm tomorrow. // Lịch đã hẹn → hiện tại tiếp diễn.',
      'It is possible that it rains tomorrow. >> It may rain tomorrow.',
    ].join('\n'),
  },
  {
    name: 'Mệnh đề trạng ngữ',
    nameEn: 'Adverbial clauses',
    level: 'B2',
    icon: 'stack',
    group: 'Câu phức',
    description:
      'when · while · although · because · so that. Nối hai mệnh đề và giữ đúng trật tự chủ ngữ – động từ.',
    tags: ['Trật tự từ'],
    uses: [
      [
        'Chỉ thời gian',
        'They arrived {while} we were having dinner.',
        'when, while, as soon as, before, after.',
      ],
      [
        'Chỉ sự nhượng bộ',
        '{Although} he was exhausted, he kept working.',
        'although, though, even though — không đi kèm but.',
      ],
      [
        'Chỉ mục đích',
        'She left early {so that} she could catch the train.',
        'so that, in order that — sau đó là một mệnh đề đầy đủ.',
      ],
    ],
    paste: [
      'She kept working {although} she was exhausted.',
      '{While | During | Since | For} I was cooking, the phone rang.',
      'Although he was tired, [but he finished > he finished] the report. // Tiếng Anh không dùng although và but cùng lúc.',
      'He was very tired. He still finished the report. >> Although he was very tired, he still finished the report.',
    ].join('\n'),
  },
  {
    name: 'Câu ước — wish / if only',
    nameEn: 'Wish clauses',
    level: 'B2',
    icon: 'sparkle',
    group: 'Câu phức',
    description: 'Ước điều trái với hiện tại, quá khứ hoặc mong người khác đổi thói quen.',
    tags: ['Nhầm thì'],
    uses: [
      ['Ước trái với hiện tại', 'I wish I {knew} the answer.', 'Thực tế là không biết → lùi về quá khứ đơn.'],
      [
        'Tiếc về quá khứ',
        'She wishes she {had studied} harder.',
        'Không thay đổi được nữa → quá khứ hoàn thành.',
      ],
      [
        'Mong người khác đổi thói quen',
        'I wish he {would stop} interrupting.',
        'Bực mình về một thói quen → would + V.',
      ],
    ],
    compare: {
      with: 'Câu điều kiện loại 2',
      rows: [
        ['Ý nghĩa', 'Giả định một tình huống', 'Tiếc vì thực tế không như vậy'],
        ['Ví dụ', 'If I knew the answer, I would tell you.', 'I wish I knew the answer.'],
      ],
    },
    paste: [
      'I wish I {knew} the answer. (know) // Ước trái hiện tại → lùi về quá khứ đơn.',
      'She wishes she [has studied > had studied] harder last year.',
      'I am not tall enough to reach it. >> I wish I were tall enough to reach it.',
      'I wish he {would stop | will stop | stops | stopped} interrupting me.',
    ].join('\n'),
  },
  {
    name: 'Danh động từ sau giới từ',
    nameEn: 'Gerund after prepositions',
    level: 'B1',
    icon: 'pen',
    group: 'Động từ & cấu trúc',
    description:
      'Sau mọi giới từ luôn là V-ing. Người Việt hay để nguyên động từ vì tiếng Việt không chia.',
    tags: ['Giới từ'],
    uses: [
      [
        'Sau giới từ đơn',
        'She is good {at solving} problems.',
        'at, in, on, for, of — sau tất cả đều là V-ing.',
      ],
      [
        'Sau cụm động từ có giới từ',
        'Thank you {for helping} me yesterday.',
        'thank sb for, apologise for, insist on…',
      ],
      [
        'Sau “to” là giới từ',
        'I look forward {to hearing} from you.',
        'Bẫy lớn: “to” ở đây là giới từ, không phải to-infinitive.',
      ],
    ],
    compare: {
      with: 'to-infinitive',
      rows: [
        ['Sau giới từ', 'Không dùng', 'Luôn dùng V-ing'],
        ['Ví dụ', 'I want to go home.', 'I am thinking of going home.'],
      ],
    },
    paste: [
      'She is good at {solving} problems. (solve) // Sau giới từ luôn là V-ing.',
      'Thank you for [help > helping] me yesterday.',
      'He apologised {for | of | to | about} arriving late.',
      'I am looking forward to it. I will hear from you. >> I look forward to hearing from you.',
    ].join('\n'),
  },
  {
    name: 'Lượng từ đếm được / không đếm được',
    nameEn: 'Quantifiers',
    level: 'A2',
    icon: 'layers',
    group: 'Danh từ & mạo từ',
    description: 'much · many · a few · a little · some · any. Gắn chặt với lỗi số nhiều của người Việt.',
    tags: ['Thiếu -s số nhiều'],
    uses: [
      [
        'Với danh từ không đếm được',
        'There is not {much} water left.',
        'much, a little, little — danh từ giữ nguyên, không thêm -s.',
      ],
      [
        'Với danh từ đếm được',
        'How {many} students are there?',
        'many, a few, few — danh từ phải ở số nhiều.',
      ],
      [
        'Dùng chung cho cả hai',
        'We have {a lot of} time and {a lot of} friends.',
        'a lot of, plenty of, some, any — không phân biệt.',
      ],
    ],
    compare: {
      with: 'Danh từ đếm được',
      rows: [
        ['Lượng từ', 'many · a few · few', 'much · a little · little'],
        ['Dạng danh từ', 'three books', 'three pieces of information'],
        ['Câu hỏi số lượng', 'How many…?', 'How much…?'],
      ],
    },
    paste: [
      'There is not {much} water left in the bottle.',
      'I have [a few informations > a little information] about the course. // information không đếm được.',
      'How {many | much | a lot | plenty} students are there in your class?',
      'The number of books is small. >> There are few books.',
    ].join('\n'),
  },
  {
    name: 'Đảo ngữ với trạng từ phủ định',
    nameEn: 'Negative inversion',
    level: 'C1',
    icon: 'shuffle',
    group: 'Trật tự từ & nhấn mạnh',
    description:
      'Never · Rarely · Not only · No sooner đứng đầu câu thì đảo trợ động từ lên trước chủ ngữ.',
    tags: ['Trật tự từ'],
    uses: [
      [
        'Trạng từ phủ định đầu câu',
        '{Never have I seen} such a sunset.',
        'Never, Rarely, Seldom, Little → đảo trợ động từ.',
      ],
      [
        'Not only … but also',
        '{Not only does she sing}, but she also plays piano.',
        'Vế đầu đảo, vế sau giữ nguyên.',
      ],
      [
        'No sooner … than',
        '{No sooner had I sat down} than the phone rang.',
        'Thường đi cùng quá khứ hoàn thành.',
      ],
    ],
    paste: [
      'Never {have I seen} such a beautiful sunset. (see) // Trạng từ phủ định đầu câu → đảo trợ động từ.',
      'Not only [she sings > does she sing] well, but she also plays the piano.',
      'I had hardly sat down when the phone rang. >> Hardly had I sat down when the phone rang.',
      'Rarely {do we see | we see | we do see | does we see} such dedication.',
    ].join('\n'),
  },
]
