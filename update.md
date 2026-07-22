# EngMaster — Kế hoạch tính năng Tự động cập nhật qua GitHub (update.md)

> Mục tiêu: bản **desktop (Electron/Windows)** tự kiểm tra phiên bản mới trên **GitHub Releases**,
> tải về nền và cài đặt khi khởi động lại — người dùng không cần tải file thủ công.
> Công cụ: **`electron-updater`** (cùng hệ sinh thái `electron-builder` đã dùng) + **GitHub Releases** làm nơi phát hành.
>
> Bản **web** (Vercel) KHÔNG cần cơ chế này — người dùng tải lại trang là có bản mới. Kế hoạch này chỉ cho desktop.

---

## 0. Vì sao chọn hướng này

| Tiêu chí | Lý do |
|---|---|
| `electron-updater` | Chuẩn de-facto, tích hợp thẳng với `electron-builder` (đã có sẵn trong dự án) |
| GitHub Releases | Miễn phí, repo `thieentraan0412/Eng_app` **đang public** → client tải bản cập nhật **không cần token** |
| NSIS installer | electron-updater trên Windows cập nhật qua bản cài **NSIS** + file `latest.yml` |
| Không tốn hạ tầng | Không cần server update riêng; GitHub lo băng thông tải |

**Ràng buộc quan trọng (đọc trước khi làm):**
- ✅ **Chỉ target `nsis` mới auto-update được.** Target `portable` hiện có KHÔNG hỗ trợ tự cập nhật (bản chạy trực tiếp, không có bộ cài). Portable vẫn build được nhưng sẽ không tự cập nhật — cần nói rõ với người dùng, hoặc khuyến nghị dùng bản cài NSIS.
- ⚠️ **Chưa ký số (code signing).** App chưa có chứng chỉ → Windows SmartScreen vẫn cảnh báo khi cài lần đầu. electron-updater **vẫn cập nhật được** trên Windows dù chưa ký (khác macOS bắt buộc ký). Ký số là việc tùy chọn ở giai đoạn sau (mua chứng chỉ EV/OV).
- ⚠️ **Không chạy trong dev.** `autoUpdater` chỉ hoạt động ở app đã đóng gói. Khi `npm run dev` sẽ bỏ qua (hoặc dùng `dev-app-update.yml` để test — xem §6).

---

## 1. Kiến trúc luồng cập nhật

```
GitHub Release (tag v0.2.0)
  ├─ EngMaster-Setup-0.2.0.exe   (bản cài NSIS)
  ├─ latest.yml                  (metadata: version, sha512, url)  ← electron-updater đọc file này
  └─ *.blockmap                  (tải chênh lệch, tiết kiệm băng thông)
        │
        ▼  (app đang chạy, định kỳ hoặc khi bấm "Kiểm tra cập nhật")
electron main  ──autoUpdater.checkForUpdates()──►  so version với package.json
        │  có bản mới → tải nền (progress)
        │  tải xong → phát sự kiện qua IPC
        ▼
preload (contextBridge)  ──►  Renderer (trang Cài đặt)
        │  hiện: "Có bản 0.2.0 · Đang tải 45% · [Khởi động lại để cập nhật]"
        ▼
người dùng bấm  ──►  autoUpdater.quitAndInstall()  → cài + mở lại app
```

---

## 2. Việc cần làm — theo giai đoạn

### Giai đoạn 1 — Cấu hình phát hành (build/publish)

- [ ] **Cài phụ thuộc**
  ```bash
  npm i electron-updater
  npm i -D electron-log            # (khuyến nghị) ghi log update ra file để debug
  ```
  `electron-updater` là dependency **runtime** (main process require lúc chạy) → để ở `dependencies`, không phải devDependencies.

- [ ] **Thêm `publish` vào `package.json` → `build`** (để electron-builder biết đẩy lên đâu và để nhúng thông tin provider vào `latest.yml`):
  ```jsonc
  "build": {
    "appId": "com.engmaster.app",
    "productName": "EngMaster",
    "publish": [
      {
        "provider": "github",
        "owner": "thieentraan0412",
        "repo": "Eng_app",
        "releaseType": "release"   // chỉ nhận bản release chính thức, không phải draft/prerelease
      }
    ],
    "directories": { "output": "release" },
    ...
  }
  ```

