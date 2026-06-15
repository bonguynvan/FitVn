/// FitVN domain core — the language-agnostic source of truth for nutrition
/// targets, health-marker evaluation, and condition tuning.
///
/// Ported 1:1 from the TypeScript web app (`lib/fitness`, `lib/health`,
/// `lib/config`). Parity is enforced by golden tests under `test/`. When the TS
/// logic changes, change it here too and update the goldens.
library;

export 'src/conditions.dart';
export 'src/defaults.dart';
export 'src/enums.dart';
export 'src/markers.dart';
export 'src/profile_bounds.dart';
export 'src/targets.dart';
