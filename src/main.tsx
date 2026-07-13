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
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
