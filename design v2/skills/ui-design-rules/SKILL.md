---
name: ui-design-rules
description: Bộ rule thiết kế UI/UX chuẩn (24 nhóm) cho desktop app, web PC, web mobile, POS/F&B. Hai chế độ — BUILD (áp rule khi viết/sửa code giao diện, tạo màn hình hoặc component mới) và AUDIT (rà soát UI có sẵn, chấm vi phạm theo severity, xuất báo cáo Markdown). Dùng khi user nói "thiết kế màn hình", "làm giao diện", "review UI", "kiểm tra giao diện", "audit design", "check rule design", "màn hình này đã chuẩn chưa", "chuẩn bị bàn giao thiết kế", hoặc khi sắp sửa file HTML/CSS/JSX/Vue ảnh hưởng tới giao diện. Không dùng cho việc viết logic backend hoặc data processing không liên quan tới UI.
---

# UI Design Rules

Bộ rule 24 nhóm, áp dụng cho desktop app, web PC, web mobile và phần mềm POS/F&B.
Skill này biến bộ rule thành hai quy trình chạy được, không phải một tài liệu để đọc.

## Bước 0 — Chọn chế độ

| Tình huống | Chế độ |
|---|---|
| Sắp viết/sửa code giao diện, tạo màn hình hoặc component mới | **BUILD** |
| Đã có UI (code, URL hoặc screenshot), cần rà soát chất lượng | **AUDIT** |
| Chuẩn bị bàn giao cho developer / nghiệm thu | **AUDIT** + `references/handoff-checklist.md` |

Nếu user không nói rõ và đang có code UI trong tay → hỏi 1 câu ngắn, đừng đoán.

## Bước 1 — Xác định ngữ cảnh (bắt buộc, cả 2 chế độ)

Trước khi áp rule, phải chốt 4 điều. Thiếu bất kỳ điều nào thì rule sẽ áp sai:

1. **Nền tảng**: desktop app / web PC / web mobile / responsive cả hai / POS-cảm ứng.
2. **Loại màn hình**: danh sách-bảng, form, chi tiết, dashboard, wizard, modal, màn thao tác nhanh (POS).
3. **Mục tiêu chính của màn hình** — đúng một câu. Một màn hình chỉ có một mục tiêu chính (Rule 1).
4. **Nhóm người dùng và quyền** — ai dùng, tần suất, thao tác nào lặp lại nhiều nhất.

Ghi 4 dòng này ra đầu output. Chúng quyết định rule nào là BLOCKER, rule nào không áp dụng.

## Bước 2 — Nạp đúng reference, không nạp hết

Chỉ đọc file cần dùng:

| File | Khi nào đọc |
|---|---|
| `references/rules-core.md` | **Luôn luôn** — mục 1–14: nguyên tắc, IA, bố cục, typography, màu, icon, button, form, bảng, modal, trạng thái, nội dung, responsive |
| `references/rules-platform.md` | Mục 15–17 + 23 — chọn đúng phần nền tảng: desktop app, web PC, web mobile, POS/F&B |
| `references/rules-quality.md` | Mục 18–22 — accessibility, design system, Figma, prototype, handoff |
| `references/detection-map.md` | Chế độ AUDIT — dấu hiệu nhận biết vi phạm trực tiếp trong code/DOM |
| `references/handoff-checklist.md` | Mục 24 — trước khi bàn giao hoặc nghiệm thu |

## Severity — dùng chung cho cả 2 chế độ

Xếp hạng theo **hậu quả nghiệp vụ**, không theo độ xấu của giao diện.

