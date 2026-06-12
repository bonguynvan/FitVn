-- =============================================================================
-- Migration 0004 — per-user data sync
-- A single jsonb blob per user holding their local app data (profile, diary,
-- workouts, measurements, markers, check-ins, meals, reminders…). Enables
-- multi-device sync (last-write-wins by updated_at) without per-table schema.
-- Owner-only via RLS.
-- =============================================================================

create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "user_data_select_own" on public.user_data
  for select using (auth.uid() = user_id);
create policy "user_data_insert_own" on public.user_data
  for insert with check (auth.uid() = user_id);
create policy "user_data_update_own" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_data_delete_own" on public.user_data
  for delete using (auth.uid() = user_id);
