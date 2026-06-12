-- =============================================================================
-- Migration 0002 — FCT food model
-- Extends public.foods to carry the Vietnamese Food Composition Table (FCT-2007)
-- model used by the app: a stable text slug, food group, refuse %, an explicit
-- serving (unit + grams of edible portion), and the micronutrients the health
-- checks rely on (sodium, calcium, iron, purine). All additive + idempotent.
--
-- RLS is unchanged: foods remain shared-read (see 0001 "foods_select_*"), so the
-- anon client can read the library; writes stay owner-scoped to custom rows.
-- =============================================================================

-- New columns (idempotent) -----------------------------------------------------
alter table public.foods add column if not exists slug          text;
alter table public.foods add column if not exists food_group    text;
alter table public.foods add column if not exists refuse_pct    numeric(5, 2) not null default 0
  check (refuse_pct >= 0 and refuse_pct < 100);
alter table public.foods add column if not exists serving_unit  text;
alter table public.foods add column if not exists serving_grams numeric(7, 2)
  check (serving_grams is null or serving_grams > 0);
alter table public.foods add column if not exists sodium_mg     numeric(8, 2)
  check (sodium_mg is null or sodium_mg >= 0);
alter table public.foods add column if not exists calcium_mg    numeric(8, 2)
  check (calcium_mg is null or calcium_mg >= 0);
alter table public.foods add column if not exists iron_mg       numeric(7, 2)
  check (iron_mg is null or iron_mg >= 0);
alter table public.foods add column if not exists purine_mg     numeric(7, 2)
  check (purine_mg is null or purine_mg >= 0);

-- Stable slug is the app-facing id for seeded library foods. A plain (non-partial)
-- unique index so PostgREST `on conflict (slug)` upserts work; Postgres treats
-- NULLs as distinct, so custom foods (slug IS NULL) are unaffected.
create unique index if not exists idx_foods_slug on public.foods (slug);

-- Browse-by-group lookups.
create index if not exists idx_foods_food_group on public.foods (food_group);
