# Bản Thiết Kế Phần Mềm (Software Design Document)
## Ứng dụng học tiếng Anh trên Windows — "EngMaster" (tên tạm)

> Phiên bản: 2.0 · Ngày: 2026-07-12 · Loại: Ứng dụng desktop Windows, **dữ liệu lưu Cloud, đồng bộ đa thiết bị**

> **Thay đổi so với v1.0:** Chuyển từ lưu offline cục bộ → **lưu dữ liệu trên Cloud**. Người dùng đăng nhập tài khoản; đăng nhập ở **bất kỳ máy nào** đều lấy được dữ liệu của mình.
>
> **Thay đổi so với v2.0:** **Bỏ CSDL cục bộ SQLite.** App kết nối **trực tiếp tới Cloud (Supabase)**; không còn cache DB cục bộ. Kiến trúc **online-first** — cần internet để dùng. Dữ liệu tra cứu (từ điển, gợi ý từ) đóng gói dưới dạng **file tĩnh** nạp vào bộ nhớ, không cần cơ sở dữ liệu cục bộ.

---

## 1. Tổng quan (Overview)

### 1.1. Mục tiêu
Xây dựng ứng dụng desktop chạy trên **Windows**, giúp người học tự tổ chức và luyện tập tiếng Anh toàn diện. Toàn bộ dữ liệu (bộ từ, tiến độ, bài viết…) được **lưu trên Cloud** và gắn với **tài khoản người dùng** — người dùng đăng nhập trên máy nào cũng thấy đúng dữ liệu của mình. Nội dung học do **người dùng tự soạn / tự nhập**.

### 1.2. Phạm vi (Scope)
Phần mềm hỗ trợ 6 nhóm chức năng chính:

| # | Chức năng | Mô tả ngắn |
|---|-----------|------------|
| 0 | **Tài khoản & Đồng bộ Cloud** | Đăng ký/đăng nhập, dữ liệu lưu cloud, đồng bộ đa thiết bị |
| 1 | **Từ vựng & Flashcard** | Tạo bộ từ, học theo cơ chế lặp lại ngắt quãng (SRS – Spaced Repetition) như Anki |
| 2 | **Ngữ pháp & Bài tập** | Bài học ngữ pháp, câu hỏi trắc nghiệm / điền từ, chấm điểm tự động |
| 3 | **Đọc hiểu & Theo dõi tiến độ** | Bài đọc, tra từ nhanh, thống kê tiến độ, streak, báo cáo học tập |
| 4 | **Viết tiếng Anh (Writing)** | Trình soạn thảo luyện viết, đếm từ, **gợi ý từ real-time**, lưu bài |
| 5 | **Bôi màu → Dịch (Highlight-to-Translate)** | Bôi/tô đoạn chữ tiếng Anh, ứng dụng dịch ngay sang tiếng Việt |

### 1.3. Ngoài phạm vi (Non-goals) — phiên bản hiện tại
- Không có tính năng cộng đồng/chia sẻ bộ từ giữa người dùng (roadmap sau).
- Không có nội dung dựng sẵn (người dùng tự nhập).
- Chưa có ứng dụng di động (chỉ desktop Windows; kiến trúc cloud để mở đường sau này).

---

## 2. Người dùng & Kịch bản sử dụng (Users & Use Cases)

### 2.1. Chân dung người dùng
- **Người học tiếng Anh cá nhân**, có thể dùng **nhiều máy tính** (ở nhà, công ty, laptop) và muốn dữ liệu **luôn đồng bộ**.
- Có kiến thức máy tính cơ bản: cài phần mềm, đăng nhập, nhập liệu, import CSV/Excel.

