# TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BRD)
## Ứng dụng lộ trình học IELTS hằng ngày: từ 5.0 lên 6.0

| Thông tin | Chi tiết |
|---|---|
| Tên dự án | IELTS Daily Path (tên tạm) |
| Phiên bản tài liệu | 1.0 (bản nháp) |
| Ngày tạo | 18/10/2026 |
| Người soạn | Business Analyst |
| Trạng thái | Chờ review |

---

## 1. Tổng quan

### 1.1 Bối cảnh
Nhiều người học đang ở band 5.0 và cần 6.0 để du học, xin việc hoặc tốt nghiệp. Họ thường gặp ba vấn đề:
- Không biết **mỗi ngày nên học gì** và học bao lâu.
- Học không đều, dễ bỏ giữa chừng.
- Không biết mình **đã tiến bộ đến đâu** so với mục tiêu.

### 1.2 Mục tiêu sản phẩm
Xây dựng ứng dụng (mobile và web) cung cấp **lộ trình học hằng ngày có cấu trúc** trong **12 tuần (84 ngày)**. Ứng dụng giúp người học tăng từ band 5.0 lên 6.0 bằng cách:
1. Giao **bài học cụ thể mỗi ngày**, 60–90 phút, cân bằng 4 kỹ năng.
2. **Theo dõi tiến độ** và ước tính band theo từng kỹ năng.
3. **Duy trì động lực** bằng nhắc nhở, chuỗi ngày học (streak) và cột mốc.

### 1.3 Chỉ số thành công (KPI)
| KPI | Mục tiêu |
|---|---|
| Tỷ lệ người dùng hoàn thành lộ trình 12 tuần | ≥ 35% |
| Tỷ lệ người dùng quay lại học mỗi ngày (DAU/MAU) | ≥ 40% |
| Người dùng đạt band ước tính ≥ 6.0 ở bài thi thử cuối khóa | ≥ 60% số người hoàn thành |
| Điểm hài lòng (CSAT) | ≥ 4.2/5 |

---

## 2. Phạm vi

### 2.1 Trong phạm vi (MVP)
- Kiểm tra đầu vào (placement test) để xác định band hiện tại.
- Lộ trình 12 tuần, chia theo ngày.
- Bài học và bài tập cho Listening, Reading, Writing, Speaking, kèm Từ vựng và Ngữ pháp.
- Tự động chấm Listening và Reading.
- Chấm Writing và Speaking bằng AI (gợi ý band và nhận xét).
- Bảng theo dõi tiến độ, streak và nhắc nhở hằng ngày.
- Thi thử (mock test) ở tuần 4, tuần 8 và tuần 12.

### 2.2 Ngoài phạm vi (giai đoạn sau)
- Lớp học trực tiếp với giáo viên.
- Lộ trình cho các mục tiêu khác (6.0 → 7.0, …).
- Cộng đồng, diễn đàn, học nhóm.
- Thanh toán và gói trả phí nâng cao. MVP có thể miễn phí hoặc dùng một gói cố định.

---

## 3. Đối tượng người dùng (Persona)

| Persona | Mô tả | Nhu cầu chính |
|---|---|---|
| **Sinh viên (Minh, 21 tuổi)** | Cần 6.0 để tốt nghiệp. Có thời gian buổi tối. | Lộ trình rõ ràng, chi phí thấp |
| **Người đi làm (Lan, 27 tuổi)** | Cần 6.0 để du học hoặc định cư. Bận rộn, học vào giờ nghỉ trưa hoặc trên đường đi làm. | Bài ngắn, học được trên điện thoại, nhắc nhở |
| **Học sinh lớp 12 (An, 17 tuổi)** | Cần IELTS để xét tuyển đại học. | Có động lực, có phần thưởng, thấy rõ tiến bộ |

**Vai trò trong hệ thống:**
- **Người học (Learner)**: người dùng chính.
- **Quản trị nội dung (Content Admin)**: tạo và quản lý bài học, đề thi.
- **Quản trị hệ thống (Admin)**: quản lý người dùng và cấu hình.

---

