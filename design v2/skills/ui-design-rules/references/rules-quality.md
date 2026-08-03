# Rule chất lượng và quy trình — Mục 18–22

## 18. Accessibility

- Đảm bảo độ tương phản đủ giữa chữ và nền.
- Mọi chức năng quan trọng phải dùng được bằng bàn phím trên desktop và web PC.
- Focus indicator phải rõ ràng.
- Input phải liên kết đúng với label (`<label for>` hoặc `aria-label`).
- Hình ảnh có ý nghĩa phải có alt text.
- **Không truyền đạt trạng thái chỉ bằng màu sắc.**
- Thứ tự đọc của screen reader phải hợp lý.
- Không tự động phát âm thanh hoặc chuyển động gây khó chịu.
- Cho phép giảm chuyển động nếu người dùng yêu cầu (`prefers-reduced-motion`).
- Vùng bấm phải đủ lớn.
- Nội dung lỗi phải dễ hiểu và có hướng sửa.
- Giao diện phải hoạt động khi phóng to đến 200%.

## 19. Design system

- Xây dựng token cho màu, typography, spacing, radius, shadow và breakpoint.
- Mọi màn hình phải ưu tiên dùng component chung.
- Không tự tạo component mới nếu component hiện tại có thể mở rộng hợp lý.
- Mỗi component phải có đầy đủ trạng thái và variant.
- Đặt tên component theo chức năng, không theo màu hoặc vị trí cụ thể.
- Quy định rõ khi nào dùng từng loại button, input, modal, toast và navigation.
- Component phải hỗ trợ responsive và accessibility.
- Mọi thay đổi component phải được cập nhật vào tài liệu Design System.
- **Không thay đổi trực tiếp component dùng chung chỉ để giải quyết một màn hình riêng lẻ.**

## 20. Figma

- Dùng Auto Layout cho các thành phần có nội dung thay đổi.
- Dùng Component và Variant thay vì sao chép nhiều phiên bản thủ công.
- Dùng Variables hoặc Styles cho màu, typography và spacing.
- Đặt tên frame, layer và component rõ ràng.
- Tách khu vực wireframe, final design và component library.
- Không để quá nhiều layer không tên hoặc tên mặc định.
- Prototype phải thể hiện đầy đủ luồng chính và các trạng thái quan trọng.
- Đánh dấu màn hình đã sẵn sàng cho developer.
- Kiểm tra responsive trực tiếp bằng cách resize frame.
- Sử dụng dữ liệu gần với dữ liệu thật, không chỉ dùng Lorem Ipsum.

## 21. Prototype và kiểm thử

- Bắt đầu bằng wireframe trước khi làm giao diện chi tiết.
- Prototype phải kiểm tra được các tác vụ chính.
- Kiểm thử với người dùng gần với nhóm sử dụng thực tế.
- Quan sát hành vi thay vì chỉ hỏi người dùng có thích giao diện hay không.
- Đo khả năng hoàn thành tác vụ, thời gian thao tác và số lỗi.
- Kiểm tra khả năng tìm thấy chức năng.
- Kiểm tra các trường hợp dữ liệu rỗng, lỗi, dài và bất thường.
- Ghi nhận vấn đề theo mức độ ảnh hưởng và tần suất xảy ra.
- **Sửa vấn đề usability trước khi tối ưu phần trang trí.**

## 22. Handoff cho developer

- Cung cấp đầy đủ kích thước, khoảng cách, màu và typography.
- Mô tả responsive rule cho từng breakpoint.
- Cung cấp trạng thái hover, focus, pressed, loading, disabled và error.
- Ghi rõ điều kiện hiển thị và ẩn của từng thành phần.
- Ghi rõ rule validation và nội dung thông báo lỗi.
- Cung cấp asset đúng định dạng và kích thước.
- Mô tả animation, transition và thời gian nếu có.
- Ghi chú các ràng buộc nghiệp vụ quan trọng.
- Cung cấp acceptance criteria cho luồng chính.
- Review sản phẩm sau khi developer triển khai.
- **Không đánh giá chỉ dựa trên pixel; cần kiểm tra cả hành vi và nghiệp vụ.**
