# 11 · Ngữ pháp — Nghiên cứu & Thiết kế

Module thứ 11 của EngMaster. Ba việc trong một: **học** chủ điểm → **luyện** bằng 4 dạng bài
→ **sửa** lỗi của chính mình qua sổ lỗi có lịch ôn.

---

## 1. Vì sao cần module này

App hiện có 10 phân hệ, mọi thứ đều xoay quanh **từ vựng**: bộ từ → flashcard → trắc nghiệm
nghĩa từ → sắp xếp câu ví dụ. Người học có thể thuộc 500 từ mà vẫn viết
*"I very like this book because it have three chapter."* — sai 3 lỗi ngữ pháp trong một câu
mà không lỗi nào là lỗi từ vựng.

Module Viết (07) và Chép câu (08) đã chạm tới ngữ pháp nhưng chỉ ở mức **phát hiện lỗi sau khi
người dùng viết sai**. Không có nơi nào dạy quy tắc, không có nơi nào theo dõi lỗi lặp lại.
Đây là khoảng trống mà module 11 lấp vào.

## 2. Nghiên cứu nền tảng

### 2.1 Lỗi ngữ pháp đặc thù của người học Việt Nam

Tiếng Việt là ngôn ngữ **không biến hình** (non-inflectional): không có đuôi chia thì, không có
đuôi số nhiều, không có mạo từ. Hệ quả là lỗi của người Việt không rải đều mà **dồn cụm** vào
vài điểm rất hẹp — nghĩa là can thiệp đúng chỗ sẽ có hiệu quả rất cao.

| # | Lỗi | Ví dụ sai → đúng | Nguyên nhân từ tiếng mẹ đẻ |
|---|---|---|---|
| 1 | Thiếu **-s** số nhiều | *three book* → three **books** | Tiếng Việt không đánh dấu số nhiều trên danh từ ("ba quyển sách"). Nghiên cứu ghi nhận tỷ lệ bỏ sót lên tới ~97,5% ở nhóm mới học. |
| 2 | Thiếu / thừa **mạo từ** | *I am student* → I am **a** student | Tiếng Việt không có `a/an/the`. |
| 3 | Thiếu **-s** ngôi 3 số ít | *He go to work* → He **goes** to work | Tiếng Việt không hòa hợp chủ ngữ–động từ. |
| 4 | Quá khứ đơn thay hiện tại hoàn thành | *I already ate* → I **have** already **eaten** | Một chữ "đã" trong tiếng Việt gánh cả hai nghĩa. |
| 5 | Thiếu động từ **to be** trước tính từ | *She very tired* → She **is** very tired | Tiếng Việt nói thẳng "Cô ấy rất mệt", không cần hệ từ. |
| 6 | Trật tự **tính từ – danh từ** | *a car red* → a **red car** | Tiếng Việt đặt tính từ sau danh từ ("xe màu đỏ"). |
| 7 | **Giới từ** dịch từng chữ | *depend of* → depend **on** | Dịch trực tiếp từ "phụ thuộc vào". |

→ **Quyết định thiết kế:** mỗi trang bài học có một khối riêng **"Bẫy với người Việt"**, và sổ lỗi
gắn nhãn lỗi theo đúng 7 nhóm này để người học thấy được *kiểu* lỗi của mình, không chỉ từng câu lẻ.

### 2.2 Phương pháp dạy ngữ pháp

- **Noticing** (Schmidt): người học chỉ tiếp thu quy tắc khi *chú ý thấy* khoảng cách giữa câu
  mình viết và câu đúng. → Mọi phản hồi sai đều hiển thị **đối chiếu song song** câu sai / câu đúng,
  tô đỏ đúng token gây lỗi, không chỉ báo "Sai".
- **Cloze deletion cho ngữ pháp**: SRS thường bị coi là chỉ hợp với từ vựng. Thực tế dạng
  **điền chỗ trống trong câu** buộc người học *áp dụng* quy tắc thay vì *thuộc lòng* quy tắc —
  đây là dạng bài chủ lực của module.
- **Spacing effect**: kiến thức ôn giãn cách giữ lâu hơn ôn dồn. → Chủ điểm và lỗi cá nhân đều
  có lịch ôn riêng, dùng lại đúng thang SRS mà module 04 đang dùng.