## 4. Lộ trình học 12 tuần

### 4.1 Các giai đoạn

| Giai đoạn | Tuần | Mục tiêu | Trọng tâm |
|---|---|---|---|
| **1. Nền tảng** | 1–4 | Củng cố ngữ pháp và từ vựng nền, làm quen dạng đề | Ngữ pháp B1, 600 từ vựng chủ đề, các dạng câu hỏi Listening và Reading |
| **2. Kỹ năng** | 5–8 | Nắm chiến lược làm từng dạng bài | Skimming/scanning, Task 1 và Task 2, Speaking Part 1–3 |
| **3. Luyện đề** | 9–12 | Tăng tốc độ, quản lý thời gian, sửa lỗi | Đề full test, sửa lỗi Writing và Speaking, ôn tập |

### 4.2 Mục tiêu band theo kỹ năng

| Kỹ năng | Đầu vào | Sau tuần 4 | Sau tuần 8 | Sau tuần 12 |
|---|---|---|---|---|
| Listening | 5.0 | 5.5 | 6.0 | 6.5 |
| Reading | 5.0 | 5.5 | 6.0 | 6.5 |
| Writing | 5.0 | 5.0 | 5.5 | 6.0 |
| Speaking | 5.0 | 5.5 | 5.5 | 6.0 |
| **Overall** | **5.0** | **5.5** | **5.5–6.0** | **6.0+** |

> Listening và Reading thường tăng nhanh hơn. Lộ trình đặt mục tiêu cao hơn ở hai kỹ năng này để bù cho Writing.

### 4.3 Cấu trúc một ngày học (khoảng 75 phút)

| Thứ tự | Hoạt động | Thời lượng | Ghi chú |
|---|---|---|---|
| 1 | Ôn từ vựng (flashcard, lặp lại ngắt quãng) | 10 phút | 15 từ mới và ôn từ cũ |
| 2 | Kỹ năng chính của ngày | 30 phút | Xoay vòng theo lịch tuần (bên dưới) |
| 3 | Kỹ năng phụ | 20 phút | |
| 4 | Ngữ pháp hoặc Pronunciation | 10 phút | Bài học ngắn kèm 5 câu luyện |
| 5 | Tổng kết ngày | 5 phút | Xem lỗi sai, ghi chú |

Người dùng chọn một trong ba cường độ:
- **Nhẹ**: 45 phút/ngày. Lộ trình kéo dài khoảng 16 tuần.
- **Chuẩn**: 75 phút/ngày, 12 tuần. Đây là mặc định.
- **Tăng tốc**: 120 phút/ngày. Lộ trình rút còn khoảng 9 tuần.

### 4.4 Lịch xoay vòng trong tuần

| Thứ | Kỹ năng chính | Kỹ năng phụ |
|---|---|---|
| Thứ 2 | Listening | Speaking |
| Thứ 3 | Reading | Writing Task 1 |
| Thứ 4 | Writing Task 2 | Listening |
| Thứ 5 | Speaking | Reading |
| Thứ 6 | Listening | Writing Task 1 |
| Thứ 7 | Reading | Writing Task 2 |
| Chủ nhật | **Mini test và ôn tập tuần** | Xem lại lỗi sai |

### 4.5 Ví dụ chi tiết tuần 1

| Ngày | Nội dung |
|---|---|
| Ngày 1 | Placement test, Listening Section 1 (điền form), từ vựng chủ đề Family |
| Ngày 2 | Reading: dạng True/False/Not Given, Writing Task 1: giới thiệu biểu đồ đường |
| Ngày 3 | Writing Task 2: cấu trúc bài Opinion, ngữ pháp thì hiện tại |
| Ngày 4 | Speaking Part 1: Hometown/Work/Study, phát âm âm cuối |
| Ngày 5 | Listening Section 2 (map), Writing Task 1: từ vựng mô tả xu hướng |
| Ngày 6 | Reading: Matching Headings, viết một Introduction cho Task 2 |
| Ngày 7 | Mini test 30 phút và báo cáo tuần |

---

## 5. Yêu cầu chức năng (Functional Requirements)

