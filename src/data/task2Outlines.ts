// Outline 13 câu theo dạng đề IELTS Writing Task 2.
// Nguồn: DATA/outline-dang-de.html (chép từ giáo trình Lesson 6 — Linearthinking®, gồm cả ghi chú
// viết tay trong ảnh). Các outline có source 'added' là phần bổ sung, không có trong sách.
// Mọi trường guide / hint / patterns cũng là phần bổ sung để người học biết viết gì ở từng câu.

/** Màu vế như trong sách: xanh lá, đỏ, tím (giải pháp), cam (quan điểm). */
export type Tone = 'g' | 'r' | 'p' | 'o'

export interface Seg {
  t?: string
  tone?: Tone
  /** Chỗ trống trong sách. */
  blank?: boolean
  /** Nhãn hướng dẫn (Thesis:, Paraphrase the topic:) — không phải chữ để viết vào bài. */
  label?: boolean
  strong?: boolean
  /** Nội dung điền sẵn theo quan điểm người học đã chọn. */
  byChoice?: Record<string, string>
  /** Các cách điền vào chỗ trống, hoặc các chữ thay được cho chữ trong sách (bổ sung, không có trong sách).
   *  Trang Luyện Task 2 cho bấm vào để chọn rồi ráp thành câu. */
  options?: string[]
}

export interface OutlineLine {
  no: number
  role: string
  /** Ga phụ: Expand, Example, Link to the topic. */
  minor?: boolean
  text: Seg[]
  guide: string
  hint?: string
  patterns?: string[]
  /** Ghi chú viết tay trong ảnh sách. */
  ink?: string[]
}

export interface Outline {
  id: string
  name: string
  source: 'book' | 'added'
  origin: string
  /** Màu tuyến của thân bài 1 và thân bài 2. */
  threads: [Tone, Tone]
  bodyNames: [string, string]
  notes?: string[]
  ink?: string[]
  lines: OutlineLine[]
  sample?: { prompt: string; sentences: string[] }
}

export interface OutlineChoice {
  id: string
  label: string
  outlineId: string
  note: string
}

// ------------------------------------------------------------------ Mảnh ghép
const s = (t: string, extra: Partial<Seg> = {}): Seg => ({ t, ...extra })
const lb = (t: string): Seg => ({ t, label: true })
const tone =
  (k: Tone) =>
  (t: string, extra: Partial<Seg> = {}): Seg => ({ t, tone: k, ...extra })
const g = tone('g')
const r = tone('r')
const p = tone('p')
const o = tone('o')
const blank = (k?: Tone, extra: Partial<Seg> = {}): Seg => ({ blank: true, tone: k, ...extra })
/** Chữ trong sách (options[0]) có thể đổi sang các chữ cùng nghĩa còn lại. */
const swap = (k: Tone, options: string[]): Seg => ({ t: options[0], tone: k, options })

// Cách điền dùng chung cho các câu thesis
const ADOPTED = ['adopted', 'implemented', 'introduced', 'considered']
const SIGNIFICANT = ['significant', 'important', 'considerable', 'substantial']
const MINUSES = ['disadvantages', 'drawbacks', 'downsides', 'negative effects', 'limitations']
const PLUSES = ['benefits', 'advantages', 'merits', 'positive effects']

const paraphrase: OutlineLine = {
  no: 1,
  role: 'Paraphrase đề',
  text: [lb('Paraphrase the topic:'), s('It is true that S + V', { strong: true })],
  guide: 'Viết lại đề bằng từ của bạn, không chép nguyên câu của đề.',
}

const expandExample = (no: number, guide: string, patterns: string[]): OutlineLine => ({
  no,
  role: 'Expand | Example',
  minor: true,
  text: [s('Expand | Example')],
  guide,
  patterns,
})

const idea = (no: number, role: string, sentence: string, guide: string): OutlineLine => ({
  no,
  role,
  text: [s(sentence)],
  guide,
})

const G_THESIS = 'Trả lời thẳng câu hỏi của đề bằng 2 vế. Vế 1 mở thân bài 1, vế 2 mở thân bài 2.'
const G_TOPIC1 = 'Câu chủ đề của thân bài 1: viết lại vế 1 của thesis.'
const G_TOPIC2 = 'Câu chủ đề của thân bài 2: viết lại vế 2 của thesis.'
const G_END = 'Gom lại 2 vế của thesis, không thêm ý mới.'
const SOLUTION_10 = ['By doing so, S + V.', 'This would help [N] (to) V.', 'For example, in [place], S + V.']
const SOLUTION_12 = ['This would mean that S + V.', 'As a result, S + V.', 'A good example is [N], where S + V.']
const G_SOLVE = (n: number) => `Giải pháp ở câu ${n} giải quyết vấn đề thế nào, hoặc một nơi đã làm như vậy.`
const G_MORE = (n: number) => `Giải thích thêm hoặc cho ví dụ cho ý ở câu ${n}.`

