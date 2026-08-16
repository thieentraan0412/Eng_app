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
