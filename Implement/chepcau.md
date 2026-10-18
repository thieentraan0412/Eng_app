# Tính năng: Chép câu (Dịch câu Việt → Anh)

## 1. Mục tiêu

Người học được đưa **một danh sách nhiều câu tiếng Việt** trên cùng một trang, mỗi câu có **một ô trống riêng để nhập câu tiếng Anh** dựa theo nghĩa tiếng Việt đó. Người dùng cuộn và làm lần lượt các câu; hệ thống chấm và đưa phản hồi cho từng câu (đúng/gần đúng/sai + gợi ý sửa) để rèn kỹ năng viết câu và củng cố từ vựng đã học.

Đây là một dạng bài luyện tập chủ động (active recall), bổ trợ cho trang **Ôn tập (flashcard)** và **Viết (writing)** đã có.

## 2. Luồng người dùng (User flow)

1. Vào trang **Chép câu** từ sidebar.
2. App hiển thị **một danh sách nhiều câu tiếng Việt** (mỗi câu là một thẻ, có ô nhập tiếng Anh trống riêng). Không có cơ chế "câu tiếp theo" — người dùng cuộn để làm tất cả.
3. Người dùng gõ câu tiếng Anh vào ô của từng câu.
4. Nhấn **Kiểm tra** ở từng thẻ (hoặc `Ctrl + Enter` khi con trỏ đang ở ô đó) — chấm riêng câu đó.
5. Kết quả hiện ngay trong thẻ tương ứng:
   - Trạng thái: ✅ Đúng / 🟡 Gần đúng / ❌ Chưa đúng
   - So sánh với đáp án tham chiếu (highlight phần khác nhau).
   - Lỗi chính tả / ngữ pháp (dùng lại `spellcheck` + `grammarcheck`).
6. (Tùy chọn) Nút **Kiểm tra tất cả** ở đầu trang để chấm mọi câu đã nhập cùng lúc; thanh tiến độ hiển thị số câu đúng / tổng số.

## 3. Giao diện (UI)

Trang là **một danh sách cuộn gồm nhiều thẻ câu**. Mỗi thẻ = 1 câu tiếng Việt + 1 ô nhập tiếng Anh + kết quả riêng.

```
┌─────────────────────────────────────────────┐
│  Chép câu                    Đúng 1 / 20     │
│  [ Kiểm tra tất cả ]   ▓▓▓░░░░░░░  (tiến độ) │
│  ═══════════════════════════════════════════ │
│                                               │
│  ① 🇻🇳 Tôi đã học tiếng Anh được ba năm.       │
│     ┌───────────────────────────────────┐    │
│     │ I have learn English for 3 years  │    │  ← ô nhập riêng
│     └───────────────────────────────────┘    │
│     [ Xem đáp án ]              [ Kiểm tra ]  │
│     🟡 Gần đúng                                │
│     Gợi ý: I have learned English for three   │
│            years.                             │
│     • "learn" → "learned" (hiện tại hoàn thành)│
│  ─────────────────────────────────────────── │
│  ② 🇻🇳 Cô ấy sống ở Hà Nội.                    │
│     ┌───────────────────────────────────┐    │
│     │ She li▮                            │    │  ← đang gõ dở
│     └───────────────────────────────────┘    │
│     ┌── gợi ý ────────────────────────┐       │
│     │ live · lives · living · like    │       │  ← dropdown gợi ý từ
│     └─────────────────────────────────┘       │
│     [ Xem đáp án ]              [ Kiểm tra ]  │
│  ─────────────────────────────────────────── │
│  ③ 🇻🇳 ...                             (cuộn ↓)│
└─────────────────────────────────────────────┘
```

- Toàn trang cuộn dọc; mỗi câu là một thẻ độc lập, có state riêng (input + kết quả).
- Câu tiếng Việt: font lớn, dễ đọc (dùng token `--font-serif` / Lora nếu có).
- Ô nhập: `textarea` tự giãn, `Ctrl+Enter` = Kiểm tra riêng thẻ đang focus.
- Kết quả hiện ngay trong thẻ, không chuyển trang, không mất câu khác.
- Header có tổng tiến độ (số câu đúng / tổng) + nút **Kiểm tra tất cả**.

