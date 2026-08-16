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

// activeTab được cấp ngay khi người dùng gọi tiện ích, nên chỉ đọc được vùng
// chọn của đúng tab đang xem — không đụng tới các tab khác.
async function readSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!tab || tab.id == null) return ''
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => String(window.getSelection() || ''),
    })
    for (const item of results) {
      const text = String(item?.result || '').trim()
      if (text) return text.slice(0, MAX_SELECTION)
    }
  } catch {
    // Trang hệ thống (edge://, chrome://, cửa hàng tiện ích, trình xem PDF)
    // không cho chèn script — cứ mở ô nhập trống để gõ tay.
  }
  return ''
}

// Trang EngMaster chạy trong iframe của window.html thay vì mở thẳng, để phần
// khung (thuộc về tiện ích) tự đóng cửa sổ được khi người dùng bấm Esc.
async function buildFramePage() {
  let url
  try {
    url = new URL(await readAppUrl())
  } catch {
    return null
  }
  url.searchParams.set('view', 'quick-translate')
  const selection = await readSelection()
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

async function openQuickTranslate() {
  const page = await buildFramePage()
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
      if (tabId != null) await chrome.tabs.update(tabId, { url: page })
      await chrome.windows.update(existing, { focused: true, drawAttention: true })
      return
    } catch {
      // Người dùng đã đóng cửa sổ cũ — tạo cửa sổ mới bên dưới.
    }
  }

  const created = await chrome.windows.create({ url: page, type: 'popup', ...(await placement()) })
  if (created?.id != null) await chrome.storage.session.set({ [WINDOW_KEY]: created.id })
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-quick-translate') void openQuickTranslate()
})

chrome.action.onClicked.addListener(() => void openQuickTranslate())

chrome.windows.onRemoved.addListener(async (windowId) => {
  const stored = await chrome.storage.session.get(WINDOW_KEY)
  if (stored[WINDOW_KEY] === windowId) await chrome.storage.session.remove(WINDOW_KEY)
})
