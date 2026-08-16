// Nhận phím tắt rồi mở cửa sổ Dịch nhanh riêng — cửa sổ thật của trình duyệt
// nên kéo đi và co giãn thoải mái, không tự tắt khi bấm ra chỗ khác như popup
// dính thanh công cụ.

const MAX_SELECTION = 1000
// Địa chỉ mặc định; đổi được trong trang cài đặt của tiện ích.
const DEFAULT_APP_URL = 'https://eng-app-sigma.vercel.app'
const WINDOW_KEY = 'windowId'
const MAX_WIDTH = 1000
const MAX_HEIGHT = 720

async function readAppUrl() {
  const stored = await chrome.storage.sync.get('appUrl')
  return String(stored.appUrl || DEFAULT_APP_URL).trim()
}

// Đoạn này chạy bên trong trang. Chrome không tính chữ bôi đen trong <input>
// và <textarea> vào window.getSelection(), Shadow DOM cũng có vùng chọn riêng —
// nên phải hỏi lần lượt cả ba chỗ, nếu không sẽ trả về rỗng dù đang bôi đen.
function grabSelection() {
  const active = document.activeElement
  const tag = active && active.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    const { selectionStart: from, selectionEnd: to } = active
    if (typeof from === 'number' && typeof to === 'number' && to > from) {
      const picked = String(active.value || '').slice(from, to)
      if (picked.trim()) return picked
    }
  }
  const shadow = active && active.shadowRoot
  if (shadow && typeof shadow.getSelection === 'function') {
    const picked = String(shadow.getSelection() || '')
    if (picked.trim()) return picked
  }
  return String(window.getSelection() || '')
}

async function selectionInTab(tabId, allFrames) {
  const results = await chrome.scripting.executeScript({
    target: allFrames ? { tabId, allFrames: true } : { tabId },
    func: grabSelection,
  })
  for (const item of results) {
    const text = String(item?.result || '').trim()
    if (text) return text.slice(0, MAX_SELECTION)
  }
  return ''
}

// activeTab được cấp ngay khi người dùng gọi tiện ích, nên chỉ đọc được vùng
// chọn của đúng tab đang xem — không đụng tới các tab khác.
async function readSelection(hintedTab) {
  let tabId = hintedTab?.id
  if (tabId == null) {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    tabId = tab?.id
  }
  if (tabId == null) return ''

  // Khung chính trước: chữ bôi đen gần như luôn nằm ở đó, mà activeTab chỉ chắc
  // chắn mở đường vào khung chính. Chèn thẳng cả trang (allFrames) sẽ ném lỗi ở
  // những trang có iframe khác origin — quảng cáo, video nhúng, khung đăng nhập —
  // và làm mất luôn chữ đọc được ở khung chính.
  try {
    const text = await selectionInTab(tabId, false)
    if (text) return text
  } catch {
    // Trang hệ thống (edge://, chrome://, cửa hàng tiện ích, trình xem PDF)
    // không cho chèn script — thử tiếp bên dưới rồi mở ô nhập trống để gõ tay.
  }

  // Chữ nằm trong iframe (tài liệu nhúng, khung soạn thảo) thì mới cần lượt này.
  try {
    return await selectionInTab(tabId, true)
  } catch {
    return ''
  }
}

// Trang EngMaster chạy trong iframe của window.html thay vì mở thẳng, để phần
// khung (thuộc về tiện ích) tự đóng cửa sổ được khi người dùng bấm Esc.
async function buildFramePage(selection) {
  let url
  try {
    url = new URL(await readAppUrl())
  } catch {
    return null
  }
  url.searchParams.set('view', 'quick-translate')
  if (selection) url.searchParams.set('q', selection)
  return chrome.runtime.getURL('window.html') + '?src=' + encodeURIComponent(url.toString())
}

// Mở giữa cửa sổ trình duyệt đang dùng, nhỏ hơn nó một chút cho dễ nhìn.
async function placement() {
  try {
    const base = await chrome.windows.getLastFocused()
    const width = Math.min(MAX_WIDTH, Math.max(560, (base.width ?? MAX_WIDTH) - 80))
    const height = Math.min(MAX_HEIGHT, Math.max(420, (base.height ?? MAX_HEIGHT) - 80))
    return {
      width: Math.round(width),
      height: Math.round(height),
      left: Math.round((base.left ?? 0) + ((base.width ?? width) - width) / 2),
      top: Math.round((base.top ?? 0) + ((base.height ?? height) - height) / 2),
    }
  } catch {
    return { width: MAX_WIDTH, height: MAX_HEIGHT }
  }
}

async function openQuickTranslate(hintedTab) {
  // Đọc vùng chọn trước mọi việc khác: quyền activeTab gắn với đúng tab đang
  // xem ở thời điểm bấm phím tắt.
  const selection = await readSelection(hintedTab)
  const page = await buildFramePage(selection)
  if (!page) {
    await chrome.runtime.openOptionsPage()
    return
  }

  // Đang mở sẵn thì nạp chữ mới vào chính cửa sổ đó thay vì đẻ thêm cửa sổ.
  const stored = await chrome.storage.session.get(WINDOW_KEY)
  const existing = stored[WINDOW_KEY]
  if (typeof existing === 'number') {
    try {
      const win = await chrome.windows.get(existing, { populate: true })
      const tabId = win.tabs?.[0]?.id
      // Lần này không bôi đen gì (bấm phím ngay trong cửa sổ dịch, hoặc đang ở
      // trang hệ thống) thì giữ nguyên nội dung đang tra, chỉ đưa cửa sổ ra
      // trước — nạp lại trang sẽ xoá mất chữ người dùng vừa gõ.
      if (tabId != null && selection) await chrome.tabs.update(tabId, { url: page })
      await chrome.windows.update(existing, { focused: true, drawAttention: true })
      return
    } catch {
      // Người dùng đã đóng cửa sổ cũ — tạo cửa sổ mới bên dưới.
    }
  }

  const created = await chrome.windows.create({ url: page, type: 'popup', ...(await placement()) })
  if (created?.id != null) await chrome.storage.session.set({ [WINDOW_KEY]: created.id })
}

// Trình duyệt đưa sẵn tab đang xem lúc bấm phím — dùng luôn, khỏi phải dò lại
// bằng tabs.query (dò lại dễ trúng nhầm cửa sổ Dịch nhanh vừa được focus).
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'open-quick-translate') void openQuickTranslate(tab)
})

chrome.action.onClicked.addListener((tab) => void openQuickTranslate(tab))

chrome.windows.onRemoved.addListener(async (windowId) => {
  const stored = await chrome.storage.session.get(WINDOW_KEY)
  if (stored[WINDOW_KEY] === windowId) await chrome.storage.session.remove(WINDOW_KEY)
})