- **Đổi định dạng khi tái phạm**: nếu một lỗi lặp lại, không hỏi lại y hệt mà đổi sang dạng bài
  khác (trắc nghiệm → sửa lỗi → viết lại câu). Tránh việc người học thuộc *đáp án* thay vì *quy tắc*.

### 2.3 Khung chủ điểm

Dùng khung **CEFR (A1 → C1)** vì đây là chuẩn phổ biến nhất và ánh xạ thẳng sang các kỳ thi
người học Việt Nam quan tâm (VSTEP, IELTS). English Grammar Profile của Cambridge cho thấy
mỗi cấp CEFR có một tập "criterial features" — cấu trúc phân biệt cấp đó với cấp dưới:
cấp thấp là thì cơ bản, câu hỏi, giới từ; cấp cao là điều kiện phức, bị động, tường thuật, đảo ngữ.

**16 chủ điểm** được chọn (thay vì liệt kê hết mọi hiện tượng ngữ pháp) — đủ phủ A1→C1 mà vẫn
gọn để hiển thị hết trong một màn hình lưới:

| Cấp | Chủ điểm |
|---|---|
| A1 | Danh từ số nhiều & đếm được · Mạo từ · Hiện tại đơn & tiếp diễn · Trật tự từ và câu hỏi |
| A2 | Quá khứ đơn & tiếp diễn · Hòa hợp chủ ngữ–động từ · Giới từ thời gian & nơi chốn · So sánh |
| B1 | Hiện tại hoàn thành · Động từ khuyết thiếu · Câu bị động · Mệnh đề quan hệ |
| B2 | Câu điều kiện · Gerund & Infinitive · Câu tường thuật |
| C1 | Đảo ngữ & cấu trúc nhấn mạnh |

## 3. Bốn màn hình

```
                          ┌──────────────────────┐
                          │  index.html          │
                          │  Thư viện chủ điểm   │
                          └───┬──────────┬───────┘
             chọn chủ điểm    │          │   "Luyện điểm yếu"
                              ▼          ▼
              ┌───────────────────┐   ┌──────────────────┐
              │  chi-tiet.html    │   │  so-loi.html     │
              │  Bài học          │   │  Sổ lỗi cá nhân  │
              └─────────┬─────────┘   └────────┬─────────┘
                        │  "Luyện chủ điểm"    │  "Ôn lỗi này"
                        └──────────┬───────────┘
                                   ▼
                        ┌─────────────────────┐
                        │  luyen-tap.html     │
                        │  Phiên luyện (focus)│
                        └─────────────────────┘
                                   │ kết thúc → ghi lỗi mới vào sổ
                                   └──────────────► so-loi.html
```

### 3.1 `index.html` — Thư viện chủ điểm

| Khối | Nội dung | Lý do |
|---|---|---|
| 4 thẻ chỉ số | Chủ điểm đã nắm · Độ chính xác 7 ngày · Lỗi đang theo dõi · Chuỗi ngày | Giống trang chủ (02) để người dùng không phải học lại cách đọc |
| "Ưu tiên hôm nay" | 3 chủ điểm đến hạn ôn hoặc độ chính xác thấp + nút **Luyện 10 phút** | Giảm chi phí quyết định — người học không phải tự chọn giữa 16 chủ điểm |
| Tabs | Tất cả chủ điểm · Điểm yếu của tôi · Bẫy người Việt | Ba cách vào cùng một tập dữ liệu |
| Chipset cấp độ | A1 · A2 · B1 · B2 · C1 | Lọc nhanh, không cần trang riêng |
| Lưới chủ điểm | Thẻ: tên, cấp, số quy tắc, thanh mức nắm vững, trạng thái ôn | Tái dùng `.deck` — không thêm component mới |

### 3.2 `chi-tiet.html` — Bài học một chủ điểm

Lấy **Thì hiện tại hoàn thành** làm mẫu (lỗi #4 ở bảng trên — đây là chủ điểm B1 mà người Việt
sai nhiều nhất vì tiếng Việt gộp mọi thứ vào chữ "đã").

Cấu trúc trang, theo đúng thứ tự người học cần:

1. **Công thức** — bảng khẳng định / phủ định / nghi vấn, cột trái là dạng, cột phải là ví dụ.
2. **Dòng thời gian** — SVG mảnh, minh họa "hành động bắt đầu trong quá khứ, còn liên quan tới hiện tại".
   Trực quan hoá là cách nhanh nhất để phân biệt thì mà tiếng Việt không phân biệt.
3. **Bốn cách dùng** — kinh nghiệm / kết quả còn hiện hữu / khoảng thời gian chưa kết thúc / vừa mới xảy ra.
4. **Từ tín hiệu** — `already`, `yet`, `since`, `for`, `ever`, `never`, `just`, `recently`.
5. **Đối chiếu với quá khứ đơn** — bảng 2 cột, đây là phần người học tra nhiều nhất.
6. **Bẫy với người Việt** — 3 bẫy cụ thể, mỗi bẫy có câu sai (gạch đỏ) → câu đúng (xanh) → giải thích một dòng.
7. **CTA** — Luyện chủ điểm này (18 câu) · Xem lỗi của tôi ở chủ điểm này.

### 3.3 `luyen-tap.html` — Phiên luyện

Dùng **chế độ tập trung** (`.focus`) giống flashcard và trắc nghiệm: ẩn sidebar, chỉ còn thanh
tiến độ + nút thoát, nội dung căn giữa 660px.

**Bốn dạng bài**, luân phiên trong cùng một phiên:

| Dạng | Tương tác | Rèn cái gì |
|---|---|---|
| **Điền vào chỗ trống** | Gõ trực tiếp vào ô inline giữa câu, `Enter` để kiểm tra | Khả năng **sản sinh** — không có gợi ý nào để đoán |
| **Sửa lỗi sai** | Bấm vào token bị sai trong câu → ô nhập hiện ra tại chỗ → gõ dạng đúng | **Noticing**: buộc phải *tìm ra* lỗi trước khi sửa. Hiệu quả nhất với lỗi thiếu -s, thiếu mạo từ |
| **Trắc nghiệm** | 4 đáp án, phím `1`–`4` | Luyện phản xạ, nhận diện nhanh |
| **Viết lại câu** | Textarea + gợi ý số từ, chấm theo danh sách đáp án chấp nhận được | Kiểm tra hiểu sâu — biến đổi cấu trúc chứ không điền chỗ trống |

**Chấm điểm:** chuẩn hoá trước khi so (bỏ khoảng trắng thừa, hạ chữ thường, bỏ dấu câu cuối,
`don't` = `do not`). Mỗi câu có danh sách đáp án chấp nhận được chứ không chỉ một đáp án.

**Phản hồi** — khối luôn xuất hiện sau khi kiểm tra, kể cả khi đúng:

- Đúng/Sai + câu đầy đủ dạng đúng, phần vừa điền được tô nền nhấn.
- **Vì sao** — một câu giải thích ngắn, luôn nói về *quy tắc*, không nói *"bạn gõ sai"*.
- Nhãn chủ điểm + liên kết mở bài học tương ứng.
- Nếu sai: thông báo **"Đã thêm vào sổ lỗi · ôn lại sau 1 ngày"** — người học thấy ngay lỗi không bị bỏ rơi.

**Phím tắt:** `Enter` kiểm tra / câu tiếp · `1`–`4` chọn đáp án · `Esc` thoát.

**Màn hình kết quả:** vòng tròn tỷ lệ đúng, số câu đúng/sai, danh sách lỗi vừa mắc kèm chủ điểm,
hai nút *Ôn lại các câu sai* / *Về thư viện*.

### 3.4 `so-loi.html` — Sổ lỗi cá nhân

Đây là màn hình khác biệt nhất so với các app ngữ pháp thông thường: nó coi **lỗi là một loại
tài sản học tập**, có vòng đời riêng giống thẻ từ vựng.

- 4 chỉ số: tổng lỗi đang theo dõi · đến hạn ôn hôm nay · đã khắc phục · tỷ lệ tái phạm.
- **Phân bố theo nhóm lỗi** — 7 nhóm ở mục 2.1, thanh ngang theo tần suất. Người học nhìn một
  cái là biết mình yếu *kiểu* gì.