| Mức | Nghĩa | Ví dụ |
|---|---|---|
| **BLOCKER** | Gây mất tiền, sai dữ liệu, hoặc chặn người dùng hoàn thành tác vụ | Nhấn thanh toán nhiều lần tạo đơn trùng; submit lỗi làm mất dữ liệu đã nhập; thao tác không hoàn tác được mà không cảnh báo |
| **MAJOR** | Người dùng làm được nhưng sai/chậm/hoang mang | Không có empty state; nút "OK" không rõ hành động; nút xóa đặt sát nút xác nhận; bảng không có tổng số kết quả |
| **MINOR** | Ảnh hưởng tính nhất quán, chưa chặn tác vụ | Icon lệch phong cách; spacing không theo scale; hai tên gọi cho cùng một chức năng |
| **NOTE** | Đề xuất cải thiện, không phải vi phạm | Có thể thêm phím tắt cho thao tác lặp |

Quy tắc bắt buộc: **sửa BLOCKER và MAJOR trước khi chạm vào phần trang trí** (Rule 21).

---

# Chế độ BUILD

Áp dụng khi tạo hoặc sửa giao diện. Không phải "code xong rồi kiểm tra" — rule chi phối lúc quyết định.

### B1. Trước khi viết dòng code đầu tiên

- Viết ra luồng nghiệp vụ đầu→cuối, kèm **luồng thất bại**: lỗi validate, hủy giữa chừng, mất mạng, hết quyền, session hết hạn.
- Liệt kê trạng thái dữ liệu và điều kiện chuyển trạng thái.
- Chọn cấu trúc điều hướng: sidebar (nhiều phân hệ) / tab (nội dung cùng cấp) / breadcrumb (nhiều cấp).
- Kiểm tra design system hiện có **trước khi** tạo component mới. Không tạo mới nếu component cũ mở rộng được (Rule 19).

### B2. Trong lúc dựng giao diện

Với mỗi thành phần tương tác, dựng đủ **6 trạng thái**: default, hover, focus, pressed, selected, disabled.
Với mỗi màn hình, dựng đủ **4 trạng thái màn hình**: loading, empty, error, success.
Với mỗi danh sách, phân biệt **empty (chưa có dữ liệu)** và **no-result (lọc/tìm không ra)** — hai nội dung khác nhau.

Ràng buộc không được vi phạm:

- Một khu vực chỉ một hành động chính nổi bật.
- Nhãn nút là động từ mô tả hành động: "Lưu thay đổi", "Xác nhận thanh toán" — không dùng "OK", "Submit".
- Nút nguy hiểm (xóa, hủy đơn, hoàn tiền) phải phân biệt rõ và **không đặt sát nút xác nhận chính**.
- Mỗi input có label thật; placeholder không thay thế label.
- Validation hiển thị **cạnh trường lỗi**, nội dung nêu rõ vấn đề + cách sửa.
- Submit lỗi **không được xóa dữ liệu người dùng đã nhập**.
- Màu không bao giờ là dấu hiệu duy nhất của trạng thái — luôn kèm icon hoặc nhãn.
- Không để màn hình trắng khi tải: skeleton nếu cấu trúc ổn định, spinner nếu không.
- Chống nhấn lặp: khóa nút ngay khi bắt đầu xử lý, hiện loading.

### B3. Test dữ liệu thật trước khi coi là xong

Chạy màn hình với: chuỗi rất dài, trường rỗng/null, số âm, số rất lớn, danh sách 0 dòng, danh sách 1000 dòng, tên tiếng Việt có dấu, tiền tệ nhiều chữ số.

### B4. Kiểm tra bắt buộc trước khi báo hoàn thành

Chạy đủ 8 mục, báo cáo kết quả từng mục:

1. Đủ 4 trạng thái màn hình (loading/empty/error/success).
2. Đủ 6 trạng thái component tương tác.
3. Responsive ở mobile / tablet / laptop / desktop + zoom 125%, 150%, 200%.
4. Điều hướng bằng bàn phím: Tab đúng thứ tự, focus indicator nhìn thấy rõ.
5. Tương phản chữ/nền đạt chuẩn; trạng thái không chỉ dựa vào màu.
6. Dùng đúng token/component của design system, không hardcode màu-spacing.
7. Thao tác nguy hiểm có xác nhận và nêu rõ hậu quả; thao tác không hoàn tác được nói rõ.
8. Nội dung dài không làm vỡ layout hoặc cắt chữ.

