# Checklist Phát Triển — EngMaster (App học tiếng Anh · Cloud)

> Dựa trên [THIET_KE_PHAN_MEM.md](THIET_KE_PHAN_MEM.md) · `[ ]` chưa · `[x]` xong

## GĐ 0 — Nền tảng
- [x] Khởi tạo app **Electron + React + TypeScript** *(build & typecheck sạch ✅)*
- [x] Dựng **Supabase** (Auth + Postgres + bật RLS) *(9 bảng + 4 policy/bảng đã tạo & RLS bật ✅)*
- [x] Kết nối app ⇄ cloud (`CloudApiClient`) *(code xong, kích hoạt khi có file `.env`)*

## GĐ 1 — Tài khoản + Từ vựng (MVP)
- [x] Đăng ký / Đăng nhập *(Supabase Auth; kết nối + RLS đã test ✅)*
- [x] Khung app (sidebar, Sáng/Tối)
- [x] Quản lý bộ từ & thẻ (lưu cloud)
- [x] Flashcard + SRS (SM-2)
- [x] Bôi màu → Dịch (từ điển JSON)

## GĐ 2 — Học tập
- [x] Ngữ pháp & bài tập + chấm điểm *(MCQ + điền từ, giải thích)*
- [x] Đọc hiểu (Reader + tra từ) *(lưu cloud + bôi màu dịch)*
- [x] Dashboard tiến độ (streak, biểu đồ)

## GĐ 3 — Viết
- [x] Trình soạn thảo Writing (đếm từ, lưu cloud) *(đếm từ/ký tự, lưu + cập nhật cloud)*
- [x] Gợi ý từ khi viết (autocomplete / next-word / synonym) *(Trie + n-gram + thesaurus, Tab để chèn)*
- [x] Cài đặt (theme, tài khoản) *(+ bật/tắt gợi ý từ, + ghi nhớ mật khẩu mã hóa)*

## Xuyên suốt
- [x] Bảo mật: RLS — mỗi user chỉ thấy dữ liệu của mình *(đã test: INSERT ẩn danh bị chặn)*
- [~] Kiểm thử đăng nhập đa thiết bị thấy cùng dữ liệu *(kiến trúc cloud sẵn sàng; cần bạn test thực tế trên 2 máy)*
- [x] Xử lý mất mạng (báo rõ, không treo) *(trạng thái kết nối + báo lỗi mềm qua alert)*
