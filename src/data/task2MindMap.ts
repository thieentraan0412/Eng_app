// Sơ đồ tư duy IELTS Writing Task 2 — dữ liệu tĩnh, offline.
// Thiết kế: Implement/require-tuduy.md
// Nguồn nội dung: DATA/huong-dan.md (12 hướng, công thức 6W), DATA/example.md (bảng 6W,
// chuỗi lập luận, đoạn mẫu), DATA/demo.md (P–E–E–L, pattern, từ nối, ghép theo dạng đề).

export interface Phrase {
  vi: string
  en?: string
}

export interface SixWRow {
  vi: string
  en: string
}

export type SixWKey = 'who' | 'why' | 'what' | 'how' | 'when' | 'which'

export const SIX_W: { key: SixWKey; label: string; question: string }[] = [
  { key: 'who', label: 'WHO', question: 'Ai liên quan? Chính phủ, cá nhân, trường học, cha mẹ, doanh nghiệp hay cộng đồng?' },
  { key: 'why', label: 'WHY', question: 'Tại sao vấn đề xảy ra?' },
  { key: 'what', label: 'WHAT', question: 'Lợi ích, tác hại hoặc hậu quả là gì?' },
  { key: 'how', label: 'HOW', question: 'Giải pháp nào có thể thực hiện?' },
  { key: 'when', label: 'WHEN', question: 'Tác động ngắn hạn hay dài hạn?' },
  { key: 'which', label: 'WHICH', question: 'Phương án nào tốt hơn và tại sao?' },
]

/** Chủ thể (1–5) và khía cạnh (6–12) — mỗi nút là một "hướng phát triển ý". */
export interface Direction {
  id: string
  no: number
  group: 'actor' | 'aspect'
  vi: string
  en: string
  question: string
  phrases: Phrase[]
  sixW: Record<SixWKey, SixWRow>
  chain: string[]
  sample: string
}

/** Góc lập luận (8 khía cạnh của demo.md). */
export interface Angle {
  id: string
  vi: string
  en: string
  question: string
  frame: string[]
  patterns: string[]
  linkers: string[]
  chain: string
  prompt: string
  sample: string
  sampleVi: string
}

export interface EssayType {
  id: string
  vi: string
  en: string
  keywords: string[]
  task: string
  bodies: string
  opinion: string
  angles: string[]
  note: string
  intro: string
  conclusion: string
}

// ------------------------------------------------------------------ Dạng đề
export const ESSAY_TYPES: EssayType[] = [
  {
    id: 'type.agree',
    vi: 'Đồng ý / Không đồng ý',
    en: 'Agree or Disagree',
    keywords: ['to what extent do you agree', 'do you agree or disagree', 'agree or disagree', 'do you agree'],
    task: 'Nêu rõ mức độ đồng ý với nhận định của đề và bảo vệ quan điểm đó.',
    bodies: '2 đoạn, cả hai cùng ủng hộ quan điểm (hoặc 1 đoạn nhượng bộ + 1 đoạn phản bác).',
    opinion: 'Nêu ngay ở mở bài và nhắc lại ở kết bài.',
    angles: ['angle.benefits', 'angle.future'],
    note: 'Dùng Benefits hoặc Drawbacks + Future. Dự đoán dài hạn là cách củng cố ý kiến rất tự nhiên.',
    intro: 'I completely / partly agree that [nhận định của đề] because [lý do 1] and [lý do 2].',
    conclusion: 'In conclusion, I firmly believe that [quan điểm], as [tóm tắt 2 lý do].',
  },
  {
    id: 'type.discuss',
    vi: 'Thảo luận hai quan điểm',
    en: 'Discuss both views',
    keywords: ['discuss both these views', 'discuss both views', 'discuss both', 'while others'],
    task: 'Trình bày công bằng cả hai quan điểm, sau đó đưa ra ý kiến riêng.',
    bodies: '2 đoạn, mỗi quan điểm một đoạn. Quan điểm bạn ủng hộ đặt ở đoạn 2 và viết mạnh hơn.',
    opinion: 'Nêu ở mở bài, nhắc lại ở cuối đoạn 2 và kết bài.',
    angles: ['angle.comparison', 'angle.responsibility'],
    note: 'Ghép Comparison + Responsibility hoặc Benefits. Mỗi quan điểm một đoạn.',
    intro: 'While some people believe that [quan điểm A], others argue that [quan điểm B]. In my view, [ý kiến của bạn].',
    conclusion: 'In conclusion, although [quan điểm A] has some merit, I believe that [quan điểm B / ý kiến của bạn].',
  },
  {
    id: 'type.advdis',
    vi: 'Ưu điểm / Nhược điểm',
    en: 'Advantages and Disadvantages',
    keywords: ['advantages and disadvantages', 'advantages outweigh', 'benefits outweigh', 'outweigh', 'benefits and drawbacks'],
    task: 'Phân tích lợi và hại; nếu đề hỏi "outweigh" thì phải nói bên nào nặng hơn.',
    bodies: '2 đoạn: một đoạn lợi ích, một đoạn bất lợi.',
    opinion: 'Chỉ bắt buộc khi đề hỏi "outweigh" hoặc "your opinion".',
    angles: ['angle.benefits', 'angle.drawbacks'],
    note: 'Ghép Benefits + Drawbacks. Có thể thêm câu so sánh để nêu bên nào nặng hơn.',
    intro: 'This essay will examine both the advantages and disadvantages of [chủ đề], and argue that [bên nặng hơn].',
    conclusion: 'In conclusion, although [chủ đề] has some drawbacks, its benefits clearly outweigh them.',
  },
  {
    id: 'type.causes',
    vi: 'Nguyên nhân / Giải pháp',
    en: 'Causes and Solutions',
    keywords: ['what are the causes', 'causes of', 'reasons for', 'why is this', 'why do', 'what measures', 'how can this be solved', 'what can be done'],
    task: 'Chỉ ra nguyên nhân và đề xuất giải pháp tương ứng.',
    bodies: '2 đoạn: nguyên nhân, rồi giải pháp. Giải pháp phải bám đúng nguyên nhân đã nêu.',
    opinion: 'Không bắt buộc nêu quan điểm.',
    angles: ['angle.causes', 'angle.solutions'],
    note: 'Ghép Causes + Solutions. Giải pháp phải bám đúng nguyên nhân đã nêu.',
    intro: 'There are several reasons why [vấn đề], and a number of measures could be taken to address it.',
    conclusion: 'In conclusion, [vấn đề] is mainly caused by [nguyên nhân], but it can be tackled if [giải pháp].',
  },
  {
    id: 'type.problem',
    vi: 'Vấn đề / Giải pháp',
    en: 'Problem and Solution',
    keywords: ['what problems', 'problems does this cause', 'problems associated', 'what solutions', 'suggest some solutions'],
    task: 'Nêu các vấn đề (hậu quả) mà hiện tượng gây ra và cách khắc phục.',
    bodies: '2 đoạn: vấn đề, rồi giải pháp.',
    opinion: 'Không bắt buộc nêu quan điểm.',
    angles: ['angle.effects', 'angle.solutions'],
    note: 'Ghép Effects / Drawbacks + Solutions. "Problem" thường là hậu quả, không phải nguyên nhân.',
    intro: '[Hiện tượng] has created several problems, but there are practical solutions to them.',
    conclusion: 'In conclusion, [hiện tượng] leads to [vấn đề], but these can be reduced if [giải pháp].',
  },
  {
    id: 'type.positive',
    vi: 'Tích cực hay tiêu cực',
    en: 'Positive or Negative development',
    keywords: ['positive or negative development', 'positive or a negative', 'positive or negative'],
    task: 'Đánh giá xu hướng là tích cực hay tiêu cực và giải thích vì sao.',
    bodies: '2 đoạn: tác động hiện tại và tác động lâu dài (hoặc mặt tốt và mặt xấu).',
    opinion: 'Bắt buộc, nêu ở mở bài.',
    angles: ['angle.effects', 'angle.future'],
    note: 'Ghép Effects + Future. Tách tác động hiện tại và tác động lâu dài.',
    intro: 'In my opinion, [xu hướng] is a largely positive / negative development because [lý do].',
    conclusion: 'In conclusion, I believe [xu hướng] is a positive / negative development, since [tóm tắt].',
  },
  {
    id: 'type.twopart',
    vi: 'Câu hỏi hai phần',
    en: 'Two-part question',
    keywords: [],
    task: 'Trả lời đủ cả hai câu hỏi của đề, mỗi câu được đối xử ngang nhau.',
    bodies: '2 đoạn: mỗi câu hỏi một đoạn.',
    opinion: 'Chỉ khi một trong hai câu hỏi xin ý kiến.',
    angles: ['angle.causes', 'angle.effects'],
    note: 'Chọn góc theo từng câu hỏi: "Why" → Causes, "Is it good?" → Benefits/Drawbacks, "What can be done?" → Solutions.',
    intro: 'This essay will first explain [câu hỏi 1] and then discuss [câu hỏi 2].',
    conclusion: 'In conclusion, [trả lời câu 1], and [trả lời câu 2].',
  },
]