- Chipset lọc: Đến hạn · Hay tái phạm · Theo chủ điểm.
- Danh sách lỗi: câu sai (token lỗi gạch ngang đỏ) → câu đúng, nhãn chủ điểm, số lần mắc,
  thời điểm ôn tiếp theo, nút *Ôn ngay*.
- Trạng thái rỗng có ý nghĩa: khi không còn lỗi đến hạn thì hiện lời chúc + gợi ý luyện chủ điểm mới.

### 3.5 `them-chu-diem.html` — Thêm chủ điểm

Thư viện 16 chủ điểm là điểm khởi đầu, không phải giới hạn. Người học ôn thi có giáo trình riêng,
giáo viên có bộ câu riêng — nên module phải cho phép **tự soạn chủ điểm**.

**Hai lối vào, một đích:**

```
        ┌─────────────────────────────┐
        │  Thêm chủ điểm              │
        └──────┬───────────────┬──────┘
     tạo mới   │               │   chép mẫu
               ▼               ▼
        (form trống)   ┌──────────────────┐
               │       │ Thư viện mẫu     │  8 chủ điểm chuẩn CEFR
               │       │ (lọc theo cấp độ)│  đã kèm công thức + câu luyện
               │       └────────┬─────────┘
               └────────┬───────┘
                        ▼
        ┌───────────────────────────────────────────────┐
        │  1 Thông tin → 2 Nội dung → 3 Câu luyện → 4 Lưu│
        └───────────────────────────────────────────────┘
```

Chép mẫu **điền sẵn toàn bộ 4 bước** rồi thả người dùng vào bước 1 — sửa được mọi phần,
không phải là bản chỉ-đọc. Đây là lý do gộp hai lối vào chung một wizard thay vì làm hai luồng riêng.

| Bước | Nội dung |
|---|---|
| **1 · Thông tin** | Tên (vi/en) · cấp độ CEFR · nhóm · mô tả · chọn icon · chọn **nhóm lỗi người Việt** liên quan (quyết định nhãn trong sổ lỗi và việc chủ điểm có xuất hiện ở tab *Bẫy với người Việt* hay không) |
| **2 · Nội dung bài học** | Soạn đúng các khối của trang bài học, theo cùng thứ tự — xem bảng đối chiếu bên dưới |
| **3 · Câu luyện tập** | Hai nguồn: **dán hàng loạt** và **nhập từ file**, cùng đổ vào một bảng duyệt |
| **4 · Xem trước & lưu** | Thẻ chủ điểm như sẽ hiện trong thư viện · một câu luyện mẫu · checklist chất lượng 7 mục |

#### Bước 2 phủ đúng các khối của trang bài học

Nguyên tắc: **mọi khối hiện trên `chi-tiet.html` đều phải soạn được ở bước 2**, cùng thứ tự,
để người soạn hình dung được kết quả mà không cần đối chiếu qua lại.

| Khối trên trang bài học | Soạn ở bước 2 | Cách nhập |
|---|---|---|
| 1 · Công thức | ✅ | Bảng động 3 cột: dạng · cấu trúc · ví dụ |
| 2 · Dòng thời gian | ❌ có chủ đích | Hình minh họa SVG vẽ tay, chỉ hợp với vài chủ điểm về thì — không form-hóa được, để vẽ riêng khi cần |
| 3 · Các trường hợp dùng | ✅ | Khối động: tên trường hợp · câu ví dụ · giải thích tiếng Việt. Icon gán tự động theo thứ tự |
| 4 · Từ tín hiệu | ✅ | Gõ một hoặc nhiều từ ngăn bằng dấu phẩy rồi `Enter` → thành chip, bấm ✕ để bỏ |
| 5 · Đối chiếu với chủ điểm dễ nhầm | ✅ | Nhập tên chủ điểm kia, rồi bảng động 3 cột: tiêu chí · bên kia · bên này. Tiêu đề hai cột tự bám theo tên đã nhập. Bỏ trống thì bảng không hiện trong bài học |
| 6 · Bẫy với người Việt | ✅ | Khối động: câu sai · câu đúng · vì sao |
| 7 · CTA cuối trang | ❌ | Sinh tự động từ số câu luyện tập và số lỗi trong sổ |