### 5.1 Đăng ký và hồ sơ
| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-01 | Người dùng đăng ký và đăng nhập bằng email, Google hoặc Apple | Must |
| FR-02 | Người dùng khai báo mục tiêu (band, ngày thi dự kiến, lý do học) | Must |
| FR-03 | Người dùng chọn cường độ học (Nhẹ / Chuẩn / Tăng tốc) và khung giờ học | Must |

### 5.2 Kiểm tra đầu vào
| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-04 | Hệ thống cung cấp placement test khoảng 40 phút cho 4 kỹ năng | Must |
| FR-05 | Hệ thống trả kết quả band ước tính theo từng kỹ năng | Must |
| FR-06 | Nếu band đầu vào < 4.5, hệ thống đề xuất học thêm 2–4 tuần nền tảng. Nếu > 5.5, đề xuất rút ngắn lộ trình | Should |

### 5.3 Lộ trình và bài học hằng ngày
| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-07 | Hệ thống tạo lộ trình cá nhân từ kết quả đầu vào và cường độ đã chọn | Must |
| FR-08 | Màn hình "Hôm nay" hiển thị danh sách nhiệm vụ của ngày, thời lượng và trạng thái | Must |
| FR-09 | Người dùng học bài, làm bài tập và đánh dấu hoàn thành từng nhiệm vụ | Must |
| FR-10 | Nếu bỏ lỡ ngày học, hệ thống dồn bài hợp lý (tối đa +30 phút/ngày) hoặc lùi lịch | Must |
| FR-11 | Lộ trình tự điều chỉnh: kỹ năng yếu hơn mục tiêu sẽ được tăng thời lượng | Should |
| FR-12 | Người dùng tải bài học để học offline | Could |

### 5.4 Luyện kỹ năng
| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-13 | **Listening**: phát audio, cho tua lại khi luyện tập (không cho khi thi thử), tự chấm, hiển thị transcript sau khi nộp | Must |
| FR-14 | **Reading**: hiển thị bài đọc và câu hỏi song song, highlight, tự chấm, giải thích đáp án | Must |
| FR-15 | **Writing**: soạn bài có đếm số từ và đồng hồ đếm ngược. AI chấm theo 4 tiêu chí (TA/TR, CC, LR, GRA) và gợi ý sửa câu | Must |
| FR-16 | **Speaking**: ghi âm câu trả lời. AI chuyển giọng nói thành văn bản, chấm theo 4 tiêu chí (FC, LR, GRA, P) và chỉ ra lỗi phát âm | Must |
| FR-17 | **Từ vựng**: flashcard dùng thuật toán lặp lại ngắt quãng (SRS), có phát âm và câu ví dụ | Must |
| FR-18 | **Ngữ pháp**: bài học ngắn kèm bài tập trắc nghiệm hoặc điền từ | Must |
| FR-19 | Sổ lỗi sai: tự lưu câu làm sai để ôn lại | Should |

### 5.5 Thi thử và đánh giá
| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-20 | Mini test mỗi Chủ nhật (khoảng 30 phút) | Must |
| FR-21 | Full mock test vào tuần 4, 8 và 12, mô phỏng thời gian thi thật | Must |
| FR-22 | Báo cáo sau thi: band từng kỹ năng, so sánh với lần trước, điểm yếu | Must |

### 5.6 Theo dõi tiến độ và động lực
| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-23 | Dashboard hiển thị % hoàn thành lộ trình, band ước tính hiện tại và biểu đồ tiến bộ theo kỹ năng | Must |
| FR-24 | Streak (chuỗi ngày học liên tiếp). Mỗi tuần có một lần "đóng băng" streak | Must |
| FR-25 | Nhắc nhở hằng ngày bằng push notification theo khung giờ người dùng chọn | Must |
| FR-26 | Huy hiệu tại các cột mốc (7 ngày, 30 ngày, hoàn thành giai đoạn, …) | Should |
| FR-27 | Báo cáo tuần gửi qua email hoặc thông báo | Could |

