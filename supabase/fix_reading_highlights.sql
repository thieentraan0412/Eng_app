-- Sửa lỗi: vùng bôi (highlight) trong bài đọc không đồng bộ lên cloud.
-- Chạy file này trong Supabase → SQL Editor. An toàn khi chạy lại nhiều lần.

-- 1) Bảo đảm bảng readings có cột lưu vùng bôi
alter table public.readings add column if not exists highlights jsonb;

-- 2) Bảo đảm chủ sở hữu được phép UPDATE (nếu policy bị thiếu)
alter table public.readings enable row level security;

drop policy if exists readings_owner_update on public.readings;
create policy readings_owner_update on public.readings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Kiểm tra: phải thấy dòng highlights | jsonb
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'readings' and column_name = 'highlights';
