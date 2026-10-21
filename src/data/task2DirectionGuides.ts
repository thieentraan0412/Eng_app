// Ví dụ song ngữ cho 12 hướng phát triển ý — sinh bằng scripts/gen-direction-guides.mjs, đừng sửa tay.
// Nguồn: DATA/huong-dan-song-ngu.html, mục "3. 12 hướng phát triển ý": câu hỏi chính, ý triển khai,
// đào sâu bằng 6 câu hỏi (mỗi câu 3 câu ví dụ có pattern), collocation, chuỗi lập luận, đoạn mẫu.
// Chữ trong **…** là phần in đậm trong tài liệu (collocation / pattern được áp dụng).
import type { PatternLevel } from './task2Patterns'
import type { SixWKey } from './task2MindMap'

export interface BiText {
  vi: string
  en: string
}

/** Một câu ví dụ: áp dụng một pattern ở mục 2 của tài liệu. */
export interface DirExample extends BiText {
  pattern: string
  /** Nghĩa tiếng Việt của pattern. */
  meaning: string
  level: PatternLevel
}

export interface DirCollocation extends BiText {
  level: PatternLevel
  pattern: string
  meaning: string
}

export interface DirectionGuide {
  /** Câu hỏi chính của hướng. */
  question: BiText
  ideas: BiText[]
  /** Đào sâu bằng 6 câu hỏi: ý tóm tắt + câu ví dụ. */
  six: Record<SixWKey, BiText & { ex: DirExample[] }>
  colls: DirCollocation[]
  chain: BiText
  sample: BiText
}