## 4. Gợi ý từ khi nhập (autocomplete)

Khi người dùng gõ vào ô nhập, hiển thị **dropdown gợi ý từ ngay dưới con trỏ** để giúp viết nhanh và đúng chính tả. Tái sử dụng nguyên `suggest()` trong [`src/services/suggestion.ts`](src/services/suggestion.ts) — đã hoạt động offline, không cần thêm dữ liệu.

### Loại gợi ý (đã có sẵn trong service)
- **`auto`** — Autocomplete: đang gõ dở một từ (`≥ 2 ký tự`) → gợi ý các từ hoàn chỉnh theo tiền tố (Trie).
- **`nextword`** — Từ tiếp theo: vừa gõ xong một từ + dấu cách → gợi ý từ hay đi sau (n-gram).
- **`synonym`** — Đồng nghĩa: gõ đúng một từ có từ đồng nghĩa → gợi ý từ hay hơn.

### Cách dùng API
```ts
import { suggest, type Suggestion } from '../services/suggestion'

// textBeforeCaret = phần văn bản TRƯỚC con trỏ trong textarea
const items: Suggestion[] = suggest(textBeforeCaret, 7)
// -> [{ text: 'live', type: 'auto' }, { text: 'lives', type: 'auto' }, ...]
```

### Hành vi UI
- Lấy `textBeforeCaret` = `value.slice(0, selectionStart)` mỗi khi `onChange` / di chuyển con trỏ; gọi `suggest()` (nên **debounce ~120ms**).
- Hiển thị dropdown neo dưới ô nhập; tối đa ~7 mục, có icon nhỏ phân biệt loại (`⌨` auto · `→` nextword · `≈` synonym).
- **Điều hướng bàn phím**: `↑`/`↓` chọn, `Tab` hoặc `Enter` chèn từ đang chọn, `Esc` đóng.
- **Chèn từ**: thay thế token đang gõ dở (regex `/([A-Za-z]+)$/`) bằng từ được chọn; với `nextword`/`synonym` thì chèn kèm một dấu cách phía sau.
- Không để `Enter` chèn gợi ý xung đột với `Ctrl+Enter` (Kiểm tra) — khi dropdown mở, `Enter` = chèn; khi đóng, `Enter` = xuống dòng bình thường.
- Mỗi thẻ câu có dropdown gợi ý **riêng**, chỉ hiện ở thẻ đang focus.

## 5. Mô hình dữ liệu

### Câu luyện tập
```ts
export interface SentenceItem {
  id: string
  vi: string            // câu tiếng Việt (đề bài)
  en: string            // đáp án tham chiếu chính
  altAnswers?: string[] // các cách dịch đúng khác (tùy chọn)
  hints?: string[]      // gợi ý từ vựng/cấu trúc
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  topic?: string        // chủ đề: du lịch, công việc...
}
```

### Kết quả một lần làm (để lưu tiến độ / SRS)
```ts
export interface SentenceAttempt {
  itemId: string
  userInput: string
  score: number          // 0..1 (độ giống đáp án)
  status: 'correct' | 'close' | 'wrong'
  createdAt: string      // ISO
}
```

## 6. Logic chấm điểm

Chấm theo nhiều lớp, ưu tiên khoan dung (không đòi khớp tuyệt đối):

1. **Chuẩn hóa** cả câu người dùng và đáp án: lowercase, bỏ dấu câu thừa, gộp khoảng trắng.
2. **Khớp tuyệt đối** với `en` hoặc bất kỳ `altAnswers` → ✅ Đúng (score = 1).
3. **Độ tương đồng**: tính điểm bằng token overlap / Levenshtein chuẩn hóa.
   - `score ≥ 0.85` → 🟡 Gần đúng.
   - `score < 0.85` → ❌ Chưa đúng.
