// Phân biệt môi trường chạy: Electron (desktop) hay trình duyệt (web).
// Preload của Electron expose `window.api`; bản web không có → dùng cờ này để
// bỏ qua/ẩn các tính năng chỉ có trên desktop (popup dịch toàn màn hình, lưu
// mật khẩu bằng safeStorage, hotkey toàn cục…).
export const isDesktop =
  typeof window !== 'undefined' && Boolean((window as unknown as { api?: unknown }).api)

export const isWeb = !isDesktop
