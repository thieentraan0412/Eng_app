// Nhận phím tắt rồi mở cửa sổ Dịch nhanh riêng — cửa sổ thật của trình duyệt
// nên kéo đi và co giãn thoải mái, không tự tắt khi bấm ra chỗ khác như popup
// dính thanh công cụ.

// Nhật ký chẩn đoán: mở edge://extensions -> Xem chi tiết -> bấm "Service worker"
// để xem tiện ích đọc được gì mỗi lần bấm phím tắt.
const log = (...a) => console.log('[EngMaster]', ...a)

const MAX_SELECTION = 1000
// Địa chỉ mặc định; đổi được trong trang cài đặt của tiện ích.
const DEFAULT_APP_URL = 'https://eng-app-sigma.vercel.app'
const WINDOW_KEY = 'windowId'
const SELECTION_KEY = 'lastSelection'
// Chữ ghi lâu hơn mức này coi như đã cũ, không dùng nữa (tránh dịch lại chữ
// người dùng bôi từ nửa tiếng trước).
const SELECTION_TTL = 10 * 60 * 1000
let openCount = 0
// Một lần bấm Alt+X có thể tới bằng hai đường: phím tắt của trình duyệt và tin
// nhắn của content.js. Ai tới trước thì làm, người tới sau trong khoảng này bỏ
// qua để khỏi mở/nạp lại cửa sổ hai lần.
const TRIGGER_GAP = 600
let lastTrigger = 0
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

// content.js gửi về mỗi lần vùng chọn đổi. Ghi theo tab để lát nữa bấm phím
// tắt còn biết chữ đó thuộc trang nào.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== 'engmaster-selection') return
  const text = String(msg.text || '').trim()
  if (!text) return
  void chrome.storage.session.set({
    [SELECTION_KEY]: { text: text.slice(0, MAX_SELECTION), tabId: sender.tab?.id ?? null, at: Date.now() },
  })
})

// Người dùng bấm Alt+X ngay trong trang. Chữ đi kèm được lấy đúng lúc bấm nên
// tươi nhất; rỗng thì để readSelection dò tiếp như đường phím tắt.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== 'engmaster-open') return
  if (!claimTrigger()) {
    log('bỏ qua Alt+X từ trang: phím tắt của trình duyệt vừa xử lý xong')
    return
  }
  const text = String(msg.text || '')
    .trim()
    .slice(0, MAX_SELECTION)
  log('Alt+X bấm trong trang:', text ? JSON.stringify(text.slice(0, 60)) : 'không bôi đen gì')
  void openQuickTranslate(sender.tab, text)
})

function claimTrigger() {
  const now = Date.now()
  if (now - lastTrigger < TRIGGER_GAP) return false
  lastTrigger = now
  return true
}

// Chữ do content.js ghi sẵn — dùng khi cách chèn script lúc bấm phím tắt không
// lấy được gì. Ưu tiên đúng tab đang xem; tab khác thì bỏ qua cho khỏi nhầm.
async function storedSelection(tabId) {
  const stored = await chrome.storage.session.get(SELECTION_KEY)
  const rec = stored[SELECTION_KEY]
  if (!rec || !rec.text) return ''
  if (Date.now() - (rec.at || 0) > SELECTION_TTL) return ''
  if (tabId != null && rec.tabId != null && rec.tabId !== tabId) return ''
  return String(rec.text)
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
    if (text) {
      log('khung chính đọc được:', JSON.stringify(text.slice(0, 60)))
      return text
    }
    log('khung chính không có chữ nào đang bôi đen')
  } catch (err) {
    // Trang hệ thống (edge://, chrome://, cửa hàng tiện ích, trình xem PDF)
    // không cho chèn script — thử tiếp bên dưới rồi mở ô nhập trống để gõ tay.
    log('không chèn được script vào khung chính:', String(err && err.message ? err.message : err))
  }

  // Chữ nằm trong iframe (tài liệu nhúng, khung soạn thảo) thì mới cần lượt này.
  try {
    const text = await selectionInTab(tabId, true)
    if (text) {
      log('iframe đọc được: ' + JSON.stringify(text.slice(0, 60)))
      return text
    }
  } catch (err) {
    log('không chèn được script vào iframe:', String(err && err.message ? err.message : err))
  }

  // Chốt chặn: lấy chữ content.js đã ghi sẵn lúc người dùng bôi đen.
  const saved = await storedSelection(tabId)
  log(saved ? 'dùng chữ content.js ghi sẵn: ' + JSON.stringify(saved.slice(0, 60)) : 'không có chữ nào được ghi sẵn')
  return saved.slice(0, MAX_SELECTION)
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
  // Số thứ tự để địa chỉ mỗi lần một khác: bôi lại ĐÚNG chữ cũ mà địa chỉ y
  // hệt thì trình duyệt không nạp lại, cửa sổ đứng im như chưa bấm gì.
  openCount += 1
  return (
    chrome.runtime.getURL('window.html') +
    '?src=' +
    encodeURIComponent(url.toString()) +
    '&n=' +
    openCount
  )
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

