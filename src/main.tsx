import React from 'react'
import ReactDOM from 'react-dom/client'
// Font Inter đóng gói kèm app (offline) cho giao diện
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
// Font Lora (serif) cho vùng Đọc / Viết — tinh tế, dễ đọc văn bản dài
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
import App from './App'
import DesktopTranslatePopup from './components/DesktopTranslatePopup'
import QuickTranslateWindow from './components/QuickTranslateWindow'
import { isDesktop } from './platform'
import './styles.css'

// Cùng một bundle renderer phục vụ 2 cửa sổ:
//  - Mặc định: ứng dụng chính (App)
//  - ?view=translate: cửa sổ popup dịch nhanh toàn màn hình (nhỏ, trong suốt)
const view = new URLSearchParams(window.location.search).get('view')
const root = ReactDOM.createRoot(document.getElementById('root')!)

if (view === 'quick-translate') {
  document.body.classList.add('quick-translate-body')
  // Trên web thì đây là iframe trong popup của extension, không phải cửa sổ
  // trong suốt của Electron -> cần nền đặc, nếu không sẽ lộ nền trắng phía sau.
  if (!isDesktop) document.body.classList.add('quick-translate-embed')
  root.render(
    <React.StrictMode>
      <QuickTranslateWindow />
    </React.StrictMode>,
  )
} else if (view === 'translate') {
  document.body.classList.add('popup-body')
  root.render(
    <React.StrictMode>
      <DesktopTranslatePopup />
    </React.StrictMode>,
  )
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