- [ ] **Đảm bảo còn target `nsis`** (đã có). Có thể giữ `portable` cho ai muốn bản chạy trực tiếp, nhưng nhiểu rằng nó không auto-update.

- [ ] **Thêm script phát hành** vào `scripts`:
  ```jsonc
  "release": "npm run build && electron-builder --win --publish always"
  ```
  - `--publish always`: build xong tự tạo/đẩy artifact + `latest.yml` lên GitHub Release.
  - Cần biến môi trường **`GH_TOKEN`** (Personal Access Token, quyền `repo` — hoặc fine-grained: Contents = Read/Write cho repo này) để electron-builder có quyền tạo release & upload. Token này **chỉ dùng lúc build ở máy dev / CI**, KHÔNG nhúng vào app.
  ```bash
  # PowerShell
  $env:GH_TOKEN = "ghp_xxx"; npm run release
  ```

### Giai đoạn 2 — Tích hợp autoUpdater vào Electron main

- [ ] **Tạo `electron/updater.ts`** — gói toàn bộ logic cập nhật, khởi tạo IPC + sự kiện:
  ```ts
  import { autoUpdater } from 'electron-updater'
  import log from 'electron-log'
  import { BrowserWindow, ipcMain, app } from 'electron'

  export function initAutoUpdate(getWin: () => BrowserWindow | null) {
    autoUpdater.logger = log
    autoUpdater.autoDownload = true          // tải nền tự động khi phát hiện bản mới
    autoUpdater.autoInstallOnAppQuit = true  // cài khi thoát app (nếu chưa bấm restart)

    const send = (channel: string, payload?: unknown) => {
      const w = getWin()
      if (w && !w.isDestroyed()) w.webContents.send(channel, payload)
    }

    autoUpdater.on('checking-for-update', () => send('update:status', { state: 'checking' }))
    autoUpdater.on('update-available', (info) =>
      send('update:status', { state: 'available', version: info.version }))
    autoUpdater.on('update-not-available', () => send('update:status', { state: 'none' }))
    autoUpdater.on('download-progress', (p) =>
      send('update:status', { state: 'downloading', percent: Math.round(p.percent) }))
    autoUpdater.on('update-downloaded', (info) =>
      send('update:status', { state: 'ready', version: info.version }))
    autoUpdater.on('error', (err) =>
      send('update:status', { state: 'error', message: String(err) }))

    // Renderer chủ động bấm "Kiểm tra cập nhật"
    ipcMain.handle('update:check', () => autoUpdater.checkForUpdates().catch(() => null))
    // Renderer bấm "Khởi động lại để cập nhật"
    ipcMain.handle('update:install', () => autoUpdater.quitAndInstall())
    // Renderer hỏi version hiện tại (thay chuỗi hardcode v0.1.0 ở Sidebar)
    ipcMain.handle('app:version', () => app.getVersion())

    // Tự kiểm tra 1 lần sau khi mở app (đợi cửa sổ dựng xong) + định kỳ mỗi 6 giờ
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 8000)
    setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 6 * 60 * 60 * 1000)
  }
  ```

- [ ] **Gọi trong `electron/main.ts`** `app.whenReady()`:
  ```ts
  import { initAutoUpdate } from './updater'
  ...
  app.whenReady().then(() => {
    createWindow()
    setupGlobalTranslate()
    initAutoUpdate(() => win)   // ⬅️ thêm dòng này
  })
  ```

- [ ] **Vite**: `electron/updater.ts` được `main.ts` import nên tự vào bundle main — không cần đổi `vite.config.ts`. Lưu ý `electron-updater` không phải native module nên KHÔNG cần thêm vào `external` (khác `uiohook-napi`).

### Giai đoạn 3 — Cầu nối preload + UI trong app