Câu ví dụ ở phần *trường hợp dùng* dùng lại đúng dấu `{ }` của cú pháp bước 3 để đánh dấu phần cần
tô đậm — một quy ước cho cả trang thay vì bắt người dùng nhớ hai kiểu.

Chỉ **tên chủ điểm** là bắt buộc. Mọi thứ khác chỉ cảnh báo, không chặn lưu — người dùng có thể
lưu bản nháp rồi bổ sung sau, giống cách `03-tu-vung` cho tạo bộ từ rỗng.
Thanh bước cho **bấm nhảy lùi**, không cho nhảy tiến — tránh bỏ qua trường bắt buộc.

#### Cú pháp dán hàng loạt

Một dòng = một câu. **Dạng bài được nhận diện tự động** từ dấu hiệu trong dòng, người dùng không
phải chọn dạng trước:

| Dạng bài | Đánh dấu | Ví dụ |
|---|---|---|
| Điền vào chỗ trống | `{đáp án}` | `She {has lived} in Hue for six years. (live)` |
| Trắc nghiệm | `{đúng \| sai \| sai}` | `He has worked here {for \| since \| from} five years.` |
| Sửa lỗi sai | `[sai > đúng]` | `My sister is [teacher > a teacher] at school.` |
| Viết lại câu | `gốc >> đích` | `They built it in 1990. >> It was built in 1990.` |

Bổ trợ: `(gợi ý)` cuối câu điền (từ gốc cần chia) · `// giải thích` cuối bất kỳ dòng nào
(thành phần *"Vì sao"* hiện sau khi chấm) · dòng mở đầu bằng `#` là ghi chú, bị bỏ qua.

**Vì sao tự nhận diện thay vì cho chọn dạng:** nhập 30 câu mà mỗi câu phải chọn dạng trong dropdown
là 30 lần thao tác thừa. Dấu `{}`, `[>]`, `>>` đã đủ để phân biệt, và bảng duyệt hiển thị lại dạng
đã nhận diện nên người dùng vẫn kiểm soát được.

Parser báo lỗi **theo từng dòng** — ngoặc chưa khép, nhiều hơn một cặp `{}`, trắc nghiệm dưới 2 hoặc
trên 4 phương án, thiếu vế quanh `>` hoặc `>>`, không nhận ra dạng bài. Dòng lỗi hiện nền đỏ ngay
trong bảng duyệt kèm nguyên văn và lý do, xóa được từng dòng; dòng lỗi bị bỏ qua khi lưu chứ không
chặn cả lô.

#### Nhập từ file

Nhận `.csv` và `.txt`, kéo-thả hoặc bấm chọn, đọc bằng `FileReader` ngay trên máy (không gửi đi đâu).
File có cột `cau` (bắt buộc) và `giai_thich` (tùy chọn); nếu không có dòng tiêu đề thì mỗi dòng
được coi là một câu. Nút **Tải file mẫu** sinh CSV mẫu tại chỗ bằng `Blob`.

Nội dung cột `cau` dùng **đúng cú pháp của tab dán hàng loạt** — một cú pháp duy nhất cho cả hai
nguồn, và cả hai đổ vào cùng một bảng duyệt. Người dùng chỉ phải học một thứ.

#### Checklist chất lượng (bước 4)

Chín mục, mỗi mục kèm một dòng nói rõ *vì sao nên có*, thay vì chỉ đánh dấu ✓/✗:
có tên · ≥1 dòng công thức · **≥2 trường hợp dùng** · **có bảng đối chiếu** · ≥1 bẫy người Việt ·
≥8 câu luyện · dùng ≥3 trong 4 dạng bài · không còn dòng lỗi cú pháp · có từ tín hiệu.

Ngưỡng **≥3 dạng bài** là ngưỡng đáng chú ý nhất: nếu cả chủ điểm chỉ toàn trắc nghiệm thì người học
sẽ nhớ đáp án thay vì nhớ quy tắc — đúng vấn đề mà mục 2.2 nêu.

## 4. Mô hình dữ liệu (đề xuất cho bản chạy thật)

