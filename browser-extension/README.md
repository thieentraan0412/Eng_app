# EngMaster — Dịch nhanh (extension Chrome / Edge)

Bấm `Alt+X` ở bất kỳ tab nào của trình duyệt để mở cửa sổ Dịch nhanh của
EngMaster, kèm sẵn chữ đang bôi đen ở trang đó.

Bản web của EngMaster chỉ nhận phím tắt khi tab EngMaster đang được focus —
trang web không có API phím tắt toàn cục. Tiện ích này lấp đúng khoảng đó:
trình duyệt nhận phím thay, rồi mở một **cửa sổ riêng** (kéo đi và co giãn
được, không tự tắt khi bấm ra chỗ khác) nhúng trang `?view=quick-translate`
của EngMaster.

Bấm lại `Alt+X` khi cửa sổ đang mở thì nó nạp chữ mới vào chính cửa sổ đó chứ
không đẻ thêm cửa sổ. Nếu lần đó không bôi đen gì thì cửa sổ giữ nguyên nội
dung đang tra. Đóng bằng `Esc`, nút X trong khung, hoặc X của cửa sổ.

Chữ bôi đen lấy được ở cả ba chỗ: nội dung trang, ô nhập (`<input>`,
`<textarea>`) và khung nhúng trong trang.

## Cài đặt (không cần qua cửa hàng)

1. Mở `edge://extensions` (Chrome: `chrome://extensions`).
2. Bật **Chế độ nhà phát triển** (góc dưới bên trái ở Edge, góc trên bên phải ở Chrome).
3. Bấm **Tải tiện ích đã giải nén** rồi chọn thư mục `browser-extension` này.
4. Bấm icon tiện ích → **Mở phần cài đặt** → dán địa chỉ trang EngMaster
   (ví dụ `https://ten-project.vercel.app`) → **Lưu**.

## Đổi phím tắt

`edge://extensions/shortcuts` (Chrome: `chrome://extensions/shortcuts`) → mục
"Mở Dịch nhanh". Nếu `Alt+X` đã bị tiện ích khác chiếm thì trình duyệt để
trống, tự đặt lại ở đây.

## Giới hạn

- Chỉ chạy khi trình duyệt đang được focus. Bấm ở Word/Excel thì không ăn —
  dùng app EngMaster bản desktop cho trường hợp đó.
- Không đọc được chữ bôi đen ở trang `edge://`, `chrome://`, cửa hàng tiện ích
  và trình xem PDF (trình duyệt chặn chèn script). Cửa sổ dịch vẫn mở, chỉ là ô
  nhập trống để gõ tay.
- Cần trang EngMaster đã deploy có hỗ trợ `?view=quick-translate` (từ bản này
  trở đi).

## Quyền xin và lý do

| Quyền | Dùng để |
| --- | --- |
| `activeTab` | Đọc vùng chọn của đúng tab đang xem, chỉ tại thời điểm bấm phím tắt |
| `scripting` | Chạy đoạn lấy `window.getSelection()` trong tab đó |
| `storage` | Nhớ địa chỉ trang EngMaster |

Không xin `<all_urls>`, không chạy nền, không thu thập gì.
