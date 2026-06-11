-- =============================================================================
-- FitVN — Initial database schema
-- Migration: 0001_initial_schema.sql
-- Stack: Supabase (Postgres + Auth + Row Level Security)
--
-- Conventions
--   * All user-owned tables enforce Row Level Security (RLS).
--   * Shared library tables (exercises, foods) are readable by any
--     authenticated user; write access is limited to the row owner
--     (created_by = auth.uid()) for custom entries.
--   * Child tables (plan_exercises, session_exercises, log_items) inherit
--     ownership from their parent via EXISTS subqueries.
--   * Timestamps are timestamptz; "*_on" columns are plain date.
--   * Enumerated domains are modeled as Postgres ENUM types for type safety
--     and to keep the generated/hand-written TS types in sync.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
-- pgcrypto provides gen_random_uuid() for UUID primary keys.
create extension if not exists "pgcrypto";
-- pg_trgm powers trigram indexes for fuzzy food name search (name_vi).
create extension if not exists "pg_trgm";

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_type') then
    create type public.goal_type as enum ('lose_fat', 'gain_muscle', 'maintain');
  end if;

  if not exists (select 1 from pg_type where typname = 'activity_level') then
    create type public.activity_level as enum (
      'sedentary', 'light', 'moderate', 'active', 'very_active'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'sex_type') then
    create type public.sex_type as enum ('male', 'female', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'muscle_group') then
    create type public.muscle_group as enum (
      'chest', 'back', 'shoulders', 'biceps', 'triceps',
      'legs', 'glutes', 'core', 'full_body', 'cardio'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'meal_type') then
    create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- updated_at trigger function
-- Sets NEW.updated_at on every UPDATE for tables that carry the column.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- TABLE: profiles
-- Extends auth.users 1:1. Primary key IS the auth user id.
-- =============================================================================
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  full_name             text,
  avatar_url            text,
  goal                  public.goal_type,
  height_cm             numeric(5, 2) check (height_cm is null or height_cm > 0),
  weight_kg             numeric(6, 2) check (weight_kg is null or weight_kg > 0),
  activity_level        public.activity_level,
  date_of_birth         date,
  sex                   public.sex_type,
  daily_calorie_target  integer check (daily_calorie_target is null or daily_calorie_target >= 0),
  protein_target_g      numeric(6, 2) check (protein_target_g is null or protein_target_g >= 0),
  carbs_target_g        numeric(6, 2) check (carbs_target_g is null or carbs_target_g >= 0),
  fat_target_g          numeric(6, 2) check (fat_target_g is null or fat_target_g >= 0),
  is_premium            boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- TABLE: exercises  (shared library + per-user custom entries)
-- created_by is NULL for seeded/global exercises; set for custom ones.
-- =============================================================================
create table if not exists public.exercises (
  id                uuid primary key default gen_random_uuid(),
  name_vi           text not null,
  name_en           text,
  muscle_group      public.muscle_group not null,
  equipment         text,
  instructions_vi   text,
  video_url         text,
  is_custom         boolean not null default false,
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now()
);

-- =============================================================================
-- TABLE: workout_plans  (weekly template owned by a user)
-- =============================================================================
create table if not exists public.workout_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  description     text,
  days_per_week   smallint check (days_per_week is null or (days_per_week between 1 and 7)),
  is_active       boolean not null default false,
  created_at      timestamptz not null default now()
);

-- =============================================================================
-- TABLE: plan_exercises  (ADDED supporting table)
-- Makes a workout_plan a real weekly template: which exercises on which day,
-- with target sets/reps and an explicit ordering. Ownership is derived from
-- the parent workout_plans.user_id.
-- =============================================================================
create table if not exists public.plan_exercises (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.workout_plans (id) on delete cascade,
  day_of_week   smallint not null check (day_of_week between 1 and 7),
  exercise_id   uuid not null references public.exercises (id) on delete restrict,
  target_sets   smallint check (target_sets is null or target_sets > 0),
  target_reps   smallint check (target_reps is null or target_reps > 0),
  order_index   integer not null default 0,
  created_at    timestamptz not null default now()
);