### 5.7 Quản trị
| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-28 | Content Admin tạo, sửa, xóa bài học, câu hỏi và đề thi, gắn tag kỹ năng, dạng bài, độ khó và tuần | Must |
| FR-29 | Admin xem thống kê người dùng: hoạt động, tỷ lệ hoàn thành, điểm trung bình | Should |
| FR-30 | Admin cấu hình template lộ trình mà không cần sửa code | Should |

---

## 6. User Stories và tiêu chí chấp nhận (mẫu)

**US-01: Xem nhiệm vụ hôm nay**
> Là người học, tôi muốn mở app là thấy ngay hôm nay cần học gì, để không mất thời gian suy nghĩ.

Tiêu chí chấp nhận:
- Given người dùng đã có lộ trình, When mở app, Then màn hình đầu tiên là "Hôm nay", hiển thị 4–5 nhiệm vụ kèm tổng thời lượng.
- Mỗi nhiệm vụ hiển thị kỹ năng, tiêu đề, thời lượng và trạng thái (Chưa học / Đang học / Xong).
- Khi hoàn thành tất cả nhiệm vụ, hệ thống hiển thị màn hình chúc mừng và tăng streak thêm 1.

**US-02: Chấm bài Writing**
> Là người học, tôi muốn được chấm bài Writing ngay sau khi nộp, để biết lỗi và sửa kịp thời.

Tiêu chí chấp nhận:
- Bài dưới 150 từ (Task 2) hoặc dưới 120 từ (Task 1) thì hệ thống cảnh báo trước khi nộp.
- Kết quả trả về trong vòng 60 giây, gồm band tổng, band 4 tiêu chí và ít nhất 3 gợi ý sửa cụ thể.
- Người dùng xem được bài mẫu band 6.5 cho cùng đề.

**US-03: Bỏ lỡ ngày học**
> Là người đi làm bận rộn, khi bỏ lỡ một ngày, tôi muốn lộ trình tự sắp xếp lại để không bị quá tải.

Tiêu chí chấp nhận:
- Bỏ lỡ 1 ngày: bài được dồn sang các ngày kế tiếp, mỗi ngày tăng không quá 30 phút.
- Bỏ lỡ từ 3 ngày liên tiếp: hệ thống hỏi người dùng muốn "Dồn bài" hay "Lùi lịch".
- Ngày dự kiến hoàn thành được cập nhật trên dashboard.

**US-04: Theo dõi tiến bộ**
> Là người học, tôi muốn thấy band của mình thay đổi theo thời gian, để có động lực học tiếp.

Tiêu chí chấp nhận:
- Biểu đồ đường hiển thị band ước tính của 4 kỹ năng theo từng tuần.
- Band ước tính được tính từ kết quả mini test, mock test và bài tập trong 14 ngày gần nhất.

---

## 7. Yêu cầu phi chức năng

| ID | Hạng mục | Yêu cầu |
|---|---|---|
| NFR-01 | Hiệu năng | Màn hình tải dưới 2 giây trên mạng 4G. Audio phát trong vòng 1 giây |
| NFR-02 | Chấm AI | Writing trả kết quả dưới 60 giây, Speaking dưới 30 giây. Sai lệch so với giám khảo ±0.5 band ở ≥ 80% bài |
| NFR-03 | Nền tảng | iOS 15+, Android 9+ và web trên Chrome, Safari, Edge |
| NFR-04 | Khả dụng | Uptime ≥ 99.5% |
| NFR-05 | Bảo mật | Mã hóa mật khẩu, HTTPS. Bản ghi âm chỉ người dùng xem được |
| NFR-06 | Quyền riêng tư | Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Người dùng có quyền xóa dữ liệu |
| NFR-07 | Khả năng mở rộng | Phục vụ 10.000 người dùng đồng thời |
| NFR-08 | Giao diện | Tiếng Việt và tiếng Anh, hỗ trợ dark mode, thao tác được bằng một tay trên điện thoại |

---

## 8. Dữ liệu chính (sơ bộ)

