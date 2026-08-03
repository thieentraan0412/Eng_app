# Rule theo nền tảng — Mục 15, 16, 17, 23

Chỉ đọc phần ứng với nền tảng đang làm. Nếu sản phẩm responsive cả PC lẫn mobile thì đọc cả hai phần 16 và 17.

## 15. Desktop app

- Tận dụng chuột, bàn phím, hover, phím tắt và context menu.
- Hỗ trợ resize cửa sổ ở nhiều kích thước.
- Không giả định người dùng luôn mở ứng dụng toàn màn hình.
- Đảm bảo giao diện hoạt động khi minimize, maximize và restore.
- Hỗ trợ focus rõ ràng khi dùng bàn phím.
- Các thao tác thường dùng nên có phím tắt hợp lý.
- Context menu chỉ chứa hành động liên quan trực tiếp đến đối tượng.
- Hỗ trợ drag and drop khi thực sự giúp thao tác nhanh hơn.
- Hiển thị trạng thái thiết bị: máy in, máy quét, mạng, đồng bộ.
- Xử lý rõ trường hợp thiết bị bị ngắt kết nối.
- Không để modal che toàn bộ thông tin quan trọng trong lúc thao tác.
- Hạn chế mở quá nhiều cửa sổ phụ.
- Giữ trạng thái và vị trí cửa sổ nếu giúp người dùng làm việc liên tục.

## 16. Web PC

- Tối ưu cho tác vụ quản trị, dữ liệu lớn và thao tác lặp lại.
- Hỗ trợ URL có thể chia sẻ cho trang chi tiết hoặc bộ lọc khi phù hợp.
- Giữ trạng thái khi người dùng dùng nút Back và Forward của trình duyệt.
- **Cảnh báo khi người dùng rời trang có dữ liệu chưa lưu.**
- Hỗ trợ mở chi tiết ở tab mới khi nghiệp vụ cần so sánh nhiều đối tượng.
- Không làm mất bộ lọc hoặc vị trí cuộn khi quay lại danh sách.
- Dashboard phải ưu tiên KPI có khả năng hành động, không chỉ trang trí.
- Biểu đồ phải có tiêu đề, đơn vị và khoảng thời gian rõ ràng.
- Form dài nên chia thành section hoặc step hợp lý.
- Session timeout phải cảnh báo trước khi đăng xuất.
- Kiểm tra ở 1280x720, 1366x768, 1440x900 và 1920x1080.

## 17. Web mobile

- Thiết kế mobile-first cho các tác vụ chính.
- **Không phụ thuộc vào hover.**
- Vùng chạm phải đủ lớn và có khoảng cách tránh bấm nhầm.
- Ưu tiên thao tác bằng một tay khi phù hợp.
- Các chức năng chính có thể đặt ở bottom navigation.
- Không đặt quá nhiều nút trên cùng một hàng.
- Tránh modal nhỏ nhiều tầng; ưu tiên full-screen dialog hoặc bottom sheet.
- Tối ưu form cho bàn phím điện thoại.
- Chọn đúng kiểu bàn phím cho số, điện thoại, email và URL (`inputmode`, `type`).
- **Không để bàn phím che nút xác nhận hoặc trường đang nhập.**
- Giữ dữ liệu khi người dùng chuyển ứng dụng hoặc mạng gián đoạn.
- Hỗ trợ safe area và nhiều tỷ lệ màn hình.
- Tối ưu ảnh, dung lượng và tốc độ tải.
- Hiển thị phản hồi ngay khi chạm để người dùng biết hệ thống đã nhận thao tác.

## 23. Phần mềm POS, F&B và bán lẻ

Nhóm rule này có tỷ lệ BLOCKER cao nhất vì liên quan trực tiếp tới tiền.

- Ưu tiên tốc độ thao tác và giảm số lần nhấn.
- Nút thêm món, thanh toán, giữ đơn và gửi bếp phải dễ nhận biết.
- Hiển thị rõ bàn, khách hàng, nhân viên và trạng thái đơn.
- Món mới, món đã gửi bếp, món đã hủy và món trả phải có trạng thái khác nhau.
- Số lượng, đơn giá, giảm giá, thuế và thành tiền phải minh bạch.
- **Mọi thay đổi đơn giá hoặc số lượng phải cập nhật lại tổng tiền ngay.**
- Khi tăng giảm số lượng, phải áp dụng đúng đơn giá và rule giảm giá hiện tại.
- Không tự giữ đơn giá đã làm tròn khi nghiệp vụ yêu cầu quay về đơn giá gốc.
- Làm tròn đơn hàng phải có rule rõ ràng và có thể kiểm tra lại.
- Khi thêm món sau khi làm tròn, cần xác định rõ có reset làm tròn hay không.
- **Thanh toán phải chống nhấn lặp và tạo giao dịch trùng.**
- In hóa đơn phải hiển thị trạng thái đang in, thành công hoặc thất bại.
- Hủy đơn, trả hàng và hoàn tiền phải có xác nhận và phân quyền.
- **Khi trả hàng, số lượng mặc định không được vượt quá số lượng có thể trả.**
- Danh sách món trả phải thể hiện số lượng đã mua, đã trả và còn có thể trả.
- Hệ thống phải xử lý rõ mất mạng, mất kết nối máy in hoặc đồng bộ thất bại.
- Các chức năng thường dùng phải phù hợp với màn hình cảm ứng.
- Không để popup che mất toàn bộ thông tin đơn hàng trong lúc xử lý.