// ------------------------------------------------------------------ Outline
export const OUTLINES: Outline[] = [
  {
    id: 'outline.agree',
    name: 'Agree – Disagree',
    source: 'book',
    origin: 'Lesson 6 — Linearthinking® to develop ideas: Agree – Disagree',
    threads: ['o', 'o'],
    bodyNames: ['Lý do 1', 'Lý do 2'],
    notes: ['Sơ đồ trong sách: Conclusion → Restate your opinion (Strongly agree or Disagree).'],
    ink: ['Body 1 → give your 1st reason', 'Body 2 → give your 2nd reason', 'a ban on (…) can be imposed on …'],
    lines: [
      {
        no: 1,
        role: 'Paraphrase đề',
        text: [s('It is sometimes believed that S + V.')],
        guide: 'Viết lại đề bằng từ của bạn, không chép nguyên câu của đề.',
      },
      {
        no: 2,
        role: 'Thesis',
        text: [
          lb('Thesis:'),
          o('This essay '),
          blank('o', {
            byChoice: { agree: 'totally agrees', disagree: 'totally disagrees' },
            options: ['totally agrees', 'strongly agrees', 'completely agrees', 'totally disagrees', 'strongly disagrees', 'completely disagrees'],
          }),
          o(' with this suggestion for several reasons.'),
        ],
        guide: 'Nêu rõ bạn đồng ý hay không đồng ý. Chọn hẳn một phía.',
        hint: 'Gợi ý điền: totally agrees / disagrees',
      },
      idea(3, 'Câu chủ đề', 'The first argument given to support my opinion is that S1 + V1 [idea 1].', 'Lý do thứ nhất ủng hộ quan điểm của bạn.'),
      {
        no: 4,
        role: 'Expand',
        minor: true,
        text: [s('Expand')],
        guide: 'Giải thích ý ở câu 3: vì sao nó đúng, hoặc nó diễn ra như thế nào.',
        patterns: ['This is because S + V.', 'In other words, S + V.', 'To be more specific, S + V.'],
      },
      {
        no: 5,
        role: 'Expand',
        minor: true,
        text: [s('Expand')],
        guide: 'Nói tiếp hệ quả của điều vừa giải thích ở câu 4.',
        patterns: ['As a result, S + V.', 'Consequently, S + V.', 'This means that S + V.'],
      },
      {
        no: 6,
        role: 'Example',
        minor: true,
        text: [s('Example')],
        guide: 'Một ví dụ cụ thể (một người, một nơi, một tình huống) chứng minh ý 1.',
        patterns: ['For example, S + V.', 'For instance, in [place], S + V.', 'A case in point is [N].'],
      },
      {
        no: 7,
        role: 'Link to the topic',
        minor: true,
        text: [s('Link to the topic')],
        guide: 'Nối ý của đoạn về đề và nhắc lại quan điểm.',
        ink: ['This is why I believe that …'],
        patterns: ['This is why I believe that S + V.'],
      },
      idea(8, 'Câu chủ đề', 'Another point behind my belief is that S2 + V2 [idea 2].', 'Lý do thứ hai ủng hộ quan điểm của bạn.'),
      {
        no: 9,
        role: 'Expand',
        minor: true,
        text: [s('Expand')],
        guide: 'Giải thích ý ở câu 8: vì sao nó đúng, hoặc nó diễn ra như thế nào.',
        patterns: ['This is mainly because S + V.', 'Put simply, S + V.', 'What this means is that S + V.'],
      },
      {
        no: 10,
        role: 'Expand',
        minor: true,
        text: [s('Expand')],
        guide: 'Nói tiếp hệ quả của điều vừa giải thích ở câu 9.',
        patterns: ['Therefore, S + V.', 'As a consequence, S + V.', 'This, in turn, leads to [N / V-ing].'],
      },
      {
        no: 11,
        role: 'Example',
        minor: true,
        text: [s('Example')],
        guide: 'Một ví dụ cụ thể chứng minh ý 2.',
        patterns: ['To illustrate, S + V.', 'This can be seen in [N], where S + V.', 'A good example is [N], where S + V.'],
      },
      {
        no: 12,
        role: 'Link to the topic',
        minor: true,
        text: [s('Link to the topic')],
        guide: 'Nối ý của đoạn về đề và nhắc lại quan điểm.',
        ink: ['For these reasons, I think that …'],
        patterns: ['For these reasons, I think that S + V.'],
      },
      {
        no: 13,
        role: 'Kết bài',
        text: [
          s('In conclusion, '),
          o('I totally | entirely agree | disagree that S + V given the aforementioned arguments.', {
            byChoice: {
              agree: 'I totally agree that S + V given the aforementioned arguments.',
              disagree: 'I totally disagree that S + V given the aforementioned arguments.',
            },
          }),
        ],
        guide: 'Nhắc lại quan điểm, không thêm ý mới.',
      },
    ],
    sample: {
      prompt: 'Some people think that advertisements for unhealthy food and drinks should be banned. To what extent do you agree or disagree?',
      sentences: [
        'It is sometimes believed that a ban should be imposed on advertisements for unhealthy food and drinks.',
        'This essay totally agrees with this suggestion for several reasons.',
        'The first argument given to support my opinion is that such advertisements encourage poor eating habits, especially among children.',
        'This is because these adverts are designed to make sugary snacks and fast food look fun and desirable, so young viewers often cannot resist them.',
        'As a result, children tend to pester their parents for these products, and unhealthy food gradually becomes part of their daily diet.',
        "For example, many fast-food chains offer free toys with children's meals and promote them heavily on television, which makes these meals extremely popular with young children.",
        "This is why I believe that banning such advertisements would go a long way towards protecting children's health.",
        'Another point behind my belief is that a ban would reduce the burden on public healthcare systems.',
        'This is mainly because diets high in sugar and fat are closely linked to obesity, diabetes and heart disease.',
        'Therefore, if fewer people consumed these products, governments would spend less money treating such illnesses and could invest more in education or infrastructure.',
        'To illustrate, a patient with type 2 diabetes may need medication and regular check-ups for the rest of their life, all of which is expensive for the state.',
        'For these reasons, I think that restricting these advertisements would benefit not only individuals but also society as a whole.',
        'In conclusion, I totally agree that unhealthy food and drinks should no longer be advertised given the aforementioned arguments.',
      ],
    },
  },
  {
    id: 'outline.listing',
    name: 'Listing',
    source: 'book',
    origin: '1.2. Outline dạng Listing',
    threads: ['g', 'r'],
    bodyNames: ['Lợi ích', 'Bất lợi'],
    lines: [
      paraphrase,
      {
        no: 2,
        role: 'Thesis',
        text: [
          lb('Thesis:'),
          g('Although this can bring about some '),
          blank('g', { options: ['benefits', 'advantages', 'positive effects', 'merits'] }),
          g(', '),
          r('it can also be '),
          blank('r', { options: ['detrimental', 'harmful', 'damaging', 'problematic', 'disadvantageous'] }),
          r(' to a certain extent.'),
        ],
        guide: G_THESIS,
        hint: 'Gợi ý điền: benefits / advantages … detrimental / harmful',
      },
      { no: 3, role: 'Câu chủ đề', text: [g('On the one hand, there are several benefits of [N / N + V-ing].')], guide: G_TOPIC1 },
      idea(4, 'Lợi ích 1', 'One possible advantage is that S + V', 'Nêu lợi ích thứ nhất bằng một mệnh đề S + V.'),
      expandExample(5, G_MORE(4), ['This means that S + V.', 'As a result, S + V.', 'For example, S + V.']),
      idea(6, 'Lợi ích 2', 'Another beneficial effect could be that S + V', 'Nêu lợi ích thứ hai.'),
      expandExample(7, G_MORE(6), ['This allows [N] to V.', 'Consequently, S + V.', 'For instance, in [place], S + V.']),
      {
        no: 8,
        role: 'Câu chủ đề',
        text: [
          r("Nevertheless, [N / the fact that S' + V'] can have "),
          blank('r', { options: ['some drawbacks', 'several negative impacts', 'certain disadvantages', 'a number of downsides', 'some adverse effects'] }),
          r('.'),
        ],
        guide: G_TOPIC2,
        hint: 'Gợi ý điền: some drawbacks / several negative impacts',
      },
      idea(9, 'Bất lợi 1', 'One issue could be that S + V', 'Nêu bất lợi thứ nhất.'),
      expandExample(10, G_MORE(9), ['This could lead to [N / V-ing].', 'As a consequence, S + V.', 'For example, S + V.']),
      idea(11, 'Bất lợi 2', 'Another drawback worth mentioning is that S + V', 'Nêu bất lợi thứ hai.'),
      expandExample(12, G_MORE(11), ['This may cause [N] to V.', 'This, in turn, leads to [N / V-ing].', 'A case in point is [N].']),
      {
        no: 13,
        role: 'Kết bài',
        text: [
          s('In conclusion, '),
          g("while [N / the fact that S' + V'] can be "),
          blank('g', { options: ['beneficial', 'advantageous', 'useful', 'valuable'] }),
          g(', '),
          r('it also has several '),
          blank('r', { options: MINUSES }),
          r('.'),
        ],
        guide: G_END,
        hint: 'Gợi ý điền: beneficial … drawbacks',
      },
    ],
  },
  {
    id: 'outline.adv',
    name: 'Outweigh: Advantages > Disadvantages',
    source: 'book',
    origin: '1.3. Outline dạng Outweigh — Advantages > Disadvantages',
    threads: ['g', 'r'],
    bodyNames: ['Bất lợi (nhỏ)', 'Lợi ích (lớn)'],
    lines: [
      paraphrase,
      {
        no: 2,
        role: 'Thesis',
        text: [
          lb('Thesis:'),
          g('Although this (doing this) has several '),
          swap('g', MINUSES),
          g(', '),
          r('the '),
          swap('r', PLUSES),
          r(' may be far more '),
          swap('r', SIGNIFICANT),
          r('.'),
        ],
        guide: 'Nhượng bộ mặt yếu (bất lợi) ở vế 1, khẳng định mặt mạnh (lợi ích) ở vế 2.',
      },
      { no: 3, role: 'Câu chủ đề', text: [g('On the one hand, there can be some minor disadvantages of [N / N + V-ing].')], guide: G_TOPIC1 },
      idea(4, 'Bất lợi 1', 'One possible issue is that S + V', 'Nêu bất lợi thứ nhất.'),
      expandExample(5, G_MORE(4), ['This could lead to [N / V-ing].', 'As a result, S + V.', 'For instance, S + V.']),
      idea(6, 'Bất lợi 2', 'Another detrimental effect could be that S + V', 'Nêu bất lợi thứ hai.'),
      expandExample(7, G_MORE(6), ['This may cause [N] to V.', 'Consequently, S + V.', 'To illustrate, S + V.']),
      {
        no: 8,
        role: 'Câu chủ đề',
        text: [r("Nevertheless, [N / the fact that S' + V'] can have major advantages which overshadow these negative impacts.")],
        guide: G_TOPIC2,
      },
      idea(9, 'Lợi ích 1', 'The most obvious benefit could be that S + V', 'Nêu lợi ích lớn nhất.'),
      expandExample(10, G_MORE(9), ['This means that S + V.', 'As a consequence, S + V.', 'For example, in [place], S + V.']),
      idea(11, 'Lợi ích 2', 'Another merit worth mentioning is that S + V', 'Nêu lợi ích thứ hai.'),
      expandExample(12, G_MORE(11), ['This allows [N] to V.', 'This, in turn, leads to [N / V-ing].', 'A case in point is [N].']),
      {
        no: 13,
        role: 'Kết bài',
        text: [s('In conclusion, '), g('despite the potential downsides of [N / N + V-ing], '), r('the beneficial effects brought about are of greater importance.')],
        guide: G_END,
      },
    ],
  },
  {
    id: 'outline.dis',
    name: 'Outweigh: Disadvantages > Advantages',
    source: 'book',
    origin: '1.3. Outline dạng Outweigh — Disadvantages > Advantages',
    threads: ['g', 'r'],
    bodyNames: ['Lợi ích (nhỏ)', 'Bất lợi (lớn)'],
    ink: ['minor = mini'],
    lines: [
      paraphrase,
      {
        no: 2,
        role: 'Thesis',
        text: [
          lb('Thesis:'),
          g('Although this (doing this) has several '),
          swap('g', ['advantages', 'benefits', 'merits', 'positive effects']),
          g(', '),
          r('the '),
          swap('r', ['drawbacks', 'disadvantages', 'downsides', 'negative effects']),
          r(' may be far more '),
          swap('r', SIGNIFICANT),
          r('.'),
        ],
        guide: 'Nhượng bộ mặt yếu (lợi ích) ở vế 1, khẳng định mặt mạnh (bất lợi) ở vế 2.',
        ink: ['adj. — significant'],
      },
      { no: 3, role: 'Câu chủ đề', text: [g('On the one hand, there can be some minor benefits of [N / N + V-ing].')], guide: G_TOPIC1 },
      idea(4, 'Lợi ích 1', 'One possible advantage is that S + V', 'Nêu lợi ích thứ nhất.'),
      expandExample(5, G_MORE(4), ['This means that S + V.', 'As a result, S + V.', 'For instance, S + V.']),
      idea(6, 'Lợi ích 2', 'Another beneficial effect could be that S + V', 'Nêu lợi ích thứ hai.'),
      expandExample(7, G_MORE(6), ['This allows [N] to V.', 'Consequently, S + V.', 'To illustrate, S + V.']),
      {
        no: 8,
        role: 'Câu chủ đề',
        text: [r("Nevertheless, [N / the fact that S' + V'] can have major downsides which overshadow these positive impacts.")],
        guide: G_TOPIC2,
      },
      idea(9, 'Bất lợi 1', 'The most obvious issue could be that S + V', 'Nêu bất lợi lớn nhất.'),
      expandExample(10, G_MORE(9), ['This could lead to [N / V-ing].', 'As a consequence, S + V.', 'For example, in [place], S + V.']),
      idea(11, 'Bất lợi 2', 'Another drawback worth mentioning is that S + V', 'Nêu bất lợi thứ hai.'),
      expandExample(12, G_MORE(11), ['This may cause [N] to V.', 'This, in turn, leads to [N / V-ing].', 'A case in point is [N].']),
      {
        no: 13,
        role: 'Kết bài',
        text: [s('In conclusion, '), g('despite the potential benefits of [N / N + V-ing], '), r('the drawbacks involved are of greater significance.')],
        guide: G_END,
        ink: ['(n) — significance: câu 2 dùng significant (adj), câu 13 đổi thành danh từ'],
      },
    ],
  },
  {
    id: 'outline.causes',
    name: 'Causes & Solutions',
    source: 'book',
    origin: '2. Causes & Solutions – Linear Framework',
    threads: ['g', 'p'],
    bodyNames: ['Nguyên nhân', 'Giải pháp'],
    notes: ['Sơ đồ cuối trang trong sách: câu 2 tách thành nhánh Causes → câu 3 và nhánh Solutions → câu 8.'],
    lines: [
      paraphrase,
      {
        no: 2,
        role: 'Thesis',
        text: [
          lb('Thesis:'),
          g('This can be '),
          swap('g', ['attributed to', 'put down to', 'explained by', 'traced back to']),
          g(' several '),
          swap('g', ['factors', 'reasons', 'causes']),
          g(', '),
          p('which can '),
          swap('p', ['require', 'call for']),
          p(' possible solutions to be '),
          swap('p', ADOPTED),
          p('.'),
        ],
        guide: G_THESIS,
        ink: ['answers the question'],
      },
      { no: 3, role: 'Câu chủ đề', text: [g("There are several explanations as to why S' + V'.")], guide: G_TOPIC1 },
      idea(4, 'Nguyên nhân 1', 'One possibility is that S + V', 'Nêu nguyên nhân thứ nhất.'),
      expandExample(5, 'Giải thích thêm hoặc cho ví dụ cho nguyên nhân ở câu 4.', ['This is because S + V.', 'As a result, S + V.', 'For example, S + V.']),
      idea(6, 'Nguyên nhân 2', 'Another reason worth mentioning is that S + V', 'Nêu nguyên nhân thứ hai.'),
      expandExample(7, 'Giải thích thêm hoặc cho ví dụ cho nguyên nhân ở câu 6.', ['This is mainly due to [N / V-ing].', 'Consequently, S + V.', 'For instance, S + V.']),
      { no: 8, role: 'Câu chủ đề', text: [p('Various measures, nevertheless, can be implemented to address these issues.')], guide: G_TOPIC2 },
      idea(9, 'Giải pháp 1', 'The first possible solution is that S + V', 'Nêu giải pháp thứ nhất, nên ứng với nguyên nhân 1.'),
      expandExample(10, G_SOLVE(9), SOLUTION_10),
      idea(11, 'Giải pháp 2', 'The second approach is that S + V', 'Nêu giải pháp thứ hai, nên ứng với nguyên nhân 2.'),
      expandExample(12, G_SOLVE(11), SOLUTION_12),
      {
        no: 13,
        role: 'Kết bài',
        text: [s('In conclusion, '), g("while many reasons can be given to explain why S' + V', "), p('steps can be taken to alleviate the situation.')],
        guide: G_END,
      },
    ],
  },
  {
    id: 'outline.problems',
    name: 'Problems & Solutions',
    source: 'book',
    origin: 'III. Problems & Solutions – Outline',
    threads: ['g', 'p'],
    bodyNames: ['Vấn đề', 'Giải pháp'],
    lines: [
      paraphrase,
      {
        no: 2,
        role: 'Thesis',
        text: [
          lb('Thesis:'),
          g('This can '),
          swap('g', ['lead to', 'result in', 'give rise to', 'bring about']),
          g(' some '),
          swap('g', ['negative consequences', 'serious problems', 'adverse effects', 'detrimental effects']),
          g(', '),
          p('which calls for possible solutions to be '),
          swap('p', ADOPTED),
          p('.'),
        ],
        guide: G_THESIS,
      },
      { no: 3, role: 'Câu chủ đề', text: [g("There are many problems resulting from [N / N + V-ing / the fact that S' + V'].")], guide: G_TOPIC1 },
      idea(4, 'Vấn đề 1', 'One obvious issue is that S + V', 'Nêu vấn đề thứ nhất (hậu quả của hiện tượng).'),
      expandExample(5, 'Giải thích thêm hoặc cho ví dụ cho vấn đề ở câu 4.', ['This could lead to [N / V-ing].', 'As a result, S + V.', 'For example, S + V.']),
      idea(6, 'Vấn đề 2', 'Another potential risk is that S + V', 'Nêu vấn đề thứ hai.'),
      expandExample(7, 'Giải thích thêm hoặc cho ví dụ cho vấn đề ở câu 6.', ['This may cause [N] to V.', 'Consequently, S + V.', 'For instance, S + V.']),
      { no: 8, role: 'Câu chủ đề', text: [p('Various measures, nevertheless, can be implemented to address these issues.')], guide: G_TOPIC2 },
      idea(9, 'Giải pháp 1', 'The first possible solution is that S + V', 'Nêu giải pháp thứ nhất, nên ứng với vấn đề 1.'),
      expandExample(10, G_SOLVE(9), SOLUTION_10),
      idea(11, 'Giải pháp 2', 'The second approach is that S + V', 'Nêu giải pháp thứ hai, nên ứng với vấn đề 2.'),
      expandExample(12, G_SOLVE(11), SOLUTION_12),
      {
        no: 13,
        role: 'Kết bài',
        text: [s('In conclusion, '), g('although [topic] can give rise to many issues, '), p('steps can be taken to improve the situation.')],
        guide: G_END,
      },
    ],
  },
  // ------------------------------------------------------- Phần bổ sung, không có trong sách
  {
    id: 'outline.discuss',
    name: 'Discuss both views',
    source: 'added',
    origin: 'Soạn bổ sung theo khung 13 câu của sách',
    threads: ['g', 'r'],
    bodyNames: ['Quan điểm A', 'Quan điểm B (bạn ủng hộ)'],
    lines: [
      {
        no: 1,
        role: 'Paraphrase đề',
        text: [lb('Paraphrase the topic:'), s("It is argued by some that S + V, while others believe that S' + V'.", { strong: true })],
        guide: 'Viết lại cả hai quan điểm của đề. S + V là quan điểm A, S\' + V\' là quan điểm B.',
      },
      {
        no: 2,
        role: 'Thesis',
        text: [lb('Thesis:'), g('Although both views have some merit, '), r("I am more inclined to believe that S' + V'.")],
        guide: 'Nêu rõ bạn nghiêng về quan điểm nào. Quan điểm bạn ủng hộ đặt ở thân bài 2.',
      },
      { no: 3, role: 'Câu chủ đề', text: [g('On the one hand, there are some reasons why people believe that S + V.')], guide: 'Mở thân bài 1: trình bày quan điểm A một cách công bằng.' },
      idea(4, 'Lý lẽ 1', 'One possible reason is that S + V', 'Lý lẽ thứ nhất của quan điểm A.'),
      expandExample(5, G_MORE(4), ['This is because S + V.', 'As a result, S + V.', 'For example, S + V.']),
      idea(6, 'Lý lẽ 2', 'Another argument for this view is that S + V', 'Lý lẽ thứ hai của quan điểm A.'),
      expandExample(7, G_MORE(6), ['In other words, S + V.', 'Consequently, S + V.', 'For instance, in [place], S + V.']),
      { no: 8, role: 'Câu chủ đề', text: [r("On the other hand, I side with those who believe that S' + V'.")], guide: 'Mở thân bài 2: quan điểm B, phía bạn ủng hộ.' },
      idea(9, 'Lý lẽ 1', 'The main reason for my view is that S + V', 'Lý do chính khiến bạn ủng hộ quan điểm B.'),
      expandExample(10, G_MORE(9), ['This is mainly because S + V.', 'As a consequence, S + V.', 'To illustrate, S + V.']),
      idea(11, 'Lý lẽ 2', 'Another point worth mentioning is that S + V', 'Lý do thứ hai.'),
      expandExample(12, G_MORE(11), ['This means that S + V.', 'This, in turn, leads to [N / V-ing].', 'A case in point is [N].']),
      {
        no: 13,
        role: 'Kết bài',
        text: [s('In conclusion, '), g('while the first view is understandable to some extent, '), r("I firmly believe that S' + V' given the aforementioned arguments.")],
        guide: 'Nhắc lại hai quan điểm và khẳng định phía bạn ủng hộ.',
      },
    ],
  },
  {
    id: 'outline.positive',
    name: 'Positive development',
    source: 'added',
    origin: 'Soạn bổ sung theo khung 13 câu của sách',
    threads: ['g', 'r'],
    bodyNames: ['Hạn chế (nhỏ)', 'Mặt tích cực (lớn)'],
    lines: [
      paraphrase,
      {
        no: 2,
        role: 'Thesis',
        text: [lb('Thesis:'), g('Although this trend may cause a few problems, '), r('I believe it is a largely positive development.')],
        guide: 'Nhượng bộ vài hạn chế ở vế 1, khẳng định xu hướng tích cực ở vế 2.',
      },
      { no: 3, role: 'Câu chủ đề', text: [g('On the one hand, there may be some minor drawbacks of [N / N + V-ing].')], guide: G_TOPIC1 },
      idea(4, 'Hạn chế 1', 'One possible issue is that S + V', 'Nêu hạn chế thứ nhất.'),
      expandExample(5, G_MORE(4), ['This could lead to [N / V-ing].', 'As a result, S + V.', 'For instance, S + V.']),
      idea(6, 'Hạn chế 2', 'Another concern could be that S + V', 'Nêu hạn chế thứ hai.'),
      expandExample(7, G_MORE(6), ['This may cause [N] to V.', 'Consequently, S + V.', 'To illustrate, S + V.']),
      { no: 8, role: 'Câu chủ đề', text: [r("Nevertheless, the positive effects of [N / the fact that S' + V'] are far more significant.")], guide: G_TOPIC2 },
      idea(9, 'Lợi ích 1', 'The most obvious benefit is that S + V', 'Nêu lợi ích lớn nhất.'),
      expandExample(10, G_MORE(9), ['This means that S + V.', 'As a consequence, S + V.', 'For example, in [place], S + V.']),
      idea(11, 'Lợi ích 2', 'Another advantage worth mentioning is that S + V', 'Nêu lợi ích thứ hai.'),
      expandExample(12, G_MORE(11), ['This allows [N] to V.', 'This, in turn, leads to [N / V-ing].', 'A case in point is [N].']),
      {
        no: 13,
        role: 'Kết bài',
        text: [s('In conclusion, '), g('despite a few drawbacks, '), r('I believe [topic] is a largely positive development.')],
        guide: G_END,
      },
    ],
  },
  {
    id: 'outline.negative',
    name: 'Negative development',
    source: 'added',
    origin: 'Soạn bổ sung theo khung 13 câu của sách',
    threads: ['g', 'r'],
    bodyNames: ['Lợi ích (nhỏ)', 'Mặt tiêu cực (lớn)'],
    lines: [
      paraphrase,
      {
        no: 2,
        role: 'Thesis',
        text: [lb('Thesis:'), g('Although this trend may bring some benefits, '), r('I believe it is a largely negative development.')],
        guide: 'Nhượng bộ vài lợi ích ở vế 1, khẳng định xu hướng tiêu cực ở vế 2.',
      },
      { no: 3, role: 'Câu chủ đề', text: [g('On the one hand, there may be some minor benefits of [N / N + V-ing].')], guide: G_TOPIC1 },
      idea(4, 'Lợi ích 1', 'One possible advantage is that S + V', 'Nêu lợi ích thứ nhất.'),
      expandExample(5, G_MORE(4), ['This means that S + V.', 'As a result, S + V.', 'For instance, S + V.']),
      idea(6, 'Lợi ích 2', 'Another benefit could be that S + V', 'Nêu lợi ích thứ hai.'),
      expandExample(7, G_MORE(6), ['This allows [N] to V.', 'Consequently, S + V.', 'To illustrate, S + V.']),
      { no: 8, role: 'Câu chủ đề', text: [r("Nevertheless, the negative effects of [N / the fact that S' + V'] are far more significant.")], guide: G_TOPIC2 },
      idea(9, 'Tác hại 1', 'The most serious problem is that S + V', 'Nêu tác hại lớn nhất.'),
      expandExample(10, G_MORE(9), ['This could lead to [N / V-ing].', 'As a consequence, S + V.', 'For example, in [place], S + V.']),
      idea(11, 'Tác hại 2', 'Another drawback worth mentioning is that S + V', 'Nêu tác hại thứ hai.'),
      expandExample(12, G_MORE(11), ['This may cause [N] to V.', 'This, in turn, leads to [N / V-ing].', 'A case in point is [N].']),
      {
        no: 13,
        role: 'Kết bài',
        text: [s('In conclusion, '), g('despite a few benefits, '), r('I believe [topic] is a largely negative development.')],
        guide: G_END,
      },
    ],
  },
  {
    id: 'outline.twopart',
    name: 'Two-part question',
    source: 'added',
    origin: 'Soạn bổ sung theo khung 13 câu của sách',
    threads: ['g', 'r'],
    bodyNames: ['Câu hỏi 1', 'Câu hỏi 2'],
    lines: [
      paraphrase,
      {
        no: 2,
        role: 'Thesis',
        text: [lb('Thesis:'), g('[Trả lời ngắn câu hỏi 1], '), r('and [trả lời ngắn câu hỏi 2].')],
        guide: 'Trả lời thẳng cả hai câu hỏi: vế 1 cho câu hỏi 1, vế 2 cho câu hỏi 2.',
        hint: 'Ví dụ với đề Why…? Is this positive or negative?: This trend can be attributed to several factors, and I believe it is a largely positive development.',
      },
      { no: 3, role: 'Câu chủ đề', text: [g('Regarding [nội dung câu hỏi 1], S + V.')], guide: 'Mở thân bài 1: trả lời thẳng câu hỏi 1.' },
      idea(4, 'Ý 1', 'The first point to consider is that S + V', 'Ý thứ nhất trả lời câu hỏi 1.'),
      expandExample(5, G_MORE(4), ['This is because S + V.', 'As a result, S + V.', 'For example, S + V.']),
      idea(6, 'Ý 2', 'Another point worth mentioning is that S + V', 'Ý thứ hai trả lời câu hỏi 1.'),
      expandExample(7, G_MORE(6), ['This means that S + V.', 'Consequently, S + V.', 'For instance, in [place], S + V.']),
      { no: 8, role: 'Câu chủ đề', text: [r('As for [nội dung câu hỏi 2], S + V.')], guide: 'Mở thân bài 2: trả lời thẳng câu hỏi 2.' },
      idea(9, 'Ý 1', 'The most important point here is that S + V', 'Ý thứ nhất trả lời câu hỏi 2.'),
      expandExample(10, G_MORE(9), ['This is mainly because S + V.', 'As a consequence, S + V.', 'To illustrate, S + V.']),
      idea(11, 'Ý 2', 'Furthermore, it is worth noting that S + V', 'Ý thứ hai trả lời câu hỏi 2.'),
      expandExample(12, G_MORE(11), ['This allows [N] to V.', 'This, in turn, leads to [N / V-ing].', 'A case in point is [N].']),
      {
        no: 13,
        role: 'Kết bài',
        text: [s('In conclusion, '), g('[nhắc lại câu trả lời 1], '), r('and [nhắc lại câu trả lời 2].')],
        guide: 'Nhắc lại câu trả lời cho cả hai câu hỏi.',
      },
    ],
  },
]

