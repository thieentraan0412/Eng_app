# Checklist Triển Khai — Lộ trình IELTS 5.0 → 6.0 (IELTS Daily Path)

> Dựa trên [ke-hoach-roadmap.md](ke-hoach-roadmap.md) · `[ ]` chưa · `[~]` đang làm · `[x]` xong
> *(EngMaster: …)* = phần app hiện có, có thể dùng lại

## GĐ 0 — Chốt yêu cầu (Tuần 1–3)
- [ ] Stakeholder trả lời 5 câu hỏi mở *(Mục 12)*
  - [ ] Thời lượng lộ trình: 8, 12 hay 16 tuần
  - [ ] Mô hình kinh doanh: miễn phí, freemium hay trả phí trọn gói
  - [ ] Có cần giáo viên chấm bổ sung không
  - [ ] Có hỗ trợ IELTS General Training không
  - [ ] Ra mắt mobile hay web trước
- [ ] Xác nhận giả định: 75 phút/ngày, IELTS Academic, chấm AI bằng dịch vụ ngoài
- [ ] Chọn dịch vụ AI chấm Writing/Speaking và speech-to-text
- [ ] Wireframe + UI các màn chính: Hôm nay, Bài học, Thi thử, Dashboard, Admin
- [ ] Kiến trúc hệ thống và schema dữ liệu *(Mục 8, EngMaster: Supabase + RLS)*

## GĐ 1 — Chuẩn bị nội dung (Tuần 2–8, song song)
- [ ] Bộ placement test ~40 phút cho 4 kỹ năng
- [ ] Template lộ trình 84 ngày theo 3 giai đoạn *(Mục 4.1)* và lịch xoay vòng tuần *(Mục 4.4)*
- [ ] Bài học Giai đoạn 1 — Nền tảng (tuần 1–4) *(ưu tiên trước)*
- [ ] Bài học Giai đoạn 2 — Kỹ năng (tuần 5–8)
- [ ] Bài học Giai đoạn 3 — Luyện đề (tuần 9–12)
- [ ] 12 mini test Chủ nhật (~30 phút)
- [ ] 3 bộ full mock test (tuần 4, 8, 12)
- [ ] 1.200 từ vựng kèm nghĩa, phát âm, câu ví dụ
- [ ] Bài mẫu band 6.5 cho từng đề Writing
- [ ] Tự biên soạn đề theo format IELTS, không dùng đề Cambridge khi chưa có giấy phép

## GĐ 2 — Phát triển MVP: các FR mức Must (Tuần 4–11)