- [ ] **Bổ sung `electron/preload.ts`** (thêm vào object `api`):
  ```ts
  // ----- Cập nhật ứng dụng -----
  checkUpdate: (): Promise<unknown> => ipcRenderer.invoke('update:check'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('update:install'),
  appVersion: (): Promise<string> => ipcRenderer.invoke('app:version'),
  onUpdateStatus: (cb: (s: UpdateStatus) => void): (() => void) => {
    const h = (_e: IpcRendererEvent, s: UpdateStatus) => cb(s)
    ipcRenderer.on('update:status', h)
    return () => ipcRenderer.removeListener('update:status', h)
  },
  ```
  Với kiểu:
  ```ts
  type UpdateStatus =
    | { state: 'checking' | 'none' }
    | { state: 'available' | 'ready'; version: string }
    | { state: 'downloading'; percent: number }
    | { state: 'error'; message: string }
  ```

- [ ] **UI ở trang Cài đặt (`SettingsPage.tsx`)** — chỉ hiện trên desktop (ẩn trên web, giống các tính năng desktop khác):
  - Dòng "Phiên bản hiện tại: **vX.Y.Z**" (đọc bằng `window.api.appVersion()`).
  - Nút **"Kiểm tra cập nhật"** → gọi `checkUpdate()`.
  - Vùng trạng thái phản ánh theo `onUpdateStatus`:
    - `checking` → "Đang kiểm tra…"
    - `none` → "Bạn đang dùng bản mới nhất ✅"
    - `available` → "Đã tìm thấy bản v0.2.0 · đang tải…"
    - `downloading` → thanh tiến độ `percent%`
    - `ready` → nút **"Khởi động lại để cập nhật"** → gọi `installUpdate()`
    - `error` → "Không kiểm tra được cập nhật" (im lặng nếu do mất mạng)

