const input = document.getElementById('app-url')
const status = document.getElementById('status')

chrome.storage.sync.get('appUrl').then((stored) => {
  input.value = String(stored.appUrl || '')
})

// Bỏ dấu / thừa ở cuối và mọi tham số người dùng lỡ dán theo, chỉ giữ gốc trang.
function normalize(raw) {
  const url = new URL(raw.trim())
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol')
  return url.origin + url.pathname.replace(/\/+$/, '')
}

document.getElementById('save').addEventListener('click', async () => {
  let value
  try {
    value = normalize(input.value)
  } catch {
    input.focus()
    input.select()
    status.hidden = false
    status.style.color = '#f87171'
    status.textContent = 'Địa chỉ không hợp lệ — cần dạng https://…'
    return
  }

  await chrome.storage.sync.set({ appUrl: value })
  input.value = value
  status.hidden = false
  status.style.color = '#4ade80'
  status.textContent = 'Đã lưu'
  window.setTimeout(() => {
    status.hidden = true
  }, 2000)
})

// Tự dịch khi bôi đen: gạt là lưu luôn, không cần bấm Lưu.
const autoToggle = document.getElementById('auto-translate')
const toggleKey = document.getElementById('toggle-key')

chrome.storage.sync.get('autoTranslate').then((stored) => {
  autoToggle.checked = stored.autoTranslate !== false
})

autoToggle.addEventListener('change', () => {
  void chrome.storage.sync.set({ autoTranslate: autoToggle.checked })
})

// Bấm phím tắt trong lúc trang này đang mở thì công tắc cũng gạt theo.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.autoTranslate) {
    autoToggle.checked = changes.autoTranslate.newValue !== false
  }
})

// Ghi đúng tổ hợp đang gán. Trình duyệt để trống thì giữ Alt+Shift+X — tổ hợp
// này content.js vẫn bắt được ngay trong trang.
chrome.commands.getAll().then((all) => {
  const cmd = all.find((c) => c.name === 'toggle-auto-translate')
  if (cmd && cmd.shortcut) toggleKey.textContent = cmd.shortcut
})
