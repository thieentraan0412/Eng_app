import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Khởi tạo client Supabase từ biến môi trường (.env).
// Đây là điểm kết nối duy nhất tới Cloud (Auth + Postgres + Storage).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Cảnh báo sớm khi chưa cấu hình .env (xem supabase/HUONG_DAN_SETUP.md)
  console.warn(
    '[Supabase] Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY. ' +
      'Hãy tạo file .env theo .env.example.',
  )
}

export const supabase: SupabaseClient = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true, // ghi nhớ đăng nhập giữa các lần mở app
    autoRefreshToken: true,
    detectSessionInUrl: false, // app desktop, không dùng redirect URL
  },
})

// Cờ tiện dụng: đã cấu hình cloud chưa
export const isSupabaseConfigured = Boolean(url && anonKey)