- [ ] **Thay version hardcode**: [Sidebar.tsx:37](src/components/Sidebar.tsx#L37) đang cứng `v0.1.0`.
  - Desktop: đọc `window.api.appVersion()`.
  - Web: `window.api` không tồn tại → fallback đọc từ biến build `__APP_VERSION__` (define trong vite config từ `package.json`) hoặc chuỗi mặc định.

### Giai đoạn 4 — Tự động build & phát hành bằng GitHub Actions ✅ (đã chọn)

> Quyết định: dùng **GitHub Actions** làm cách phát hành chính — không build tay. Chỉ cần
> tăng version + push tag, phần build Windows + tạo Release để CI lo.

Để mỗi lần đẩy tag `v*` là tự build trên máy Windows của GitHub và tạo Release:

- [ ] Tạo `.github/workflows/release.yml`:
  ```yaml
  name: Release desktop
  on:
    push:
      tags: ['v*']
  jobs:
    build:
      runs-on: windows-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20 }
        - run: npm ci
        - run: npm run release
          env:
            GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}   # Actions cấp sẵn, đủ quyền tạo release
  ```
  - `secrets.GITHUB_TOKEN` **tự có** trong Actions, không cần tạo PAT thủ công.
  - ⚠️ Lưu ý build native `uiohook-napi` + tải Electron trên CI: nếu lỗi, cân nhắc `optionalDependencies` / cache như đã ghi trong `checklist_deploy_vercel.md`.
  - ⚠️ KHÔNG bật đồng thời auto-deploy Vercel cho tag này — Vercel chỉ theo push nhánh, không đụng tag, nên an toàn.

---

## 3. Quy trình phát hành một phiên bản mới (cheat sheet)

1. Sửa code, kiểm tra chạy ổn.
2. **Tăng version** trong `package.json` (vd `0.1.0` → `0.2.0`). Đây là số electron-updater đem so sánh — **bắt buộc tăng** thì client mới thấy bản mới.
3. Commit + tạo tag:
   ```bash
   git commit -am "Release v0.2.0"
   git tag v0.2.0
   git push && git push --tags
   ```
4. Phát hành (**cách chính — GitHub Actions**): đẩy tag `v*` là xong, Actions tự build trên Windows + tạo Release.
   - *Dự phòng khi cần build tay:* `\$env:GH_TOKEN="..."; npm run release` trên máy Windows.
5. Kiểm tra Release trên GitHub có đủ 3 file: `*.exe`, `latest.yml`, `*.blockmap`.
6. App của người dùng (bản NSIS) sẽ tự phát hiện trong ≤6 giờ hoặc ngay khi họ bấm "Kiểm tra cập nhật".

---

## 4. Kiểm thử (test checklist)

- [ ] Build bản `0.1.0`, cài bằng NSIS (`release/EngMaster-Setup-0.1.0.exe`).
- [ ] Tăng version lên `0.1.1`, `npm run release` → tạo Release `v0.1.1` trên GitHub.
- [ ] Mở app `0.1.0` đã cài → sau ~8s thấy trạng thái "Đang tải" → "Khởi động lại để cập nhật".
- [ ] Bấm restart → app mở lại thành version `0.1.1` (kiểm tra ở Sidebar/Cài đặt).
- [ ] Ngắt mạng → bấm "Kiểm tra cập nhật" → báo lỗi im lặng, không crash.
- [ ] Bản `portable` không tự cập nhật (xác nhận đúng kỳ vọng).

---

## 5. Rủi ro & lưu ý

| Vấn đề | Xử lý |
|---|---|
| Chưa ký số → SmartScreen cảnh báo | Chấp nhận ở giai đoạn đầu; sau này mua chứng chỉ code-signing (OV/EV) rồi thêm `certificateFile`/`certificatePassword` vào `build.win` |
| Portable không auto-update | Ghi rõ trong ghi chú tải; khuyến nghị người dùng dùng bản cài NSIS |
| Repo chuyển sang private | electron-updater sẽ cần token để tải → phức tạp. **Giữ repo public** cho phần release, hoặc tách repo release riêng |
| Quên tăng version | Client không thấy bản mới. Đưa bước tăng version vào cheat sheet §3 |
| `latest.yml` thiếu/không khớp sha512 | Do upload thiếu file hoặc build lại đè; luôn để `electron-builder --publish` lo trọn gói, tránh upload tay từng file |
| Test trong dev không chạy | Dùng `dev-app-update.yml` (§6) hoặc chỉ test trên bản đã đóng gói |

---

## 6. (Phụ) Test update ngay trong môi trường chưa đóng gói

Tạo `dev-app-update.yml` ở gốc dự án để ép autoUpdater đọc cấu hình khi chạy chưa-đóng-gói:
```yaml
provider: github
owner: thieentraan0412
repo: Eng_app
```
Và trong `updater.ts` khi cần test:
```ts
autoUpdater.forceDevUpdateConfig = true   // CHỈ để test, gỡ trước khi phát hành
```

---

## 7. Tóm tắt các file sẽ đụng tới

| File | Thay đổi |
|---|---|
| `package.json` | + `electron-updater` (dep), + `electron-log` (devDep), + `build.publish`, + script `release`, tăng `version` mỗi lần phát hành |
| `electron/updater.ts` | **MỚI** — logic autoUpdater + IPC (`update:check`/`update:install`/`app:version`) + sự kiện `update:status` |
| `electron/main.ts` | + `initAutoUpdate(() => win)` trong `app.whenReady()` |
| `electron/preload.ts` | + `checkUpdate` / `installUpdate` / `appVersion` / `onUpdateStatus` |
| `src/pages/SettingsPage.tsx` | + khối "Cập nhật ứng dụng" (chỉ desktop) |
| `src/components/Sidebar.tsx` | Thay `v0.1.0` cứng bằng version động |
| `.github/workflows/release.yml` | **MỚI** (tùy chọn) — tự build & phát hành khi push tag `v*` |
| `dev-app-update.yml` | **MỚI** (tùy chọn) — chỉ để test ở dev |

---

## 8. Thứ tự triển khai đề xuất (nhỏ → lớn)

1. **Bước tối thiểu chạy được:** Giai đoạn 1 + 2 với `autoDownload` + `autoInstallOnAppQuit` — người dùng không thấy UI nào, nhưng app tự cập nhật lặng lẽ khi thoát/mở lại. *Kiểm chứng cơ chế đúng trước.*
2. **Thêm UI:** Giai đoạn 3 — nút "Kiểm tra cập nhật" + trạng thái + version động (đồng thời dọn nợ kỹ thuật "version hardcode" ở `upgrade.md` mục #10).
3. **Tự động hóa:** Giai đoạn 4 — GitHub Actions để không phải build tay.
4. **Về sau:** ký số để bỏ cảnh báo SmartScreen.

> Liên hệ roadmap: mục này hiện thực hóa dòng *"Auto-update cho bản desktop (electron-updater) + đọc version động"* ở **Giai đoạn C** trong `upgrade.md`.
