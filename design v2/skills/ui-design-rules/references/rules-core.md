# Rule cốt lõi — Mục 1–14

Áp dụng cho mọi nền tảng. Đọc file này trong cả chế độ BUILD và AUDIT.

## 1. Nguyên tắc chung

- Thiết kế dựa trên mục tiêu và nhu cầu thực tế của người dùng.
- Không ưu tiên giao diện đẹp hơn khả năng sử dụng.
- Mỗi màn hình phải có một mục tiêu chính rõ ràng.
- Luôn hiển thị trạng thái hiện tại của hệ thống.
- Dùng từ ngữ quen thuộc với người dùng, tránh thuật ngữ kỹ thuật không cần thiết.
- Giữ giao diện và cách thao tác nhất quán trong toàn bộ sản phẩm.
- Ưu tiên ngăn ngừa lỗi thay vì chỉ hiển thị thông báo sau khi lỗi xảy ra.
- Cho phép người dùng quay lại, hủy hoặc hoàn tác khi phù hợp.
- Không để người dùng phải ghi nhớ thông tin từ màn hình trước.
- Thiết kế cho dữ liệu thực tế, bao gồm dữ liệu dài, thiếu, rỗng hoặc bất thường.

## 2. Phân tích nghiệp vụ và người dùng

- Xác định đầy đủ các nhóm người dùng và quyền của từng nhóm.
- Xác định mục tiêu, khó khăn và tần suất sử dụng của từng nhóm.
- Mô tả quy trình nghiệp vụ từ đầu đến cuối trước khi thiết kế màn hình.
- Xác định trạng thái dữ liệu và điều kiện chuyển trạng thái.
- Xác định các bước bắt buộc, bước tùy chọn và bước có thể bỏ qua.
- Thiết kế đầy đủ luồng thành công, lỗi, hủy, mất mạng và hết quyền truy cập.
- Không thay đổi dữ liệu hoặc trạng thái quan trọng mà không thông báo cho người dùng.

## 3. Kiến trúc thông tin và điều hướng

- Nhóm các chức năng có liên quan vào cùng khu vực.
- Đặt tên menu theo ngôn ngữ nghiệp vụ của người dùng.
- Các chức năng quan trọng và thường dùng phải dễ tìm.
- Không tạo quá nhiều cấp menu nếu không thật sự cần thiết.
- Dùng sidebar cho hệ thống có nhiều phân hệ.
- Dùng tab cho các nhóm nội dung cùng cấp trong một đối tượng.
- Dùng breadcrumb khi người dùng cần biết vị trí trong cấu trúc nhiều cấp.
- Giữ vị trí menu và hành vi điều hướng nhất quán.
- Luôn có trạng thái đang chọn cho menu, tab hoặc bộ lọc hiện tại.

## 4. Bố cục và phân cấp thông tin

- Dùng grid và hệ thống khoảng cách thống nhất.
- Căn chỉnh các thành phần theo một trục rõ ràng.
- Nhóm nội dung liên quan bằng khoảng cách, viền hoặc nền.
- Dùng kích thước, độ đậm và vị trí để tạo phân cấp thị giác.
- Không đặt quá nhiều thành phần cạnh tranh sự chú ý trên cùng một màn hình.
- Nút hành động chính phải nổi bật hơn nút phụ.
- Nội dung quan trọng phải xuất hiện trước nội dung bổ sung.
- Hạn chế dùng quá nhiều card nếu chúng không tạo ra nhóm thông tin rõ ràng.
- Không lấp đầy khoảng trống chỉ để giao diện trông nhiều nội dung hơn.

## 5. Typography

- Sử dụng số lượng font chữ tối thiểu.
- Xây dựng hệ thống heading, body, label và caption rõ ràng.
- Giữ cỡ chữ và độ đậm nhất quán cho cùng một loại nội dung.
- Không dùng chữ quá nhỏ cho thông tin quan trọng.
- Đảm bảo line-height đủ để đọc dễ dàng.
- Hạn chế viết toàn bộ nội dung bằng chữ in hoa.
- Không dùng màu chữ quá nhạt làm giảm khả năng đọc.
- Kiểm tra giao diện khi nội dung dài hơn thiết kế mẫu.
- Cho phép giao diện hoạt động khi người dùng phóng to chữ hoặc trình duyệt.

