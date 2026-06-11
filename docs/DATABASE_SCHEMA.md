# FitVN — Database Schema

Source of truth: [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql)
TypeScript mirror: [`types/database.types.ts`](../types/database.types.ts)

Stack: Supabase (PostgreSQL + Auth + Row Level Security). All application access
goes through the Supabase clients exported from `@/lib/supabase/server` and
`@/lib/supabase/client`. Authorization is enforced at the database layer with
RLS, so a leaked/misused client key still cannot read or write another user's data.

---

## 1. Entity overview

| Entity | Kind | Owner column | Purpose |
|---|---|---|---|
| `profiles` | per-user (1:1 with `auth.users`) | `id` | User profile, body stats, goal, macro targets, premium flag |
| `exercises` | shared library + custom | `created_by` (nullable) | Movement library; `NULL` owner = global/seeded |
| `workout_plans` | per-user | `user_id` | Weekly training template header |
| `plan_exercises` | child of `workout_plans` | via parent | Exercises per day in a plan (the real template body) |
| `workout_sessions` | per-user | `user_id` | A workout actually performed on a date |
| `session_exercises` | child of `workout_sessions` | via parent | Per-set logging (reps, weight, RPE) |
| `foods` | shared library + custom | `created_by` (nullable) | Food/macro library; `NULL` owner = global/seeded |
| `nutrition_logs` | per-user (1 per day) | `user_id` | Daily food diary header |
| `log_items` | child of `nutrition_logs` | via parent | Individual food entries per meal |
| `body_measurements` | per-user (1 per day) | `user_id` | Weight, body fat %, circumferences over time |
| `push_subscriptions` | per-user | `user_id` | Web Push endpoints for the PWA |

### Added supporting table — `plan_exercises`

The brief lists `workout_plans` as a "weekly template" but a header row alone
cannot describe a template. `plan_exercises` was added so a plan can declare
**which exercise, on which day (1–7), with target sets/reps, in what order**.
Without it, `workout_plans` would carry no exercise data and the template
feature would be non-functional. Ownership is inherited from the parent plan,
so it is RLS-protected via an `EXISTS` subquery rather than its own `user_id`.

---

## 2. Text ERD (relationships)

```
auth.users (Supabase Auth)
   │  1:1 (PK = FK, on delete cascade)
   ▼
profiles
   │
   │  auth.users.id ───────────────┐ (created_by, on delete SET NULL)
   │                               ▼
   │                          exercises ◄───────────────┐
   │                               ▲                     │ (exercise_id, RESTRICT)
   │                               │ (exercise_id,       │
   │                               │  RESTRICT)          │
auth.users.id                      │                     │
   │ (user_id, cascade)            │                     │
   ▼                               │                     │
workout_plans ──1:N──► plan_exercises                    │
   │  ▲                                                  │
   │  │ (plan_id, on delete SET NULL)                    │
   │  └──────────────────────────────┐                  │
   │ (user_id, cascade)              │                  │
   ▼                                 │                  │
workout_sessions ──1:N──► session_exercises ────────────┘
                          (session_id, cascade)

auth.users.id ─(created_by, SET NULL)─► foods ◄──────────┐
                                          ▲              │ (food_id, RESTRICT)
auth.users.id                             │              │
   │ (user_id, cascade)                   │              │
   ▼                                      │              │
nutrition_logs ──1:N──► log_items ────────┘──────────────┘
   (unique user_id+logged_on)   (log_id, cascade)

auth.users.id ─(user_id, cascade)─► body_measurements   (unique user_id+measured_on)
auth.users.id ─(user_id, cascade)─► push_subscriptions  (unique endpoint)
```

Cascade summary:
- Deleting an `auth.users` row cascades to `profiles`, `workout_plans`,
  `workout_sessions`, `nutrition_logs`, `body_measurements`,
  `push_subscriptions`, and (transitively) their children.
- `created_by` / `plan_id` on shared or optional links use `SET NULL` so a
  deleted user does not destroy global library content or historical sessions.
- `exercise_id` / `food_id` use `RESTRICT`: a library item referenced by logs
  cannot be hard-deleted, preserving historical accuracy.

---

## 3. Per-table column docs

### `profiles`
Extends `auth.users`; `id` is both PK and FK (`on delete cascade`). A row is
auto-created by the `handle_new_user()` trigger on signup.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `full_name`, `avatar_url` | text null | seeded from auth metadata if present |
| `goal` | enum `goal_type` null | `lose_fat` / `gain_muscle` / `maintain` |
| `height_cm`, `weight_kg` | numeric null | `> 0` when set |
| `activity_level` | enum `activity_level` null | `sedentary`→`very_active` |
| `date_of_birth` | date null | used for age-based TDEE |
| `sex` | enum `sex_type` null | `male` / `female` / `other` |
| `daily_calorie_target` | int null | `>= 0` |
| `protein_target_g`, `carbs_target_g`, `fat_target_g` | numeric null | macro targets, `>= 0` |
| `is_premium` | bool, default false | gates premium features |
| `created_at`, `updated_at` | timestamptz | `updated_at` maintained by trigger |

