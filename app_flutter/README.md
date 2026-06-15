# FitVN — Flutter app (Phase 2)

Native iOS + Android client. Shares the **same Supabase backend** as the web app
and the **same domain logic** via the `fitvn_domain` package (Phase 1).

## What's built

- **Phase 2 — data layer:** Drift local store, Supabase sync, auth/profile repos.
- **Phase 3a — theme + onboarding:** ported design tokens, shared widgets
  (incl. the free-typing `NumberField`), and the onboarding flow.
- **Phase 3b — app shell + screens:** bottom-tab `MainShell` (Trang chủ · Lịch
  tập · Dinh dưỡng · HLV AI · Tiến độ), a data-driven Home, an editable Profile,
  a working Coach chat (calls the Edge Function), and data-aware preview screens
  for Workouts / Nutrition / Progress. `RootGate` shows onboarding until a
  profile exists, then the shell.

- **Phase 4a — nutrition logging:** log meals against a seed food catalog →
  pending log item + sync-queue entry in Drift, with live consumed-vs-target
  totals on Nutrition + Home.
- **Phase 4b — sync trigger + workout logging:** `SyncController` drains the
  queue on startup and on connectivity changes (connectivity_plus), with a
  pending-count + manual "sync now" row on Profile. Workout logging builds a
  session (exercise + sets) → pending workout session enqueued for sync;
  Workouts shows today's sessions.

- **Phase 4c — food library + offline search:** `FoodRepository` searches
  Supabase `foods` when online (caching hits into Drift `cachedFoods`) and falls
  back to the cache offline; the bundle seeds the cache on first run. The
  add-food sheet now searches the library (debounced); logged-item macros
  resolve from the cached-food index.

- **Phase 5 — health markers + charts:** local `HealthReadings` Drift table
  (schema v2 + migration), log readings for the 8 markers, reference-range
  evaluation via fitvn_domain, trend sparklines + a history chart
  (dependency-free `LineChart` CustomPainter). Lives in the Progress tab.

- **Phase 6 — notifications:** local daily reminders (meals + workout) via
  flutter_local_notifications + timezone — fully offline, scheduled from a
  Reminders section on Profile. Server push (FCM/APNs) is scaffolded in
  `core/push.dart` but **not initialized** — it needs `flutterfire configure`
  + native config (google-services.json, APNs key, capabilities); wire it from
  `main` once that's done.

- **Phase 7 — Apple Health / Google Fit:** read-only integration via the
  `health` package (`core/health_integration.dart`). Profile card imports the
  latest body weight (recomputing targets); Home shows today's steps when
  available. Fails soft when unsupported/denied. **Requires native setup** —
  HealthKit capability + Info.plist usage strings (iOS), Health Connect
  permissions (Android).

- **Phase 8 — weight history + charts:** local `BodyMeasurements` Drift table
  (schema v3 + migration) for weight + optional body-fat % / waist. Progress tab
  shows weight (and body-fat/waist when present) trend cards with `LineChart` +
  delta, a history list, and an add sheet. Logging a measurement also updates
  the profile's current weight (recomputing targets).

- **Phase 9 — health/measurement Supabase sync:** new `health_readings` +
  `body_measurements` tables (migration 0005, owner-only RLS). Local tables
  gained sync fields (schema v4 migration); adding a reading/measurement
  enqueues a sync op when Supabase is configured, and `SyncService` pushes them
  (idempotent via `remoteId`). Pre-existing local rows aren't back-filled.

- **Phase 10 — downstream pull sync:** `PullService` fetches the user's remote
  health readings + body measurements after each push and merges any not present
  locally (deduped by `remoteId`, inserted as 'synced', never re-enqueued) —
  multi-device additive sync. Runs in `SyncController.syncNow` after the push;
  skipped in local-only mode. Deletions aren't propagated yet.

Remaining for later phases: finishing FCM wiring, writing data back to Health,
and propagating deletions / conflict resolution in pull sync.

### Original phase-2 layout

```
lib/
  main.dart                     app entry; initializes Supabase (no-op if unconfigured)
  src/
    app/
      app.dart                  MaterialApp.router + placeholder theme
      router.dart               go_router (placeholder home for now)
      providers.dart            Riverpod DI: db, repositories, sync, coach
    core/
      env.dart                  --dart-define config (Supabase URL/key, coach endpoint)
      supabase.dart             client bootstrap
    data/
      local/
        tables.dart             Drift tables — 1:1 with the web Dexie schema
        database.dart           AppDatabase + sync-queue DAO  (needs codegen)
      sync/
        sync_service.dart       offline → Supabase push, ported from lib/db/sync.ts
        sync_models.dart        SyncSummary, outcomes, retry cap
      repositories/
        auth_repository.dart    email/password + Google, ported from app/login/actions.ts
        profile_repository.dart profiles row ↔ fitvn_domain UserProfile
    features/
      coach/
        coach_client.dart       calls the coach Edge Function
```

The coach backend moved to a Supabase Edge Function: `../supabase/functions/coach`.

## Bootstrap (run locally — requires the Flutter SDK)

This directory holds only `lib/` + config. Materialize the platform folders and
generate code on your machine:

```bash
cd app_flutter

# 1. Create the android/ios/etc folders WITHOUT touching lib/
flutter create . --org com.fitvn --project-name fitvn

# 2. Dependencies
flutter pub get

# 3. Drift codegen (creates lib/src/data/local/database.g.dart)
dart run build_runner build --delete-conflicting-outputs

# 4. Analyze + run
flutter analyze
flutter run \
  --dart-define=SUPABASE_URL=https://YOURPROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ... \
  --dart-define=COACH_ENDPOINT=https://YOURPROJECT.functions.supabase.co/coach
```

Without the `--dart-define`s the app runs **local-only** (Drift cache + the
coach's deterministic fallback), mirroring the web app's "runs without a
backend" behavior.

## Parity notes & known gaps

- **Sync** mirrors the web FIFO queue exactly: idempotent (skips records with a
  `remoteId`), resilient (per-entry error + attempt count, capped at 5), and
  single-flight. Supabase errors surface as thrown `PostgrestException`s, caught
  by the pass loop.
- **Profile schema gap:** `profiles` stores `date_of_birth` (age is derived) and
  has no `targetWeightKg` / `conditions` columns. Those stay client-local until a
  migration adds them — see `profile_repository.dart`.
- **Coach:** request/response only for now; token streaming + porting the rich
  system prompt and local-coach fallback are tracked for phase 2.5 / 3.

## Verifying without running the app

The pure-logic package has full tests: `cd ../packages/fitvn_domain && dart test`.
Sync-service tests need a fake Supabase layer (planned alongside Phase 3).
