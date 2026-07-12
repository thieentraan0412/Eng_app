# Hướng dẫn dựng Supabase cho EngMasterX

> Phần này cần bạn thao tác trên trình duyệt (tài khoản Supabase của bạn). Làm 1 lần, khoảng 10 phút.

## 1. Tạo project
1. Vào https://supabase.com → đăng ký/đăng nhập (gói **Free**).
2. **New project** → đặt tên `engmaster`, chọn region gần bạn (VD Singapore), đặt **Database password** (lưu lại).
3. Chờ ~2 phút để project khởi tạo.

## 2. Tạo bảng + bật RLS
1. Mở project → menu trái **SQL Editor** → **New query**.
2. Mở file [schema.sql](schema.sql), **copy toàn bộ** dán vào editor.
3. Bấm **Run**. Kết quả "Success" là xong (đã tạo 9 bảng + RLS + trigger).

## 3. Bật Auth (đăng nhập email)
1. Menu trái **Authentication** → **Providers** → bật **Email** (mặc định đã bật).
2. (Tùy chọn) Trong **Authentication → Providers → Email**, tắt "Confirm email" khi dev cho tiện test.
3. (Tùy chọn) Bật **Google** nếu muốn đăng nhập Google (cần cấu hình OAuth sau).

## 4. Lấy khóa kết nối cho app
1. Menu trái **Project Settings** (bánh răng) → **API**.
2. Copy 2 giá trị:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Ở thư mục dự án, sao chép `.env.example` thành **`.env`** và điền 2 giá trị trên.

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi... bắt đầu GĐ 1 —
```

> ⚠️ `anon key` là khóa công khai dùng ở client — an toàn để đặt trong app desktop, vì RLS mới là lớp chặn thật sự. Tuyệt đối KHÔNG dùng `service_role` key trong app.

## 5. Kiểm tra
- Chạy `npm run dev`. App mở lên, không lỗi kết nối là đạt.
- Việc tạo tài khoản/đăng nhập thật sẽ làm ở **GĐ 1** (màn hình Auth).

---

## Kiểm chứng RLS (làm ở GĐ 1)
Sau khi có màn hình đăng nhập, test: tạo 2 tài khoản, mỗi tài khoản chỉ thấy dữ liệu của mình → xác nhận RLS hoạt động.
