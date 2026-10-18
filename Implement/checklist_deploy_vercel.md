# Checklist — Deploy Web lên Vercel (Git Integration)

> Mục tiêu: kết nối repo GitHub với Vercel. Sau đó **mỗi lần push code lên GitHub,
> Vercel tự động build & deploy lại** — không cần GitHub Action, không cần token/secrets.
>
> Chỉ deploy **bản web** (`npm run build:web` → `dist-web/`). App desktop (Electron)
> không liên quan.

**Cách này gọn hơn nhiều so với GitHub Actions:** chỉ import repo + đặt vài biến môi
trường trên dashboard là xong. Không cần `vercel link`, không cần token, không cần
`.github/workflows`.

---

## Bước 1 — `vercel.json` (ĐÃ XONG ✅, và BẮT BUỘC phải có)

File `vercel.json` ở gốc repo:

```json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": "dist-web",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [x] Đã tạo `vercel.json` ở gốc repo.
- [x] Đã commit & push `vercel.json` lên GitHub.

**Vì sao bắt buộc:** mặc định Vercel chạy `npm run build` — nhưng lệnh đó build bản
**desktop/Electron** (ra `dist/`), sai cho web. `vercel.json` ép Vercel:
- `buildCommand: npm run build:web` → build đúng bản web.
- `outputDirectory: dist-web` → lấy đúng thư mục output.
- `rewrites` → SPA fallback, mọi route trả về `index.html` (không 404 khi F5).

---

## Bước 2 — Import repo vào Vercel

- [ ] Đăng nhập **vercel.com** (nên đăng nhập bằng chính tài khoản GitHub để thấy repo).
- [ ] **Add New… → Project**.
- [ ] Ở danh sách **Import Git Repository**, chọn repo `Eng_app`.
  - Lần đầu Vercel sẽ xin quyền truy cập GitHub → cho phép (có thể giới hạn đúng 1 repo).

---

## Bước 3 — Cấu hình build (thường Vercel tự đọc `vercel.json`)

Ở màn hình **Configure Project** trước khi Deploy:

- [ ] **Framework Preset**: để `Vite` hoặc `Other` đều được (vì đã có `vercel.json`).
- [ ] Kiểm tra **Build Command** = `npm run build:web` và **Output Directory** = `dist-web`.
  - Vercel thường tự lấy từ `vercel.json`. Nếu ô đang trống/khác → nhập tay đúng 2 giá trị này.
- [ ] **Install Command**: để mặc định (`npm install`).

> Nếu build lỗi vì cài gói native (`uiohook-napi`) hoặc tải Electron: xem mục
> "Xử lý sự cố" bên dưới.

---

## Bước 4 — Thêm biến môi trường Supabase

Vercel project → **Settings → Environment Variables** (hoặc điền ngay ở màn Configure):

| Biến | Giá trị | Môi trường |
|---|---|---|
| `VITE_SUPABASE_URL` | URL project Supabase (giống `.env` local) | Production + Preview |
| `VITE_SUPABASE_ANON_KEY` | anon key (giống `.env` local) | Production + Preview |

- [ ] Đã thêm 2 biến cho **Production**.
- [ ] Đã thêm 2 biến cho **Preview** (để deploy thử ở nhánh/PR cũng chạy được).

> `VITE_*` được nhúng vào bundle **lúc build**, nên phải đặt trước khi build. File `.env`
> local đang bị gitignore (không lên GitHub) → **bắt buộc** khai báo lại ở đây.

---

## Bước 5 — Deploy lần đầu & kiểm tra

- [ ] Bấm **Deploy**, chờ build xong.
- [ ] Mở URL production Vercel cấp (dạng `ten-project.vercel.app`).
- [ ] Giao diện EngMaster hiện đúng, đăng nhập được, thấy đúng dữ liệu (chung DB Supabase).
- [ ] F5 ở một trang bất kỳ → không 404 (xác nhận SPA rewrite hoạt động).
- [ ] (Tùy chọn) Vào Supabase → Auth → URL Configuration, đặt **Site URL** = domain Vercel.

---

## Bước 6 — Xác nhận auto-deploy

Từ giờ Git integration tự lo việc deploy:

- [ ] Sửa một thứ nhỏ trong `src/`, commit & **push lên `main`**.
- [ ] Vào Vercel → tab **Deployments** thấy một bản build mới tự chạy.
- [ ] Build xong → domain production cập nhật theo.

**Quy tắc auto-deploy của Vercel:**
- Push lên nhánh **`main`** (nhánh production) → deploy **Production** (cập nhật domain chính).
- Push lên nhánh khác / mở Pull Request → deploy **Preview** (URL riêng để xem thử, không đụng production).

---

## (Tùy chọn) Bước 7 — Tên miền riêng

- [ ] Vercel project → **Settings → Domains** → thêm domain của bạn, làm theo hướng dẫn trỏ DNS.
- [ ] Cập nhật lại **Site URL** trong Supabase = domain thật.

---

## Xử lý sự cố thường gặp

- **Build fail khi cài `uiohook-napi` hoặc tải Electron:** các gói này chỉ cho desktop,
  web không dùng. Nếu build đỏ vì chúng, cân nhắc chuyển `uiohook-napi` sang
  `optionalDependencies` trong `package.json` (web không import nên không ảnh hưởng);
  và/hoặc thêm env `ELECTRON_SKIP_BINARY_DOWNLOAD=1` trong Vercel để bỏ tải binary Electron.

- **Trang trắng / lỗi thiếu Supabase:** kiểm tra đã đặt `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY` cho **Production** (Bước 4) chưa. Đổi env xong phải **redeploy**
  mới có hiệu lực (Deployments → … → Redeploy).

- **404 khi refresh trang con:** thiếu/sai `rewrites` trong `vercel.json` (Bước 1).

- **Vercel build ra sai (chạy `npm run build` bản desktop):** kiểm tra Build Command đã là
  `npm run build:web` và Output Directory là `dist-web` chưa (Bước 3 / `vercel.json`).

- **KHÔNG bật đồng thời GitHub Actions deploy:** dự án này đi theo Git integration; đừng
  thêm workflow `vercel deploy` nữa kẻo **deploy 2 lần** mỗi push.

---

## Tóm tắt

| Việc | Ở đâu | Bắt buộc? |
|---|---|---|
| `vercel.json` (build:web + dist-web + rewrites) | trong repo | ✅ (đã xong) |
| Import repo | vercel.com | ✅ |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Vercel → Env Vars | ✅ |
| `vercel link`, token, GitHub Secrets, workflow | — | ❌ không cần (đó là cách Actions) |

Sau khi làm xong Bước 2–5, **push code lên GitHub là web tự deploy lại** — đúng mục tiêu.