// ------------------------------------------------------- Chủ thể và khía cạnh
export const DIRECTIONS: Direction[] = [
  {
    id: 'dir.government',
    no: 1,
    group: 'actor',
    vi: 'Chính phủ',
    en: 'Government',
    question: 'Chính phủ nên làm gì?',
    phrases: [
      { vi: 'Ban hành luật và quy định', en: 'introduce laws and regulations' },
      { vi: 'Tăng ngân sách, đầu tư dịch vụ công', en: 'increase public funding' },
      { vi: 'Nâng cao nhận thức cộng đồng', en: 'raise public awareness' },
      { vi: 'Xây dựng cơ sở hạ tầng', en: 'develop infrastructure' },
      { vi: 'Trợ cấp hoặc áp thuế', en: 'provide subsidies / impose taxes' },
      { vi: 'Giám sát và xử phạt vi phạm', en: 'enforce regulations' },
    ],
    sixW: {
      who: { vi: 'Chính phủ, chính quyền địa phương, cơ quan quản lý', en: 'the government, local authorities, policymakers' },
      why: { vi: 'Vấn đề quá lớn, cá nhân không tự giải quyết được; cần nguồn lực và quyền lực pháp lý', en: 'beyond the capacity of individuals, require large-scale funding' },
      what: { vi: 'Tác động trên diện rộng, thay đổi nhanh hành vi của cả xã hội', en: 'have a nationwide impact, change behaviour on a large scale' },
      how: { vi: 'Ban hành luật, tăng ngân sách, trợ cấp, đánh thuế, xây hạ tầng, tuyên truyền', en: 'introduce legislation, allocate funding, impose taxes, launch public campaigns' },
      when: { vi: 'Ngắn hạn: tốn ngân sách, có thể gặp phản đối. Dài hạn: thay đổi bền vững, có hệ thống', en: 'in the short term it is costly; in the long run it brings lasting change' },
      which: { vi: 'Luật + chế tài hiệu quả hơn lời kêu gọi tự nguyện vì có tính bắt buộc', en: 'legally binding measures are more effective than voluntary ones' },
    },
    chain: ['Đánh thuế đồ uống có đường', 'giá tăng', 'người dân mua ít hơn', 'giảm béo phì và chi phí y tế'],
    sample:
      'Governments are in the best position to tackle this problem because they have both the authority and the resources. For example, a tax on sugary drinks would raise their price, which would discourage people from buying them. As a result, obesity rates could fall, and the healthcare system would save a considerable amount of money in the long term.',
  },
  {
    id: 'dir.individuals',
    no: 2,
    group: 'actor',
    vi: 'Cá nhân',
    en: 'Individuals',
    question: 'Mỗi người có thể làm gì?',
    phrases: [
      { vi: 'Thay đổi thói quen và hành vi', en: 'change personal habits' },
      { vi: 'Chịu trách nhiệm cho lựa chọn của mình', en: 'take responsibility' },
      { vi: 'Nâng cao kiến thức và kỹ năng', en: 'improve knowledge and skills' },
      { vi: 'Tuân thủ pháp luật', en: 'obey the law' },
      { vi: 'Sử dụng tài nguyên hợp lý', en: 'use resources responsibly' },
      { vi: 'Chủ động giải quyết vấn đề', en: 'take the initiative' },
    ],
    sixW: {
      who: { vi: 'Mỗi người, người tiêu dùng, công dân', en: 'individuals, consumers, citizens' },
      why: { vi: 'Vấn đề bắt nguồn từ thói quen và lựa chọn hằng ngày của từng người', en: 'stem from daily habits and personal choices' },
      what: { vi: 'Thay đổi nhỏ nhưng cộng dồn thành tác động lớn; tạo ảnh hưởng tới người xung quanh', en: 'small changes add up, set an example for others' },
      how: { vi: 'Đổi thói quen, tự học, tiết kiệm tài nguyên, tuân thủ luật, chọn sản phẩm có trách nhiệm', en: 'change their lifestyle, take responsibility, make informed choices' },
      when: { vi: 'Ngắn hạn: khó duy trì, cần ý chí. Dài hạn: trở thành lối sống, lan tỏa cho thế hệ sau', en: 'hard to maintain at first, become second nature over time' },
      which: { vi: 'Hiệu quả khi có nhiều người cùng làm; một mình cá nhân thì tác động hạn chế', en: 'effective only when many people take part' },
    },
    chain: ['Mỗi người mang túi vải khi đi chợ', 'giảm túi nilon', 'giảm rác thải nhựa', 'hàng triệu người cùng làm thì lượng rác giảm đáng kể'],
    sample:
      "On the other hand, individuals also play an important role. Many environmental problems are caused by everyday habits, such as using plastic bags or driving short distances. If each person brought their own bag and walked or cycled more often, the amount of waste and emissions would fall. Although one person's actions seem small, the combined effect of millions of people can be significant.",
  },
  {
    id: 'dir.schools',
    no: 3,
    group: 'actor',
    vi: 'Trường học',
    en: 'Schools and Universities',
    question: 'Nhà trường có thể làm gì?',
    phrases: [
      { vi: 'Cải thiện chất lượng giáo dục', en: 'improve the quality of education' },
      { vi: 'Dạy kỹ năng thực tế bên cạnh lý thuyết', en: 'teach practical skills' },
      { vi: 'Tổ chức hoạt động ngoại khóa', en: 'organise extracurricular activities' },
      { vi: 'Giáo dục ý thức và trách nhiệm', en: 'raise students’ awareness' },
      { vi: 'Hướng nghiệp cho học sinh, sinh viên', en: 'provide career guidance' },
      { vi: 'Trang bị kỹ năng công nghệ và tư duy phản biện', en: 'develop digital literacy and critical thinking' },
    ],
    sixW: {
      who: { vi: 'Nhà trường, giáo viên, trường đại học', en: 'schools, teachers, educational institutions' },
      why: { vi: 'Trẻ dành phần lớn thời gian ở trường; đây là nơi hình thành kiến thức và thái độ', en: 'children spend most of their time at school, shape their attitudes' },
      what: { vi: 'Trang bị kiến thức, kỹ năng và ý thức từ sớm; ảnh hưởng tới cả thế hệ', en: 'equip students with skills, influence a whole generation' },
      how: { vi: 'Đưa môn học mới vào chương trình, dạy kỹ năng thực tế, hoạt động ngoại khóa, hướng nghiệp', en: 'include it in the curriculum, offer practical courses, career guidance' },
      when: { vi: 'Ngắn hạn: cần đào tạo giáo viên, sửa chương trình. Dài hạn: thế hệ trẻ có ý thức và kỹ năng tốt hơn', en: 'require teacher training, produce a better-prepared generation' },
      which: { vi: 'Giáo dục là giải pháp gốc rễ, bền vững hơn biện pháp trừng phạt', en: 'education tackles the root cause rather than the symptoms' },
    },
    chain: ['Trường dạy kỹ năng quản lý tài chính', 'học sinh biết lập ngân sách', 'khi đi làm ít nợ nần', 'xã hội ổn định hơn'],
    sample:
      'Schools can also make a difference by teaching practical life skills. If financial management were part of the curriculum, students would learn how to budget and save before they start earning money. Consequently, they would be less likely to fall into debt as adults, which benefits not only themselves but also society as a whole.',
  },
  {
    id: 'dir.parents',
    no: 4,
    group: 'actor',
    vi: 'Cha mẹ và gia đình',
    en: 'Parents and Families',
    question: 'Gia đình có thể làm gì?',
    phrases: [
      { vi: 'Làm gương cho con cái', en: 'set a good example' },
      { vi: 'Giám sát việc sử dụng Internet', en: 'monitor Internet use' },
      { vi: 'Dạy kỹ năng sống và đạo đức', en: 'teach life skills and moral values' },
      { vi: 'Dành thời gian cho con', en: 'spend quality time with children' },
      { vi: 'Khuyến khích tính tự lập', en: 'encourage independence' },
      { vi: 'Hỗ trợ tinh thần và việc học của trẻ', en: 'provide emotional and academic support' },
    ],
    sixW: {
      who: { vi: 'Cha mẹ, ông bà, người giám hộ', en: 'parents, families, caregivers' },
      why: { vi: 'Gia đình là môi trường đầu tiên và gần gũi nhất; trẻ học bằng cách bắt chước', en: 'children imitate their parents, the first teachers' },
      what: { vi: 'Hình thành tính cách, giá trị đạo đức, thói quen từ nhỏ', en: "shape children's character and values" },
      how: { vi: 'Làm gương, giới hạn thời gian dùng thiết bị, dành thời gian cho con, khuyến khích tự lập', en: 'set a good example, limit screen time, spend quality time' },
      when: { vi: 'Ngắn hạn: tốn thời gian, cha mẹ bận rộn khó làm. Dài hạn: trẻ trưởng thành tự lập, có trách nhiệm', en: 'time-consuming for busy parents, raise independent adults' },
      which: { vi: 'Cha mẹ ảnh hưởng sớm và sâu hơn trường học, nhưng cần trường học hỗ trợ', en: 'parents have an earlier and deeper influence than schools' },
    },
    chain: ['Cha mẹ giới hạn thời gian dùng điện thoại của con', 'trẻ vận động và đọc sách nhiều hơn', 'sức khỏe và khả năng tập trung tốt hơn'],
    sample:
      "Parents are arguably the most influential people in a child's life, since children tend to copy what they see at home. If parents limit their own screen time and set clear rules for their children, young people are more likely to spend time reading or playing outside. This would improve both their physical health and their ability to concentrate at school.",
  },
  {
    id: 'dir.business',
    no: 5,
    group: 'actor',
    vi: 'Doanh nghiệp',
    en: 'Businesses and Employers',
    question: 'Doanh nghiệp có thể làm gì?',
    phrases: [
      { vi: 'Đào tạo và nâng cao kỹ năng cho nhân viên', en: 'provide staff training' },
      { vi: 'Cải thiện môi trường làm việc', en: 'improve working conditions' },
      { vi: 'Áp dụng công nghệ để tăng năng suất', en: 'adopt technology to boost productivity' },
      { vi: 'Bảo vệ quyền lợi người lao động', en: "protect workers' rights" },
      { vi: 'Thực hiện trách nhiệm xã hội', en: 'corporate social responsibility' },
      { vi: 'Giảm chất thải và ô nhiễm trong sản xuất', en: 'cut waste and pollution' },
    ],
    sixW: {
      who: { vi: 'Doanh nghiệp, nhà tuyển dụng, tập đoàn', en: 'companies, employers, corporations' },
      why: { vi: 'Doanh nghiệp tạo ra phần lớn sản phẩm, việc làm và cũng gây nhiều ô nhiễm', en: 'major source of jobs and pollution' },
      what: { vi: 'Ảnh hưởng tới người lao động, khách hàng và môi trường', en: 'affect employees, customers and the environment' },
      how: { vi: 'Đào tạo nhân viên, cải thiện môi trường làm việc, công nghệ sạch, trách nhiệm xã hội', en: 'provide training, adopt green technology, corporate social responsibility' },
      when: { vi: 'Ngắn hạn: tăng chi phí, giảm lợi nhuận. Dài hạn: nhân viên gắn bó, uy tín thương hiệu tăng', en: 'raise costs initially, improve reputation and loyalty' },
      which: { vi: 'Doanh nghiệp thường chỉ thay đổi khi có lợi ích hoặc bị luật bắt buộc, nên kết hợp với chính phủ', en: 'companies act mainly when it is profitable or required by law' },
    },
    chain: ['Công ty cho nhân viên làm việc linh hoạt', 'nhân viên ít căng thẳng', 'năng suất tăng, ít nghỉ việc', 'tiết kiệm chi phí tuyển dụng'],
    sample:
      'Employers also benefit from looking after their staff. For instance, companies that offer flexible working hours often find that their employees are less stressed and more productive. As fewer people leave their jobs, the company saves money on recruiting and training new staff, so this policy is good for both sides.',
  },
  {
    id: 'dir.health',
    no: 6,
    group: 'aspect',
    vi: 'Sức khỏe',
    en: 'Health',
    question: 'Ảnh hưởng tới sức khỏe thế nào?',
    phrases: [
      { vi: 'Cải thiện sức khỏe thể chất', en: 'improve physical health' },
      { vi: 'Bảo vệ sức khỏe tinh thần', en: 'protect mental wellbeing' },
      { vi: 'Giảm nguy cơ mắc bệnh', en: 'reduce the risk of disease' },
      { vi: 'Giảm chi phí điều trị lâu dài', en: 'cut long-term medical costs' },
      { vi: 'Nâng cao chất lượng cuộc sống', en: 'improve quality of life' },
      { vi: 'Giảm áp lực cho hệ thống y tế', en: 'ease pressure on the healthcare system' },
    ],
    sixW: {
      who: { vi: 'Người dân, bệnh nhân, bác sĩ, hệ thống y tế', en: 'the public, patients, the healthcare system' },
      why: { vi: 'Lối sống ít vận động, ăn uống thiếu lành mạnh, áp lực công việc, ô nhiễm', en: 'sedentary lifestyle, unhealthy diet, stress, pollution' },
      what: { vi: 'Lợi: khỏe mạnh, sống lâu. Hại: bệnh tật, trầm cảm, mất khả năng lao động', en: 'improve wellbeing / lead to obesity, depression, lost productivity' },
      how: { vi: 'Tập thể dục, ăn uống lành mạnh, khám định kỳ, hỗ trợ sức khỏe tinh thần', en: 'regular exercise, a balanced diet, regular check-ups, mental health support' },
      when: { vi: 'Ngắn hạn: cảm thấy khỏe, ít stress. Dài hạn: giảm bệnh mãn tính, giảm chi phí y tế', en: 'feel better immediately, reduce chronic diseases in the long run' },
      which: { vi: 'Phòng bệnh rẻ và hiệu quả hơn chữa bệnh', en: 'prevention is cheaper and more effective than cure' },
    },
    chain: ['Người dân vận động nhiều hơn', 'giảm bệnh tim mạch, tiểu đường', 'ít phải nhập viện', 'giảm áp lực cho bệnh viện và ngân sách y tế'],
    sample:
      'From a health perspective, this change would be highly beneficial. Regular physical activity reduces the risk of serious illnesses such as heart disease and diabetes. If fewer people developed these conditions, hospitals would be less overcrowded and the government could spend less on treatment, since preventing a disease is far cheaper than curing it.',
  },
  {
    id: 'dir.economy',
    no: 7,
    group: 'aspect',
    vi: 'Kinh tế và tài chính',
    en: 'Economy',
    question: 'Ảnh hưởng tới kinh tế, tiền bạc thế nào?',
    phrases: [
      { vi: 'Tạo việc làm', en: 'create jobs' },
      { vi: 'Tăng thu nhập và mức sống', en: 'raise incomes and living standards' },
      { vi: 'Giảm chi phí sản xuất', en: 'lower production costs' },
      { vi: 'Tăng năng suất lao động', en: 'boost productivity' },
      { vi: 'Thu hút đầu tư', en: 'attract investment' },
      { vi: 'Giảm gánh nặng tài chính', en: 'ease the financial burden' },
    ],
    sixW: {
      who: { vi: 'Người lao động, doanh nghiệp, nhà đầu tư, nhà nước', en: 'workers, businesses, investors, the state' },
      why: { vi: 'Chi phí sinh hoạt tăng, thất nghiệp, cạnh tranh toàn cầu', en: 'rising living costs, unemployment, global competition' },
      what: { vi: 'Lợi: việc làm, thu nhập, đầu tư. Hại: tốn ngân sách, chênh lệch giàu nghèo', en: 'create jobs, boost income / costly, widen the wealth gap' },
      how: { vi: 'Đầu tư vào ngành mới, ưu đãi thuế, đào tạo lao động, thu hút vốn nước ngoài', en: 'invest in new industries, offer tax incentives, attract foreign investment' },
      when: { vi: 'Ngắn hạn: chi phí đầu tư lớn. Dài hạn: kinh tế tăng trưởng, mức sống cao hơn', en: 'require heavy investment, stimulate long-term growth' },
      which: { vi: 'Khoản chi ban đầu đáng giá nếu mang lại lợi ích kinh tế lâu dài', en: 'the initial cost is justified by long-term economic gains' },
    },
    chain: ['Phát triển du lịch', 'mở thêm khách sạn, nhà hàng', 'tạo việc làm cho người dân địa phương', 'thu nhập tăng, kinh tế vùng phát triển'],
    sample:
      'Economically, tourism brings considerable advantages to local communities. The growth of hotels, restaurants and transport services creates thousands of jobs, particularly for young people who might otherwise move to big cities. This increases household income and allows the local government to collect more taxes, which can then be spent on schools and roads.',
  },
  {
    id: 'dir.society',
    no: 8,
    group: 'aspect',
    vi: 'Xã hội và cộng đồng',
    en: 'Society and Community',
    question: 'Ảnh hưởng tới cộng đồng thế nào?',
    phrases: [
      { vi: 'Tăng cường sự gắn kết cộng đồng', en: 'strengthen community ties' },
      { vi: 'Giảm bất bình đẳng', en: 'reduce inequality' },
      { vi: 'Hỗ trợ nhóm yếu thế', en: 'support vulnerable groups' },
      { vi: 'Nâng cao ý thức cộng đồng', en: 'foster civic awareness' },
      { vi: 'Xây dựng môi trường sống an toàn', en: 'create safer neighbourhoods' },
      { vi: 'Thúc đẩy sự công bằng và hòa nhập', en: 'promote fairness and social inclusion' },
    ],
    sixW: {
      who: { vi: 'Cộng đồng, người già, người nghèo, người khuyết tật, người nhập cư', en: 'local communities, vulnerable groups, the elderly, minorities' },
      why: { vi: 'Bất bình đẳng, đô thị hóa làm con người xa cách, thiếu dịch vụ công', en: 'inequality, urbanisation, lack of public services' },
      what: { vi: 'Lợi: gắn kết, an toàn, công bằng. Hại: cô lập, tội phạm, mâu thuẫn xã hội', en: 'strengthen social bonds / lead to isolation, crime, social tension' },
      how: { vi: 'Xây không gian công cộng, hỗ trợ nhóm yếu thế, tình nguyện, hoạt động cộng đồng', en: 'build community centres, support disadvantaged groups, volunteer' },
      when: { vi: 'Ngắn hạn: cần thời gian để mọi người tham gia. Dài hạn: xã hội hòa nhập, ít tội phạm', en: 'slow to take effect, create a more inclusive society' },
      which: { vi: 'Xã hội gắn kết giúp giảm nhiều vấn đề cùng lúc (cô đơn, tội phạm, bất bình đẳng)', en: 'addresses several problems at the same time' },
    },
    chain: ['Xây trung tâm cộng đồng', 'người dân gặp gỡ, tham gia hoạt động chung', 'giảm cô đơn ở người già, thanh thiếu niên ít sa vào tệ nạn', 'khu dân cư an toàn hơn'],
    sample:
      'Another advantage relates to community life. Public facilities such as libraries and community centres give people of different ages a place to meet and take part in shared activities. This reduces loneliness among the elderly and keeps teenagers away from antisocial behaviour, making neighbourhoods safer and more united.',
  },
  {
    id: 'dir.environment',
    no: 9,
    group: 'aspect',
    vi: 'Môi trường',
    en: 'Environment',
    question: 'Ảnh hưởng tới môi trường thế nào?',
    phrases: [
      { vi: 'Giảm ô nhiễm không khí và nguồn nước', en: 'reduce air and water pollution' },
      { vi: 'Bảo tồn tài nguyên thiên nhiên', en: 'conserve natural resources' },
      { vi: 'Giảm khí thải carbon', en: 'cut carbon emissions' },
      { vi: 'Tăng tái chế và năng lượng sạch', en: 'promote recycling and clean energy' },
      { vi: 'Bảo vệ đa dạng sinh học', en: 'protect biodiversity' },
      { vi: 'Hướng đến phát triển bền vững', en: 'achieve sustainable development' },
    ],
    sixW: {
      who: { vi: 'Chính phủ, nhà máy, người tiêu dùng, thế hệ tương lai', en: 'governments, factories, consumers, future generations' },
      why: { vi: 'Công nghiệp hóa, phương tiện cá nhân, tiêu dùng quá mức, rác thải nhựa', en: 'industrialisation, private vehicles, overconsumption, plastic waste' },
      what: { vi: 'Hại: ô nhiễm không khí và nước, biến đổi khí hậu, mất đa dạng sinh học', en: 'air and water pollution, climate change, loss of biodiversity' },
      how: { vi: 'Năng lượng tái tạo, tái chế, giao thông công cộng, trồng rừng, hạn chế đồ nhựa', en: 'renewable energy, recycling, public transport, reforestation' },
      when: { vi: 'Ngắn hạn: tốn chi phí chuyển đổi. Dài hạn: phát triển bền vững, bảo vệ thế hệ sau', en: 'costly transition, sustainable development, protect future generations' },
      which: { vi: 'Năng lượng sạch tốt hơn nhiên liệu hóa thạch vì không cạn kiệt và ít khí thải', en: 'renewable sources are inexhaustible and cleaner' },
    },
    chain: ['Đầu tư xe buýt và tàu điện', 'ít người đi xe máy, ô tô', 'giảm khí thải và kẹt xe', 'không khí trong lành hơn'],
    sample:
      'The environmental benefits of public transport are clear. When a city provides fast and affordable buses and trains, many residents leave their cars at home. This leads to lower carbon emissions and less traffic congestion, so air quality improves noticeably. In the long term, such investment is essential for sustainable urban development.',
  },
  {
    id: 'dir.technology',
    no: 10,
    group: 'aspect',
    vi: 'Công nghệ',
    en: 'Technology',
    question: 'Công nghệ giúp gì và gây hại gì?',
    phrases: [
      { vi: 'Tự động hóa công việc', en: 'automate tasks' },
      { vi: 'Tiếp cận thông tin nhanh chóng', en: 'access information instantly' },
      { vi: 'Cải thiện giao tiếp và kết nối', en: 'improve communication' },
      { vi: 'Tăng hiệu quả và độ chính xác', en: 'increase efficiency and accuracy' },
      { vi: 'Gây rủi ro về quyền riêng tư', en: 'pose privacy risks' },
      { vi: 'Gia tăng sự phụ thuộc hoặc nguy cơ mất việc', en: 'lead to overdependence and job losses' },
    ],
    sixW: {
      who: { vi: 'Người dùng, học sinh, người lao động, công ty công nghệ', en: 'users, students, workers, tech companies' },
      why: { vi: 'Internet và AI phát triển nhanh, thiết bị rẻ và phổ biến', en: 'rapid development of the Internet and AI, affordable devices' },
      what: { vi: 'Lợi: nhanh, chính xác, kết nối. Hại: mất việc, lộ dữ liệu, phụ thuộc', en: 'efficient, accurate, connected / job losses, privacy risks, overdependence' },
      how: { vi: 'Dùng công nghệ có kiểm soát, đào tạo lại lao động, luật bảo vệ dữ liệu', en: 'use it responsibly, retrain workers, data protection laws' },
      when: { vi: 'Ngắn hạn: nhiều người mất việc, khó thích nghi. Dài hạn: năng suất tăng, xuất hiện nghề mới', en: 'short-term job losses, new types of jobs in the long run' },
      which: { vi: 'Lợi ích lớn hơn tác hại nếu có quy định và đào tạo phù hợp', en: 'benefits outweigh drawbacks if properly regulated' },
    },
    chain: ['Học trực tuyến', 'học sinh vùng xa tiếp cận được giáo viên giỏi', 'giảm chênh lệch giáo dục', 'nhưng thiếu tương tác thì kỹ năng xã hội yếu đi'],
    sample:
      'Technology has transformed education in many positive ways. Online courses allow students in remote areas to learn from experienced teachers without travelling to a city, which narrows the gap between rural and urban education. However, if learning takes place only through a screen, students may have fewer chances to develop social skills, so online learning should complement rather than replace classroom teaching.',
  },
  {
    id: 'dir.time',
    no: 11,
    group: 'aspect',
    vi: 'Thời gian và sự tiện lợi',
    en: 'Time and Convenience',
    question: 'Tiết kiệm hay tốn thời gian, công sức?',
    phrases: [
      { vi: 'Tiết kiệm thời gian', en: 'save time' },
      { vi: 'Giảm công sức cho việc thường ngày', en: 'reduce the effort of daily tasks' },
      { vi: 'Tăng thời gian dành cho gia đình', en: 'free up time for family' },
      { vi: 'Cải thiện cân bằng công việc và cuộc sống', en: 'improve work–life balance' },
      { vi: 'Giảm thời gian đi lại và chờ đợi', en: 'cut commuting and waiting time' },
    ],
    sixW: {
      who: { vi: 'Người đi làm, gia đình bận rộn, người sống ở thành phố', en: 'busy professionals, working parents, city dwellers' },
      why: { vi: 'Nhịp sống nhanh, quỹ thời gian ít, đi lại mất nhiều thời gian', en: 'fast-paced lifestyle, long commutes, time pressure' },
      what: { vi: 'Lợi: tiết kiệm thời gian, giảm công sức. Hại: lười vận động, ít giao tiếp trực tiếp', en: 'save time and effort / encourage inactivity, less face-to-face contact' },
      how: { vi: 'Làm việc từ xa, mua sắm online, dịch vụ giao hàng, tự động hóa việc nhà', en: 'work remotely, shop online, use delivery services' },
      when: { vi: 'Ngắn hạn: tiện ngay lập tức. Dài hạn: cân bằng tốt hơn, nhưng dễ phụ thuộc', en: 'instant convenience, better work–life balance, risk of dependence' },
      which: { vi: 'Thời gian tiết kiệm được chỉ có giá trị nếu dùng cho việc có ích', en: 'saved time is valuable only if used wisely' },
    },
    chain: ['Làm việc tại nhà', 'không mất 1–2 giờ đi lại mỗi ngày', 'có thêm thời gian cho gia đình và tập thể dục', 'cân bằng công việc – cuộc sống tốt hơn'],
    sample:
      'One major advantage of working from home is the time it saves. Employees no longer need to spend one or two hours commuting every day, and they can use this time to exercise, cook healthy meals or be with their families. As a result, many remote workers report a better work–life balance and higher job satisfaction.',
  },
  {
    id: 'dir.longterm',
    no: 12,
    group: 'aspect',
    vi: 'Ngắn hạn và dài hạn',
    en: 'Short-term and Long-term Effects',
    question: 'Trước mắt thế nào, lâu dài thế nào?',
    phrases: [
      { vi: 'Ngắn hạn: chi phí ban đầu, khó thích nghi', en: 'initial costs, an adjustment period' },
      { vi: 'Dài hạn: tăng năng suất, tiết kiệm tiền', en: 'higher productivity and savings in the long run' },
      { vi: 'Nâng cao chất lượng cuộc sống', en: 'a better quality of life' },
      { vi: 'Tác động đến thế hệ tương lai', en: 'affect future generations' },
      { vi: 'Tính bền vững của giải pháp', en: 'a sustainable solution' },
    ],
    sixW: {
      who: { vi: 'Thế hệ hiện tại và thế hệ tương lai', en: 'the current generation, future generations' },
      why: { vi: 'Nhiều giải pháp tốn kém lúc đầu nhưng có lợi về sau, hoặc ngược lại', en: 'initial costs vs. long-term benefits' },
      what: { vi: 'Ngắn hạn: chi phí, khó thích nghi. Dài hạn: năng suất, tiết kiệm, chất lượng sống', en: 'initial costs, adjustment period / higher productivity, savings' },
      how: { vi: 'Thực hiện từng bước, hỗ trợ người bị ảnh hưởng trong giai đoạn chuyển đổi', en: 'introduce changes gradually, support those affected' },
      when: { vi: 'Đây chính là câu WHEN: luôn so sánh "trước mắt" với "lâu dài"', en: 'in the short term… / in the long run…' },
      which: { vi: 'Nên chọn giải pháp bền vững dù tốn kém ban đầu', en: 'long-term benefits outweigh short-term costs' },
    },
    chain: ['Lắp pin mặt trời', 'ngắn hạn: chi phí lắp đặt cao', 'dài hạn: hóa đơn điện giảm, hoàn vốn sau vài năm', 'giảm khí thải cho thế hệ sau'],
    sample:
      'Although installing solar panels is expensive at first, it is a wise investment in the long run. Households can cut their electricity bills significantly and usually recover the initial cost within a few years. More importantly, reducing our dependence on fossil fuels helps protect the planet for future generations, so the short-term cost is clearly worth paying.',
  },
]

