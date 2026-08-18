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
// Chữ bôi đen ghi RIÊNG theo từng tab. Dùng chung một ô như trước thì bất kỳ tab
// nào chạy nền có vùng chọn (quảng cáo, trang tự bôi chữ, khung nhúng) cũng đè
// mất chữ của tab người dùng đang xem — bấm phím tắt ra ô nhập trống.
const selKey = (tabId) => `sel:${tabId}`
// Chữ ghi lâu hơn mức này coi như đã cũ, không dùng nữa (tránh dịch lại chữ
// người dùng bôi từ nửa tiếng trước).
const SELECTION_TTL = 10 * 60 * 1000
let openCount = 0
// Một lần bấm Alt+X có thể tới bằng hai đường: phím tắt của trình duyệt và tin
// nhắn của content.js. Trong khoảng này coi như cùng MỘT lần bấm.
const TRIGGER_GAP = 600
// Đường tới sau đôi khi mới là đường lấy được chữ (service worker vừa ngủ dậy,
// content.js gửi chậm hơn phím tắt vài chục mili giây). Mở cửa sổ trống xong thì
// ngó lại một lượt nữa rồi nạp chữ vào.
const LATE_LOOK = 260
const LATE_WINDOW = 3000
const MAX_WIDTH = 1000
const MAX_HEIGHT = 720
// Địa chỉ của chính tiện ích — để biết tab đang xem có phải cửa sổ Dịch nhanh không.
const OWN_PREFIX = chrome.runtime.getURL('')

async function readAppUrl() {
  const stored = await chrome.storage.sync.get('appUrl')
  return String(stored.appUrl || DEFAULT_APP_URL).trim()
}

// Mọi lần mở đều xếp hàng ở đây. Hai đường cùng tới mà chạy song song thì cả hai
// đều thấy "chưa có cửa sổ nào" và đẻ ra hai cửa sổ.
let queue = Promise.resolve()
function enqueue(job) {
  queue = queue
    .then(job)
    .catch((err) => log('lỗi khi mở:', String(err && err.message ? err.message : err)))
  return queue
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
  const tabId = sender.tab?.id
  if (!text || tabId == null) return
  void chrome.storage.session.set({
    [selKey(tabId)]: { text: text.slice(0, MAX_SELECTION), at: Date.now() },
  })
})

// Người dùng bấm Alt+X ngay trong trang. Chữ đi kèm được lấy đúng lúc bấm nên
// tươi nhất; rỗng thì để readSelection dò tiếp như đường phím tắt.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== 'engmaster-open') return
  const text = String(msg.text || '')
    .trim()
    .slice(0, MAX_SELECTION)
  log('Alt+X bấm trong trang:', text ? JSON.stringify(text.slice(0, 60)) : 'không bôi đen gì')
  enqueue(() => openQuickTranslate(sender.tab, text))
})

chrome.tabs.onRemoved.addListener((tabId) => void chrome.storage.session.remove(selKey(tabId)))

// Chữ do content.js ghi sẵn — dùng khi cách chèn script lúc bấm phím tắt không
// lấy được gì.
async function storedSelection(tabId) {
  if (tabId == null) return ''
  const key = selKey(tabId)
  const stored = await chrome.storage.session.get(key)
  const rec = stored[key]
  if (!rec || !rec.text) return ''
  if (Date.now() - (rec.at || 0) > SELECTION_TTL) return ''
  return String(rec.text)
}

// Trình duyệt đưa sẵn tab đang xem lúc bấm phím tắt. Không có thì tự dò — nhưng
// phải tránh trúng chính cửa sổ Dịch nhanh vừa được focus.
async function resolveTabId(hintedTab) {
  if (hintedTab?.id != null) return hintedTab.id
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (tab?.id != null && !String(tab.url || '').startsWith(OWN_PREFIX)) return tab.id
  const [other] = await chrome.tabs.query({ active: true, windowType: 'normal' })
  return other?.id ?? null
}

