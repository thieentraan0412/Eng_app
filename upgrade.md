# EngMaster — Kiểm tra tính năng & Kế hoạch nâng cấp (upgrade.md)

> Ngày kiểm tra: 2026-07-18 · Phạm vi: toàn bộ mã nguồn App desktop (Electron) + bản Web
> Cách kiểm tra: rà soát toàn bộ `src/pages`, `src/components`, `src/contexts`, `src/services`, `electron/`, `supabase/schema.sql`, cấu hình build (`vite.config.ts` / `vite.web.config.ts`).

---

## 1. Tổng quan hiện trạng

| Hạng mục | Trạng thái |
|---|---|
| Kiến trúc | Electron 32 + React 18 + TS + Vite 5, online-first, **không có DB cục bộ**, Supabase (Auth + Postgres + RLS) là nguồn dữ liệu duy nhất |
| Build | ✅ Desktop (`npm run dev` / `dist` → NSIS + portable, chỉ Windows) · ✅ Web (`dev:web` / `build:web`) dùng chung 100% mã `src/` |
| Số trang | 9 trang: Trang chủ, Từ vựng, Ôn tập, Ngữ pháp, Đọc, Viết, Chép câu, Thống kê, Cài đặt |
| Ngôn ngữ UI | Tiếng Việt toàn bộ |
| Bảo mật dữ liệu | RLS trên cả 12 bảng (`auth.uid() = user_id`), soft-delete (`deleted_at`) hầu hết bảng |

---

## 2. Checklist tính năng hiện có (đã kiểm tra trong code)

### 2.0. Tài khoản & Cloud
- [x] Đăng nhập email/mật khẩu (Supabase Auth), giữ phiên đăng nhập (`persistSession`)
- [x] **Ghi nhớ đăng nhập trên máy (desktop)** — mã hóa email+mật khẩu bằng Windows DPAPI (`safeStorage` → `cred.dat`)
- [x] Đăng xuất (trang Cài đặt)
- [x] Đồng bộ đa thiết bị (mọi đọc/ghi đi thẳng cloud)
- [ ] ❌ Đăng ký tài khoản — **đã ẩn trong UI** (hàm `signUp` vẫn có trong AuthContext + CloudApi nhưng không có màn hình)
- [ ] ❌ Quên mật khẩu / đổi mật khẩu — chưa có
- [ ] ❌ Đăng nhập Google/OAuth — chưa có

### 2.1. Từ vựng (VocabularyPage)
- [x] CRUD bộ từ: tạo, đổi tên inline (✎), xóa (confirm), mô tả
- [x] Thêm thẻ từ với **tự động làm giàu dữ liệu (enrichment)** ⭐:
  - [x] Autocomplete từ + hiển thị từ loại theo prefix (Datamuse `md=p`)
  - [x] Phát hiện gõ sai chính tả + gợi ý sửa (nspell + fuzzyCorrect)
  - [x] Gợi ý nghĩa: từ điển offline + đa nghĩa online theo từ loại (Google dịch `dt=bd`)
  - [x] Gợi ý **collocation** (n-gram offline + Datamuse online)
  - [x] Gợi ý **pattern ngữ pháp** (V + to-inf, V + prep…)
  - [x] Gợi ý **câu ví dụ thật** từ Tatoeba + Free Dictionary (debounce, tối đa 25)
  - [x] Tự điền các trường trống bằng gợi ý tốt nhất khi lưu
- [x] Nhập nhiều giá trị dạng chip (MultiField) cho nghĩa/collocation/pattern/ví dụ
- [x] Tìm kiếm/lọc thẻ ngay trong ô nhập từ (đếm "X / Y thẻ")
- [ ] ❌ **Sửa thẻ từ** — hiện chỉ thêm/xóa, không sửa được
- [ ] ❌ Phân trang / virtual scroll khi bộ từ lớn
- [ ] ⚠️ Trường trống collocation/pattern lưu sentinel `','` — hack dễ vỡ, nên chuẩn hóa thành null/mảng rỗng

