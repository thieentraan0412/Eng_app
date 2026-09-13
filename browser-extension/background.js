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

// ---------- Tự dịch khi bôi đen ----------
// content.js hiện bóng dịch ngay cạnh chữ vừa bôi đen. Gọi dịch vụ dịch thì làm
// ở đây: content script chạy trong trang nên dính CORS của trang, còn service
// worker có host_permissions nên gọi thẳng được. Cùng nguồn dịch với web app
// (Google gtx, dự phòng MyMemory).
const AUTO_KEY = 'autoTranslate'
const TRANSLATE_TIMEOUT = 6000
// Chỉ dùng để đoán chiều dịch khi Google không trả lời — MyMemory không tự nhận
// được ngôn ngữ.
const VI_MARKS = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i
// Một từ hoặc cụm tối đa ba từ, toàn chữ Latin không dấu.
const LATIN_SHORT = /^[A-Za-z]+(?:['-][A-Za-z]+)*(?:\s+[A-Za-z]+(?:['-][A-Za-z]+)*){0,2}$/
const POS_SHORT = {
  noun: 'n',
  verb: 'v',
  adjective: 'adj',
  adverb: 'adv',
  pronoun: 'pron',
  preposition: 'prep',
  conjunction: 'conj',
  interjection: 'interj',
  abbreviation: 'abbr',
  article: 'art',
  'auxiliary verb': 'aux',
}

// Mặc định BẬT: chưa từng gạt công tắc thì storage chưa có gì.
async function readAutoTranslate() {
  const stored = await chrome.storage.sync.get(AUTO_KEY)
  return stored[AUTO_KEY] !== false
}

// Icon hiện chữ OFF khi tự dịch đang tắt — nhìn thanh công cụ là biết, khỏi phải
// bôi thử một chữ.
function showAutoState(on) {
  Promise.all([
    chrome.action.setBadgeBackgroundColor({ color: '#64748b' }),
    chrome.action.setBadgeText({ text: on ? '' : 'OFF' }),
    chrome.action.setTitle({
      title: `Dịch nhanh (Alt+X) · Tự dịch khi bôi đen: ${on ? 'bật' : 'tắt'} (Alt+Shift+X)`,
    }),
  ]).catch(() => {})
}

readAutoTranslate().then(showAutoState, () => {})
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[AUTO_KEY]) showAutoState(changes[AUTO_KEY].newValue !== false)
})

// Một lần bấm mà tới bằng cả hai đường (phím tắt trình duyệt + content.js) thì
// lật hai lần, y như chưa bấm — trong TRIGGER_GAP chỉ tính một lần.
let lastToggleAt = 0
async function toggleAutoTranslate() {
  if (Date.now() - lastToggleAt < TRIGGER_GAP) return
  lastToggleAt = Date.now()
  const on = !(await readAutoTranslate())
  await chrome.storage.sync.set({ [AUTO_KEY]: on })
  log('tự dịch khi bôi đen:', on ? 'bật' : 'tắt')
}

async function fetchJson(url, timeout = TRANSLATE_TIMEOUT) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Coi như không dịch được nếu rỗng hoặc y hệt chữ gốc (tên riêng, viết tắt…).
function acceptText(out, src) {
  if (typeof out !== 'string') return null
  const text = out.trim()
  if (!text || text.toLowerCase() === src.trim().toLowerCase()) return null
  return text
}

// data[0] = các đoạn [đoạn dịch, đoạn gốc, …] -> nối lại thành câu.
function joinSegments(data) {
  const segs = data?.[0]
  if (!Array.isArray(segs)) return null
  return segs.map((s) => (Array.isArray(s) && typeof s[0] === 'string' ? s[0] : '')).join('')
}

// Cách đọc chữ gốc (dt=rm): phần tử cuối của data[0] có dạng
// [null, null, cách đọc bản dịch, cách đọc chữ gốc] — "ˈrəniNG" cho "running",
// "Kon'nichiwa" cho "こんにちは". Có ngay trong lượt dịch, khỏi chờ nguồn IPA.
function sourceReading(data) {
  for (const seg of Array.isArray(data?.[0]) ? data[0] : []) {
    if (Array.isArray(seg) && seg[0] == null && typeof seg[3] === 'string' && seg[3].trim()) {
      return seg[3].trim()
    }
  }
  return ''
}