4. **Bổ sung phản hồi**:
   - Chạy `isMisspelled` / `suggestFix` (từ `services/spellcheck.ts`) để bắt lỗi chính tả.
   - Chạy `checkGrammar` / `checkLocalGrammar` để gợi ý ngữ pháp.
   - Highlight từ khác nhau giữa câu người dùng và đáp án (diff theo từ).

> Ghi chú: giai đoạn đầu chỉ cần lớp 1–3; lớp 4 tái sử dụng service sẵn có nên chi phí thấp.

## 7. Kế hoạch triển khai (theo mốc)

- **M1 — Khung UI + dữ liệu tĩnh**
  - Thêm `sentence` vào `PageKey` và `NAV` trong `src/pages/pages.ts` (icon ✏️, label "Chép câu").
  - Tạo `src/pages/SentencePage.tsx`: hiển thị câu VI + ô nhập + nút Kiểm tra.
  - Dữ liệu mẫu tĩnh (~20 câu) trong `src/data/sentences.ts`.
- **M2 — Chấm điểm + phản hồi**
  - Tạo `src/services/sentencecheck.ts`: chuẩn hóa, tính similarity, trả `status + diff`.
  - Nối `spellcheck` + `grammarcheck` vào phần phản hồi.
- **M2.5 — Gợi ý từ khi nhập**
  - Nối `suggest()` (`services/suggestion.ts`) vào ô nhập của từng thẻ.
  - Dropdown gợi ý + điều hướng bàn phím + chèn từ (có thể tách component `SuggestBox` tái dùng chung với trang Viết).
- **M3 — Tiến độ & lưu trữ**
  - Lưu `SentenceAttempt` lên Supabase qua `CloudApiClient` (bảng `sentence_attempts`).
  - Tích hợp SRS (`services/srs.ts`): câu sai/gần đúng được lên lịch ôn lại.
- **M4 — Nâng cao (tùy chọn)**
  - Lọc theo `level` / `topic`.
  - Đọc to đáp án (Web Speech API).
  - Thống kê trên **Dashboard** (số câu đúng, streak).

## 8. File cần tạo / sửa

| File | Việc |
|------|------|
| `src/pages/pages.ts` | Thêm key `sentence` + mục NAV |
| `src/pages/SentencePage.tsx` | (mới) UI trang Chép câu |
| `src/data/sentences.ts` | (mới) Ngân hàng câu mẫu |
| `src/services/sentencecheck.ts` | (mới) Logic chuẩn hóa + chấm điểm + diff |
| `src/services/suggestion.ts` | (dùng lại) Gợi ý từ khi nhập — không sửa |
| `src/App.tsx` | Định tuyến trang mới |
| `src/services/cloud/CloudApiClient.ts` | (M3) API lưu/đọc attempt |

## 9. Tiêu chí hoàn thành (Definition of Done)

- [ ] Sidebar có mục **Chép câu**, mở được trang.
- [ ] Hiển thị **danh sách nhiều câu** tiếng Việt, mỗi câu có ô nhập tiếng Anh trống riêng.
- [ ] Mỗi thẻ có state độc lập; chấm một câu không ảnh hưởng câu khác.
- [ ] `Ctrl+Enter` và nút **Kiểm tra** ở từng thẻ đều chấm được.
- [ ] Phân biệt đúng 3 trạng thái: đúng / gần đúng / sai.
- [ ] Có nút **Xem đáp án** ở từng thẻ và **Kiểm tra tất cả** ở header.
- [ ] Header hiển thị tiến độ tổng (số câu đúng / tổng số).
- [ ] Khi gõ vào ô nhập có **dropdown gợi ý từ** (autocomplete / next-word / synonym).
- [ ] Chọn gợi ý bằng chuột hoặc bàn phím (`↑`/`↓`, `Tab`/`Enter`, `Esc`) và chèn đúng vào câu.
- [ ] Bắt được ít nhất lỗi chính tả cơ bản qua service sẵn có.

## 10. Checklist các bước thực hiện