### 2.2. Flashcard SRS (FlashcardPage)
- [x] Thuật toán **SM-2** (kiểu Anki): Lại/Khó/Được/Dễ, ease floor 1.3, hard ×0.8, ghi `review_logs`
- [x] Xem trước khoảng cách ôn trên nút đánh giá ("N ngày")
- [x] Lật thẻ bằng click/Space; phím tắt 1–4; điều hướng ←/→; **vuốt ngang trên mobile**
- [x] Chiều học đảo: Anh→Việt và **Việt→Anh gõ đáp án** (tự chuyển khi đúng, gợi ý lộ dần từng chữ cái 💡)
- [x] Chế độ "Học lại cả bộ" (practice — không ghi SRS)
- [x] Thêm câu ví dụ của riêng mình ngay khi ôn (cả 2 mặt thẻ)
- [x] Progress bar, màn hình hoàn thành 🎉
- [ ] ❌ Learning steps dưới 1 ngày (10 phút / 1 giờ như Anki) — interval tối thiểu 1 ngày
- [ ] ❌ Easy bonus, fuzz, giới hạn interval tối đa
- [ ] ❌ Giới hạn thẻ mới/ngày, cram mode theo tag

### 2.3. Ngữ pháp (GrammarPage)
- [x] CRUD bài học; soạn câu hỏi **MCQ** (4 đáp án) và **Điền từ** + giải thích
- [x] Làm bài + chấm điểm tự động (so sánh không phân biệt hoa thường), hiện đáp án đúng + 💡 giải thích, "Làm lại"
- [ ] ❌ Dạng **sắp xếp từ (reorder)** — schema DB đã cho phép nhưng app chưa hỗ trợ
- [ ] ❌ Sửa câu hỏi (chỉ thêm/xóa); đáp án MCQ phải gõ tay trùng khớp option (dễ sai) — nên chọn từ option
- [ ] ❌ Trường `content`/`level` của bài học có trong DB nhưng UI chưa dùng (chưa có phần "bài giảng lý thuyết")
- [ ] ❌ Kết quả làm bài chưa ghi vào `study_stats`

### 2.4. Đọc hiểu (ReadingPage)
- [x] CRUD bài đọc
- [x] **Highlight nhiều màu** (vàng/xanh lá/xanh dương/hồng + tẩy) ⭐ — tách/gộp vùng chồng lấn theo offset ký tự, lưu cloud (jsonb), fallback localStorage khi lỗi mạng
- [x] Tích hợp bôi màu → dịch (popup dịch toàn app hoạt động trong bài đọc, không xung đột với thanh highlight)
- [ ] ❌ Trường `level` bài đọc chưa dùng trong UI
- [ ] ❌ Chưa có: ghi chú theo highlight, thống kê từ đã tra trong bài, TTS đọc bài

### 2.5. Viết (WritingPage)
- [x] CRUD bài viết, đếm từ/ký tự, lưu Ctrl+S, hiện thời điểm lưu
- [x] **Kiểm tra chính tả offline** (nspell + từ điển Hunspell đóng gói): gạch đỏ ngay trên textarea (overlay backdrop đồng bộ scroll), gợi ý sửa, "Bỏ qua" (từ điển cá nhân trong localStorage)
- [x] **Kiểm tra ngữ pháp 2 tầng** ⭐: rule offline tức thì (to + V sai dạng, a/an theo âm, lặp từ) + **LanguageTool online** (level picky, lọc trùng, tối đa 15 lỗi), nút "✓ Sửa cả câu (N)"
- [x] **Gợi ý từ real-time** ⭐: autocomplete (Trie), next-word (n-gram), synonym (thesaurus) — toàn bộ offline, Tab chèn gợi ý đầu
- [ ] ❌ Trường `topic` có trong DB nhưng UI chưa dùng; chưa có gợi ý đề bài
- [ ] ❌ Chưa có tự động lưu nháp (autosave) — phải bấm lưu
- [ ] ❌ Chưa có AI nhận xét/sửa diễn đạt (WritingAssistProvider trong thiết kế)

### 2.6. Chép câu (SentencePage) ⭐ tính năng lớn nhất
- [x] Thư mục câu: CRUD + đổi tên inline, đếm số câu, seed bộ "Câu mẫu", **tự migrate dữ liệu localStorage cũ lên cloud** (1 lần)
- [x] Luyện dịch Việt→Anh với **chấm điểm thông minh** ⭐:
  - [x] Similarity = 0.6 × Jaccard token + 0.4 × Levenshtein ký tự; 3 mức đúng/gần đúng/sai (ngưỡng 0.85)
  - [x] Diff LCS theo từ → gợi ý "Đúng N từ đầu · từ tiếp theo là X" (chỉ lộ 1 từ)
  - [x] Chấp nhận nhiều đáp án thay thế (altAnswers), chọn đáp án khớp nhất
  - [x] Tích hợp báo lỗi chính tả + ngữ pháp offline ngay trong kết quả
