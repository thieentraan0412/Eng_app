// Popup mở khi bấm Alt+X (hoặc bấm icon tiện ích). Việc của nó rất gọn:
// lấy chữ đang bôi đen ở tab hiện tại rồi nhúng trang Dịch nhanh của EngMaster.

const MAX_SELECTION = 1000
// Địa chỉ mặc định; đổi được trong trang cài đặt của tiện ích.
const DEFAULT_APP_URL = 'https://eng-app-sigma.vercel.app'

async function readAppUrl() {
  const stored = await chrome.storage.sync.get('appUrl')
  return String(stored.appUrl || DEFAULT_APP_URL).trim()
}

// activeTab được cấp ngay khi người dùng gọi tiện ích, nên chỉ đọc được vùng
// chọn của đúng tab đang xem — không đụng tới các tab khác.
async function readSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
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

function showSetup() {
  document.getElementById('setup').hidden = false
  document.getElementById('open-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
    window.close()
  })
}

async function main() {
  const base = await readAppUrl()
  let url
  try {
    url = new URL(base)
  } catch {
    showSetup()
    return
  }

  url.searchParams.set('view', 'quick-translate')
  const selection = await readSelection()
  if (selection) url.searchParams.set('q', selection)

  const frame = document.getElementById('frame')
  frame.src = url.toString()
  frame.hidden = false
}

// Bấm nút X hoặc Esc trong khung dịch -> trang trong iframe nhắn ra đây.
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'engmaster-quick-translate-close') window.close()
})

void main()
