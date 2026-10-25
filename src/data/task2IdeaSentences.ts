// Câu hoàn chỉnh cho từng "Ý triển khai" của 12 hướng (Bước 2 · Luyện Task 2) — phần BỔ SUNG, không có trong
// DATA/huong-dan-song-ngu.html. Câu viết trung tính về chủ đề ("this problem", "this policy", "this change"…)
// nên ráp được vào mọi đề; chữ trong **…** là cụm của ý triển khai trong tài liệu.
// Khóa: id hướng → câu tiếng Anh của ý, đúng chữ trong tài liệu (bỏ **). Tài liệu đổi chữ của một ý thì câu
// ở đây thôi hiện, thay vì hiện lệch sang ý khác.
import type { BiText } from './task2DirectionGuides'

export const IDEA_SENTENCES: Record<string, Record<string, BiText[]>> = {
  'dir.government': {
    'Introduce laws and regulations.': [
      {
        en: 'The government should introduce stricter **laws and regulations** to tackle this problem at its root.',
        vi: 'Chính phủ nên ban hành luật và quy định chặt chẽ hơn để giải quyết tận gốc vấn đề này.',
      },
      {
        en: 'Clear **laws and regulations** would set limits on harmful behaviour and make it easier for the authorities to take action.',
        vi: 'Luật và quy định rõ ràng sẽ đặt giới hạn cho hành vi có hại và giúp chính quyền dễ xử lý hơn.',
      },
    ],
    'Increase public funding and invest in public services.': [
      {
        en: 'Governments should **increase public funding** for the services that help to solve this issue.',
        vi: 'Chính phủ nên tăng ngân sách cho các dịch vụ giúp giải quyết vấn đề này.',
      },
      {
        en: 'With more money invested in public services, ordinary citizens would have better access to the support they need.',
        vi: 'Khi đầu tư nhiều hơn vào dịch vụ công, người dân bình thường sẽ dễ tiếp cận sự hỗ trợ họ cần hơn.',
      },
    ],
    'Raise public awareness through national campaigns.': [
      {
        en: 'The authorities could **raise public awareness** of this issue through national campaigns on television and social media.',
        vi: 'Chính quyền có thể nâng cao nhận thức của người dân về vấn đề này qua các chiến dịch quốc gia trên truyền hình và mạng xã hội.',
      },
      {
        en: '**Raising public awareness** is often cheaper than punishment, since people who understand the consequences tend to change their behaviour voluntarily.',
        vi: 'Nâng cao nhận thức thường rẻ hơn xử phạt, vì người hiểu rõ hậu quả thường tự nguyện thay đổi hành vi.',
      },
    ],
    'Develop infrastructure such as roads, hospitals and schools.': [
      {
        en: 'The government should **develop infrastructure** such as roads, hospitals and schools, so that every region can benefit.',
        vi: 'Chính phủ nên phát triển cơ sở hạ tầng như đường sá, bệnh viện và trường học để mọi vùng đều được hưởng lợi.',
      },
      {
        en: "Better **infrastructure** would not only improve people's daily lives but also attract investment to less developed areas.",
        vi: 'Cơ sở hạ tầng tốt hơn không chỉ cải thiện đời sống hằng ngày mà còn thu hút đầu tư về những vùng kém phát triển.',
      },
    ],
    'Provide subsidies for good behaviour or impose taxes on harmful products.': [
      {
        en: 'The state could **provide subsidies** for positive choices and **impose taxes** on products that cause harm.',
        vi: 'Nhà nước có thể trợ cấp cho các lựa chọn tích cực và đánh thuế các sản phẩm gây hại.',
      },
      {
        en: 'Such financial incentives would encourage people to make better decisions without banning anything outright.',
        vi: 'Những ưu đãi tài chính như vậy sẽ khuyến khích người dân lựa chọn tốt hơn mà không cần cấm hẳn điều gì.',
      },
    ],
    'Monitor compliance and enforce regulations with fines.': [
      {
        en: 'Laws are only effective if the authorities **enforce regulations** strictly and fine those who break them.',
        vi: 'Luật chỉ hiệu quả khi chính quyền thực thi quy định nghiêm ngặt và phạt tiền người vi phạm.',
      },
      {
        en: 'Regular inspections would ensure that both individuals and companies comply with the rules.',
        vi: 'Kiểm tra thường xuyên sẽ bảo đảm cả cá nhân lẫn doanh nghiệp tuân thủ quy định.',
      },
    ],
  },

  'dir.individuals': {
    'Change personal habits and behaviour.': [
      {
        en: 'Each individual can **change their personal habits** to reduce the impact of this problem.',
        vi: 'Mỗi người có thể thay đổi thói quen của mình để giảm tác động của vấn đề này.',
      },
      {
        en: 'Small changes in daily behaviour may seem insignificant, but when millions of people make them, the overall effect is considerable.',
        vi: 'Thay đổi nhỏ trong hành vi hằng ngày có vẻ không đáng kể, nhưng khi hàng triệu người cùng làm, tác động tổng thể là rất lớn.',
      },
    ],
    'Take responsibility for their own choices.': [
      {
        en: 'Adults should **take responsibility** for their own choices rather than blaming the government or society.',
        vi: 'Người trưởng thành nên chịu trách nhiệm cho lựa chọn của mình thay vì đổ lỗi cho chính phủ hay xã hội.',
      },
      {
        en: 'When people **take responsibility** for their actions, they tend to think more carefully about the consequences.',
        vi: 'Khi tự chịu trách nhiệm cho hành động của mình, con người thường cân nhắc hậu quả kỹ hơn.',
      },
    ],
    'Improve their knowledge and skills.': [
      {
        en: 'Individuals can **improve their knowledge and skills** through courses, books and online resources.',
        vi: 'Mỗi người có thể nâng cao kiến thức và kỹ năng qua các khóa học, sách và tài liệu trực tuyến.',
      },
      {
        en: 'Well-informed people are better able to make sensible decisions and adapt to change.',
        vi: 'Người có hiểu biết sẽ dễ đưa ra quyết định hợp lý và thích nghi với thay đổi hơn.',
      },
    ],
    'Obey the law.': [
      {
        en: 'Every citizen has a duty to **obey the law**, even when no one is watching.',
        vi: 'Mọi công dân có nghĩa vụ tuân thủ pháp luật, kể cả khi không ai nhìn thấy.',
      },
      {
        en: 'If more people **obeyed the law**, the authorities could spend less on enforcement and more on public services.',
        vi: 'Nếu nhiều người tuân thủ pháp luật hơn, chính quyền có thể bớt chi cho việc cưỡng chế và chi nhiều hơn cho dịch vụ công.',
      },
    ],
    'Use resources responsibly, such as water and electricity.': [
      {
        en: 'People should **use resources responsibly**, for example by saving water and switching off unused appliances.',
        vi: 'Mọi người nên sử dụng tài nguyên hợp lý, ví dụ tiết kiệm nước và tắt thiết bị không dùng.',
      },
      {
        en: '**Using resources responsibly** not only protects the environment but also lowers household bills.',
        vi: 'Sử dụng tài nguyên hợp lý không chỉ bảo vệ môi trường mà còn giảm chi phí của gia đình.',
      },
    ],
    'Take the initiative instead of relying on others to solve problems.': [
      {
        en: 'Rather than waiting for the government to act, individuals should **take the initiative** in solving this problem.',
        vi: 'Thay vì chờ chính phủ hành động, mỗi người nên chủ động giải quyết vấn đề này.',
      },
      {
        en: 'People who **take the initiative** often inspire those around them to follow their example.',
        vi: 'Người chủ động thường truyền cảm hứng cho những người xung quanh làm theo.',
      },
    ],
  },

  'dir.schools': {
    'Improve the quality of education.': [
      {
        en: 'Schools should **improve the quality of education** so that students are prepared for real-world challenges.',
        vi: 'Nhà trường nên nâng cao chất lượng giáo dục để học sinh sẵn sàng cho những thử thách thực tế.',
      },
      {
        en: 'Well-trained teachers and up-to-date materials are the key to **improving the quality of education**.',
        vi: 'Giáo viên được đào tạo tốt và tài liệu cập nhật là chìa khóa để nâng cao chất lượng giáo dục.',
      },
    ],
    'Teach practical skills alongside theory.': [
      {
        en: 'Schools ought to **teach practical skills** alongside theory, so that students can apply what they learn.',
        vi: 'Nhà trường nên dạy kỹ năng thực tế bên cạnh lý thuyết để học sinh vận dụng được điều đã học.',
      },
      {
        en: 'Students who learn **practical skills** at school are more likely to find jobs after graduation.',
        vi: 'Học sinh được học kỹ năng thực tế ở trường dễ tìm việc hơn sau khi tốt nghiệp.',
      },
    ],
    'Organise extracurricular activities.': [
      {
        en: 'Schools could **organise extracurricular activities**, such as clubs, sports and volunteer projects, related to this issue.',
        vi: 'Nhà trường có thể tổ chức hoạt động ngoại khóa như câu lạc bộ, thể thao và dự án tình nguyện liên quan tới vấn đề này.',
      },
      {
        en: '**Extracurricular activities** give students hands-on experience that classroom lessons cannot provide.',
        vi: 'Hoạt động ngoại khóa cho học sinh trải nghiệm thực tế mà giờ học trên lớp không mang lại được.',
      },
    ],
    "Raise students' awareness and sense of responsibility.": [
      {
        en: "Schools play a key role in **raising students' awareness** of this problem from an early age.",
        vi: 'Nhà trường đóng vai trò quan trọng trong việc nâng cao nhận thức của học sinh về vấn đề này từ sớm.',
      },
      {
        en: 'Children who develop a sense of responsibility at school are likely to become responsible adults.',
        vi: 'Trẻ hình thành ý thức trách nhiệm ở trường có khả năng trở thành người lớn có trách nhiệm.',
      },
    ],
    'Provide career guidance for students.': [
      {
        en: 'Schools should **provide career guidance** to help students choose a suitable path after graduation.',
        vi: 'Nhà trường nên hướng nghiệp để giúp học sinh chọn con đường phù hợp sau khi tốt nghiệp.',
      },
      {
        en: 'Without proper **career guidance**, many young people choose courses that match neither their abilities nor the job market.',
        vi: 'Thiếu hướng nghiệp phù hợp, nhiều người trẻ chọn ngành không hợp với năng lực lẫn thị trường việc làm.',
      },
    ],
    'Develop digital literacy and critical thinking.': [
      {
        en: "Schools need to develop students' **digital literacy** and **critical thinking** so that they can judge information for themselves.",
        vi: 'Nhà trường cần phát triển kỹ năng công nghệ và tư duy phản biện để học sinh tự đánh giá được thông tin.',
      },
      {
        en: 'Students with strong **critical thinking** skills are less likely to be misled by false information online.',
        vi: 'Học sinh có tư duy phản biện tốt ít bị thông tin sai lệch trên mạng đánh lừa hơn.',
      },
    ],
  },

  'dir.parents': {
    'Set a good example for their children.': [
      {
        en: 'Parents should **set a good example** for their children, because children copy what they see at home.',
        vi: 'Cha mẹ nên làm gương cho con, vì trẻ bắt chước những gì chúng thấy ở nhà.',
      },
      {
        en: 'If parents behave responsibly themselves, their children are far more likely to follow their example.',
        vi: 'Nếu cha mẹ tự cư xử có trách nhiệm, con cái sẽ dễ noi theo hơn nhiều.',
      },
    ],
    "Monitor their children's Internet use.": [
      {
        en: "Parents need to **monitor their children's Internet use** to protect them from harmful content.",
        vi: 'Cha mẹ cần giám sát việc dùng Internet của con để bảo vệ con khỏi nội dung có hại.',
      },
      {
        en: 'Setting clear rules about screen time can prevent children from becoming addicted to their devices.',
        vi: 'Đặt quy tắc rõ ràng về thời gian dùng màn hình có thể ngăn trẻ nghiện thiết bị.',
      },
    ],
    'Teach life skills and moral values.': [
      {
        en: 'Families are the first place where children learn **life skills and moral values**.',
        vi: 'Gia đình là nơi đầu tiên trẻ học kỹ năng sống và giá trị đạo đức.',
      },
      {
        en: 'Parents who **teach moral values** at home help their children make the right decisions later in life.',
        vi: 'Cha mẹ dạy giá trị đạo đức ở nhà giúp con đưa ra quyết định đúng đắn sau này.',
      },
    ],
    'Spend quality time with their children.': [
      {
        en: 'Parents should **spend quality time** with their children, however busy they are.',
        vi: 'Cha mẹ nên dành thời gian chất lượng cho con, dù bận đến đâu.',
      },
      {
        en: 'Children who **spend quality time** with their parents tend to feel more secure and are less likely to develop behavioural problems.',
        vi: 'Trẻ được dành thời gian chất lượng với cha mẹ thường cảm thấy an toàn hơn và ít gặp vấn đề về hành vi hơn.',
      },
    ],
    'Encourage independence.': [
      {
        en: 'Parents should **encourage independence** by letting children make their own decisions and learn from their mistakes.',
        vi: 'Cha mẹ nên khuyến khích con tự lập bằng cách để con tự quyết định và học từ sai lầm.',
      },
      {
        en: 'Young people who have been raised to be independent cope better with challenges as adults.',
        vi: 'Người trẻ được nuôi dạy tự lập sẽ đối mặt với thử thách tốt hơn khi trưởng thành.',
      },
    ],
    'Provide emotional and academic support.': [
      {
        en: 'Parents can provide **emotional and academic support** by listening to their children and helping with schoolwork.',
        vi: 'Cha mẹ có thể hỗ trợ tinh thần và việc học bằng cách lắng nghe con và giúp con làm bài.',
      },
      {
        en: 'With strong **emotional support** at home, children are better able to deal with pressure at school.',
        vi: 'Có chỗ dựa tinh thần vững chắc ở nhà, trẻ đối phó với áp lực ở trường tốt hơn.',
      },
    ],
  },

  'dir.business': {
    'Provide staff training and upskilling.': [
      {
        en: 'Companies should **provide staff training** so that employees can keep up with new demands.',
        vi: 'Doanh nghiệp nên đào tạo nhân viên để họ theo kịp những yêu cầu mới.',
      },
      {
        en: 'Investing in **staff training** benefits both sides: workers improve their careers, while businesses become more competitive.',
        vi: 'Đầu tư đào tạo nhân viên có lợi cho cả hai bên: người lao động phát triển sự nghiệp, còn doanh nghiệp cạnh tranh hơn.',
      },
    ],
    'Improve working conditions.': [
      {
        en: 'Employers have a duty to **improve working conditions**, for example by offering safer workplaces and reasonable hours.',
        vi: 'Người sử dụng lao động có nghĩa vụ cải thiện điều kiện làm việc, ví dụ đảm bảo nơi làm việc an toàn hơn và giờ làm hợp lý.',
      },
      {
        en: 'Better **working conditions** lead to happier staff, lower turnover and higher productivity.',
        vi: 'Điều kiện làm việc tốt hơn giúp nhân viên hài lòng hơn, ít nghỉ việc hơn và năng suất cao hơn.',
      },
    ],
    'Adopt technology to boost productivity.': [
      {
        en: 'Businesses can **adopt technology** to **boost productivity** and reduce costs.',
        vi: 'Doanh nghiệp có thể áp dụng công nghệ để tăng năng suất và giảm chi phí.',
      },
      {
        en: 'Companies that **adopt new technology** early often gain an advantage over their competitors.',
        vi: 'Công ty áp dụng công nghệ mới sớm thường có lợi thế so với đối thủ.',
      },
    ],
    "Protect workers' rights.": [
      {
        en: "Firms must **protect workers' rights**, including fair pay and the right to rest.",
        vi: 'Doanh nghiệp phải bảo vệ quyền lợi người lao động, gồm lương công bằng và quyền được nghỉ ngơi.',
      },
      {
        en: "When **workers' rights** are respected, employees are more loyal and committed to their company.",
        vi: 'Khi quyền lợi người lao động được tôn trọng, nhân viên trung thành và gắn bó với công ty hơn.',
      },
    ],
    'Practise corporate social responsibility.': [
      {
        en: 'Large companies should practise **corporate social responsibility** by giving back to the communities they operate in.',
        vi: 'Các công ty lớn nên thực hiện trách nhiệm xã hội bằng cách đóng góp lại cho cộng đồng nơi họ hoạt động.',
      },
      {
        en: "**Corporate social responsibility** also improves a company's reputation and attracts customers.",
        vi: 'Trách nhiệm xã hội của doanh nghiệp còn nâng cao uy tín công ty và thu hút khách hàng.',
      },
    ],
    'Cut waste and pollution in production.': [
      {
        en: 'Manufacturers should **cut waste and pollution** in production by using cleaner methods.',
        vi: 'Nhà sản xuất nên giảm chất thải và ô nhiễm trong sản xuất bằng các phương pháp sạch hơn.',
      },
      {
        en: '**Cutting waste** often saves companies money as well as protecting the environment.',
        vi: 'Giảm chất thải thường giúp doanh nghiệp vừa tiết kiệm tiền vừa bảo vệ môi trường.',
      },
    ],
  },

  'dir.health': {
    'Improve physical health.': [
      {
        en: "This change would **improve people's physical health**, as they would become more active.",
        vi: 'Thay đổi này sẽ cải thiện sức khỏe thể chất của mọi người, vì họ sẽ vận động nhiều hơn.',
      },
      {
        en: 'Regular exercise and a balanced diet are the most effective ways to **improve physical health**.',
        vi: 'Tập thể dục đều đặn và ăn uống cân bằng là cách hiệu quả nhất để cải thiện sức khỏe thể chất.',
      },
    ],
    'Protect mental wellbeing.': [
      {
        en: 'Reducing stress at work and school is essential to **protect mental wellbeing**.',
        vi: 'Giảm căng thẳng ở nơi làm việc và trường học là điều thiết yếu để bảo vệ sức khỏe tinh thần.',
      },
      {
        en: 'This trend may harm **mental wellbeing**, as people feel increasingly isolated and anxious.',
        vi: 'Xu hướng này có thể gây hại cho sức khỏe tinh thần, vì con người ngày càng cảm thấy cô lập và lo âu.',
      },
    ],
    'Reduce the risk of disease.': [
      {
        en: 'This measure would **reduce the risk of disease**, especially among children and the elderly.',
        vi: 'Biện pháp này sẽ giảm nguy cơ mắc bệnh, nhất là ở trẻ em và người già.',
      },
      {
        en: 'Healthy habits formed early in life significantly **reduce the risk of** serious illness later on.',
        vi: 'Thói quen lành mạnh hình thành từ sớm giảm đáng kể nguy cơ mắc bệnh nặng về sau.',
      },
    ],
    'Cut long-term medical costs.': [
      {
        en: 'Preventing illness is far cheaper than treating it, so this approach would **cut long-term medical costs**.',
        vi: 'Phòng bệnh rẻ hơn nhiều so với chữa bệnh, nên cách làm này sẽ giảm chi phí y tế lâu dài.',
      },
      {
        en: 'The money saved on **medical costs** could then be spent on education or other public services.',
        vi: 'Tiền tiết kiệm từ chi phí y tế có thể được dùng cho giáo dục hoặc các dịch vụ công khác.',
      },
    ],
    'Improve quality of life.': [
      {
        en: 'Ultimately, this development would **improve the quality of life** of millions of people.',
        vi: 'Xét cho cùng, sự phát triển này sẽ nâng cao chất lượng cuộc sống của hàng triệu người.',
      },
      {
        en: 'Healthier people enjoy a better **quality of life** and can contribute more to society.',
        vi: 'Người khỏe mạnh hơn có chất lượng cuộc sống tốt hơn và đóng góp được nhiều hơn cho xã hội.',
      },
    ],
    'Ease pressure on the healthcare system.': [
      {
        en: 'If fewer people fell ill, this would **ease pressure on the healthcare system**.',
        vi: 'Nếu ít người mắc bệnh hơn, điều này sẽ giảm áp lực cho hệ thống y tế.',
      },
      {
        en: 'When hospitals are less overcrowded, doctors can spend more time on the patients who really need care.',
        vi: 'Khi bệnh viện bớt quá tải, bác sĩ có thể dành nhiều thời gian hơn cho người bệnh thực sự cần chăm sóc.',
      },
    ],
  },

  'dir.economy': {
    'Create jobs.': [
      {
        en: 'This policy would **create jobs** for thousands of local people.',
        vi: 'Chính sách này sẽ tạo việc làm cho hàng nghìn người dân địa phương.',
      },
      {
        en: 'New industries not only **create jobs** but also help to reduce unemployment and poverty.',
        vi: 'Các ngành mới không chỉ tạo việc làm mà còn góp phần giảm thất nghiệp và nghèo đói.',
      },
    ],
    'Raise incomes and living standards.': [
      {
        en: 'Economic growth of this kind would **raise incomes and living standards** across the country.',
        vi: 'Tăng trưởng kinh tế kiểu này sẽ tăng thu nhập và mức sống trên cả nước.',
      },
      {
        en: 'As **incomes rise**, families can afford better housing, healthcare and education.',
        vi: 'Khi thu nhập tăng, các gia đình có đủ điều kiện chi trả nhà ở, y tế và giáo dục tốt hơn.',
      },
    ],
    'Lower production costs.': [
      {
        en: 'New methods help businesses **lower production costs**, which makes their products cheaper for consumers.',
        vi: 'Phương pháp mới giúp doanh nghiệp giảm chi phí sản xuất, khiến sản phẩm rẻ hơn cho người tiêu dùng.',
      },
      {
        en: '**Lower production costs** allow companies to compete more effectively in international markets.',
        vi: 'Chi phí sản xuất thấp hơn giúp công ty cạnh tranh hiệu quả hơn trên thị trường quốc tế.',
      },
    ],
    'Boost labour productivity.': [
      {
        en: 'Better training and equipment would **boost labour productivity**.',
        vi: 'Đào tạo và trang thiết bị tốt hơn sẽ tăng năng suất lao động.',
      },
      {
        en: 'When **productivity** rises, the economy can grow without people having to work longer hours.',
        vi: 'Khi năng suất tăng, nền kinh tế có thể tăng trưởng mà người lao động không phải làm thêm giờ.',
      },
    ],
    'Attract investment.': [
      {
        en: 'A stable and skilled society is more likely to **attract investment** from both domestic and foreign companies.',
        vi: 'Một xã hội ổn định và có lao động lành nghề dễ thu hút đầu tư từ cả công ty trong nước lẫn nước ngoài.',
      },
      {
        en: 'This **investment** would in turn bring new technology and jobs to the country.',
        vi: 'Nguồn đầu tư này sẽ lại mang công nghệ và việc làm mới về cho đất nước.',
      },
    ],
    'Ease the financial burden on citizens or the government.': [
      {
        en: 'This measure would **ease the financial burden** on ordinary families.',
        vi: 'Biện pháp này sẽ giảm gánh nặng tài chính cho các gia đình bình thường.',
      },
      {
        en: 'If fewer people needed public support, the government could **ease the financial burden** on taxpayers.',
        vi: 'Nếu ít người cần trợ cấp hơn, chính phủ có thể giảm gánh nặng tài chính cho người nộp thuế.',
      },
    ],
  },

  'dir.society': {
    'Strengthen community ties.': [
      {
        en: 'Shared activities like this help to **strengthen community ties** between neighbours.',
        vi: 'Những hoạt động chung như thế này giúp tăng cường gắn kết giữa hàng xóm với nhau.',
      },
      {
        en: 'Communities with strong **ties** are better able to support their members in difficult times.',
        vi: 'Cộng đồng gắn kết chặt chẽ có thể hỗ trợ các thành viên tốt hơn trong lúc khó khăn.',
      },
    ],
    'Reduce inequality.': [
      {
        en: 'This policy could **reduce inequality** by giving everyone the same opportunities.',
        vi: 'Chính sách này có thể giảm bất bình đẳng bằng cách trao cho mọi người cơ hội như nhau.',
      },
      {
        en: 'Without action, **inequality** will continue to grow, which may lead to social tension.',
        vi: 'Nếu không hành động, bất bình đẳng sẽ tiếp tục gia tăng, có thể dẫn đến căng thẳng xã hội.',
      },
    ],
    'Support vulnerable groups.': [
      {
        en: 'Society has a duty to **support vulnerable groups**, such as the elderly, the disabled and low-income families.',
        vi: 'Xã hội có nghĩa vụ hỗ trợ nhóm yếu thế như người già, người khuyết tật và gia đình thu nhập thấp.',
      },
      {
        en: 'Without help, **vulnerable groups** are usually the first to suffer from this problem.',
        vi: 'Nếu không được giúp đỡ, nhóm yếu thế thường là những người đầu tiên chịu ảnh hưởng của vấn đề này.',
      },
    ],
    'Foster civic awareness.': [
      {
        en: 'Public campaigns can **foster civic awareness**, so that people care more about the common good.',
        vi: 'Các chiến dịch cộng đồng có thể nâng cao ý thức công dân để mọi người quan tâm hơn tới lợi ích chung.',
      },
      {
        en: 'Citizens with strong **civic awareness** are more willing to follow rules and help others.',
        vi: 'Công dân có ý thức cộng đồng cao sẵn lòng tuân thủ quy tắc và giúp đỡ người khác hơn.',
      },
    ],
    'Create safer neighbourhoods.': [
      {
        en: 'This approach would help to **create safer neighbourhoods** for families and children.',
        vi: 'Cách làm này sẽ giúp xây dựng khu dân cư an toàn hơn cho gia đình và trẻ em.',
      },
      {
        en: 'In **safer neighbourhoods**, people feel more comfortable going out and getting to know each other.',
        vi: 'Ở khu dân cư an toàn hơn, mọi người thoải mái ra ngoài và làm quen với nhau hơn.',
      },
    ],
    'Promote fairness and social inclusion.': [
      {
        en: 'Governments should **promote fairness and social inclusion** so that no one is left behind.',
        vi: 'Chính phủ nên thúc đẩy công bằng và hòa nhập xã hội để không ai bị bỏ lại phía sau.',
      },
      {
        en: 'A society that **promotes social inclusion** is usually more stable and peaceful.',
        vi: 'Một xã hội thúc đẩy hòa nhập thường ổn định và hòa bình hơn.',
      },
    ],
  },

  'dir.environment': {
    'Reduce air and water pollution.': [
      {
        en: 'Stricter controls on factories would **reduce air and water pollution**.',
        vi: 'Kiểm soát nhà máy chặt chẽ hơn sẽ giảm ô nhiễm không khí và nguồn nước.',
      },
      {
        en: 'Cleaner air and water would in turn lead to fewer health problems among local residents.',
        vi: 'Không khí và nguồn nước sạch hơn sẽ kéo theo ít vấn đề sức khỏe hơn cho người dân địa phương.',
      },
    ],
    'Conserve natural resources.': [
      {
        en: 'We must **conserve natural resources** such as forests, water and minerals for future generations.',
        vi: 'Chúng ta phải bảo tồn tài nguyên thiên nhiên như rừng, nước và khoáng sản cho thế hệ sau.',
      },
      {
        en: 'Using less and reusing more are simple ways to **conserve natural resources**.',
        vi: 'Dùng ít hơn và tái sử dụng nhiều hơn là cách đơn giản để bảo tồn tài nguyên thiên nhiên.',
      },
    ],
    'Cut carbon emissions.': [
      {
        en: 'Switching to public transport would significantly **cut carbon emissions**.',
        vi: 'Chuyển sang phương tiện công cộng sẽ giảm đáng kể khí thải carbon.',
      },
      {
        en: 'Unless countries **cut carbon emissions** now, the effects of climate change will become more severe.',
        vi: 'Nếu các nước không giảm khí thải carbon ngay bây giờ, tác động của biến đổi khí hậu sẽ ngày càng nghiêm trọng.',
      },
    ],
    'Promote recycling and the use of clean energy.': [
      {
        en: 'Local authorities should **promote recycling** and the use of **clean energy** such as solar and wind power.',
        vi: 'Chính quyền địa phương nên khuyến khích tái chế và dùng năng lượng sạch như điện mặt trời và điện gió.',
      },
      {
        en: '**Clean energy** reduces our dependence on fossil fuels, which are both polluting and limited.',
        vi: 'Năng lượng sạch giảm sự phụ thuộc vào nhiên liệu hóa thạch, vốn vừa gây ô nhiễm vừa có hạn.',
      },
    ],
    'Protect biodiversity.': [
      {
        en: 'Creating national parks and protected areas helps to **protect biodiversity**.',
        vi: 'Lập vườn quốc gia và khu bảo tồn giúp bảo vệ đa dạng sinh học.',
      },
      {
        en: 'Once a species disappears, it is lost forever, so **protecting biodiversity** must be a priority.',
        vi: 'Một loài đã biến mất là mất mãi mãi, nên bảo vệ đa dạng sinh học phải được ưu tiên.',
      },
    ],
    'Achieve sustainable development.': [
      {
        en: 'Economic growth and environmental protection must go hand in hand if we want to **achieve sustainable development**.',
        vi: 'Tăng trưởng kinh tế và bảo vệ môi trường phải đi đôi với nhau nếu muốn đạt được phát triển bền vững.',
      },
      {
        en: "**Sustainable development** meets today's needs without damaging the prospects of future generations.",
        vi: 'Phát triển bền vững đáp ứng nhu cầu hôm nay mà không làm tổn hại triển vọng của thế hệ sau.',
      },
    ],
  },

  'dir.technology': {
    'Automate tasks.': [
      {
        en: 'Modern technology can **automate tasks** that are repetitive or dangerous.',
        vi: 'Công nghệ hiện đại có thể tự động hóa các công việc lặp lại hoặc nguy hiểm.',
      },
      {
        en: 'When machines **automate routine tasks**, workers can focus on more creative and valuable work.',
        vi: 'Khi máy móc tự động hóa việc lặp lại, người lao động có thể tập trung vào công việc sáng tạo và có giá trị hơn.',
      },
    ],
    'Access information instantly.': [
      {
        en: 'The Internet allows people to **access information instantly**, wherever they are.',
        vi: 'Internet cho phép mọi người tiếp cận thông tin tức thì, dù ở bất cứ đâu.',
      },
      {
        en: 'Being able to **access information instantly** helps students learn faster and make better-informed decisions.',
        vi: 'Có thể tiếp cận thông tin tức thì giúp học sinh học nhanh hơn và quyết định sáng suốt hơn.',
      },
    ],
    'Improve communication and connection.': [
      {
        en: 'Technology has greatly **improved communication** between people in different countries.',
        vi: 'Công nghệ đã cải thiện đáng kể việc giao tiếp giữa người ở các quốc gia khác nhau.',
      },
      {
        en: 'Video calls and social media help families stay connected even when they live far apart.',
        vi: 'Gọi video và mạng xã hội giúp các gia đình giữ liên lạc dù sống xa nhau.',
      },
    ],
    'Increase efficiency and accuracy.': [
      {
        en: 'Computers **increase efficiency and accuracy** in areas such as banking, medicine and manufacturing.',
        vi: 'Máy tính tăng hiệu quả và độ chính xác trong các lĩnh vực như ngân hàng, y tế và sản xuất.',
      },
      {
        en: 'Greater **accuracy** means fewer costly mistakes and better results for customers.',
        vi: 'Độ chính xác cao hơn nghĩa là ít sai sót tốn kém hơn và kết quả tốt hơn cho khách hàng.',
      },
    ],
    'Pose privacy risks.': [
      {
        en: 'However, the growing use of online services may **pose privacy risks** to users.',
        vi: 'Tuy nhiên, việc dùng dịch vụ trực tuyến ngày càng nhiều có thể gây rủi ro về quyền riêng tư cho người dùng.',
      },
      {
        en: "Personal data can be stolen or sold without people's consent, which **poses serious privacy risks**.",
        vi: 'Dữ liệu cá nhân có thể bị đánh cắp hoặc bán đi mà không có sự đồng ý của người dùng, gây rủi ro nghiêm trọng về quyền riêng tư.',
      },
    ],
    'Lead to overdependence on technology and job losses.': [
      {
        en: 'Relying too much on machines may lead to **overdependence on technology**, as people gradually lose basic skills.',
        vi: 'Dựa quá nhiều vào máy móc có thể dẫn đến phụ thuộc vào công nghệ, khi con người dần mất kỹ năng cơ bản.',
      },
      {
        en: 'In some industries, automation could result in **job losses** for low-skilled workers.',
        vi: 'Ở một số ngành, tự động hóa có thể khiến lao động tay nghề thấp mất việc.',
      },
    ],
  },

  'dir.time': {
    'Save time.': [
      {
        en: 'This option would **save** people a great deal of **time**, which they could spend on more important things.',
        vi: 'Lựa chọn này sẽ giúp mọi người tiết kiệm rất nhiều thời gian để dành cho những việc quan trọng hơn.',
      },
      {
        en: 'For busy workers, anything that helps them **save time** is extremely valuable.',
        vi: 'Với người lao động bận rộn, bất cứ thứ gì giúp họ tiết kiệm thời gian đều vô cùng quý giá.',
      },
    ],
    'Reduce the effort of daily tasks.': [
      {
        en: 'Modern services **reduce the effort of daily tasks** such as shopping, cooking and paying bills.',
        vi: 'Các dịch vụ hiện đại giảm công sức cho việc thường ngày như mua sắm, nấu ăn và thanh toán hóa đơn.',
      },
      {
        en: 'With less **effort** spent on routine chores, people have more energy for work and study.',
        vi: 'Bớt công sức cho việc vặt thường ngày, mọi người có thêm năng lượng cho công việc và học tập.',
      },
    ],
    'Free up time for family.': [
      {
        en: 'This change would **free up time for family** and personal interests.',
        vi: 'Thay đổi này sẽ dành ra thêm thời gian cho gia đình và sở thích cá nhân.',
      },
      {
        en: "When parents **free up time for family**, they can be more involved in their children's lives.",
        vi: 'Khi cha mẹ có thêm thời gian cho gia đình, họ có thể tham gia nhiều hơn vào cuộc sống của con.',
      },
    ],
    'Improve work–life balance.': [
      {
        en: 'Flexible working hours would **improve work–life balance** for many employees.',
        vi: 'Giờ làm việc linh hoạt sẽ cải thiện cân bằng công việc và cuộc sống cho nhiều nhân viên.',
      },
      {
        en: 'A better **work–life balance** reduces stress and makes people more productive at work.',
        vi: 'Cân bằng công việc và cuộc sống tốt hơn giảm căng thẳng và giúp mọi người làm việc hiệu quả hơn.',
      },
    ],
    'Cut commuting and waiting time.': [
      {
        en: 'Working from home and using online services **cut commuting and waiting time** significantly.',
        vi: 'Làm việc tại nhà và dùng dịch vụ trực tuyến giảm đáng kể thời gian đi lại và chờ đợi.',
      },
      {
        en: 'Less time spent **commuting** means less stress and fewer cars on the road.',
        vi: 'Bớt thời gian đi lại nghĩa là bớt căng thẳng và ít xe cộ trên đường hơn.',
      },
    ],
  },

  'dir.longterm': {
    'Short term: initial costs, an adjustment period and time spent on training.': [
      {
        en: 'In the short term, this solution would involve high **initial costs** and **an adjustment period**.',
        vi: 'Trước mắt, giải pháp này đòi hỏi chi phí ban đầu cao và một giai đoạn thích nghi.',
      },
      {
        en: 'People may need time and training before they get used to the new system.',
        vi: 'Mọi người có thể cần thời gian và đào tạo trước khi quen với hệ thống mới.',
      },
    ],
    'Long term: higher productivity, savings and a better quality of life.': [
      {
        en: 'In the long run, however, the benefits would far outweigh the costs, including **higher productivity** and **savings**.',
        vi: 'Tuy nhiên về lâu dài, lợi ích sẽ vượt xa chi phí, gồm năng suất cao hơn và các khoản tiết kiệm.',
      },
      {
        en: 'Over time, this change is likely to bring **a better quality of life** to the whole community.',
        vi: 'Theo thời gian, thay đổi này có khả năng mang lại chất lượng cuộc sống tốt hơn cho cả cộng đồng.',
      },
    ],
    'Effects on future generations.': [
      {
        en: 'The decisions we make today will have a lasting impact on **future generations**.',
        vi: 'Những quyết định hôm nay sẽ tác động lâu dài đến các thế hệ tương lai.',
      },
      {
        en: 'If we ignore this problem now, **future generations** will have to pay the price.',
        vi: 'Nếu bây giờ phớt lờ vấn đề này, các thế hệ sau sẽ phải trả giá.',
      },
    ],
    'Whether the solution is sustainable.': [
      {
        en: 'A good solution must be **sustainable**, not just a quick fix for the present.',
        vi: 'Một giải pháp tốt phải bền vững, không chỉ là cách chữa cháy trước mắt.',
      },
      {
        en: 'Short-term measures may work for a while, but only **sustainable** solutions can solve the problem permanently.',
        vi: 'Biện pháp ngắn hạn có thể hiệu quả một thời gian, nhưng chỉ giải pháp bền vững mới giải quyết được vấn đề lâu dài.',
      },
    ],
  },
}

/** Câu hoàn chỉnh cho một ý triển khai, khớp theo chữ tiếng Anh của ý trong tài liệu. */
export const ideaSentences = (dirId: string, ideaEn: string): BiText[] => IDEA_SENTENCES[dirId]?.[ideaEn.replace(/\*\*/g, '')] ?? []