// data[1] = khối từ điển (chỉ có khi bôi một từ): [[từ loại, [nghĩa…]], …]
function parseSenses(data) {
  if (!Array.isArray(data?.[1])) return []
  const out = []
  for (const block of data[1]) {
    const pos = typeof block?.[0] === 'string' ? block[0] : ''
    const terms = (Array.isArray(block?.[1]) ? block[1] : [])
      .filter((t) => typeof t === 'string' && t.trim())
      .map((t) => t.trim().normalize('NFC'))
      .slice(0, 5)
    if (terms.length) out.push({ pos: POS_SHORT[pos] || pos, terms })
  }
  return out.slice(0, 5)
}

// Bóng dịch ghi phím tắt đang thật sự được gán — người dùng có thể đã đổi.
// Trình duyệt để trống thì content.js vẫn bắt Alt+Shift+X trong trang.
async function currentKeys() {
  try {
    const all = await chrome.commands.getAll()
    const find = (name) => all.find((c) => c.name === name)?.shortcut || ''
    return { open: find('open-quick-translate') || 'Alt+X', toggle: find('toggle-auto-translate') || 'Alt+Shift+X' }
  } catch {
    return { open: 'Alt+X', toggle: 'Alt+Shift+X' }
  }
}

// Bôi đi bôi lại cùng một chữ là chuyện thường, mà Google gtx chặn (429) khá
// nhanh khi bị gọi dồn — nhớ tạm kết quả trong service worker. Mất khi service
// worker ngủ, không sao.
const CACHE_LIMIT = 100
const translateCache = new Map()

// Trả về { status: 'ok', text, from, to, senses } | { status: 'no-meaning' }
// | { status: 'unreachable' }, kèm keys.
async function translateSelection(raw) {
  const text = String(raw || '').trim().slice(0, MAX_SELECTION)
  const keys = await currentKeys()
  if (!text) return { status: 'no-meaning', keys }
  const cached = translateCache.get(text)
  if (cached) return { ...cached, keys }
  const result = await translateFresh(text)
  // Lỗi mạng / bị chặn thì không nhớ, lần bôi sau còn thử lại.
  if (result.status !== 'unreachable') {
    translateCache.delete(text)
    translateCache.set(text, result)
    if (translateCache.size > CACHE_LIMIT) translateCache.delete(translateCache.keys().next().value)
  }
  return { ...result, keys }
}

// Đường dịch của tiện ích Google Dịch chính chủ, trả về [[bản dịch, ngôn ngữ gốc]].
// Không có từ loại, nhưng gtx bị chặn tạm (429) thì đường này thường vẫn chạy.
async function chromeExTranslate(text, tl, sl = 'auto') {
  const data = await fetchJson(
    'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=' +
      sl +
      '&tl=' +
      tl +
      '&q=' +
      encodeURIComponent(text),
  )
  const first = Array.isArray(data) ? data[0] : null
  if (Array.isArray(first) && typeof first[0] === 'string') {
    return { text: first[0], from: typeof first[1] === 'string' ? first[1] : '' }
  }
  if (typeof first === 'string') return { text: first, from: '' }
  return null
}

