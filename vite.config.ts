import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'node:path'

// Cấu hình Vite + Electron cho EngMaster
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  plugins: [
    react(),
    electron([
      {
        // Tiến trình Main (Node)
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              // Native module: không bundle, để require lúc chạy
              external: ['uiohook-napi'],
            },
          },
        },
      },
      {
        // Script preload (cầu nối an toàn Renderer ⇄ Main)
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
})