-- =============================================================================
-- TABLE: workout_sessions  (a performed workout, optionally from a plan)
-- =============================================================================
create table if not exists public.workout_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  plan_id         uuid references public.workout_plans (id) on delete set null,
  performed_on    date not null default current_date,
  started_at      timestamptz,
  duration_min    integer check (duration_min is null or duration_min >= 0),
  notes           text,
  created_at      timestamptz not null default now()
);

-- =============================================================================
-- TABLE: session_exercises  (per-set logging within a session)
-- Ownership derived from parent workout_sessions.user_id.
-- =============================================================================
create table if not exists public.session_exercises (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id   uuid not null references public.exercises (id) on delete restrict,
  set_number    smallint not null default 1 check (set_number > 0),
  reps          smallint check (reps is null or reps >= 0),
  weight_kg     numeric(6, 2) check (weight_kg is null or weight_kg >= 0),
  rpe           numeric(3, 1) check (rpe is null or (rpe >= 0 and rpe <= 10)),
  notes         text,
  order_index   integer not null default 0,
  created_at    timestamptz not null default now()
);

-- =============================================================================
-- TABLE: foods  (shared library + per-user custom entries)
-- Macros normalized per 100g. created_by NULL for seeded/global foods.
-- =============================================================================
create table if not exists public.foods (
  id                  uuid primary key default gen_random_uuid(),
  name_vi             text not null,
  name_en             text,
  brand               text,
  serving_desc        text,
  calories_per_100g   numeric(7, 2) not null check (calories_per_100g >= 0),
  protein_g           numeric(6, 2) not null default 0 check (protein_g >= 0),
  carbs_g             numeric(6, 2) not null default 0 check (carbs_g >= 0),
  fat_g               numeric(6, 2) not null default 0 check (fat_g >= 0),
  fiber_g             numeric(6, 2) check (fiber_g is null or fiber_g >= 0),
  is_vietnamese       boolean not null default true,
  is_verified         boolean not null default false,
  created_by          uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now()
);

-- =============================================================================
-- TABLE: nutrition_logs  (one diary per user per day)
-- =============================================================================
create table if not exists public.nutrition_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  logged_on   date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, logged_on)
);

-- =============================================================================
-- TABLE: log_items  (food entries inside a nutrition_log)
-- Ownership derived from parent nutrition_logs.user_id.
-- =============================================================================
create table if not exists public.log_items (
  id          uuid primary key default gen_random_uuid(),
  log_id      uuid not null references public.nutrition_logs (id) on delete cascade,
  food_id     uuid not null references public.foods (id) on delete restrict,
  meal_type   public.meal_type not null,
  quantity    numeric(8, 2) not null check (quantity > 0),
  unit        text not null default 'g',
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- TABLE: body_measurements  (one snapshot per user per day)
-- =============================================================================
create table if not exists public.body_measurements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  measured_on   date not null default current_date,
  weight_kg     numeric(6, 2) check (weight_kg is null or weight_kg > 0),
  body_fat_pct  numeric(5, 2) check (body_fat_pct is null or (body_fat_pct >= 0 and body_fat_pct <= 100)),
  waist_cm      numeric(5, 2) check (waist_cm is null or waist_cm > 0),
  chest_cm      numeric(5, 2) check (chest_cm is null or chest_cm > 0),
  hip_cm        numeric(5, 2) check (hip_cm is null or hip_cm > 0),
  arm_cm        numeric(5, 2) check (arm_cm is null or arm_cm > 0),
  thigh_cm      numeric(5, 2) check (thigh_cm is null or thigh_cm > 0),
  notes         text,
  created_at    timestamptz not null default now(),
  unique (user_id, measured_on)
);