### 2.2. Kịch bản chính (User Stories)
1. *Là người dùng*, tôi muốn **đăng ký/đăng nhập tài khoản** để dữ liệu của tôi được lưu an toàn trên cloud.
2. *Là người dùng*, tôi muốn **đăng nhập ở một máy khác** và **thấy ngay** toàn bộ bộ từ, tiến độ, bài viết của mình.
3. *Là người học*, tôi muốn **tạo bộ từ vựng mới** và thêm từ (word, nghĩa, ví dụ, phiên âm).
4. *Là người học*, tôi muốn **import danh sách từ từ CSV/Excel** để khỏi gõ tay.
5. *Là người học*, tôi muốn **ôn tập flashcard mỗi ngày** theo lịch SRS.
6. *Là người học*, tôi muốn **làm bài tập ngữ pháp** và được **chấm điểm ngay**.
7. *Là người học*, tôi muốn **đọc bài text** và **bôi màu để xem nghĩa tiếng Việt** tức thì.
8. *Là người học*, tôi muốn **viết đoạn văn tiếng Anh** có **gợi ý từ** khi gõ, đếm từ và lưu lại.
9. *Là người học*, tôi muốn **xem thống kê tiến độ** (số từ thuộc, streak, thời gian học).
10. *Là người dùng*, khi **mất mạng** tôi vẫn muốn học tiếp được, và **tự đồng bộ lại** khi có mạng.

---

## 3. Kiến trúc tổng thể (Architecture)

### 3.1. Đề xuất công nghệ (Recommended Tech Stack)

Ứng dụng gồm **2 phần**: App desktop (client) + Dịch vụ Cloud (backend/CSDL).

**A. App desktop (Client — Windows):**
> **Electron + React + TypeScript**
- Đóng gói `.exe` cài trên Windows; giao diện linh hoạt, mạnh cho soạn thảo văn bản, bôi màu dịch, gợi ý từ.
- **Không dùng CSDL cục bộ.** App gọi thẳng Cloud qua `@supabase/supabase-js`. Dữ liệu tạm chỉ giữ **trong bộ nhớ (in-memory state)** của phiên làm việc.
- Dữ liệu tra cứu tĩnh (từ điển, n-gram, thesaurus) đóng gói kèm app dưới dạng **file JSON**, nạp vào bộ nhớ khi cần.

**B. Dịch vụ Cloud (Backend + CSDL):**
> **Supabase** (khuyến nghị)
- **Auth**: đăng ký/đăng nhập sẵn có (email/mật khẩu, hoặc Google).
- **Postgres**: CSDL chính trên cloud, lưu toàn bộ dữ liệu người dùng.
- **Storage**: lưu file media (audio phát âm, ảnh) nếu cần.
- **Row Level Security (RLS)**: đảm bảo mỗi người chỉ đọc/ghi được dữ liệu của chính mình.
- **Realtime/REST API**: đồng bộ dữ liệu giữa các thiết bị.

**Lý do chọn Supabase:** có sẵn Auth + Postgres + Storage + phân quyền, ít phải tự dựng server, có gói miễn phí để bắt đầu. *(Phương án thay thế: Firebase — tương tự nhưng NoSQL; hoặc tự viết backend Node.js + PostgreSQL nếu cần kiểm soát cao.)*

### 3.2. Mô hình phân lớp (Layered Architecture)

```
┌──────────────────────── APP DESKTOP (Windows) ─────────────────────────┐
│  PRESENTATION (Renderer - React UI)                                     │
│  Auth · Dashboard · Flashcard · Grammar · Reading · Writing · Settings  │
├─────────────────────────────────────────────────────────────────────────┤
│  APPLICATION / SERVICES                                                  │
│  AuthService · SrsService · QuizService ·                               │
│  TranslationService · SuggestionService · ProgressService               │
├─────────────────────────────────────────────────────────────────────────┤
│  DATA ACCESS                                                             │
│  ┌── CloudApiClient (@supabase/supabase-js) ──┐  ┌─────────────────────┐ │
│  │  Gọi thẳng Cloud cho MỌI đọc/ghi dữ liệu    │  │ Static assets (JSON)│ │
│  │  Giữ tạm kết quả trong bộ nhớ phiên          │  │ dictionary/ngram/   │ │
│  └──────────────────────────────┬───────────────┘  │ thesaurus (nạp RAM) │ │
└─────────────────────────────────│──────────────────└─────────────────────┘─┘
                                  │ HTTPS
┌──────────────────────────── CLOUD (Supabase) ────▼────────────────────────┐
│  Auth (tài khoản)  ·  Postgres (dữ liệu người dùng)  ·  Storage (media)   │
│  Row Level Security: mỗi user chỉ truy cập dữ liệu user_id của mình       │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Nguồn sự thật duy nhất = Cloud Postgres.** App **không lưu CSDL cục bộ**; mọi đọc/ghi đi thẳng lên cloud.
- Dữ liệu tra cứu tĩnh (từ điển, gợi ý) nạp từ **file JSON đóng gói sẵn** vào bộ nhớ — không phải DB, không thay đổi theo người dùng.

---

## 4. Thiết kế dữ liệu (Data Model)

Dữ liệu lưu trên **Postgres (cloud)**; **mọi bảng của người dùng đều có cột `user_id`** để tách dữ liệu theo tài khoản. App không giữ bản sao CSDL cục bộ — đọc/ghi trực tiếp lên cloud.

### 4.1. Sơ đồ quan hệ (tóm tắt)

```
users (tài khoản — do Auth quản lý)
  └─ 1───∞ decks (bộ từ) 1───∞ cards (thẻ từ) 1───∞ review_logs (lịch sử ôn)
  └─ 1───∞ lessons (bài ngữ pháp) 1───∞ questions (câu hỏi)
  └─ 1───∞ readings (bài đọc)
  └─ 1───∞ writings (bài viết)
  └─ 1───∞ study_stats (thống kê theo ngày)
  └─ 1───1 settings (cấu hình cá nhân)