// ------------------------------------------------------------ Góc lập luận
export const ANGLES: Angle[] = [
  {
    id: 'angle.causes',
    vi: 'Nguyên nhân',
    en: 'Causes',
    question: 'Tại sao vấn đề này xảy ra?',
    frame: ['Nêu nguyên nhân chính.', 'Giải thích cơ chế: nguyên nhân đó dẫn đến vấn đề bằng cách nào.', 'Ví dụ minh họa.', 'Kết lại: vì vậy vấn đề trở nên phổ biến.'],
    patterns: [
      'One of the main reasons why [vấn đề] is that [nguyên nhân].',
      '[Vấn đề] is largely attributable to / stems from [nguyên nhân].',
      'This is because / This is due to the fact that [giải thích].',
      'A key driver of [vấn đề] is [nguyên nhân], which [cơ chế].',
    ],
    linkers: ['because', 'since', 'due to', 'owing to', 'stem from', 'result from', 'be caused by', 'be attributed to', 'a key driver of', 'lie behind'],
    chain: 'Nguyên nhân → cơ chế → vấn đề',
    prompt: 'In many countries, the number of overweight children is increasing. What are the causes of this problem?',
    sample:
      'One of the main reasons why childhood obesity is on the rise is the widespread availability of cheap fast food. Fast-food chains now operate in almost every neighbourhood, and their meals are often cheaper than fresh produce, which means busy parents tend to choose convenience over nutrition. In Vietnam, for example, the number of fried-chicken outlets has doubled over the past decade, and children who eat there regularly consume far more calories than they burn. As a result, unhealthy diets have become the norm rather than the exception.',
    sampleVi: 'Đồ ăn nhanh rẻ và có mặt khắp nơi → cha mẹ bận chọn tiện lợi thay vì dinh dưỡng → số cửa hàng gà rán ở Việt Nam tăng gấp đôi → chế độ ăn kém lành mạnh trở thành bình thường.',
  },
  {
    id: 'angle.effects',
    vi: 'Tác động',
    en: 'Effects',
    question: 'Nó gây ra những hậu quả gì?',
    frame: ['Nêu tác động và đối tượng bị ảnh hưởng.', 'Giải thích tác động diễn ra như thế nào (trực tiếp → dây chuyền).', 'Ví dụ hoặc số liệu.', 'Kết lại: phạm vi hoặc mức độ nghiêm trọng của tác động.'],
    patterns: [
      '[Hiện tượng] has a profound / considerable impact on [đối tượng].',
      'As a result / Consequently, [hậu quả].',
      'This leads to / gives rise to / results in [hậu quả].',
      '[Hiện tượng] does not only affect [A] but also [B].',
    ],
    linkers: ['as a result', 'consequently', 'therefore', 'thus', 'lead to', 'result in', 'give rise to', 'bring about', 'have an impact on', 'in turn'],
    chain: 'Hiện tượng → tác động trực tiếp → tác động dây chuyền',
    prompt: 'More and more people are working from home. What effects does this have on society?',
    sample:
      'Remote work has a considerable effect on urban life. When fewer employees commute to city centres, cafés, restaurants and public transport systems lose a large share of their regular customers. In London, for instance, weekday passenger numbers on the Underground remain well below pre-pandemic levels, forcing the operator to cut services. Consequently, the shift to home working does not only change individual routines but also reshapes the economy of entire city districts.',
    sampleVi: 'Ít người đi làm nên quán ăn, giao thông công cộng mất khách → tàu điện London phải cắt chuyến → không chỉ thay đổi thói quen cá nhân mà còn định hình lại kinh tế cả khu vực.',
  },
  {
    id: 'angle.benefits',
    vi: 'Lợi ích',
    en: 'Benefits',
    question: 'Nó mang lại điều gì tích cực?',
    frame: ['Nêu lợi ích chính.', 'Giải thích vì sao lợi ích đó xảy ra.', 'Ví dụ.', 'Kết lại: so sánh với khi không có nó, hoặc nhấn mạnh giá trị lâu dài.'],
    patterns: [
      'The main advantage of [X] is that [lợi ích].',
      '[X] allows / enables [đối tượng] to [làm gì].',
      '[X] is beneficial in that [giải thích].',
      'Not only does [X] [lợi ích 1], but it also [lợi ích 2].',
    ],
    linkers: ['advantage', 'benefit', 'enable', 'allow', 'contribute to', 'enhance', 'improve', 'facilitate', 'boost', 'in the long term'],
    chain: 'Hành động / hiện tượng → cơ chế → kết quả tích cực',
    prompt: 'Some people think that children should start learning a foreign language at primary school. Do you agree or disagree?',
    sample:
      'The main advantage of learning a second language at primary school is that young children acquire pronunciation and grammar more naturally. At this age, the brain is still highly flexible, so pupils can absorb new sounds without the self-consciousness that often holds back adult learners. Children in bilingual kindergartens in Singapore, for example, typically speak English and Mandarin with native-like accents by the age of ten. This early start therefore gives them a lifelong advantage that is extremely difficult to achieve later.',
    sampleVi: 'Trẻ tiếp thu phát âm và ngữ pháp tự nhiên hơn → não còn linh hoạt, không ngại như người lớn → trẻ ở Singapore nói hai thứ tiếng như bản xứ → lợi thế cả đời mà học muộn khó đạt.',
  },
  {
    id: 'angle.drawbacks',
    vi: 'Bất lợi',
    en: 'Drawbacks',
    question: 'Nó gây ra vấn đề gì?',
    frame: ['Nêu bất lợi chính và ai chịu thiệt.', 'Giải thích vì sao bất lợi đó xảy ra.', 'Ví dụ.', 'Kết lại: hậu quả rộng hơn (kinh tế, xã hội, văn hóa).'],
    patterns: [
      'The major drawback of [X] is that [bất lợi].',
      '[X] may pose a threat to / put pressure on / undermine [đối tượng].',
      'One serious concern is that [bất lợi].',
      'Although [X] [mặt tốt], it comes at a cost: [bất lợi].',
    ],
    linkers: ['drawback', 'disadvantage', 'downside', 'threat', 'risk', 'concern', 'undermine', 'erode', 'put pressure on', 'at the expense of'],
    chain: 'Hiện tượng → ai bị thiệt → hậu quả',
    prompt: 'Many cities are building more large shopping malls. What are the disadvantages of this development?',
    sample:
      "One serious drawback of large shopping malls is that they drive small local businesses out of the market. Independent shops cannot match the low prices and heavy marketing of international chains, so many are forced to close within a few years of a mall opening nearby. In Hanoi's Old Quarter, dozens of family-run stores have shut down since several mega-malls opened in the surrounding area. This not only costs jobs but also erodes the unique character of the neighbourhood.",
    sampleVi: 'Trung tâm thương mại đẩy cửa hàng nhỏ ra khỏi thị trường → không cạnh tranh nổi về giá và quảng cáo → phố cổ Hà Nội nhiều tiệm gia đình đóng cửa → mất việc làm và mất bản sắc khu phố.',
  },
  {
    id: 'angle.solutions',
    vi: 'Giải pháp',
    en: 'Solutions',
    question: 'Làm thế nào để giải quyết?',
    frame: ['Nêu giải pháp và chủ thể thực hiện.', 'Mô tả cách thực hiện cụ thể.', 'Giải thích giải pháp tác động lên nguyên nhân như thế nào.', 'Ví dụ hoặc bằng chứng nơi đã áp dụng thành công.'],
    patterns: [
      'One effective solution would be to [hành động].',
      'The government / Schools / Parents should [hành động], which would [kết quả].',
      'Another measure is for [chủ thể] to [hành động].',
      'This would help to [kết quả] by [cơ chế].',
    ],
    linkers: ['solution', 'measure', 'step', 'approach', 'tackle', 'address', 'combat', 'curb', 'introduce', 'invest in'],
    chain: 'Giải pháp → cơ chế → nguyên nhân bị triệt tiêu → vấn đề giảm',
    prompt: 'Traffic congestion is a growing problem in many cities. What solutions can you suggest?',
    sample:
      'One effective solution would be for city authorities to introduce congestion charges in central areas. Drivers who enter the city centre during peak hours would pay a daily fee, which would encourage many of them to switch to buses or trains instead. Since London adopted such a scheme in 2003, traffic in the charging zone has fallen by roughly a third. If the revenue is then reinvested in public transport, this measure tackles both the symptom and the underlying cause of congestion.',
    sampleVi: 'Chính quyền thu phí vào trung tâm → tài xế chuyển sang xe buýt, tàu → London giảm khoảng một phần ba lưu lượng → tiền thu được tái đầu tư vào giao thông công cộng.',
  },
  {
    id: 'angle.responsibility',
    vi: 'Trách nhiệm',
    en: 'Responsibility',
    question: 'Ai nên chịu trách nhiệm?',
    frame: ['Chỉ ra chủ thể chịu trách nhiệm chính.', 'Lý do chủ thể đó phù hợp nhất: có quyền lực, nguồn lực, hoặc được hưởng lợi.', 'Ví dụ nơi chủ thể đó đã làm tốt.', 'Thừa nhận vai trò của bên còn lại nhưng khẳng định bên chính.'],
    patterns: [
      'The primary responsibility for [vấn đề] lies with [chủ thể].',
      'It is up to [chủ thể] to [hành động].',
      'While [bên phụ] plays a part, [bên chính] is better placed to [hành động] because [lý do].',
      '[Chủ thể] should be held accountable for [vấn đề].',
    ],
    linkers: ['responsibility lies with', 'be responsible for', 'be accountable for', 'it is up to', 'play a part', 'be better placed to', 'have the resources to', 'on a national scale'],
    chain: 'Chủ thể → năng lực / lợi ích → việc nên làm',
    prompt: 'Some people think that the care of elderly people is the responsibility of their families, while others believe governments should take care of them. Discuss both views and give your opinion.',
    sample:
      "In my view, the primary responsibility for caring for the elderly should lie with the government. Only the state has the resources to build nursing homes, train professional carers and provide pensions on a national scale, whereas individual families vary greatly in income and free time. In Japan, for example, a public long-term-care insurance scheme guarantees basic support for every citizen over 65, regardless of their children's financial situation. Families can certainly offer emotional support, but an elderly person's basic security should not depend on how wealthy their relatives happen to be.",
    sampleVi: 'Trách nhiệm chính thuộc về chính phủ → chỉ nhà nước có nguồn lực ở quy mô quốc gia → bảo hiểm chăm sóc dài hạn ở Nhật → gia đình hỗ trợ tinh thần, nhưng an sinh cơ bản không nên phụ thuộc may rủi.',
  },
  {
    id: 'angle.comparison',
    vi: 'So sánh',
    en: 'Comparison',
    question: 'Phương án A tốt hơn B ở điểm nào?',
    frame: ['Nêu tiêu chí so sánh và bên thắng thế.', 'A thế nào theo tiêu chí đó.', 'B thế nào theo tiêu chí đó.', 'Kết luận: bên nào hơn và vì sao điểm đó quan trọng hơn.'],
    patterns: [
      'In terms of [tiêu chí], [A] is clearly superior to [B].',
      'Compared with [B], [A] is far more [tính chất].',
      'While [A] offers [ưu điểm], [B] tends to [nhược điểm].',
      'Although [B] is [ưu điểm của B], this advantage is outweighed by [ưu điểm của A].',
    ],
    linkers: ['compared with', 'in comparison', 'whereas', 'while', 'on the other hand', 'in contrast', 'superior to', 'outweigh', 'far more', 'in terms of'],
    chain: 'Tiêu chí → A → B → kết luận',
    prompt: 'Some people prefer to study online, while others prefer face-to-face classes. Which do you think is better?',
    sample:
      "In terms of interaction, traditional classrooms are clearly superior to online courses. Face-to-face learners can ask questions instantly, read the teacher's body language and work in small groups, whereas online students often sit alone in front of pre-recorded videos. A survey at a university in Ho Chi Minh City found that completion rates for in-person courses were almost twice as high as for their online equivalents. Although online learning offers greater flexibility, this advantage is outweighed by the lack of engagement that most students experience.",
    sampleVi: 'Về tương tác, lớp truyền thống hơn hẳn → học trực tiếp hỏi ngay, làm nhóm; học online ngồi một mình → tỷ lệ hoàn thành khóa trực tiếp cao gần gấp đôi → online linh hoạt nhưng không bù được sự thiếu gắn kết.',
  },
  {
    id: 'angle.future',
    vi: 'Tương lai',
    en: 'Future',
    question: 'Điều gì có thể xảy ra trong dài hạn?',
    frame: ['Nêu xu hướng hiện tại và dự đoán có điều kiện.', 'Đối tượng nào bị ảnh hưởng trước và vì sao.', 'Số liệu hoặc dự báo minh họa.', 'Kết lại: cảnh báo hoặc điều kiện để tránh kịch bản xấu.'],
    patterns: [
      'If this trend continues, [hậu quả] is likely to [xảy ra].',
      'In the long run / In the coming decades, [dự đoán].',
      'Unless action is taken, [hậu quả xấu].',
      '[X] will inevitably / could potentially [kết quả].',
    ],
    linkers: ['in the long run', 'in the coming decades', 'in the foreseeable future', 'is likely to', 'is expected to', 'could potentially', 'will inevitably', 'unless', 'provided that', 'if this trend continues'],
    chain: 'Xu hướng → dự đoán → hậu quả dài hạn → điều kiện',
    prompt: 'Machines are replacing human workers in many industries. What will happen to employment in the future?',
    sample:
      'If automation continues at its current pace, millions of routine jobs are likely to disappear within the next two decades. Drivers, cashiers and factory workers will be the first to be affected, since their tasks are repetitive and therefore easy to program. Some economists predict that up to 40% of current occupations in developing countries could be automated by 2045. Unless governments invest heavily in retraining, the result will be widespread unemployment and a growing gap between skilled and unskilled workers.',
    sampleVi: 'Tự động hóa tiếp tục → việc làm lặp lại biến mất → tài xế, thu ngân bị ảnh hưởng trước → dự báo 40% nghề bị thay thế → nếu không đào tạo lại, thất nghiệp và bất bình đẳng tăng.',
  },
]

