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