Dữ liệu DÙNG CHUNG (không theo user, chỉ đọc):
  dictionary (từ điển Anh–Việt)  ·  word_ngrams (gợi ý từ)  ·  thesaurus (đồng nghĩa)
```

### 4.2. Chi tiết các bảng chính

**`users`** — Tài khoản *(do Supabase Auth quản lý)*
| Cột | Ghi chú |
|-----|---------|
| id (UUID) | Khóa chính, dùng làm `user_id` ở mọi bảng khác |
| email | |
| created_at | |

**`decks`** — Bộ từ vựng
| id | **user_id (FK)** | name | description | created_at | updated_at |

**`cards`** — Thẻ từ (Flashcard)
| id | **user_id (FK)** | deck_id (FK) | word | meaning | phonetic | example | audio_url |
| **srs_interval** | **srs_ease** | **srs_due_date** | **srs_reps** | updated_at |

**`review_logs`** — Lịch sử ôn tập
| id | **user_id** | card_id (FK) | reviewed_at | rating (Again/Hard/Good/Easy) | interval_after |

**`lessons`** — Bài ngữ pháp
| id | **user_id** | title | content | level (A1–C2) | created_at |

**`questions`** — Câu hỏi bài tập
| id | **user_id** | lesson_id (FK) | type (mcq/fill_blank/reorder) | prompt | options (JSON) | correct_answer | explanation |

**`readings`** — Bài đọc
| id | **user_id** | title | content | level | created_at |

**`writings`** — Bài viết
| id | **user_id** | title | content | word_count | topic | created_at | updated_at |

**`study_stats`** — Thống kê theo ngày
| id | **user_id** | date | cards_reviewed | minutes_studied | new_words | quizzes_done |

**`settings`** — Cấu hình cá nhân
| **user_id** | theme | suggestion_enabled | translation_provider | ... |

**Bảng dùng chung (chỉ đọc, không theo user):**
- `dictionary` — từ điển Anh–Việt (word, phonetic, meaning_vi, pos)
- `word_ngrams` — cụm 2–3 từ cho gợi ý (prefix, next_word, frequency)
- `thesaurus` — từ đồng nghĩa/trái nghĩa (word, synonyms JSON, antonyms JSON)

### 4.3. Ghi chú
- Vì **không có CSDL cục bộ**, không cần cột phục vụ đồng bộ 2 chiều. Mỗi bảng chỉ giữ `updated_at` để hiển thị/ sắp xếp.
- Xóa dữ liệu nên dùng **soft-delete** (`deleted_at`) để tránh mất nhầm và hỗ trợ khôi phục.

---

## 5. Thiết kế chức năng chi tiết (Feature Design)

### 5.0. Tài khoản & Đồng bộ Cloud ⭐ MỚI

**Đăng nhập / Đăng ký (AuthService):**
- Màn hình đăng nhập khi mở app: email + mật khẩu (hoặc đăng nhập Google).
- Sau đăng nhập, app nhận **access token**, dùng để gọi API cloud.
- **Ghi nhớ đăng nhập** (lưu token an toàn) để lần sau mở app không cần đăng nhập lại.
- Chức năng: quên mật khẩu, đổi mật khẩu, đăng xuất.

**Truy cập dữ liệu (Online-first) — không có đồng bộ 2 chiều:**
```
Mọi thao tác đọc/ghi gọi thẳng Cloud (Supabase) qua CloudApiClient:
  • Đọc: truy vấn Postgres → hiển thị (giữ tạm kết quả trong bộ nhớ để đỡ gọi lại)
  • Ghi/sửa/xóa: gửi thẳng lên Cloud; cập nhật giao diện sau khi thành công

