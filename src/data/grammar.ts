// ============================================================
// Ngân hàng chủ điểm ngữ pháp dựng sẵn (module 11 · thiết kế trong
// EngMaster_Redesign/11-ngu-phap/THIET-KE.md).
//
// 16 chủ điểm phủ A1→C1. Bốn chủ điểm ứng với nhóm lỗi người Việt mắc nhiều
// nhất được soạn ĐẦY ĐỦ (công thức · trường hợp dùng · từ tín hiệu · đối chiếu ·
// bẫy · câu luyện). Các chủ điểm còn lại mới có phần khung — người dùng bổ sung
// bằng màn "Thêm chủ điểm" (soạn tay hoặc nạp sổ tính Excel).
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

// ============================================================
// CHỦ ĐIỂM 1 · Thì hiện tại hoàn thành (B1) — soạn đầy đủ
// ============================================================
const PRESENT_PERFECT: GrammarTopic = {
  key: 'present-perfect',
  builtin: true,
  name: 'Thì hiện tại hoàn thành',
  nameEn: 'Present perfect',
  level: 'B1',
  group: 'Thì động từ',
  description:
    'Nối một sự việc trong quá khứ với thời điểm hiện tại. Đây là thì mà tiếng Việt không có tương đương trực tiếp, nên cần phân biệt kỹ với quá khứ đơn.',
  icon: 'clock',
  tags: ['Nhầm thì'],
  timeline: true,
  signals: [
    'already',
    'yet',
    'just',
    'ever',
    'never',
    'since',
    'for',
    'so far',
    'recently',
    'lately',
    'up to now',
    'this week',
  ],
  formulas: [
    {
      form: 'Khẳng định',
      structure: 'S + **have / has** + V3',
      example: 'She {has lived} in Da Nang for six years.',
      exampleVi: 'Cô ấy đã sống ở Đà Nẵng sáu năm rồi.',
    },
    {
      form: 'Phủ định',
      structure: 'S + **have / has not** + V3',
      example: 'They {haven’t finished} the report yet.',
      exampleVi: 'Họ vẫn chưa hoàn thành báo cáo.',
    },
    {
      form: 'Nghi vấn',
      structure: '**Have / Has** + S + V3 ?',
      example: '{Have} you ever {been} to Hue?',
      exampleVi: 'Bạn đã bao giờ đến Huế chưa?',
    },
    {
      form: 'Wh- câu hỏi',
      structure: 'Wh + **have / has** + S + V3 ?',
      example: 'How long {has} he {worked} here?',
      exampleVi: 'Anh ấy làm ở đây bao lâu rồi?',
    },
  ],
  uses: [
    {
      name: 'Kinh nghiệm trong đời',
      sample: 'I {have visited} Japan twice.',
      note: 'Không quan tâm đi khi nào — chỉ nói là đã từng.',
    },
    {
      name: 'Kết quả còn hiện hữu',
      sample: 'She {has lost} her keys.',
      note: 'Mất từ lúc nào không rõ, nhưng bây giờ vẫn chưa tìm được.',
    },
    {
      name: 'Khoảng thời gian chưa kết thúc',
      sample: 'We {have studied} English since 2019.',
      note: 'Bắt đầu 2019 và vẫn đang học tới hôm nay.',
    },
    {
      name: 'Việc vừa mới xảy ra',
      sample: 'The train {has just left}.',
      note: 'Vừa xong cách đây rất ngắn — thường đi với just.',
    },
  ],
  compare: {
    with: 'Quá khứ đơn',
    rows: [
      {
        key: 'Thời điểm',
        other: 'Xác định và đã khép lại — yesterday · last week · in 2019',
        self: 'Không nêu, hoặc khoảng chưa kết thúc — ever · so far · since 2019',
      },
      {
        key: 'Ví dụ',
        other: 'I saw that film last night. (chuyện của tối qua)',
        self: 'I have seen that film. (đã từng xem, không nói lúc nào)',
      },
      {
        key: 'Câu hỏi',
        other: 'When did you…? — hỏi một thời điểm cụ thể',
        self: 'Have you ever…? — hỏi kinh nghiệm',
      },
      {
        key: 'Liên hệ hiện tại',
        other: 'Không có',
        self: 'Luôn có — đó là lý do dùng thì này',
      },
    ],
  },
  traps: [
    {
      wrong: 'I {already sent} you the file.',
      right: 'I {have already sent} you the file.',
      why: '“Tôi đã gửi rồi” trong tiếng Việt không phân biệt hai thì. Quy tắc thay thế: có already / yet / just mà không có mốc thời gian → dùng hiện tại hoàn thành.',
    },
    {
      wrong: 'He has worked here {since five years}.',
      right: 'He has worked here {for five years}.',
      why: 'Tiếng Việt dùng chung chữ “từ” cho cả hai. Nhớ: since + điểm mốc, for + độ dài.',
    },
    {
      wrong: 'She has {wrote} three emails today.',
      right: 'She has {written} three emails today.',
      why: 'Tiếng Việt không có phân từ nên bước “đổi sang cột thứ ba” dễ bị bỏ. Sau have / has luôn là V3, không phải V2.',
    },
  ],
  items: [
    {
      id: 'pp-1',
      kind: 'cloze',
      prompt: 'She ___ in Da Nang for six years.',
      cue: 'live',
      answers: ['has lived'],
      explain:
        '“for six years” là khoảng thời gian chưa kết thúc — sự việc bắt đầu trong quá khứ và còn kéo tới hiện tại, nên dùng has + V3.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'pp-2',
      kind: 'cloze',
      prompt: 'They ___ the report yet.',
      cue: 'not finish',
      answers: ['have not finished', "haven't finished"],
      explain: 'yet trong câu phủ định luôn đi với hiện tại hoàn thành: have not + V3.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'pp-3',
      kind: 'cloze',
      prompt: 'Have you ever ___ to Hue?',
      cue: 'be',
      answers: ['been'],
      explain: 'have been to = đã từng đến (và đã về). have gone to = đã đi và còn đang ở đó.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'pp-4',
      kind: 'mcq',
      prompt: 'He has worked at this company ___ five years.',
      options: ['for', 'since', 'from', 'during'],
      answers: ['for'],
      explain: 'for đi với độ dài thời gian (five years), since đi với mốc thời gian (2019, Monday).',
      errorTag: 'Giới từ',
    },
    {
      id: 'pp-5',
      kind: 'mcq',
      prompt: 'I ___ that film three times.',
      options: ['have seen', 'saw', 'see', 'had seen'],
      answers: ['have seen'],
      explain: 'Nói về kinh nghiệm tính đến hiện tại, không nêu thời điểm → hiện tại hoàn thành.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'pp-6',
      kind: 'mcq',
      prompt: 'We have lived here ___ 2019.',
      options: ['since', 'for', 'in', 'from'],
      answers: ['since'],
      explain: 'since + mốc thời gian (2019). Nếu là độ dài (six years) thì dùng for.',
      errorTag: 'Giới từ',
    },
    {
      id: 'pp-7',
      kind: 'correct',
      prompt: 'I already sent you the file this morning.',
      tokens: ['I', 'already', 'sent', 'you', 'the', 'file', 'this', 'morning.'],
      errIndex: 2,
      answers: ['have sent'],
      explain:
        'Có already mà không có mốc thời gian đã khép lại → dùng hiện tại hoàn thành: have already sent.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'pp-8',
      kind: 'correct',
      prompt: 'She has wrote three emails today.',
      tokens: ['She', 'has', 'wrote', 'three', 'emails', 'today.'],
      errIndex: 2,
      answers: ['written'],
      explain: 'Sau have / has luôn là V3. write → wrote (V2) → written (V3).',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'pp-9',
      kind: 'correct',
      prompt: 'He has worked here since five years.',
      tokens: ['He', 'has', 'worked', 'here', 'since', 'five', 'years.'],
      errIndex: 4,
      answers: ['for'],
      explain: 'five years là độ dài thời gian nên phải dùng for, không dùng since.',
      errorTag: 'Giới từ',
    },
    {
      id: 'pp-10',
      kind: 'transform',
      prompt: 'I started learning English in 2019. (viết lại với “have”)',
      hint: 'Bắt đầu bằng “I have learned English…” · dùng since',
      answers: [
        'I have learned English since 2019',
        'I have studied English since 2019',
      ],
      explain:
        'Sự việc bắt đầu 2019 và còn tiếp diễn → hiện tại hoàn thành + since + mốc thời gian.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'pp-11',
      kind: 'transform',
      prompt: 'This is my first visit to Hue. (viết lại với “never”)',
      hint: 'Bắt đầu bằng “I have never…”',
      answers: ['I have never been to Hue before', 'I have never been to Hue'],
      explain: 'never đi với hiện tại hoàn thành để nói kinh nghiệm chưa từng có.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'pp-12',
      kind: 'cloze',
      prompt: 'The train ___ just ___ .',
      cue: 'have / leave',
      answers: ['has left'],
      explain: 'just + hiện tại hoàn thành để nói việc vừa mới xảy ra.',
      errorTag: 'Nhầm thì',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 2 · Danh từ số nhiều & đếm được (A1) — soạn đầy đủ
// ============================================================
const PLURAL_NOUNS: GrammarTopic = {
  key: 'plural-nouns',
  builtin: true,
  name: 'Danh từ số nhiều & đếm được',
  nameEn: 'Plural and countable nouns',
  level: 'A1',
  group: 'Danh từ & mạo từ',
  description:
    'Danh từ đếm được phải đổi dạng khi nhiều hơn một. Tiếng Việt không đánh dấu số nhiều nên đây là lỗi bị bỏ sót nhiều nhất ở người học Việt.',
  icon: 'layers',
  tags: ['Thiếu -s số nhiều'],
  signals: ['many', 'a few', 'several', 'three', 'both', 'a lot of', 'some', 'these', 'those'],
  formulas: [
    {
      form: 'Quy tắc chung',
      structure: 'N + **-s**',
      example: 'book → {books} · pen → {pens}',
    },
    {
      form: 'Tận cùng s, x, ch, sh, o',
      structure: 'N + **-es**',
      example: 'box → {boxes} · watch → {watches} · potato → {potatoes}',
    },
    {
      form: 'Phụ âm + y',
      structure: 'y → **-ies**',
      example: 'city → {cities} · country → {countries}',
    },
    {
      form: 'Bất quy tắc',
      structure: 'đổi hẳn dạng',
      example: 'child → {children} · man → {men} · foot → {feet}',
    },
  ],
  uses: [
    {
      name: 'Sau số đếm lớn hơn 1',
      sample: 'I bought three {books}.',
      note: 'Số đếm đã nói rõ số lượng nhưng danh từ vẫn phải mang đuôi -s.',
    },
    {
      name: 'Sau many / a few / several',
      sample: 'There are many {students} in the class.',
      note: 'Những từ này chỉ đi với danh từ đếm được số nhiều.',
    },
    {
      name: 'Danh từ không đếm được giữ nguyên',
      sample: 'I need some {information}.',
      note: 'information, advice, furniture, money… không có dạng số nhiều.',
    },
    {
      name: 'Nói chung về một loại',
      sample: '{Dogs} are loyal animals.',
      note: 'Không cần mạo từ khi nói chung về cả loài ở dạng số nhiều.',
    },
  ],
  compare: {
    with: 'Danh từ không đếm được',
    rows: [
      { key: 'Thêm -s', other: 'Không bao giờ', self: 'Có, khi nhiều hơn một' },
      { key: 'Đi với', other: 'much · a little · some', self: 'many · a few · several · số đếm' },
      { key: 'Ví dụ', other: 'much water · a little advice', self: 'many bottles · three advices ✗' },
    ],
  },
  traps: [
    {
      wrong: 'I bought three {book} at the fair.',
      right: 'I bought three {books} at the fair.',
      why: 'Sau số đếm lớn hơn một, danh từ đếm được bắt buộc ở dạng số nhiều — tiếng Việt để “ba quyển sách” là đủ.',
    },
    {
      wrong: 'She gave me many {advices}.',
      right: 'She gave me much {advice}.',
      why: 'advice là danh từ không đếm được, không có dạng số nhiều và đi với much chứ không phải many.',
    },
    {
      wrong: 'There are five {childs} in the garden.',
      right: 'There are five {children} in the garden.',
      why: 'Một nhóm danh từ bất quy tắc đổi hẳn dạng: child → children, man → men, tooth → teeth.',
    },
  ],
  items: [
    {
      id: 'pl-1',
      kind: 'correct',
      prompt: 'I bought three book at the fair yesterday.',
      tokens: ['I', 'bought', 'three', 'book', 'at', 'the', 'fair', 'yesterday.'],
      errIndex: 3,
      answers: ['books'],
      explain: 'Sau số đếm lớn hơn một, danh từ đếm được phải ở dạng số nhiều.',
      errorTag: 'Thiếu -s số nhiều',
    },
    {
      id: 'pl-2',
      kind: 'correct',
      prompt: 'There are many student in my class.',
      tokens: ['There', 'are', 'many', 'student', 'in', 'my', 'class.'],
      errIndex: 3,
      answers: ['students'],
      explain: 'many chỉ đi với danh từ đếm được ở dạng số nhiều.',
      errorTag: 'Thiếu -s số nhiều',
    },
    {
      id: 'pl-3',
      kind: 'correct',
      prompt: 'She has two childs and one dog.',
      tokens: ['She', 'has', 'two', 'childs', 'and', 'one', 'dog.'],
      errIndex: 3,
      answers: ['children'],
      explain: 'child là danh từ bất quy tắc: child → children, không thêm -s.',
      errorTag: 'Thiếu -s số nhiều',
    },
    {
      id: 'pl-4',
      kind: 'cloze',
      prompt: 'There are two ___ in the kitchen.',
      cue: 'knife',
      answers: ['knives'],
      explain: 'Danh từ tận cùng -f / -fe đổi thành -ves: knife → knives, leaf → leaves.',
      errorTag: 'Thiếu -s số nhiều',
    },
    {
      id: 'pl-5',
      kind: 'cloze',
      prompt: 'He visited three ___ last summer.',
      cue: 'city',
      answers: ['cities'],
      explain: 'Phụ âm + y → đổi y thành -ies: city → cities.',
      errorTag: 'Thiếu -s số nhiều',
    },
    {
      id: 'pl-6',
      kind: 'mcq',
      prompt: 'I need some ___ about the course.',
      options: ['information', 'informations', 'an information', 'informationes'],
      answers: ['information'],
      explain: 'information là danh từ không đếm được — không có dạng số nhiều, không có a/an.',
      errorTag: 'Thiếu -s số nhiều',
    },
    {
      id: 'pl-7',
      kind: 'mcq',
      prompt: 'How ___ money do you need?',
      options: ['much', 'many', 'few', 'several'],
      answers: ['much'],
      explain: 'money không đếm được nên hỏi bằng much; many chỉ dùng cho danh từ đếm được.',
      errorTag: 'Thiếu -s số nhiều',
    },
    {
      id: 'pl-8',
      kind: 'mcq',
      prompt: 'There ___ several boxes on the table.',
      options: ['are', 'is', 'was', 'has'],
      answers: ['are'],
      explain: 'Chủ ngữ số nhiều (several boxes) đi với are.',
      errorTag: 'Thiếu -s số nhiều',
    },
    {
      id: 'pl-9',
      kind: 'transform',
      prompt: 'This is a photo of my family. (đổi sang số nhiều)',
      hint: 'Bắt đầu bằng “These are…” · photo → photos',
      answers: ['These are photos of my family'],
      explain: 'Đổi số nhiều phải đổi cả từ chỉ định (this → these) và động từ (is → are).',
      errorTag: 'Thiếu -s số nhiều',
    },
    {
      id: 'pl-10',
      kind: 'transform',
      prompt: 'There is a child in the garden. (đổi sang “five”)',
      hint: 'There are five… · child → children',
      answers: ['There are five children in the garden'],
      explain: 'child là danh từ bất quy tắc và động từ phải đổi theo chủ ngữ số nhiều.',
      errorTag: 'Thiếu -s số nhiều',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 3 · Mạo từ a / an / the / Ø (A1) — soạn đầy đủ
// ============================================================
const ARTICLES: GrammarTopic = {
  key: 'articles',
  builtin: true,
  name: 'Mạo từ a / an / the / Ø',
  nameEn: 'Articles',
  level: 'A1',
  group: 'Danh từ & mạo từ',
  description:
    'Tiếng Việt không có mạo từ nên người học hay bỏ hẳn a/an/the, hoặc dùng the ở chỗ không cần. Quy tắc gốc: danh từ đếm được số ít luôn cần một từ hạn định.',
  icon: 'type',
  tags: ['Thiếu mạo từ'],
  signals: ['a', 'an', 'the', 'one of', 'the same', 'the first', 'the best'],
  formulas: [
    {
      form: 'a / an',
      structure: '**a / an** + danh từ đếm được số ít (lần đầu nhắc tới)',
      example: 'I saw {a} dog in the park.',
      exampleVi: 'Tôi thấy một con chó trong công viên.',
    },
    {
      form: 'the',
      structure: '**the** + danh từ đã xác định',
      example: '{The} dog was very friendly.',
      exampleVi: 'Con chó đó rất thân thiện.',
    },
    {
      form: 'Ø (không mạo từ)',
      structure: 'danh từ số nhiều / không đếm được, nói chung',
      example: '{Dogs} are loyal. · I like {music}.',
    },
    {
      form: 'Nghề nghiệp',
      structure: 'be + **a / an** + nghề',
      example: 'She is {a} teacher.',
      exampleVi: 'Cô ấy là giáo viên.',
    },
  ],
  uses: [
    {
      name: 'Nhắc lần đầu → a / an',
      sample: 'I bought {a} book yesterday.',
      note: 'Người nghe chưa biết cuốn nào.',
    },
    {
      name: 'Nhắc lại → the',
      sample: '{The} book is about history.',
      note: 'Cả hai bên đã biết đang nói cuốn nào.',
    },
    {
      name: 'Duy nhất → the',
      sample: '{The} sun rises in the east.',
      note: 'Chỉ có một mặt trời nên luôn dùng the.',
    },
    {
      name: 'Nói chung → không mạo từ',
      sample: 'I love {coffee}.',
      note: 'Danh từ không đếm được hoặc số nhiều khi nói chung thì không cần mạo từ.',
    },
  ],
  compare: {
    with: 'the',
    rows: [
      { key: 'Người nghe đã biết chưa', other: 'Đã biết / chỉ có một', self: 'Chưa biết, nhắc lần đầu' },
      { key: 'Số lượng', other: 'Số ít, số nhiều, không đếm được đều dùng', self: 'Chỉ số ít đếm được' },
      { key: 'Ví dụ', other: 'the moon · the book I bought', self: 'a book · an apple' },
    ],
  },
  traps: [
    {
      wrong: 'My sister is {teacher} at a primary school.',
      right: 'My sister is {a teacher} at a primary school.',
      why: 'Danh từ đếm được số ít luôn cần từ hạn định. Tiếng Việt nói “chị tôi là giáo viên” nên bước này bị bỏ.',
    },
    {
      wrong: 'I go to {the school} by bike every day.',
      right: 'I go to {school} by bike every day.',
      why: 'go to school / go to work / go home nói về mục đích chứ không nói về tòa nhà → không dùng the.',
    },
    {
      wrong: 'She is {a} honest person.',
      right: 'She is {an} honest person.',
      why: 'a / an chọn theo ÂM đầu chứ không theo chữ cái: honest phát âm bắt đầu bằng nguyên âm.',
    },
  ],
  items: [
    {
      id: 'ar-1',
      kind: 'correct',
      prompt: 'My sister is teacher at a primary school.',
      tokens: ['My', 'sister', 'is', 'teacher', 'at', 'a', 'primary', 'school.'],
      errIndex: 3,
      answers: ['a teacher'],
      explain: 'Danh từ đếm được số ít luôn cần một từ hạn định đứng trước.',
      errorTag: 'Thiếu mạo từ',
    },
    {
      id: 'ar-2',
      kind: 'correct',
      prompt: 'He is an university student in Hanoi.',
      tokens: ['He', 'is', 'an', 'university', 'student', 'in', 'Hanoi.'],
      errIndex: 2,
      answers: ['a'],
      explain: 'university phát âm /juː/ — âm đầu là phụ âm nên dùng a, không dùng an.',
      errorTag: 'Thiếu mạo từ',
    },
    {
      id: 'ar-3',
      kind: 'correct',
      prompt: 'I go to the school by bike every day.',
      tokens: ['I', 'go', 'to', 'the', 'school', 'by', 'bike', 'every', 'day.'],
      errIndex: 3,
      answers: ['—', 'school', 'bỏ the'],
      explain: 'go to school nói về việc đi học, không nói về tòa nhà cụ thể → bỏ the.',
      errorTag: 'Thiếu mạo từ',
    },
    {
      id: 'ar-4',
      kind: 'mcq',
      prompt: 'She is ___ honest person.',
      options: ['an', 'a', 'the', '—'],
      answers: ['an'],
      explain: 'Chọn a / an theo âm đầu: honest bắt đầu bằng âm nguyên âm.',
      errorTag: 'Thiếu mạo từ',
    },
    {
      id: 'ar-5',
      kind: 'mcq',
      prompt: '___ sun rises in the east.',
      options: ['The', 'A', 'An', '—'],
      answers: ['The'],
      explain: 'Vật duy nhất trên đời (the sun, the moon, the sky) luôn đi với the.',
      errorTag: 'Thiếu mạo từ',
    },
    {
      id: 'ar-6',
      kind: 'mcq',
      prompt: 'I love ___ coffee in the morning.',
      options: ['—', 'a', 'an', 'the'],
      answers: ['—'],
      explain: 'Danh từ không đếm được, nói chung → không dùng mạo từ.',
      errorTag: 'Thiếu mạo từ',
    },
    {
      id: 'ar-7',
      kind: 'cloze',
      prompt: 'I bought ___ book yesterday. ___ book is about history.',
      cue: 'a / the',
      answers: ['a the', 'a, the'],
      explain: 'Nhắc lần đầu dùng a, nhắc lại chính vật đó dùng the.',
      errorTag: 'Thiếu mạo từ',
    },
    {
      id: 'ar-8',
      kind: 'cloze',
      prompt: 'He works as ___ engineer for a big company.',
      cue: 'a / an',
      answers: ['an'],
      explain: 'engineer bắt đầu bằng âm nguyên âm nên dùng an.',
      errorTag: 'Thiếu mạo từ',
    },
    {
      id: 'ar-9',
      kind: 'transform',
      prompt: 'She is teacher. (sửa lại cho đúng)',
      hint: 'Thêm mạo từ trước nghề nghiệp · 4 từ',
      answers: ['She is a teacher'],
      explain: 'Nghề nghiệp ở dạng số ít luôn đi với a / an.',
      errorTag: 'Thiếu mạo từ',
    },
    {
      id: 'ar-10',
      kind: 'transform',
      prompt: 'Dog is a loyal animal. (nói chung về cả loài, dùng số nhiều)',
      hint: 'Bắt đầu bằng “Dogs are…”',
      answers: ['Dogs are loyal animals'],
      explain: 'Nói chung về cả loài thì dùng danh từ số nhiều, không cần mạo từ.',
      errorTag: 'Thiếu mạo từ',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 4 · Hòa hợp chủ ngữ – động từ (A2) — soạn đầy đủ
// ============================================================
const SUBJECT_VERB: GrammarTopic = {
  key: 'subject-verb',
  builtin: true,
  name: 'Hòa hợp chủ ngữ – động từ',
  nameEn: 'Subject–verb agreement',
  level: 'A2',
  group: 'Động từ & cấu trúc',
  description:
    'Động từ tiếng Anh đổi theo chủ ngữ, còn tiếng Việt thì không. Đây là nguồn của lỗi thiếu -s ngôi thứ ba số ít — lỗi phổ biến thứ ba của người học Việt.',
  icon: 'check',
  tags: ['Thiếu -s ngôi 3', 'Thiếu to be'],
  signals: ['every day', 'usually', 'often', 'always', 'never', 'sometimes', 'each', 'one of'],
  formulas: [
    {
      form: 'Ngôi 3 số ít',
      structure: 'He / She / It + V + **-s / -es**',
      example: 'He {goes} to the gym every morning.',
      exampleVi: 'Anh ấy tập gym mỗi sáng.',
    },
    {
      form: 'Các ngôi còn lại',
      structure: 'I / You / We / They + **V nguyên thể**',
      example: 'They {go} to the gym every morning.',
    },
    {
      form: 'Phủ định',
      structure: 'S + **do / does not** + V',
      example: 'She {doesn’t like} coffee.',
    },
    {
      form: 'Động từ to be',
      structure: 'I **am** · He/She/It **is** · You/We/They **are**',
      example: 'She {is} very tired after the trip.',
    },
  ],
  uses: [
    {
      name: 'Chủ ngữ số ít',
      sample: 'My brother {works} in Hanoi.',
      note: 'Một người/vật → động từ thêm -s.',
    },
    {
      name: 'Chủ ngữ số nhiều',
      sample: 'My brothers {work} in Hanoi.',
      note: 'Danh từ thêm -s thì động từ bỏ -s — không bao giờ cả hai cùng có.',
    },
    {
      name: 'Danh từ không đếm được',
      sample: 'Water {boils} at 100 °C.',
      note: 'Coi như số ít.',
    },
    {
      name: 'Tính từ làm vị ngữ',
      sample: 'She {is} very tired.',
      note: 'Tiếng Việt bỏ hệ từ, tiếng Anh bắt buộc có be.',
    },
  ],
  compare: {
    with: 'Chủ ngữ số nhiều',
    rows: [
      { key: 'Đuôi động từ', other: 'V nguyên thể — they work', self: 'V + -s — he works' },
      { key: 'Trợ động từ', other: 'do / don’t', self: 'does / doesn’t' },
      { key: 'to be', other: 'are', self: 'is' },
    ],
  },
  traps: [
    {
      wrong: 'He {go} to the gym every morning.',
      right: 'He {goes} to the gym every morning.',
      why: 'Động từ tiếng Việt không đổi theo chủ ngữ nên bước thêm -s hoàn toàn xa lạ với tiếng mẹ đẻ.',
    },
    {
      wrong: 'She {very tired} after the trip.',
      right: 'She {is very tired} after the trip.',
      why: 'Tiếng Việt nói thẳng “Cô ấy rất mệt”. Tiếng Anh bắt buộc có be trước tính từ làm vị ngữ.',
    },
    {
      wrong: 'He doesn’t {likes} coffee.',
      right: 'He doesn’t {like} coffee.',
      why: 'Khi đã có does thì động từ chính trở về nguyên thể — chỉ một chỗ mang dấu ngôi thứ ba.',
    },
  ],
  items: [
    {
      id: 'sv-1',
      kind: 'cloze',
      prompt: 'My brother ___ to the gym every morning.',
      cue: 'go',
      answers: ['goes'],
      explain: 'Chủ ngữ ngôi thứ ba số ít ở thì hiện tại đơn → động từ thêm -es.',
      errorTag: 'Thiếu -s ngôi 3',
    },
    {
      id: 'sv-2',
      kind: 'cloze',
      prompt: 'She ___ very tired after the trip.',
      cue: 'be',
      answers: ['is'],
      explain: 'Tính từ làm vị ngữ bắt buộc có động từ to be đứng trước.',
      errorTag: 'Thiếu to be',
    },
    {
      id: 'sv-3',
      kind: 'cloze',
      prompt: 'My parents ___ in Da Nang.',
      cue: 'live',
      answers: ['live'],
      explain: 'Chủ ngữ số nhiều → động từ giữ nguyên thể, không thêm -s.',
      errorTag: 'Thiếu -s ngôi 3',
    },
    {
      id: 'sv-4',
      kind: 'correct',
      prompt: 'He go to work by motorbike every day.',
      tokens: ['He', 'go', 'to', 'work', 'by', 'motorbike', 'every', 'day.'],
      errIndex: 1,
      answers: ['goes'],
      explain: 'He là ngôi thứ ba số ít nên động từ phải là goes.',
      errorTag: 'Thiếu -s ngôi 3',
    },
    {
      id: 'sv-5',
      kind: 'correct',
      prompt: 'She very tired after the long trip.',
      tokens: ['She', 'very', 'tired', 'after', 'the', 'long', 'trip.'],
      errIndex: 1,
      answers: ['is very'],
      explain: 'Thiếu động từ to be — câu tiếng Anh không thể đứng cạnh tính từ mà không có be.',
      errorTag: 'Thiếu to be',
    },
    {
      id: 'sv-6',
      kind: 'correct',
      prompt: 'My sister doesn’t likes coffee.',
      tokens: ['My', 'sister', 'doesn’t', 'likes', 'coffee.'],
      errIndex: 3,
      answers: ['like'],
      explain: 'Sau does / doesn’t, động từ chính trở về nguyên thể.',
      errorTag: 'Thiếu -s ngôi 3',
    },
    {
      id: 'sv-7',
      kind: 'mcq',
      prompt: 'One of my friends ___ in Japan.',
      options: ['lives', 'live', 'living', 'are living'],
      answers: ['lives'],
      explain: 'Chủ ngữ thật là “one”, số ít → lives. Cụm of my friends chỉ là bổ nghĩa.',
      errorTag: 'Thiếu -s ngôi 3',
    },
    {
      id: 'sv-8',
      kind: 'mcq',
      prompt: 'There ___ a lot of water in the bottle.',
      options: ['is', 'are', 'have', 'has'],
      answers: ['is'],
      explain: 'water là danh từ không đếm được nên coi như số ít.',
      errorTag: 'Thiếu to be',
    },
    {
      id: 'sv-9',
      kind: 'transform',
      prompt: 'They work in a bank. (đổi chủ ngữ sang “My sister”)',
      hint: 'My sister… · nhớ đuôi -s',
      answers: ['My sister works in a bank'],
      explain: 'Đổi sang ngôi thứ ba số ít thì động từ phải thêm -s.',
      errorTag: 'Thiếu -s ngôi 3',
    },
    {
      id: 'sv-10',
      kind: 'transform',
      prompt: 'He watches TV every night. (chuyển sang phủ định)',
      hint: 'He doesn’t… · động từ về nguyên thể',
      answers: ["He doesn't watch TV every night", 'He does not watch TV every night'],
      explain: 'Khi có doesn’t, dấu ngôi thứ ba nằm ở trợ động từ nên watches trở lại watch.',
      errorTag: 'Thiếu -s ngôi 3',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 5 · Verb patterns + giới từ đi kèm (B1)
// ============================================================
const VERB_PATTERNS: GrammarTopic = {
  key: 'verb-patterns',
  builtin: true,
  name: 'Verb patterns & giới từ đi kèm',
  nameEn: 'Verb patterns and dependent prepositions',
  level: 'B1',
  group: 'Động từ & cấu trúc',
  description:
    'Mỗi động từ “kết đôi” với một giới từ cố định — hoặc không đi với giới từ nào. Dịch từng chữ từ tiếng Việt sinh ra discuss about, marry with, depend of.',
  icon: 'pen',
  tags: ['Giới từ'],
  signals: ['depend on', 'listen to', 'belong to', 'apologise for', 'look forward to', 'good at'],
  formulas: [
    {
      form: 'V + giới từ cố định',
      structure: 'V + **prep** + O',
      example: 'It {depends on} the weather.',
      exampleVi: 'Chuyện đó còn tùy thời tiết.',
    },
    {
      form: 'V + O + giới từ',
      structure: 'V + O + **prep**',
      example: 'She {reminded me of} my sister.',
    },
    {
      form: 'V KHÔNG có giới từ',
      structure: 'V + **O** (không prep)',
      example: 'We {discussed} the plan. · He {married} her.',
      exampleVi: 'Thảo luận VỀ / cưới VỚI — tiếng Anh không thêm giới từ.',
    },
    {
      form: 'Sau giới từ luôn là V-ing',
      structure: 'prep + **V-ing**',
      example: 'I look forward to {hearing} from you.',
    },
  ],
  uses: [
    {
      name: 'Giới từ gắn chặt với động từ',
      sample: 'You should {listen to} your teacher.',
      note: 'listen luôn cần to; hear thì không.',
    },
    {
      name: 'Tính từ cũng có giới từ riêng',
      sample: "She is {good at} solving problems.",
      note: 'good at, interested in, afraid of, proud of.',
    },
    {
      name: 'Động từ không cần giới từ',
      sample: 'They {discussed} the problem for an hour.',
      note: 'discuss, marry, enter, answer, lack — thêm giới từ là sai.',
    },
  ],
  traps: [
    {
      wrong: 'We {discussed about} the problem for an hour.',
      right: 'We {discussed} the problem for an hour.',
      why: '“Thảo luận về” khiến người học thêm about, nhưng discuss đã bao hàm nghĩa “về” rồi.',
    },
    {
      wrong: 'It {depends of} the weather.',
      right: 'It {depends on} the weather.',
      why: '“Phụ thuộc vào” không dịch thành of. Giới từ phải học theo cụm cố định.',
    },
    {
      wrong: 'I look forward to {hear} from you.',
      right: 'I look forward to {hearing} from you.',
      why: 'to ở đây là GIỚI TỪ (look forward to), không phải to-infinitive, nên theo sau là V-ing.',
    },
  ],
  compare: null,
  items: [
    {
      id: 'vp-1',
      kind: 'cloze',
      prompt: 'It depends ___ the weather.',
      cue: 'giới từ',
      answers: ['on'],
      explain: 'depend on là cụm cố định — không dùng of dù tiếng Việt nói “phụ thuộc vào”.',
      errorTag: 'Giới từ',
    },
    {
      id: 'vp-2',
      kind: 'cloze',
      prompt: 'I am looking forward ___ from you soon.',
      cue: 'hear',
      answers: ['to hearing'],
      explain: 'look forward to + V-ing vì to ở đây là giới từ.',
      errorTag: 'Giới từ',
    },
    {
      id: 'vp-3',
      kind: 'cloze',
      prompt: 'She apologised ___ late.',
      cue: 'be',
      answers: ['for being'],
      explain: 'apologise for + V-ing.',
      errorTag: 'Giới từ',
    },
    {
      id: 'vp-4',
      kind: 'mcq',
      prompt: 'They discussed ___ the problem for an hour.',
      options: ['—', 'about', 'on', 'over'],
      answers: ['—'],
      explain: 'discuss là ngoại động từ, đi thẳng với tân ngữ, không có giới từ.',
      errorTag: 'Giới từ',
    },
    {
      id: 'vp-5',
      kind: 'mcq',
      prompt: 'This dictionary belongs ___ me.',
      options: ['to', 'for', 'with', 'of'],
      answers: ['to'],
      explain: 'belong to — luôn đi với to.',
      errorTag: 'Giới từ',
    },
    {
      id: 'vp-6',
      kind: 'correct',
      prompt: 'It depends of the weather.',
      tokens: ['It', 'depends', 'of', 'the', 'weather.'],
      errIndex: 2,
      answers: ['on'],
      explain: 'depend on, không phải depend of.',
      errorTag: 'Giới từ',
    },
    {
      id: 'vp-7',
      kind: 'correct',
      prompt: 'He listened the music all evening.',
      tokens: ['He', 'listened', 'the', 'music', 'all', 'evening.'],
      errIndex: 1,
      answers: ['listened to'],
      explain: 'listen luôn cần to trước tân ngữ; chỉ hear mới đi thẳng.',
      errorTag: 'Giới từ',
    },
    {
      id: 'vp-8',
      kind: 'correct',
      prompt: 'She is very good in solving problems.',
      tokens: ['She', 'is', 'very', 'good', 'in', 'solving', 'problems.'],
      errIndex: 4,
      answers: ['at'],
      explain: 'good at + V-ing.',
      errorTag: 'Giới từ',
    },
    {
      id: 'vp-9',
      kind: 'transform',
      prompt: 'He is interested in football. (viết lại với “keen”)',
      hint: 'He is keen… · 5 từ',
      answers: ['He is keen on football'],
      explain: 'be keen on = be interested in.',
      errorTag: 'Giới từ',
    },
    {
      id: 'vp-10',
      kind: 'transform',
      prompt: 'She got married with a doctor. (sửa lại cho đúng)',
      hint: 'marry đi thẳng với tân ngữ hoặc “be married to”',
      answers: ['She married a doctor', 'She got married to a doctor'],
      explain: 'marry sb hoặc be/get married to sb — không có married with.',
      errorTag: 'Giới từ',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 6 · Câu hỏi đuôi & câu hỏi gián tiếp (A2)
// ============================================================
const QUESTION_FORMS: GrammarTopic = {
  key: 'question-forms',
  builtin: true,
  name: 'Câu hỏi đuôi & câu hỏi gián tiếp',
  nameEn: 'Tag questions and indirect questions',
  level: 'A2',
  group: 'Trật tự từ & nhấn mạnh',
  description:
    'Hai kiểu câu hỏi có trật tự riêng: câu hỏi đuôi phải đảo dấu, còn câu hỏi gián tiếp thì KHÔNG đảo — đây là chỗ người Việt hay giữ nguyên trật tự câu hỏi trực tiếp.',
  icon: 'shuffle',
  tags: ['Trật tự từ'],
  signals: ['isn’t it', 'aren’t I', 'shall we', 'will you', 'Could you tell me…', 'Do you know…'],
  formulas: [
    {
      form: 'Câu hỏi đuôi',
      structure: 'Khẳng định + **đuôi phủ định** ·  Phủ định + **đuôi khẳng định**',
      example: "She is a teacher, {isn't she}? · You don't smoke, {do you}?",
    },
    {
      form: 'Ngoại lệ',
      structure: 'I am… → **aren’t I** · Let’s… → **shall we** · Câu mệnh lệnh → **will you**',
      example: "I'm late, {aren't I}? · Let's go, {shall we}?",
    },
    {
      form: 'Câu hỏi gián tiếp',
      structure: 'Could you tell me + Wh + **S + V** (không đảo, không do/does)',
      example: 'Could you tell me where {the station is}?',
    },
    {
      form: 'Gián tiếp dạng Yes/No',
      structure: 'Do you know **if / whether** + S + V',
      example: 'Do you know {if he is} coming?',
    },
  ],
  uses: [
    {
      name: 'Xác nhận thông tin',
      sample: "You are Vietnamese, {aren't you}?",
      note: 'Người nói đã đoán câu trả lời, chỉ cần xác nhận.',
    },
    {
      name: 'Hỏi lịch sự',
      sample: 'Could you tell me {where the bank is}?',
      note: 'Lịch sự hơn hẳn “Where is the bank?”.',
    },
    {
      name: 'Rủ rê / đề nghị',
      sample: "Let's take a break, {shall we}?",
      note: 'Let’s luôn đi với shall we.',
    },
  ],
  traps: [
    {
      wrong: 'Do you know where {is the station}?',
      right: 'Do you know where {the station is}?',
      why: 'Câu hỏi gián tiếp giữ trật tự S + V như câu kể — không đảo động từ lên trước chủ ngữ.',
    },
    {
      wrong: 'She is a teacher, {isn’t it}?',
      right: 'She is a teacher, {isn’t she}?',
      why: 'Đuôi phải lặp lại đúng chủ ngữ (she), không mặc định “isn’t it” như thói quen nói.',
    },
    {
      wrong: 'You don’t like coffee, {don’t you}?',
      right: 'You don’t like coffee, {do you}?',
      why: 'Câu chính phủ định thì đuôi phải khẳng định — hai vế luôn ngược dấu.',
    },
  ],
  compare: {
    with: 'Câu hỏi trực tiếp',
    rows: [
      { key: 'Trật tự', other: 'Đảo: Where is the station?', self: 'Giữ nguyên: … where the station is' },
      { key: 'Trợ động từ', other: 'Do you like…?', self: '… if you like… (bỏ do)' },
      { key: 'Sắc thái', other: 'Hỏi thẳng', self: 'Lịch sự, gián tiếp' },
    ],
  },
  items: [
    {
      id: 'tq-1',
      kind: 'cloze',
      prompt: 'She is a teacher, ___ ?',
      cue: 'câu hỏi đuôi',
      answers: ["isn't she", 'is not she'],
      explain: 'Câu chính khẳng định → đuôi phủ định, lặp lại đúng chủ ngữ she.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'tq-2',
      kind: 'cloze',
      prompt: "You don't like coffee, ___ ?",
      cue: 'câu hỏi đuôi',
      answers: ['do you'],
      explain: 'Câu chính phủ định → đuôi khẳng định.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'tq-3',
      kind: 'cloze',
      prompt: "Let's go out tonight, ___ ?",
      cue: 'câu hỏi đuôi',
      answers: ['shall we'],
      explain: 'Let’s luôn đi với shall we.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'tq-4',
      kind: 'mcq',
      prompt: "I'm late again, ___ ?",
      options: ["aren't I", 'am not I', "amn't I", 'are I'],
      answers: ["aren't I"],
      explain: 'I am không có dạng viết tắt phủ định, nên câu hỏi đuôi dùng aren’t I.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'tq-5',
      kind: 'mcq',
      prompt: 'Could you tell me where ___ ?',
      options: ['the station is', 'is the station', 'does the station', 'is station'],
      answers: ['the station is'],
      explain: 'Câu hỏi gián tiếp giữ trật tự S + V, không đảo.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'tq-6',
      kind: 'correct',
      prompt: 'She can swim very well, can not her?',
      tokens: ['She', 'can', 'swim', 'very', 'well,', 'can', 'not', 'her?'],
      errIndex: 7,
      answers: ['she?'],
      explain: 'Đuôi câu hỏi dùng đại từ chủ ngữ (she), không dùng tân ngữ (her).',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'tq-7',
      kind: 'correct',
      prompt: 'You are coming tonight, are you?',
      tokens: ['You', 'are', 'coming', 'tonight,', 'are', 'you?'],
      errIndex: 4,
      answers: ["aren't"],
      explain: 'Hai vế phải ngược dấu: câu khẳng định → đuôi phủ định.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'tq-8',
      kind: 'correct',
      prompt: 'Do you know where does he live?',
      tokens: ['Do', 'you', 'know', 'where', 'does', 'he', 'live?'],
      errIndex: 4,
      answers: ['he lives?'],
      explain: 'Trong câu hỏi gián tiếp bỏ does và đưa động từ về sau chủ ngữ: where he lives.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'tq-9',
      kind: 'transform',
      prompt: 'Where is the post office? (hỏi lịch sự với “Could you tell me”)',
      hint: 'Could you tell me where… · không đảo',
      answers: ['Could you tell me where the post office is'],
      explain: 'Câu hỏi gián tiếp giữ nguyên trật tự chủ ngữ – động từ.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'tq-10',
      kind: 'transform',
      prompt: 'Is he coming tonight? (hỏi gián tiếp với “Do you know”)',
      hint: 'Do you know if… ',
      answers: ['Do you know if he is coming tonight', 'Do you know whether he is coming tonight'],
      explain: 'Câu hỏi Yes/No khi chuyển gián tiếp cần if hoặc whether.',
      errorTag: 'Trật tự từ',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 7 · Phrasal verbs thông dụng (B1)
// ============================================================
const PHRASAL_VERBS: GrammarTopic = {
  key: 'phrasal-verbs',
  builtin: true,
  name: 'Phrasal verbs thông dụng',
  nameEn: 'Common phrasal verbs',
  level: 'B1',
  group: 'Động từ & cấu trúc',
  description:
    'Động từ + tiểu từ tạo nghĩa mới không đoán được từ nghĩa gốc. Mảng khiến người học Việt nghe hiểu chậm nhất, và hay đặt sai vị trí đại từ.',
  icon: 'stack',
  tags: ['Giới từ'],
  signals: ['turn on/off', 'give up', 'look after', 'pick up', 'get on with', 'put off', 'find out'],
  formulas: [
    {
      form: 'Tách được (V + adv)',
      structure: 'turn **on** the light = turn the light **on**',
      example: 'Turn {the light on}. · Turn {on the light}.',
    },
    {
      form: 'Đại từ PHẢI đứng giữa',
      structure: 'V + **it / him / them** + adv',
      example: 'Turn {it off}. (không nói “turn off it”)',
    },
    {
      form: 'Không tách được (V + prep)',
      structure: 'V + **prep** + O',
      example: 'She {looks after} her sister. (không nói “looks her sister after”)',
    },
    {
      form: 'Ba từ',
      structure: 'V + adv + **prep**',
      example: 'I {get on with} my colleagues. · We {ran out of} milk.',
    },
  ],
  uses: [
    {
      name: 'Sinh hoạt hằng ngày',
      sample: 'Please {turn off} the TV.',
      note: 'Văn nói dùng phrasal verb nhiều hơn động từ trang trọng (switch off).',
    },
    {
      name: 'Nói về thói quen, quan hệ',
      sample: 'He {gave up} smoking last year.',
      note: 'give up = từ bỏ; get on with = hòa hợp với.',
    },
    {
      name: 'Trong bài nghe / phim',
      sample: 'We {ran out of} time.',
      note: 'Nghĩa cả cụm, không cộng nghĩa từng từ.',
    },
  ],
  traps: [
    {
      wrong: 'I will pick {up you} at the airport.',
      right: 'I will pick {you up} at the airport.',
      why: 'Đại từ (you, it, them) bắt buộc chen vào giữa động từ và tiểu từ.',
    },
    {
      wrong: 'Can you look {for} my dog this weekend?',
      right: 'Can you look {after} my dog this weekend?',
      why: 'Đổi tiểu từ là đổi hẳn nghĩa: look for = tìm, look after = trông nom.',
    },
    {
      wrong: 'He gave {in} smoking last year.',
      right: 'He gave {up} smoking last year.',
      why: 'give in = chịu thua, give up = từ bỏ — phải nhớ theo cả cụm.',
    },
  ],
  compare: null,
  items: [
    {
      id: 'ph-1',
      kind: 'cloze',
      prompt: 'Please turn ___ the light before you leave.',
      cue: 'tắt',
      answers: ['off'],
      explain: 'turn off = tắt; turn on = bật.',
      errorTag: 'Giới từ',
    },
    {
      id: 'ph-2',
      kind: 'cloze',
      prompt: 'I will pick you ___ at eight.',
      cue: 'đón',
      answers: ['up'],
      explain: 'pick sb up = đón ai; đại từ you nằm giữa động từ và up.',
      errorTag: 'Giới từ',
    },
    {
      id: 'ph-3',
      kind: 'cloze',
      prompt: 'We have run ___ ___ milk.',
      cue: 'hết sạch',
      answers: ['out of'],
      explain: 'run out of = dùng hết, cụm ba từ nên không tách được.',
      errorTag: 'Giới từ',
    },
    {
      id: 'ph-4',
      kind: 'mcq',
      prompt: 'Can you look ___ my dog this weekend?',
      options: ['after', 'for', 'up', 'at'],
      answers: ['after'],
      explain: 'look after = trông nom. look for = tìm kiếm.',
      errorTag: 'Giới từ',
    },
    {
      id: 'ph-5',
      kind: 'mcq',
      prompt: 'She gets ___ well with her new colleagues.',
      options: ['on', 'up', 'over', 'by'],
      answers: ['on'],
      explain: 'get on (with sb) = hòa hợp với ai.',
      errorTag: 'Giới từ',
    },
    {
      id: 'ph-6',
      kind: 'correct',
      prompt: 'He gave in smoking last year.',
      tokens: ['He', 'gave', 'in', 'smoking', 'last', 'year.'],
      errIndex: 2,
      answers: ['up'],
      explain: 'give up = từ bỏ; give in = chịu thua.',
      errorTag: 'Giới từ',
    },
    {
      id: 'ph-7',
      kind: 'correct',
      prompt: 'The meeting was put of until Friday.',
      tokens: ['The', 'meeting', 'was', 'put', 'of', 'until', 'Friday.'],
      errIndex: 4,
      answers: ['off'],
      explain: 'put off = hoãn lại.',
      errorTag: 'Giới từ',
    },
    {
      id: 'ph-8',
      kind: 'correct',
      prompt: 'Please look up it in the dictionary.',
      tokens: ['Please', 'look', 'up', 'it', 'in', 'the', 'dictionary.'],
      errIndex: 2,
      answers: ['it up'],
      explain: 'Đại từ it phải đứng giữa: look it up (bỏ it ở sau).',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'ph-9',
      kind: 'transform',
      prompt: 'I will pick up you at the airport. (sửa trật tự đại từ)',
      hint: 'Đại từ nằm giữa động từ và tiểu từ',
      answers: ['I will pick you up at the airport'],
      explain: 'Với phrasal verb tách được, đại từ bắt buộc chen vào giữa.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'ph-10',
      kind: 'transform',
      prompt: 'Please return the book to me. (dùng phrasal verb “give back”)',
      hint: 'Please give…',
      answers: ['Please give the book back to me', 'Please give me the book back'],
      explain: 'give sth back = trả lại.',
      errorTag: 'Giới từ',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 8 · Modal perfect (B2)
// ============================================================
const MODAL_PERFECT: GrammarTopic = {
  key: 'modal-perfect',
  builtin: true,
  name: 'Modal perfect — suy đoán & tiếc nuối',
  nameEn: 'Modal perfect (must have / should have / can’t have)',
  level: 'B2',
  group: 'Động từ & cấu trúc',
  description:
    'Nối tiếp Động từ khuyết thiếu ở B1: nói về chuyện ĐÃ xảy ra — suy đoán chắc chắn, phủ nhận, hoặc tiếc vì đã không làm.',
  icon: 'bulb',
  tags: ['Nhầm thì'],
  signals: ['must have', "can't have", 'should have', 'might have', "needn't have", 'could have'],
  formulas: [
    {
      form: 'Suy đoán chắc chắn',
      structure: 'S + **must have** + V3',
      example: 'He {must have worked} all night.',
      exampleVi: 'Chắc chắn anh ấy đã làm việc cả đêm.',
    },
    {
      form: 'Phủ nhận chắc chắn',
      structure: 'S + **can’t / couldn’t have** + V3',
      example: 'She {can’t have seen} me.',
      exampleVi: 'Không đời nào cô ấy nhìn thấy tôi.',
    },
    {
      form: 'Tiếc / trách móc',
      structure: 'S + **should (not) have** + V3',
      example: 'You {should have called} me.',
      exampleVi: 'Đáng lẽ bạn phải gọi cho tôi.',
    },
    {
      form: 'Việc thừa',
      structure: 'S + **needn’t have** + V3',
      example: 'You {needn’t have cooked} so much.',
    },
  ],
  uses: [
    {
      name: 'Đoán nguyên nhân',
      sample: 'The lights are off — they {must have gone} out.',
      note: 'Bằng chứng ở hiện tại, kết luận về quá khứ.',
    },
    {
      name: 'Bác bỏ một khả năng',
      sample: 'He {can’t have finished} it that fast.',
      note: 'Chắc chắn KHÔNG xảy ra — không dùng mustn’t have.',
    },
    {
      name: 'Nói điều đáng lẽ phải làm',
      sample: 'I {should have booked} earlier.',
      note: 'Thực tế đã không làm — luôn kèm sắc thái tiếc.',
    },
  ],
  traps: [
    {
      wrong: 'You should have {call} me yesterday.',
      right: 'You should have {called} me yesterday.',
      why: 'Sau have luôn là V3. Tiếng Việt không có phân từ nên bước này hay bị bỏ.',
    },
    {
      wrong: 'She must {have went} home early.',
      right: 'She must {have gone} home early.',
      why: 'go → went (V2) → gone (V3); modal perfect cần cột thứ ba.',
    },
    {
      wrong: 'He {mustn’t have} sent the email — it never arrived.',
      right: 'He {can’t have} sent the email — it never arrived.',
      why: 'Phủ định của suy đoán chắc chắn là can’t have, không phải mustn’t have (nghĩa là cấm đoán).',
    },
  ],
  compare: {
    with: 'Động từ khuyết thiếu (hiện tại)',
    rows: [
      { key: 'Thời gian', other: 'Hiện tại / tương lai', self: 'Chuyện đã xảy ra' },
      { key: 'Cấu trúc', other: 'must + V', self: 'must + have + V3' },
      { key: 'Ví dụ', other: 'He must be tired.', self: 'He must have been tired.' },
    ],
  },
  items: [
    {
      id: 'mp-1',
      kind: 'cloze',
      prompt: 'The lights are off — they ___ out.',
      cue: 'must / go',
      answers: ['must have gone'],
      explain: 'Suy đoán chắc chắn về quá khứ: must have + V3.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'mp-2',
      kind: 'cloze',
      prompt: 'You ___ me — I waited for an hour.',
      cue: 'should / call',
      answers: ['should have called'],
      explain: 'should have + V3 = đáng lẽ phải làm nhưng đã không làm.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'mp-3',
      kind: 'cloze',
      prompt: 'She ___ me; she was looking the other way.',
      cue: "can't / see",
      answers: ["can't have seen", 'cannot have seen'],
      explain: 'Phủ nhận chắc chắn dùng can’t have + V3.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'mp-4',
      kind: 'mcq',
      prompt: 'He looks exhausted. He ___ all night.',
      options: ['must have worked', 'must work', 'should have worked', 'can have worked'],
      answers: ['must have worked'],
      explain: 'Bằng chứng hiện tại → kết luận chắc chắn về quá khứ.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'mp-5',
      kind: 'mcq',
      prompt: 'You ___ so much food — nobody ate it.',
      options: ["needn't have cooked", 'mustn’t have cooked', "didn't need cook", 'should cook'],
      answers: ["needn't have cooked"],
      explain: 'needn’t have + V3 = đã làm nhưng hóa ra không cần.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'mp-6',
      kind: 'correct',
      prompt: 'You should have call me yesterday.',
      tokens: ['You', 'should', 'have', 'call', 'me', 'yesterday.'],
      errIndex: 3,
      answers: ['called'],
      explain: 'Sau have phải là V3: called.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'mp-7',
      kind: 'correct',
      prompt: 'She must have went home early.',
      tokens: ['She', 'must', 'have', 'went', 'home', 'early.'],
      errIndex: 3,
      answers: ['gone'],
      explain: 'went là V2; modal perfect cần V3 gone.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'mp-8',
      kind: 'correct',
      prompt: 'He mustn’t have sent the email; it never arrived.',
      tokens: ['He', 'mustn’t', 'have', 'sent', 'the', 'email;', 'it', 'never', 'arrived.'],
      errIndex: 1,
      answers: ["can't", 'cannot'],
      explain: 'Phủ định của suy đoán chắc chắn là can’t have, không dùng mustn’t have.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'mp-9',
      kind: 'transform',
      prompt: 'I’m sure he forgot the meeting. (dùng “must have”)',
      hint: 'He must have… · forget → forgotten',
      answers: ['He must have forgotten the meeting'],
      explain: 'must have + V3 diễn tả suy đoán chắc chắn về quá khứ.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'mp-10',
      kind: 'transform',
      prompt: 'It was a mistake not to book the tickets earlier. (dùng “should have”)',
      hint: 'We should have…',
      answers: ['We should have booked the tickets earlier', 'I should have booked the tickets earlier'],
      explain: 'should have + V3 nói điều đáng lẽ phải làm.',
      errorTag: 'Nhầm thì',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 9 · Câu ước — wish / if only / would rather (B2)
// ============================================================
const WISH_CLAUSES: GrammarTopic = {
  key: 'wish-clauses',
  builtin: true,
  name: 'Câu ước — wish / if only',
  nameEn: 'Wish, if only and would rather',
  level: 'B2',
  group: 'Câu phức',
  description:
    'Ước điều trái với thực tế. Quy tắc gốc: lùi một bậc thì so với thực tế — hiện tại lùi về quá khứ đơn, quá khứ lùi về quá khứ hoàn thành.',
  icon: 'sparkle',
  tags: ['Nhầm thì'],
  signals: ['I wish', 'If only', 'would rather', 'It’s time'],
  formulas: [
    {
      form: 'Ước ở hiện tại',
      structure: 'wish + S + **V2 / were**',
      example: 'I wish I {knew} the answer.',
      exampleVi: 'Ước gì tôi biết câu trả lời (thực tế: không biết).',
    },
    {
      form: 'Tiếc về quá khứ',
      structure: 'wish + S + **had + V3**',
      example: 'She wishes she {had studied} harder.',
    },
    {
      form: 'Mong người khác đổi',
      structure: 'wish + S + **would** + V',
      example: 'I wish he {would stop} interrupting.',
    },
    {
      form: 'would rather',
      structure: 'would rather + S + **V2**',
      example: 'I’d rather you {didn’t smoke} here.',
    },
  ],
  uses: [
    {
      name: 'Ước trái hiện tại',
      sample: 'I wish I {were} taller.',
      note: 'Trang trọng dùng were cho mọi ngôi.',
    },
    {
      name: 'Tiếc chuyện đã rồi',
      sample: 'If only I {had known} earlier!',
      note: 'If only nhấn mạnh hơn wish.',
    },
    {
      name: 'Bực mình vì thói quen người khác',
      sample: 'I wish they {would turn} the music down.',
      note: 'would chỉ dùng khi mong người khác thay đổi, không dùng cho chính mình.',
    },
  ],
  traps: [
    {
      wrong: 'I wish I {have} more free time.',
      right: 'I wish I {had} more free time.',
      why: 'Ước trái với hiện tại phải lùi một bậc về quá khứ đơn.',
    },
    {
      wrong: 'She wishes she {has studied} harder last year.',
      right: 'She wishes she {had studied} harder last year.',
      why: 'Tiếc về quá khứ dùng quá khứ hoàn thành, không dùng hiện tại hoàn thành.',
    },
    {
      wrong: 'I wish I {would be} taller.',
      right: 'I wish I {were} taller.',
      why: 'would chỉ dùng để mong NGƯỜI KHÁC đổi hành vi, không dùng cho bản thân.',
    },
  ],
  compare: {
    with: 'Câu điều kiện loại 2',
    rows: [
      { key: 'Ý nghĩa', other: 'Giả định một tình huống', self: 'Tiếc vì thực tế không như vậy' },
      { key: 'Ví dụ', other: 'If I knew the answer, I would tell you.', self: 'I wish I knew the answer.' },
      { key: 'Vế còn lại', other: 'Có mệnh đề chính (would + V)', self: 'Không cần mệnh đề chính' },
    ],
  },
  items: [
    {
      id: 'wi-1',
      kind: 'cloze',
      prompt: 'I wish I ___ the answer.',
      cue: 'know',
      answers: ['knew'],
      explain: 'Ước trái hiện tại → lùi về quá khứ đơn.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'wi-2',
      kind: 'cloze',
      prompt: 'She wishes she ___ harder last year.',
      cue: 'study',
      answers: ['had studied'],
      explain: 'Tiếc về quá khứ → quá khứ hoàn thành.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'wi-3',
      kind: 'cloze',
      prompt: "I'd rather you ___ smoking in here.",
      cue: 'stop',
      answers: ['stopped'],
      explain: 'would rather + S + V2.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'wi-4',
      kind: 'mcq',
      prompt: 'I wish it ___ raining.',
      options: ['would stop', 'stops', 'will stop', 'has stopped'],
      answers: ['would stop'],
      explain: 'Mong một tình trạng bên ngoài thay đổi → wish + would + V.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'wi-5',
      kind: 'mcq',
      prompt: 'If only I ___ taller!',
      options: ['were', 'am', 'will be', 'have been'],
      answers: ['were'],
      explain: 'Ước trái hiện tại; were dùng cho mọi ngôi trong văn trang trọng.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'wi-6',
      kind: 'correct',
      prompt: 'I wish I have more free time.',
      tokens: ['I', 'wish', 'I', 'have', 'more', 'free', 'time.'],
      errIndex: 3,
      answers: ['had'],
      explain: 'Lùi một bậc: have → had.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'wi-7',
      kind: 'correct',
      prompt: 'She wishes she has studied harder.',
      tokens: ['She', 'wishes', 'she', 'has', 'studied', 'harder.'],
      errIndex: 3,
      answers: ['had'],
      explain: 'Tiếc về quá khứ dùng had + V3, không dùng has.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'wi-8',
      kind: 'correct',
      prompt: 'I wish I would be taller.',
      tokens: ['I', 'wish', 'I', 'would', 'be', 'taller.'],
      errIndex: 3,
      answers: ['were', 'was'],
      explain: 'Không dùng would cho chính mình; ước về bản thân dùng were.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'wi-9',
      kind: 'transform',
      prompt: "I don't have a car. (viết lại với “wish”)",
      hint: 'I wish I…',
      answers: ['I wish I had a car'],
      explain: 'Ước trái hiện tại → quá khứ đơn.',
      errorTag: 'Nhầm thì',
    },
    {
      id: 'wi-10',
      kind: 'transform',
      prompt: 'I am sorry I did not tell you earlier. (viết lại với “wish”)',
      hint: 'I wish I had…',
      answers: ['I wish I had told you earlier'],
      explain: 'Tiếc về quá khứ → wish + had + V3.',
      errorTag: 'Nhầm thì',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 10 · Mệnh đề rút gọn (B2)
// ============================================================
const PARTICIPLE_CLAUSES: GrammarTopic = {
  key: 'participle-clauses',
  builtin: true,
  name: 'Mệnh đề rút gọn (participle clauses)',
  nameEn: 'Participle clauses',
  level: 'B2',
  group: 'Câu phức',
  description:
    'Rút gọn mệnh đề để câu văn gọn và trang trọng hơn — công cụ chính của viết học thuật. Chủ động dùng V-ing, bị động dùng V3.',
  icon: 'layers',
  tags: [],
  signals: ['-ing', 'V3', 'Having + V3', 'When + V-ing', 'While + V-ing'],
  formulas: [
    {
      form: 'Chủ động',
      structure: '**V-ing** + , + mệnh đề chính',
      example: '{Walking} down the street, I met an old friend.',
      exampleVi: 'Đang đi trên phố thì tôi gặp một người bạn cũ.',
    },
    {
      form: 'Bị động',
      structure: '**V3** + , + mệnh đề chính',
      example: '{Built} in 1990, the bridge is still in use.',
    },
    {
      form: 'Việc xảy ra trước',
      structure: '**Having + V3** + , + mệnh đề chính',
      example: '{Having finished} the report, she went home.',
    },
    {
      form: 'Rút gọn mệnh đề quan hệ',
      structure: 'N + **V-ing / V3** (bỏ who/which + be)',
      example: 'The man {standing} over there is my teacher.',
    },
  ],
  uses: [
    {
      name: 'Hai việc cùng lúc',
      sample: '{Listening} to music, he cleaned the kitchen.',
      note: 'Cùng chủ ngữ thì mới rút gọn được.',
    },
    {
      name: 'Nêu nguyên nhân',
      sample: '{Being} tired, she went to bed early.',
      note: 'Thay cho “Because she was tired…”.',
    },
    {
      name: 'Rút gọn mệnh đề quan hệ',
      sample: 'The letter {written} in 1920 is very valuable.',
      note: 'Thay cho “which was written in 1920”.',
    },
  ],
  traps: [
    {
      wrong: 'The letter {writing} in 1920 is very valuable.',
      right: 'The letter {written} in 1920 is very valuable.',
      why: 'Lá thư “được viết” — nghĩa bị động nên dùng V3, không dùng V-ing.',
    },
    {
      wrong: '{Have} finished the report, she went home.',
      right: '{Having} finished the report, she went home.',
      why: 'Việc xảy ra trước dùng Having + V3, không dùng nguyên thể.',
    },
    {
      wrong: '{Walking down the street, the tree} fell on my car.',
      right: '{Walking down the street, I saw a tree} fall on my car.',
      why: 'Hai vế phải cùng chủ ngữ. Nếu không, câu thành “cái cây đang đi trên phố”.',
    },
  ],
  compare: {
    with: 'Mệnh đề đầy đủ',
    rows: [
      { key: 'Độ dài', other: 'Because he was tired, he…', self: 'Being tired, he…' },
      { key: 'Chủ ngữ', other: 'Nêu rõ ở cả hai vế', self: 'Chỉ nêu một lần — phải trùng nhau' },
      { key: 'Văn phong', other: 'Nói hằng ngày', self: 'Viết học thuật, trang trọng' },
    ],
  },
  items: [
    {
      id: 'pc-1',
      kind: 'cloze',
      prompt: '___ down the street, I met an old friend.',
      cue: 'walk',
      answers: ['Walking'],
      explain: 'Chủ động, cùng chủ ngữ với mệnh đề chính → V-ing.',
    },
    {
      id: 'pc-2',
      kind: 'cloze',
      prompt: '___ in 1990, the bridge is still in use.',
      cue: 'build',
      answers: ['Built'],
      explain: 'Cây cầu “được xây” — nghĩa bị động nên dùng V3.',
    },
    {
      id: 'pc-3',
      kind: 'cloze',
      prompt: '___ finished the report, she went home.',
      cue: 'have',
      answers: ['Having'],
      explain: 'Having + V3 cho việc xảy ra trước.',
    },
    {
      id: 'pc-4',
      kind: 'mcq',
      prompt: 'The man ___ over there is my teacher.',
      options: ['standing', 'stands', 'stood', 'is standing'],
      answers: ['standing'],
      explain: 'Rút gọn “who is standing” → standing.',
    },
    {
      id: 'pc-5',
      kind: 'mcq',
      prompt: '___ by heavy rain, the match was cancelled.',
      options: ['Delayed', 'Delaying', 'To delay', 'Delay'],
      answers: ['Delayed'],
      explain: 'Trận đấu “bị hoãn” → bị động → V3.',
    },
    {
      id: 'pc-6',
      kind: 'correct',
      prompt: 'The letter writing in 1920 is very valuable.',
      tokens: ['The', 'letter', 'writing', 'in', '1920', 'is', 'very', 'valuable.'],
      errIndex: 2,
      answers: ['written'],
      explain: 'Nghĩa bị động nên dùng V3 written.',
    },
    {
      id: 'pc-7',
      kind: 'correct',
      prompt: 'Have finished the report, she went home.',
      tokens: ['Have', 'finished', 'the', 'report,', 'she', 'went', 'home.'],
      errIndex: 0,
      answers: ['Having'],
      explain: 'Mệnh đề rút gọn chỉ việc xảy ra trước bắt đầu bằng Having.',
    },
    {
      id: 'pc-8',
      kind: 'correct',
      prompt: 'The students taking the exam yesterday were nervous.',
      tokens: ['The', 'students', 'taking', 'the', 'exam', 'yesterday', 'were', 'nervous.'],
      errIndex: 2,
      answers: ['who took'],
      explain:
        'Có mốc thời gian đã qua (yesterday) thì không rút gọn được — phải giữ mệnh đề quan hệ đầy đủ.',
    },
    {
      id: 'pc-9',
      kind: 'transform',
      prompt: 'Because he was tired, he went to bed early. (rút gọn)',
      hint: 'Being…',
      answers: ['Being tired, he went to bed early'],
      explain: 'Bỏ liên từ và chủ ngữ trùng, đưa động từ về dạng V-ing.',
    },
    {
      id: 'pc-10',
      kind: 'transform',
      prompt: 'The house which was built in 1990 is for sale. (rút gọn)',
      hint: 'The house built…',
      answers: ['The house built in 1990 is for sale'],
      explain: 'Bỏ which + be, giữ lại V3.',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 11 · Cấu trúc chẻ (C1)
// ============================================================
const CLEFT: GrammarTopic = {
  key: 'cleft-sentences',
  builtin: true,
  name: 'Cấu trúc chẻ (It is… that / What… is)',
  nameEn: 'Cleft sentences',
  level: 'C1',
  group: 'Trật tự từ & nhấn mạnh',
  description:
    'Tách câu làm hai để dồn ánh sáng vào một thành phần. Cùng nội dung nhưng đổi hẳn trọng tâm — công cụ nhấn mạnh phổ biến nhất trong viết.',
  icon: 'target',
  tags: ['Trật tự từ'],
  signals: ['It is/was … that', 'What … is', 'All (that) … is', 'The person who …'],
  formulas: [
    {
      form: 'Nhấn mạnh chủ ngữ / tân ngữ',
      structure: '**It is / was** + thành phần nhấn + **that / who** + phần còn lại',
      example: '{It was Mai who} bought the car.',
      exampleVi: 'Chính Mai là người đã mua chiếc xe.',
    },
    {
      form: 'Nhấn mạnh hành động / sự việc',
      structure: '**What** + S + V + **is / was** + …',
      example: '{What I need is} a long holiday.',
    },
    {
      form: 'Nhấn mạnh “chỉ có”',
      structure: '**All (that)** + S + V + **is** + …',
      example: '{All I want is} a cup of tea.',
    },
    {
      form: 'Nhấn mạnh thời gian / nơi chốn',
      structure: 'It is/was + trạng ngữ + **that**',
      example: '{It was in 1990 that} the company was founded.',
    },
  ],
  uses: [
    {
      name: 'Đính chính thông tin',
      sample: '{It was Nam, not Mai, who} called you.',
      note: 'Dùng khi người nghe hiểu nhầm ai/ cái gì.',
    },
    {
      name: 'Mở đầu đoạn văn nghị luận',
      sample: '{What matters most is} the quality of the data.',
      note: 'Đưa trọng tâm lên đầu câu.',
    },
    {
      name: 'Giảm nhẹ hoặc nhấn mạnh giới hạn',
      sample: '{All we can do is} wait.',
      note: 'Sau All … is thường là động từ nguyên thể không to.',
    },
  ],
  traps: [
    {
      wrong: 'It was John {which} broke the window.',
      right: 'It was John {who} broke the window.',
      why: 'Nhấn mạnh người thì dùng who (hoặc that), không dùng which.',
    },
    {
      wrong: 'What I need {are} a long holiday.',
      right: 'What I need {is} a long holiday.',
      why: 'Mệnh đề What… luôn được coi là số ít, dù phần sau là danh từ số nhiều.',
    },
    {
      wrong: '{It is} yesterday that I met her.',
      right: '{It was} yesterday that I met her.',
      why: 'Thì của “It is/was” phải khớp với thì của sự việc được nhấn mạnh.',
    },
  ],
  compare: {
    with: 'Câu thường',
    rows: [
      { key: 'Trọng tâm', other: 'Phân bố đều', self: 'Dồn vào thành phần được chẻ ra' },
      { key: 'Ví dụ', other: 'Mai bought the car.', self: 'It was Mai who bought the car.' },
      { key: 'Văn phong', other: 'Trung tính', self: 'Nhấn mạnh, đính chính' },
    ],
  },
  items: [
    {
      id: 'cl-1',
      kind: 'cloze',
      prompt: 'It was John ___ broke the window.',
      cue: 'who / that',
      answers: ['who', 'that'],
      explain: 'Nhấn mạnh người → who hoặc that.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'cl-2',
      kind: 'cloze',
      prompt: '___ I need is a long holiday.',
      cue: 'từ để hỏi',
      answers: ['What'],
      explain: 'Cấu trúc chẻ dạng What + S + V + is…',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'cl-3',
      kind: 'cloze',
      prompt: 'All I want ___ a cup of tea.',
      cue: 'be',
      answers: ['is'],
      explain: 'All (that) I want được coi là số ít.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'cl-4',
      kind: 'mcq',
      prompt: 'It ___ in 1990 that the company was founded.',
      options: ['was', 'is', 'has been', 'were'],
      answers: ['was'],
      explain: 'Sự việc trong quá khứ nên dùng It was.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'cl-5',
      kind: 'mcq',
      prompt: 'What she said ___ completely true.',
      options: ['was', 'were', 'are', 'have been'],
      answers: ['was'],
      explain: 'Mệnh đề What… luôn chia số ít.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'cl-6',
      kind: 'correct',
      prompt: 'It was John which broke the window.',
      tokens: ['It', 'was', 'John', 'which', 'broke', 'the', 'window.'],
      errIndex: 3,
      answers: ['who', 'that'],
      explain: 'which chỉ dùng cho vật; người thì dùng who / that.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'cl-7',
      kind: 'correct',
      prompt: 'What I need are a long holiday.',
      tokens: ['What', 'I', 'need', 'are', 'a', 'long', 'holiday.'],
      errIndex: 3,
      answers: ['is'],
      explain: 'Chủ ngữ là mệnh đề What… → động từ số ít.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'cl-8',
      kind: 'transform',
      prompt: 'Mai bought the car. (nhấn mạnh Mai)',
      hint: 'It was Mai…',
      answers: ['It was Mai who bought the car', 'It was Mai that bought the car'],
      explain: 'Chẻ câu để dồn trọng tâm vào chủ ngữ.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'cl-9',
      kind: 'transform',
      prompt: 'I need a long holiday. (nhấn mạnh bằng “What…”)',
      hint: 'What I need…',
      answers: ['What I need is a long holiday'],
      explain: 'What + S + V + is + phần được nhấn mạnh.',
      errorTag: 'Trật tự từ',
    },
    {
      id: 'cl-10',
      kind: 'transform',
      prompt: 'We can only wait. (nhấn mạnh bằng “All…”)',
      hint: 'All we can do…',
      answers: ['All we can do is wait'],
      explain: 'Sau All … is thường là động từ nguyên thể không to.',
      errorTag: 'Trật tự từ',
    },
  ],
}

// ============================================================
// CHỦ ĐIỂM 12 · Word formation (B2)
// ============================================================
const WORD_FORMATION: GrammarTopic = {
  key: 'word-formation',
  builtin: true,
  name: 'Word formation — tiền tố & hậu tố',
  nameEn: 'Word formation (prefixes and suffixes)',
  level: 'B2',
  group: 'Động từ & cấu trúc',
  description:
    'Đổi từ loại bằng hậu tố, đổi nghĩa bằng tiền tố. Dạng bài “cho dạng đúng của từ trong ngoặc” xuất hiện ở hầu hết kỳ thi.',
  icon: 'type',
  tags: [],
  signals: ['-tion', '-ment', '-ness', '-ity', '-ful', '-less', '-able', '-ly', 'un-', 'in-', 're-'],
  formulas: [
    {
      form: 'Danh từ',
      structure: 'V/adj + **-tion · -ment · -ness · -ity · -ship**',
      example: 'succeed → {success} · lead → {leadership} · happy → {happiness}',
    },
    {
      form: 'Tính từ',
      structure: 'N/V + **-ful · -less · -able · -ive · -al**',
      example: 'care → {careful} · use → {useless} · practice → {practical}',
    },
    {
      form: 'Trạng từ',
      structure: 'adj + **-ly**',
      example: 'clear → {clearly} · careful → {carefully}',
    },
    {
      form: 'Tiền tố đổi nghĩa',
      structure: '**un- · in- · im- · dis- · re- · over-** + từ gốc',
      example: 'clear → {unclear} · possible → {impossible} · write → {rewrite}',
    },
  ],
  uses: [
    {
      name: 'Điền dạng đúng trong bài thi',
      sample: 'He drives very {carefully}. (care)',
      note: 'Nhìn vị trí trong câu để biết cần danh từ, tính từ hay trạng từ.',
    },
    {
      name: 'Phủ định bằng tiền tố',
      sample: 'The instructions were {unclear}.',
      note: 'un- (clear, happy), im- trước m/p (possible, polite), ir- trước r (regular).',
    },
    {
      name: 'Mở rộng vốn từ theo họ từ',
      sample: 'decide → {decision} → {decisive} → {decisively}',
      note: 'Học theo cả họ từ nhanh hơn học từng từ rời.',
    },
  ],
  traps: [
    {
      wrong: 'The teacher explained it very {clear}.',
      right: 'The teacher explained it very {clearly}.',
      why: 'Bổ nghĩa cho động từ phải dùng trạng từ. Tiếng Việt dùng chung một từ “rõ ràng” cho cả hai vai trò.',
    },
    {
      wrong: 'His {behave} in class was unacceptable.',
      right: 'His {behaviour} in class was unacceptable.',
      why: 'Sau tính từ sở hữu cần một danh từ, không phải động từ nguyên thể.',
    },
    {
      wrong: 'It is {unpossible} to finish today.',
      right: 'It is {impossible} to finish today.',
      why: 'Trước p / m dùng im-, không dùng un-.',
    },
  ],
  compare: null,
  items: [
    {
      id: 'wf-1',
      kind: 'cloze',
      prompt: 'He drives very ___ .',
      cue: 'care',
      answers: ['carefully'],
      explain: 'Bổ nghĩa cho động từ drives → trạng từ carefully.',
    },
    {
      id: 'wf-2',
      kind: 'cloze',
      prompt: 'The film was a huge ___ .',
      cue: 'succeed',
      answers: ['success'],
      explain: 'Sau a huge cần một danh từ.',
    },
    {
      id: 'wf-3',
      kind: 'cloze',
      prompt: 'This plan is not very ___ .',
      cue: 'practice',
      answers: ['practical'],
      explain: 'Sau be + not very cần một tính từ.',
    },
    {
      id: 'wf-4',
      kind: 'mcq',
      prompt: 'She showed great ___ during the crisis.',
      options: ['leadership', 'leader', 'leading', 'leaded'],
      answers: ['leadership'],
      explain: 'great + danh từ trừu tượng → leadership.',
    },
    {
      id: 'wf-5',
      kind: 'mcq',
      prompt: 'The instructions were ___ , so nobody knew what to do.',
      options: ['unclear', 'disclear', 'inclear', 'nonclear'],
      answers: ['unclear'],
      explain: 'clear đi với tiền tố un-.',
    },
    {
      id: 'wf-6',
      kind: 'correct',
      prompt: 'The teacher explained the rule very clear.',
      tokens: ['The', 'teacher', 'explained', 'the', 'rule', 'very', 'clear.'],
      errIndex: 6,
      answers: ['clearly.', 'clearly'],
      explain: 'Bổ nghĩa cho động từ explained phải là trạng từ.',
    },
    {
      id: 'wf-7',
      kind: 'correct',
      prompt: 'His behave in class was unacceptable.',
      tokens: ['His', 'behave', 'in', 'class', 'was', 'unacceptable.'],
      errIndex: 1,
      answers: ['behaviour', 'behavior'],
      explain: 'Sau His cần danh từ.',
    },
    {
      id: 'wf-8',
      kind: 'correct',
      prompt: 'It is unpossible to finish the report today.',
      tokens: ['It', 'is', 'unpossible', 'to', 'finish', 'the', 'report', 'today.'],
      errIndex: 2,
      answers: ['impossible'],
      explain: 'Trước p dùng tiền tố im-.',
    },
    {
      id: 'wf-9',
      kind: 'transform',
      prompt: 'It is not possible to finish today. (dùng một tính từ phủ định)',
      hint: 'It is im… · 6 từ',
      answers: ['It is impossible to finish today'],
      explain: 'Gộp “not possible” thành impossible.',
    },
    {
      id: 'wf-10',
      kind: 'transform',
      prompt: 'She decided quickly and it was the right decision. (dùng tính từ của “decide”)',
      hint: 'She was decisive…',
      answers: ['She was decisive', 'She was very decisive'],
      explain: 'decide → decision (danh từ) → decisive (tính từ) → decisively (trạng từ).',
    },
  ],
}

// ============================================================
// 12 CHỦ ĐIỂM CÒN LẠI — mới có phần khung
// (người dùng bổ sung nội dung ở màn "Thêm chủ điểm")
// ============================================================
function outline(
  key: string,
  name: string,
  nameEn: string,
  level: CefrLevel,
  group: string,
  icon: string,
  description: string,
  tags: string[] = [],
): GrammarTopic {
  return {
    key,
    builtin: true,
    name,
    nameEn,
    level,
    group,
    description,
    icon,
    tags,
    signals: [],
    formulas: [],
    uses: [],
    traps: [],
    compare: null,
    items: [],
  }
}

const OUTLINES: GrammarTopic[] = [
  outline(
    'present-simple',
    'Hiện tại đơn & tiếp diễn',
    'Present simple & continuous',
    'A1',
    'Thì động từ',
    'clock',
    'Phân biệt việc lặp đi lặp lại với việc đang diễn ra ngay lúc nói.',
  ),
  outline(
    'word-order',
    'Trật tự từ & câu hỏi',
    'Word order and questions',
    'A1',
    'Trật tự từ & nhấn mạnh',
    'shuffle',
    'Thứ tự S – V – O, vị trí tính từ, và cách dựng câu hỏi Yes/No cùng Wh-.',
    ['Trật tự từ'],
  ),
  outline(
    'past-simple',
    'Quá khứ đơn & tiếp diễn',
    'Past simple & continuous',
    'A2',
    'Thì động từ',
    'undo',
    'Kể lại việc đã khép lại trong quá khứ và việc đang diễn ra thì bị cắt ngang.',
  ),
  outline(
    'prepositions',
    'Giới từ thời gian & nơi chốn',
    'Prepositions of time and place',
    'A2',
    'Động từ & cấu trúc',
    'target',
    'in / on / at và các cụm giới từ cố định — phần không dịch từng chữ được.',
    ['Giới từ'],
  ),
  outline(
    'comparison',
    'So sánh hơn & so sánh nhất',
    'Comparatives and superlatives',
    'A2',
    'Trật tự từ & nhấn mạnh',
    'trend',
    'Cách thêm -er/-est, dùng more/most và các dạng bất quy tắc.',
  ),
  outline(
    'modals',
    'Động từ khuyết thiếu',
    'Modal verbs',
    'B1',
    'Động từ & cấu trúc',
    'bulb',
    'can / could / must / should / may — mức độ chắc chắn, nghĩa vụ và lời khuyên.',
  ),
  outline(
    'passive',
    'Câu bị động',
    'Passive voice',
    'B1',
    'Câu phức',
    'repeat',
    'be + V3 — khi hành động quan trọng hơn người thực hiện.',
  ),
  outline(
    'relative-clauses',
    'Mệnh đề quan hệ',
    'Relative clauses',
    'B1',
    'Câu phức',
    'stack',
    'who / which / that / whose — nối hai câu và tránh lặp danh từ.',
  ),
  outline(
    'conditionals',
    'Câu điều kiện',
    'Conditionals',
    'B2',
    'Câu phức',
    'shuffle',
    'Bốn loại câu điều kiện và quy tắc không dùng will trong mệnh đề if.',
  ),
  outline(
    'gerund-infinitive',
    'Gerund & Infinitive',
    'Gerund and infinitive',
    'B2',
    'Động từ & cấu trúc',
    'pen',
    'V-ing hay to V sau động từ — nhóm khác biệt nghĩa như stop doing / stop to do.',
    ['Giới từ'],
  ),
  outline(
    'reported-speech',
    'Câu tường thuật',
    'Reported speech',
    'B2',
    'Câu phức',
    'speak',
    'Lùi thì, đổi đại từ và đổi trạng ngữ thời gian khi thuật lại lời người khác.',
  ),
  outline(
    'inversion',
    'Đảo ngữ & cấu trúc nhấn mạnh',
    'Inversion and emphasis',
    'C1',
    'Trật tự từ & nhấn mạnh',
    'sparkle',
    'Never have I… · Not only… but also… — đảo trợ động từ lên trước chủ ngữ để nhấn mạnh.',
    ['Trật tự từ'],
  ),
]

// Xếp theo cấp độ A1 → C1; trong mỗi cấp giữ thứ tự học hợp lý.
export const BUILTIN_TOPICS: GrammarTopic[] = [
  // A1
  PLURAL_NOUNS,
  ARTICLES,
  OUTLINES[0], // Hiện tại đơn & tiếp diễn
  OUTLINES[1], // Trật tự từ & câu hỏi
  // A2
  OUTLINES[2], // Quá khứ đơn & tiếp diễn
  SUBJECT_VERB,
  QUESTION_FORMS,
  OUTLINES[3], // Giới từ thời gian & nơi chốn
  OUTLINES[4], // So sánh
  // B1
  PRESENT_PERFECT,
  OUTLINES[5], // Động từ khuyết thiếu
  OUTLINES[6], // Câu bị động
  OUTLINES[7], // Mệnh đề quan hệ
  VERB_PATTERNS,
  PHRASAL_VERBS,
  // B2
  OUTLINES[8], // Câu điều kiện
  OUTLINES[9], // Gerund & Infinitive
  OUTLINES[10], // Câu tường thuật
  MODAL_PERFECT,
  WISH_CLAUSES,
  PARTICIPLE_CLAUSES,
  WORD_FORMATION,
  // C1
  OUTLINES[11], // Đảo ngữ & cấu trúc nhấn mạnh
  CLEFT,
]
