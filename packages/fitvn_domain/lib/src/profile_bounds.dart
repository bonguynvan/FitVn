/// Validation bounds for editable body metrics. Ported from
/// `lib/fitness/profile-bounds.ts`.
///
/// IMPORTANT: applied on confirm (save / start), never while the user is
/// typing. Clamping mid-keystroke fights the user — typing "1" toward "15"
/// would snap to the minimum. Inputs accept free text; we reconcile to a valid
/// value only on commit (and a gentle on-blur snap in the UI layer).

import 'dart:math' as math;

import 'targets.dart' show UserProfile;

class Bound {
  const Bound(this.min, this.max);
  final double min;
  final double max;
}

class ProfileBounds {
  const ProfileBounds._();

  static const Bound age = Bound(10, 100);
  static const Bound heightCm = Bound(120, 230);
  static const Bound weightKg = Bound(30, 250);
  static const Bound targetWeightKg = Bound(30, 250);
}

/// Clamp a number into [min, max]; falls back to `min` for non-finite input.
double clampToRange(double value, double min, double max) {
  if (!value.isFinite) return min;
  return math.min(max, math.max(min, value));
}

/// Clamp a profile's body metrics into valid ranges. Call on save/confirm.
UserProfile clampProfileMetrics(UserProfile profile) {
  final t = profile.targetWeightKg;
  return profile.copyWith(
    age: clampToRange(profile.age, ProfileBounds.age.min, ProfileBounds.age.max),
    heightCm: clampToRange(
      profile.heightCm,
      ProfileBounds.heightCm.min,
      ProfileBounds.heightCm.max,
    ),
    weightKg: clampToRange(
      profile.weightKg,
      ProfileBounds.weightKg.min,
      ProfileBounds.weightKg.max,
    ),
    targetWeightKg: () => t == null
        ? null
        : clampToRange(
            t,
            ProfileBounds.targetWeightKg.min,
            ProfileBounds.targetWeightKg.max,
          ),
  );
}
