// Sơ đồ tư duy IELTS Writing Task 2 — dữ liệu tĩnh, offline.
// Nguồn nội dung: DATA/cac-buoc-lam-bai.html (phân tích đề, 7 dạng đề, chọn quan điểm và tìm ý),
// DATA/huong-dan-song-ngu.md (công thức 6 câu hỏi, 12 hướng phát triển ý).
// Outline 13 câu theo từng dạng đề nằm ở task2Outlines.ts.

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

export interface EssayType {
  id: string
  vi: string
  en: string
  /** Cụm từ để dò dạng đề tự động (services/essayType.ts). */
  keywords: string[]
  /** Dấu hiệu trong đề, hiện cho người học. */
  signal: string
  task: string
  /** Có cần nêu ý kiến riêng không. */
  opinion: string
  body1: string
  body2: string
}

// ------------------------------------------------------------------ Dạng đề
export const ESSAY_TYPES: EssayType[] = [
  {
    id: 'type.agree',
    vi: 'Đồng ý / Không đồng ý',
    en: 'Agree or Disagree',
    keywords: ['to what extent do you agree', 'do you agree or disagree', 'agree or disagree', 'do you agree'],
    signal: 'To what extent do you agree or disagree? / Do you agree or disagree?',
    task: 'Nêu rõ mức độ đồng ý với nhận định của đề và bảo vệ quan điểm đó.',
    opinion: 'Có',
    body1: 'Lý do 1 (nếu đồng ý một phần: phía bạn nhượng bộ)',
    body2: 'Lý do 2 (hoặc phía bạn nghiêng về)',
  },
  {
    id: 'type.discuss',
    vi: 'Thảo luận hai quan điểm',
    en: 'Discuss both views',
    keywords: ['discuss both these views', 'discuss both views', 'discuss both', 'while others'],
    signal: 'Discuss both views and give your opinion.',
    task: 'Trình bày công bằng cả hai quan điểm, sau đó đưa ra ý kiến riêng.',
    opinion: 'Có',
    body1: 'Quan điểm A',
    body2: 'Quan điểm B, thường là phía bạn ủng hộ',
  },
  {
    id: 'type.advdis',
    vi: 'Ưu điểm / Nhược điểm',
    en: 'Advantages and Disadvantages',
    keywords: ['advantages and disadvantages', 'advantages outweigh', 'benefits outweigh', 'outweigh', 'benefits and drawbacks'],
    signal: 'Discuss the advantages and disadvantages. / Do the advantages outweigh the disadvantages?',
    task: 'Phân tích lợi và hại; nếu đề hỏi "outweigh" thì phải nói bên nào nặng hơn.',
    opinion: 'Chỉ khi đề hỏi outweigh hoặc your opinion',
    body1: 'Lợi ích (đề outweigh: mặt yếu hơn)',
    body2: 'Bất lợi (đề outweigh: mặt mạnh hơn, kèm lý do nó vượt trội)',
  },
  {
    id: 'type.causes',
    vi: 'Nguyên nhân / Giải pháp',
    en: 'Causes and Solutions',
    keywords: ['what are the causes', 'causes of', 'reasons for', 'why is this', 'why do', 'what measures', 'how can this be solved', 'what can be done'],
    signal: 'What are the causes…? What can be done…?',
    task: 'Chỉ ra nguyên nhân và đề xuất giải pháp tương ứng.',
    opinion: 'Không',
    body1: 'Nguyên nhân',
    body2: 'Giải pháp, mỗi giải pháp ứng với một nguyên nhân',
  },
  {
    id: 'type.problem',
    vi: 'Vấn đề / Giải pháp',
    en: 'Problem and Solution',
    keywords: ['what problems', 'problems does this cause', 'problems associated', 'what solutions', 'suggest some solutions'],
    signal: 'What problems does this cause? What solutions can you suggest?',
    task: 'Nêu các vấn đề (hậu quả) mà hiện tượng gây ra và cách khắc phục.',
    opinion: 'Không',
    body1: 'Vấn đề (hậu quả của hiện tượng)',
    body2: 'Giải pháp cho từng vấn đề',
  },
  {
    id: 'type.positive',
    vi: 'Tích cực hay tiêu cực',
    en: 'Positive or Negative development',
    keywords: ['positive or negative development', 'positive or a negative', 'positive or negative'],
    signal: 'Is this a positive or negative development?',
    task: 'Đánh giá xu hướng là tích cực hay tiêu cực và giải thích vì sao.',
    opinion: 'Có',
    body1: 'Lý do 1 (hoặc mặt bạn nhượng bộ)',
    body2: 'Lý do 2 (hoặc mặt bạn nghiêng về)',
  },
  {
    id: 'type.twopart',
    vi: 'Câu hỏi hai phần',
    en: 'Two-part question',
    keywords: [],
    signal: 'Hai câu hỏi trực tiếp, vd. Why are more people living alone? Is this a good thing for society?',
    task: 'Trả lời đủ cả hai câu hỏi của đề, mỗi câu được đối xử ngang nhau.',
    opinion: 'Tùy câu hỏi (Is this a good thing? là hỏi ý kiến)',
    body1: 'Trả lời câu 1',
    body2: 'Trả lời câu 2',
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

export const findDirection = (id: string) => DIRECTIONS.find((d) => d.id === id)
export const findEssayType = (id: string) => ESSAY_TYPES.find((t) => t.id === id)
