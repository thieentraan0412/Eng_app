# Kế hoạch xây dựng phiên bản Web cho EngMaster

> **Mục tiêu:** Giữ nguyên app desktop (Electron), tạo thêm bản Web chạy trên trình
> duyệt, **dùng chung code `src/` và chung database Supabase**. Đăng nhập cùng tài khoản
> trên web hay desktop đều thấy cùng dữ liệu (RLS lọc theo `user_id`).
>
> **Phương án đã chọn — Kiểu A:** cùng một repo, thêm target build web. Folder `web/`
> chỉ chứa "vỏ" (entry + config), toàn bộ logic/pages/services **import lại từ `src/`**
> → không trùng code, sửa 1 nơi áp dụng cả web lẫn desktop.

Tiến độ tổng: **code đã xong & chạy được ở local. Còn lại: test trên trình duyệt →
cấu hình Supabase → deploy.**

---

## ✅ ĐÃ XONG — Dựng code bản web (Claude làm)

### Rà soát & quyết định
- [x] Rà `src/`: không dính Electron, chỉ `DesktopTranslatePopup.tsx` dùng `window.api`.
- [x] Rà `supabase/schema.sql`: RLS bật đủ 12/12 bảng — an toàn mở web.
- [x] Quyết định: chấp nhận `get_db_stats()` hiển thị số liệu tổng (không vá).
- [x] Quyết định: **không dùng xác nhận email**.

### File mới
- [x] `vite.web.config.ts` — config web: chỉ `react()` + alias `@`→`src`, bỏ plugin
      Electron, `root: web/`, `outDir: dist-web/`, `envDir` = gốc repo (đọc chung `.env`),
      `server.port = 5174`.
- [x] `web/index.html` — entry HTML bản web.
- [x] `web/main.tsx` — chỉ render `App` (không có popup dịch desktop), import từ `../src`.
- [x] `src/platform.ts` — cờ `isDesktop` / `isWeb` (dựa trên có `window.api` hay không).

### File sửa (đã kiểm tra không ảnh hưởng desktop)
- [x] `src/components/AppLayout.tsx` — guard `window.api` (web bỏ qua desktop-translate + quick-save).
- [x] `src/pages/SettingsPage.tsx` — `window.api?.` + ẩn mục "Dịch nhanh toàn màn hình" trên web.
- [x] `src/services/cloud/supabaseClient.ts` — `detectSessionInUrl: isWeb`.
- [x] `package.json` — thêm script `dev:web`, `build:web`, `preview:web`.
- [x] `tsconfig.json` — thêm `web` vào `include`.

### Kiểm chứng
- [x] `npm run typecheck` — sạch, 0 lỗi.
- [x] `npm run dev:web` — chạy ở `http://localhost:5174`, các module transform HTTP 200,
      không lỗi biên dịch.
- [x] `AuthScreen.tsx` vốn đã dùng `window.api?.` — an toàn, không cần sửa.

---

## ⏳ CÒN LẠI

### Bước A — Deploy lên host tĩnh
- [ ] `npm run build:web` → sinh `dist-web/`.
- [ ] Chọn host: **Cloudflare Pages** / Vercel / Netlify.
- [ ] Khai báo trên host: build command `npm run build:web`, output dir `dist-web`.
- [ ] Đặt biến môi trường `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` trên host.
- [ ] Bật SPA fallback (mọi route → `index.html`).
- [ ] Cập nhật **Site URL** trong Supabase = domain thật vừa deploy.
- [ ] Test lại đăng nhập + dữ liệu trên bản production.

### Bước B — Polish riêng cho web (tùy chọn, làm sau)
- [ ] Favicon / title / meta cho web.
- [ ] Điều hướng bằng URL (hiện đang dùng state nội bộ, chưa có router URL).
- [ ] Rà lại các nút/menu chỉ hợp lý trên desktop.

---

## Ghi chú & rủi ro

- **Anon key public trên web là bình thường** — an toàn nhờ RLS (đã xác nhận đủ 12 bảng).
- `get_db_stats()` hiển thị số liệu **tổng toàn hệ thống** cho mọi user — đã chấp nhận.
- **Desktop không bị ảnh hưởng:** chỉ thêm file/config mới; các chỗ guard `window.api`
  vẫn chạy y như cũ trên Electron.
- **Popup dịch toàn màn hình** là đặc thù desktop → bản web không có.
- Chưa có router theo URL: web ban đầu điều hướng bằng state nội bộ như desktop (Bước B).

---

## Lệnh hay dùng

| Việc | Lệnh |
|---|---|
| Chạy web (dev) | `npm run dev:web` → http://localhost:5174 |
| Build web | `npm run build:web` → `dist-web/` |
| Xem thử bản build | `npm run preview:web` |
| Chạy app desktop | `npm run dev` (nhớ unset `ELECTRON_RUN_AS_NODE`) |
