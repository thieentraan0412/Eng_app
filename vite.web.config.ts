import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Cấu hình Vite cho bản WEB (trình duyệt).
// Dùng chung toàn bộ code trong src/ với app desktop, chỉ khác:
//  - KHÔNG có plugin electron / renderer
//  - Entry nằm ở web/ (index.html + main.tsx)
//  - Build ra dist-web/ (SPA tĩnh để deploy)
export default defineConfig({
  root: resolve(__dirname, 'web'),
  // .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) nằm ở gốc repo, dùng chung
  envDir: resolve(__dirname),
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  plugins: [react()],
  server: {
    port: 5174, // khác cổng dev desktop (5173) để chạy song song nếu cần
  },
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
  },
})