async function translateFresh(text) {
  // hl=en: tên từ loại trả về bằng tiếng Anh (noun, verb…). Bỏ đi thì Google theo
  // ngôn ngữ trình duyệt — Edge tiếng Việt nhận "danh từ", không khớp POS_SHORT.
  const gtx = (sl, tl) =>
    fetchJson(
      'https://translate.googleapis.com/translate_a/single?client=gtx&hl=en&dt=t&dt=bd&dt=rm&sl=' +
        sl +
        '&tl=' +
        tl +
        '&q=' +
        encodeURIComponent(text),
    )

  // Để Google tự nhận ngôn ngữ; nhận ra tiếng Việt thì dịch ngược sang tiếng Anh.
  let data = await gtx('auto', 'vi')
  let detected = typeof data?.[2] === 'string' ? data[2] : ''
  // Từ/cụm ngắn toàn chữ Latin không dấu thì Google hay đoán nhầm sang tiếng khác
  // ("modal" ra tiếng Indonesia, dịch thành "thủ đô"). Tiện ích học tiếng Anh: gặp
  // thế thì dịch lại như tiếng Anh, ra nghĩa thì lấy.
  const bare = text.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
  if (data && detected && detected !== 'en' && detected !== 'vi' && LATIN_SHORT.test(bare)) {
    const english = await gtx('en', 'vi')
    if (english && acceptText(joinSegments(english), text)) {
      data = english
      detected = 'en'
    }
  }
  let from = detected || (VI_MARKS.test(text) ? 'vi' : '')
  let to = from === 'vi' ? 'en' : 'vi'
  if (data && to === 'en') data = await gtx('vi', 'en')
  const viaGoogle = data ? acceptText(joinSegments(data), text) : null
  if (viaGoogle) {
    return { status: 'ok', text: viaGoogle, from, to, senses: parseSenses(data), phonetic: sourceReading(data) }
  }

  // Dự phòng 1: đường của tiện ích Google Dịch.
  let alt = await chromeExTranslate(text, to)
  if (alt && alt.from === 'vi' && to === 'vi') {
    to = 'en'
    alt = await chromeExTranslate(text, 'en')
  }
  // Cùng lỗi đoán nhầm ngôn ngữ như gtx ở trên.
  if (alt && alt.from && alt.from !== 'en' && alt.from !== 'vi' && LATIN_SHORT.test(bare)) {
    const english = await chromeExTranslate(text, 'vi', 'en')
    if (english && acceptText(english.text, text)) alt = { text: english.text, from: 'en' }
  }
  if (alt && alt.from) from = alt.from
  const viaAlt = alt ? acceptText(alt.text, text) : null
  if (viaAlt) return { status: 'ok', text: viaAlt, from, to, senses: [] }

  // Dự phòng MyMemory. Google không nhận ra được ngôn ngữ thì nhờ MyMemory tự
  // nhận ("autodetect") — đoán bừa "en" thì tiếng Nhật, tiếng Trung… ra y nguyên.
  const memory = await fetchJson(
    'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(text) +
      '&langpair=' +
      (from || 'autodetect') +
      '|' +
      to,
  )
  const viaMemory =
    memory && Number(memory.responseStatus) === 200
      ? acceptText(memory.responseData?.translatedText, text)
      : null
  if (viaMemory) {
    const memoryFrom = from || String(memory.responseData?.detectedLanguage || '').split('-')[0]
    return { status: 'ok', text: viaMemory, from: memoryFrom, to, senses: [] }
  }
  // Chỉ kết luận "không có nghĩa" khi Google trả lời tử tế. MyMemory hay đưa lại
  // y nguyên chữ gốc cả với câu dịch được — Google đang chặn (429) mà tin nó thì
  // bóng dịch lặng lẽ tắt, người dùng tưởng tiện ích hỏng.
  return { status: data || alt ? 'no-meaning' : 'unreachable' }
}

// Phiên âm IPA cho một từ tiếng Anh — cùng nguồn web app dùng (dictionaryapi.dev).
// Hỏi riêng, sau khi đã có bản dịch: nguồn này hay chậm, có lúc treo hẳn — bắt
// bản dịch đợi nó thì bóng dịch mất cái "hiện ngay". Trong lúc chờ, bóng dịch hiện
// tạm cách đọc Google gửi kèm bản dịch.
const PHONETIC_TIMEOUT = 3500
const phoneticCache = new Map()

async function lookupPhonetic(raw) {
  const word = String(raw || '')
    .trim()
    .toLowerCase()
  if (!/^[a-z][a-z'-]{0,40}$/.test(word)) return ''
  if (phoneticCache.has(word)) return phoneticCache.get(word)
  const data = await fetchJson(
    'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word),
    PHONETIC_TIMEOUT,
  )
  let phonetic = ''
  for (const entry of Array.isArray(data) ? data : []) {
    const found = entry?.phonetic || (entry?.phonetics || []).find((p) => p && p.text)?.text
    if (found) {
      phonetic = String(found)
      break
    }
  }
  // Không có mục từ (404) cũng nhớ; chỉ lỗi mạng mới để lần sau hỏi lại.
  if (data || phonetic) {
    phoneticCache.set(word, phonetic)
    if (phoneticCache.size > CACHE_LIMIT) phoneticCache.delete(phoneticCache.keys().next().value)
  }
  return phonetic
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'engmaster-translate') return
  translateSelection(msg.text).then(sendResponse, () => sendResponse({ status: 'unreachable' }))
  // Giữ kênh mở để trả lời bất đồng bộ.
  return true
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'engmaster-phonetic') return
  lookupPhonetic(msg.word).then(
    (phonetic) => sendResponse({ phonetic }),
    () => sendResponse({ phonetic: '' }),
  )
  return true
})

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== 'engmaster-toggle-auto') return
  toggleAutoTranslate().catch((err) => log('lỗi khi bật/tắt tự dịch:', String(err?.message || err)))
})

// Trình duyệt đưa sẵn tab đang xem lúc bấm phím — dùng luôn, khỏi phải dò lại
// bằng tabs.query (dò lại dễ trúng nhầm cửa sổ Dịch nhanh vừa được focus).
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'toggle-auto-translate') {
    toggleAutoTranslate().catch((err) => log('lỗi khi bật/tắt tự dịch:', String(err?.message || err)))
    return
  }
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
