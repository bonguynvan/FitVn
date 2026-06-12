"use client";

/**
 * Build the AI-coach context from local (localStorage) data.
 *
 * The app is local-first, so the coach can't fetch the user's state from
 * Supabase. Instead the client assembles a compact {@link CoachContext} snapshot
 * and sends it with each chat request. This mirrors the server-side
 * `getCoachContext` shape so the same system-prompt builder works for both.
 */

import { readLocal } from "@/lib/store/local-store";
import { computeTargets, type UserProfile } from "@/lib/fitness/targets";
import {
  CALCIUM_TARGET_MG,
  FIBER_TARGET_G,
  IRON_TARGET_MG,
  purineLimit,
  SODIUM_LIMIT_MG,
} from "@/lib/config/targets";
import { addDaysIso, todayIso } from "@/lib/date";
import type { LoggedFood, Measurement, WorkoutSession } from "@/lib/store/types";
import type {
  CoachContext,
  CoachDaySummary,
  CoachMealItem,
  CoachTodayWorkout,
  MacroBundle,
  MacroRemaining,
} from "./types";

const NUTRITION_KEY = "fitvn:nutrition:v1";
const WORKOUTS_KEY = "fitvn:workouts:v1";
const MEASUREMENTS_KEY = "fitvn:measurements:v1";
const PROFILE_KEY = "fitvn:profile:v1";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const round = (n: number) => Math.round(n);

function macrosOf(foods: LoggedFood[]): MacroBundle {
  return {
    calories: round(sum(foods.map((f) => f.calories))),
    proteinG: round(sum(foods.map((f) => f.protein))),
    carbsG: round(sum(foods.map((f) => f.carbs))),
    fatG: round(sum(foods.map((f) => f.fat))),
  };
}

function remainingOf(
  consumed: MacroBundle,
  targets: { calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null },
): MacroRemaining {
  const diff = (t: number | null, c: number) => (t == null ? null : round(t - c));
  return {
    calories: diff(targets.calories, consumed.calories),
    proteinG: diff(targets.proteinG, consumed.proteinG),
    carbsG: diff(targets.carbsG, consumed.carbsG),
    fatG: diff(targets.fatG, consumed.fatG),
  };
}

export function buildLocalCoachContext(): CoachContext {
  const today = todayIso();
  const profile = readLocal<UserProfile | null>(PROFILE_KEY, null);
  const history = readLocal<Record<string, LoggedFood[]>>(NUTRITION_KEY, {});
  const workouts = readLocal<WorkoutSession[]>(WORKOUTS_KEY, []);
  const measurements = readLocal<Measurement[]>(MEASUREMENTS_KEY, []);

  const targetsBundle = profile
    ? profile.customTargets ?? computeTargets(profile)
    : { calories: null, proteinG: null, carbsG: null, fatG: null };
  const targets = {
    calories: targetsBundle.calories ?? null,
    proteinG: targetsBundle.proteinG ?? null,
    carbsG: targetsBundle.carbsG ?? null,
    fatG: targetsBundle.fatG ?? null,
  };

  const todayFoods = history[today] ?? [];
  const consumed = macrosOf(todayFoods);
  const meals: CoachMealItem[] = todayFoods.map((f) => ({
    foodNameVi: f.name,
    mealType: f.mealType,
    quantity: f.quantity,
    unit: f.unit,
    contributed: {
      calories: round(f.calories),
      proteinG: round(f.protein),
      carbsG: round(f.carbs),
      fatG: round(f.fat),
    },
  }));

  // Today's workout (first session logged for today, if any).
  const todaySession = workouts.find((w) => w.performedOn === today) ?? null;
  const todayWorkout: CoachTodayWorkout | null = todaySession
    ? {
        sessionId: todaySession.id,
        durationMin: todaySession.durationMin,
        notes: null,
        exercises: todaySession.exercises.map((e) => {
          const reps = e.sets.map((s) => s.reps ?? 0);
          const weights = e.sets.map((s) => s.weightKg ?? 0);
          return {
            nameVi: e.name,
            muscleGroup: "",
            sets: e.sets.length,
            totalReps: reps.length ? sum(reps) : null,
            topWeightKg: weights.length ? Math.max(...weights) : null,
          };
        }),
      }
    : null;

  // 7-day history (newest first).
  const measureByDay = new Map(measurements.map((m) => [m.measuredOn, m.weightKg]));
  const history7d: CoachDaySummary[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDaysIso(today, -i);
    const foods = history[date] ?? [];
    const m = macrosOf(foods);
    history7d.push({
      date,
      calories: m.calories,
      proteinG: m.proteinG,
      didWorkout: workouts.some((w) => w.performedOn === date),
      weightKg: measureByDay.get(date) ?? null,
    });
  }

  // Health / micronutrient snapshot for today.
  const goutMode = profile?.goutMode ?? false;
  const optSum = (key: keyof LoggedFood) =>
    round(sum(todayFoods.map((f) => (f[key] as number | null | undefined) ?? 0)));

  return {
    profile: {
      fullName: profile?.name ?? null,
      goal: profile?.goal ?? null,
      activityLevel: profile?.activityLevel ?? null,
      heightCm: profile?.heightCm ?? null,
      weightKg: profile?.weightKg ?? null,
      targets,
    },
    today: {
      date: today,
      hasLog: todayFoods.length > 0,
      consumed,
      remaining: remainingOf(consumed, targets),
      meals,
    },
    todayWorkout,
    history7d,
    health: {
      goutMode,
      purineMg: optSum("purineMg"),
      purineLimitMg: purineLimit(goutMode),
      fiberG: optSum("fiber"),
      fiberTargetG: FIBER_TARGET_G,
      sodiumMg: optSum("sodiumMg"),
      sodiumLimitMg: SODIUM_LIMIT_MG,
      calciumMg: optSum("calciumMg"),
      calciumTargetMg: CALCIUM_TARGET_MG,
      ironMg: optSum("ironMg"),
      ironTargetMg: IRON_TARGET_MG[profile?.sex ?? "male"],
    },
  };
}