// ------------------------------------------------------------- P–E–E–L
export const PEEL: { key: string; name: string; task: string; check: string }[] = [
  { key: 'P', name: 'Point', task: 'Câu chủ đề nêu ý chính của đoạn', check: 'Câu đầu đoạn đã nêu đúng MỘT ý và trả lời thẳng câu hỏi của đề chưa?' },
  { key: 'E', name: 'Explain', task: 'Giải thích cơ chế: vì sao / như thế nào', check: 'Đã giải thích được "vì sao" bằng một chuỗi nguyên nhân – kết quả chưa?' },
  { key: 'E', name: 'Example', task: 'Ví dụ cụ thể (số liệu, quốc gia, tình huống)', check: 'Ví dụ có địa điểm, con số hoặc tình huống cụ thể chưa?' },
  { key: 'L', name: 'Link', task: 'Câu kết nối lại với câu hỏi của đề', check: 'Câu cuối có quay lại đề bài hoặc quan điểm của bạn chưa?' },
]

// --------------------------------------------- Kiểm tra trước khi nộp (4 tiêu chí)
export const CHECKLIST: { id: string; criterion: string; short: string; items: { id: string; text: string }[] }[] = [
  {
    id: 'tr',
    criterion: 'Task Response',
    short: 'TR',
    items: [
      { id: 'tr1', text: 'Trả lời đủ MỌI phần của đề (mọi câu hỏi, cả hai quan điểm nếu có).' },
      { id: 'tr2', text: 'Quan điểm rõ ràng và nhất quán từ mở bài đến kết bài.' },
      { id: 'tr3', text: 'Mỗi ý được mở rộng, có giải thích và ví dụ, không liệt kê suông.' },
    ],
  },
  {
    id: 'cc',
    criterion: 'Coherence & Cohesion',
    short: 'CC',
    items: [
      { id: 'cc1', text: 'Mỗi đoạn thân bài có một ý chính, đi theo P–E–E–L.' },
      { id: 'cc2', text: 'Từ nối đa dạng, dùng đúng chỗ, không lạm dụng.' },
    ],
  },
  {
    id: 'lr',
    criterion: 'Lexical Resource',
    short: 'LR',
    items: [
      { id: 'lr1', text: 'Paraphrase đề ở mở bài, không chép lại nguyên câu.' },
      { id: 'lr2', text: 'Dùng cụm từ theo chủ đề (collocation) thay cho từ chung chung.' },
    ],
  },
  {
    id: 'gra',
    criterion: 'Grammatical Range & Accuracy',
    short: 'GRA',
    items: [
      { id: 'gra1', text: 'Có câu phức: mệnh đề quan hệ, câu điều kiện, bị động.' },
      { id: 'gra2', text: 'Đã soát lỗi chia động từ, mạo từ, số ít / số nhiều.' },
      { id: 'gra3', text: 'Đủ tối thiểu 250 từ.' },
    ],
  },
]

export const findDirection = (id: string) => DIRECTIONS.find((d) => d.id === id)
export const findAngle = (id: string) => ANGLES.find((a) => a.id === id)
export const findEssayType = (id: string) => ESSAY_TYPES.find((t) => t.id === id)