## 6. Màu sắc

- Xây dựng màu chính, màu phụ và màu trung tính rõ ràng.
- Quy định màu riêng cho thành công, cảnh báo, lỗi và thông tin.
- **Không dùng màu sắc làm dấu hiệu duy nhất để thể hiện trạng thái.**
- Luôn kết hợp màu với icon, nhãn hoặc nội dung mô tả.
- Đảm bảo độ tương phản giữa chữ, nền và thành phần tương tác.
- Không dùng quá nhiều màu nổi bật trên cùng một màn hình.
- Màu của cùng một trạng thái phải giống nhau trên toàn hệ thống.
- Thiết kế riêng màu cho hover, focus, pressed, selected và disabled.
- Kiểm tra ở cả light mode và dark mode nếu sản phẩm hỗ trợ.

## 7. Icon và hình ảnh

- Icon phải cùng phong cách, độ dày và kích thước.
- Icon khó hiểu phải đi kèm nhãn hoặc tooltip.
- Không dùng icon trang trí gây nhầm lẫn với nút thao tác.
- Không dùng hai icon khác nhau cho cùng một chức năng.
- Ảnh sản phẩm phải có kích thước và tỷ lệ hiển thị thống nhất.
- Chuẩn bị trạng thái ảnh lỗi hoặc ảnh chưa có.
- Dùng ảnh đúng mục đích, không làm chậm hoặc gây nhiễu giao diện.

## 8. Button và hành động

- Mỗi khu vực chỉ nên có một hành động chính nổi bật.
- Nút phải có nhãn mô tả hành động, tránh từ chung chung như "OK".
- Dùng động từ rõ ràng: "Lưu thay đổi", "Xác nhận thanh toán", "Tạo đơn".
- Nút nguy hiểm (xóa, hủy đơn, hoàn tiền) phải được phân biệt rõ.
- **Không đặt nút nguy hiểm sát nút xác nhận chính.**
- Hiển thị trạng thái loading sau khi người dùng nhấn.
- Vô hiệu hóa thao tác lặp trong lúc hệ thống đang xử lý.
- **Không cho phép nhấn liên tục tạo nhiều bản ghi hoặc nhiều đơn hàng.**
- Không để nút disabled mà không giải thích lý do khi người dùng cần biết.
- Cho phép undo thay vì xác nhận nhiều bước với thao tác dễ hoàn tác.

## 9. Form nhập liệu

- Mỗi trường nhập phải có label rõ ràng.
- Placeholder không được thay thế hoàn toàn cho label.
- Phân biệt rõ trường bắt buộc và không bắt buộc.
- Sắp xếp trường theo thứ tự nghiệp vụ và tần suất sử dụng.
- Chọn đúng loại input cho số, ngày, thời gian, tiền tệ và mật khẩu.
- Hiển thị đơn vị ngay cạnh giá trị khi cần.
- Validation phải xuất hiện gần trường bị lỗi.
- Nội dung lỗi phải nói rõ vấn đề và cách sửa.
- **Không xóa dữ liệu người dùng đã nhập khi submit lỗi.**
- Tự động định dạng dữ liệu nhưng không làm thay đổi ý nghĩa giá trị.
- Dùng giá trị mặc định hợp lý, không tự chọn dữ liệu có thể gây hậu quả.
- Hỗ trợ điều hướng bằng phím Tab trên desktop và web PC.

## 10. Bảng dữ liệu

