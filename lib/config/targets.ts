/**
 * Default daily goals used until a user profile (with personalized targets)
 * is connected via Supabase. Kept in one place so screens stay consistent.
 */
export const DAILY_TARGETS = {
  calories: 2200,
  proteinG: 150,
  carbsG: 240,
  fatG: 70,
} as const;

export const WATER_GOAL_CUPS = 8;

/** Daily fiber goal (g) and sodium upper limit (mg) for the health-check lines. */
export const FIBER_TARGET_G = 25;
export const SODIUM_LIMIT_MG = 2000;

/** Micronutrient reference values (approx adult RDA / limits). */
export const CALCIUM_TARGET_MG = 1000;
/** Iron RDA differs by sex (menstruation). */
export const IRON_TARGET_MG: Record<"male" | "female" | "other", number> = {
  male: 8,
  female: 18,
  other: 12,
};
/** Daily purine ceiling (mg) for general tracking. */
export const PURINE_LIMIT_MG = 400;
/** Tighter daily ceiling when gout mode is on (active gout management). */
export const PURINE_LIMIT_MG_GOUT = 200;
/** A food (per 100 g edible) at/above this purine level counts as "high purine". */
export const HIGH_PURINE_PER_100G = 150;

/** Daily purine ceiling, tightened when the user is managing gout. */
export const purineLimit = (goutMode?: boolean): number =>
  goutMode ? PURINE_LIMIT_MG_GOUT : PURINE_LIMIT_MG;