```js
GrammarTopic {
  id, slug, name, nameEn, level: 'A1'|'A2'|'B1'|'B2'|'C1',
  group,                 // 'Thì' | 'Danh từ & mạo từ' | 'Câu phức' …
  ruleCount, itemCount,
  vnPitfalls: [ { wrong, right, why } ],
  mastery: 0..100,       // suy ra từ lịch sử trả lời
  srs: { due, interval, ease }
}

GrammarItem {                       // một câu luyện
  id, topicId,
  type: 'cloze' | 'correct' | 'mcq' | 'transform',
  prompt,                           // câu có ___ hoặc câu có lỗi
  answers: [String],                // các đáp án chấp nhận được
  options: [String],                // chỉ cho mcq
  errorIndex,                       // chỉ cho correct — vị trí token sai
  explain,                          // một câu "vì sao"
  errorTag                          // 1 trong 7 nhóm lỗi người Việt
}

ErrorEntry {                        // một lỗi đã mắc
  id, itemId, topicId, errorTag,
  userAnswer, correctAnswer,
  hitCount, firstSeen, lastSeen,
  srs: { due, interval, ease },
  status: 'active' | 'resolved'
}
```

**Quy tắc SRS cho lỗi** — dùng lại thang của module 04 nhưng khắt khe hơn vì lỗi cần củng cố dày:

| Sự kiện | Khoảng ôn tiếp theo |
|---|---|
| Mắc lỗi lần đầu | 1 ngày |
| Sửa đúng lần 1 | 3 ngày |
| Sửa đúng lần 2 | 7 ngày |
| Sửa đúng lần 3 | 21 ngày → chuyển `resolved` |
| Tái phạm bất kỳ lúc nào | quay về 1 ngày, `hitCount++`, đổi sang dạng bài khác |

## 5. Quyết định thiết kế & đánh đổi

| Quyết định | Lý do | Đánh đổi |
|---|---|---|
| Không thêm mục vào thanh tab dưới (mobile) | Thanh tab đang có 4 mục + "Thêm"; nhét mục thứ 5 sẽ phải bỏ *Bài tập* hoặc làm chật vùng chạm | Ngữ pháp phải vào qua drawer trên mobile — chấp nhận được vì đây là phiên học dài, không phải thao tác lướt nhanh |
| Xếp Ngữ pháp vào nhóm *Luyện tập* trong sidebar | Cùng nhóm với Từ vựng / Ôn tập / Bài tập — đúng mô hình tinh thần của người học | Nhóm Luyện tập tăng lên 4 mục |
| 16 chủ điểm, không phải danh sách đầy đủ | Vừa một màn hình lưới, mỗi chủ điểm đủ lớn để có bài học riêng | Thiếu vài hiện tượng hẹp (mạo từ với tên riêng, thì tương lai hoàn thành tiếp diễn) — sẽ nằm trong chủ điểm cha |
| Sửa lỗi sai làm hai bước (bấm token → gõ sửa) | Bước 1 rèn *nhận ra* lỗi, bước 2 rèn *sửa* lỗi. Gộp một bước sẽ mất mất phần noticing | Chậm hơn trắc nghiệm; bù lại chỉ chiếm ~1/4 số câu trong phiên |
| Không dùng màu mới | Đúng nguyên tắc "một màu nhấn" của design system: chỉ indigo cho hành động chính; xanh/đỏ chỉ dùng cho đúng/sai | Các cấp độ CEFR phải phân biệt bằng nhãn chữ thay vì màu |
| CSS riêng nằm trong `<style>` của từng trang | Giống 10 module hiện có, `style.css` gốc không phình thêm | Có lặp lại vài dòng giữa `luyen-tap` và `chi-tiet` |

## 6. Cấu trúc file

| File | Vai trò |
|---|---|
| `index.html` | Thư viện 16 chủ điểm · ưu tiên hôm nay · 3 tab · lọc cấp độ |
| `chi-tiet.html` | Bài học "Hiện tại hoàn thành" — công thức, dòng thời gian, đối chiếu, bẫy người Việt |
| `luyen-tap.html` | Phiên luyện chế độ tập trung — 4 dạng bài, chấm điểm, giải thích, màn hình kết quả |
| `so-loi.html` | Sổ lỗi cá nhân — phân bố nhóm lỗi, lịch ôn, danh sách lỗi |
| `them-chu-diem.html` | Thêm chủ điểm — chọn tạo mới / chép mẫu CEFR, wizard 4 bước, parser dán hàng loạt, nhập CSV |
| `style.css` | Chỉ `@import '../style.css'` — giống 10 module còn lại |
| `kiem-thu.js` | Bộ kiểm thử DOM (76 kiểm tra) — chạy `node kiem-thu.js <thư-mục-gốc>`, cần `npm i jsdom` |
| `THIET-KE.md` | Tài liệu này |

