# FitVN — Flutter app (Phase 2)

Native iOS + Android client. Shares the **same Supabase backend** as the web app
and the **same domain logic** via the `fitvn_domain` package (Phase 1).

## What's in this phase

Phase 2 builds the **data layer + app shell** — no real screens yet (Phase 3).

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