-- =============================================================================
-- TABLE: push_subscriptions  (Web Push endpoints for the PWA)
-- One row per browser/device subscription. endpoint is globally unique.
-- =============================================================================
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- handle_new_user(): auto-create a profiles row when an auth user is created.
-- SECURITY DEFINER so it can insert into public.profiles regardless of RLS.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- Enable RLS on every table, then declare explicit policies.
-- =============================================================================
alter table public.profiles            enable row level security;
alter table public.exercises           enable row level security;
alter table public.workout_plans       enable row level security;
alter table public.plan_exercises      enable row level security;
alter table public.workout_sessions    enable row level security;
alter table public.session_exercises   enable row level security;
alter table public.foods               enable row level security;
alter table public.nutrition_logs      enable row level security;
alter table public.log_items           enable row level security;
alter table public.body_measurements   enable row level security;
alter table public.push_subscriptions  enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: owner-scoped via id = auth.uid()
-- ---------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- exercises: shared read, owner-only write of custom rows
-- ---------------------------------------------------------------------------
create policy "exercises_select_authenticated" on public.exercises
  for select to authenticated using (true);
create policy "exercises_insert_own" on public.exercises
  for insert to authenticated with check (auth.uid() = created_by);
create policy "exercises_update_own" on public.exercises
  for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "exercises_delete_own" on public.exercises
  for delete to authenticated using (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- foods: shared read, owner-only write of custom rows
-- ---------------------------------------------------------------------------
create policy "foods_select_authenticated" on public.foods
  for select to authenticated using (true);
create policy "foods_insert_own" on public.foods
  for insert to authenticated with check (auth.uid() = created_by);
create policy "foods_update_own" on public.foods
  for update to authenticated using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "foods_delete_own" on public.foods
  for delete to authenticated using (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- workout_plans: owner-scoped via user_id = auth.uid()
-- ---------------------------------------------------------------------------
create policy "workout_plans_select_own" on public.workout_plans
  for select using (auth.uid() = user_id);
create policy "workout_plans_insert_own" on public.workout_plans
  for insert with check (auth.uid() = user_id);
create policy "workout_plans_update_own" on public.workout_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_plans_delete_own" on public.workout_plans
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- plan_exercises: scoped through parent workout_plans.user_id
-- ---------------------------------------------------------------------------
create policy "plan_exercises_select_own" on public.plan_exercises
  for select using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_exercises.plan_id and wp.user_id = auth.uid()
    )
  );
create policy "plan_exercises_insert_own" on public.plan_exercises
  for insert with check (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_exercises.plan_id and wp.user_id = auth.uid()
    )
  );
create policy "plan_exercises_update_own" on public.plan_exercises
  for update using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_exercises.plan_id and wp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_exercises.plan_id and wp.user_id = auth.uid()
    )
  );
create policy "plan_exercises_delete_own" on public.plan_exercises
  for delete using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = plan_exercises.plan_id and wp.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- workout_sessions: owner-scoped via user_id = auth.uid()
-- ---------------------------------------------------------------------------
create policy "workout_sessions_select_own" on public.workout_sessions
  for select using (auth.uid() = user_id);
create policy "workout_sessions_insert_own" on public.workout_sessions
  for insert with check (auth.uid() = user_id);
create policy "workout_sessions_update_own" on public.workout_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_sessions_delete_own" on public.workout_sessions
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- session_exercises: scoped through parent workout_sessions.user_id
-- ---------------------------------------------------------------------------
create policy "session_exercises_select_own" on public.session_exercises
  for select using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.user_id = auth.uid()
    )
  );
create policy "session_exercises_insert_own" on public.session_exercises
  for insert with check (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.user_id = auth.uid()
    )
  );
create policy "session_exercises_update_own" on public.session_exercises
  for update using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.user_id = auth.uid()
    )
  );