Thay đổi ở file dùng chung:

- `app.js` — thêm 4 icon (`grammar`, `flag`, `upload`, `download`) và mục *Ngữ pháp* vào nhóm **Luyện tập** của `NAV`.
- `index.html` (gốc) — thêm thẻ số 11 vào nhóm *Luyện tập* của trang hub.
- `DESIGN-PHILOSOPHY.md` — cập nhật bảng thư mục và số lượng icon.

## 7. Đã kiểm tra

`node kiem-thu.js .` — **150 / 150 kiểm tra đạt**:

- 5 trang mới: không lỗi JavaScript, 100% `<i data-ico>` được thay bằng SVG, đổi Sáng/Tối hoạt động.
- Điều hướng: sidebar dựng đúng và mục *Ngữ pháp* sáng lên trên cả 3 trang có shell;
  `luyen-tap` đúng là chế độ tập trung (không có sidebar).
- Tương tác: 3 tab và bộ lọc cấp độ ở trang thư viện, 4 bộ lọc ở sổ lỗi, bộ đếm cập nhật đúng.
- Phiên luyện chạy hết hai kịch bản — **đúng cả 6 câu** (ra 100%, sổ lỗi trống) và
  **sai cả 6 câu** (ra 0%, 6 lỗi được ghi kèm nhãn nhóm lỗi, nút *Ôn lại câu sai* khởi động lại phiên).
- **Parser dán hàng loạt** — 17 kiểm tra: nhận diện đúng cả 4 dạng bài, đọc `(gợi ý)` và `// giải thích`,
  bỏ qua dòng `#` và dòng trống, và báo đúng 6 loại lỗi cú pháp (ngoặc chưa khép, nhiều hơn một cặp `{}`,
  quá 4 phương án, thiếu vế quanh `>`, thiếu câu đích sau `>>`, không nhận ra dạng bài).
- **Luồng thêm chủ điểm** — đi hết cả hai nhánh: chép mẫu (điền sẵn tên + câu luyện, phân tích ngay)
  và tạo mới (chặn khi thiếu tên, thêm/xóa dòng công thức, chip từ tín hiệu, thêm bẫy,
  thêm/xóa trường hợp dùng và tiêu chí đối chiếu, chèn ví dụ mẫu → 11 câu,
  thêm dòng sai → hiện lỗi rồi xóa được, checklist 9 mục, lưu xong).
- Kiểm tra tĩnh toàn bộ 23 file HTML của dự án: cân bằng thẻ, không có `<button>`/`<div>` lồng trong `<a>`,
  mọi liên kết nội bộ trỏ đúng file có thật.

## 8. Nguồn tham khảo

- [A study of common errors among Vietnamese learners — TNU Journal of Science and Technology](https://jst.tnu.edu.vn/jst/article/download/10966/pdf)
- [Guide for Multilingual Student Writing: Common English–Vietnamese Errors — San José State University](https://www.sjsu.edu/wac/docs/VietnameseEnglishGuide.pdf)
- [Common mistakes of Vietnamese learners of English — The TEFL Academy](https://www.theteflacademy.com/blog/common-mistakes-of-vietnamese-learners-of-english/)
- [An Analysis of Grammatical Errors by Vietnamese Learners of English — IJARES](http://myjms.moe.gov.my/index.php/ijares/article/view/9652)
- [Understanding (and using) CEFR criterial features for grammar instruction — Cambridge English](https://www.cambridge.org/elt/blog/2021/06/23/using-cefr-criterial-features-for-grammar-instruction/)
- [CEFR grammar levels — Exam English](https://www.examenglish.com/CEFR/cefr_grammar.htm)
- [A trainable spaced repetition model for language learning — Duolingo Research](https://research.duolingo.com/papers/settles.acl16.pdf)
