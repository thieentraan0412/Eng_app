// Khung của cửa sổ Dịch nhanh: nhúng trang EngMaster, đóng cửa sổ khi trang bên
// trong báo ra (bấm Esc hoặc nút X), và lấy chữ từ clipboard cho những trang
// trình duyệt không cho đọc vùng chọn.

const params = new URLSearchParams(location.search)
const src = params.get('src')
const MAX_SELECTION = 1000
let allowedOrigin = ''
let target = null

// Trang bị khoá (PDF, edge://, file://) là chỗ duy nhất dùng tới clipboard —
// chỗ khác đọc thẳng vùng chọn được rồi, đụng vào clipboard chỉ tổ đổ nhầm thứ
// người dùng chép từ lúc nào không biết vào ô nhập.
async function clipboardText() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      window.focus()
      const text = String(await navigator.clipboard.readText()).trim()
      return text.slice(0, MAX_SELECTION)
    } catch {
      // Cửa sổ chưa kịp được focus — đợi một nhịp rồi thử lại đúng một lần.
      await new Promise((done) => setTimeout(done, 120))
    }
  }
  return ''
}

// Đổi chữ đang tra bằng cách nạp lại iframe: trang EngMaster đọc chữ mồi từ
// tham số ?q= lúc mở, không có đường nào khác đưa chữ vào từ ngoài.
function seed(text) {
  if (!target || !text || target.searchParams.get('q') === text) return false
  target.searchParams.set('q', text)
  // Đổi cả số thứ tự, không thì địa chỉ trùng y hệt là trình duyệt bỏ qua.
  target.searchParams.set('n', String(Date.now()))
  document.getElementById('frame').src = target.toString()
  return true
}

async function seedFromClipboard() {
  const text = await clipboardText()
  if (text) seed(text)
}

async function start() {
  if (!src) return
  try {
    target = new URL(src)
  } catch {
    return
  }
  allowedOrigin = target.origin
  document.getElementById('frame').src = target.toString()

  const note = String(params.get('note') || '')
  if ((note === 'pdf' || note === 'blocked') && !target.searchParams.get('q')) {
    await seedFromClipboard()
  }
}

void start()

// Cửa sổ đang mở sẵn mà người dùng bấm Alt+X ở một trang bị khoá: service worker
// không nạp lại trang (sẽ mất chữ đang gõ dở) mà nhắn sang đây.
chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== 'engmaster-note') return
  const note = String(msg.note || '')
  if (note === 'pdf' || note === 'blocked') void seedFromClipboard()
})

window.addEventListener('message', async (event) => {
  if (event.origin !== allowedOrigin) return
  if (!event.data || event.data.type !== 'engmaster-quick-translate-close') return
  const win = await chrome.windows.getCurrent()
  if (win?.id != null) await chrome.windows.remove(win.id)
})