// Bấm phím tắt ngay khi đang đứng trong cửa sổ Dịch nhanh: giữ nguyên nội dung
// đang tra, đừng đọc vùng chọn của chính ô nhập rồi nạp đè lên.
async function isOwnTab(tabId) {
  if (tabId == null) return false
  try {
    const tab = await chrome.tabs.get(tabId)
    if (String(tab.url || '').startsWith(OWN_PREFIX)) return true
    // Địa chỉ của trang thuộc tiện ích không phải lúc nào cũng đọc được, nên đối
    // chiếu thêm với cửa sổ Dịch nhanh đang được ghi nhớ.
    const stored = await chrome.storage.session.get(WINDOW_KEY)
    return typeof stored[WINDOW_KEY] === 'number' && stored[WINDOW_KEY] === tab.windowId
  } catch {
    return false
  }
}

// activeTab được cấp ngay khi người dùng gọi tiện ích, nên chỉ đọc được vùng
// chọn của đúng tab đang xem — không đụng tới các tab khác.
// Những chỗ có chèn được script cũng vô ích. Trình xem PDF vẽ trang bằng plugin
// PDFium chứ không phải HTML: chữ đang bôi xanh trong đó KHÔNG nằm trong DOM,
// window.getSelection() trả về rỗng dù nhìn bằng mắt thấy rõ. Trang file://,
// edge://, chrome:// thì bị trình duyệt khoá hẳn.
function unreadableUrl(url) {
  if (!url) return false
  if (/\.pdf(?:[?#]|$)/i.test(url)) return true
  return !/^https?:/i.test(url)
}

// Trả về { text, reason }. `reason` chỉ dùng khi không lấy được chữ, để cửa sổ
// nói thẳng cho người dùng biết vì sao ô nhập trống thay vì để họ tưởng hỏng.
async function readSelection(tabId) {
  if (tabId == null) return { text: '', reason: 'notab' }
  let blocked = 0
  let pageUrl = ''
  try {
    pageUrl = String((await chrome.tabs.get(tabId)).url || '')
  } catch {
    // Không đọc được địa chỉ thì cứ thử như thường.
  }

  // Khung chính trước: chữ bôi đen gần như luôn nằm ở đó, mà activeTab chỉ chắc
  // chắn mở đường vào khung chính. Chèn thẳng cả trang (allFrames) sẽ ném lỗi ở
  // những trang có iframe khác origin — quảng cáo, video nhúng, khung đăng nhập —
  // và làm mất luôn chữ đọc được ở khung chính.
  try {
    const text = await selectionInTab(tabId, false)
    if (text) {
      log('khung chính đọc được:', JSON.stringify(text.slice(0, 60)))
      return { text, reason: '' }
    }
    log('khung chính không có chữ nào đang bôi đen')
  } catch (err) {
    // Trang hệ thống (edge://, chrome://, cửa hàng tiện ích, trình xem PDF)
    // không cho chèn script — thử tiếp bên dưới rồi mở ô nhập trống để gõ tay.
    blocked += 1
    log('không chèn được script vào khung chính:', String(err && err.message ? err.message : err))
  }

  // Chữ nằm trong iframe (tài liệu nhúng, khung soạn thảo) thì mới cần lượt này.
  try {
    const text = await selectionInTab(tabId, true)
    if (text) {
      log('iframe đọc được: ' + JSON.stringify(text.slice(0, 60)))
      return { text, reason: '' }
    }
  } catch (err) {
    blocked += 1
    log('không chèn được script vào iframe:', String(err && err.message ? err.message : err))
  }

  // Chốt chặn: lấy chữ content.js đã ghi sẵn lúc người dùng bôi đen.
  const saved = await storedSelection(tabId)
  log(
    saved
      ? 'dùng chữ content.js ghi sẵn: ' + JSON.stringify(saved.slice(0, 60))
      : 'không có chữ nào được ghi sẵn',
  )
  if (saved) return { text: saved.slice(0, MAX_SELECTION), reason: '' }
  if (blocked >= 2 || unreadableUrl(pageUrl)) {
    return { text: '', reason: /\.pdf(?:[?#]|$)/i.test(pageUrl) ? 'pdf' : 'blocked' }
  }
  return { text: '', reason: 'none' }
}

// Trang EngMaster chạy trong iframe của window.html thay vì mở thẳng, để phần
// khung (thuộc về tiện ích) tự đóng cửa sổ được khi người dùng bấm Esc.
async function buildFramePage(selection, note = '') {
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
    openCount +
    (!selection && note ? '&note=' + note : '')
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

async function showWindow(selection, note = '') {
  const page = await buildFramePage(selection, note)
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
      // Trang bị khoá (PDF, edge://, file://): cửa sổ đang mở tự đi lấy chữ trong
      // clipboard. Nhắn cho nó thay vì nạp lại — nạp lại là mất chữ đang gõ dở,
      // mà clipboard rỗng thì cũng chẳng có gì để nạp.
      else if (note === 'pdf' || note === 'blocked') {
        chrome.runtime.sendMessage({ type: 'engmaster-note', note }).catch(() => {})
      }
      await chrome.windows.update(existing, { focused: true, drawAttention: true })
      return
    } catch {
      // Người dùng đã đóng cửa sổ cũ — tạo cửa sổ mới bên dưới.
    }
  }

  const created = await chrome.windows.create({ url: page, type: 'popup', ...(await placement()) })
  if (created?.id != null) await chrome.storage.session.set({ [WINDOW_KEY]: created.id })
}

let lastOpenAt = 0
let lastOpenText = ''

async function openQuickTranslate(hintedTab, presetText = '') {
  const tabId = await resolveTabId(hintedTab)
  // Đọc vùng chọn trước mọi việc khác: quyền activeTab gắn với đúng tab đang
  // xem ở thời điểm bấm phím tắt.
  let selection = presetText
  let note = ''
  if (!selection && !(await isOwnTab(tabId))) {
    const read = await readSelection(tabId)
    selection = read.text
    note = read.reason
  }

  // Cùng một lần bấm tới bằng đường thứ hai. Đường sau KHÔNG bị bỏ qua vô điều
  // kiện như trước nữa: nếu nó lấy được chữ mà đường trước không (rất hay xảy ra
  // — phím tắt cấp trình duyệt chạy trước, đọc hụt, rồi content.js mới gửi chữ
  // về) thì nạp chữ đó vào cửa sổ vừa mở, thay vì để người dùng nhìn ô trống.
  if (Date.now() - lastOpenAt < TRIGGER_GAP) {
    if (!selection || selection === lastOpenText) {
      log('bỏ qua: cùng một lần bấm, không có chữ nào mới hơn')
      return
    }
    log('đường tới sau lấy được chữ mà đường trước không — nạp vào cửa sổ')
  }

  log(
    selection
      ? 'sẽ dịch: ' + JSON.stringify(selection.slice(0, 80))
      : 'chưa lấy được chữ bôi đen -> mở ô nhập trống',
  )
  lastOpenAt = Date.now()
  lastOpenText = selection
  await showWindow(selection, note)
  if (!selection && tabId != null) scheduleLateLook(tabId)
}

// Mở trống xong thì ngó lại một lượt: content.js có thể vừa kịp gửi chữ về ngay
// sau đó (service worker mới tỉnh, hoặc trang trả lời chậm). Có chữ thì nạp vào
// chính cửa sổ vừa mở.
function scheduleLateLook(tabId) {
  setTimeout(() => {
    enqueue(async () => {
      if (lastOpenText || Date.now() - lastOpenAt > LATE_WINDOW) return
      let text = await storedSelection(tabId)
      if (!text) {
        try {
          text = await selectionInTab(tabId, false)
        } catch {
          text = ''
        }
      }
      if (!text) {
        log('ngó lại lần nữa: vẫn không có chữ nào')
        return
      }
      log('ngó lại lần nữa thấy chữ: ' + JSON.stringify(text.slice(0, 60)))
      lastOpenText = text
      await showWindow(text)
    })
  }, LATE_LOOK)
}

// Trình duyệt đưa sẵn tab đang xem lúc bấm phím — dùng luôn, khỏi phải dò lại
// bằng tabs.query (dò lại dễ trúng nhầm cửa sổ Dịch nhanh vừa được focus).
chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== 'open-quick-translate') return
  enqueue(() => openQuickTranslate(tab))
})

chrome.action.onClicked.addListener((tab) => enqueue(() => openQuickTranslate(tab)))

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