- Chỉ hiển thị các cột cần thiết cho tác vụ hiện tại.
- Cố định cột hoặc tiêu đề khi bảng dài nếu cần.
- Hỗ trợ sắp xếp, lọc, tìm kiếm và phân trang rõ ràng.
- Hiển thị tổng số kết quả.
- Các thao tác trên từng dòng phải dễ nhận biết.
- Không giấu quá nhiều thao tác quan trọng trong menu ba chấm.
- Dùng bulk action khi người dùng thường xử lý nhiều dòng.
- Giữ bộ lọc khi người dùng mở chi tiết rồi quay lại.
- Có trạng thái "không có dữ liệu" và "không có kết quả tìm kiếm" riêng biệt.
- Xử lý nội dung dài bằng wrap, truncate và tooltip phù hợp.
- Số và tiền tệ căn phải; văn bản căn trái.
- Không dùng bảng quá rộng trên mobile; chuyển thành card hoặc cuộn ngang có kiểm soát.

## 11. Modal, dialog, drawer và toast

- Chỉ dùng modal khi người dùng cần tập trung vào một tác vụ ngắn.
- Không đặt quy trình dài hoặc nhiều bước trong modal nhỏ.
- Tiêu đề modal phải mô tả rõ tác vụ.
- Modal phải có nút đóng hoặc hủy rõ ràng.
- Không đóng modal ngoài ý muốn khi người dùng đang nhập dữ liệu quan trọng.
- Khi đóng modal có dữ liệu chưa lưu, cần cảnh báo phù hợp.
- Không mở nhiều modal chồng lên nhau.
- Dùng full-screen dialog trên mobile cho form hoặc nội dung phức tạp.
- Toast chỉ dùng cho thông báo ngắn, không yêu cầu hành động quan trọng.
- **Lỗi nghiêm trọng không nên chỉ hiển thị bằng toast rồi tự biến mất.**
- Drawer phù hợp cho bộ lọc, thông tin phụ hoặc điều hướng trên mobile.

## 12. Trạng thái giao diện

- Mỗi component tương tác phải có: default, hover, focus, pressed, selected, disabled.
- Mỗi màn hình phải có loading state.
- Mỗi danh sách phải có empty state.
- Mỗi thao tác bất đồng bộ phải có success và error state.
- Dùng skeleton khi nội dung tải theo cấu trúc ổn định.
- Không để màn hình trắng trong lúc tải.
- Thông báo lỗi phải cho biết có thể thử lại hay cần liên hệ hỗ trợ.
- Trạng thái offline và reconnect phải được thể hiện rõ.
- Khi đồng bộ dữ liệu, hiển thị trạng thái đang đồng bộ, thành công hoặc thất bại.

## 13. Thông báo và nội dung UX

- Nội dung phải ngắn, rõ và hướng đến hành động.
- Không đổ lỗi cho người dùng.
- Không dùng mã lỗi kỹ thuật làm nội dung chính.
- Thông báo xác nhận phải nêu rõ hậu quả của thao tác.
- Dùng từ ngữ thống nhất cho cùng một đối tượng và hành động.
- Không dùng nhiều tên khác nhau cho cùng một chức năng.
- Nút xác nhận phải phản ánh đúng hành động sẽ xảy ra.
- **Với thao tác không thể hoàn tác, phải nói rõ điều đó.**

## 14. Responsive design

- Không thiết kế responsive bằng cách chỉ thu nhỏ toàn bộ giao diện.
- Thay đổi cấu trúc bố cục theo không gian hiển thị.
- Ưu tiên nội dung và thao tác quan trọng trên màn hình nhỏ.
- Kiểm tra tối thiểu ở mobile, tablet, laptop và desktop.
- Không phụ thuộc vào một độ phân giải duy nhất.
- Kiểm tra khi trình duyệt zoom 125%, 150% và 200%.
- Không để text, button hoặc input bị cắt khi nội dung dài.
- Sidebar desktop nên chuyển thành drawer hoặc navigation phù hợp trên mobile.
- Bộ lọc desktop có thể chuyển thành drawer hoặc bottom sheet trên mobile.
- Bảng desktop có thể chuyển thành card, danh sách hoặc cuộn ngang có kiểm soát.
