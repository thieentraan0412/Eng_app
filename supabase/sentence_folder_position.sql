-- Trang "Chép câu": kéo thả để đổi vị trí thư mục.
-- Chạy trong Supabase → SQL Editor. An toàn khi chạy lại nhiều lần.

-- Vị trí thư mục trong lưới (0 = đầu tiên); null = chưa sắp, xếp sau cùng theo ngày tạo
alter table public.sentence_folders add column if not exists position integer;

-- Gán vị trí theo thứ tự hiện tại (ngày tạo) cho các thư mục chưa có vị trí
update public.sentence_folders f
set position = o.rn - 1
from (
  select id, row_number() over (partition by user_id order by created_at) as rn
  from public.sentence_folders
  where deleted_at is null
) o
where f.id = o.id and f.position is null;

-- Nạp lại schema cache của PostgREST để client thấy cột mới ngay
notify pgrst, 'reload schema';

-- Kiểm tra: phải thấy dòng position | integer
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'sentence_folders' and column_name = 'position';
