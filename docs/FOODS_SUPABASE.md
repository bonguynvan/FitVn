# Food library: Supabase + Dexie

The food library has three layers (priority order):

1. **Supabase `public.foods`** — source of truth when configured. Lets the
   dataset grow past the bundle toward the full FCT-2007 (526 foods).
2. **Dexie `libraryFoods`** — offline cache of the last successful remote fetch.
3. **Bundled `lib/data/foods-db.ts`** — ~526 curated foods, always available,
   zero-latency, works fully offline.

`useAllFoods()` (custom foods + `useLibraryFoods()`) starts with the bundle and
upgrades to cache/remote after mount. **The app works with no Supabase config** —
remote is a progressive enhancement, never a requirement.

## How it resolves

- `loadFoodLibrary()` → `refreshFoodLibrary()` (only if env present + online):
  fetch `foods`, map rows → `FoodItem`, replace the Dexie cache.
- If remote is unconfigured/offline/fails, returns the Dexie cache ∪ bundle.
- Every remote call is wrapped in try/catch — a library failure never breaks the
  nutrition screen.

## Enabling remote

1. Apply migrations to your Supabase project (SQL editor or CLI):
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_foods_fct.sql` (adds slug, food_group, refuse %,
     serving unit/grams, sodium/calcium/iron/purine; shared-read RLS unchanged).
2. Set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; for seeding)
3. Seed the library from the bundled foods (idempotent, upserts on `slug`):
   ```
   npm run seed:foods
   ```
   Re-run after expanding `foods-db.ts` — only changed/new rows are written.

## Notes

- Seeded library ids use the stable **slug** (`FoodItem.id`), so logged
  `foodId`s stay consistent whether served from bundle, cache, or remote.
- Logging itself is still local (localStorage) for now; this wires only the
  library read path. Migrating user logs to Supabase is a separate step.