Mục nào không đạt thì nói rõ, không im lặng bỏ qua.

---

# Chế độ AUDIT

### A1. Thu thập

- **Code**: đọc file HTML/CSS/JS/JSX của màn hình cần rà.
- **Live**: nếu có URL, dùng Playwright MCP (ưu tiên) hoặc Claude in Chrome để mở thật, chụp ở các breakpoint 375, 768, 1366, 1920 và thử zoom 200%.
- **Screenshot**: nếu user chỉ đưa ảnh, chỉ chấm những rule quan sát được — nói rõ rule nào không kiểm tra được.

### A2. Quét theo `references/detection-map.md`

File này liệt kê dấu hiệu cụ thể trong code/DOM ứng với từng rule. Quét lần lượt, không nhảy cóc.
**Không báo vi phạm nếu chưa nhìn thấy bằng chứng cụ thể.** Mỗi phát hiện phải trích được đoạn code hoặc mô tả vị trí trên màn hình.

### A3. Xuất báo cáo

Ghi ra file `.md` (mặc định `design-audit-<màn-hình>-<YYYYMMDD>.md`), theo mẫu:

```markdown
# Báo cáo rà soát thiết kế — <Tên màn hình>

**Ngày:** YYYY-MM-DD
**Nền tảng:** web PC / web mobile / desktop app / POS
**Phạm vi:** <file hoặc URL đã rà>
**Mục tiêu chính của màn hình:** <một câu>
**Không kiểm tra được:** <rule nào và vì sao>

## Tổng quan

| Mức | Số lượng |
|---|---|
| BLOCKER | n |
| MAJOR | n |
| MINOR | n |
| NOTE | n |

**Kết luận:** <đạt / chưa đạt để bàn giao> — <lý do một câu>

## Chi tiết vi phạm

### [BLOCKER-01] <Tiêu đề ngắn>
- **Rule:** Mục 8 — Chống nhấn lặp khi hệ thống đang xử lý
- **Vị trí:** `05-bai-tap/index.html:142`, nút "Nộp bài"
- **Hiện trạng:** Nút không bị disable sau khi nhấn; nhấn nhanh 3 lần tạo 3 bản ghi.
- **Hậu quả:** Dữ liệu trùng, thống kê sai.
- **Cách sửa:** Khóa nút + hiện loading ngay tại handler; chỉ mở lại sau khi có phản hồi hoặc lỗi.

(lặp lại cho từng phát hiện, đánh số theo mức)

## Việc cần làm theo thứ tự

1. <BLOCKER...>
2. <MAJOR...>
3. <MINOR/NOTE...>
```

Quy tắc viết báo cáo:

- Sắp xếp BLOCKER → MAJOR → MINOR → NOTE. Không trộn lẫn.
- Mỗi mục phải có: rule tham chiếu, vị trí, hiện trạng, hậu quả, cách sửa. Thiếu "cách sửa" là báo cáo chưa xong.
- Không liệt kê rule đã đạt thành từng dòng dài — gộp thành một đoạn ngắn ở cuối.
- Nếu không tìm thấy vi phạm nào ở một mức, ghi "Không có" chứ không bịa thêm cho đủ.
- Toàn bộ báo cáo viết bằng tiếng Việt.

### A4. Sau khi báo cáo

Hỏi user có muốn sửa luôn các mục BLOCKER/MAJOR không. Nếu có, sửa theo thứ tự ưu tiên và ghi lại diff, **không** đồng thời làm đẹp thêm những phần không nằm trong báo cáo.

---

## Nguyên tắc chi phối toàn skill

- Khả năng sử dụng đứng trên vẻ đẹp. Không bao giờ đánh đổi ngược lại.
- Ưu tiên **ngăn lỗi** hơn báo lỗi.
- Không đánh giá chỉ bằng pixel — phải kiểm tra hành vi và nghiệp vụ.
- Không thay đổi component dùng chung chỉ để chữa một màn hình riêng lẻ.
