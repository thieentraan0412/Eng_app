-- ============================================================
-- EngMaster · Module NGỮ PHÁP (11) — chạy MỘT LẦN trên Supabase
-- Dashboard → SQL Editor → New query → dán toàn bộ file này → Run.
-- An toàn khi chạy lại nhiều lần (create if not exists + drop policy if exists).
--
-- Phần này đã có sẵn trong supabase/schema.sql; file riêng để tiện chạy bổ sung
-- cho tài khoản đã cài schema từ trước.
-- ============================================================

-- ---------- 1. GRAMMAR_TOPICS (chủ điểm người dùng tự soạn) ----------
-- 16 chủ điểm chuẩn nằm trong code (src/data/grammar.ts), KHÔNG lưu ở đây.
-- Bảng này giữ chủ điểm soạn tay / chép từ mẫu / nạp từ sổ tính Excel,
-- và bản chỉnh sửa riêng của một chủ điểm dựng sẵn (source_key = slug bản gốc).
create table if not exists public.grammar_topics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  source_key  text,                                -- slug chủ điểm dựng sẵn bản này thay thế
  name        text not null,
  name_en     text,
  level       text not null default 'B1' check (level in ('A1','A2','B1','B2','C1','C2')),
  topic_group text,                                -- 'Thì động từ' | 'Danh từ & mạo từ' …
  description text,
  icon        text not null default 'clock',
  tags        jsonb not null default '[]'::jsonb,  -- nhóm lỗi người Việt liên quan
  signals     jsonb not null default '[]'::jsonb,  -- từ tín hiệu
  formulas    jsonb not null default '[]'::jsonb,  -- [{form, structure, example}]
  uses        jsonb not null default '[]'::jsonb,  -- [{name, sample, note}]
  traps       jsonb not null default '[]'::jsonb,  -- [{wrong, right, why}]
  compare     jsonb,                               -- {with, rows:[{key, other, self}]}
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ---------- 2. GRAMMAR_ITEMS (câu luyện của chủ điểm tự soạn) ----------
create table if not exists public.grammar_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  topic_id   uuid not null references public.grammar_topics (id) on delete cascade,
  kind       text not null check (kind in ('cloze','mcq','correct','transform')),
  prompt     text not null,                        -- câu có ___ / câu gốc
  answers    jsonb not null default '[]'::jsonb,   -- các đáp án chấp nhận được
  options    jsonb,                                -- chỉ cho mcq
  tokens     jsonb,                                -- chỉ cho correct (mảng từ)
  err_index  integer,                              -- chỉ cho correct (vị trí từ sai)
  cue        text,                                 -- gợi ý "(live)" của dạng điền
  explain    text,                                 -- phần "Vì sao"
  error_tag  text,                                 -- 1 trong 7 nhóm lỗi người Việt
  created_at timestamptz not null default now()
);

-- ---------- 3. GRAMMAR_PROGRESS (mức nắm vững + lịch ôn từng chủ điểm) ----------
-- topic_key = slug của chủ điểm dựng sẵn, hoặc id (uuid dạng text) của chủ điểm tự soạn.
create table if not exists public.grammar_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  topic_key    text not null,
  attempts     integer not null default 0,         -- tổng số câu đã trả lời
  correct      integer not null default 0,         -- số câu đúng
  mastery      integer not null default 0,         -- 0..100
  srs_interval integer not null default 0,         -- số ngày tới lần ôn kế
  srs_due_date date    not null default current_date,
  last_studied timestamptz,
  updated_at   timestamptz not null default now(),
  unique (user_id, topic_key)
);

-- ---------- 4. GRAMMAR_ERRORS (sổ lỗi cá nhân, có lịch ôn riêng) ----------
-- Vòng đời: mắc lỗi → 1 ngày → 3 → 7 → 21 ngày rồi chuyển 'resolved'.
-- Tái phạm bất kỳ chặng nào thì quay về chặng 0 và hit_count tăng.
create table if not exists public.grammar_errors (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  topic_key    text not null,
  topic_name   text not null default '',
  level        text,
  error_tag    text not null default '',           -- nhãn nhóm lỗi người Việt
  item_ref     text,                               -- id câu luyện đã sinh ra lỗi
  wrong_text   text not null default '',           -- câu/câu trả lời sai
  right_text   text not null default '',           -- dạng đúng
  hit_count    integer not null default 1,
  stage        integer not null default 0,         -- 0..3 (chặng ôn)
  status       text not null default 'active' check (status in ('active','resolved')),
  due_date     date not null default current_date,
  first_seen   timestamptz not null default now(),
  last_seen    timestamptz not null default now(),
  unique (user_id, topic_key, wrong_text, right_text)
);

-- ---------- 5. GRAMMAR_HIDDEN_TOPICS (chủ điểm dựng sẵn bị người dùng ẩn) ----------
-- Không xóa được chủ điểm nằm trong code, nên "xóa" = ghi một dòng ở đây.
-- Bỏ dòng đi là chủ điểm hiện lại nguyên vẹn cùng tiến độ cũ.
create table if not exists public.grammar_hidden_topics (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  topic_key  text not null,                        -- slug chủ điểm dựng sẵn
  created_at timestamptz not null default now(),
  unique (user_id, topic_key)
);

-- Chạy bổ sung cho tài khoản đã cài schema trước khi có 2 phần trên
alter table public.grammar_topics add column if not exists source_key text;

-- ---------- Chỉ mục ----------
create index if not exists idx_gtopics_user     on public.grammar_topics (user_id);
create index if not exists idx_gitems_topic     on public.grammar_items (topic_id);
create index if not exists idx_gprogress_user   on public.grammar_progress (user_id);
create index if not exists idx_gerrors_user_due on public.grammar_errors (user_id, due_date);
create index if not exists idx_ghidden_user     on public.grammar_hidden_topics (user_id);

-- ---------- Row Level Security: mỗi tài khoản chỉ thấy dữ liệu của mình ----------
do $$
declare
  t text;
  tables text[] := array[
    'grammar_topics','grammar_items','grammar_progress','grammar_errors',
    'grammar_hidden_topics'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists %I on public.%I;', t || '_owner_select', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner_insert', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner_update', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner_delete', t);

    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id);',
      t || '_owner_select', t);
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id);',
      t || '_owner_insert', t);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t || '_owner_update', t);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id);',
      t || '_owner_delete', t);
  end loop;
end $$;

-- ---------- Kiểm tra nhanh sau khi chạy ----------
-- Phải trả về đúng 5 dòng, cột rowsecurity = true
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename like 'grammar_%'
order by tablename;
