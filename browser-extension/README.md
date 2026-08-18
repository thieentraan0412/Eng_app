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

Bấm icon tiện ích trên thanh công cụ cho ra đúng kết quả như bấm `Alt+X`. Phím
tắt không ăn thì vào `edge://extensions/shortcuts` gán lại, còn icon thì lúc nào
cũng dùng được.

Chữ bôi đen lấy được ở cả ba chỗ: nội dung trang, ô nhập (`<input>`,
`<textarea>`) và khung nhúng trong trang.

Từ bản 1.2.0, `content.js` chạy sẵn trên mọi trang và ghi lại chữ vừa bôi đen
ngay lúc bôi. Lúc bấm phím tắt, tiện ích vẫn hỏi trang trước như cũ; hỏi không
ra mới lấy chữ đã ghi. Vì vậy tiện ích xin thêm quyền đọc dữ liệu trên mọi
trang — trình duyệt sẽ hỏi lại khi cài đè.

Từ bản 1.3.0, `content.js` bắt luôn `Alt+X` ngay trong trang: bôi đen xong bấm
là nó lấy chữ tại đúng thời điểm đó rồi mở cửa sổ dịch. Đường này không cần tới
ô phím tắt của trình duyệt — chỗ hay bị bỏ trống khi cài tiện ích ngoài cửa hàng
hoặc bị tiện ích khác chiếm mất. Phím tắt cấp trình duyệt vẫn giữ nguyên để dùng
được ở những trang `content.js` không chạy được; một lần bấm mà cả hai đường
cùng tới thì đường nào tới trước làm, đường sau bỏ qua.

Từ bản 1.3.2, chữ bôi đen được gửi về ngay khi người dùng **nhấn phím Alt**
(bước đầu của tổ hợp): phím tắt cấp trình duyệt nuốt trọn Alt+X nên trang không
bao giờ thấy chữ X, gửi ở nhịp Alt thì tiện ích luôn có sẵn chữ mới nhất. Ngoài
ra đường tới sau không còn bị bỏ qua vô điều kiện — nó lấy được chữ mà đường
trước không thì chữ đó vẫn được nạp vào cửa sổ vừa mở. Chữ bôi đen cũng được ghi
riêng theo từng tab, tab chạy nền không đè mất chữ của tab đang xem.

Từ bản 1.3.3, mở ra mà ô nhập trống thì cửa sổ hiện luôn một dòng nói vì sao:
trang bị trình duyệt khoá (`edge://`, cửa hàng tiện ích, trình xem PDF) hay đơn
giản là lúc bấm không có chữ nào đang bôi đen.

Từ bản 1.4.0, ở những trang trình duyệt khoá hẳn (PDF, `edge://`, `file://`),
cửa sổ tự lấy chữ trong clipboard: bôi đen → `Ctrl+C` → `Alt+X` là dịch được cả
file PDF. Chỉ dùng clipboard ở đúng những chỗ đó, và luôn nói rõ chữ lấy từ đâu.

Cài, nạp lại hoặc **bật lại** tiện ích xong, các tab đang mở được chèn
`content.js` ngay, không phải F5 từng tab.

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

## Bấm Alt+X mà không thấy gì

Đi lần lượt:

1. Vào `edge://extensions` xem **công tắc của tiện ích có đang bật không** —
   tắt thì không có gì chạy cả. Đây là nguyên nhân hay gặp nhất.
2. Bấm thử **icon tiện ích trên thanh công cụ**. Ra cửa sổ dịch nghĩa là tiện ích
   sống, chỉ phím tắt có vấn đề.
3. Trang đang mở có phải `edge://`, cửa hàng tiện ích hay trình xem PDF không —
   những chỗ đó trình duyệt cấm tiện ích đụng vào.
4. Mở **Xem chi tiết → Service worker** ở trang extensions rồi bấm `Alt+X`. Log
   `[EngMaster]` ghi rõ mỗi lần bấm đọc được chữ gì.

## Giới hạn

- Chỉ chạy khi trình duyệt đang được focus. Bấm ở Word/Excel thì không ăn —
  dùng app EngMaster bản desktop cho trường hợp đó.
- Không đọc được chữ bôi đen ở trang `edge://`, `chrome://`, cửa hàng tiện ích,
  trang `file://` và **trình xem PDF**. Riêng PDF không phải do bị chặn: trình xem
  vẽ trang bằng plugin chứ không phải HTML, chữ bôi đen không nằm trong DOM nên
  `window.getSelection()` trả về rỗng — không tiện ích nào đọc được. Ở những chỗ
  này, **bôi đen rồi bấm Ctrl+C trước, sau đó Alt+X**: cửa sổ tự lấy chữ trong
  clipboard (từ bản 1.4.0) và nói rõ chữ đó lấy từ đâu.
- Cần trang EngMaster đã deploy có hỗ trợ `?view=quick-translate` (từ bản này
  trở đi).

## Quyền xin và lý do

| Quyền | Dùng để |
| --- | --- |
| `activeTab` | Đọc vùng chọn của đúng tab đang xem, chỉ tại thời điểm bấm phím tắt |
| `scripting` | Chạy đoạn lấy `window.getSelection()` trong tab đó |
| `storage` | Nhớ địa chỉ trang EngMaster |
| `<all_urls>` | Cho `content.js` chạy trên mọi trang để bắt `Alt+X` và ghi chữ vừa bôi đen |
| `clipboardRead` | Lấy chữ trong clipboard, CHỈ khi trang bị trình duyệt khoá (PDF, `edge://`, `file://`) và không đọc được vùng chọn |

Chữ bôi đen chỉ được giữ trong bộ nhớ tạm của phiên trình duyệt (tối đa 10 phút,
mất khi đóng trình duyệt) và chỉ đi tới trang EngMaster của bạn. Không chạy nền,
không thu thập gì khác.