Vì Cloud là nguồn duy nhất → mọi thiết bị luôn thấy cùng dữ liệu, không cần trộn/đồng bộ.
```
- **Cần internet để hoạt động.** Khi mất mạng: các thao tác cần dữ liệu sẽ báo "Cần kết nối mạng"; app không lưu tạm thay đổi.
- Hiển thị **trạng thái kết nối** trên giao diện (Trực tuyến / Mất kết nối).
- *(Nếu sau này cần offline, có thể bổ sung lại một lớp lưu tạm — xem Mục 10.)*

**Bảo mật dữ liệu:** dùng **Row Level Security** ở Postgres — mỗi truy vấn chỉ trả về bản ghi có `user_id` = người đang đăng nhập. Không ai đọc được dữ liệu người khác.

---

### 5.1. Từ vựng & Flashcard (SRS)

**Luồng học:**
1. Chọn một bộ → app truy vấn Cloud lấy thẻ có `srs_due_date <= hôm nay`.
2. Hiện **mặt trước** (word) → **"Lật thẻ"** → **mặt sau** (nghĩa, ví dụ, phiên âm).
3. Đánh giá: **Again / Hard / Good / Easy**.
4. `SrsService` tính lại `interval`, `ease`, `due_date` theo **SM-2** (giống Anki), ghi `review_logs`; thay đổi được đồng bộ lên cloud.

**Thuật toán SM-2 (rút gọn):**
```
Nếu rating = Again → reps = 0, interval = 1 ngày
Ngược lại:
   reps += 1
   interval = 1 nếu reps=1; 6 nếu reps=2; ngược lại = interval * ease
   ease = ease + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
   ease = max(ease, 1.3)
due_date = hôm nay + interval
```

**Import/Export:** CSV/Excel (`ImportExportService`) — cột `word, meaning, phonetic, example`; có bước preview & map cột. Dữ liệu import được lưu vào tài khoản và đồng bộ lên cloud.

---

### 5.2. Ngữ pháp & Bài tập
- Tạo **bài học** + **câu hỏi**: **MCQ**, **điền chỗ trống**, **sắp xếp từ**.
- `QuizService` chấm điểm tự động, hiện **giải thích**, tổng kết điểm; kết quả ghi `study_stats` (đồng bộ cloud).

---

### 5.3. Đọc hiểu & Theo dõi tiến độ
- **Reader:** hiển thị bài đọc; tích hợp **bôi màu → dịch** (Mục 5.5).
- **Dashboard tiến độ:** số từ đã học/đang ôn/đã thuộc; **streak**; biểu đồ số thẻ ôn theo ngày (7/30); thời gian học. Dữ liệu lấy từ `study_stats` + `review_logs` (đồng bộ đa thiết bị → thống kê luôn nhất quán).

---

### 5.4. Viết tiếng Anh (Writing)
- **Editor**: đếm từ/câu, gợi ý đề bài, lưu nháp tự động (đồng bộ cloud).
- Kiểm tra chính tả cơ bản (đối chiếu từ điển).
- (Tùy chọn, cần internet) tích hợp **API AI** gợi ý sửa ngữ pháp/diễn đạt qua `WritingAssistProvider`.

#### 5.4.1. Gợi ý từ khi viết (Word Suggestion / Autocomplete) ⭐

Khi người dùng gõ, app **gợi ý từ theo thời gian thực** để viết nhanh, đúng chính tả và học từ mới.

**4 loại gợi ý:**

| Loại | Kích hoạt | Ví dụ |
|------|-----------|-------|
| **Autocomplete** | Gõ ≥2 ký tự | `beau` → *beautiful, beauty...* |
| **Next-word** | Gõ xong 1 từ + dấu cách | `make a` → *decision, mistake...* |
| **Synonym** | Chọn 1 từ / phím tắt | `good` → *excellent, remarkable...* |
| **Collocation** | Sau một từ thường có collocation | `heavy` → *heavy rain, heavy traffic...* |

**Luồng (real-time):**
```
Gõ trong editor → (debounce ~120ms) → SuggestionService.suggest(context)
   context = { từ đang gõ, 1–2 từ trước, vị trí con trỏ }
   ├─ Autocomplete: Trie dựng từ `dictionary`
   ├─ Next-word/Collocation: tra `word_ngrams`
   ├─ Synonym: tra `thesaurus`
   └─ ƯU TIÊN từ trong bộ người dùng đang học (bảng cards của user)