- [x] Tự lưu tiến độ lên cloud (debounce 800ms, upsert theo user+câu), "Kiểm tra tất cả", "Làm lại", progress bar
- [x] Gợi ý từ khi gõ (⌨ autocomplete / → next-word / ≈ synonym), Tab chèn hoặc nhảy câu
- [x] Responsive: màn hẹp → chế độ focus 1 câu/màn hình
- [x] **Nhập/Xuất Excel** ⭐ (.xlsx/.xls/.csv): nhận diện cột theo tên không dấu, cột VI bắt buộc, **thiếu EN tự dịch máy** (Google→MyMemory), preview + progress + báo cáo kết quả; xuất Excel + file mẫu
- [ ] ❌ Chưa có mức C2 (chỉ A1–C1); trường hints/level/topic nhập được nhưng chưa dùng để lọc/luyện theo cấp độ
- [ ] ❌ Chưa có chế độ luyện nghe-chép (dictation bằng TTS)

### 2.7. Dịch (2 tầng — trong app + toàn hệ điều hành)
- [x] **TranslatePopup trong app**: bôi đen bất kỳ chữ nào (kể cả trong input/textarea) → popup dịch; 1 từ tra từ điển offline tức thì, câu dài dịch online (Google gtx → MyMemory fallback); chip từ loại (n/v/adj/adv) chọn nghĩa; sửa nghĩa trước khi lưu; chọn bộ từ đích; "➕ Lưu vào bộ từ"
- [x] **Dịch nhanh toàn màn hình (desktop)** ⭐⭐ điểm khác biệt lớn nhất:
  - [x] Hook chuột toàn cục (`uiohook-napi`): kéo-bôi ≥6px hoặc double/click nhiều lần trong **bất kỳ ứng dụng Windows nào**
  - [x] Lấy selection bằng mẹo clipboard (sentinel + giả lập Ctrl+C + **khôi phục clipboard cũ** — vô hình với người dùng)
  - [x] Popup frameless trong suốt, always-on-top, không cướp focus, click-through + tương tác khi hover
  - [x] Lưu từ từ popup → bay thẳng vào bộ từ trong app (quick-save qua IPC) + toast xác nhận
  - [x] Bật/tắt trong Cài đặt (ẩn hoàn toàn trên web); Esc/click ngoài để đóng
- [x] Lưu từ thông minh: tự chọn bộ từ gần nhất (`last_deck_id`) → bộ mới nhất → tự tạo bộ "Từ đã lưu khi đọc"; tự enrich collocation/pattern/ví dụ khi lưu 1 từ đơn
- [ ] ❌ Cache kết quả dịch — hiện mỗi lần bôi đều gọi API lại
- [ ] ⚠️ Endpoint Google `gtx` là API không chính thức (có thể bị chặn bất kỳ lúc nào) — đã có MyMemory fallback nhưng nên thêm provider chính thức/cấu hình được

### 2.8. Thống kê (Dashboard + UsagePage)
- [x] Dashboard: số bộ từ, tổng thẻ, thẻ đến hạn hôm nay, 🔥 **streak** (tính từ `review_logs`, hôm nay 0 thẻ chưa đứt), biểu đồ 14 ngày (BarChart tự viết, không thư viện), 3 nút điều hướng nhanh
- [x] UsagePage: dung lượng DB qua RPC `get_db_stats` (so với 500MB Free tier, cảnh báo 50%/80%), đếm dòng từng bảng, **bộ đếm request Supabase phía client** (wrap fetch, lưu localStorage 30 ngày), bảng giới hạn Free tier
- [ ] ❌ Bảng `study_stats` (phút học, từ mới, số quiz) có trong schema + trigger nhưng **chưa được ghi/đọc ở đâu** — thống kê thời gian học chưa hoạt động
- [ ] ❌ Chưa có: heatmap kiểu GitHub, thống kê theo bộ từ, tỷ lệ nhớ (retention), dự báo thẻ đến hạn