### `exercises`
Shared movement library. `created_by IS NULL` ⇒ global/seeded; a set value ⇒ a
user's custom exercise. `muscle_group` is the `muscle_group` enum.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name_vi` | text not null | Vietnamese display name |
| `name_en` | text null | English name |
| `muscle_group` | enum not null | primary muscle |
| `equipment` | text null | e.g. barbell, dumbbell, bodyweight |
| `instructions_vi` | text null | Vietnamese how-to |
| `video_url` | text null | demo link |
| `is_custom` | bool, default false | true for user-created |
| `created_by` | uuid null → auth.users | owner of custom row; `SET NULL` on user delete |
| `created_at` | timestamptz | |

### `workout_plans`
Weekly template header owned by a user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid not null → auth.users | cascade |
| `name` | text not null | |
| `description` | text null | |
| `days_per_week` | smallint null | `1..7` |
| `is_active` | bool, default false | currently followed plan |
| `created_at` | timestamptz | |

### `plan_exercises` (added)
Body of a plan: exercises scheduled per weekday.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `plan_id` | uuid not null → workout_plans | cascade |
| `day_of_week` | smallint not null | `1..7` (Mon..Sun by convention) |
| `exercise_id` | uuid not null → exercises | `RESTRICT` |
| `target_sets`, `target_reps` | smallint null | `> 0` when set |
| `order_index` | int, default 0 | display ordering within the day |
| `created_at` | timestamptz | |

### `workout_sessions`
A performed workout, optionally derived from a plan.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid not null → auth.users | cascade |
| `plan_id` | uuid null → workout_plans | `SET NULL` (keep history if plan deleted) |
| `performed_on` | date not null, default today | |
| `started_at` | timestamptz null | wall-clock start |
| `duration_min` | int null | `>= 0` |
| `notes` | text null | |
| `created_at` | timestamptz | |

### `session_exercises`
Per-set logging within a session (one row per set).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid not null → workout_sessions | cascade |
| `exercise_id` | uuid not null → exercises | `RESTRICT` |
| `set_number` | smallint, default 1 | `> 0` |
| `reps` | smallint null | `>= 0` |
| `weight_kg` | numeric null | `>= 0` |
| `rpe` | numeric(3,1) null | `0..10` rate of perceived exertion |
| `notes` | text null | |
| `order_index` | int, default 0 | |
| `created_at` | timestamptz | |

