import type { UserProfile } from "@/lib/fitness/targets";

/**
 * Validation bounds for editable body metrics.
 *
 * IMPORTANT: these are applied on confirm (save / start), never while the user
 * is typing. Clamping mid-keystroke fights the user — e.g. typing "1" on the
 * way to "15" would snap to the minimum. The inputs let people type freely and
 * we reconcile to a valid value only when they commit.
 */
export const PROFILE_BOUNDS = {
  age: { min: 10, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 250 },
  targetWeightKg: { min: 30, max: 250 },
} as const;

/** Clamp a number into [min, max]; falls back to `min` for non-finite input. */
export function clampToRange(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Clamp a profile's body metrics into valid ranges. Call on save/confirm. */
export function clampProfileMetrics(profile: UserProfile): UserProfile {
  const { targetWeightKg } = profile;
  return {
    ...profile,
    age: clampToRange(profile.age, PROFILE_BOUNDS.age.min, PROFILE_BOUNDS.age.max),
    heightCm: clampToRange(
      profile.heightCm,
      PROFILE_BOUNDS.heightCm.min,
      PROFILE_BOUNDS.heightCm.max,
    ),
    weightKg: clampToRange(
      profile.weightKg,
      PROFILE_BOUNDS.weightKg.min,
      PROFILE_BOUNDS.weightKg.max,
    ),
    targetWeightKg:
      targetWeightKg == null
        ? targetWeightKg
        : clampToRange(
            targetWeightKg,
            PROFILE_BOUNDS.targetWeightKg.min,
            PROFILE_BOUNDS.targetWeightKg.max,
          ),
  };
}