| Thực thể | Thuộc tính chính |
|---|---|
| User | id, tên, email, band mục tiêu, ngày thi, cường độ, giờ nhắc |
| PlacementResult | user_id, band L/R/W/S, ngày làm |
| StudyPlan | user_id, ngày bắt đầu, ngày kết thúc dự kiến, trạng thái |
| DailyTask | plan_id, ngày, loại kỹ năng, lesson_id, thời lượng, trạng thái |
| Lesson | id, kỹ năng, dạng bài, tuần, độ khó, nội dung |
| Question | lesson_id, loại câu hỏi, nội dung, đáp án, giải thích |
| Submission | user_id, question/lesson_id, câu trả lời, điểm, nhận xét AI |
| VocabCard | từ, nghĩa, phát âm, ví dụ, lịch ôn tiếp theo (SRS) |
| MockTest | user_id, loại (mini/full), band từng kỹ năng, ngày |
| Streak | user_id, số ngày hiện tại, kỷ lục, số lần đóng băng còn lại |

---

## 9. Luồng nghiệp vụ chính

```
Đăng ký → Khai báo mục tiêu → Placement test → Nhận kết quả band
   → Chọn cường độ và giờ học → Hệ thống tạo lộ trình 12 tuần
   → [Hằng ngày] Nhận nhắc nhở → Làm nhiệm vụ hôm nay → Chấm và nhận xét → Cập nhật tiến độ và streak
   → [Chủ nhật] Mini test → Báo cáo tuần → Điều chỉnh lộ trình
   → [Tuần 4, 8, 12] Full mock test → Báo cáo giai đoạn
   → Hoàn thành → Đề xuất lộ trình tiếp theo (6.0 → 6.5)
```

---

## 10. Kế hoạch phát hành (đề xuất)

| Giai đoạn | Thời gian | Nội dung |
|---|---|---|
| Phân tích và thiết kế | Tuần 1–3 | Chốt yêu cầu, wireframe, UI, kiến trúc |
| Chuẩn bị nội dung | Tuần 2–8 (song song) | 84 ngày bài học, 3 bộ mock test, 1.200 từ vựng |
| Phát triển MVP | Tuần 4–11 | FR mức Must |
| Kiểm thử (QA + UAT) | Tuần 12–13 | Test chức năng, kiểm chứng độ chính xác của chấm AI |
| Beta | Tuần 14–15 | 200 người dùng thử |
| Ra mắt chính thức | Tuần 16 | |

---

## 11. Rủi ro và giải pháp

| Rủi ro | Mức độ | Giải pháp |
|---|---|---|
| AI chấm Writing/Speaking không chính xác | Cao | Hiệu chỉnh với bộ bài do giám khảo chấm, ghi rõ "điểm ước tính", có kênh báo cáo sai |
| Người dùng bỏ học sau 1–2 tuần | Cao | Streak, nhắc nhở, bài ngắn, chế độ Nhẹ |
| Chi phí sản xuất nội dung lớn | Trung bình | Ưu tiên nội dung giai đoạn 1 trước, tái sử dụng ngân hàng câu hỏi |
| Bản quyền đề thi | Trung bình | Tự biên soạn đề theo format IELTS, không dùng đề Cambridge khi chưa có giấy phép |
| Chi phí API AI tăng theo số người dùng | Trung bình | Giới hạn số lần chấm mỗi ngày, cache kết quả |

---

## 12. Giả định và câu hỏi mở

**Giả định:**
- Lộ trình mặc định là **12 tuần**, khoảng 75 phút/ngày. Cần stakeholder xác nhận lại thời lượng.
- Người học thi **IELTS Academic**. General Training có thể bổ sung sau.
- Chấm Writing và Speaking dùng dịch vụ AI bên ngoài.

**Câu hỏi cần stakeholder trả lời:**
1. Thời gian lộ trình mong muốn là bao lâu (8, 12 hay 16 tuần)?
2. Mô hình kinh doanh là miễn phí, freemium hay trả phí trọn gói?
3. Có cần giáo viên chấm bổ sung (chấm người thật) không?
4. Cần hỗ trợ cả IELTS General Training không?
5. Ưu tiên ra mắt mobile app hay web trước?

---

*Hết tài liệu.*
