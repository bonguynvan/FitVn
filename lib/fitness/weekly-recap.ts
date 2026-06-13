/**
 * Weekly recap — a compact 7-day summary composed from the workout and nutrition
 * rollups plus body-weight change. Powers the home "Tuần này" card. Pure; all
 * inputs come from the local stores.
 */

import { addDaysIso } from "@/lib/date";
import { computeWeeklyWorkouts } from "@/lib/fitness/workout-insights";
import { computeWeeklyNutrition } from "@/lib/fitness/nutrition-insights";
import { estimateOneRepMax } from "@/lib/fitness/exercise-history";
import type { LoggedFood, Measurement, WorkoutSession } from "@/lib/store/types";

export interface WeeklyRecap {
  readonly daysTrained: number;
  readonly totalSessions: number;
  readonly totalVolumeKg: number;
  readonly totalDurationMin: number;
  readonly topExercise: string | null;
  readonly daysLogged: number;
  readonly proteinGoalDays: number;
  readonly avgCalories: number;
  /** Weight change across measurements within the last 7 days; null if <2. */
  readonly weightDeltaKg: number | null;
  /** Best genuine 1RM PR set this week (beats a prior best); null if none. */
  readonly bestPr: { readonly name: string; readonly oneRepMax: number } | null;
  /** True when anything happened this week (so the card can hide otherwise). */
  readonly hasAny: boolean;
}

export interface WeeklyRecapInput {
  readonly today: string;
  readonly sessions: readonly WorkoutSession[];
  readonly nutritionByDay: Record<string, LoggedFood[]>;
  readonly measurements: readonly Measurement[];
  readonly proteinTargetG: number | null;
  readonly sodiumLimitMg: number;
  readonly goutMode: boolean;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const exKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

/** Best estimated 1RM for an exercise (by key) across the given sessions; 0 if none. */
function bestOneRepMaxFor(sessions: readonly WorkoutSession[], key: string): number {
  let best = 0;
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (exKey(ex.name) !== key) continue;
      for (const set of ex.sets) {
        const orm = estimateOneRepMax(set);
        if (orm != null && orm > best) best = orm;
      }
    }
  }
  return best;
}

/** Best genuine 1RM PR (beats a prior all-time best) set within the last 7 days. */
function bestWeeklyPr(
  sessions: readonly WorkoutSession[],
  today: string,
): { name: string; oneRepMax: number } | null {
  const windowStart = addDaysIso(today, -6);
  const inWindow = sessions.filter(
    (s) => s.performedOn >= windowStart && s.performedOn <= today,
  );

  let best: { name: string; oneRepMax: number } | null = null;
  for (const s of inWindow) {
    const earlier = sessions.filter(
      (o) =>
        o.performedOn < s.performedOn ||
        (o.performedOn === s.performedOn && o.createdAt < s.createdAt),
    );
    const seen = new Set<string>();
    for (const ex of s.exercises) {
      const key = exKey(ex.name);
      if (seen.has(key)) continue;
      seen.add(key);
      const sBest = bestOneRepMaxFor([s], key);
      const priorBest = bestOneRepMaxFor(earlier, key);
      if (sBest > priorBest && priorBest > 0) {
        if (!best || sBest > best.oneRepMax) {
          best = { name: ex.name.trim(), oneRepMax: Math.round(sBest * 10) / 10 };
        }
      }
    }
  }
  return best;
}

/** Weight change within the trailing 7-day window (latest − earliest). */
function weeklyWeightDelta(
  measurements: readonly Measurement[],
  today: string,
): number | null {
  const windowStart = addDaysIso(today, -6);
  const inWindow = measurements
    .filter((m) => m.measuredOn >= windowStart && m.measuredOn <= today)
    .sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
  if (inWindow.length < 2) return null;
  return round1(inWindow[inWindow.length - 1].weightKg - inWindow[0].weightKg);
}

export function computeWeeklyRecap(input: WeeklyRecapInput): WeeklyRecap {
  const { today, sessions, nutritionByDay, measurements, proteinTargetG, sodiumLimitMg, goutMode } = input;

  const workouts = computeWeeklyWorkouts(today, sessions);
  const nutrition = computeWeeklyNutrition({
    today,
    nutritionByDay,
    proteinTargetG,
    sodiumLimitMg,
    goutMode,
  });
  const weightDeltaKg = weeklyWeightDelta(measurements, today);
  const bestPr = bestWeeklyPr(sessions, today);

  return {
    daysTrained: workouts.daysTrained,
    totalSessions: workouts.totalSessions,
    totalVolumeKg: workouts.totalVolumeKg,
    totalDurationMin: workouts.totalDurationMin,
    topExercise: workouts.topExercise,
    daysLogged: nutrition.daysLogged,
    proteinGoalDays: nutrition.proteinGoalDays,
    avgCalories: nutrition.avgCalories,
    weightDeltaKg,
    bestPr,
    hasAny:
      workouts.totalSessions > 0 ||
      nutrition.daysLogged > 0 ||
      weightDeltaKg != null,
  };
}
