-- Chức năng "đánh dấu đã đọc xong" cho bài đọc.
-- Chạy trong Supabase → SQL Editor. An toàn khi chạy lại nhiều lần.

-- Thời điểm đánh dấu đã đọc xong; null = chưa đọc xong
alter table public.readings add column if not exists finished_at timestamptz;

-- Nạp lại schema cache của PostgREST để client thấy cột mới ngay
notify pgrst, 'reload schema';

-- Kiểm tra: phải thấy dòng finished_at | timestamp with time zone
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'readings' and column_name = 'finished_at';