create policy "session_exercises_delete_own" on public.session_exercises
  for delete using (
    exists (
      select 1 from public.workout_sessions ws
      where ws.id = session_exercises.session_id and ws.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- nutrition_logs: owner-scoped via user_id = auth.uid()
-- ---------------------------------------------------------------------------
create policy "nutrition_logs_select_own" on public.nutrition_logs
  for select using (auth.uid() = user_id);
create policy "nutrition_logs_insert_own" on public.nutrition_logs
  for insert with check (auth.uid() = user_id);
create policy "nutrition_logs_update_own" on public.nutrition_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "nutrition_logs_delete_own" on public.nutrition_logs
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- log_items: scoped through parent nutrition_logs.user_id
-- ---------------------------------------------------------------------------
create policy "log_items_select_own" on public.log_items
  for select using (
    exists (
      select 1 from public.nutrition_logs nl
      where nl.id = log_items.log_id and nl.user_id = auth.uid()
    )
  );
create policy "log_items_insert_own" on public.log_items
  for insert with check (
    exists (
      select 1 from public.nutrition_logs nl
      where nl.id = log_items.log_id and nl.user_id = auth.uid()
    )
  );
create policy "log_items_update_own" on public.log_items
  for update using (
    exists (
      select 1 from public.nutrition_logs nl
      where nl.id = log_items.log_id and nl.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.nutrition_logs nl
      where nl.id = log_items.log_id and nl.user_id = auth.uid()
    )
  );
create policy "log_items_delete_own" on public.log_items
  for delete using (
    exists (
      select 1 from public.nutrition_logs nl
      where nl.id = log_items.log_id and nl.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- body_measurements: owner-scoped via user_id = auth.uid()
-- ---------------------------------------------------------------------------
create policy "body_measurements_select_own" on public.body_measurements
  for select using (auth.uid() = user_id);
create policy "body_measurements_insert_own" on public.body_measurements
  for insert with check (auth.uid() = user_id);
create policy "body_measurements_update_own" on public.body_measurements
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "body_measurements_delete_own" on public.body_measurements
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- push_subscriptions: owner-scoped via user_id = auth.uid()
-- ---------------------------------------------------------------------------
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- Indexes
-- Rationale:
--   * Every foreign key gets an index so cascade deletes and joins stay fast
--     and RLS EXISTS subqueries can use index lookups.
--   * Composite (user_id, *_on desc) indexes match the dominant access pattern:
--     "give me this user's most recent diary / sessions / measurements".
--   * A GIN trigram index on foods.name_vi powers fuzzy/substring food search.
--   * foods(is_vietnamese) supports filtering the library to local foods.
-- =============================================================================

-- Foreign-key / parent-lookup indexes
create index if not exists idx_exercises_created_by          on public.exercises (created_by);
create index if not exists idx_foods_created_by              on public.foods (created_by);

create index if not exists idx_workout_plans_user_id         on public.workout_plans (user_id);

create index if not exists idx_plan_exercises_plan_id        on public.plan_exercises (plan_id);
create index if not exists idx_plan_exercises_exercise_id    on public.plan_exercises (exercise_id);

create index if not exists idx_workout_sessions_plan_id      on public.workout_sessions (plan_id);

create index if not exists idx_session_exercises_session_id  on public.session_exercises (session_id);
create index if not exists idx_session_exercises_exercise_id on public.session_exercises (exercise_id);

create index if not exists idx_log_items_log_id              on public.log_items (log_id);
create index if not exists idx_log_items_food_id             on public.log_items (food_id);

create index if not exists idx_push_subscriptions_user_id    on public.push_subscriptions (user_id);

-- Common query (recency) indexes
create index if not exists idx_nutrition_logs_user_logged_on
  on public.nutrition_logs (user_id, logged_on desc);
create index if not exists idx_workout_sessions_user_performed_on
  on public.workout_sessions (user_id, performed_on desc);
create index if not exists idx_body_measurements_user_measured_on
  on public.body_measurements (user_id, measured_on desc);

-- Food library search / filter indexes
create index if not exists idx_foods_is_vietnamese on public.foods (is_vietnamese);
create index if not exists idx_foods_name_vi_trgm
  on public.foods using gin (name_vi gin_trgm_ops);

-- =============================================================================
-- Seed data
-- Global library rows (created_by IS NULL, is_custom = false, is_verified = true).
-- Deterministic UUIDs keep ON CONFLICT idempotent across re-runs.
-- Food macros are per 100g, approximate but realistic.
-- =============================================================================

-- ~10 Vietnamese foods --------------------------------------------------------
insert into public.foods
  (id, name_vi, name_en, serving_desc, calories_per_100g, protein_g, carbs_g, fat_g, fiber_g, is_vietnamese, is_verified)
values
  ('a0000000-0000-4000-8000-000000000001', 'Phở bò',          'Beef pho',              '1 tô (~500g)', 76,  5.0,  10.0, 1.8, 0.3, true, true),
  ('a0000000-0000-4000-8000-000000000002', 'Cơm trắng',       'Steamed white rice',    '1 chén (~150g)', 130, 2.7,  28.0, 0.3, 0.4, true, true),
  ('a0000000-0000-4000-8000-000000000003', 'Ức gà luộc',      'Boiled chicken breast', '1 miếng (~120g)', 165, 31.0, 0.0,  3.6, 0.0, true, true),
  ('a0000000-0000-4000-8000-000000000004', 'Cơm tấm sườn',    'Broken rice w/ pork',   '1 dĩa (~400g)', 185, 9.0,  24.0, 6.0, 0.6, true, true),
  ('a0000000-0000-4000-8000-000000000005', 'Bún bò',          'Spicy beef noodle soup','1 tô (~500g)', 89,  6.5,  9.5,  2.8, 0.4, true, true),
  ('a0000000-0000-4000-8000-000000000006', 'Trứng gà',        'Chicken egg',           '1 quả (~50g)', 155, 13.0, 1.1,  11.0, 0.0, true, true),
  ('a0000000-0000-4000-8000-000000000007', 'Chuối',           'Banana',                '1 quả (~120g)', 89,  1.1,  22.8, 0.3, 2.6, true, true),
  ('a0000000-0000-4000-8000-000000000008', 'Sữa tươi',        'Fresh milk',            '1 ly (~240ml)', 64,  3.3,  4.8,  3.6, 0.0, true, true),
  ('a0000000-0000-4000-8000-000000000009', 'Đậu phụ',         'Tofu',                  '1 bìa (~100g)', 76,  8.0,  1.9,  4.8, 0.3, true, true),
  ('a0000000-0000-4000-8000-00000000000a', 'Khoai lang',      'Sweet potato',          '1 củ (~150g)', 86,  1.6,  20.1, 0.1, 3.0, true, true)
on conflict (id) do nothing;

-- ~8 common exercises ---------------------------------------------------------
insert into public.exercises
  (id, name_vi, name_en, muscle_group, equipment, instructions_vi, is_custom)
values
  ('b0000000-0000-4000-8000-000000000001', 'Squat (Gánh tạ)',         'Squat',          'legs',      'barbell',    'Đứng thẳng, hạ hông xuống như ngồi ghế, giữ lưng thẳng rồi đẩy lên.', false),
  ('b0000000-0000-4000-8000-000000000002', 'Deadlift (Nâng tạ)',      'Deadlift',       'back',      'barbell',    'Giữ lưng thẳng, nâng tạ từ sàn lên bằng lực hông và chân.',         false),
  ('b0000000-0000-4000-8000-000000000003', 'Bench Press (Đẩy ngực)',  'Bench Press',    'chest',     'barbell',    'Nằm trên ghế, hạ tạ xuống ngực rồi đẩy thẳng lên.',                 false),
  ('b0000000-0000-4000-8000-000000000004', 'Overhead Press (Đẩy vai)','Overhead Press', 'shoulders', 'barbell',    'Đứng thẳng, đẩy tạ từ vai lên qua đầu.',                            false),
  ('b0000000-0000-4000-8000-000000000005', 'Pull-up (Hít xà)',        'Pull-up',        'back',      'bodyweight', 'Treo người trên xà, kéo cằm lên qua thanh xà.',                     false),
  ('b0000000-0000-4000-8000-000000000006', 'Barbell Row (Chèo tạ)',   'Barbell Row',    'back',      'barbell',    'Gập người, kéo tạ về phía bụng dưới rồi hạ xuống.',                 false),
  ('b0000000-0000-4000-8000-000000000007', 'Plank',                   'Plank',          'core',      'bodyweight', 'Chống khuỷu tay, giữ thân thẳng song song mặt sàn.',                false),
  ('b0000000-0000-4000-8000-000000000008', 'Lunge (Chùng chân)',      'Lunge',          'legs',      'dumbbell',   'Bước một chân tới trước, hạ gối sau gần sàn rồi đẩy về.',           false)
on conflict (id) do nothing;