### 2.9. Cài đặt & Giao diện
- [x] Sáng/Tối (persist localStorage); bật/tắt: gợi ý từ, kiểm tra chính tả, kiểm tra ngữ pháp (cần mạng), dịch toàn màn hình (desktop)
- [x] Responsive đầy đủ: drawer sidebar mobile, focus-mode chép câu, swipe flashcard
- [ ] ❌ Bảng `settings` trên cloud (theme/suggestion/translation_provider, có cả trigger tự tạo) **không được dùng** — mọi cài đặt chỉ nằm localStorage → **không đồng bộ giữa các máy**
- [ ] ❌ Chưa có theme "Hệ thống" (auto theo OS)
- [ ] ⚠️ Version `v0.1.0` hardcode trong Sidebar (không đọc từ package.json)

---

## 3. ⭐ Checklist TÍNH NĂNG ĐẶC BIỆT (điểm khác biệt của EngMaster)

Những thứ làm app này khác một app học từ vựng thông thường — cần giữ và đầu tư tiếp:

1. **🖱️ Dịch nhanh toàn màn hình (system-wide highlight-to-translate)** — bôi chữ ở BẤT KỲ app Windows nào (browser, PDF, Word…) là hiện popup dịch + lưu thẳng vào bộ từ. Kỹ thuật: global mouse hook + clipboard sentinel + khôi phục clipboard + popup click-through. *Không app học tiếng Anh Việt nào phổ biến có tính năng này.*
2. **🧠 Pipeline tự làm giàu từ vựng** — nhập 1 từ, app tự tìm: nghĩa đa từ loại, collocation, pattern ngữ pháp, câu ví dụ thật (Tatoeba/Free Dictionary/Datamuse) và tự điền khi lưu.
3. **✏️ Chép câu với chấm điểm mờ (fuzzy grading)** — Jaccard + Levenshtein + diff LCS, gợi ý đúng-đến-từ-nào, nhiều đáp án thay thế, kèm bắt lỗi chính tả/ngữ pháp ngay trong kết quả chấm.
4. **📥 Import Excel tự dịch** — dán cột tiếng Việt, thiếu tiếng Anh thì máy tự dịch từng dòng có progress bar.
5. **🔤 Bộ gợi ý viết offline hoàn toàn** — Trie autocomplete + n-gram next-word + thesaurus synonym + nspell spellcheck, đóng gói JSON theo app, <50ms, không cần mạng.
6. **📝 Kiểm tra ngữ pháp 2 tầng** — rule offline tức thì (to+V, a/an, lặp từ) hòa trộn với LanguageTool online, dedupe theo offset.
7. **🖍️ Highlight nhiều màu trong bài đọc** — thuật toán tách/gộp range theo ký tự, đồng bộ cloud, fallback local.
8. **🔁 Việt→Anh gõ đáp án trong flashcard** — với gợi ý lộ dần từng chữ cái.
9. **🔐 Ghi nhớ đăng nhập bằng DPAPI** — mật khẩu mã hóa theo máy, không lưu thô.
10. **📊 Trang giám sát Supabase Free-tier ngay trong app** — dung lượng DB, số dòng từng bảng, đếm request client-side.

---

## 4. Lỗi / khoảng trống phát hiện khi kiểm tra (ưu tiên sửa)

| # | Vấn đề | Mức độ | Ghi chú |
|---|---|---|---|
| 1 | `xlsx` từng thiếu trong `node_modules` làm crash trang Chép câu ở dev | ✅ đã sửa (npm install, 18/07) | Nên thêm bước `npm ci` vào tài liệu |
| 2 | Bảng `settings` + `study_stats` có schema, trigger nhưng không dùng | Trung bình | Cài đặt không đồng bộ đa thiết bị; thống kê thời gian học trống |
| 3 | Không sửa được thẻ từ (Vocabulary) và câu hỏi (Grammar) | Trung bình | Người dùng phải xóa tạo lại |
| 4 | Sentinel `','` cho collocation/pattern trống | Thấp | Chuẩn hóa dữ liệu |
| 5 | `net:status` IPC là stub `{online:true}` | Thấp | Chưa có báo "Mất kết nối" như thiết kế mục 5.0 |
| 6 | Google `gtx` endpoint không chính thức | Rủi ro | Có fallback MyMemory; nên thêm lớp cache + provider cấu hình được |
| 7 | Không có cache cho mọi API online (dịch, Datamuse, Tatoeba, LanguageTool) | Trung bình | Tốn quota, chậm khi tra lại từ cũ |
| 8 | `questions.type` DB cho phép `reorder`, app chưa hỗ trợ | Thấp | Xem mục 5 |
| 9 | AuthScreen: state `notice` chết; signUp có code nhưng không có UI | Thấp | Dọn dẹp hoặc mở đăng ký |
| 10 | Version hardcode `v0.1.0`; electron-builder chỉ target Windows | Thấp | Đọc version từ package.json |
| 11 | Không có routing/deep-link (state trang trong bộ nhớ) | Thấp | Cân nhắc khi làm web công khai |

