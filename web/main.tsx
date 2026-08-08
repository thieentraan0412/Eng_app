import React from 'react'
import ReactDOM from 'react-dom/client'
// Font Inter đóng gói kèm app (offline) cho giao diện
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
// Font Lora (serif) cho vùng Đọc / Viết
import '@fontsource/lora/400.css'
import '@fontsource/lora/500.css'
import '@fontsource/lora/600.css'
// Be Vietnam Pro + Space Grotesk — bố cục "Chép câu" (Luyện tập) mới
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import App from '../src/App'
import '../src/styles.css'

// Safari/Chrome mobile thay đổi phần viewport nhìn thấy khi thanh địa chỉ hoặc
// bàn phím mở. Đồng bộ chiều cao thật ngay từ lúc khởi động để app không bị kéo
// giãn, lệch breakpoint hoặc nhảy layout ở lần tải đầu.
const syncViewportHeight = () => {
  const height = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`)
}
syncViewportHeight()
window.requestAnimationFrame(syncViewportHeight)
window.setTimeout(syncViewportHeight, 250)
window.addEventListener('resize', syncViewportHeight, { passive: true })
window.addEventListener('pageshow', syncViewportHeight, { passive: true })
window.visualViewport?.addEventListener('resize', syncViewportHeight, { passive: true })

// Bản Web: chỉ có ứng dụng chính. Không có cửa sổ popup dịch toàn màn hình
// (đó là tính năng riêng của desktop, cần Electron).
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
