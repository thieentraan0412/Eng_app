// Khung của cửa sổ Dịch nhanh: chỉ nhúng trang EngMaster và đóng cửa sổ khi
// trang bên trong báo ra (bấm Esc hoặc nút X).

const src = new URLSearchParams(location.search).get('src')
let allowedOrigin = ''

if (src) {
  try {
    allowedOrigin = new URL(src).origin
    document.getElementById('frame').src = src
  } catch {
    allowedOrigin = ''
  }
}

window.addEventListener('message', async (event) => {
  if (event.origin !== allowedOrigin) return
  if (!event.data || event.data.type !== 'engmaster-quick-translate-close') return
  const win = await chrome.windows.getCurrent()
  if (win?.id != null) await chrome.windows.remove(win.id)
})
