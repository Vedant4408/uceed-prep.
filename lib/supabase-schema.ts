export const SUPABASE_SQL_MIGRATION = `-- ============================================================================
-- UCEED PREP LAB — NORMALIZED SUPABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Run this migration in your Supabase SQL Editor to provision all 12 tables,
-- indexes, foreign keys, and strict Row Level Security policies.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  target_exam_year integer not null default 2026 check (target_exam_year between 2024 and 2032),
  daily_study_goal_minutes integer not null default 90 check (daily_study_goal_minutes between 15 and 600),
  streak_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. QUESTIONS (Official answer keys kept in dedicated columns / protected from student mutation)
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  exam_year integer not null check (exam_year between 2015 and 2032),
  part text not null check (part in ('Part A', 'Part B')),
  section text not null,
  category text not null,
  subtopic text not null,
  question_type text not null check (question_type in ('NAT', 'MSQ', 'MCQ', 'DRAWING')),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  statement text not null,
  diagram_type text default 'none',
  max_marks numeric(5,2) not null,
  negative_marks numeric(5,2) not null default 0,
  partial_marking_allowed boolean not null default false,
  nat_tolerance numeric(6,3) default 0.01,
  recommended_time_seconds integer not null default 120,
  correct_answer jsonb not null,
  explanation text not null,
  concept_tested text not null default '',
  practical_method text not null default '',
  short_takeaway text not null default '',
  common_mistake_note text not null default '',
  source_classification text not null default 'Original Practice Question (UCEED Calibration)',
  is_published boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_questions_year_part on public.questions(exam_year, part);
create index if not exists idx_questions_category on public.questions(category);
create index if not exists idx_questions_type_diff on public.questions(question_type, difficulty);

-- 3. QUESTION OPTIONS
create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_key text not null check (option_key in ('A', 'B', 'C', 'D', 'E', 'F')),
  option_text text not null,
  diagnostic_if_selected text,
  inferred_error_category text,
  unique (question_id, option_key)
);

-- 4. QUESTION ASSETS (Diagrams, Figures, Reference Solutions)
create table if not exists public.question_assets (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  asset_role text not null check (asset_role in ('question_figure', 'option_figure', 'reference_solution')),
  storage_path text not null,
  alt_text text not null default '',
  created_at timestamptz not null default now()
);

-- 5. EXAMS
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exam_year integer not null,
  is_official_structure boolean not null default true,
  duration_minutes integer not null,
  total_marks numeric(6,2) not null,
  part_a_marks numeric(6,2) not null,
  part_b_marks numeric(6,2) not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- 6. EXAM QUESTIONS (Junction Table with Ordering & Section Overrides)
create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  display_order integer not null,
  unique (exam_id, question_id)
);

-- 7. TEST ATTEMPTS
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam_id uuid references public.exams(id) on delete set null,
  exam_title text not null,
  exam_year integer not null,
  mode text not null check (mode in ('exam', 'practice')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  total_duration_seconds integer not null default 0,
  total_score numeric(6,2) not null default 0,
  max_possible_score numeric(6,2) not null default 0,
  part_a_score numeric(6,2) not null default 0,
  part_b_score numeric(6,2) not null default 0,
  accuracy_percentage numeric(5,2) not null default 0,
  negative_marks_lost numeric(6,2) not null default 0
);

create index if not exists idx_test_attempts_user_date on public.test_attempts(user_id, completed_at desc);

-- 8. ATTEMPT RESPONSES (Stores raw answers & history so scoring can be recalculated)
create table if not exists public.attempt_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  submitted_answer jsonb,
  answer_history jsonb not null default '[]'::jsonb,
  is_marked_for_review boolean not null default false,
  time_spent_seconds integer not null default 0,
  is_repeat_attempt boolean not null default false,
  status text not null check (status in ('correct', 'partial', 'incorrect', 'unattempted')),
  marks_awarded numeric(5,2) not null default 0,
  drawing_storage_path text,
  self_assessment_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_attempt_responses_user_question on public.attempt_responses(user_id, question_id);

-- 9. BOOKMARKS
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  personal_note text not null default '',
  tag text not null default 'Review Concept',
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

-- 10. TOPIC MASTERY
create table if not exists public.topic_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  unseen_attempted integer not null default 0,
  unseen_correct numeric(6,2) not null default 0,
  repeated_attempted integer not null default 0,
  repeated_correct numeric(6,2) not null default 0,
  avg_time_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

-- 11. AI ANALYSIS REPORTS
create table if not exists public.ai_analysis_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_json jsonb not null,
  based_on_attempts_count integer not null default 1,
  created_at timestamptz not null default now()
);

-- 12. STUDY PLANS
create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_json jsonb not null,
  target_exam_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_assets enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.attempt_responses enable row level security;
alter table public.bookmarks enable row level security;
alter table public.topic_mastery enable row level security;
alter table public.ai_analysis_reports enable row level security;
alter table public.study_plans enable row level security;

-- Profiles: Students can view and update only their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Questions & Exams: Published questions readable by all; writable ONLY by admins
create policy "Anyone can view published questions"
  on public.questions for select using (is_published = true or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "Only admins can insert/update/delete questions"
  on public.questions for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "Anyone can read question options and exams"
  on public.question_options for select using (true);

create policy "Anyone can read exams"
  on public.exams for select using (true);

create policy "Anyone can read exam_questions"
  on public.exam_questions for select using (true);

-- Student Private Tables: Strict auth.uid() = user_id isolation
create policy "Users manage own test_attempts"
  on public.test_attempts for all using (auth.uid() = user_id);

create policy "Users manage own attempt_responses"
  on public.attempt_responses for all using (auth.uid() = user_id);

create policy "Users manage own bookmarks"
  on public.bookmarks for all using (auth.uid() = user_id);

create policy "Users manage own topic_mastery"
  on public.topic_mastery for all using (auth.uid() = user_id);

create policy "Users manage own ai_analysis_reports"
  on public.ai_analysis_reports for all using (auth.uid() = user_id);

create policy "Users manage own study_plans"
  on public.study_plans for all using (auth.uid() = user_id);

-- Storage Bucket Policies for Part B Drawing Uploads ('part-b-submissions')
-- Folder convention: part-b-submissions/{user_id}/{filename}
-- create policy "Students upload own drawings" on storage.objects
--   for insert to authenticated
--   with check (bucket_id = 'part-b-submissions' and (storage.foldername(name))[1] = auth.uid()::text);
-- create policy "Students view own drawings" on storage.objects
--   for select to authenticated
--   using (bucket_id = 'part-b-submissions' and (storage.foldername(name))[1] = auth.uid()::text);
`;
