-- "Tự động hiển thị câu chép" (Cài đặt › Chép câu › Thư mục câu): nhớ bộ đang
-- dùng + câu hiện gần nhất theo TÀI KHOẢN, để vào lại app, bật lại công tắc, bản
-- dev, máy khác hay web đều thấy cùng một bộ.
-- Chạy trong Supabase → SQL Editor. An toàn khi chạy lại nhiều lần.

-- Bảng settings đã có từ schema.sql (mỗi tài khoản 1 dòng); tạo phòng khi thiếu
create table if not exists public.settings (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  theme                text not null default 'system',
  suggestion_enabled   boolean not null default true,
  translation_provider text not null default 'offline'
);

-- {"folderId": "<id bộ>" | "" (tất cả thư mục), "lastId": "<id câu>" | null, "at": <ms lúc đổi>}
alter table public.settings add column if not exists sentence_reminder jsonb;

-- RLS: mỗi người chỉ đọc / ghi dòng của mình
alter table public.settings enable row level security;
drop policy if exists settings_owner_select on public.settings;
drop policy if exists settings_owner_insert on public.settings;
drop policy if exists settings_owner_update on public.settings;
drop policy if exists settings_owner_delete on public.settings;
create policy settings_owner_select on public.settings for select using (auth.uid() = user_id);
create policy settings_owner_insert on public.settings for insert with check (auth.uid() = user_id);
create policy settings_owner_update on public.settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy settings_owner_delete on public.settings for delete using (auth.uid() = user_id);

-- Nạp lại schema cache của PostgREST để client thấy cột mới ngay
notify pgrst, 'reload schema';

-- Kiểm tra: phải thấy dòng sentence_reminder | jsonb
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'settings' and column_name = 'sentence_reminder';
