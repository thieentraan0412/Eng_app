// Khung của cửa sổ Dịch nhanh: nhúng trang EngMaster, đóng cửa sổ khi trang bên
// trong báo ra (bấm Esc hoặc nút X), và lo nốt những chỗ trang EngMaster không
// với tới được — nói vì sao ô nhập trống, lấy chữ từ clipboard cho file PDF.

const params = new URLSearchParams(location.search)
const src = params.get('src')
const MAX_SELECTION = 1000
let allowedOrigin = ''
let target = null

// Ô nhập trống thì nói luôn vì sao, thay vì để người dùng tưởng tiện ích hỏng.
const NOTES = {
  pdf: [
    'Trình xem PDF không cho tiện ích đọc chữ bôi đen.',
    'PDF được vẽ bằng plugin chứ không phải HTML, nên chữ bôi đen nằm ngoài tầm với của mọi tiện ích. Cách nhanh: bôi đen rồi bấm Ctrl+C, sau đó Alt+X — cửa sổ này sẽ tự lấy chữ trong clipboard.',
  ],
  blocked: [
    'Trang vừa rồi không cho tiện ích đọc chữ bôi đen.',
    'Trang hệ thống (edge://, chrome://), cửa hàng tiện ích và trang file:// đều bị trình duyệt khoá. Cách nhanh: bôi đen rồi bấm Ctrl+C, sau đó Alt+X — cửa sổ này sẽ tự lấy chữ trong clipboard.',
  ],
  clipboard: [
    'Đã lấy chữ từ clipboard.',
    'Trang vừa rồi bị trình duyệt khoá nên không đọc được vùng chọn — đây là nội dung bạn chép gần nhất. Không đúng thì bấm Ctrl+C ở chỗ cần dịch rồi bấm Alt+X lại.',
  ],
  none: [
    'Không thấy chữ nào đang bôi đen ở trang vừa rồi.',
    'Bôi đen lại rồi bấm Alt+X một lần nữa, hoặc gõ thẳng vào ô bên dưới.',
  ],
  notab: [
    'Không xác định được tab đang xem.',
    'Bấm vào trang cần dịch cho nó được chọn, bôi đen rồi bấm Alt+X lại.',
  ],
}

function showNote(key) {
  const box = document.getElementById('note')
  box.replaceChildren()
  box.classList.remove('is-on')
  if (!Object.prototype.hasOwnProperty.call(NOTES, key)) return
  const note = NOTES[key]
  const body = document.createElement('span')
  const title = document.createElement('b')
  title.textContent = note[0]
  body.append(title, document.createElement('br'), note[1])
  const dismiss = document.createElement('button')
  dismiss.type = 'button'
  dismiss.textContent = 'Ẩn'
  dismiss.addEventListener('click', () => box.classList.remove('is-on'))
  box.append(body, dismiss)
  box.classList.add('is-on')
}

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

async function seedFromClipboard(note) {
  const text = await clipboardText()
  if (text && seed(text)) {
    showNote('clipboard')
    return
  }
  showNote(note)
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
    await seedFromClipboard(note)
    return
  }
  showNote(note)
}

void start()

// Cửa sổ đang mở sẵn mà người dùng bấm Alt+X ở một trang bị khoá: service worker
// không nạp lại trang (sẽ mất chữ đang gõ dở) mà nhắn sang đây.
chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== 'engmaster-note') return
  const note = String(msg.note || '')
  if (note === 'pdf' || note === 'blocked') void seedFromClipboard(note)
  else showNote(note)
})

window.addEventListener('message', async (event) => {
  if (event.origin !== allowedOrigin) return
  if (!event.data || event.data.type !== 'engmaster-quick-translate-close') return
  const win = await chrome.windows.getCurrent()
  if (win?.id != null) await chrome.windows.remove(win.id)
})
