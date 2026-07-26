import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { bumpRequest } from '../usageStats'
import { isWeb } from '../../platform'

// Khởi tạo client Supabase từ biến môi trường (.env).
// Đây là điểm kết nối duy nhất tới Cloud (Auth + Postgres + Storage).
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const isSupabaseConfigured = Boolean(url && anonKey)

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

// Supabase bắt buộc URL/key không rỗng ngay khi tạo client. Dùng giá trị giả
// hợp lệ khi thiếu cấu hình để renderer vẫn hiển thị được cảnh báo thay vì
// crash thành cửa sổ trắng. AuthContext sẽ không gọi cloud trong trạng thái này.
export const supabase: SupabaseClient = createClient(
  url || 'http://127.0.0.1:54321',
  anonKey || 'supabase-not-configured',
  {
    auth: {
      persistSession: true, // ghi nhớ đăng nhập giữa các lần mở app
      autoRefreshToken: true,
      // Web dùng redirect URL (xác nhận email / magic link); desktop thì không
      detectSessionInUrl: isWeb,
    },
    global: { fetch: countingFetch },
  },
)
