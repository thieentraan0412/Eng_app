-- ============================================================
-- EngMaster — Schema Postgres + Row Level Security (Supabase)
-- Chạy file này trong Supabase Dashboard → SQL Editor → New query
-- ============================================================
-- Nguyên tắc: MỌI bảng dữ liệu người dùng có cột user_id (= auth.uid()).
-- RLS bảo đảm mỗi tài khoản chỉ đọc/ghi được dữ liệu của chính mình.
-- Bảng users do Supabase Auth quản lý sẵn (auth.users) — không tạo lại.
-- ============================================================

-- ---------- 1. DECKS (bộ từ vựng) ----------
create table if not exists public.decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ---------- 2. CARDS (thẻ từ + SRS) ----------
create table if not exists public.cards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  deck_id      uuid not null references public.decks (id) on delete cascade,
  word         text not null,
  meaning      text,
  phonetic     text,
  example      text,
  collocation  text,                             -- cụm từ hay đi kèm (vd: "make a decision")
  pattern      text,                             -- mẫu câu/ngữ pháp (vd: "interested in + N")
  pos          text,                             -- từ loại: n / v / adj / adv…
  audio_url    text,
  srs_interval integer not null default 0,       -- số ngày tới lần ôn kế
  srs_ease     real    not null default 2.5,     -- hệ số dễ (ease factor)
  srs_due_date date    not null default current_date,
  srs_reps     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- Bổ sung cột cho CSDL đã tạo trước đó (an toàn khi chạy lại)
alter table public.cards add column if not exists collocation text;
alter table public.cards add column if not exists pattern     text;
alter table public.cards add column if not exists pos         text;

-- ---------- 3. REVIEW_LOGS (lịch sử ôn) ----------
create table if not exists public.review_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  card_id        uuid not null references public.cards (id) on delete cascade,
  reviewed_at    timestamptz not null default now(),
  rating         text not null check (rating in ('again','hard','good','easy')),
  interval_after integer
);

-- ---------- 4. LESSONS (bài ngữ pháp) ----------
create table if not exists public.lessons (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  content    text,
  level      text,                                -- A1..C2
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- 5. QUESTIONS (câu hỏi bài tập) ----------
create table if not exists public.questions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  lesson_id      uuid not null references public.lessons (id) on delete cascade,
  type           text not null check (type in ('mcq','fill_blank','reorder')),
  prompt         text not null,
  options        jsonb,
  correct_answer text,
  explanation    text
);

-- ---------- 6. READINGS (bài đọc) ----------
create table if not exists public.readings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  content    text,
  level      text,
  highlights jsonb, -- các vùng bôi màu: [{start, end, color}]
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Migration (an toàn khi chạy lại): thêm cột bôi màu cho DB đã tạo trước đó
alter table public.readings add column if not exists highlights jsonb;

-- ---------- 7. WRITINGS (bài viết) ----------
create table if not exists public.writings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text,
  content    text,
  word_count integer not null default 0,
  topic      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- 8. STUDY_STATS (thống kê theo ngày) ----------
create table if not exists public.study_stats (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  date            date not null default current_date,
  cards_reviewed  integer not null default 0,
  minutes_studied integer not null default 0,
  new_words       integer not null default 0,
  quizzes_done    integer not null default 0,
  unique (user_id, date)
);

-- ---------- 9. SETTINGS (cấu hình cá nhân) ----------
create table if not exists public.settings (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  theme                text not null default 'system',
  suggestion_enabled   boolean not null default true,
  translation_provider text not null default 'offline'
);

-- ---------- 10. SENTENCE_FOLDERS (thư mục "Chép câu") ----------
create table if not exists public.sentence_folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- 11. SENTENCES (câu luyện dịch Việt → Anh) ----------
create table if not exists public.sentences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  folder_id   uuid not null references public.sentence_folders (id) on delete cascade,
  vi          text not null,                       -- câu tiếng Việt (đề bài)
  en          text,                                -- đáp án tham chiếu chính
  alt_answers jsonb,                               -- các cách dịch đúng khác: ["...", "..."]
  hints       jsonb,                               -- gợi ý: ["thì hiện tại hoàn thành", ...]
  level       text,                                -- A1..C1
  topic       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ---------- 12. SENTENCE_PROGRESS (bài đã làm ở tab Luyện tập) ----------
