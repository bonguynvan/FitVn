# fitvn_domain

Pure-Dart **domain core** for FitVN — the language-agnostic source of truth for:

- **Nutrition targets** — Mifflin-St Jeor BMR → TDEE → goal/macro split (`computeTargets`)
- **Body-metric validation** — bounds + clamping applied on confirm, never while typing (`clampProfileMetrics`)
- **Health markers** — adult reference ranges, status evaluation, Vietnamese advice (`markers`)
- **Health conditions** — opt-in tuning of limits and coach focus (`conditions`)

This package is **Phase 1** of the Flutter migration. It has **no Flutter dependency** — only `dart:core`/`dart:math` — so it can be shared by the Flutter app, a CLI, or tests, and its logic is verified in isolation.

## Parity contract

Every file here is a 1:1 port of the TypeScript web app:

| Dart | TypeScript source |
|---|---|
| `src/targets.dart` | `lib/fitness/targets.ts` |
| `src/profile_bounds.dart` | `lib/fitness/profile-bounds.ts` |
| `src/markers.dart` | `lib/health/markers.ts` |
| `src/conditions.dart` | `lib/health/conditions.ts` |
| `src/defaults.dart` | `lib/config/targets.ts` |
| `src/enums.dart` | `types/database.types.ts` (Goal/Activity/Sex) |

The web app and the native app **must compute identical results**. The golden tests under `test/` pin the numeric outputs (e.g. a given profile → exact calories/macros). When the TS formula changes intentionally, change it here too and update the goldens. If a golden fails unexpectedly, fix the port — not the golden.

Enum `wire` values match the strings stored in Supabase (`'lose_fat'`, `'very_active'`, …) so data round-trips between both clients. Decode with `GoalType.fromWire(...)`.

## Run

Requires the Dart SDK (ships with Flutter, or install standalone):

```bash
cd packages/fitvn_domain
dart pub get
dart test          # run the parity + unit tests
dart analyze       # static analysis
```

## Consuming from the Flutter app (later)

In the Flutter app's `pubspec.yaml`:

```yaml
dependencies:
  fitvn_domain:
    path: ../packages/fitvn_domain
```

```dart
import 'package:fitvn_domain/fitvn_domain.dart';

final targets = computeTargets(profile);
final eval = markers[MarkerKey.uricAcid]!.evaluate(450, null, SexType.male);
```
