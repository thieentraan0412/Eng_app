# Checklist trước khi bàn giao thiết kế — Mục 24

Chạy như một cổng kiểm soát. Với mỗi mục, ghi **Đạt / Chưa đạt / Không áp dụng** kèm bằng chứng (file, dòng, ảnh chụp). Không đánh dấu Đạt nếu chưa nhìn thấy bằng chứng.

| # | Hạng mục | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| 1 | Đã có đầy đủ user flow (gồm luồng lỗi, hủy, mất mạng, hết quyền) | | |
| 2 | Đã có loading, empty, error và success state | | |
| 3 | Đã kiểm tra nội dung dài và dữ liệu bất thường | | |
| 4 | Đã kiểm tra responsive (mobile / tablet / laptop / desktop + zoom 125–200%) | | |
| 5 | Đã kiểm tra keyboard và focus indicator | | |
| 6 | Đã kiểm tra độ tương phản | | |
| 7 | Đã sử dụng đúng Design System (token + component chung) | | |
| 8 | Đã có rule validation cho mọi trường nhập | | |
| 9 | Đã có xác nhận cho thao tác nguy hiểm, nêu rõ hậu quả | | |
| 10 | Đã mô tả quyền của từng vai trò | | |
| 11 | Đã mô tả hành vi khi mất mạng hoặc lỗi hệ thống | | |
| 12 | Đã chuẩn bị asset cho developer (đúng định dạng, kích thước) | | |
| 13 | Đã có acceptance criteria cho luồng chính | | |
| 14 | Đã review giao diện sau khi triển khai (hành vi + nghiệp vụ, không chỉ pixel) | | |

## Kết luận bàn giao

- **Đủ điều kiện bàn giao** khi: không còn mục Chưa đạt nào ở hạng mục 1, 2, 8, 9, 11 và không còn vi phạm BLOCKER nào trong báo cáo audit.
- **Chưa đủ điều kiện**: liệt kê chính xác những mục chưa đạt và việc cần làm, không kết luận chung chung.