### Bước 1 — Định tuyến & điều hướng ✅
- [x] Thêm `'sentence'` vào type `PageKey` trong `src/pages/pages.ts`.
- [x] Thêm mục `{ key: 'sentence', label: 'Chép câu', icon: '✏️' }` vào mảng `NAV`.
- [x] Khai báo route trang mới — *thực tế routing nằm ở `src/components/AppLayout.tsx`* (import + `case 'sentence'` render `SentencePage`), không phải `App.tsx`.

### Bước 2 — Dữ liệu câu mẫu ✅
- [x] Tạo `src/data/sentences.ts` export mảng `SENTENCES: SentenceItem[]` (12 câu VI + EN, có `id`, `hints`, `level`, `topic`).
- [x] Định nghĩa interface `SentenceItem` (+ type `CefrLevel`) dùng chung với trang & service.

### Bước 3 — Khung UI danh sách (M1) ✅
- [x] Tạo `src/pages/SentencePage.tsx`, load danh sách câu từ `data/sentences.ts`.
- [x] Render danh sách cuộn: mỗi câu là 1 thẻ (số thứ tự + câu VI + `textarea` + nút Kiểm tra / Xem đáp án).
- [x] Mỗi thẻ giữ state riêng: `input`, `result`, `revealed` (tách component `SentenceCard`).
- [x] Header: nút **Kiểm tra tất cả** + thanh tiến độ "Đúng x / tổng".

### Bước 4 — Chấm điểm (M2) ✅
- [x] Tạo `src/services/sentencecheck.ts`: `normalize()` + `similarity()` (token overlap + Levenshtein) + `gradeSentence()` trả `{ status, score, bestAnswer, diff, spell, grammar }`.
- [x] Khớp tuyệt đối với `en` / `altAnswers` → `correct`; ngưỡng `≥0.85` → `close`; còn lại → `wrong`.
- [x] Nối `isMisspelled`/`suggestFix` (`spellcheck.ts`) và `checkLocalGrammar` (`localgrammar.ts`) vào phản hồi. *Dùng grammar offline cho phản hồi tức thì; `checkGrammar` (LanguageTool online) để dành M4.*
- [x] Highlight phần khác nhau giữa câu người dùng và đáp án (diff theo từ, LCS).
- [x] Nút **Kiểm tra** (và `Ctrl+Enter`) gọi `gradeSentence` cho đúng thẻ đó.

### Bước 5 — Gợi ý từ khi nhập (M2.5) ✅
- [x] Dropdown gợi ý neo dưới `textarea` (dựng inline trong `SentenceCard`, chưa tách component riêng — có thể refactor sau).
- [x] Mỗi `onChange`/đổi con trỏ, tính `value.slice(0, caret)` và gọi `suggest()` (debounce 120ms); tôn trọng cờ `suggest_enabled`.
- [x] Hiển thị gợi ý, icon phân biệt loại (`⌨` auto / `→` nextword / `≈` synonym).
- [x] Điều hướng bàn phím: `↑`/`↓` chọn, `Tab`/`Enter` chèn, `Esc` đóng; `Ctrl+Enter` luôn = Kiểm tra.
- [x] Logic chèn: thay token đang gõ (`/([A-Za-z]+)$/`), chèn kèm dấu cách.

### Bước 6 — Lưu tiến độ & SRS (M3, tùy chọn) ⏭️ (chưa làm)
- [ ] Thêm API lưu/đọc `SentenceAttempt` vào `src/services/cloud/CloudApiClient.ts` (bảng `sentence_attempts`).
- [ ] Lưu kết quả mỗi lần Kiểm tra; câu `wrong`/`close` đưa vào lịch ôn qua `services/srs.ts`.

### Bước 7 — Kiểm thử & chạy thử
- [x] `npm run typecheck` không lỗi.
- [x] Chạy `unset ELECTRON_RUN_AS_NODE; npm run dev` — Vite build sạch, Electron mở app, không lỗi biên dịch.
- [ ] Bấm thử trong app: nhập câu, gợi ý từ, Kiểm tra, Xem đáp án, tiến độ *(cần bạn thao tác kiểm chứng trực quan)*.
- [ ] Đối chiếu lại toàn bộ **Mục 9 — Definition of Done**.
