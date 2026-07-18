# Checklist — CI/CD Deploy Web lên Vercel bằng GitHub Actions

> Mục tiêu: mỗi lần push lên nhánh `main`, GitHub Actions tự build bản web
> (`npm run build:web` → `dist-web/`) và deploy lên Vercel.
>
> Chỉ deploy **bản web**; app desktop (Electron) không liên quan.

Phương án dùng ở đây: **GitHub Actions gọi Vercel CLI** (`vercel build` +
`vercel deploy --prebuilt`). Biến môi trường Supabase lấy từ chính project Vercel
(qua `vercel pull`), nên **không cần** nhét key Supabase vào GitHub.

> 💡 **Có cách đơn giản hơn không cần Action:** vào vercel.com → Add New Project →
> import repo GitHub → Vercel tự deploy mỗi lần push. Nếu chọn cách này thì bỏ qua
> phần GitHub Actions, chỉ cần làm **Bước 1 (vercel.json)** + **Bước 5 (env vars)** +
> cấu hình Build Command / Output Directory trong dashboard. Bên dưới là cách dùng
> Action theo đúng yêu cầu.

---

## Bước 1 — Thêm `vercel.json` vào repo

Tạo file `vercel.json` ở **gốc repo** với nội dung:

```json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": "dist-web",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- `buildCommand` / `outputDirectory`: chỉ cho Vercel build đúng target web.
- `rewrites`: SPA fallback — mọi route trả về `index.html` (app không bị 404 khi F5).

- [x] Đã tạo `vercel.json` ở gốc repo.
- [ ] Commit `vercel.json` lên git (chưa commit — làm cùng lúc đẩy code lên GitHub).

---

## Bước 2 — Tạo project trên Vercel + lấy ORG_ID / PROJECT_ID

Cần Vercel CLI ở máy (chạy 1 lần để lấy ID, không phải để deploy tay).

```bash
npm i -g vercel
vercel login
vercel link        # chọn/khởi tạo project cho repo này
```

Sau `vercel link` sẽ có file `.vercel/project.json` chứa `orgId` và `projectId`.

- [ ] Đã `vercel link` → mở `.vercel/project.json`, ghi lại `orgId` và `projectId`.
- [ ] Đảm bảo `.vercel` đã nằm trong `.gitignore` (KHÔNG commit thư mục này).

---

## Bước 3 — Tạo Vercel Access Token

- [ ] Vào **vercel.com → Account Settings → Tokens → Create Token**.
- [ ] Đặt tên (vd `github-actions`), scope đủ để deploy, copy token (chỉ hiện 1 lần).

---

## Bước 4 — Thêm GitHub Secrets

Repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**.
Thêm 3 secret:

| Tên secret | Giá trị |
|---|---|
| `VERCEL_TOKEN` | token vừa tạo ở Bước 3 |
| `VERCEL_ORG_ID` | `orgId` trong `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` trong `.vercel/project.json` |

- [ ] Đã thêm đủ 3 secret.

---

## Bước 5 — Đặt biến môi trường Supabase trên Vercel

Vercel project → **Settings → Environment Variables** → thêm cho môi trường
**Production** (và Preview nếu muốn deploy nhánh khác):

| Biến | Giá trị |
|---|---|
| `VITE_SUPABASE_URL` | URL project Supabase (giống `.env` local) |
| `VITE_SUPABASE_ANON_KEY` | anon key (giống `.env` local) |

> Biến `VITE_*` được nhúng vào bundle **lúc build**. `vercel pull` sẽ kéo các biến
> này về cho `vercel build` dùng — nên đặt ở đây, không cần bỏ vào GitHub.

- [ ] Đã thêm 2 biến cho môi trường Production.

---

## Bước 6 — Tạo workflow GitHub Actions

Tạo file `.github/workflows/deploy-web.yml`:

```yaml
name: Deploy Web to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'web/**'
      - 'vite.web.config.ts'
      - 'vercel.json'
      - 'package.json'
      - 'package-lock.json'
      - '.github/workflows/deploy-web.yml'
  workflow_dispatch: {}   # cho phép bấm chạy tay trong tab Actions

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  ELECTRON_SKIP_BINARY_DOWNLOAD: '1'   # khỏi tải binary Electron (không cần cho web)

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Vercel CLI
        run: npm i -g vercel@latest

      - name: Pull Vercel project settings + env
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build (Vite web) trên hạ tầng Vercel
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy prebuilt lên Production
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

- [ ] Đã tạo file workflow và commit.

---

## Bước 7 — Chạy thử & kiểm tra

- [ ] Commit + push tất cả (`vercel.json`, workflow) lên `main`.
- [ ] Mở tab **Actions** trên GitHub → xem job "Deploy Web to Vercel" chạy xanh.
- [ ] Lấy URL production Vercel in ra ở bước Deploy (hoặc trong Vercel dashboard).
- [ ] Mở URL → giao diện EngMaster hiện đúng, đăng nhập được, thấy đúng dữ liệu (chung DB).
- [ ] F5 ở một trang bất kỳ → không bị 404 (xác nhận SPA rewrite hoạt động).
- [ ] (Tùy chọn) Cập nhật **Site URL** trong Supabase → Auth = domain Vercel vừa có.

---

## Xử lý sự cố thường gặp

- **Build fail khi cài dependency native (`uiohook-napi`) hoặc tải Electron:**
  các gói này chỉ cho desktop. `ELECTRON_SKIP_BINARY_DOWNLOAD=1` đã xử lý Electron.
  Nếu vẫn lỗi vì `uiohook-napi`, cân nhắc chuyển nó sang `optionalDependencies`
  trong `package.json` (web không import tới nó nên không ảnh hưởng).

- **Trang trắng / lỗi thiếu Supabase:** kiểm tra đã đặt `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY` cho môi trường **Production** trên Vercel (Bước 5) chưa;
  nhớ `VITE_*` phải có **lúc build**, không phải lúc chạy.

- **404 khi refresh trang con:** thiếu/ sai `rewrites` trong `vercel.json` (Bước 1).

- **Action đỏ ở `vercel pull`:** sai `VERCEL_TOKEN` / `VERCEL_ORG_ID` /
  `VERCEL_PROJECT_ID` (Bước 4), hoặc token hết hạn.

- **Muốn deploy bản xem trước cho nhánh khác (Preview):** bỏ `--prod` ở bước build &
  deploy, và mở rộng `on.push.branches`.

---

## Tóm tắt secrets & biến cần có

| Nơi | Tên | Dùng để |
|---|---|---|
| GitHub Secrets | `VERCEL_TOKEN` | CLI xác thực với Vercel |
| GitHub Secrets | `VERCEL_ORG_ID` | trỏ đúng org |
| GitHub Secrets | `VERCEL_PROJECT_ID` | trỏ đúng project |
| Vercel Env (Production) | `VITE_SUPABASE_URL` | build bản web |
| Vercel Env (Production) | `VITE_SUPABASE_ANON_KEY` | build bản web |