async function openQuickTranslate(hintedTab, presetText = '') {
  // Đọc vùng chọn trước mọi việc khác: quyền activeTab gắn với đúng tab đang
  // xem ở thời điểm bấm phím tắt.
  const selection = presetText || (await readSelection(hintedTab))
  log(selection ? 'sẽ dịch: ' + JSON.stringify(selection.slice(0, 80)) : 'KHÔNG lấy được chữ bôi đen -> mở ô nhập trống')
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
  if (command !== 'open-quick-translate') return
  if (!claimTrigger()) {
    log('bỏ qua phím tắt: trang vừa gửi lệnh mở cho cùng một lần bấm')
    return
  }
  void openQuickTranslate(tab)
})

chrome.action.onClicked.addListener((tab) => void openQuickTranslate(tab))

// Trình duyệt chỉ chèn content.js cho những trang tải SAU khi tiện ích được
// cài/nạp lại. Chèn tay một lượt cho các tab đang mở, không thì người dùng phải
// F5 từng tab mới bấm được Alt+X.
async function injectOpenTabs() {
  let tabs = []
  try {
    tabs = await chrome.tabs.query({})
  } catch {
    return
  }
  for (const tab of tabs) {
    if (tab.id == null || !/^https?:/i.test(tab.url || '')) continue
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['content.js'],
      })
    } catch {
      // Trang chặn chèn script (cửa hàng tiện ích, trình xem PDF) — bỏ qua.
    }
  }
}

// Chèn một lượt cho mỗi lần tiện ích được bật lên. Không treo vào onInstalled
// không thôi: BẬT LẠI một tiện ích đang tắt không kích hoạt sự kiện nào cả, mà
// đó đúng là lúc mọi tab đang mở đều chưa có content.js. Service worker thì
// luôn khởi động lại ở thời điểm đó, nên chạy thẳng ở đây là chắc ăn nhất.
// Cờ trong storage.session giữ cho những lần service worker ngủ dậy sau đó khỏi
// chèn lại — cờ này tự mất khi tiện ích bị tắt/nạp lại hoặc đóng trình duyệt.
const INJECTED_KEY = 'tabsInjected'

async function injectOpenTabsOnce() {
  try {
    const stored = await chrome.storage.session.get(INJECTED_KEY)
    if (stored[INJECTED_KEY]) return
    await chrome.storage.session.set({ [INJECTED_KEY]: true })
  } catch {
    // Không đọc được cờ thì cứ chèn, content.js có sẵn cờ chặn chạy hai lần.
  }
  await injectOpenTabs()
}

void injectOpenTabsOnce()
chrome.runtime.onStartup.addListener(() => void injectOpenTabsOnce())

chrome.windows.onRemoved.addListener(async (windowId) => {
  const stored = await chrome.storage.session.get(WINDOW_KEY)
  if (stored[WINDOW_KEY] === windowId) await chrome.storage.session.remove(WINDOW_KEY)
})
