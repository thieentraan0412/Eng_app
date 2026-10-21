-- Trang "Luyện Task 2": mỗi bài luyện là một dòng, đồng bộ app ↔ web.
-- Chạy trong Supabase → SQL Editor. An toàn khi chạy lại nhiều lần.

create table if not exists public.task2_essays (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text,                                -- đầu đề bài, để hiện trong danh sách
  data       jsonb not null default '{}'::jsonb,  -- toàn bộ bài làm: đề, dạng đề, ý, 13 câu outline
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_task2_user on public.task2_essays (user_id);

-- RLS: mỗi người chỉ thấy và sửa bài của mình
alter table public.task2_essays enable row level security;
drop policy if exists task2_essays_owner_select on public.task2_essays;
drop policy if exists task2_essays_owner_insert on public.task2_essays;
drop policy if exists task2_essays_owner_update on public.task2_essays;
drop policy if exists task2_essays_owner_delete on public.task2_essays;
create policy task2_essays_owner_select on public.task2_essays for select using (auth.uid() = user_id);
create policy task2_essays_owner_insert on public.task2_essays for insert with check (auth.uid() = user_id);
create policy task2_essays_owner_update on public.task2_essays for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy task2_essays_owner_delete on public.task2_essays for delete using (auth.uid() = user_id);

-- Nạp lại schema cache của PostgREST để client thấy bảng mới ngay
notify pgrst, 'reload schema';

-- Kiểm tra: phải thấy 1 dòng task2_essays
select table_name from information_schema.tables
where table_schema = 'public' and table_name = 'task2_essays';
