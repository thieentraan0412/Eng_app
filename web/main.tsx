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

// Bản Web: chỉ có ứng dụng chính. Không có cửa sổ popup dịch toàn màn hình
// (đó là tính năng riêng của desktop, cần Electron).
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
