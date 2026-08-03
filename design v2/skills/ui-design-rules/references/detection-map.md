# Bản đồ phát hiện vi phạm — dùng cho chế độ AUDIT

Mỗi dòng: rule → dấu hiệu tìm được trong code/DOM → severity mặc định.
Severity có thể nâng/hạ theo ngữ cảnh nghiệp vụ, nhưng phải giải thích lý do trong báo cáo.

**Nguyên tắc:** grep chỉ để khoanh vùng nghi ngờ. Luôn đọc lại đoạn code xung quanh trước khi kết luận. Không báo vi phạm dựa trên kết quả grep đơn thuần.

---

## Nhóm BLOCKER — kiểm tra trước tiên

| Rule | Dấu hiệu cần tìm | Cách xác nhận |
|---|---|---|
| 8 — Chống nhấn lặp | Handler submit/thanh toán/tạo đơn không có cờ khóa: tìm `onclick`, `addEventListener('click'` gọi hàm async mà không set `disabled = true` hoặc `isSubmitting` | Đọc handler; thử nhấn nhanh nhiều lần trên live |
| 9 — Không mất dữ liệu đã nhập | Sau khi validate lỗi có `form.reset()`, `location.reload()`, hoặc re-render xóa state | Đọc nhánh xử lý lỗi |
| 13 — Thao tác không hoàn tác được | Nút xóa/hủy/hoàn tiền không kèm dialog xác nhận, hoặc dialog không nêu hậu quả | Tìm `delete`, `xoa`, `remove`, `huy` rồi truy ngược tới confirm |
| 16 — Rời trang khi chưa lưu | Form có state thay đổi nhưng không có `beforeunload` / route guard | Tìm `beforeunload` |
| 23 — Tổng tiền không cập nhật | Thay đổi số lượng/đơn giá không gọi lại hàm tính tổng | Đọc luồng tính toán |
| 23 — Số lượng trả vượt mức | Input trả hàng không có `max` ràng buộc theo số còn có thể trả | Đọc validate |
| 2 — Đổi dữ liệu quan trọng không báo | Có mutation ngầm không kèm phản hồi UI | Đọc side effect |

## Nhóm MAJOR

| Rule | Dấu hiệu cần tìm | Ghi chú |
|---|---|---|
| 12 — Thiếu loading state | Fetch/await không có cờ `loading` hoặc skeleton | Màn hình trắng khi tải là MAJOR |
| 12 — Thiếu empty state | Render list trực tiếp `.map()` không có nhánh `length === 0` | |
| 10 — Empty vs no-result | Chỉ có một thông báo dùng chung cho cả hai | |
| 12 — Thiếu error state | `catch` rỗng, chỉ `console.log`, hoặc chỉ toast rồi mất | Lỗi nghiêm trọng chỉ hiện toast → MAJOR |
| 8 — Nhãn nút chung chung | Text nút là `OK`, `Submit`, `Yes`, `Đồng ý`, `Xác nhận` đứng một mình | |
| 8 — Nút nguy hiểm đặt sát nút chính | Trong cùng flex/grid row, nút xóa cạnh nút lưu, không tách khoảng | Xem CSS layout |
| 9 — Thiếu label | `<input>` không có `<label for>`, `aria-label` hay `aria-labelledby`; chỉ có `placeholder` | |
| 9 — Validation xa trường lỗi | Thông báo lỗi gom hết lên đầu form | |
| 9 — Sai loại input | Số/ngày/tiền/email dùng `type="text"`; mobile thiếu `inputmode` | |
| 10 — Bảng thiếu tổng số kết quả | Không render tổng số dòng | |
| 6/18 — Trạng thái chỉ bằng màu | Badge/status chỉ đổi `background-color`, không có text hay icon | Kiểm tra class `.status-*`, `.badge-*` |
| 18 — Mất focus indicator | CSS có `outline: none` mà không thay bằng focus style khác | Grep `outline:\s*none`, `outline:0` |
| 11 — Modal chồng nhau | Nhiều modal cùng mở, hoặc modal mở modal | |
| 11 — Đóng modal mất dữ liệu | Click backdrop đóng modal có form đang nhập, không cảnh báo | |
| 14 — Chỉ thu nhỏ để responsive | Không có `@media`, hoặc chỉ dùng `transform: scale()`, hoặc width cố định bằng `px` cho layout chính | |
| 17 — Vùng chạm quá nhỏ | Nút/icon-button dưới ~44px trên mobile | Đo trên live |
| 17 — Phụ thuộc hover | Chức năng chỉ lộ ra qua `:hover`, không có tương đương cho touch | |
| 16 — Mất bộ lọc khi quay lại | Filter lưu trong state cục bộ, không sync URL/storage | |
| 13 — Mã lỗi kỹ thuật lộ ra UI | Hiển thị `error.message`, stack trace, HTTP status thô | |

## Nhóm MINOR

| Rule | Dấu hiệu cần tìm |
|---|---|
| 4/19 — Không dùng token | Màu hex và spacing hardcode rải rác thay vì biến CSS/token |
| 5 — Typography không nhất quán | Nhiều `font-size` lẻ cho cùng loại nội dung; nhiều font-family |
| 5 — Chữ quá nhạt / quá nhỏ | `color` xám nhạt trên nền trắng; `font-size` < 12px cho nội dung |
| 5 — Toàn chữ in hoa | `text-transform: uppercase` cho đoạn văn bản dài |
| 7 — Icon lệch phong cách | Trộn nhiều bộ icon; kích thước icon không thống nhất |
| 7 — Thiếu fallback ảnh | `<img>` không có `onerror` hoặc placeholder |
| 7 — Thiếu alt | `<img>` có ý nghĩa nhưng `alt` rỗng/thiếu |
| 13 — Tên gọi không thống nhất | Cùng một chức năng gọi bằng nhiều tên khác nhau giữa các màn hình |
| 3 — Thiếu trạng thái đang chọn | Menu/tab không có class active |
| 10 — Căn lề số liệu | Cột số/tiền căn trái |
| 12 — Thiếu trạng thái component | CSS chỉ có `:hover`, thiếu `:focus`, `:active`, `[disabled]`, `[aria-selected]` |
| 18 — Không tôn trọng reduced-motion | Có animation nhưng không có `@media (prefers-reduced-motion)` |

---

## Kiểm tra trên live (Playwright / Claude in Chrome)

Chạy đủ 7 bước sau khi có URL:

1. Chụp ở 375px, 768px, 1366px, 1920px — so sánh cấu trúc, không chỉ kích thước.
2. Zoom 200% — kiểm tra chữ, nút, input có bị cắt hoặc chồng lấn không.
3. Chỉ dùng bàn phím: Tab qua toàn màn hình, ghi lại thứ tự focus và chỗ mất focus indicator.
4. Submit form rỗng → xem thông báo lỗi ở đâu, nội dung có nói cách sửa không.
5. Nhập chuỗi 200 ký tự vào các input và ô hiển thị → xem layout có vỡ không.
6. Nhấn nhanh 3 lần vào nút hành động chính → kiểm tra có tạo bản ghi trùng không.
7. Ngắt mạng (throttle offline) → xem hệ thống báo gì.

Bước nào không thực hiện được thì ghi rõ vào mục "Không kiểm tra được" của báo cáo.