---

## 5. Roadmap nâng cấp đề xuất

### Giai đoạn A — Hoàn thiện nền (1–2 tuần)
- [ ] Đồng bộ **cài đặt lên cloud** (dùng bảng `settings` sẵn có): theme, các toggle, translation_provider
- [ ] Ghi & hiển thị **`study_stats`**: phút học (đo thời gian phiên), từ mới/ngày, quiz đã làm → nâng cấp Dashboard
- [ ] **Sửa thẻ từ** (edit-in-place trong VocabularyPage) + sửa câu hỏi Grammar; MCQ chọn đáp án đúng từ option thay vì gõ tay
- [ ] Detect mạng thật (`navigator.onLine` + ping Supabase) → banner "Mất kết nối" (thiết kế mục 5.0)
- [ ] Cache dịch & enrichment (localStorage/IndexedDB, TTL ~30 ngày) — giảm gọi API lặp
- [ ] Bỏ sentinel `','`; đọc version từ package.json; dọn state chết

### Giai đoạn B — Tính năng học tập (2–4 tuần)
- [ ] SRS nâng cao: learning steps dưới ngày (10 phút/1 giờ), easy bonus, fuzz, cap interval, giới hạn thẻ mới/ngày
- [ ] Dạng câu hỏi **sắp xếp từ (reorder)** — schema đã sẵn sàng
- [ ] Bài học ngữ pháp có nội dung lý thuyết (`lessons.content` + `level` đã có cột)
- [ ] Lọc/luyện Chép câu theo level (A1–C2, bổ sung C2) và topic; chế độ **nghe-chép (dictation)** bằng Web Speech TTS
- [ ] **TTS phát âm** cho thẻ từ + bài đọc (SpeechSynthesis — miễn phí, offline trên Windows)
- [ ] Autosave bài Viết + lịch sử phiên bản đơn giản
- [ ] Ghi chú theo highlight trong bài đọc; đếm từ đã tra trong bài

### Giai đoạn C — Tài khoản & phân phối (2–3 tuần)
- [ ] Mở lại **đăng ký** + quên mật khẩu (Supabase có sẵn) + (tùy chọn) Google OAuth
- [ ] Auto-update cho bản desktop (electron-updater) + đọc version động
- [ ] Nhắc học hằng ngày: thông báo Windows (desktop) / Web Push (web)
- [ ] Export toàn bộ dữ liệu người dùng ra Excel/JSON (backup cá nhân — thiết kế mục 8)

### Giai đoạn D — Mở rộng (dài hạn, theo thiết kế mục 12)
- [ ] Thống kê nâng cao: heatmap năm, retention rate, dự báo thẻ đến hạn 7 ngày
- [ ] Gamification: điểm, huy hiệu, mục tiêu ngày
- [ ] Chia sẻ bộ từ giữa người dùng (cần thiết kế lại RLS)
- [ ] AI hỗ trợ viết (nhận xét đoạn văn, gợi ý diễn đạt) qua provider cấu hình được
- [ ] PWA cho bản web (installable, offline shell) → thay thế dần nhu cầu mobile app

---

## 6. Ma trận Desktop vs Web (đã xác minh trong code)

| Tính năng | Desktop (Electron) | Web |
|---|---|---|
| 9 trang chính + toàn bộ dịch vụ học | ✅ | ✅ (chung 100% mã) |
| Dịch nhanh toàn màn hình (mouse hook) | ✅ (chỉ Windows) | ❌ ẩn hoàn toàn |
| Ghi nhớ đăng nhập mã hóa (DPAPI) | ✅ | ❌ (no-op) |
| Quick-save từ popup hệ thống vào bộ từ | ✅ | ❌ |
| Magic-link/redirect auth (`detectSessionInUrl`) | ❌ tắt | ✅ bật |
| Gợi ý/spellcheck/dịch offline (JSON đóng gói) | ✅ | ✅ (tải theo bundle) |
| Đóng gói | NSIS + portable (Win) | Static hosting bất kỳ |