### `foods`
Food/macro library, macros normalized **per 100g**. `created_by IS NULL` ⇒
global/seeded; a set value ⇒ user custom food.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name_vi` | text not null | Vietnamese name (e.g. *Phở bò*) |
| `name_en` | text null | |
| `brand` | text null | for packaged products |
| `serving_desc` | text null | human-readable serving hint |
| `calories_per_100g` | numeric not null | `>= 0` |
| `protein_g`, `carbs_g`, `fat_g` | numeric not null, default 0 | per 100g, `>= 0` |
| `fiber_g` | numeric null | `>= 0` when set |
| `is_vietnamese` | bool, default true | local-food filter |
| `is_verified` | bool, default false | curated/trusted entry |
| `created_by` | uuid null → auth.users | owner of custom row; `SET NULL` |
| `created_at` | timestamptz | |

### `nutrition_logs`
Daily food diary header. `unique (user_id, logged_on)` — one diary per day.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid not null → auth.users | cascade |
| `logged_on` | date not null, default today | |
| `notes` | text null | |
| `created_at` | timestamptz | |

### `log_items`
Food entries inside a diary.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `log_id` | uuid not null → nutrition_logs | cascade |
| `food_id` | uuid not null → foods | `RESTRICT` |
| `meal_type` | enum `meal_type` not null | breakfast/lunch/dinner/snack |
| `quantity` | numeric not null | `> 0` |
| `unit` | text not null, default `'g'` | unit for `quantity` |
| `created_at` | timestamptz | |

### `body_measurements`
Body progress snapshots. `unique (user_id, measured_on)`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid not null → auth.users | cascade |
| `measured_on` | date not null, default today | |
| `weight_kg` | numeric null | `> 0` |
| `body_fat_pct` | numeric null | `0..100` |
| `waist_cm`, `chest_cm`, `hip_cm`, `arm_cm`, `thigh_cm` | numeric null | `> 0` |
| `notes` | text null | |
| `created_at` | timestamptz | |

### `push_subscriptions`
Web Push subscriptions for PWA notifications. `endpoint` is globally unique.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid not null → auth.users | cascade |
| `endpoint` | text not null, **unique** | push service endpoint URL |
| `p256dh` | text not null | client public key |
| `auth` | text not null | client auth secret |
| `user_agent` | text null | device/browser hint |
| `created_at` | timestamptz | |

---

## 4. Triggers & functions

- **`set_updated_at()`** — `BEFORE UPDATE` trigger sets `updated_at = now()`.
  Attached to `profiles` (the only table carrying an `updated_at` column).
- **`handle_new_user()`** — `SECURITY DEFINER`, `AFTER INSERT` on `auth.users`.
  Inserts a matching `profiles` row, copying `full_name`/`avatar_url` from
  `raw_user_meta_data` when available. `search_path` is pinned to `public` to
  avoid search-path injection in a `SECURITY DEFINER` function.

---

## 5. RLS strategy & rationale

RLS is enabled on **every** table. There are no public/anon-readable tables; all
policies target authenticated users. Three policy shapes are used:

1. **Direct owner** (`profiles`, `workout_plans`, `workout_sessions`,
   `nutrition_logs`, `body_measurements`, `push_subscriptions`)
   - `profiles`: `auth.uid() = id` (PK is the user id).
   - others: `auth.uid() = user_id`.
   - Full CRUD: separate `select` / `insert` (`WITH CHECK`) /
     `update` (`USING` + `WITH CHECK`) / `delete` (`USING`) policies so a user
     can only ever touch their own rows, and `update` cannot reassign ownership.

2. **Shared library, owner-write** (`exercises`, `foods`)
   - `SELECT`: `to authenticated using (true)` — any logged-in user can browse
     the whole library, including global rows and other users' custom rows.
     This is a deliberate tradeoff: library rows hold non-sensitive reference
     data (a food's macros, an exercise's instructions), and a single shared
     read policy keeps cross-library search simple and fast. User-specific
     privacy lives in the *log/diary/session* tables, never in the library.
     If custom-row privacy is later required, tighten this to
     `using (created_by is null or created_by = auth.uid())`.
   - `INSERT/UPDATE/DELETE`: gated on `auth.uid() = created_by`, so a user may
     only mutate their own custom rows and can never edit/delete seeded global
     rows (which have `created_by IS NULL`).

3. **Child via parent `EXISTS`** (`plan_exercises`, `session_exercises`,
   `log_items`)
   - These have no `user_id`; ownership is derived from the parent row. Every
     policy uses an `EXISTS (select 1 from <parent> where <parent>.id = child.<fk>
     and <parent>.user_id = auth.uid())` check for both `USING` and `WITH CHECK`.
   - This prevents inserting a child that points at another user's parent and
     prevents reading/altering children of someone else's plan/session/log.
   - Backed by an index on the child FK so the subquery is an index lookup.

Why DB-level (not app-level) authorization: the Next.js server and browser
clients both use Supabase keys; enforcing ownership in SQL guarantees isolation
even if application code has a bug or a client is used directly.

---

## 6. Indexing rationale

| Index | Reason |
|---|---|
| `exercises(created_by)`, `foods(created_by)` | filter a user's custom items; supports owner-write RLS checks |
| `workout_plans(user_id)` | list a user's plans; speeds `plan_exercises` RLS `EXISTS` |
| `plan_exercises(plan_id)`, `plan_exercises(exercise_id)` | parent lookup (RLS + joins), FK integrity |
| `workout_sessions(plan_id)` | join session → plan |
| `session_exercises(session_id)` | parent lookup powering RLS `EXISTS` + set listing |
| `session_exercises(exercise_id)` | per-exercise progress queries, FK |
| `log_items(log_id)` | parent lookup powering RLS `EXISTS` + diary expansion |
| `log_items(food_id)` | per-food queries, FK |
| `push_subscriptions(user_id)` | fan-out push to a user's devices |
| `nutrition_logs(user_id, logged_on desc)` | dominant query: a user's recent diaries |
| `workout_sessions(user_id, performed_on desc)` | a user's recent workouts |
| `body_measurements(user_id, measured_on desc)` | progress chart over time |
| `foods(is_vietnamese)` | filter library to local foods |
| `foods USING gin (name_vi gin_trgm_ops)` | fuzzy/substring food search by Vietnamese name (`pg_trgm`) |

Principles: every foreign key is indexed (keeps cascade deletes and RLS `EXISTS`
subqueries fast), and the hot "list my recent X" access pattern is served by a
composite `(user_id, date desc)` index so the database can satisfy it with an
index range scan rather than a sort.

---

## 7. Seed data

The migration seeds global library content (idempotent via `ON CONFLICT DO
NOTHING` on deterministic UUIDs, `created_by IS NULL`):

- **~10 Vietnamese foods** (per 100g): Phở bò, Cơm trắng, Ức gà luộc, Cơm tấm
  sườn, Bún bò, Trứng gà, Chuối, Sữa tươi, Đậu phụ, Khoai lang.
- **~8 exercises** with Vietnamese names: Squat, Deadlift, Bench Press, Overhead
  Press, Pull-up, Barbell Row, Plank, Lunge.