// ------------------------------------------------------------ Chọn outline
/** Lựa chọn của người học ở bước ② quyết định outline (hoặc chữ điền sẵn) ở bước ③. */
export const OUTLINE_CHOICES: Record<string, OutlineChoice[]> = {
  'type.agree': [
    { id: 'agree', label: 'Đồng ý', outlineId: 'outline.agree', note: 'Câu 2 và câu 13 điền sẵn "agree".' },
    { id: 'disagree', label: 'Không đồng ý', outlineId: 'outline.agree', note: 'Câu 2 và câu 13 điền sẵn "disagree".' },
  ],
  'type.advdis': [
    { id: 'listing', label: 'Nêu cả hai mặt', outlineId: 'outline.listing', note: 'Đề chỉ yêu cầu bàn về lợi và hại.' },
    { id: 'adv', label: 'Lợi nhiều hơn', outlineId: 'outline.adv', note: 'Đề hỏi outweigh, bạn cho rằng lợi ích lớn hơn.' },
    { id: 'dis', label: 'Hại nhiều hơn', outlineId: 'outline.dis', note: 'Đề hỏi outweigh, bạn cho rằng bất lợi lớn hơn.' },
  ],
  'type.positive': [
    { id: 'positive', label: 'Tích cực', outlineId: 'outline.positive', note: 'Bạn cho rằng xu hướng này chủ yếu là tích cực.' },
    { id: 'negative', label: 'Tiêu cực', outlineId: 'outline.negative', note: 'Bạn cho rằng xu hướng này chủ yếu là tiêu cực.' },
  ],
}

