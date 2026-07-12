import { contextBridge, ipcRenderer } from 'electron'

interface Cred {
  email: string
  password: string
}

// Cầu nối an toàn giữa Renderer (React) và Main.
// Renderer chỉ gọi được đúng các hàm expose ở đây (contextIsolation bật).
contextBridge.exposeInMainWorld('api', {
  // Kiểm tra trạng thái kết nối
  netStatus: (): Promise<{ online: boolean }> => ipcRenderer.invoke('net:status'),

  // Ghi nhớ đăng nhập (mã hóa bằng safeStorage)
  saveCred: (data: Cred): Promise<boolean> => ipcRenderer.invoke('cred:save', data),
  loadCred: (): Promise<Cred | null> => ipcRenderer.invoke('cred:load'),
  clearCred: (): Promise<boolean> => ipcRenderer.invoke('cred:clear'),
})