→ Hiện 5–7 gợi ý dưới con trỏ → chọn bằng ↑/↓+Enter, Tab, hoặc click
→ Chèn vào văn bản; (tùy chọn) "➕ Lưu vào bộ từ"
```

**Điểm thiết kế:**
- **Nhanh & không phụ thuộc mạng:** dữ liệu gợi ý (`dictionary`, `word_ngrams`, `thesaurus`) đóng gói kèm app dưới dạng **file JSON**, nạp vào bộ nhớ (Trie) khi khởi động → gợi ý < 50ms, chạy được cả khi offline (vì là dữ liệu tĩnh, không cần cloud).
- **Cá nhân hóa:** ưu tiên từ người dùng đang học (lấy từ Cloud khi online) + gợi ý dựa trên chính văn bản đang viết.
- Tách nguồn qua `SuggestionProvider`: `OfflineSuggestionProvider` (mặc định) + `AiSuggestionProvider` (tùy chọn, online).
- Có thể bật/tắt; không tự chèn khi chưa chọn.

---

### 5.5. Công cụ Bôi màu → Dịch (Highlight-to-Translate) ⭐

**Luồng:**
```
Bôi/tô đoạn chữ tiếng Anh → bắt sự kiện selection → hiện popup "💬 Dịch"
→ TranslationService.translate(text)
     ├─ 1 từ → tra `dictionary` (file JSON trong bộ nhớ, tức thì)
     └─ cụm/câu → TranslationProvider:
            • Offline: ghép nghĩa từng từ (cơ bản)
            • Online (tùy chọn): gọi API dịch (chính xác hơn)
