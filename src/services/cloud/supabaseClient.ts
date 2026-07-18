import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { bumpRequest } from '../usageStats'
import { isWeb } from '../../platform'

// Khởi tạo client Supabase từ biến môi trường (.env).
// Đây là điểm kết nối duy nhất tới Cloud (Auth + Postgres + Storage).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Bọc fetch để ĐẾM mọi request client gửi đi (cho trang Thống kê)
const countingFetch: typeof fetch = (input, init) => {
  try {
    bumpRequest()
  } catch {
    /* đếm lỗi không được làm hỏng request */
  }
  return fetch(input, init)
}

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
    // Web dùng redirect URL (xác nhận email / magic link); desktop thì không
    detectSessionInUrl: isWeb,
  },
  global: { fetch: countingFetch },
})

// Cờ tiện dụng: đã cấu hình cloud chưa
export const isSupabaseConfigured = Boolean(url && anonKey)
