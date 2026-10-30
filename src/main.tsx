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
import SentenceReminderWindow from './components/SentenceReminderWindow'
import './styles.css'

// Cùng một bundle renderer phục vụ nhiều cửa sổ:
//  - Mặc định: ứng dụng chính (App)
//  - ?view=translate: cửa sổ popup dịch nhanh toàn màn hình (nhỏ, trong suốt)
//  - ?view=sentence-reminder: cửa sổ câu lớn của "Nhắc chép câu" (trong suốt)
const view = new URLSearchParams(window.location.search).get('view')
const root = ReactDOM.createRoot(document.getElementById('root')!)

if (view === 'sentence-reminder') {
  document.body.classList.add('sentence-reminder-body')
  root.render(
    <React.StrictMode>
      <SentenceReminderWindow />
    </React.StrictMode>,
  )
} else if (view === 'quick-translate') {
  document.body.classList.add('quick-translate-body')
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
