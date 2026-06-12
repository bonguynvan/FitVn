-- =============================================================================
-- Migration 0003 — public read for the shared food library
-- The app's browser client reads foods with the ANON key (it does not use
-- Supabase auth for the library), so the global food library must be readable
-- without authentication. Custom foods (created_by set) stay owner-scoped.
-- =============================================================================

drop policy if exists "foods_select_authenticated" on public.foods;

create policy "foods_select_public" on public.foods
  for select
  using (created_by is null or auth.uid() = created_by);
