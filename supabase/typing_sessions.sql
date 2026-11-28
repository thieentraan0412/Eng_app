-- Game "Mưa từ" (và các game gõ sau này): mỗi lượt chơi là một dòng, đồng bộ app ↔ web.
-- Dùng cho kỷ lục theo nguồn từ và danh sách lượt chơi gần đây.
-- Chạy trong Supabase → SQL Editor. An toàn khi chạy lại nhiều lần.

create table if not exists public.typing_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  game         text not null default 'rain',       -- 'rain' = Mưa từ; sau này có thể thêm game khác
  mode         text not null,                       -- 'word' (nhìn chữ) | 'meaning' (nhìn nghĩa)
  source_kind  text not null,                       -- 'deck' (bộ thẻ Từ vựng) | 'missed' (ôn các từ bị lỡ)
  source_key   text not null,                       -- 'deck:<id>' | 'missed'
  source_label text,                                -- tên bộ thẻ để hiện trong danh sách
  score        integer not null default 0,
  words        integer not null default 0,          -- số từ gõ đúng
  missed_count integer not null default 0,          -- số từ bị rơi mất (không tính trùng)
  max_combo    integer not null default 0,
  level        integer not null default 1,
  wpm          integer not null default 0,
  accuracy     integer,                             -- % phím đúng; null khi chưa gõ phím nào
  duration_ms  integer not null default 0,
  data         jsonb not null default '{}'::jsonb,  -- {v, device, keys:{ok,bad}, ended, missed:[{text,meaning?}]}
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists idx_typing_user_time on public.typing_sessions (user_id, created_at desc);
create index if not exists idx_typing_best on public.typing_sessions (user_id, game, mode, source_key, score desc);

-- RLS: mỗi người chỉ thấy và sửa lượt chơi của mình
alter table public.typing_sessions enable row level security;
drop policy if exists typing_sessions_owner_select on public.typing_sessions;
drop policy if exists typing_sessions_owner_insert on public.typing_sessions;
drop policy if exists typing_sessions_owner_update on public.typing_sessions;
drop policy if exists typing_sessions_owner_delete on public.typing_sessions;
create policy typing_sessions_owner_select on public.typing_sessions for select using (auth.uid() = user_id);
create policy typing_sessions_owner_insert on public.typing_sessions for insert with check (auth.uid() = user_id);
create policy typing_sessions_owner_update on public.typing_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy typing_sessions_owner_delete on public.typing_sessions for delete using (auth.uid() = user_id);

-- Nạp lại schema cache của PostgREST để client thấy bảng mới ngay
notify pgrst, 'reload schema';

-- Kiểm tra: phải thấy 1 dòng typing_sessions
select table_name from information_schema.tables
where table_schema = 'public' and table_name = 'typing_sessions';