const OUTLINE_OF_TYPE: Record<string, string> = {
  'type.agree': 'outline.agree',
  'type.discuss': 'outline.discuss',
  'type.advdis': 'outline.listing',
  'type.causes': 'outline.causes',
  'type.problem': 'outline.problems',
  'type.positive': 'outline.positive',
  'type.twopart': 'outline.twopart',
}

/** Lựa chọn mặc định khi người học chưa chọn: đề có "outweigh" thì nghiêng về Lợi nhiều hơn. */
export function defaultChoice(typeId: string, prompt: string): string | undefined {
  if (typeId === 'type.advdis') return /outweigh/i.test(prompt) ? 'adv' : 'listing'
  if (typeId === 'type.positive') return 'positive'
  return undefined
}

export const findOutline = (id: string) => OUTLINES.find((x) => x.id === id)

export function outlineFor(typeId: string, choiceId?: string): Outline | undefined {
  const choice = OUTLINE_CHOICES[typeId]?.find((c) => c.id === choiceId)
  return findOutline(choice?.outlineId ?? OUTLINE_OF_TYPE[typeId] ?? '')
}

// ------------------------------------------------------------ Chuyển sang chữ
export function segText(seg: Seg, choice?: string): string {
  if (choice && seg.byChoice?.[choice]) return seg.byChoice[choice]
  if (seg.blank) return '……'
  return seg.t ?? ''
}

/** Câu mẫu dạng chữ thường để chép; bỏ nhãn hướng dẫn trừ khi withLabels. */
export function segsToText(segs: Seg[], choice?: string, withLabels = false): string {
  return segs
    .filter((x) => withLabels || !x.label)
    .map((x) => (x.label ? `[${x.t}] ` : segText(x, choice)))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}