export const DIRECTION_GUIDES: Record<string, DirectionGuide> = {
  'dir.government': {
    question: { vi: 'Chính phủ nên làm gì?', en: 'What should the government do?' },
    ideas: [
      { vi: 'Ban hành luật và quy định.', en: 'Introduce **laws and regulations**.' },
      { vi: 'Tăng ngân sách, đầu tư dịch vụ công.', en: '**Increase public funding** and invest in public services.' },
      { vi: 'Nâng cao nhận thức cộng đồng.', en: '**Raise public awareness** through national campaigns.' },
      { vi: 'Xây dựng cơ sở hạ tầng.', en: '**Develop infrastructure** such as roads, hospitals and schools.' },
      { vi: 'Trợ cấp hoặc áp thuế.', en: '**Provide subsidies** for good behaviour or **impose taxes** on harmful products.' },
      { vi: 'Giám sát và xử phạt hành vi vi phạm.', en: 'Monitor compliance and **enforce regulations** with fines.' },
    ],
    six: {
      who: { vi: 'Chính phủ, chính quyền địa phương, cơ quan quản lý.', en: '**The government**, **local authorities** and **policymakers**.', ex: [
          { vi: 'Chính phủ trung ương đóng vai trò quan trọng nhất vì luật của họ áp dụng cho cả nước.', en: 'The central government **plays the most important role in** this, as its laws apply to the whole country.', pattern: 'play an important role in sth', meaning: 'đóng vai trò quan trọng trong', level: 'basic' },
          { vi: 'So với các bộ ở trung ương, chính quyền địa phương hiểu nhu cầu của từng khu vực rõ hơn nhiều.', en: '**Compared with** central ministries, local authorities understand the needs of each area far better.', pattern: 'compared with / in comparison with sth', meaning: 'so với', level: 'mid' },
          { vi: 'Các cơ quan quản lý chịu trách nhiệm giám sát việc thực thi luật.', en: 'Regulatory bodies **take responsibility for** monitoring how rules are enforced.', pattern: 'take responsibility for sth', meaning: 'chịu trách nhiệm về', level: 'mid' },
        ] },
      why: { vi: 'Vấn đề quá lớn, cá nhân không tự giải quyết được; cần nguồn lực và quyền lực pháp lý.', en: 'The problem is **beyond the capacity of individuals** and **requires large-scale funding** as well as legal power.', ex: [
          { vi: 'Một số vấn đề quá lớn, chỉ bằng ngân sách quốc gia mới giải quyết được.', en: 'Some problems are so large that **only by using** national funds **can** they **be solved**.', pattern: 'Only by V-ing can S + V', meaning: 'chỉ bằng cách … thì mới …', level: 'adv' },
          { vi: 'Lý do chính phủ phải vào cuộc là chỉ nhà nước mới có quyền làm luật và xử phạt.', en: '**The reason why** governments must act **is that** only the state has the legal power to make laws and punish offenders.', pattern: 'The reason why … is that …', meaning: 'lý do … là vì …', level: 'adv' },
          { vi: 'Nếu thị trường tự do không được kiểm soát, người yếu thế và môi trường sẽ không được bảo vệ.', en: '**If** the free market **were** left alone, vulnerable people and the environment **would** not **be protected**.', pattern: 'If + past, would + V', meaning: 'nếu … thì sẽ (giả định)', level: 'mid' },
        ] },
      what: { vi: 'Tác động trên diện rộng, thay đổi nhanh hành vi của cả xã hội.', en: 'Government action **has a nationwide impact** and can **change behaviour on a large scale** in a short time.', ex: [
          { vi: 'Một luật mới có thể buộc hàng triệu người thay đổi hành vi cùng lúc.', en: 'A single new law can **force millions of people to change** their behaviour at the same time.', pattern: 'force / compel sb to do sth', meaning: 'buộc ai phải làm gì', level: 'mid' },
          { vi: 'Chi tiêu công cung cấp cho người dân trường học, bệnh viện và đường sá.', en: 'Public spending **provides citizens with** schools, hospitals and roads.', pattern: 'provide sb with sth', meaning: 'cung cấp cho ai cái gì', level: 'mid' },
          { vi: 'Tuy nhiên, chính sách sai có thể dẫn đến lãng phí tiền thuế và gây bất bình.', en: "However, a poorly designed policy can **lead to** wasted taxpayers' money and public anger.", pattern: 'lead to sth', meaning: 'dẫn đến', level: 'basic' },
        ] },
      how: { vi: 'Ban hành luật, tăng ngân sách, trợ cấp, đánh thuế, xây hạ tầng, tuyên truyền.', en: 'It can **introduce legislation**, **allocate funding**, **impose taxes** and **launch public campaigns**.', ex: [
          { vi: 'Chính phủ nên ban hành luật nghiêm để ngăn doanh nghiệp xả thải bừa bãi.', en: 'The government should pass strict laws to **prevent companies from polluting** freely.', pattern: 'prevent sb from doing sth', meaning: 'ngăn cản ai làm gì', level: 'mid' },
          { vi: 'Đánh thuế hàng hóa có hại sẽ khiến người dân ngại mua chúng.', en: 'Taxing harmful products would **discourage people from buying** them.', pattern: 'discourage sb from doing sth', meaning: 'làm ai nản, không muốn làm gì', level: 'mid' },
          { vi: 'Các chiến dịch truyền thông có thể nâng cao nhận thức của người dân về vấn đề này.', en: 'Public campaigns can **raise awareness of** the issue among ordinary citizens.', pattern: 'raise awareness of sth', meaning: 'nâng cao nhận thức về', level: 'mid' },
        ] },
      when: { vi: 'Ngắn hạn: tốn ngân sách, có thể gặp phản đối. Dài hạn: thay đổi bền vững, có hệ thống.', en: '**In the short term**, it is costly and may face opposition; **in the long run**, it brings **lasting, systematic change**.', ex: [
          { vi: 'Trước mắt, chính sách mới tốn ngân sách và có khả năng gặp phản đối.', en: 'In the short term, new policies are costly and **are likely to** meet resistance.', pattern: 'be likely / unlikely to V', meaning: 'có khả năng / không có khả năng', level: 'mid' },
          { vi: 'Về lâu dài, luật dần trở thành thói quen của xã hội.', en: '**In the long run,** laws gradually become accepted social norms.', pattern: 'in the short term / in the long run', meaning: 'trước mắt / về lâu dài', level: 'basic' },
          { vi: 'Trừ khi luật được thực thi nhất quán, kết quả sẽ không bền vững.', en: '**Unless** laws are enforced consistently, the results will not last.', pattern: 'unless + clause', meaning: 'trừ khi', level: 'mid' },
        ] },
      which: { vi: 'Luật kèm chế tài hiệu quả hơn lời kêu gọi tự nguyện vì có tính bắt buộc.', en: '**Legally binding measures are more effective than voluntary ones**, because people have to comply.', ex: [
          { vi: 'Biện pháp bắt buộc hiệu quả hơn nhiều so với lời kêu gọi tự nguyện.', en: 'Compulsory measures are **far more effective than** voluntary appeals.', pattern: 'far / much / considerably + comparative', meaning: 'hơn nhiều', level: 'mid' },
          { vi: 'Chính phủ hợp với vấn đề quy mô quốc gia, trong khi cá nhân hợp với thói quen hằng ngày.', en: 'Governments suit national-scale problems, **whereas** individuals suit everyday habits.', pattern: 'whereas / while + clause', meaning: 'trong khi (đối lập)', level: 'mid' },
          { vi: 'Theo tôi, cách tốt nhất là chính phủ dẫn dắt và người dân cùng tham gia.', en: '**I would argue that** the best approach combines government leadership with public participation.', pattern: 'I would argue that …', meaning: 'tôi cho rằng (khi lập luận)', level: 'adv' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'đánh thuế lên', pattern: 'impose a tax on sth', en: 'The government should **impose a tax on** sugary drinks.', vi: 'Chính phủ nên đánh thuế đồ uống có đường.' },
      { level: 'mid', meaning: 'khuyến khích ai làm gì', pattern: 'encourage sb to do sth', en: 'Tax breaks **encourage companies to invest** in clean energy.', vi: 'Ưu đãi thuế khuyến khích doanh nghiệp đầu tư vào năng lượng sạch.' },
      { level: 'mid', meaning: 'ngăn ai làm gì', pattern: 'prevent sb from doing sth', en: 'Strict laws **prevent factories from dumping** waste into rivers.', vi: 'Luật nghiêm ngặt ngăn nhà máy xả thải ra sông.' },
      { level: 'adv', meaning: 'trách nhiệm của chính phủ là', pattern: "It is the government's responsibility to V", en: "**It is the government's responsibility to ensure** that every citizen has access to healthcare.", vi: 'Trách nhiệm của chính phủ là đảm bảo mọi công dân được tiếp cận y tế.' },
      { level: 'adv', meaning: 'chỉ bằng cách … thì mới …', pattern: 'Only by V-ing can S + V', en: '**Only by enforcing** strict regulations **can** the authorities **reduce** pollution.', vi: 'Chỉ bằng cách thực thi quy định nghiêm ngặt thì chính quyền mới giảm được ô nhiễm.' },
    ],
    chain: { vi: 'Chính phủ đánh thuế đồ uống có đường → giá tăng → người dân mua ít hơn → giảm béo phì và chi phí y tế.', en: 'The government taxes sugary drinks → prices rise → people buy fewer of them → obesity and healthcare costs fall.' },
    sample: { vi: 'Chính phủ là bên có vị thế tốt nhất để giải quyết vấn đề này vì họ có cả thẩm quyền lẫn nguồn lực. Ví dụ, đánh thuế đồ uống có đường sẽ đẩy giá lên, khiến người dân ngại mua. Nhờ đó, tỷ lệ béo phì có thể giảm và hệ thống y tế sẽ tiết kiệm được một khoản tiền đáng kể về lâu dài.', en: 'Governments are in the best position to tackle this problem because they have both the authority and the resources. For example, a tax on sugary drinks would raise their price, which would discourage people from buying them. As a result, obesity rates could fall, and the healthcare system would save a considerable amount of money in the long term.' },
  },
  'dir.individuals': {
    question: { vi: 'Mỗi người có thể làm gì?', en: 'What can each person do?' },
    ideas: [
      { vi: 'Thay đổi thói quen và hành vi.', en: '**Change personal habits** and behaviour.' },
      { vi: 'Chịu trách nhiệm cho lựa chọn của mình.', en: '**Take responsibility** for their own choices.' },
      { vi: 'Nâng cao kiến thức và kỹ năng.', en: '**Improve their knowledge and skills**.' },
      { vi: 'Tuân thủ pháp luật.', en: '**Obey the law**.' },
      { vi: 'Sử dụng tài nguyên hợp lý.', en: '**Use resources responsibly**, such as water and electricity.' },
      { vi: 'Chủ động giải quyết vấn đề thay vì phụ thuộc vào người khác.', en: '**Take the initiative** instead of relying on others to solve problems.' },
    ],
    six: {
      who: { vi: 'Mỗi người, người tiêu dùng, công dân.', en: '**Individuals**, **consumers** and **citizens**.', ex: [
          { vi: 'Người tiêu dùng đóng vai trò quan trọng vì họ quyết định mua gì và mua bao nhiêu.', en: 'Consumers **play an important role in** this, because they decide what and how much to buy.', pattern: 'play an important role in sth', meaning: 'đóng vai trò quan trọng trong', level: 'basic' },
          { vi: 'Lá phiếu và tiếng nói giúp công dân có thể gây áp lực lên chính quyền.', en: 'Voting and speaking up **make it possible for citizens to put** pressure on the authorities.', pattern: 'make it possible for sb to do sth', meaning: 'giúp ai có thể làm gì', level: 'mid' },
          { vi: 'So với người lớn tuổi, người trẻ thay đổi thói quen dễ hơn nhiều.', en: '**Compared with** older people, young people adopt new habits much more easily.', pattern: 'compared with / in comparison with sth', meaning: 'so với', level: 'mid' },
        ] },
      why: { vi: 'Vấn đề bắt nguồn từ thói quen và lựa chọn hằng ngày của từng người.', en: 'Many problems **stem from daily habits and personal choices**.', ex: [
          { vi: 'Nhiều vấn đề bắt nguồn từ hàng triệu lựa chọn cá nhân mỗi ngày.', en: 'Many problems **stem from** millions of personal choices made every day.', pattern: 'be caused by / stem from sth', meaning: 'do … gây ra / bắt nguồn từ', level: 'mid' },
          { vi: 'Luật không thể ngăn con người làm mọi điều sai trong đời sống riêng.', en: 'Laws cannot **stop people from doing** everything wrong in their private lives.', pattern: 'stop sb (from) doing sth', meaning: 'ngăn ai làm gì', level: 'basic' },
          { vi: 'Chính nhận thức của mỗi người mới tạo ra thay đổi bền vững nhất.', en: '**It is** personal conviction **that** produces the most lasting change.', pattern: 'It is … that … (câu chẻ)', meaning: 'chính … mà …', level: 'mid' },
        ] },
      what: { vi: 'Thay đổi nhỏ nhưng cộng dồn thành tác động lớn; tạo ảnh hưởng tới người xung quanh.', en: '**Small changes add up** to a big impact, and people who change **set an example for others**.', ex: [
          { vi: 'Thói quen tốt không những giúp tiết kiệm tiền mà còn cải thiện sức khỏe.', en: "Good habits **not only** save money **but also** improve people's health.", pattern: 'not only … but (also) …', meaning: 'không những … mà còn …', level: 'mid' },
          { vi: 'Hành động của một người có thể khuyến khích gia đình và bạn bè làm theo.', en: "One person's actions can **encourage family and friends to follow** suit.", pattern: 'encourage sb to do sth', meaning: 'khuyến khích ai làm gì', level: 'basic' },
          { vi: 'Khi nhiều người đổi cách mua sắm, doanh nghiệp buộc phải thay đổi sản phẩm.', en: 'When many consumers change their habits, businesses **are forced to change** their products.', pattern: 'force / compel sb to do sth', meaning: 'buộc ai phải làm gì', level: 'mid' },
        ] },
      how: { vi: 'Đổi thói quen, tự học, tiết kiệm tài nguyên, tuân thủ luật, chọn sản phẩm có trách nhiệm.', en: 'People can **change their lifestyle**, **take responsibility** and **make informed choices** as consumers.', ex: [
          { vi: 'Một cách để giảm rác thải là mỗi người tự tái chế và tiết kiệm điện nước.', en: '**One way to reduce** waste **is to** recycle and save energy and water at home.', pattern: 'One way to V is to V', meaning: 'một cách để … là …', level: 'basic' },
          { vi: 'Tìm hiểu thông tin trước khi mua giúp người tiêu dùng lựa chọn sáng suốt.', en: 'Doing research before shopping **enables consumers to make** informed choices.', pattern: 'enable sb to do sth', meaning: 'giúp ai có khả năng làm gì', level: 'mid' },
          { vi: 'Hoạt động tình nguyện đóng góp đáng kể cho cộng đồng.', en: 'Volunteering **makes a significant contribution to** the local community.', pattern: 'make a contribution to sth', meaning: 'đóng góp cho', level: 'mid' },
        ] },
      when: { vi: 'Ngắn hạn: khó duy trì, cần ý chí. Dài hạn: trở thành lối sống, lan tỏa cho thế hệ sau.', en: 'New habits are **hard to maintain at first** but **become second nature over time** and pass on to the next generation.', ex: [
          { vi: 'Mặc dù thói quen mới khó duy trì lúc đầu, nó dần trở nên tự nhiên.', en: '**Although** new habits are hard to keep at first, they gradually become second nature.', pattern: 'although / even though + clause', meaning: 'mặc dù', level: 'basic' },
          { vi: 'Càng nhiều người tham gia, thói quen tốt càng nhanh trở thành chuẩn mực.', en: '**The more** people take part, **the faster** good habits become the norm.', pattern: 'The + comparative …, the + comparative …', meaning: 'càng … càng …', level: 'adv' },
          { vi: 'Thế hệ sau có khả năng sẽ học theo tấm gương của cha mẹ.', en: "The next generation **is likely to follow** their parents' example.", pattern: 'be likely / unlikely to V', meaning: 'có khả năng / không có khả năng', level: 'mid' },
        ] },
      which: { vi: 'Hiệu quả khi có nhiều người cùng làm; một mình cá nhân thì tác động hạn chế.', en: 'Individual action is **effective only when many people take part**; one person alone has limited impact.', ex: [
          { vi: 'Dù đúng là một người tác động nhỏ, hàng triệu người cùng làm sẽ tạo khác biệt rất lớn.', en: '**While it is true that** one person has little impact, millions acting together make a huge difference.', pattern: 'While it is true that …, …', meaning: 'dù đúng là … nhưng …', level: 'adv' },
          { vi: 'Cá nhân hành động nhanh hơn nhiều so với chính phủ vì không phải chờ luật.', en: 'Individuals can act **far faster than** governments, as they do not have to wait for new laws.', pattern: 'far / much / considerably + comparative', meaning: 'hơn nhiều', level: 'mid' },
          { vi: 'Cần cân bằng giữa trách nhiệm cá nhân và hành động của nhà nước.', en: 'Society must **strike a balance between** personal responsibility **and** state action.', pattern: 'strike a balance between A and B', meaning: 'cân bằng giữa A và B', level: 'adv' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'chịu trách nhiệm về', pattern: 'take responsibility for sth', en: 'Everyone should **take responsibility for** their own health.', vi: 'Mỗi người nên tự chịu trách nhiệm về sức khỏe của mình.' },
      { level: 'mid', meaning: 'đưa ra lựa chọn sáng suốt', pattern: 'make informed choices', en: 'Clear food labels help consumers **make informed choices**.', vi: 'Nhãn thực phẩm rõ ràng giúp người tiêu dùng lựa chọn sáng suốt.' },
      { level: 'mid', meaning: 'nếu … thì sẽ (giả định)', pattern: 'If + past, would + V', en: '**If** every person **recycled** their waste, landfills **would shrink** dramatically.', vi: 'Nếu mỗi người đều tái chế rác, các bãi rác sẽ thu hẹp đáng kể.' },
      { level: 'adv', meaning: 'làm gương cho ai', pattern: 'set an example for sb', en: 'People who cycle to work **set an example for** their colleagues.', vi: 'Những người đạp xe đi làm là tấm gương cho đồng nghiệp.' },
      { level: 'adv', meaning: 'dù rất …', pattern: 'Much as + clause, …', en: '**Much as** individuals can make a difference, their efforts are limited without government support.', vi: 'Dù cá nhân có thể tạo ra thay đổi, nỗ lực của họ vẫn hạn chế nếu thiếu sự hỗ trợ của chính phủ.' },
    ],
    chain: { vi: 'Mỗi người mang túi vải khi đi chợ → giảm túi nilon → giảm rác thải nhựa → khi hàng triệu người cùng làm, lượng rác giảm đáng kể.', en: 'Each person brings a cloth bag when shopping → fewer plastic bags are used → plastic waste falls → when millions do the same, waste drops significantly.' },
    sample: { vi: 'Mặt khác, mỗi cá nhân cũng đóng vai trò quan trọng. Nhiều vấn đề môi trường bắt nguồn từ thói quen hằng ngày, như dùng túi nilon hay lái xe cho những quãng đường ngắn. Nếu mỗi người tự mang túi và đi bộ hoặc đạp xe thường xuyên hơn, lượng rác thải và khí thải sẽ giảm. Dù hành động của một người có vẻ nhỏ bé, tác động cộng dồn của hàng triệu người có thể rất đáng kể.', en: "On the other hand, individuals also play an important role. Many environmental problems are caused by everyday habits, such as using plastic bags or driving short distances. If each person brought their own bag and walked or cycled more often, the amount of waste and emissions would fall. Although one person's actions seem small, the combined effect of millions of people can be significant." },
  },
  'dir.schools': {
    question: { vi: 'Nhà trường có thể làm gì?', en: 'What can schools and universities do?' },
    ideas: [
      { vi: 'Cải thiện chất lượng giáo dục.', en: '**Improve the quality of education**.' },
      { vi: 'Dạy kỹ năng thực tế bên cạnh lý thuyết.', en: '**Teach practical skills** alongside theory.' },
      { vi: 'Tổ chức hoạt động ngoại khóa.', en: '**Organise extracurricular activities**.' },
      { vi: 'Giáo dục ý thức và trách nhiệm.', en: "**Raise students' awareness** and sense of responsibility." },
      { vi: 'Hướng nghiệp cho học sinh, sinh viên.', en: '**Provide career guidance** for students.' },
      { vi: 'Trang bị kỹ năng công nghệ và tư duy phản biện.', en: 'Develop **digital literacy** and **critical thinking**.' },
    ],
    six: {
      who: { vi: 'Nhà trường, giáo viên, trường đại học.', en: '**Schools**, **teachers** and **educational institutions**.', ex: [
          { vi: 'Giáo viên đóng vai trò quan trọng trong việc hình thành kiến thức và thái độ của học sinh.', en: "Teachers **play an important role in** shaping students' knowledge and attitudes.", pattern: 'play an important role in sth', meaning: 'đóng vai trò quan trọng trong', level: 'basic' },
          { vi: 'Ban giám hiệu chịu trách nhiệm về chương trình và hoạt động của trường.', en: 'School leaders **take responsibility for** the curriculum and school activities.', pattern: 'take responsibility for sth', meaning: 'chịu trách nhiệm về', level: 'mid' },
          { vi: 'Trường đại học trang bị cho sinh viên kỹ năng mà thị trường lao động cần.', en: 'Universities **equip students with** the skills the job market needs.', pattern: 'equip sb with sth', meaning: 'trang bị cho ai cái gì', level: 'mid' },
        ] },
      why: { vi: 'Trẻ dành phần lớn thời gian ở trường; đây là nơi hình thành kiến thức và thái độ.', en: '**Children spend most of their time at school**, where their knowledge and attitudes are shaped.', ex: [
          { vi: 'Lý do nhà trường quan trọng là trẻ dành 6–8 tiếng mỗi ngày ở trường.', en: '**The reason why** schools matter so much **is that** children spend six to eight hours a day there.', pattern: 'The reason why … is that …', meaning: 'lý do … là vì …', level: 'adv' },
          { vi: 'Trường học giúp mọi trẻ em, kể cả trẻ nhà nghèo, có thể tiếp cận kiến thức.', en: 'Schools **make it possible for every child**, including those from poor families, **to access** knowledge.', pattern: 'make it possible for sb to do sth', meaning: 'giúp ai có thể làm gì', level: 'mid' },
          { vi: 'Mãi đến khi trưởng thành người ta mới thấy thói quen từ nhỏ quan trọng thế nào.', en: '**Not until** people reach adulthood **do** they **realise** how much their early habits matter.', pattern: 'Not until … do / does S + V', meaning: 'mãi đến khi … mới …', level: 'adv' },
        ] },
      what: { vi: 'Trang bị kiến thức, kỹ năng và ý thức từ sớm; ảnh hưởng tới cả thế hệ.', en: 'Schools **equip students with skills** early and can **influence a whole generation**.', ex: [
          { vi: 'Giờ học thực hành cung cấp cho học sinh kỹ năng sống thực tế.', en: 'Practical lessons **provide students with** real-life skills.', pattern: 'provide sb with sth', meaning: 'cung cấp cho ai cái gì', level: 'mid' },
          { vi: 'Giáo dục có thể nâng cao nhận thức của cả một thế hệ.', en: 'Education can **raise awareness of** social issues across a whole generation.', pattern: 'raise awareness of sth', meaning: 'nâng cao nhận thức về', level: 'mid' },
          { vi: 'Tuy nhiên, áp lực thi cử có thể gây căng thẳng cao cho học sinh.', en: 'However, exam pressure can **result in** high levels of stress among students.', pattern: 'result in sth / result from sth', meaning: 'gây ra / bắt nguồn từ', level: 'mid' },
        ] },
      how: { vi: 'Đưa môn học mới vào chương trình, dạy kỹ năng thực tế, hoạt động ngoại khóa, hướng nghiệp.', en: 'They can **include the topic in the curriculum**, **offer practical courses** and give **career guidance**.', ex: [
          { vi: 'Trường học nên đưa kỹ năng sống và tài chính cá nhân vào chương trình.', en: 'Schools **should include** life skills and personal finance in the curriculum.', pattern: 'should / ought to + V', meaning: 'nên', level: 'basic' },
          { vi: 'Hoạt động ngoại khóa khuyến khích học sinh làm việc nhóm.', en: 'Extracurricular activities **encourage students to work** in teams.', pattern: 'encourage sb to do sth', meaning: 'khuyến khích ai làm gì', level: 'basic' },
          { vi: 'Hướng nghiệp sớm sẽ góp phần lớn vào việc giảm thất nghiệp ở sinh viên mới ra trường.', en: 'Early career guidance would **go a long way towards reducing** graduate unemployment.', pattern: 'go a long way towards V-ing', meaning: 'góp phần lớn vào việc', level: 'adv' },
        ] },
      when: { vi: 'Ngắn hạn: cần đào tạo giáo viên, sửa chương trình. Dài hạn: thế hệ trẻ có ý thức và kỹ năng tốt hơn.', en: 'Changes **require teacher training** and a new curriculum at first, but they **produce a better-prepared generation** later.', ex: [
          { vi: 'Trước mắt, sửa chương trình và đào tạo giáo viên được dự đoán sẽ tốn nhiều chi phí.', en: 'In the short term, revising the curriculum and training teachers **is expected to** cost a lot.', pattern: 'be expected to V', meaning: 'được dự đoán sẽ', level: 'mid' },
          { vi: 'Về lâu dài, học sinh có khả năng trở thành người trưởng thành có trách nhiệm hơn.', en: 'In the long run, students **are likely to grow** into more responsible adults.', pattern: 'be likely / unlikely to V', meaning: 'có khả năng / không có khả năng', level: 'mid' },
          { vi: 'Hiếm khi kết quả của giáo dục thấy rõ trong vòng dưới 10–20 năm.', en: '**Rarely do** the results of education **appear** in less than ten to twenty years.', pattern: 'Rarely / Seldom + trợ động từ + S + V', meaning: 'hiếm khi', level: 'adv' },
        ] },
      which: { vi: 'Giáo dục là giải pháp gốc rễ, bền vững hơn biện pháp trừng phạt.', en: 'Education **tackles the root cause rather than the symptoms**, so it lasts longer than punishment.', ex: [
          { vi: 'Giáo dục giải quyết gốc rễ, trong khi trừng phạt chỉ xử lý triệu chứng.', en: 'Education tackles the root cause, **whereas** punishment only treats the symptoms.', pattern: 'whereas / while + clause', meaning: 'trong khi (đối lập)', level: 'mid' },
          { vi: 'So với gia đình, nhà trường dạy kiến thức tốt hơn nhưng dạy giá trị kém hơn.', en: '**Compared with** families, schools are better at teaching knowledge but weaker at teaching values.', pattern: 'compared with / in comparison with sth', meaning: 'so với', level: 'mid' },
          { vi: 'Kết hợp lý thuyết với thực hành vượt trội hơn học thuộc lòng.', en: 'Combining theory with practice **is superior to** rote learning.', pattern: 'be superior / inferior to sth', meaning: 'vượt trội / kém hơn', level: 'adv' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'dạy ai cách làm gì', pattern: 'teach sb how to do sth', en: 'Schools should **teach students how to manage** their money.', vi: 'Trường học nên dạy học sinh cách quản lý tiền.' },
      { level: 'mid', meaning: 'trang bị cho ai cái gì', pattern: 'equip sb with sth', en: 'Practical courses **equip students with** skills for the real world.', vi: 'Các khóa thực hành trang bị cho học sinh kỹ năng cho cuộc sống thực.' },
      { level: 'mid', meaning: 'không những … mà còn …', pattern: 'not only … but also …', en: 'Extracurricular activities **not only** build teamwork **but also** reduce stress.', vi: 'Hoạt động ngoại khóa không những rèn tinh thần đồng đội mà còn giảm căng thẳng.' },
      { level: 'adv', meaning: 'thu hẹp khoảng cách giữa A và B', pattern: 'bridge the gap between A and B', en: 'Career guidance can **bridge the gap between** education **and** employment.', vi: 'Hướng nghiệp có thể thu hẹp khoảng cách giữa giáo dục và việc làm.' },
      { level: 'adv', meaning: 'giải quyết gốc rễ thay vì triệu chứng', pattern: 'tackle the root cause rather than the symptoms', en: 'Teaching values at school **tackles the root cause** of crime **rather than** its symptoms.', vi: 'Dạy giá trị sống ở trường giải quyết gốc rễ của tội phạm thay vì chỉ xử lý triệu chứng.' },
    ],
    chain: { vi: 'Trường dạy kỹ năng quản lý tài chính → học sinh biết lập ngân sách → khi đi làm ít nợ nần → xã hội ổn định hơn.', en: 'Schools teach money management → students learn to budget → they fall into less debt as adults → society becomes more stable.' },
    sample: { vi: 'Nhà trường cũng có thể tạo ra khác biệt bằng cách dạy kỹ năng sống thực tế. Nếu quản lý tài chính là một phần của chương trình học, học sinh sẽ biết lập ngân sách và tiết kiệm trước khi bắt đầu kiếm tiền. Nhờ vậy, khi trưởng thành các em ít có nguy cơ rơi vào nợ nần, điều này có lợi không chỉ cho bản thân mà còn cho cả xã hội.', en: 'Schools can also make a difference by teaching practical life skills. If financial management were part of the curriculum, students would learn how to budget and save before they start earning money. Consequently, they would be less likely to fall into debt as adults, which benefits not only themselves but also society as a whole.' },
  },
  'dir.parents': {
    question: { vi: 'Cha mẹ và gia đình có thể làm gì?', en: 'What can parents and families do?' },
    ideas: [
      { vi: 'Làm gương cho con cái.', en: '**Set a good example** for their children.' },
      { vi: 'Giám sát việc sử dụng Internet.', en: "**Monitor their children's Internet use**." },
      { vi: 'Dạy kỹ năng sống và đạo đức.', en: '**Teach life skills and moral values**.' },
      { vi: 'Dành thời gian cho con.', en: '**Spend quality time** with their children.' },
      { vi: 'Khuyến khích tính tự lập.', en: '**Encourage independence**.' },
      { vi: 'Hỗ trợ tinh thần và việc học của trẻ.', en: 'Provide **emotional and academic support**.' },
    ],
    six: {
      who: { vi: 'Cha mẹ, ông bà, người giám hộ.', en: '**Parents**, **families** and **caregivers**.', ex: [
          { vi: 'Cha mẹ đóng vai trò quan trọng nhất trong việc nuôi dạy con.', en: 'Parents **play the most important role in** raising children.', pattern: 'play an important role in sth', meaning: 'đóng vai trò quan trọng trong', level: 'basic' },
          { vi: 'Ông bà chăm cháu giúp cha mẹ có thể yên tâm đi làm.', en: 'By looking after the children, grandparents **make it possible for parents to work**.', pattern: 'make it possible for sb to do sth', meaning: 'giúp ai có thể làm gì', level: 'mid' },
          { vi: 'Anh chị lớn có thể khuyến khích em nhỏ học tập chăm chỉ.', en: 'Older siblings can **encourage younger ones to study** hard.', pattern: 'encourage sb to do sth', meaning: 'khuyến khích ai làm gì', level: 'basic' },
        ] },
      why: { vi: 'Gia đình là môi trường đầu tiên và gần gũi nhất; trẻ học bằng cách bắt chước.', en: 'The family is the first environment a child knows: **children imitate their parents**, who are **their first teachers**.', ex: [
          { vi: 'Trẻ học bằng cách quan sát, vì vậy hành vi của cha mẹ định hình hành vi của con.', en: "Children learn by observation, **so** their parents' behaviour shapes their own.", pattern: 'so + clause / As a result, …', meaning: 'vì vậy, do đó', level: 'basic' },
          { vi: 'Chính những năm đầu đời quyết định tính cách của trẻ.', en: "**It is** the early years **that** shape a child's personality.", pattern: 'It is … that … (câu chẻ)', meaning: 'chính … mà …', level: 'mid' },
          { vi: 'Không ai hiểu nhu cầu của từng đứa trẻ rõ hơn gia đình.', en: "No one understands a child's needs **better than** their own family.", pattern: 'more / less + adj + than', meaning: 'hơn / kém hơn', level: 'basic' },
        ] },
      what: { vi: 'Hình thành tính cách, giá trị đạo đức, thói quen từ nhỏ.', en: "Parents **shape children's character and values** from an early age.", ex: [
          { vi: 'Sự quan tâm của cha mẹ giúp trẻ hình thành giá trị và thói quen tốt.', en: 'Parental attention **helps children develop** good values and habits.', pattern: 'help sb (to) do sth', meaning: 'giúp ai làm gì', level: 'basic' },
          { vi: 'Một gia đình yêu thương giúp trẻ đủ tự tin để đối mặt thử thách.', en: 'A loving home **empowers children to face** challenges with confidence.', pattern: 'empower sb to do sth', meaning: 'tạo sức mạnh, trao quyền cho ai làm gì', level: 'adv' },
          { vi: 'Thiếu quan tâm có thể dẫn đến nghiện thiết bị hoặc sa vào tệ nạn.', en: 'A lack of attention can **lead to** screen addiction or antisocial behaviour.', pattern: 'lead to sth', meaning: 'dẫn đến', level: 'basic' },
        ] },
      how: { vi: 'Làm gương, giới hạn thời gian dùng thiết bị, dành thời gian cho con, khuyến khích tự lập.', en: 'They can **set a good example**, **limit screen time** and **spend quality time** with their children.', ex: [
          { vi: 'Cha mẹ nên làm gương trong cả lời nói lẫn hành động.', en: 'Parents **should lead** by example in both words and actions.', pattern: 'should / ought to + V', meaning: 'nên', level: 'basic' },
          { vi: 'Quy tắc rõ ràng về giờ dùng thiết bị ngăn trẻ dùng điện thoại đến khuya.', en: 'Clear rules on screen time **prevent children from using** their phones late at night.', pattern: 'prevent sb from doing sth', meaning: 'ngăn cản ai làm gì', level: 'mid' },
          { vi: 'Một cách để gắn kết gia đình là cùng ăn tối và trò chuyện mỗi ngày.', en: '**One way to strengthen** family bonds **is to** eat and talk together every day.', pattern: 'One way to V is to V', meaning: 'một cách để … là …', level: 'basic' },
        ] },
      when: { vi: 'Ngắn hạn: tốn thời gian, cha mẹ bận rộn khó làm. Dài hạn: trẻ trưởng thành tự lập, có trách nhiệm.', en: 'It is **time-consuming for busy parents** at first, but it helps **raise independent adults** in the long term.', ex: [
          { vi: 'Mặc dù cha mẹ bận rộn khó dành đủ thời gian, nỗ lực này rất đáng giá.', en: '**Although** busy parents struggle to find time, the effort is worthwhile.', pattern: 'although / even though + clause', meaning: 'mặc dù', level: 'basic' },
          { vi: 'Về lâu dài, những đứa trẻ này có khả năng trở thành người tự lập và có trách nhiệm.', en: 'In the long run, such children **are likely to become** independent, responsible adults.', pattern: 'be likely / unlikely to V', meaning: 'có khả năng / không có khả năng', level: 'mid' },
          { vi: 'Thói quen gia đình được truyền qua nhiều thế hệ, điều này lại định hình cả xã hội.', en: 'Family habits pass down through generations, **which in turn** shapes society as a whole.', pattern: '…, which in turn + V', meaning: 'điều này đến lượt nó lại …', level: 'adv' },
        ] },
      which: { vi: 'Cha mẹ ảnh hưởng sớm và sâu hơn trường học, nhưng cần trường học hỗ trợ.', en: "**Parents have an earlier and deeper influence than schools**, although they still need schools' support.", ex: [
          { vi: 'Cha mẹ ảnh hưởng sớm hơn và sâu hơn nhiều so với nhà trường.', en: 'Parents have a **far earlier and deeper** influence **than** schools.', pattern: 'far / much / considerably + comparative', meaning: 'hơn nhiều', level: 'mid' },
          { vi: 'Làm gương là cách dạy con hiệu quả nhất, bỏ xa la mắng hay cấm đoán.', en: 'Leading by example is **by far the most effective** way to teach children.', pattern: 'by far the most + adj', meaning: '… nhất, bỏ xa', level: 'adv' },
          { vi: 'Đã đến lúc gia đình và nhà trường ngừng đổ lỗi và cùng phối hợp.', en: '**It is high time** families and schools **stopped** blaming each other and worked together.', pattern: 'It is high time sb did sth', meaning: 'đã đến lúc ai đó phải làm gì', level: 'adv' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'dành thời gian làm gì', pattern: 'spend time doing sth', en: 'Parents should **spend more time reading** with their children.', vi: 'Cha mẹ nên dành nhiều thời gian đọc sách cùng con hơn.' },
      { level: 'mid', meaning: 'làm gương', pattern: 'set a good example', en: 'Parents who **set a good example** rarely need to give long lectures.', vi: 'Cha mẹ biết làm gương hiếm khi cần giảng giải dài dòng.' },
      { level: 'mid', meaning: 'đặt giới hạn cho', pattern: 'set limits on sth', en: "Parents should **set limits on** their children's screen time.", vi: 'Cha mẹ nên đặt giới hạn thời gian dùng màn hình cho con.' },
      { level: 'adv', meaning: 'chính … mà …', pattern: 'It is … that … (câu chẻ)', en: "**It is** parents, not teachers, **that** have the greatest influence on a child's character.", vi: 'Chính cha mẹ, chứ không phải giáo viên, có ảnh hưởng lớn nhất đến tính cách của trẻ.' },
      { level: 'adv', meaning: 'gieo, thấm nhuần điều gì cho ai', pattern: 'instil sth in sb', en: 'Families should **instil a sense of responsibility in** children from an early age.', vi: 'Gia đình nên gieo ý thức trách nhiệm cho trẻ từ nhỏ.' },
    ],
    chain: { vi: 'Cha mẹ giới hạn thời gian dùng điện thoại của con → trẻ vận động và đọc sách nhiều hơn → sức khỏe và khả năng tập trung tốt hơn.', en: "Parents limit their children's phone time → children exercise and read more → their health and concentration improve." },
    sample: { vi: 'Có thể nói cha mẹ là những người có ảnh hưởng lớn nhất trong cuộc đời một đứa trẻ, vì trẻ thường bắt chước những gì chúng thấy ở nhà. Nếu cha mẹ hạn chế thời gian dùng thiết bị của chính mình và đặt ra quy tắc rõ ràng cho con, trẻ sẽ dễ dành thời gian đọc sách hoặc chơi ngoài trời hơn. Điều này cải thiện cả sức khỏe thể chất lẫn khả năng tập trung ở trường của các em.', en: "Parents are arguably the most influential people in a child's life, since children tend to copy what they see at home. If parents limit their own screen time and set clear rules for their children, young people are more likely to spend time reading or playing outside. This would improve both their physical health and their ability to concentrate at school." },
  },
  'dir.business': {
    question: { vi: 'Doanh nghiệp có thể làm gì?', en: 'What can businesses and employers do?' },
    ideas: [
      { vi: 'Đào tạo và nâng cao kỹ năng cho nhân viên.', en: '**Provide staff training** and upskilling.' },
      { vi: 'Cải thiện môi trường làm việc.', en: '**Improve working conditions**.' },
      { vi: 'Áp dụng công nghệ để tăng năng suất.', en: '**Adopt technology** to **boost productivity**.' },
      { vi: 'Bảo vệ quyền lợi người lao động.', en: "**Protect workers' rights**." },
      { vi: 'Thực hiện trách nhiệm xã hội.', en: 'Practise **corporate social responsibility**.' },
      { vi: 'Giảm chất thải và ô nhiễm trong sản xuất.', en: '**Cut waste and pollution** in production.' },
    ],
    six: {
      who: { vi: 'Doanh nghiệp, nhà tuyển dụng, tập đoàn.', en: '**Companies**, **employers** and **corporations**.', ex: [
          { vi: 'Các tập đoàn đa quốc gia đóng vai trò lớn vì hoạt động trên quy mô toàn cầu.', en: 'Multinational corporations **play a major role in** this because they operate globally.', pattern: 'play an important role in sth', meaning: 'đóng vai trò quan trọng trong', level: 'basic' },
          { vi: 'Doanh nghiệp vừa và nhỏ đóng góp phần lớn việc làm cho nền kinh tế.', en: 'Small and medium-sized enterprises **make a major contribution to** employment.', pattern: 'make a contribution to sth', meaning: 'đóng góp cho', level: 'mid' },
          { vi: 'Nhà tuyển dụng chịu trách nhiệm về điều kiện làm việc của nhân viên.', en: "Employers **take responsibility for** their staff's working conditions.", pattern: 'take responsibility for sth', meaning: 'chịu trách nhiệm về', level: 'mid' },
        ] },
      why: { vi: 'Doanh nghiệp tạo ra phần lớn sản phẩm, việc làm và cũng gây nhiều ô nhiễm.', en: 'Businesses produce most goods and jobs, so they are a **major source of jobs and pollution**.', ex: [
          { vi: 'Tiền, công nghệ và chuyên môn giúp doanh nghiệp có khả năng tạo ra thay đổi lớn.', en: 'Money, technology and expertise **enable businesses to make** large-scale changes.', pattern: 'enable sb to do sth', meaning: 'giúp ai có khả năng làm gì', level: 'mid' },
          { vi: 'Phần lớn ô nhiễm công nghiệp là do hoạt động sản xuất.', en: 'Much industrial pollution **is largely attributable to** manufacturing.', pattern: 'be largely attributable to sth', meaning: 'phần lớn là do', level: 'adv' },
          { vi: 'Lợi nhuận phụ thuộc vào nhân viên khỏe mạnh, điều này lại cho doanh nghiệp lý do để chăm lo cho họ.', en: 'Profits depend on healthy staff, **which in turn** gives firms a reason to look after them.', pattern: '…, which in turn + V', meaning: 'điều này đến lượt nó lại …', level: 'adv' },
        ] },
      what: { vi: 'Ảnh hưởng tới người lao động, khách hàng và môi trường.', en: 'Their decisions **affect employees, customers and the environment**.', ex: [
          { vi: 'Doanh nghiệp không những tạo việc làm mà còn thúc đẩy kinh tế.', en: 'Businesses **not only** create jobs **but also** boost the economy.', pattern: 'not only … but (also) …', meaning: 'không những … mà còn …', level: 'mid' },
          { vi: 'Sản phẩm xanh giúp người tiêu dùng giảm tác hại đến môi trường.', en: 'Green products **help consumers reduce** their environmental footprint.', pattern: 'help sb (to) do sth', meaning: 'giúp ai làm gì', level: 'basic' },
          { vi: 'Chạy theo lợi nhuận có thể đe dọa nghiêm trọng người lao động và môi trường.', en: 'Chasing profit can **pose a serious threat to** workers and the environment.', pattern: 'pose a (serious) threat to sth', meaning: 'đe dọa (nghiêm trọng) đến', level: 'adv' },
        ] },
      how: { vi: 'Đào tạo nhân viên, cải thiện môi trường làm việc, công nghệ sạch, trách nhiệm xã hội.', en: 'They can **provide training**, **adopt green technology** and follow **corporate social responsibility**.', ex: [
          { vi: 'Doanh nghiệp nên trang bị cho nhân viên kỹ năng mới.', en: 'Companies should **equip their staff with** new skills.', pattern: 'equip sb with sth', meaning: 'trang bị cho ai cái gì', level: 'mid' },
          { vi: 'Giờ làm linh hoạt cho phép nhân viên cân bằng công việc và gia đình.', en: 'Flexible hours **allow employees to balance** work and family life.', pattern: 'allow sb to do sth', meaning: 'cho phép ai làm gì', level: 'basic' },
          { vi: 'Doanh nghiệp cần áp dụng biện pháp để giảm rác thải trong sản xuất.', en: 'Firms must **take measures to cut** waste in production.', pattern: 'take measures / steps to V', meaning: 'áp dụng biện pháp để', level: 'mid' },
        ] },
      when: { vi: 'Ngắn hạn: tăng chi phí, giảm lợi nhuận. Dài hạn: nhân viên gắn bó, uy tín thương hiệu tăng.', en: 'These steps **raise costs initially** but **improve reputation and staff loyalty** over time.', ex: [
          { vi: 'Dù chi phí tăng trước mắt, uy tín thương hiệu sẽ tăng về lâu dài.', en: '**Despite** higher costs in the short term, brand reputation grows in the long run.', pattern: 'despite / in spite of + noun / V-ing', meaning: 'mặc dù', level: 'mid' },
          { vi: 'Công ty đối xử tốt với nhân viên có khả năng giữ chân người giỏi.', en: 'Companies that treat staff well **are likely to keep** their best people.', pattern: 'be likely / unlikely to V', meaning: 'có khả năng / không có khả năng', level: 'mid' },
          { vi: 'Nhân viên gắn bó giúp công ty tiết kiệm chi phí tuyển dụng.', en: 'Loyal staff **help companies save** on recruitment costs.', pattern: 'help sb (to) do sth', meaning: 'giúp ai làm gì', level: 'basic' },
        ] },
      which: { vi: 'Doanh nghiệp thường chỉ thay đổi khi có lợi ích hoặc bị luật bắt buộc, nên cần kết hợp với chính phủ.', en: '**Companies act mainly when it is profitable or required by law**, so they should work together with the government.', ex: [
          { vi: 'Doanh nghiệp hiếm khi tự thay đổi nếu không có lợi hoặc không bị luật buộc.', en: '**Rarely do** companies **change** unless it is profitable or required by law.', pattern: 'Rarely / Seldom + trợ động từ + S + V', meaning: 'hiếm khi', level: 'adv' },
          { vi: 'Ưu đãi thuế khuyến khích doanh nghiệp chuyển sang sản xuất xanh hiệu quả hơn phạt tiền.', en: 'Tax incentives **encourage firms to go** green more effectively than fines alone.', pattern: 'encourage sb to do sth', meaning: 'khuyến khích ai làm gì', level: 'basic' },
          { vi: 'Chỉ bằng cách hợp tác, khu vực công và tư mới đạt được kết quả tốt nhất.', en: '**Only by working** together **can** the public and private sectors **achieve** the best results.', pattern: 'Only by V-ing can S + V', meaning: 'chỉ bằng cách … thì mới …', level: 'adv' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'mang lại cho ai cái gì', pattern: 'offer sb sth', en: 'Many companies now **offer employees** flexible working hours.', vi: 'Nhiều công ty giờ cho nhân viên giờ làm linh hoạt.' },
      { level: 'mid', meaning: 'đầu tư vào', pattern: 'invest in sth', en: 'Firms that **invest in** staff training see higher productivity.', vi: 'Các công ty đầu tư vào đào tạo nhân viên có năng suất cao hơn.' },
      { level: 'mid', meaning: 'bị buộc chịu trách nhiệm về', pattern: 'be held accountable for sth', en: 'Corporations should **be held accountable for** the pollution they cause.', vi: 'Các tập đoàn nên bị buộc chịu trách nhiệm về ô nhiễm họ gây ra.' },
      { level: 'adv', meaning: 'đánh đổi bằng', pattern: 'at the expense of sth', en: "Some firms pursue profit **at the expense of** their workers' wellbeing.", vi: 'Một số công ty chạy theo lợi nhuận bằng cách đánh đổi sức khỏe của người lao động.' },
      { level: 'adv', meaning: 'có lợi nhất cho ai khi …', pattern: "It is in sb's (best) interest to V", en: "**It is in companies' best interest to treat** their staff well.", vi: 'Đối xử tốt với nhân viên là có lợi nhất cho chính công ty.' },
    ],
    chain: { vi: 'Công ty cho nhân viên làm việc linh hoạt → nhân viên ít căng thẳng → năng suất tăng, ít nghỉ việc → công ty tiết kiệm chi phí tuyển dụng.', en: 'A company offers flexible working hours → staff feel less stressed → productivity rises and fewer people quit → the company saves on recruitment.' },
    sample: { vi: 'Nhà tuyển dụng cũng được lợi khi quan tâm đến nhân viên. Chẳng hạn, các công ty cho phép giờ làm linh hoạt thường thấy nhân viên ít căng thẳng và làm việc hiệu quả hơn. Khi ít người nghỉ việc, công ty tiết kiệm được chi phí tuyển dụng và đào tạo người mới, nên chính sách này có lợi cho cả hai bên.', en: 'Employers also benefit from looking after their staff. For instance, companies that offer flexible working hours often find that their employees are less stressed and more productive. As fewer people leave their jobs, the company saves money on recruiting and training new staff, so this policy is good for both sides.' },
  },
  'dir.health': {
    question: { vi: 'Vấn đề này ảnh hưởng tới sức khỏe thế nào?', en: 'How does the issue affect health?' },
    ideas: [
      { vi: 'Cải thiện sức khỏe thể chất.', en: '**Improve physical health**.' },
      { vi: 'Bảo vệ sức khỏe tinh thần.', en: '**Protect mental wellbeing**.' },
      { vi: 'Giảm nguy cơ mắc bệnh.', en: '**Reduce the risk of disease**.' },
      { vi: 'Giảm chi phí điều trị lâu dài.', en: '**Cut long-term medical costs**.' },
      { vi: 'Nâng cao chất lượng cuộc sống.', en: '**Improve quality of life**.' },
      { vi: 'Giảm áp lực cho hệ thống y tế.', en: '**Ease pressure on the healthcare system**.' },
    ],
    six: {
      who: { vi: 'Người dân, bệnh nhân, bác sĩ, hệ thống y tế.', en: '**The public**, **patients**, doctors and **the healthcare system**.', ex: [
          { vi: 'Các vấn đề sức khỏe tác động mạnh nhất đến trẻ em và người già.', en: 'Health problems **have the greatest impact on** children and the elderly.', pattern: 'have a positive / negative impact on sth', meaning: 'có tác động tích cực / tiêu cực đến', level: 'mid' },
          { vi: 'Bác sĩ và y tá đóng vai trò then chốt trong việc phòng bệnh.', en: 'Doctors and nurses **play a vital role in** preventing disease.', pattern: 'play an important role in sth', meaning: 'đóng vai trò quan trọng trong', level: 'basic' },
          { vi: 'Hệ thống y tế phải đáp ứng nhu cầu chăm sóc ngày càng tăng.', en: 'The healthcare system must **meet the growing demand for** medical care.', pattern: 'meet the demand for sth', meaning: 'đáp ứng nhu cầu về', level: 'mid' },
        ] },
      why: { vi: 'Lối sống ít vận động, ăn uống thiếu lành mạnh, áp lực công việc, ô nhiễm.', en: 'Health problems come from a **sedentary lifestyle**, an **unhealthy diet**, work **stress** and **pollution**.', ex: [
          { vi: 'Nhiều bệnh bắt nguồn từ lối sống ít vận động.', en: 'Many illnesses **stem from** a sedentary lifestyle.', pattern: 'be caused by / stem from sth', meaning: 'do … gây ra / bắt nguồn từ', level: 'mid' },
          { vi: 'Đồ ăn nhanh rẻ và tiện, vì vậy nhiều gia đình ăn thường xuyên.', en: 'Fast food is cheap and convenient, **so** many families eat it regularly.', pattern: 'so + clause / As a result, …', meaning: 'vì vậy, do đó', level: 'basic' },
          { vi: 'Căng thẳng công việc cộng với ô nhiễm không khí khiến sức khỏe ngày càng kém.', en: "Work stress, **coupled with** air pollution, **means that** people's health is getting worse.", pattern: 'A, coupled with B, means that …', meaning: 'A cộng với B khiến cho …', level: 'adv' },
        ] },
      what: { vi: 'Lợi: khỏe mạnh, sống lâu. Hại: bệnh tật, trầm cảm, mất khả năng lao động.', en: 'Good habits **improve wellbeing**; bad ones **lead to obesity, depression and lost productivity**.', ex: [
          { vi: 'Lối sống lành mạnh giúp người dân sống lâu hơn và làm việc hiệu quả hơn.', en: 'A healthy lifestyle **enables people to live** longer and work more productively.', pattern: 'enable sb to do sth', meaning: 'giúp ai có khả năng làm gì', level: 'mid' },
          { vi: 'Ăn uống kém có thể dẫn đến béo phì, tiểu đường và bệnh tim.', en: 'A poor diet can **lead to** obesity, diabetes and heart disease.', pattern: 'lead to sth', meaning: 'dẫn đến', level: 'basic' },
          { vi: 'Bệnh tật có tác động tiêu cực đến năng suất lao động.', en: 'Illness **has a negative impact on** productivity.', pattern: 'have a positive / negative impact on sth', meaning: 'có tác động tích cực / tiêu cực đến', level: 'mid' },
        ] },
      how: { vi: 'Tập thể dục, ăn uống lành mạnh, khám định kỳ, hỗ trợ sức khỏe tinh thần.', en: 'People need **regular exercise**, **a balanced diet**, **regular check-ups** and **mental health support**.', ex: [
          { vi: 'Một cách để phòng bệnh là tập thể dục đều đặn và ăn uống cân bằng.', en: '**One way to prevent** disease **is to** exercise regularly and eat a balanced diet.', pattern: 'One way to V is to V', meaning: 'một cách để … là …', level: 'basic' },
          { vi: 'Điều thiết yếu là ai cũng được khám sức khỏe định kỳ.', en: '**It is essential that** everyone **have** regular check-ups.', pattern: 'It is essential / vital that sb (should) do sth', meaning: 'điều thiết yếu là ai đó làm gì', level: 'mid' },
          { vi: 'Trường học và nơi làm việc nên hỗ trợ sức khỏe tinh thần cho mọi người.', en: 'Schools and workplaces should **provide people with** mental health support.', pattern: 'provide sb with sth', meaning: 'cung cấp cho ai cái gì', level: 'mid' },
        ] },
      when: { vi: 'Ngắn hạn: cảm thấy khỏe, ít stress. Dài hạn: giảm bệnh mãn tính, giảm chi phí y tế.', en: 'People **feel better immediately**, and healthy habits **reduce chronic diseases in the long run**.', ex: [
          { vi: 'Trước mắt, vận động giúp mọi người có thêm năng lượng và bớt căng thẳng.', en: 'In the short term, exercise **helps people feel** more energetic and less stressed.', pattern: 'help sb (to) do sth', meaning: 'giúp ai làm gì', level: 'basic' },
          { vi: 'Về lâu dài, bệnh mãn tính được dự đoán sẽ giảm.', en: 'In the long run, chronic diseases **are expected to decline**.', pattern: 'be expected to V', meaning: 'được dự đoán sẽ', level: 'mid' },
          { vi: 'Dân số khỏe hơn giảm áp lực cho bệnh viện, điều này lại giúp tiết kiệm ngân sách.', en: 'A healthier population eases pressure on hospitals, **which in turn** saves public money.', pattern: '…, which in turn + V', meaning: 'điều này đến lượt nó lại …', level: 'adv' },
        ] },
      which: { vi: 'Phòng bệnh rẻ và hiệu quả hơn chữa bệnh.', en: '**Prevention is cheaper and more effective than cure**.', ex: [
          { vi: 'Phòng bệnh rẻ hơn nhiều so với chữa bệnh.', en: 'Prevention is **far cheaper than** cure.', pattern: 'far / much / considerably + comparative', meaning: 'hơn nhiều', level: 'mid' },
          { vi: 'So với việc chỉ dựa vào thuốc, thay đổi lối sống bền vững hơn nhiều.', en: '**Compared with** relying on medicine, lifestyle changes last much longer.', pattern: 'compared with / in comparison with sth', meaning: 'so với', level: 'mid' },
          { vi: 'Không còn nghi ngờ gì rằng sức khỏe tinh thần quan trọng ngang sức khỏe thể chất.', en: '**There is no doubt that** mental health matters as much as physical health.', pattern: 'There is no doubt that …', meaning: 'không còn nghi ngờ gì rằng', level: 'mid' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'tốt / có hại cho', pattern: 'be good / bad for sth', en: 'Fast food **is bad for** your heart.', vi: 'Đồ ăn nhanh có hại cho tim.' },
      { level: 'mid', meaning: 'giảm nguy cơ', pattern: 'reduce the risk of sth', en: 'Regular exercise **reduces the risk of** heart disease.', vi: 'Tập thể dục đều đặn giảm nguy cơ mắc bệnh tim.' },
      { level: 'mid', meaning: 'có lối sống lành mạnh / ít vận động', pattern: 'lead a healthy / sedentary lifestyle', en: 'Office workers often **lead a sedentary lifestyle**.', vi: 'Nhân viên văn phòng thường có lối sống ít vận động.' },
      { level: 'adv', meaning: 'gây áp lực lên', pattern: 'put a strain on sth', en: 'An ageing population **puts a strain on** the healthcare system.', vi: 'Dân số già gây áp lực lên hệ thống y tế.' },
      { level: 'adv', meaning: 'càng … càng …', pattern: 'The + comparative …, the + comparative …', en: '**The earlier** a disease is detected, **the cheaper** it is to treat.', vi: 'Bệnh được phát hiện càng sớm thì chữa càng rẻ.' },
    ],
    chain: { vi: 'Người dân vận động nhiều hơn → giảm bệnh tim mạch, tiểu đường → ít phải nhập viện → giảm áp lực cho bệnh viện và ngân sách y tế.', en: 'People exercise more → heart disease and diabetes decline → fewer hospital admissions → less pressure on hospitals and the health budget.' },
    sample: { vi: 'Xét về sức khỏe, thay đổi này mang lại rất nhiều lợi ích. Vận động thể chất thường xuyên làm giảm nguy cơ mắc các bệnh nghiêm trọng như bệnh tim và tiểu đường. Nếu ít người mắc những bệnh này hơn, bệnh viện sẽ bớt quá tải và chính phủ có thể chi ít hơn cho việc điều trị, vì phòng bệnh rẻ hơn nhiều so với chữa bệnh.', en: 'From a health perspective, this change would be highly beneficial. Regular physical activity reduces the risk of serious illnesses such as heart disease and diabetes. If fewer people developed these conditions, hospitals would be less overcrowded and the government could spend less on treatment, since preventing a disease is far cheaper than curing it.' },
  },
  'dir.economy': {
    question: { vi: 'Vấn đề này ảnh hưởng tới kinh tế và tiền bạc thế nào?', en: 'How does the issue affect the economy and money?' },
    ideas: [
      { vi: 'Tạo việc làm.', en: '**Create jobs**.' },
      { vi: 'Tăng thu nhập và mức sống.', en: '**Raise incomes and living standards**.' },
      { vi: 'Giảm chi phí sản xuất.', en: '**Lower production costs**.' },
      { vi: 'Tăng năng suất lao động.', en: '**Boost labour productivity**.' },
      { vi: 'Thu hút đầu tư.', en: '**Attract investment**.' },
      { vi: 'Giảm gánh nặng tài chính cho người dân hoặc chính phủ.', en: '**Ease the financial burden** on citizens or the government.' },
    ],
    six: {
      who: { vi: 'Người lao động, doanh nghiệp, nhà đầu tư, nhà nước.', en: '**Workers**, **businesses**, **investors** and **the state**.', ex: [
          { vi: 'Biến động kinh tế tác động trực tiếp đến người lao động và hộ gia đình.', en: 'Economic changes **have a direct impact on** workers and households.', pattern: 'have a positive / negative impact on sth', meaning: 'có tác động tích cực / tiêu cực đến', level: 'mid' },
          { vi: 'Doanh nghiệp và nhà đầu tư đóng góp lớn cho tăng trưởng.', en: 'Businesses and investors **make a major contribution to** growth.', pattern: 'make a contribution to sth', meaning: 'đóng góp cho', level: 'mid' },
          { vi: 'Nhà nước chịu trách nhiệm quản lý ngân sách quốc gia.', en: 'The state **takes responsibility for** managing the national budget.', pattern: 'take responsibility for sth', meaning: 'chịu trách nhiệm về', level: 'mid' },
        ] },
      why: { vi: 'Chi phí sinh hoạt tăng, thất nghiệp, cạnh tranh toàn cầu.', en: 'Economic pressure comes from **rising living costs**, **unemployment** and **global competition**.', ex: [
          { vi: 'Chi phí sinh hoạt tăng nhanh hơn thu nhập, vì vậy nhiều gia đình gặp khó khăn.', en: 'Living costs are rising faster than incomes, **so** many families are struggling.', pattern: 'so + clause / As a result, …', meaning: 'vì vậy, do đó', level: 'basic' },
          { vi: 'Nhiều việc làm biến mất do tự động hóa và cạnh tranh toàn cầu.', en: 'Many jobs are disappearing **due to** automation and global competition.', pattern: 'due to / owing to + noun', meaning: 'do, bởi', level: 'mid' },
          { vi: 'Thiếu lao động có kỹ năng cản trở tăng trưởng kinh tế.', en: 'A shortage of skilled workers **hinders** economic growth.', pattern: 'hinder / impede sth', meaning: 'cản trở điều gì', level: 'adv' },
        ] },
      what: { vi: 'Lợi: việc làm, thu nhập, đầu tư. Hại: tốn ngân sách, chênh lệch giàu nghèo.', en: 'It can **create jobs** and **boost income**, but it can also be **costly** and **widen the wealth gap**.', ex: [
          { vi: 'Tăng trưởng không những tạo việc làm mà còn tăng thu nhập và nguồn thu thuế.', en: 'Growth **not only** creates jobs **but also** raises incomes and tax revenue.', pattern: 'not only … but (also) …', meaning: 'không những … mà còn …', level: 'mid' },
          { vi: 'Tăng trưởng không đồng đều có thể làm nảy sinh khoảng cách giàu nghèo lớn hơn.', en: 'Uneven growth can **give rise to** a wider gap between rich and poor.', pattern: 'give rise to sth', meaning: 'làm nảy sinh', level: 'adv' },
          { vi: 'Một ngành phát triển kéo theo các ngành khác, điều này lại tạo thêm việc làm.', en: 'Growth in one industry stimulates others, **which in turn** creates even more jobs.', pattern: '…, which in turn + V', meaning: 'điều này đến lượt nó lại …', level: 'adv' },
        ] },
      how: { vi: 'Đầu tư vào ngành mới, ưu đãi thuế, đào tạo lao động, thu hút vốn nước ngoài.', en: 'Governments can **invest in new industries**, **offer tax incentives**, train workers and **attract foreign investment**.', ex: [
          { vi: 'Chính phủ nên đầu tư vào hạ tầng và công nghệ mới.', en: 'The government **should invest** in infrastructure and new technology.', pattern: 'should / ought to + V', meaning: 'nên', level: 'basic' },
          { vi: 'Ưu đãi thuế khuyến khích doanh nghiệp nước ngoài đầu tư vào trong nước.', en: 'Tax incentives **encourage foreign companies to invest** in the country.', pattern: 'encourage sb to do sth', meaning: 'khuyến khích ai làm gì', level: 'basic' },
          { vi: 'Chương trình đào tạo lại giúp người mất việc có thể tìm việc mới.', en: 'Retraining programmes **enable unemployed workers to find** new jobs.', pattern: 'enable sb to do sth', meaning: 'giúp ai có khả năng làm gì', level: 'mid' },
        ] },
      when: { vi: 'Ngắn hạn: chi phí đầu tư lớn. Dài hạn: kinh tế tăng trưởng, mức sống cao hơn.', en: 'It **requires heavy investment** at first but **stimulates long-term growth** and higher living standards.', ex: [
          { vi: 'Trước mắt, đầu tư lớn có khả năng làm tăng nợ công.', en: 'In the short term, heavy investment **is likely to** increase public debt.', pattern: 'be likely / unlikely to V', meaning: 'có khả năng / không có khả năng', level: 'mid' },
          { vi: 'Về lâu dài, kinh tế được dự đoán sẽ tăng trưởng và mức sống cao hơn.', en: 'In the long run, the economy **is expected to grow** and living standards to rise.', pattern: 'be expected to V', meaning: 'được dự đoán sẽ', level: 'mid' },
          { vi: 'Chỉ bằng cách đầu tư vào con người, một quốc gia mới tăng trưởng bền vững.', en: '**Only by investing** in people **can** a country **achieve** sustainable growth.', pattern: 'Only by V-ing can S + V', meaning: 'chỉ bằng cách … thì mới …', level: 'adv' },
        ] },
      which: { vi: 'Khoản chi ban đầu đáng giá nếu mang lại lợi ích kinh tế lâu dài.', en: '**The initial cost is justified by long-term economic gains**.', ex: [
          { vi: 'Tăng trưởng bền vững quan trọng hơn nhiều so với lợi nhuận ngắn hạn.', en: 'Sustainable growth is **far more important than** short-term profit.', pattern: 'far / much / considerably + comparative', meaning: 'hơn nhiều', level: 'mid' },
          { vi: 'Tạo việc làm tốt hơn trợ cấp kéo dài vì nó cho phép người dân tự nuôi sống bản thân.', en: 'Creating jobs beats long-term handouts, as it **allows people to support** themselves.', pattern: 'allow sb to do sth', meaning: 'cho phép ai làm gì', level: 'basic' },
          { vi: 'Theo tôi, lợi ích lâu dài lớn hơn chi phí ban đầu.', en: 'In my view, **the long-term gains outweigh** the initial costs.', pattern: 'the advantages outweigh the disadvantages', meaning: 'lợi nhiều hơn hại', level: 'mid' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'tạo việc làm', pattern: 'create jobs', en: 'New factories **create jobs** for local people.', vi: 'Nhà máy mới tạo việc làm cho người dân địa phương.' },
      { level: 'mid', meaning: 'thúc đẩy kinh tế', pattern: 'boost the economy', en: 'Tourism can **boost the local economy** significantly.', vi: 'Du lịch có thể thúc đẩy kinh tế địa phương đáng kể.' },
      { level: 'mid', meaning: 'sự tăng mạnh của', pattern: 'a dramatic increase in sth', en: 'There has been **a dramatic increase in** the cost of living.', vi: 'Chi phí sinh hoạt đã tăng mạnh.' },
      { level: 'adv', meaning: 'nới rộng / thu hẹp khoảng cách giàu nghèo', pattern: 'widen / narrow the gap between rich and poor', en: 'Automation may **widen the gap between rich and poor**.', vi: 'Tự động hóa có thể nới rộng khoảng cách giàu nghèo.' },
      { level: 'adv', meaning: 'là xứng đáng nhờ', pattern: 'be justified by sth', en: 'The high initial cost of the metro **is justified by** its long-term economic benefits.', vi: 'Chi phí ban đầu cao của tàu điện ngầm là xứng đáng nhờ lợi ích kinh tế lâu dài.' },
    ],
    chain: { vi: 'Phát triển du lịch → mở thêm khách sạn, nhà hàng → tạo việc làm cho người dân địa phương → thu nhập tăng, kinh tế vùng phát triển.', en: 'Tourism grows → more hotels and restaurants open → local people get jobs → incomes rise and the regional economy develops.' },
    sample: { vi: 'Về mặt kinh tế, du lịch mang lại những lợi ích đáng kể cho cộng đồng địa phương. Sự phát triển của khách sạn, nhà hàng và dịch vụ vận tải tạo ra hàng nghìn việc làm, đặc biệt cho người trẻ, những người lẽ ra có thể phải lên thành phố lớn. Điều này làm tăng thu nhập hộ gia đình và giúp chính quyền địa phương thu thêm thuế, khoản tiền này sau đó có thể dùng để xây trường học và đường sá.', en: 'Economically, tourism brings considerable advantages to local communities. The growth of hotels, restaurants and transport services creates thousands of jobs, particularly for young people who might otherwise move to big cities. This increases household income and allows the local government to collect more taxes, which can then be spent on schools and roads.' },
  },
  'dir.society': {
    question: { vi: 'Vấn đề này ảnh hưởng tới cộng đồng thế nào?', en: 'How does the issue affect society and the community?' },
    ideas: [
      { vi: 'Tăng cường sự gắn kết cộng đồng.', en: '**Strengthen community ties**.' },
      { vi: 'Giảm bất bình đẳng.', en: '**Reduce inequality**.' },
      { vi: 'Hỗ trợ nhóm yếu thế.', en: '**Support vulnerable groups**.' },
      { vi: 'Nâng cao ý thức cộng đồng.', en: '**Foster civic awareness**.' },
      { vi: 'Xây dựng môi trường sống an toàn.', en: '**Create safer neighbourhoods**.' },
      { vi: 'Thúc đẩy sự công bằng và hòa nhập xã hội.', en: '**Promote fairness and social inclusion**.' },
    ],
    six: {
      who: { vi: 'Cộng đồng, người già, người nghèo, người khuyết tật, người nhập cư.', en: '**Local communities** and **vulnerable groups** such as **the elderly**, the poor, disabled people and **minorities**.', ex: [
          { vi: 'Các vấn đề xã hội tác động mạnh nhất đến người già, người khuyết tật và người nghèo.', en: 'Social problems **have the greatest impact on** the elderly, the disabled and the poor.', pattern: 'have a positive / negative impact on sth', meaning: 'có tác động tích cực / tiêu cực đến', level: 'mid' },
          { vi: 'Người nhập cư đóng góp đáng kể cho xã hội nhưng thường bị gạt ra lề.', en: 'Immigrants **make a significant contribution to** society, yet they are often marginalised.', pattern: 'make a contribution to sth', meaning: 'đóng góp cho', level: 'mid' },
          { vi: 'Cư dân khu phố đóng vai trò quan trọng trong việc giữ an toàn.', en: 'Local residents **play an important role in** keeping neighbourhoods safe.', pattern: 'play an important role in sth', meaning: 'đóng vai trò quan trọng trong', level: 'basic' },
        ] },
      why: { vi: 'Bất bình đẳng, đô thị hóa làm con người xa cách, thiếu dịch vụ công.', en: 'Social problems grow from **inequality**, **urbanisation** that isolates people and a **lack of public services**.', ex: [
          { vi: 'Đô thị hóa nhanh đã làm nảy sinh lối sống mà hàng xóm hầu như không quen nhau.', en: 'Rapid urbanisation has **given rise to** a lifestyle in which neighbours barely know each other.', pattern: 'give rise to sth', meaning: 'làm nảy sinh', level: 'adv' },
          { vi: 'Khoảng cách giàu nghèo ngày càng lớn đã trở thành mối lo ngại.', en: 'The widening gap between rich and poor has become **a growing concern**.', pattern: 'a pressing issue / a growing concern', meaning: 'vấn đề cấp bách / mối lo ngại ngày càng lớn', level: 'mid' },
          { vi: 'Thiếu không gian công cộng khiến người dân không có chỗ gặp gỡ nhau.', en: 'A lack of public spaces **stops residents from meeting** one another.', pattern: 'stop sb (from) doing sth', meaning: 'ngăn ai làm gì', level: 'basic' },
        ] },
      what: { vi: 'Lợi: gắn kết, an toàn, công bằng. Hại: cô lập, tội phạm, mâu thuẫn xã hội.', en: 'A connected society is safer and fairer, while a divided one can **lead to isolation, crime and social tension**.', ex: [
          { vi: 'Một cộng đồng gắn kết khiến người dân cảm thấy an toàn hơn.', en: 'A close-knit community **makes people feel** safer.', pattern: 'make sb do sth', meaning: 'bắt / khiến ai làm gì', level: 'basic' },
          { vi: 'Sự cô lập có thể dẫn đến cô đơn, tội phạm và mâu thuẫn xã hội.', en: 'Isolation can **lead to** loneliness, crime and social tension.', pattern: 'lead to sth', meaning: 'dẫn đến', level: 'basic' },
          { vi: 'Nghèo đói tước đi của nhóm yếu thế cơ hội học tập và việc làm.', en: 'Poverty **deprives vulnerable groups of** education and job opportunities.', pattern: 'deprive sb of sth', meaning: 'tước đi của ai cái gì', level: 'adv' },
        ] },
      how: { vi: 'Xây không gian công cộng, hỗ trợ nhóm yếu thế, tình nguyện, hoạt động cộng đồng.', en: 'Authorities can **build community centres** and **support disadvantaged groups**, and residents can **volunteer**.', ex: [
          { vi: 'Chính quyền địa phương nên xây thêm công viên, thư viện và trung tâm cộng đồng.', en: 'Local authorities **should build** more parks, libraries and community centres.', pattern: 'should / ought to + V', meaning: 'nên', level: 'basic' },
          { vi: 'Hỗ trợ nhà ở và việc làm giúp nhóm yếu thế làm lại cuộc sống.', en: 'Housing and job support **help disadvantaged groups rebuild** their lives.', pattern: 'help sb (to) do sth', meaning: 'giúp ai làm gì', level: 'basic' },
          { vi: 'Các chương trình tình nguyện khuyến khích người trẻ giúp đỡ cộng đồng.', en: 'Volunteer programmes **encourage young people to help** their community.', pattern: 'encourage sb to do sth', meaning: 'khuyến khích ai làm gì', level: 'basic' },
        ] },
      when: { vi: 'Ngắn hạn: cần thời gian để mọi người tham gia. Dài hạn: xã hội hòa nhập, ít tội phạm.', en: 'Such projects are **slow to take effect**, but they **create a more inclusive society** with less crime.', ex: [
          { vi: 'Mặc dù cần thời gian để người dân tham gia, kết quả rất đáng giá.', en: '**Although** it takes time for people to get involved, the results are worth it.', pattern: 'although / even though + clause', meaning: 'mặc dù', level: 'basic' },
          { vi: 'Về lâu dài, xã hội hòa nhập hơn và tội phạm có khả năng giảm.', en: 'In the long run, society becomes more inclusive and crime **is likely to fall**.', pattern: 'be likely / unlikely to V', meaning: 'có khả năng / không có khả năng', level: 'mid' },
          { vi: 'Người trẻ tham gia đời sống cộng đồng càng sớm, tinh thần cộng đồng càng bền chặt.', en: '**The earlier** young people join community life, **the stronger** their community spirit becomes.', pattern: 'The + comparative …, the + comparative …', meaning: 'càng … càng …', level: 'adv' },
        ] },
      which: { vi: 'Xã hội gắn kết giúp giảm nhiều vấn đề cùng lúc: cô đơn, tội phạm, bất bình đẳng.', en: 'A connected community **addresses several problems at the same time**: loneliness, crime and inequality.', ex: [
          { vi: 'Phòng ngừa cô lập rẻ hơn nhiều so với xử lý hậu quả xã hội.', en: 'Preventing isolation is **far cheaper than** dealing with its consequences.', pattern: 'far / much / considerably + comparative', meaning: 'hơn nhiều', level: 'mid' },
          { vi: 'Tạo cơ hội vượt trội hơn phát tiền đơn thuần.', en: 'Creating opportunities **is superior to** simply handing out money.', pattern: 'be superior / inferior to sth', meaning: 'vượt trội / kém hơn', level: 'adv' },
          { vi: 'Cộng đồng gắn kết giải quyết nhiều vấn đề cùng lúc; ví dụ tiêu biểu là các khu phố có trung tâm sinh hoạt chung.', en: 'A connected community solves several problems at once. **A case in point is** neighbourhoods with shared community centres.', pattern: 'A case in point is …', meaning: 'một ví dụ tiêu biểu là', level: 'adv' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'giúp người khó khăn', pattern: 'help people in need', en: 'Volunteers **help people in need** in their neighbourhood.', vi: 'Tình nguyện viên giúp người khó khăn trong khu phố.' },
      { level: 'mid', meaning: 'tăng cường gắn kết cộng đồng', pattern: 'strengthen community ties', en: 'Local festivals **strengthen community ties**.', vi: 'Lễ hội địa phương tăng cường gắn kết cộng đồng.' },
      { level: 'mid', meaning: 'được tiếp cận', pattern: 'have access to sth', en: 'Everyone should **have access to** clean water and healthcare.', vi: 'Ai cũng nên được tiếp cận nước sạch và dịch vụ y tế.' },
      { level: 'adv', meaning: 'nuôi dưỡng cảm giác, tinh thần', pattern: 'foster a sense of sth', en: 'Community centres **foster a sense of belonging** among residents.', vi: 'Trung tâm cộng đồng nuôi dưỡng cảm giác gắn bó của cư dân.' },
      { level: 'adv', meaning: 'nhóm yếu thế / bị gạt ra lề', pattern: 'vulnerable / marginalised groups', en: 'Social policies should protect **vulnerable groups** such as the elderly and the disabled.', vi: 'Chính sách xã hội nên bảo vệ nhóm yếu thế như người già và người khuyết tật.' },
    ],
    chain: { vi: 'Xây trung tâm cộng đồng → người dân gặp gỡ, tham gia hoạt động chung → người già bớt cô đơn, thanh thiếu niên ít sa vào tệ nạn → khu dân cư an toàn hơn.', en: 'A community centre is built → residents meet and join shared activities → older people feel less lonely and teenagers avoid antisocial behaviour → the neighbourhood becomes safer.' },
    sample: { vi: 'Một lợi ích khác liên quan đến đời sống cộng đồng. Các cơ sở công cộng như thư viện và trung tâm cộng đồng cho người dân ở mọi lứa tuổi một nơi để gặp gỡ và tham gia các hoạt động chung. Điều này giúp người già bớt cô đơn và giữ thanh thiếu niên tránh xa các hành vi tiêu cực, khiến khu dân cư an toàn và gắn kết hơn.', en: 'Another advantage relates to community life. Public facilities such as libraries and community centres give people of different ages a place to meet and take part in shared activities. This reduces loneliness among the elderly and keeps teenagers away from antisocial behaviour, making neighbourhoods safer and more united.' },
  },
  'dir.environment': {
    question: { vi: 'Vấn đề này ảnh hưởng tới môi trường thế nào?', en: 'How does the issue affect the environment?' },
    ideas: [
      { vi: 'Giảm ô nhiễm không khí và nguồn nước.', en: '**Reduce air and water pollution**.' },
      { vi: 'Bảo tồn tài nguyên thiên nhiên.', en: '**Conserve natural resources**.' },
      { vi: 'Giảm khí thải carbon.', en: '**Cut carbon emissions**.' },
      { vi: 'Tăng tái chế và sử dụng năng lượng sạch.', en: '**Promote recycling** and the use of **clean energy**.' },
      { vi: 'Bảo vệ đa dạng sinh học.', en: '**Protect biodiversity**.' },
      { vi: 'Hướng đến phát triển bền vững.', en: '**Achieve sustainable development**.' },
    ],
    six: {
      who: { vi: 'Chính phủ, nhà máy, người tiêu dùng, thế hệ tương lai.', en: '**Governments**, **factories**, **consumers** and **future generations**.', ex: [
          { vi: 'Nhà máy phải chịu trách nhiệm về lượng khí thải họ tạo ra.', en: 'Factories must **take responsibility for** the emissions they produce.', pattern: 'take responsibility for sth', meaning: 'chịu trách nhiệm về', level: 'mid' },
          { vi: 'Người tiêu dùng và người lái xe góp phần lớn vào ô nhiễm.', en: 'Consumers and drivers **make a large contribution to** pollution.', pattern: 'make a contribution to sth', meaning: 'đóng góp cho', level: 'mid' },
          { vi: 'Ô nhiễm hôm nay sẽ để lại hậu quả sâu rộng cho thế hệ tương lai.', en: "Today's pollution will **have far-reaching consequences for** future generations.", pattern: 'have far-reaching consequences for sth', meaning: 'có hậu quả sâu rộng đối với', level: 'adv' },
        ] },
      why: { vi: 'Công nghiệp hóa, phương tiện cá nhân, tiêu dùng quá mức, rác thải nhựa.', en: 'Environmental damage is caused by **industrialisation**, **private vehicles**, **overconsumption** and **plastic waste**.', ex: [
          { vi: 'Biến đổi khí hậu phần lớn là do đốt nhiên liệu hóa thạch.', en: 'Climate change **is largely attributable to** the burning of fossil fuels.', pattern: 'be largely attributable to sth', meaning: 'phần lớn là do', level: 'adv' },
          { vi: 'Lượng xe cá nhân tăng nhanh gây ra ô nhiễm không khí nghiêm trọng.', en: 'The rapid rise in private vehicles **results in** serious air pollution.', pattern: 'result in sth / result from sth', meaning: 'gây ra / bắt nguồn từ', level: 'mid' },
          { vi: 'Tiêu dùng quá mức và đồ nhựa dùng một lần đã trở thành vấn đề cấp bách.', en: 'Overconsumption and single-use plastics have become **a pressing issue**.', pattern: 'a pressing issue / a growing concern', meaning: 'vấn đề cấp bách / mối lo ngại ngày càng lớn', level: 'mid' },
        ] },
      what: { vi: 'Hại: ô nhiễm không khí và nước, biến đổi khí hậu, mất đa dạng sinh học.', en: 'The results are **air and water pollution**, **climate change** and **loss of biodiversity**.', ex: [
          { vi: 'Ô nhiễm không khí dẫn đến các bệnh hô hấp.', en: 'Air pollution **leads to** respiratory diseases.', pattern: 'lead to sth', meaning: 'dẫn đến', level: 'basic' },
          { vi: 'Biến đổi khí hậu đe dọa nghiêm trọng an ninh lương thực.', en: 'Climate change **poses a serious threat to** food security.', pattern: 'pose a (serious) threat to sth', meaning: 'đe dọa (nghiêm trọng) đến', level: 'adv' },
          { vi: 'Phá rừng tước đi môi trường sống của nhiều loài động vật.', en: 'Deforestation **deprives many species of** their natural habitats.', pattern: 'deprive sb of sth', meaning: 'tước đi của ai cái gì', level: 'adv' },
        ] },
      how: { vi: 'Năng lượng tái tạo, tái chế, giao thông công cộng, trồng rừng, hạn chế đồ nhựa.', en: 'Solutions include **renewable energy**, **recycling**, **public transport**, **reforestation** and less plastic.', ex: [
          { vi: 'Các nước nên chuyển sang năng lượng tái tạo.', en: 'Countries **should switch** to renewable energy.', pattern: 'should / ought to + V', meaning: 'nên', level: 'basic' },
          { vi: 'Giao thông công cộng tốt khuyến khích người dân để xe ở nhà.', en: 'Good public transport **encourages people to leave** their cars at home.', pattern: 'encourage sb to do sth', meaning: 'khuyến khích ai làm gì', level: 'basic' },
          { vi: 'Cấm túi nilon sẽ góp phần lớn vào việc giảm rác thải nhựa.', en: 'A ban on plastic bags would **go a long way towards reducing** plastic waste.', pattern: 'go a long way towards V-ing', meaning: 'góp phần lớn vào việc', level: 'adv' },
        ] },
      when: { vi: 'Ngắn hạn: tốn chi phí chuyển đổi. Dài hạn: phát triển bền vững, bảo vệ thế hệ sau.', en: 'It is a **costly transition** at first, but it leads to **sustainable development** and helps **protect future generations**.', ex: [
          { vi: 'Trước mắt, chi phí chuyển đổi cao có thể cản trở doanh nghiệp.', en: 'In the short term, high transition costs may **hinder** businesses.', pattern: 'hinder / impede sth', meaning: 'cản trở điều gì', level: 'adv' },
          { vi: 'Về lâu dài, năng lượng sạch được dự đoán sẽ rẻ hơn nhiên liệu hóa thạch.', en: 'In the long run, clean energy **is expected to become** cheaper than fossil fuels.', pattern: 'be expected to V', meaning: 'được dự đoán sẽ', level: 'mid' },
          { vi: 'Trừ khi hành động ngay, một số thiệt hại sẽ không thể đảo ngược.', en: '**Unless** action is taken now, some of the damage will be irreversible.', pattern: 'unless + clause', meaning: 'trừ khi', level: 'mid' },
        ] },
      which: { vi: 'Năng lượng sạch tốt hơn nhiên liệu hóa thạch vì không cạn kiệt và ít khí thải.', en: 'Clean energy beats fossil fuels because **renewable sources are inexhaustible and cleaner**.', ex: [
          { vi: 'Về lâu dài, năng lượng sạch vượt trội hơn nhiên liệu hóa thạch.', en: 'In the long run, clean energy **is superior to** fossil fuels.', pattern: 'be superior / inferior to sth', meaning: 'vượt trội / kém hơn', level: 'adv' },
          { vi: 'Ngăn ô nhiễm rẻ hơn nhiều so với làm sạch sau đó.', en: 'Preventing pollution is **far cheaper than** cleaning it up.', pattern: 'far / much / considerably + comparative', meaning: 'hơn nhiều', level: 'mid' },
          { vi: 'Đã đến lúc chính phủ, doanh nghiệp và cá nhân cùng hành động.', en: '**It is high time** governments, businesses and individuals **acted** together.', pattern: 'It is high time sb did sth', meaning: 'đã đến lúc ai đó phải làm gì', level: 'adv' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'bảo vệ môi trường', pattern: 'protect the environment', en: 'We all need to **protect the environment** for our children.', vi: 'Tất cả chúng ta cần bảo vệ môi trường cho con cháu.' },
      { level: 'mid', meaning: 'cắt giảm khí thải carbon', pattern: 'cut / reduce carbon emissions', en: 'Electric buses help **cut carbon emissions** in cities.', vi: 'Xe buýt điện giúp cắt giảm khí thải carbon trong thành phố.' },
      { level: 'mid', meaning: 'chuyển sang', pattern: 'switch to sth', en: 'Many countries are **switching to** renewable energy.', vi: 'Nhiều quốc gia đang chuyển sang năng lượng tái tạo.' },
      { level: 'adv', meaning: 'đe dọa nghiêm trọng', pattern: 'pose a serious threat to sth', en: 'Plastic waste **poses a serious threat to** marine life.', vi: 'Rác thải nhựa đe dọa nghiêm trọng sinh vật biển.' },
      { level: 'adv', meaning: 'trừ khi … thiệt hại không thể đảo ngược', pattern: 'Unless + clause, … irreversible damage', en: '**Unless** action is taken now, climate change will cause **irreversible damage**.', vi: 'Trừ khi hành động ngay, biến đổi khí hậu sẽ gây thiệt hại không thể đảo ngược.' },
    ],
    chain: { vi: 'Đầu tư xe buýt và tàu điện → ít người đi xe máy, ô tô → giảm khí thải và kẹt xe → không khí trong lành hơn.', en: 'The city invests in buses and trains → fewer people use motorbikes and cars → emissions and traffic jams fall → the air becomes cleaner.' },
    sample: { vi: 'Lợi ích về môi trường của giao thông công cộng là rất rõ ràng. Khi một thành phố có xe buýt và tàu nhanh, giá rẻ, nhiều người dân sẽ để ô tô ở nhà. Điều này giúp giảm khí thải carbon và giảm ùn tắc, nên chất lượng không khí được cải thiện rõ rệt. Về lâu dài, khoản đầu tư như vậy là thiết yếu cho sự phát triển đô thị bền vững.', en: 'The environmental benefits of public transport are clear. When a city provides fast and affordable buses and trains, many residents leave their cars at home. This leads to lower carbon emissions and less traffic congestion, so air quality improves noticeably. In the long term, such investment is essential for sustainable urban development.' },
  },
  'dir.technology': {
    question: { vi: 'Công nghệ mang lại lợi ích và tác hại gì?', en: 'What benefits and harms does technology bring?' },
    ideas: [
      { vi: 'Tự động hóa công việc.', en: '**Automate tasks**.' },
      { vi: 'Tiếp cận thông tin nhanh chóng.', en: '**Access information instantly**.' },
      { vi: 'Cải thiện giao tiếp và kết nối.', en: '**Improve communication** and connection.' },
      { vi: 'Tăng hiệu quả và độ chính xác.', en: '**Increase efficiency and accuracy**.' },
      { vi: 'Gây rủi ro về quyền riêng tư.', en: '**Pose privacy risks**.' },
      { vi: 'Làm gia tăng sự phụ thuộc vào công nghệ hoặc nguy cơ mất việc.', en: 'Lead to **overdependence on technology** and **job losses**.' },
    ],
    six: {
      who: { vi: 'Người dùng, học sinh, người lao động, công ty công nghệ.', en: '**Users**, **students**, **workers** and **tech companies**.', ex: [
          { vi: 'Công nghệ tác động đến người dùng ở mọi lứa tuổi.', en: 'Technology **has an impact on** users of all ages.', pattern: 'have a positive / negative impact on sth', meaning: 'có tác động tích cực / tiêu cực đến', level: 'mid' },
          { vi: 'Công cụ số giúp học sinh và người lao động làm việc hiệu quả hơn.', en: 'Digital tools **enable students and workers to work** more efficiently.', pattern: 'enable sb to do sth', meaning: 'giúp ai có khả năng làm gì', level: 'mid' },
          { vi: 'Các công ty công nghệ lớn phải chịu trách nhiệm về dữ liệu người dùng.', en: "Big tech companies must **take responsibility for** their users' data.", pattern: 'take responsibility for sth', meaning: 'chịu trách nhiệm về', level: 'mid' },
        ] },
      why: { vi: 'Internet và AI phát triển nhanh, thiết bị rẻ và phổ biến.', en: 'The change is driven by the **rapid development of the Internet and AI** and **affordable devices**.', ex: [
          { vi: 'Internet và AI phát triển nhanh, vì vậy công nghệ thay đổi mọi mặt đời sống.', en: 'The Internet and AI are developing rapidly; **as a result,** technology is changing every part of life.', pattern: 'so + clause / As a result, …', meaning: 'vì vậy, do đó', level: 'basic' },
          { vi: 'Thiết bị rẻ giúp gần như ai cũng có thể sở hữu điện thoại thông minh.', en: 'Cheap devices **make it possible for almost everyone to own** a smartphone.', pattern: 'make it possible for sb to do sth', meaning: 'giúp ai có thể làm gì', level: 'mid' },
          { vi: 'Doanh nghiệp tự động hóa vì muốn tăng năng suất và giảm chi phí.', en: 'Businesses automate **because** they want to boost productivity and cut costs.', pattern: 'because + clause / because of + noun', meaning: 'vì, bởi vì', level: 'basic' },
        ] },
      what: { vi: 'Lợi: nhanh, chính xác, kết nối, tiếp cận thông tin. Hại: mất việc, lộ dữ liệu, phụ thuộc.', en: 'Technology makes life **efficient, accurate and connected**, but it also brings **job losses, privacy risks and overdependence**.', ex: [
          { vi: 'Internet cho phép mọi người tiếp cận thông tin tức thì.', en: 'The Internet **allows people to access** information instantly.', pattern: 'allow sb to do sth', meaning: 'cho phép ai làm gì', level: 'basic' },
          { vi: 'Tự động hóa có thể gây ra mất việc và rủi ro lộ dữ liệu.', en: 'Automation can **result in** job losses and data privacy risks.', pattern: 'result in sth / result from sth', meaning: 'gây ra / bắt nguồn từ', level: 'mid' },
          { vi: 'Dùng màn hình quá nhiều tước đi của trẻ thời gian giao tiếp trực tiếp.', en: 'Excessive screen time **deprives children of** face-to-face contact.', pattern: 'deprive sb of sth', meaning: 'tước đi của ai cái gì', level: 'adv' },
        ] },
      how: { vi: 'Dùng công nghệ có kiểm soát, đào tạo lại lao động, luật bảo vệ dữ liệu.', en: 'Society should **use it responsibly**, **retrain workers** and pass **data protection laws**.', ex: [
          { vi: 'Chính phủ nên ban hành luật bảo vệ dữ liệu cá nhân.', en: 'Governments **should pass** data protection laws.', pattern: 'should / ought to + V', meaning: 'nên', level: 'basic' },
          { vi: 'Các khóa đào tạo lại trang bị cho người lao động kỹ năng số.', en: 'Retraining courses **equip workers with** digital skills.', pattern: 'equip sb with sth', meaning: 'trang bị cho ai cái gì', level: 'mid' },
          { vi: 'Nhà trường nên dạy trẻ cách dùng công nghệ có trách nhiệm.', en: 'Schools should **teach children how to use** technology responsibly.', pattern: 'teach sb how to do sth', meaning: 'dạy ai cách làm gì', level: 'basic' },
        ] },
      when: { vi: 'Ngắn hạn: nhiều người mất việc, khó thích nghi. Dài hạn: năng suất tăng, xuất hiện nghề mới.', en: 'There may be **short-term job losses**, but **new types of jobs** appear **in the long run**.', ex: [
          { vi: 'Trước mắt, nhiều người có khả năng mất việc.', en: 'In the short term, many people **are likely to lose** their jobs.', pattern: 'be likely / unlikely to V', meaning: 'có khả năng / không có khả năng', level: 'mid' },
          { vi: 'Về lâu dài, AI chắc chắn sẽ tạo ra ngành nghề mới.', en: 'In the long run, AI **is set to create** new industries and jobs.', pattern: 'be set to V', meaning: 'chắc chắn sẽ, sắp sửa', level: 'adv' },
          { vi: 'Trẻ dùng màn hình càng sớm, thói quen càng khó thay đổi.', en: '**The earlier** children start using screens, **the harder** it is to change their habits.', pattern: 'The + comparative …, the + comparative …', meaning: 'càng … càng …', level: 'adv' },
        ] },
      which: { vi: 'Lợi ích lớn hơn tác hại nếu có quy định và đào tạo phù hợp.', en: '**The benefits outweigh the drawbacks if technology is properly regulated**.', ex: [
          { vi: 'Công nghệ là con dao hai lưỡi, nhưng lợi nhiều hơn hại nếu được quản lý tốt.', en: 'Technology is **a double-edged sword**, but its benefits outweigh its drawbacks when it is properly regulated.', pattern: 'a double-edged sword', meaning: 'con dao hai lưỡi', level: 'adv' },
          { vi: 'Tôi cho rằng công nghệ nên hỗ trợ chứ không thay thế con người.', en: '**I would argue that** technology should assist rather than replace people.', pattern: 'I would argue that …', meaning: 'tôi cho rằng (khi lập luận)', level: 'adv' },
          { vi: 'Học kết hợp online và trực tiếp vượt trội hơn chỉ dùng một hình thức.', en: 'Blended learning **is superior to** either online or classroom teaching alone.', pattern: 'be superior / inferior to sth', meaning: 'vượt trội / kém hơn', level: 'adv' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'giúp cuộc sống dễ dàng hơn', pattern: 'make life easier', en: 'Smartphones **make life easier** in many ways.', vi: 'Điện thoại thông minh giúp cuộc sống dễ dàng hơn theo nhiều cách.' },
      { level: 'mid', meaning: 'giúp ai có khả năng làm gì', pattern: 'enable sb to do sth', en: 'Video calls **enable families to stay** connected across continents.', vi: 'Gọi video giúp các gia đình giữ kết nối dù ở các châu lục khác nhau.' },
      { level: 'mid', meaning: 'nghiện', pattern: 'be addicted to sth', en: 'Many teenagers **are addicted to** social media.', vi: 'Nhiều thanh thiếu niên nghiện mạng xã hội.' },
      { level: 'adv', meaning: 'con dao hai lưỡi', pattern: 'a double-edged sword', en: 'Artificial intelligence is **a double-edged sword**: it boosts productivity but threatens jobs.', vi: 'Trí tuệ nhân tạo là con dao hai lưỡi: nó tăng năng suất nhưng đe dọa việc làm.' },
      { level: 'adv', meaning: 'khiến điều gì lỗi thời', pattern: 'render sth obsolete', en: 'Automation may **render** many routine jobs **obsolete**.', vi: 'Tự động hóa có thể khiến nhiều công việc lặp lại trở nên lỗi thời.' },
    ],
    chain: { vi: 'Học trực tuyến → học sinh vùng xa tiếp cận được giáo viên giỏi → giảm chênh lệch giáo dục; nhưng nếu thiếu tương tác trực tiếp → kỹ năng xã hội yếu đi.', en: 'Online learning spreads → students in remote areas reach good teachers → the education gap narrows; but without face-to-face contact → social skills weaken.' },
    sample: { vi: 'Công nghệ đã thay đổi giáo dục theo nhiều hướng tích cực. Các khóa học trực tuyến cho phép học sinh ở vùng xa học với giáo viên giàu kinh nghiệm mà không cần lên thành phố, giúp thu hẹp khoảng cách giáo dục giữa nông thôn và thành thị. Tuy nhiên, nếu việc học chỉ diễn ra qua màn hình, học sinh sẽ có ít cơ hội phát triển kỹ năng xã hội, vì vậy học trực tuyến nên bổ trợ chứ không thay thế lớp học truyền thống.', en: 'Technology has transformed education in many positive ways. Online courses allow students in remote areas to learn from experienced teachers without travelling to a city, which narrows the gap between rural and urban education. However, if learning takes place only through a screen, students may have fewer chances to develop social skills, so online learning should complement rather than replace classroom teaching.' },
  },
  'dir.time': {
    question: { vi: 'Vấn đề này tiết kiệm hay làm tốn thời gian, công sức?', en: 'Does the issue save or cost time and effort?' },
    ideas: [
      { vi: 'Tiết kiệm thời gian.', en: '**Save time**.' },
      { vi: 'Giảm công sức cho công việc thường ngày.', en: '**Reduce the effort of daily tasks**.' },
      { vi: 'Tăng thời gian dành cho gia đình.', en: '**Free up time for family**.' },
      { vi: 'Cải thiện cân bằng công việc và cuộc sống.', en: '**Improve work–life balance**.' },
      { vi: 'Giảm thời gian đi lại và chờ đợi.', en: '**Cut commuting and waiting time**.' },
    ],
    six: {
      who: { vi: 'Người đi làm, gia đình bận rộn, người sống ở thành phố.', en: '**Busy professionals**, **working parents** and **city dwellers**.', ex: [
          { vi: 'Dịch vụ tiện lợi tác động lớn nhất đến người đi làm bận rộn.', en: 'Convenient services **have the biggest impact on** busy professionals.', pattern: 'have a positive / negative impact on sth', meaning: 'có tác động tích cực / tiêu cực đến', level: 'mid' },
          { vi: 'Dịch vụ giao hàng giúp gia đình có con nhỏ tiết kiệm thời gian.', en: 'Delivery services **help families with young children save** time.', pattern: 'help sb (to) do sth', meaning: 'giúp ai làm gì', level: 'basic' },
          { vi: 'So với người ở nông thôn, người thành phố mất nhiều thời gian đi lại hơn hẳn.', en: '**Compared with** rural residents, city dwellers spend far more time commuting.', pattern: 'compared with / in comparison with sth', meaning: 'so với', level: 'mid' },
        ] },
      why: { vi: 'Nhịp sống nhanh, quỹ thời gian ít, đi lại mất nhiều thời gian.', en: 'People have a **fast-paced lifestyle**, **long commutes** and constant **time pressure**.', ex: [
          { vi: 'Nhịp sống nhanh cộng với giờ làm dài khiến người ta luôn thiếu thời gian.', en: 'A fast pace of life, **coupled with** long working hours, **means that** people are always short of time.', pattern: 'A, coupled with B, means that …', meaning: 'A cộng với B khiến cho …', level: 'adv' },
          { vi: 'Thời gian đi lại kéo dài do kẹt xe.', en: 'Commutes are getting longer **due to** traffic congestion.', pattern: 'due to / owing to + noun', meaning: 'do, bởi', level: 'mid' },
          { vi: 'Công nghệ mới đã mở đường cho nhiều dịch vụ tiện lợi.', en: 'New technology has **paved the way for** many convenient services.', pattern: 'pave the way for sth', meaning: 'mở đường cho điều gì', level: 'adv' },
        ] },
      what: { vi: 'Lợi: tiết kiệm thời gian, giảm công sức. Hại: lười vận động, ít giao tiếp trực tiếp.', en: 'Convenient services **save time and effort**, but they can **encourage inactivity** and mean **less face-to-face contact**.', ex: [
          { vi: 'Dịch vụ online tiết kiệm không những thời gian mà còn công sức.', en: 'Online services save **not only** time **but also** effort.', pattern: 'not only … but (also) …', meaning: 'không những … mà còn …', level: 'mid' },
          { vi: 'Quá tiện lợi có thể khiến con người lười vận động.', en: 'Too much convenience can **make people become** less active.', pattern: 'make sb do sth', meaning: 'bắt / khiến ai làm gì', level: 'basic' },
          { vi: 'Có thêm thời gian rảnh cho phép mọi người ở bên gia đình nhiều hơn.', en: 'Extra free time **allows people to spend** more time with their families.', pattern: 'allow sb to do sth', meaning: 'cho phép ai làm gì', level: 'basic' },
        ] },
      how: { vi: 'Làm việc từ xa, mua sắm online, dịch vụ giao hàng, tự động hóa việc nhà.', en: 'People can **work remotely**, **shop online** and **use delivery services**.', ex: [
          { vi: 'Làm việc từ xa giúp nhân viên có thể bỏ qua quãng đường đi làm mỗi ngày.', en: 'Remote work **makes it possible for employees to skip** the daily commute.', pattern: 'make it possible for sb to do sth', meaning: 'giúp ai có thể làm gì', level: 'mid' },
          { vi: 'Một cách để tiết kiệm thời gian là mua sắm online.', en: '**One way to save** time **is to** shop online.', pattern: 'One way to V is to V', meaning: 'một cách để … là …', level: 'basic' },
          { vi: 'Thiết bị thông minh giúp người dùng làm việc nhà nhanh hơn.', en: 'Smart appliances **enable users to finish** housework faster.', pattern: 'enable sb to do sth', meaning: 'giúp ai có khả năng làm gì', level: 'mid' },
        ] },
      when: { vi: 'Ngắn hạn: tiện ngay lập tức. Dài hạn: cân bằng công việc – cuộc sống tốt hơn, nhưng dễ phụ thuộc.', en: 'The convenience is **instant** and can bring a **better work–life balance**, but there is a **risk of dependence**.', ex: [
          { vi: 'Trước mắt, sự tiện lợi đến ngay lập tức.', en: '**In the short term,** the convenience is instant.', pattern: 'in the short term / in the long run', meaning: 'trước mắt / về lâu dài', level: 'basic' },
          { vi: 'Về lâu dài, nhân viên có khả năng cân bằng công việc – cuộc sống tốt hơn.', en: 'In the long run, employees **are likely to achieve** a better work–life balance.', pattern: 'be likely / unlikely to V', meaning: 'có khả năng / không có khả năng', level: 'mid' },
          { vi: 'Nếu bị lạm dụng, sự tiện lợi sẽ dẫn đến phụ thuộc và cô lập.', en: '**If** convenience **is** overused, it **will lead to** dependence and isolation.', pattern: 'If + present, will + V', meaning: 'nếu … thì sẽ (có thể xảy ra)', level: 'basic' },
        ] },
      which: { vi: 'Thời gian tiết kiệm được chỉ có giá trị nếu dùng cho việc có ích như gia đình, sức khỏe.', en: '**Saved time is valuable only if it is used wisely**, for example on family or health.', ex: [
          { vi: 'Điều quan trọng là mọi người dùng thời gian tiết kiệm được vào việc gì.', en: '**What** really matters **is** how people use the time they save.', pattern: 'What + clause + is …', meaning: 'điều mà … là …', level: 'adv' },
          { vi: 'Sự tiện lợi không nên đánh đổi bằng sức khỏe.', en: 'Convenience should not come **at the expense of** health.', pattern: 'at the expense of sth', meaning: 'đánh đổi bằng', level: 'adv' },
          { vi: 'Làm việc kết hợp giúp cân bằng giữa sự linh hoạt và tinh thần đồng đội.', en: 'Hybrid working **strikes a balance between** flexibility **and** teamwork.', pattern: 'strike a balance between A and B', meaning: 'cân bằng giữa A và B', level: 'adv' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'tiết kiệm thời gian', pattern: 'save time', en: 'Online shopping **saves time** for busy people.', vi: 'Mua sắm online tiết kiệm thời gian cho người bận rộn.' },
      { level: 'mid', meaning: 'dành ra thời gian cho', pattern: 'free up time for sth', en: 'Dishwashers **free up time for** family activities.', vi: 'Máy rửa bát giúp dành ra thời gian cho các hoạt động gia đình.' },
      { level: 'mid', meaning: 'cân bằng công việc – cuộc sống tốt hơn', pattern: 'achieve a better work–life balance', en: 'Remote work helps employees **achieve a better work–life balance**.', vi: 'Làm việc từ xa giúp nhân viên cân bằng công việc và cuộc sống tốt hơn.' },
      { level: 'adv', meaning: 'phải trả giá', pattern: 'come at a cost', en: 'Convenience **comes at a cost**: we walk less and talk less.', vi: 'Sự tiện lợi phải trả giá: chúng ta đi bộ ít hơn và trò chuyện ít hơn.' },
      { level: 'adv', meaning: 'hiếm khi (đảo ngữ)', pattern: 'Rarely do / does S + V', en: '**Rarely do** city dwellers **have** time to cook a proper meal.', vi: 'Người thành phố hiếm khi có thời gian nấu một bữa ăn tử tế.' },
    ],
    chain: { vi: 'Làm việc tại nhà → không mất 1–2 giờ đi lại mỗi ngày → có thêm thời gian cho gia đình và tập thể dục → cân bằng công việc – cuộc sống tốt hơn.', en: 'People work from home → they save one to two hours of commuting a day → they have more time for family and exercise → their work–life balance improves.' },
    sample: { vi: 'Một lợi ích lớn của làm việc tại nhà là tiết kiệm thời gian. Nhân viên không còn phải mất một đến hai tiếng đi lại mỗi ngày và có thể dùng thời gian này để tập thể dục, nấu bữa ăn lành mạnh hoặc ở bên gia đình. Kết quả là nhiều người làm việc từ xa cho biết họ cân bằng công việc và cuộc sống tốt hơn và hài lòng với công việc hơn.', en: 'One major advantage of working from home is the time it saves. Employees no longer need to spend one or two hours commuting every day, and they can use this time to exercise, cook healthy meals or be with their families. As a result, many remote workers report a better work–life balance and higher job satisfaction.' },
  },
  'dir.longterm': {
    question: { vi: 'Trước mắt thế nào, lâu dài thế nào?', en: 'What happens in the short term and in the long term?' },
    ideas: [
      { vi: 'Ngắn hạn: chi phí ban đầu, khó thích nghi, mất thời gian đào tạo.', en: 'Short term: **initial costs**, **an adjustment period** and time spent on training.' },
      { vi: 'Dài hạn: tăng năng suất, tiết kiệm tiền, nâng cao chất lượng cuộc sống.', en: 'Long term: **higher productivity**, **savings** and **a better quality of life**.' },
      { vi: 'Tác động đến thế hệ tương lai.', en: 'Effects on **future generations**.' },
      { vi: 'Tính bền vững của giải pháp.', en: 'Whether the solution is **sustainable**.' },
    ],
    six: {
      who: { vi: 'Thế hệ hiện tại và thế hệ tương lai.', en: '**The current generation** and **future generations**.', ex: [
          { vi: 'Thế hệ hiện tại chịu trách nhiệm chi trả cho sự thay đổi.', en: 'The current generation **takes responsibility for** paying the costs of change.', pattern: 'take responsibility for sth', meaning: 'chịu trách nhiệm về', level: 'mid' },
          { vi: 'Quyết định hôm nay để lại hậu quả sâu rộng cho thế hệ tương lai.', en: "Today's decisions **have far-reaching consequences for** future generations.", pattern: 'have far-reaching consequences for sth', meaning: 'có hậu quả sâu rộng đối với', level: 'adv' },
          { vi: 'Nhà hoạch định chính sách phải cân bằng giữa lợi ích trước mắt và lâu dài.', en: 'Policymakers must **strike a balance between** short-term **and** long-term interests.', pattern: 'strike a balance between A and B', meaning: 'cân bằng giữa A và B', level: 'adv' },
        ] },
      why: { vi: 'Nhiều giải pháp tốn kém lúc đầu nhưng có lợi về sau, hoặc ngược lại.', en: 'Many solutions cost a lot now but pay off later, or the reverse: **initial costs vs. long-term benefits**.', ex: [
          { vi: 'Mặc dù nhiều giải pháp tốn kém lúc đầu, chúng mang lại lợi ích về sau.', en: '**Although** many solutions are costly at first, they pay off later.', pattern: 'although / even though + clause', meaning: 'mặc dù', level: 'basic' },
          { vi: 'Một số lợi ích trước mắt có thể làm nảy sinh tác hại lâu dài.', en: 'Some short-term gains can **give rise to** long-term harm.', pattern: 'give rise to sth', meaning: 'làm nảy sinh', level: 'adv' },
          { vi: 'Lý do chính trị gia ưu tiên kết quả nhanh là họ muốn được tái đắc cử.', en: '**The reason why** politicians favour quick results **is that** they want to be re-elected.', pattern: 'The reason why … is that …', meaning: 'lý do … là vì …', level: 'adv' },
        ] },
      what: { vi: 'Ngắn hạn: chi phí, khó thích nghi, mất thời gian đào tạo. Dài hạn: năng suất, tiết kiệm, chất lượng sống.', en: 'Short-term effects are **initial costs** and an **adjustment period**; long-term effects are **higher productivity** and **savings**.', ex: [
          { vi: 'Trước mắt, thay đổi buộc người dân phải làm quen với cách làm mới.', en: 'In the short term, change **forces people to adapt** to new ways of working.', pattern: 'force / compel sb to do sth', meaning: 'buộc ai phải làm gì', level: 'mid' },
          { vi: 'Về lâu dài, đầu tư giúp xã hội đạt năng suất và chất lượng sống cao hơn.', en: 'In the long run, investment **helps society achieve** higher productivity and a better quality of life.', pattern: 'help sb (to) do sth', meaning: 'giúp ai làm gì', level: 'basic' },
          { vi: 'Khai thác tài nguyên quá mức đe dọa nghiêm trọng thế hệ sau.', en: 'Overusing natural resources **poses a serious threat to** the next generation.', pattern: 'pose a (serious) threat to sth', meaning: 'đe dọa (nghiêm trọng) đến', level: 'adv' },
        ] },
      how: { vi: 'Thực hiện từng bước, hỗ trợ người bị ảnh hưởng trong giai đoạn chuyển đổi.', en: 'It is best to **introduce changes gradually** and **support those affected** during the transition.', ex: [
          { vi: 'Chính phủ nên thực hiện thay đổi từng bước.', en: 'Governments **should introduce** changes gradually.', pattern: 'should / ought to + V', meaning: 'nên', level: 'basic' },
          { vi: 'Hỗ trợ tài chính giúp những người bị ảnh hưởng vượt qua giai đoạn chuyển đổi.', en: 'Financial support **helps those affected get** through the transition.', pattern: 'help sb (to) do sth', meaning: 'giúp ai làm gì', level: 'basic' },
          { vi: 'Mục tiêu dài hạn rõ ràng cho phép chính phủ theo dõi tiến độ.', en: 'Clear long-term targets **allow governments to monitor** progress.', pattern: 'allow sb to do sth', meaning: 'cho phép ai làm gì', level: 'basic' },
        ] },
      when: { vi: 'Đây chính là câu WHEN: luôn so sánh “trước mắt” với “lâu dài”.', en: 'This is the WHEN question itself: always contrast **“in the short term…”** with **“in the long run…”**.', ex: [
          { vi: 'Đặt hai mốc thời gian trong cùng một đoạn: dù tốn kém trước mắt, chính sách vẫn có lợi về lâu dài.', en: 'Contrast both in one paragraph: **while it is true that** the policy is costly now, it pays off in the long run.', pattern: 'While it is true that …, …', meaning: 'dù đúng là … nhưng …', level: 'adv' },
          { vi: 'Lợi ích được dự đoán sẽ vượt chi phí sau 5–10 năm.', en: 'The benefits **are expected to outweigh** the costs within five to ten years.', pattern: 'be expected to V', meaning: 'được dự đoán sẽ', level: 'mid' },
          { vi: 'Nếu xu hướng này tiếp diễn, thế hệ sau sẽ phải trả giá.', en: '**Should** this trend **continue**, the next generation **will pay** the price.', pattern: 'Should + S + V, …', meaning: 'nếu … (đảo ngữ, ít khả năng)', level: 'adv' },
        ] },
      which: { vi: 'Nên chọn giải pháp bền vững dù tốn kém ban đầu.', en: 'Choose the sustainable option, because **long-term benefits outweigh short-term costs**.', ex: [
          { vi: 'Tôi kiên quyết cho rằng nên chọn giải pháp bền vững dù tốn kém ban đầu.', en: '**I am firmly of the view that** we should choose the sustainable option, even if it costs more at first.', pattern: 'I am firmly of the view that …', meaning: 'tôi kiên quyết cho rằng', level: 'adv' },
          { vi: 'Lợi ích lâu dài thường lớn hơn chi phí trước mắt.', en: '**The long-term benefits** usually **outweigh** the short-term costs.', pattern: 'the advantages outweigh the disadvantages', meaning: 'lợi nhiều hơn hại', level: 'mid' },
          { vi: 'Giải pháp tạm thời chỉ che giấu vấn đề chứ không giải quyết gốc rễ.', en: 'Quick fixes only hide the problem instead of **tackling** its root cause.', pattern: 'tackle / address / combat a problem', meaning: 'giải quyết, đối phó với vấn đề', level: 'mid' },
        ] },
    },
    colls: [
      { level: 'basic', meaning: 'trước mắt / về lâu dài', pattern: 'in the short term / in the long run', en: 'Solar panels are expensive **in the short term** but save money **in the long run**.', vi: 'Pin mặt trời đắt trước mắt nhưng tiết kiệm tiền về lâu dài.' },
      { level: 'mid', meaning: 'mang lại kết quả, hoàn vốn', pattern: 'pay off', en: 'Investment in education always **pays off** in the end.', vi: 'Đầu tư vào giáo dục cuối cùng luôn mang lại kết quả.' },
      { level: 'mid', meaning: 'có khả năng', pattern: 'be likely to V', en: 'These changes **are likely to benefit** future generations.', vi: 'Những thay đổi này có khả năng mang lại lợi ích cho các thế hệ sau.' },
      { level: 'adv', meaning: 'lợi ích lâu dài lớn hơn nhiều chi phí trước mắt', pattern: 'long-term benefits far outweigh short-term costs', en: 'In my view, **the long-term benefits** of a carbon tax **far outweigh** its short-term costs.', vi: 'Theo tôi, lợi ích lâu dài của thuế carbon lớn hơn nhiều so với chi phí trước mắt.' },
      { level: 'adv', meaning: 'nếu … (đảo ngữ)', pattern: 'Should + S + V, …', en: '**Should** this trend **continue**, the next generation **will inherit** a much hotter planet.', vi: 'Nếu xu hướng này tiếp diễn, thế hệ sau sẽ thừa hưởng một hành tinh nóng hơn nhiều.' },
    ],
    chain: { vi: 'Lắp pin mặt trời → ngắn hạn: chi phí lắp đặt cao → dài hạn: hóa đơn điện giảm, hoàn vốn sau vài năm, giảm khí thải cho thế hệ sau.', en: 'A family installs solar panels → short term: a high installation cost → long term: lower electricity bills, payback within a few years and fewer emissions for future generations.' },
    sample: { vi: 'Dù lắp đặt pin mặt trời tốn kém lúc đầu, đây là một khoản đầu tư khôn ngoan về lâu dài. Các hộ gia đình có thể giảm đáng kể hóa đơn tiền điện và thường thu hồi vốn ban đầu trong vòng vài năm. Quan trọng hơn, giảm phụ thuộc vào nhiên liệu hóa thạch giúp bảo vệ hành tinh cho các thế hệ sau, nên chi phí trước mắt hoàn toàn xứng đáng.', en: 'Although installing solar panels is expensive at first, it is a wise investment in the long run. Households can cut their electricity bills significantly and usually recover the initial cost within a few years. More importantly, reducing our dependence on fossil fuels helps protect the planet for future generations, so the short-term cost is clearly worth paying.' },
  },
}