### Đăng ký và hồ sơ
- [ ] FR-01 Đăng ký / đăng nhập bằng email, Google, Apple *(EngMaster: đã có email qua Supabase Auth)*
- [ ] FR-02 Khai báo mục tiêu: band, ngày thi, lý do học
- [ ] FR-03 Chọn cường độ (Nhẹ 45' / Chuẩn 75' / Tăng tốc 120') và khung giờ học

### Kiểm tra đầu vào
- [ ] FR-04 Placement test ~40 phút cho 4 kỹ năng
- [ ] FR-05 Trả band ước tính theo từng kỹ năng

### Lộ trình và bài học hằng ngày
- [ ] FR-07 Sinh lộ trình cá nhân từ kết quả đầu vào và cường độ
- [ ] FR-08 Màn hình "Hôm nay": nhiệm vụ, thời lượng, trạng thái *(US-01)*
  - [ ] Là màn hình đầu tiên khi mở app (nếu đã có lộ trình)
  - [ ] 4–5 nhiệm vụ kèm tổng thời lượng; mỗi nhiệm vụ có kỹ năng, tiêu đề, thời lượng, trạng thái
  - [ ] Hoàn thành hết thì hiện màn chúc mừng và tăng streak thêm 1
- [ ] FR-09 Học bài, làm bài tập, đánh dấu hoàn thành từng nhiệm vụ
- [ ] FR-10 Xử lý bỏ lỡ ngày học *(US-03)*
  - [ ] Bỏ lỡ 1 ngày: dồn bài, mỗi ngày tăng không quá 30 phút
  - [ ] Bỏ lỡ từ 3 ngày liên tiếp: hỏi người dùng "Dồn bài" hay "Lùi lịch"
  - [ ] Cập nhật ngày dự kiến hoàn thành trên dashboard

### Luyện kỹ năng
- [ ] FR-13 Listening: phát audio, tua lại khi luyện (khóa khi thi thử), tự chấm, hiện transcript sau khi nộp *(EngMaster: có TTS, Nghe chép)*
- [ ] FR-14 Reading: bài đọc và câu hỏi song song, highlight, tự chấm, giải thích đáp án *(EngMaster: có Reader + tra từ)*
- [ ] FR-15 Writing: đếm từ, đồng hồ đếm ngược, AI chấm 4 tiêu chí (TA/TR, CC, LR, GRA), gợi ý sửa câu *(US-02, EngMaster: có trình soạn thảo + đếm từ)*
  - [ ] Cảnh báo trước khi nộp nếu Task 2 < 150 từ hoặc Task 1 < 120 từ
  - [ ] Trả kết quả ≤ 60 giây: band tổng, band 4 tiêu chí, ≥ 3 gợi ý sửa cụ thể
  - [ ] Xem được bài mẫu band 6.5 cùng đề
- [ ] FR-16 Speaking: ghi âm, chuyển thành văn bản, AI chấm 4 tiêu chí (FC, LR, GRA, P), chỉ ra lỗi phát âm
- [ ] FR-17 Từ vựng: flashcard SRS, có phát âm và câu ví dụ *(EngMaster: đã có Flashcard + SM-2)*
- [ ] FR-18 Ngữ pháp: bài ngắn kèm trắc nghiệm / điền từ *(EngMaster: đã có MCQ + điền từ)*

### Thi thử và đánh giá
- [ ] FR-20 Mini test mỗi Chủ nhật (~30 phút)
- [ ] FR-21 Full mock test tuần 4, 8, 12, mô phỏng thời gian thi thật
- [ ] FR-22 Báo cáo sau thi: band từng kỹ năng, so với lần trước, điểm yếu

### Tiến độ và động lực
- [ ] FR-23 Dashboard: % hoàn thành, band ước tính hiện tại, biểu đồ tiến bộ theo kỹ năng *(US-04, EngMaster: có Dashboard + biểu đồ)*
  - [ ] Biểu đồ đường band 4 kỹ năng theo từng tuần
  - [ ] Band ước tính tính từ mini test, mock test và bài tập trong 14 ngày gần nhất
- [ ] FR-24 Streak, mỗi tuần 1 lần "đóng băng" *(EngMaster: đã có streak, cần thêm đóng băng)*
- [ ] FR-25 Push notification nhắc học theo khung giờ người dùng chọn

### Quản trị
- [ ] FR-28 Content Admin: CRUD bài học, câu hỏi, đề thi; gắn tag kỹ năng, dạng bài, độ khó, tuần

## GĐ 3 — Bổ sung: các FR mức Should / Could
- [ ] FR-06 *(Should)* Band < 4.5 thì đề xuất thêm 2–4 tuần nền tảng; > 5.5 thì đề xuất rút ngắn lộ trình
- [ ] FR-11 *(Should)* Tự tăng thời lượng cho kỹ năng yếu hơn mục tiêu
- [ ] FR-19 *(Should)* Sổ lỗi sai: tự lưu câu sai để ôn lại
- [ ] FR-26 *(Should)* Huy hiệu cột mốc (7 ngày, 30 ngày, hết giai đoạn, …)
- [ ] FR-29 *(Should)* Admin xem thống kê: hoạt động, tỷ lệ hoàn thành, điểm trung bình
- [ ] FR-30 *(Should)* Admin cấu hình template lộ trình không cần sửa code
- [ ] FR-12 *(Could)* Tải bài học để học offline
- [ ] FR-27 *(Could)* Báo cáo tuần qua email / thông báo

## Yêu cầu phi chức năng (xuyên suốt)
- [ ] NFR-01 Màn hình tải < 2 giây trên 4G; audio phát trong 1 giây
- [ ] NFR-02 Chấm AI: Writing < 60 giây, Speaking < 30 giây; lệch ±0.5 band so với giám khảo ở ≥ 80% bài
- [ ] NFR-03 Chạy trên iOS 15+, Android 9+, web Chrome / Safari / Edge
- [ ] NFR-04 Uptime ≥ 99.5%
- [ ] NFR-05 Mã hóa mật khẩu, HTTPS; bản ghi âm chỉ chủ sở hữu xem được *(EngMaster: RLS)*
- [ ] NFR-06 Tuân thủ Nghị định 13/2023/NĐ-CP; có chức năng xóa dữ liệu cá nhân
- [ ] NFR-07 Chịu tải 10.000 người dùng đồng thời
- [ ] NFR-08 Tiếng Việt + tiếng Anh, dark mode, thao tác một tay trên điện thoại *(EngMaster: đã có Sáng/Tối)*

## Kiểm soát rủi ro *(Mục 11)*
- [ ] Hiệu chỉnh AI chấm bằng bộ bài do giám khảo chấm; ghi rõ "điểm ước tính"; có nút báo chấm sai
- [ ] Giới hạn số lần chấm AI mỗi ngày và cache kết quả để kiểm soát chi phí API
- [ ] Có chế độ Nhẹ và bài ngắn để giảm tỷ lệ bỏ học

## GĐ 4 — Kiểm thử (Tuần 12–13)
- [ ] Test chức năng toàn bộ FR mức Must
- [ ] Kiểm thử luồng chính end-to-end *(Mục 9)*: đăng ký → placement → lộ trình → học hằng ngày → mini test → mock test
- [ ] Kiểm chứng độ chính xác chấm AI so với giám khảo (NFR-02)
- [ ] Test hiệu năng và tải (NFR-01, NFR-07)
- [ ] UAT với stakeholder

## GĐ 5 — Beta và ra mắt (Tuần 14–16)
- [ ] Beta với 200 người dùng thử (tuần 14–15)
- [ ] Thu phản hồi, sửa lỗi ưu tiên cao
- [ ] Ra mắt chính thức (tuần 16)
- [ ] Đo KPI sau ra mắt:
  - [ ] Tỷ lệ hoàn thành lộ trình 12 tuần ≥ 35%
  - [ ] DAU/MAU ≥ 40%
  - [ ] ≥ 60% người hoàn thành đạt band ước tính ≥ 6.0 ở mock test cuối
  - [ ] CSAT ≥ 4.2/5