-- Mỗi câu 1 dòng/1 user: câu đã gõ + kết quả chấm + đã xem đáp án chưa.
create table if not exists public.sentence_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  sentence_id uuid not null references public.sentences (id) on delete cascade,
  answer      text not null default '',            -- câu tiếng Anh người dùng đã gõ
  status      text check (status in ('correct','close','wrong')), -- null = chưa chấm
  score       real,                                -- 0..1 (null = chưa chấm)
  revealed    boolean not null default false,      -- đã bấm "Xem đáp án"
  updated_at  timestamptz not null default now(),
  unique (user_id, sentence_id)
);

-- ---------- 13. EXERCISE_PROGRESS (tiến độ trang Bài tập theo bộ từ) ----------
-- Mỗi bộ từ 1 dòng/1 user: đề trắc nghiệm đã sinh + đáp án đã chọn (jsonb),
-- để app ↔ web ↔ điện thoại vào lại đều tiếp tục đúng câu đang dở.
create table if not exists public.exercise_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  deck_id    uuid not null references public.decks (id) on delete cascade,
  data       jsonb not null,                      -- {q: [{c, o}], a: {...}, t}
  updated_at timestamptz not null default now(),
  unique (user_id, deck_id)
);

-- ============================================================
-- CHỈ MỤC (index) cho truy vấn thường dùng
-- ============================================================
create index if not exists idx_exprogress_user   on public.exercise_progress (user_id);
create index if not exists idx_exprogress_deck   on public.exercise_progress (deck_id);
create index if not exists idx_sfolders_user     on public.sentence_folders (user_id);
create index if not exists idx_sentences_folder   on public.sentences (folder_id);
create index if not exists idx_sprogress_user     on public.sentence_progress (user_id);
create index if not exists idx_sprogress_sentence on public.sentence_progress (sentence_id);
create index if not exists idx_decks_user       on public.decks (user_id);
create index if not exists idx_cards_deck        on public.cards (deck_id);
create index if not exists idx_cards_due         on public.cards (user_id, srs_due_date);
create index if not exists idx_review_user       on public.review_logs (user_id);
create index if not exists idx_questions_lesson  on public.questions (lesson_id);
create index if not exists idx_stats_user_date   on public.study_stats (user_id, date);

-- ============================================================
-- ROW LEVEL SECURITY
-- Bật RLS + policy "chủ sở hữu" cho từng bảng.
-- ============================================================
do $$
declare
  t text;
  tables text[] := array[
    'decks','cards','review_logs','lessons','questions',
    'readings','writings','study_stats','settings',
    'sentence_folders','sentences','sentence_progress',
    'exercise_progress'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);

    -- Xóa policy cũ nếu chạy lại
    execute format('drop policy if exists %I on public.%I;', t || '_owner_select', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner_insert', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner_update', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner_delete', t);

    -- SELECT: chỉ đọc bản ghi của mình
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id);',
      t || '_owner_select', t);

    -- INSERT: chỉ tạo bản ghi gắn user_id của mình
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id);',
      t || '_owner_insert', t);

    -- UPDATE: chỉ sửa bản ghi của mình
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t || '_owner_update', t);

    -- DELETE: chỉ xóa bản ghi của mình
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id);',
      t || '_owner_delete', t);
  end loop;
end $$;

-- ============================================================
-- (Tùy chọn) Tự tạo dòng settings khi có user mới đăng ký
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- THỐNG KÊ DUNG LƯỢNG — cho trang "Thống kê" trong app.
-- Trả về dung lượng toàn database (đối chiếu hạn mức Free 500MB) + số bản ghi
-- từng bảng. security definer để đọc được pg_database_size; chỉ cho user đã
-- đăng nhập gọi.
-- ============================================================
create or replace function public.get_db_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'db_size_bytes', pg_database_size(current_database()),
    'tables', (
      select jsonb_object_agg(name, cnt) from (
        select 'decks'             as name, count(*) as cnt from public.decks             where deleted_at is null
        union all select 'cards',             count(*) from public.cards             where deleted_at is null
        union all select 'sentences',         count(*) from public.sentences         where deleted_at is null
        union all select 'sentence_folders',  count(*) from public.sentence_folders  where deleted_at is null
        union all select 'sentence_progress', count(*) from public.sentence_progress
        union all select 'exercise_progress', count(*) from public.exercise_progress
        union all select 'readings',          count(*) from public.readings          where deleted_at is null
        union all select 'writings',          count(*) from public.writings          where deleted_at is null
        union all select 'lessons',           count(*) from public.lessons           where deleted_at is null
        union all select 'questions',         count(*) from public.questions
        union all select 'review_logs',       count(*) from public.review_logs
      ) s
    )
  );
$$;

revoke all on function public.get_db_stats() from public, anon;
grant execute on function public.get_db_stats() to authenticated;
