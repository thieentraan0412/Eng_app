// Ngân hàng collocation & pattern cho Writing Task 2 — sinh tự động từ
// DATA/huong-dan-song-ngu.md mục 2.1–2.12 (bỏ 2.13 vì chỉ dành cho Speaking).
// Sửa nội dung ở file nguồn rồi sinh lại, đừng sửa tay ở đây.

export type PatternLevel = 'basic' | 'mid' | 'adv'

export interface PatternItem {
  level: PatternLevel
  /** W, S hoặc W·S */
  skill: string
  pattern: string
  vi: string
  exVi: string
  ex: string
}

export interface PatternGroup {
  id: string
  no: number
  vi: string
  en: string
  items: PatternItem[]
}

export const PATTERN_GROUPS: PatternGroup[] = [
  {
    id: 'p1',
    no: 1,
    vi: 'Cho phép, giúp đỡ, khuyến khích',
    en: 'Allowing, helping and encouraging',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'allow sb to do sth', vi: 'cho phép ai làm gì', exVi: 'Internet cho phép học sinh học theo tốc độ của riêng mình.', ex: 'The Internet allows students to learn at their own pace.' },
      { level: 'basic', skill: 'W·S', pattern: 'let sb do sth', vi: 'để ai làm gì (thân mật, hay dùng khi nói)', exVi: 'Bố mẹ để tôi tự chọn trường đại học.', ex: 'My parents let me choose my own university.' },
      { level: 'basic', skill: 'W·S', pattern: 'help sb (to) do sth', vi: 'giúp ai làm gì', exVi: 'Tập thể dục đều đặn giúp mọi người khỏe mạnh.', ex: 'Regular exercise helps people stay healthy.' },
      { level: 'basic', skill: 'W·S', pattern: 'encourage sb to do sth', vi: 'khuyến khích ai làm gì', exVi: 'Vé xe buýt miễn phí khuyến khích người trẻ đi phương tiện công cộng.', ex: 'Free bus passes encourage young people to use public transport.' },
      { level: 'mid', skill: 'W', pattern: 'enable sb to do sth', vi: 'giúp ai có khả năng làm gì', exVi: 'Ngân hàng trực tuyến giúp khách hàng quản lý tiền ngay tại nhà.', ex: 'Online banking enables customers to manage their money from home.' },
      { level: 'mid', skill: 'W·S', pattern: 'make it possible for sb to do sth', vi: 'giúp ai có thể làm gì', exVi: 'Gọi video giúp các gia đình giữ liên lạc dù ở khác quốc gia.', ex: 'Video calls make it possible for families to stay in touch across countries.' },
      { level: 'mid', skill: 'W', pattern: 'provide sb with sth', vi: 'cung cấp cho ai cái gì', exVi: 'Trường học nên cung cấp cho học sinh kỹ năng thực tế.', ex: 'Schools should provide students with practical skills.' },
      { level: 'mid', skill: 'W', pattern: 'equip sb with sth', vi: 'trang bị cho ai cái gì', exVi: 'Các khóa đại học trang bị cho sinh viên kiến thức mà nhà tuyển dụng cần.', ex: 'University courses equip graduates with the knowledge employers need.' },
      { level: 'mid', skill: 'W·S', pattern: 'persuade sb to do sth', vi: 'thuyết phục ai làm gì', exVi: 'Quảng cáo thường thuyết phục trẻ em mua đồ ăn vặt kém lành mạnh.', ex: 'Advertising often persuades children to buy unhealthy snacks.' },
      { level: 'adv', skill: 'W', pattern: 'empower sb to do sth', vi: 'tạo sức mạnh, trao quyền cho ai làm gì', exVi: 'Giáo dục giúp phụ nữ đủ sức tự chủ tài chính.', ex: 'Education empowers women to become financially independent.' },
      { level: 'adv', skill: 'W', pattern: 'pave the way for sth', vi: 'mở đường cho điều gì', exVi: 'Vé máy bay giá rẻ đã mở đường cho du lịch đại chúng.', ex: 'Cheap air travel has paved the way for mass tourism.' },
    ],
  },
  {
    id: 'p2',
    no: 2,
    vi: 'Ngăn cản, bắt buộc',
    en: 'Preventing and forcing',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'stop sb (from) doing sth', vi: 'ngăn ai làm gì', exVi: 'Giá cao khiến nhiều gia đình không mua được thực phẩm tươi.', ex: 'High prices stop many families from buying fresh food.' },
      { level: 'basic', skill: 'W·S', pattern: 'make sb do sth', vi: 'bắt / khiến ai làm gì', exVi: 'Giờ làm việc dài khiến mọi người kiệt sức.', ex: 'Long working hours make people feel exhausted.' },
      { level: 'mid', skill: 'W·S', pattern: 'prevent sb from doing sth', vi: 'ngăn cản ai làm gì', exVi: 'Luật nghiêm ngặt ngăn nhà máy xả thải ra sông.', ex: 'Strict laws prevent factories from dumping waste into rivers.' },
      { level: 'mid', skill: 'W', pattern: 'discourage sb from doing sth', vi: 'làm ai nản, không muốn làm gì', exVi: 'Thuế cao khiến người dân ngại hút thuốc.', ex: 'Heavy taxes discourage people from smoking.' },
      { level: 'mid', skill: 'W', pattern: 'force / compel sb to do sth', vi: 'buộc ai phải làm gì', exVi: 'Giá thuê nhà tăng buộc người trẻ phải sống cùng bố mẹ.', ex: 'Rising rents force young people to live with their parents.' },
      { level: 'mid', skill: 'W', pattern: 'require sb to do sth', vi: 'yêu cầu ai làm gì', exVi: 'Luật yêu cầu tài xế thắt dây an toàn.', ex: 'The law requires drivers to wear seat belts.' },
      { level: 'adv', skill: 'W', pattern: 'deter sb from doing sth', vi: 'răn đe để ai không làm gì', exVi: 'Hình phạt nặng có thể răn đe giới trẻ không phạm tội.', ex: 'Harsh punishments may deter young people from committing crimes.' },
      { level: 'adv', skill: 'W', pattern: 'prohibit / ban sb from doing sth', vi: 'cấm ai làm gì', exVi: 'Một số nước cấm doanh nghiệp quảng cáo đồ ăn vặt cho trẻ em.', ex: 'Some countries prohibit companies from advertising junk food to children.' },
      { level: 'adv', skill: 'W', pattern: 'deprive sb of sth', vi: 'tước đi của ai cái gì', exVi: 'Dùng màn hình quá nhiều khiến trẻ thiếu ngủ và thiếu vận động.', ex: 'Excessive screen time deprives children of sleep and exercise.' },
      { level: 'adv', skill: 'W', pattern: 'hinder / impede sth', vi: 'cản trở điều gì', exVi: 'Hạ tầng kém cản trở tăng trưởng kinh tế ở nông thôn.', ex: 'Poor infrastructure hinders economic growth in rural areas.' },
    ],
  },
  {
    id: 'p3',
    no: 3,
    vi: 'Nguyên nhân – kết quả',
    en: 'Cause and effect',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'because + clause / because of + noun', vi: 'vì, bởi vì', exVi: 'Nhiều người lên thành phố vì có cơ hội việc làm tốt hơn.', ex: 'Many people move to cities because of better job opportunities.' },
      { level: 'basic', skill: 'W·S', pattern: 'so + clause / As a result, …', vi: 'vì vậy, do đó', exVi: 'Đồ ăn nhanh rẻ nên nhiều gia đình ăn hằng ngày.', ex: 'Fast food is cheap, so many families eat it every day.' },
      { level: 'basic', skill: 'W·S', pattern: 'lead to sth', vi: 'dẫn đến', exVi: 'Thiếu ngủ có thể dẫn đến kém tập trung.', ex: 'Lack of sleep can lead to poor concentration.' },
      { level: 'mid', skill: 'W', pattern: 'result in sth / result from sth', vi: 'gây ra / bắt nguồn từ', exVi: 'Phá rừng dẫn đến mất môi trường sống của động vật hoang dã.', ex: 'Deforestation results in the loss of wildlife habitats.' },
      { level: 'mid', skill: 'W', pattern: 'be caused by / stem from sth', vi: 'do … gây ra / bắt nguồn từ', exVi: 'Nhiều vấn đề sức khỏe bắt nguồn từ lối sống ít vận động.', ex: 'Many health problems stem from a sedentary lifestyle.' },
      { level: 'mid', skill: 'W', pattern: 'have a positive / negative impact on sth', vi: 'có tác động tích cực / tiêu cực đến', exVi: 'Mạng xã hội có tác động tiêu cực đến lòng tự trọng của thanh thiếu niên.', ex: 'Social media has a negative impact on teenagers\' self-esteem.' },
      { level: 'mid', skill: 'W', pattern: 'due to / owing to + noun', vi: 'do, bởi', exVi: 'Kẹt xe ngày càng tệ do lượng xe cá nhân tăng.', ex: 'Traffic jams are getting worse due to the rise in private cars.' },
      { level: 'adv', skill: 'W', pattern: 'give rise to sth', vi: 'làm nảy sinh', exVi: 'Đô thị hóa nhanh đã làm nảy sinh khủng hoảng nhà ở.', ex: 'Rapid urbanisation has given rise to a housing crisis.' },
      { level: 'adv', skill: 'W', pattern: 'be largely attributable to sth', vi: 'phần lớn là do', exVi: 'Béo phì gia tăng phần lớn là do thực phẩm chế biến sẵn.', ex: 'The rise in obesity is largely attributable to processed food.' },
      { level: 'adv', skill: 'W', pattern: '…, which in turn + V', vi: 'điều này đến lượt nó lại …', exVi: 'Ô nhiễm làm hại mùa màng, điều này lại đẩy giá lương thực lên.', ex: 'Pollution damages crops, which in turn pushes up food prices.' },
      { level: 'adv', skill: 'W', pattern: 'A, coupled with B, means that …', vi: 'A cộng với B khiến cho …', exVi: 'Lương thấp cộng với tiền thuê cao khiến nhiều người lao động không thể tiết kiệm.', ex: 'Low wages, coupled with high rents, mean that many workers cannot save.' },
    ],
  },
  {
    id: 'p4',
    no: 4,
    vi: 'Nêu quan điểm',
    en: 'Giving opinions',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'I think / I believe that …', vi: 'tôi nghĩ / tôi tin rằng', exVi: 'Tôi tin rằng trẻ em nên học ngoại ngữ sớm.', ex: 'I believe that children should learn a second language early.' },
      { level: 'basic', skill: 'W·S', pattern: 'In my opinion, …', vi: 'theo tôi', exVi: 'Theo tôi, giao thông công cộng nên miễn phí.', ex: 'In my opinion, public transport should be free.' },
      { level: 'basic', skill: 'S', pattern: 'Personally, I\'d say (that) …', vi: 'cá nhân tôi thì cho rằng', exVi: 'Cá nhân tôi thì cho rằng học online hợp với người lớn hơn.', ex: 'Personally, I\'d say online learning suits adults better.' },
      { level: 'mid', skill: 'W', pattern: 'I am convinced that …', vi: 'tôi tin chắc rằng', exVi: 'Tôi tin chắc giáo dục là chìa khóa để giảm nghèo.', ex: 'I am convinced that education is the key to reducing poverty.' },
      { level: 'mid', skill: 'W·S', pattern: 'It seems to me that …', vi: 'với tôi thì có vẻ như', exVi: 'Với tôi thì có vẻ mọi người dành quá nhiều thời gian trên mạng.', ex: 'It seems to me that people spend too much time online.' },
      { level: 'mid', skill: 'W', pattern: 'From my perspective, …', vi: 'từ góc nhìn của tôi', exVi: 'Từ góc nhìn của tôi, lợi ích của du lịch lớn hơn tác hại.', ex: 'From my perspective, the benefits of tourism outweigh its drawbacks.' },
      { level: 'adv', skill: 'W', pattern: 'I would argue that …', vi: 'tôi cho rằng (khi lập luận)', exVi: 'Tôi cho rằng chính phủ nên tài trợ giáo dục đại học.', ex: 'I would argue that the government should fund university education.' },
      { level: 'adv', skill: 'W', pattern: 'I am firmly of the view that …', vi: 'tôi kiên quyết cho rằng', exVi: 'Tôi kiên quyết cho rằng nên cấm thử nghiệm trên động vật.', ex: 'I am firmly of the view that animal testing should be banned.' },
      { level: 'adv', skill: 'W', pattern: 'It is widely believed that … / X is widely believed to V', vi: 'nhiều người tin rằng', exVi: 'Nhiều người tin rằng công nghệ giúp cuộc sống dễ dàng hơn.', ex: 'It is widely believed that technology makes life easier.' },
    ],
  },
  {
    id: 'p5',
    no: 5,
    vi: 'Nhượng bộ và đối lập',
    en: 'Concession and contrast',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'but / however', vi: 'nhưng / tuy nhiên', exVi: 'Ô tô tiện lợi. Tuy nhiên, chúng gây ô nhiễm.', ex: 'Cars are convenient. However, they cause pollution.' },
      { level: 'basic', skill: 'W·S', pattern: 'although / even though + clause', vi: 'mặc dù', exVi: 'Mặc dù mua sắm online tiện lợi, nó làm giảm giao tiếp trực tiếp.', ex: 'Although online shopping is convenient, it reduces face-to-face contact.' },
      { level: 'mid', skill: 'W', pattern: 'despite / in spite of + noun / V-ing', vi: 'mặc dù', exVi: 'Dù chi phí cao, năng lượng mặt trời đang ngày càng phổ biến.', ex: 'Despite its high cost, solar energy is becoming popular.' },
      { level: 'mid', skill: 'W', pattern: 'whereas / while + clause', vi: 'trong khi (đối lập)', exVi: 'Thành phố có nhiều việc làm hơn, trong khi nông thôn có nhịp sống chậm hơn.', ex: 'Cities offer more jobs, whereas rural areas offer a slower pace of life.' },
      { level: 'mid', skill: 'W', pattern: 'On the one hand, … On the other hand, …', vi: 'một mặt … mặt khác …', exVi: 'Một mặt, danh tiếng mang lại tiền bạc. Mặt khác, nó hủy hoại sự riêng tư.', ex: 'On the one hand, fame brings money. On the other hand, it destroys privacy.' },
      { level: 'adv', skill: 'W', pattern: 'While it is true that …, …', vi: 'dù đúng là … nhưng …', exVi: 'Dù đúng là robot giúp tiết kiệm tiền, chúng cũng làm mất việc làm.', ex: 'While it is true that robots save money, they also cost jobs.' },
      { level: 'adv', skill: 'W', pattern: 'Admittedly, … Nevertheless, …', vi: 'phải thừa nhận là … dù vậy …', exVi: 'Phải thừa nhận thuế không được ưa chuộng. Dù vậy, thuế nuôi các dịch vụ thiết yếu.', ex: 'Admittedly, taxes are unpopular. Nevertheless, they fund essential services.' },
      { level: 'adv', skill: 'W', pattern: 'Much as + clause, …', vi: 'dù rất …', exVi: 'Dù rất thích mạng xã hội, tôi lo ngại ảnh hưởng của nó tới giới trẻ.', ex: 'Much as I enjoy social media, I worry about its effect on young people.' },
    ],
  },
  {
    id: 'p6',
    no: 6,
    vi: 'So sánh',
    en: 'Comparing',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'more / less + adj + than', vi: 'hơn / kém hơn', exVi: 'Tàu hỏa thoải mái hơn xe buýt.', ex: 'Trains are more comfortable than buses.' },
      { level: 'basic', skill: 'W·S', pattern: 'as + adj + as', vi: 'bằng, ngang với', exVi: 'Khóa học online có thể hiệu quả ngang lớp học trực tiếp.', ex: 'Online courses can be as effective as classroom lessons.' },
      { level: 'mid', skill: 'W', pattern: 'far / much / considerably + comparative', vi: 'hơn nhiều', exVi: 'Phòng bệnh rẻ hơn nhiều so với chữa bệnh.', ex: 'Prevention is far cheaper than cure.' },
      { level: 'mid', skill: 'W', pattern: 'compared with / in comparison with sth', vi: 'so với', exVi: 'So với cha mẹ họ, người trẻ ngày nay ít được đảm bảo việc làm hơn.', ex: 'Compared with their parents, young people today have less job security.' },
      { level: 'mid', skill: 'W', pattern: 'the advantages outweigh the disadvantages', vi: 'lợi nhiều hơn hại', exVi: 'Theo tôi, lợi ích của làm việc từ xa lớn hơn bất lợi.', ex: 'In my view, the advantages of remote work outweigh the disadvantages.' },
      { level: 'adv', skill: 'W', pattern: 'The + comparative …, the + comparative …', vi: 'càng … càng …', exVi: 'Trẻ càng dành nhiều thời gian trên mạng càng ít vận động.', ex: 'The more time children spend online, the less they exercise.' },
      { level: 'adv', skill: 'W', pattern: 'be superior / inferior to sth', vi: 'vượt trội / kém hơn', exVi: 'Dạy trực tiếp vượt trội hơn học online về mặt tương tác.', ex: 'Face-to-face teaching is superior to online learning in terms of interaction.' },
      { level: 'adv', skill: 'W', pattern: 'by far the most + adj', vi: '… nhất, bỏ xa', exVi: 'Giáo dục là cách giảm tội phạm hiệu quả nhất, bỏ xa các cách khác.', ex: 'Education is by far the most effective way to reduce crime.' },
    ],
  },
  {
    id: 'p7',
    no: 7,
    vi: 'Ví dụ và bổ sung ý',
    en: 'Examples and adding ideas',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'for example / for instance', vi: 'ví dụ', exVi: 'Nhiều việc làm giờ đã tự động hóa. Ví dụ, siêu thị dùng máy tự thanh toán.', ex: 'Many jobs are now automated. For example, supermarkets use self-checkout machines.' },
      { level: 'basic', skill: 'W·S', pattern: 'such as + noun', vi: 'chẳng hạn như', exVi: 'Các hoạt động ngoài trời như đạp xe và leo núi tốt cho sức khỏe.', ex: 'Outdoor activities such as cycling and hiking are good for health.' },
      { level: 'basic', skill: 'W·S', pattern: 'also / in addition / moreover', vi: 'thêm vào đó, hơn nữa', exVi: 'Đạp xe rẻ. Hơn nữa, nó giúp bạn khỏe mạnh.', ex: 'Cycling is cheap. Moreover, it keeps you fit.' },
      { level: 'basic', skill: 'S', pattern: 'On top of that, …', vi: 'thêm vào đó (văn nói)', exVi: 'Căn hộ nhỏ. Thêm vào đó, nó rất ồn.', ex: 'The flat is small. On top of that, it\'s really noisy.' },
      { level: 'mid', skill: 'W', pattern: 'A good example of this is …', vi: 'một ví dụ điển hình là', exVi: 'Một ví dụ điển hình là Singapore, nơi giao thông công cộng rẻ và hiệu quả.', ex: 'A good example of this is Singapore, where public transport is cheap and efficient.' },
      { level: 'mid', skill: 'W·S', pattern: 'not only … but (also) …', vi: 'không những … mà còn …', exVi: 'Tập thể dục không những cải thiện sức khỏe mà còn giảm căng thẳng.', ex: 'Exercise not only improves health but also reduces stress.' },
      { level: 'adv', skill: 'W', pattern: 'A case in point is …', vi: 'một ví dụ tiêu biểu là', exVi: 'Ví dụ tiêu biểu là Nhật Bản, nơi dân số già khiến lực lượng lao động co lại.', ex: 'A case in point is Japan, whose ageing population is shrinking its workforce.' },
      { level: 'adv', skill: 'W', pattern: 'This is particularly evident in …', vi: 'điều này đặc biệt rõ ở', exVi: 'Điều này đặc biệt rõ ở các thành phố lớn, nơi chất lượng không khí kém.', ex: 'This is particularly evident in big cities, where air quality is poor.' },
    ],
  },
  {
    id: 'p8',
    no: 8,
    vi: 'Giải pháp và đề xuất',
    en: 'Solutions and suggestions',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'should / ought to + V', vi: 'nên', exVi: 'Chính phủ nên đầu tư nhiều hơn vào bệnh viện công.', ex: 'The government should invest more in public hospitals.' },
      { level: 'basic', skill: 'W·S', pattern: 'One way to V is to V', vi: 'một cách để … là …', exVi: 'Một cách để giảm kẹt xe là cải thiện giao thông công cộng.', ex: 'One way to reduce traffic is to improve public transport.' },
      { level: 'mid', skill: 'W', pattern: 'take measures / steps to V', vi: 'áp dụng biện pháp để', exVi: 'Các thành phố phải áp dụng biện pháp để giảm ô nhiễm không khí.', ex: 'Cities must take measures to reduce air pollution.' },
      { level: 'mid', skill: 'W', pattern: 'tackle / address / combat a problem', vi: 'giải quyết, đối phó với vấn đề', exVi: 'Chính phủ cần giải quyết vấn đề thất nghiệp ở giới trẻ.', ex: 'Governments need to tackle the problem of youth unemployment.' },
      { level: 'mid', skill: 'W', pattern: 'It is essential / vital that sb (should) do sth', vi: 'điều thiết yếu là ai đó làm gì', exVi: 'Điều thiết yếu là mọi trẻ em đều được đi học.', ex: 'It is essential that every child have access to education.' },
      { level: 'adv', skill: 'W', pattern: 'go a long way towards V-ing', vi: 'góp phần lớn vào việc', exVi: 'Bữa ăn miễn phí ở trường sẽ góp phần lớn vào việc giảm suy dinh dưỡng ở trẻ.', ex: 'Free school meals would go a long way towards reducing child malnutrition.' },
      { level: 'adv', skill: 'W', pattern: 'It is high time sb did sth', vi: 'đã đến lúc ai đó phải làm gì', exVi: 'Đã đến lúc các chính phủ phải coi trọng biến đổi khí hậu.', ex: 'It is high time governments took climate change seriously.' },
      { level: 'adv', skill: 'W', pattern: 'strike a balance between A and B', vi: 'cân bằng giữa A và B', exVi: 'Các thành phố phải cân bằng giữa phát triển và bảo tồn.', ex: 'Cities must strike a balance between development and conservation.' },
    ],
  },
  {
    id: 'p9',
    no: 9,
    vi: 'Điều kiện và giả định',
    en: 'Conditions and hypotheses',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'If + present, will + V', vi: 'nếu … thì sẽ (có thể xảy ra)', exVi: 'Nếu chúng ta tái chế nhiều hơn, sẽ có ít rác hơn.', ex: 'If we recycle more, there will be less waste.' },
      { level: 'mid', skill: 'W·S', pattern: 'If + past, would + V', vi: 'nếu … thì sẽ (giả định)', exVi: 'Nếu giao thông công cộng miễn phí, nhiều người sẽ dùng hơn.', ex: 'If public transport were free, more people would use it.' },
      { level: 'mid', skill: 'W', pattern: 'unless + clause', vi: 'trừ khi', exVi: 'Trừ khi có hành động, nhiều loài sẽ biến mất.', ex: 'Unless action is taken, many species will disappear.' },
      { level: 'mid', skill: 'W·S', pattern: 'provided that / as long as + clause', vi: 'miễn là', exVi: 'Công nghệ hữu ích miễn là được dùng có trách nhiệm.', ex: 'Technology is helpful as long as it is used responsibly.' },
      { level: 'adv', skill: 'W', pattern: 'Were sb to V, …', vi: 'nếu ai đó … (đảo ngữ)', exVi: 'Nếu chính phủ tăng thuế nhiên liệu, người dân sẽ lái xe ít hơn.', ex: 'Were the government to raise fuel taxes, people would drive less.' },
      { level: 'adv', skill: 'W', pattern: 'Should + S + V, …', vi: 'nếu … (đảo ngữ, ít khả năng)', exVi: 'Nếu xu hướng này tiếp diễn, các thành phố sẽ còn đông đúc hơn.', ex: 'Should this trend continue, cities will become even more crowded.' },
      { level: 'adv', skill: 'W', pattern: 'Had sb done sth, … would have …', vi: 'giá mà … thì đã … (quá khứ)', exVi: 'Giá mà thành phố đầu tư đê chống lũ, thiệt hại đã nhỏ hơn.', ex: 'Had the city invested in flood defences, the damage would have been smaller.' },
    ],
  },
  {
    id: 'p10',
    no: 10,
    vi: 'Nhấn mạnh và cấu trúc nâng cao',
    en: 'Emphasis and advanced structures',
    items: [
      { level: 'mid', skill: 'W', pattern: 'There is no doubt that …', vi: 'không còn nghi ngờ gì rằng', exVi: 'Không còn nghi ngờ gì rằng điện thoại thông minh đã thay đổi cách chúng ta giao tiếp.', ex: 'There is no doubt that smartphones have changed how we communicate.' },
      { level: 'mid', skill: 'W', pattern: 'It is … that … (câu chẻ)', vi: 'chính … mà …', exVi: 'Chính cha mẹ, chứ không phải nhà trường, định hình giá trị của trẻ nhiều nhất.', ex: 'It is parents, not schools, that shape children\'s values most.' },
      { level: 'adv', skill: 'W·S', pattern: 'What + clause + is …', vi: 'điều mà … là …', exVi: 'Điều khiến tôi lo nhất là mất quyền riêng tư.', ex: 'What worries me most is the loss of privacy.' },
      { level: 'adv', skill: 'W', pattern: 'Only by V-ing can S + V', vi: 'chỉ bằng cách … thì mới …', exVi: 'Chỉ bằng cách đầu tư vào giáo dục thì một quốc gia mới giảm được nghèo đói.', ex: 'Only by investing in education can a country reduce poverty.' },
      { level: 'adv', skill: 'W', pattern: 'Not until … do / does S + V', vi: 'mãi đến khi … mới …', exVi: 'Mãi đến khi mất sức khỏe, người ta mới nhận ra giá trị của nó.', ex: 'Not until people lose their health do they realise its value.' },
      { level: 'adv', skill: 'W', pattern: 'Rarely / Seldom + trợ động từ + S + V', vi: 'hiếm khi', exVi: 'Ngày nay giới trẻ hiếm khi đọc báo.', ex: 'Rarely do young people read newspapers nowadays.' },
      { level: 'adv', skill: 'W', pattern: 'The reason why … is that …', vi: 'lý do … là vì …', exVi: 'Lý do nhiều sinh viên tốt nghiệp thất nghiệp là vì kỹ năng không phù hợp với thị trường.', ex: 'The reason why many graduates are unemployed is that their skills do not match the market.' },
    ],
  },
  {
    id: 'p11',
    no: 11,
    vi: 'Xu hướng và dự đoán',
    en: 'Trends and predictions',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'more and more + noun', vi: 'ngày càng nhiều', exVi: 'Ngày càng nhiều người làm việc tại nhà.', ex: 'More and more people are working from home.' },
      { level: 'mid', skill: 'W', pattern: 'an increasing / a growing number of + noun', vi: 'số lượng ngày càng tăng', exVi: 'Ngày càng có nhiều sinh viên chọn đi du học.', ex: 'A growing number of students are choosing to study abroad.' },
      { level: 'mid', skill: 'W·S', pattern: 'be likely / unlikely to V', vi: 'có khả năng / không có khả năng', exVi: 'Xe điện có khả năng thay thế xe chạy xăng.', ex: 'Electric cars are likely to replace petrol cars.' },
      { level: 'mid', skill: 'W', pattern: 'be expected to V', vi: 'được dự đoán sẽ', exVi: 'Dân số thế giới được dự đoán sẽ đạt mười tỷ người.', ex: 'The world\'s population is expected to reach ten billion.' },
      { level: 'adv', skill: 'W', pattern: 'There is a growing tendency for sb to V', vi: 'ngày càng có xu hướng ai đó làm gì', exVi: 'Ngày càng có xu hướng các cặp vợ chồng sinh ít con hơn.', ex: 'There is a growing tendency for couples to have fewer children.' },
      { level: 'adv', skill: 'W', pattern: 'be set to V', vi: 'chắc chắn sẽ, sắp sửa', exVi: 'Trí tuệ nhân tạo chắc chắn sẽ thay đổi thị trường lao động.', ex: 'Artificial intelligence is set to transform the job market.' },
    ],
  },
  {
    id: 'p12',
    no: 12,
    vi: 'Collocation chủ đề thông dụng',
    en: 'Common topic collocations',
    items: [
      { level: 'basic', skill: 'W·S', pattern: 'play an important role in sth', vi: 'đóng vai trò quan trọng trong', exVi: 'Giáo viên đóng vai trò quan trọng trong việc định hình tương lai của trẻ.', ex: 'Teachers play an important role in shaping children\'s futures.' },
      { level: 'basic', skill: 'W·S', pattern: 'take care of sb / sth', vi: 'chăm sóc', exVi: 'Con cái trưởng thành nên chăm sóc cha mẹ già.', ex: 'Adult children should take care of their elderly parents.' },
      { level: 'basic', skill: 'W·S', pattern: 'pay attention to sth', vi: 'chú ý đến', exVi: 'Cha mẹ nên chú ý đến những gì con cái xem.', ex: 'Parents should pay attention to what their children watch.' },
      { level: 'mid', skill: 'W', pattern: 'raise awareness of sth', vi: 'nâng cao nhận thức về', exVi: 'Các chiến dịch có thể nâng cao nhận thức về sức khỏe tinh thần.', ex: 'Campaigns can raise awareness of mental health issues.' },
      { level: 'mid', skill: 'W', pattern: 'take responsibility for sth', vi: 'chịu trách nhiệm về', exVi: 'Doanh nghiệp phải chịu trách nhiệm về lượng rác họ thải ra.', ex: 'Companies must take responsibility for the waste they produce.' },
      { level: 'mid', skill: 'W', pattern: 'meet the demand for sth', vi: 'đáp ứng nhu cầu về', exVi: 'Các thành phố xây thêm căn hộ để đáp ứng nhu cầu nhà ở.', ex: 'Cities are building more flats to meet the demand for housing.' },
      { level: 'mid', skill: 'W', pattern: 'make a contribution to sth', vi: 'đóng góp cho', exVi: 'Người nhập cư đóng góp đáng kể cho nền kinh tế.', ex: 'Immigrants make a significant contribution to the economy.' },
      { level: 'mid', skill: 'W', pattern: 'a pressing issue / a growing concern', vi: 'vấn đề cấp bách / mối lo ngại ngày càng lớn', exVi: 'Ô nhiễm nhựa đã trở thành vấn đề cấp bách trên toàn thế giới.', ex: 'Plastic pollution has become a pressing issue worldwide.' },
      { level: 'adv', skill: 'W', pattern: 'bridge the gap between A and B', vi: 'thu hẹp khoảng cách giữa A và B', exVi: 'Học online có thể thu hẹp khoảng cách giữa học sinh nông thôn và thành thị.', ex: 'Online learning can bridge the gap between rural and urban students.' },
      { level: 'adv', skill: 'W', pattern: 'pose a (serious) threat to sth', vi: 'đe dọa (nghiêm trọng) đến', exVi: 'Biến đổi khí hậu đe dọa nghiêm trọng an ninh lương thực.', ex: 'Climate change poses a serious threat to food security.' },
      { level: 'adv', skill: 'W·S', pattern: 'a double-edged sword', vi: 'con dao hai lưỡi', exVi: 'Mạng xã hội là con dao hai lưỡi với giới trẻ.', ex: 'Social media is a double-edged sword for young people.' },
      { level: 'adv', skill: 'W', pattern: 'have far-reaching consequences for sth', vi: 'có hậu quả sâu rộng đối với', exVi: 'Phá rừng có hậu quả sâu rộng đối với khí hậu toàn cầu.', ex: 'Deforestation has far-reaching consequences for the global climate.' },
    ],
  },
]

export const findPatternGroup = (id: string) => PATTERN_GROUPS.find((g) => g.id === id)
