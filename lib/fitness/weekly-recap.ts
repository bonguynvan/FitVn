/**
 * Weekly recap — a compact 7-day summary composed from the workout and nutrition
 * rollups plus body-weight change. Powers the home "Tuần này" card. Pure; all
 * inputs come from the local stores.
 */

import { addDaysIso } from "@/lib/date";
import { computeWeeklyWorkouts } from "@/lib/fitness/workout-insights";
import { computeWeeklyNutrition } from "@/lib/fitness/nutrition-insights";
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
    hasAny:
      workouts.totalSessions > 0 ||
      nutrition.daysLogged > 0 ||
      weightDeltaKg != null,
  };
}
