-- =============================================================================
-- Migration 0005 — health markers & body measurements
-- Per-user health-marker readings and body measurements, synced from the native
-- app's offline queue. Owner-only via RLS. (The web app keeps these local for
-- now; this lets the native client push them to the cloud.)
-- =============================================================================

create table if not exists public.health_readings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  marker      text not null,             -- MarkerKey wire value
  value       double precision not null,
  value2      double precision,          -- e.g. diastolic
  measured_on date not null,
  created_at  timestamptz not null default now()
);

create index if not exists health_readings_user_idx
  on public.health_readings (user_id, measured_on desc);

alter table public.health_readings enable row level security;

create policy "health_readings_select_own" on public.health_readings
  for select using (auth.uid() = user_id);
create policy "health_readings_insert_own" on public.health_readings
  for insert with check (auth.uid() = user_id);
create policy "health_readings_update_own" on public.health_readings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "health_readings_delete_own" on public.health_readings
  for delete using (auth.uid() = user_id);

create table if not exists public.body_measurements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  measured_on  date not null,
  weight_kg    double precision not null,
  body_fat_pct double precision,
  waist_cm     double precision,
  created_at   timestamptz not null default now()
);

create index if not exists body_measurements_user_idx
  on public.body_measurements (user_id, measured_on desc);

alter table public.body_measurements enable row level security;

create policy "body_measurements_select_own" on public.body_measurements
  for select using (auth.uid() = user_id);
create policy "body_measurements_insert_own" on public.body_measurements
  for insert with check (auth.uid() = user_id);
create policy "body_measurements_update_own" on public.body_measurements
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "body_measurements_delete_own" on public.body_measurements
  for delete using (auth.uid() = user_id);
