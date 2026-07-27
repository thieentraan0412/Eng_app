# EngMaster — Bản thiết kế lại · "Quiet Premium"

Thiết kế lại toàn bộ giao diện EngMaster theo phong cách **tối giản cao cấp** (Linear / Notion):
nền trung tính, viền mảnh thay bóng đổ, một màu nhấn duy nhất, typography sắc nét,
icon SVG nét mảnh thay toàn bộ emoji. Giữ nguyên đầy đủ chức năng và dữ liệu thật của app gốc.

**Mở `index.html` ở thư mục gốc** — trang hub liệt kê 16 màn hình, bấm để xem từng trang.

---

## 1. Nguyên tắc thiết kế

| Nguyên tắc | Cách áp dụng |
|---|---|
| **Viền thay bóng** | Thẻ = nền trắng + viền 1px `#e7e7eb`. Bóng đổ chỉ dùng cho lớp nổi (drawer, nút chính, popover). |
| **Một màu nhấn** | Indigo `#5E5CE6` **chỉ** cho hành động chính và trạng thái đang chọn. Mọi thứ khác là thang xám. Màu ngữ nghĩa (xanh/vàng/đỏ) chỉ dùng cho trạng thái, không trang trí. |
| **Chữ sắc nét** | Inter. Tiêu đề giãn chữ âm (−0.026em), số dùng `tabular-nums` để cột số thẳng hàng. |
| **Bo góc chắc** | 6–14px thay vì 18–24px kiểu "bong bóng". |
| **Mật độ vừa** | Lưới 8px, chiều cao nút 34px (36px trên mobile), thẻ chỉ số gọn. |
| **Chuyển động kín đáo** | 120–180ms, chỉ đổi màu viền / nền khi hover. Tôn trọng `prefers-reduced-motion`. |

## 2. Bảng màu

**Sáng** — nền `#fbfbfc` · thẻ `#ffffff` · nền phụ `#f6f6f8` · viền `#e7e7eb`
**Tối** — nền `#09090b` · thẻ `#121216` · nền phụ `#18181d` · viền `#26262d`

Thang chữ 4 cấp, **tất cả đạt WCAG AA** (đo bằng script, xem mục 6):

| Token | Sáng | Tương phản | Dùng cho |
|---|---|---|---|
| `--text` | `#17171a` | 17.9:1 | tiêu đề, số liệu |
| `--text-2` | `#4c4c55` | 8.5:1 | nội dung phụ |
| `--text-3` | `#616169` | 6.1:1 | mô tả, nhãn |
| `--text-4` | `#74747e` | 4.6:1 | placeholder, trục biểu đồ |

Ở chế độ tối, chữ trên nút chính đổi sang màu mực (`--on-accent`) vì nền nhấn sáng hơn — giữ tương phản 5.6:1.

## 3. Hệ thống icon

41 icon SVG `stroke-width:1.6`, viewBox 24×24, đổi màu theo `currentColor`.
Trong HTML chỉ cần `<i data-ico="home"></i>` — `app.js` tự thay bằng SVG.
Thay toàn bộ emoji của bản gốc (🏠 📇 🔁 📝 📖 ✍️ ✏️ 📊 ⚙️…).

## 4. Bố cục

**PC ≥ 921px** — sidebar cố định 236px, nav chia nhóm *Luyện tập / Kỹ năng / Khác*
(cải tiến so với bản gốc: 9 mục phẳng), nội dung căn giữa tối đa 1120px.

**Mobile ≤ 920px** — topbar dính (☰ + tên trang + nút Sáng/Tối), **thanh tab dưới 5 mục**
kiểu app native, drawer trượt cho các mục còn lại. Vùng chạm tối thiểu 36px.

**Chế độ tập trung** — phiên ôn flashcard, trắc nghiệm và sắp xếp từ ẩn hoàn toàn sidebar,
chỉ còn thanh tiến độ + nút thoát, nội dung căn giữa 660px.

## 5. Cấu trúc file

| File | Vai trò |
|---|---|
| `style.css` | Design system: token, nút, form, thẻ, badge, tab, biểu đồ, dark mode, responsive |
| `app.js` | Bộ icon + tự dựng sidebar / topbar / tabbar / drawer + ghi nhớ Sáng–Tối |
| `preview/` | 26 ảnh chụp màn hình PC 1440×900 và Mobile 390×844 |

Mỗi trang chỉ cần: `<body class="app" data-page="tu-vung" data-depth="1">`.
CSS riêng của từng trang nằm trong `<style>` ngay trong trang đó.
`style.css` trong mỗi thư mục chỉ `@import` file gốc.

| Thư mục | Trang |
|---|---|
| `01-login` | Đăng nhập — 2 cột, hiện/ẩn mật khẩu, đăng nhập bằng liên kết email |
| `02-trang-chu` | 4 chỉ số · "hôm nay" · biểu đồ 14 ngày · tiến độ từng bộ · lối tắt |
| `03-tu-vung` | `index` lưới bộ từ → `chi-tiet` thẻ có collocation / pattern / ví dụ |
| `04-on-tap` | `index` chọn bộ → `flashcard` phiên SRS, 4 mức đánh giá, phím tắt |
| `05-bai-tap` | `index` 2 tab → `trac-nghiem` / `sap-xep` |
| `06-doc` | `index` thư viện → `bai-doc` trình đọc + cột tra từ, chỉnh cỡ chữ |
| `07-viet` | `index` danh sách → `soan-thao` editor gạch chân chính tả |
| `08-chep-cau` | `index` thư mục → `thu-muc` luyện dịch Việt→Anh, chấm điểm |
| `09-thong-ke` | Heatmap cả năm · tỷ lệ nhớ · thẻ đến hạn · dung lượng database |
| `10-cai-dat` | Tài khoản · Sáng/Tối · trợ lý viết · tùy chọn ôn tập · dữ liệu |
| `11-ngu-phap` | `index` thư viện 16 chủ điểm A1–C1 → `chi-tiet` bài học → `luyen-tap` phiên 4 dạng bài → `so-loi` sổ lỗi cá nhân. Nghiên cứu và đặc tả đầy đủ trong `11-ngu-phap/THIET-KE.md` |

## 6. Đã kiểm tra

Chạy bằng Playwright trên **18 trang × 5 viewport** (1440 / 1280 / 768 / 390 / 360):

- Không trang nào tràn ngang, không lỗi JavaScript, 100% icon render đúng
- Không còn tiêu đề/mô tả dính cùng một dòng
- HTML cân bằng thẻ, không có `<button>` lồng trong `<a>`
- Mọi liên kết nội bộ trỏ đúng file
- Tương phản màu đạt WCAG AA ở cả chế độ Sáng và Tối

Thanh cuộn ngang duy nhất là của heatmap cả năm trong trang Thống kê — có chủ đích, giống GitHub.

## 7. Tương tác demo (JS thuần, không framework)

Lật thẻ + phím `Space` · chọn đáp án trắc nghiệm có phản hồi đúng/sai + phím `1`–`4` ·
xếp từ thành câu (bấm để thêm/bỏ) · chỉnh cỡ chữ bài đọc · đếm từ và gạch chân chính tả khi soạn thảo ·
đổi tab · mở form tạo bộ · đổi Sáng/Tối (ghi nhớ trên mọi trang) · drawer mobile.
