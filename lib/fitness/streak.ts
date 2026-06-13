/**
 * Workout-streak logic with planned rest days.
 *
 * A planned rest weekday (0=Sun … 6=Sat) bridges the chain without breaking it,
 * but does NOT inflate the count — the streak number is consecutive *workout*
 * days, allowing configured rest days to sit between them. With no rest days set,
 * this is the plain "consecutive days with a workout" streak.
 */

import { addDaysIso } from "@/lib/date";

/** Hard cap on backward steps (guards against an all-rest-days configuration). */
const MAX_LOOKBACK_DAYS = 732;

function weekdayOf(iso: string): number {
  return new Date(`${iso}T00:00:00`).getDay();
}

export function isRestWeekday(
  iso: string,
  restWeekdays: ReadonlySet<number>,
): boolean {
  return restWeekdays.has(weekdayOf(iso));
}

/**
 * Consecutive workout days ending today (or yesterday, so the streak isn't
 * "broken" before today is logged), with planned rest days bridging gaps.
 */
export function computeWorkoutStreak(
  workoutDates: ReadonlySet<string>,
  today: string,
  restWeekdays: ReadonlySet<number> = new Set(),
): number {
  const active = (iso: string) => workoutDates.has(iso);
  const bridge = (iso: string) => isRestWeekday(iso, restWeekdays);

  // Choose the anchor: today if it has a workout or is a rest day, else
  // yesterday under the same test, else there's no live streak.
  let cursor = today;
  if (!active(cursor) && !bridge(cursor)) {
    const yesterday = addDaysIso(today, -1);
    if (!active(yesterday) && !bridge(yesterday)) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  let steps = 0;
  while ((active(cursor) || bridge(cursor)) && steps < MAX_LOOKBACK_DAYS) {
    if (active(cursor)) streak += 1;
    cursor = addDaysIso(cursor, -1);
    steps += 1;
  }
  return streak;
}