→ Hiện kết quả tiếng Việt (kèm phiên âm, từ loại) → "➕ Lưu vào bộ từ"
```

**Điểm thiết kế:**
- `TranslationProvider` (interface): `OfflineDictionaryProvider` (mặc định) + `OnlineApiProvider` (tùy chọn).
- Từ điển Anh–Việt (nguồn mở như Wiktionary/StarDict) đóng gói kèm app dưới dạng **file JSON**, nạp vào bộ nhớ để tra từ tức thì (không cần cloud).
- Từ "Lưu vào bộ từ" được lưu vào tài khoản → đồng bộ cloud, xuất hiện trên mọi thiết bị.
- Tái sử dụng ở cả trang Đọc và trang Viết.

---

## 6. Thiết kế giao diện (UI/UX)

### 6.1. Bố cục chính
```
┌──────────────────────────────────────────────────────┐
│  EngMaster            [☁ Đã đồng bộ]  👤Tên  [⚙ ✕]   │
├───────────┬──────────────────────────────────────────┤
│ 🏠 Trang  │                                          │
│ 📇 Từ vựng│          VÙNG NỘI DUNG CHÍNH             │
│ 📝 Ngữ pháp│         (thay đổi theo mục chọn)        │
│ 📖 Đọc    │                                          │
│ ✍ Viết    │                                          │
│ 📊 Tiến độ│                                          │
│ ⚙ Cài đặt │                                          │
└───────────┴──────────────────────────────────────────┘
```
- Trước khi vào app: **màn hình Đăng nhập / Đăng ký**.
- Thanh trên cùng có **trạng thái đồng bộ (☁)** + **tên/tài khoản người dùng**.

### 6.2. Nguyên tắc UX
- Đơn giản, tập trung; phím tắt (Space lật thẻ, 1–4 đánh giá, Ctrl+S lưu, Tab chọn gợi ý).
- Chế độ Sáng/Tối.
- Phản hồi tức thì (tra từ/gợi ý < 200ms nhờ dữ liệu tĩnh trong bộ nhớ).
- **Fail mềm khi mất mạng:** app vẫn học được, hiện "Chờ mạng để đồng bộ", không treo.

---

## 7. Thiết kế API (Cloud API & IPC)

**7.1. Cloud API (App ⇄ Supabase, qua HTTPS):**
```
POST /auth/signup, /auth/login, /auth/logout
GET  /decks?user_id                       → danh sách bộ từ của user
GET  /cards?deck_id                       → thẻ trong bộ
POST /cards, PATCH /cards/:id             → tạo/sửa thẻ (kèm SRS)
POST /review_logs                         → ghi lịch sử ôn
GET  /writings, POST /writings            → bài viết
GET  /study_stats?range=30d               → thống kê
// Mọi truy vấn tự lọc theo user nhờ Row Level Security
```

**7.2. IPC nội bộ (Renderer ⇄ Main trong app):**
```ts
auth:login(email, pw)            → Session
auth:current()                   → User | null
net:status()                     → 'online' | 'offline'
deck:list() / card:getDue(deckId) / card:review(cardId, rating)
import:csv(filePath, deckId)     → { added, skipped }
translate:text(text)             → { vi, phonetic?, pos? }
suggest:words(context)           → Suggestion[]
stats:summary()                  → { streak, totalLearned, chart }
```

---

## 8. Lưu trữ & Sao lưu (Storage & Backup)

- **Nguồn duy nhất:** Cloud (Postgres) — dữ liệu an toàn, truy cập từ mọi thiết bị. **Không có CSDL cục bộ.**
- **Dữ liệu tĩnh kèm app:** từ điển, n-gram, thesaurus dưới dạng file JSON trong thư mục cài đặt (chỉ đọc).
- **Trạng thái phiên:** chỉ giữ trong bộ nhớ (RAM) khi app đang chạy; đóng app là mất — dữ liệu thật luôn ở cloud.
- **Sao lưu cloud:** nhà cung cấp (Supabase) backup tự động; ngoài ra cho phép **Export dữ liệu ra CSV/JSON** để người dùng tự giữ bản sao.
- **Media (audio/ảnh):** lưu trên Cloud Storage.

---

## 9. Yêu cầu phi chức năng (Non-Functional Requirements)

| Loại | Yêu cầu |
|------|---------|
| **Đồng bộ** | Đăng nhập máy khác thấy đúng dữ liệu ngay (do đọc thẳng từ cloud, không cần trộn) |
| **Kết nối** | **Cần internet** cho chức năng dữ liệu; mất mạng → báo rõ, không treo. Tra từ/gợi ý (dữ liệu tĩnh) vẫn chạy offline |
| **Hiệu năng** | Mở app < 3s; tra từ/gợi ý < 200ms (dữ liệu tĩnh trong RAM); truy vấn cloud nhanh, có chỉ mục |
| **Bảo mật** | Row Level Security (mỗi user chỉ thấy dữ liệu của mình); mật khẩu băm; kết nối HTTPS; token lưu an toàn |
| **Độ tin cậy** | Không mất dữ liệu khi mất mạng giữa chừng; giải quyết xung đột rõ ràng |
| **Riêng tư** | Chỉ gửi lên cloud dữ liệu học của người dùng; nêu rõ chính sách dữ liệu |
| **Khả năng mở rộng** | Kiến trúc phân lớp; backend tách biệt → mở rộng app di động/web sau này |

---

## 10. Rủi ro & Giải pháp (Risks)

| Rủi ro | Ảnh hưởng | Giải pháp |
|--------|-----------|-----------|
| Mất mạng khi đang học | Không dùng được chức năng dữ liệu | Báo trạng thái rõ ràng; giữ thao tác đang gõ trên màn hình để không mất. **Nếu cần offline mạnh hơn** → cân nhắc thêm lại một lớp lưu tạm ở bản sau |
| Xung đột dữ liệu đa thiết bị | Hiếm khi xảy ra | Vì đọc/ghi thẳng cloud (nguồn duy nhất) nên **không có bài toán trộn dữ liệu** |
| Chi phí cloud tăng theo người dùng | Tốn kém | Bắt đầu gói miễn phí Supabase; tối ưu truy vấn; đồng bộ delta (chỉ phần thay đổi) |
| Bảo mật / lộ dữ liệu | Nghiêm trọng | RLS + HTTPS + không lưu mật khẩu thô + quản lý token cẩn thận |
| Phụ thuộc nhà cung cấp (Supabase) | Khó chuyển | Kiến trúc tách `CloudApiClient` → có thể thay backend khác |
| Đồng bộ sai làm mất bản ghi | Nghiêm trọng | Soft-delete (đánh dấu `deleted` thay vì xóa hẳn); log đồng bộ; export backup |

---

## 11. Kế hoạch phát triển theo giai đoạn (Roadmap)

**Giai đoạn 1 — Nền tảng Cloud + Từ vựng (MVP):**
- Dựng backend Supabase (Auth + Postgres + RLS).
- **Đăng ký/đăng nhập** + màn hình Auth.
- `CloudApiClient` gọi thẳng Supabase cho mọi đọc/ghi (không CSDL cục bộ).
- Quản lý bộ từ + **Flashcard SRS** + Import CSV.
- **Bôi màu → Dịch** với từ điển (file JSON đóng gói).

**Giai đoạn 2 — Học tập:**
- Ngữ pháp & bài tập (MCQ, fill-blank) + chấm điểm.
- Đọc hiểu + Dashboard tiến độ (streak, biểu đồ), đồng bộ đa thiết bị.

**Giai đoạn 3 — Viết & Nâng cao:**
- Editor Writing + kiểm tra chính tả.
- **Gợi ý từ khi viết** (Autocomplete/Trie → Next-word/n-gram → Synonym).
- (Tùy chọn) AI hỗ trợ viết & dịch câu.
- Đóng gói installer `.exe`, auto-update.

---

## 12. Ý tưởng mở rộng tương lai (v2+)
- **Ứng dụng di động / web** dùng chung backend cloud → học mọi lúc mọi nơi.
- Chia sẻ / marketplace bộ từ giữa người dùng.
- TTS phát âm + luyện nói (thu âm so sánh).
- Nội dung dựng sẵn theo trình độ (A1–C2).
- Nhắc học hằng ngày (thông báo Windows/đẩy).
- Gamification: điểm, huy hiệu, bảng xếp hạng.

---

## Phụ lục A — Danh mục màn hình
1. **Auth** (Đăng nhập / Đăng ký / Quên mật khẩu)
2. Dashboard (Trang chủ / tiến độ)
3. Vocabulary Manager (Quản lý bộ từ & thẻ)
4. Flashcard Review (Ôn tập SRS)
5. Grammar Lessons & Quiz
6. Reading (Đọc + bôi màu dịch)
7. Writing Editor (có gợi ý từ)
8. Settings (theme, provider dịch/gợi ý, tài khoản, đồng bộ)
9. Import/Export

## Phụ lục B — Thư viện & Dịch vụ gợi ý
**App desktop:**
- `electron`, `electron-builder` (đóng gói .exe)
- `react`, `typescript`, `vite`
- `@supabase/supabase-js` (kết nối cloud: Auth + DB + Storage) — thay cho mọi lưu trữ cục bộ
- Từ điển/gợi ý: **file JSON tĩnh** đóng gói kèm app (nạp vào bộ nhớ)
- `xlsx` / `papaparse` (import Excel/CSV)
- `recharts` (biểu đồ tiến độ)
- `tiptap`/`slate` (editor Writing + selection + chèn gợi ý)
- `trie-search` / tự cài **Trie** (autocomplete offline nhanh)

**Cloud (Supabase):**
- PostgreSQL + Auth + Storage + Row Level Security (chính sách theo `user_id`)
