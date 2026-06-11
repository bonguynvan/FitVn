/**
 * FitVN — AI Coach context types.
 *
 * `CoachContext` is the compact, fully-resolved snapshot of a user's
 * nutrition + training state that gets injected into the Claude system
 * prompt. It is computed server-side by `getCoachContext` and is the
 * single source of truth the model reasons over.
 *
 * Design goals:
 *  - Self-describing: every number carries its unit in the field name.
 *  - Null-safe: anything the user may not have set is explicitly nullable
 *    so the prompt builder can degrade gracefully (e.g. no targets set).
 *  - Compact: only what the coach actually needs, to keep token cost low.
 */

import type { GoalType, ActivityLevel, MealType } from '@/types/database.types';

// -----------------------------------------------------------------------------
// Macro bundle — reused for consumed / target / remaining triples.
// -----------------------------------------------------------------------------
export interface MacroBundle {
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
}

/**
 * Remaining macros relative to targets. Values may be negative when the
 * user has gone over a target (useful signal for the coach). `null` for a
 * field means the corresponding target was not set, so "remaining" is
 * undefined rather than misleadingly equal to the target.
 */
export interface MacroRemaining {
  readonly calories: number | null;
  readonly proteinG: number | null;
  readonly carbsG: number | null;
  readonly fatG: number | null;
}

// -----------------------------------------------------------------------------
// Profile slice
// -----------------------------------------------------------------------------
export interface CoachProfile {
  readonly fullName: string | null;
  readonly goal: GoalType | null;
  readonly activityLevel: ActivityLevel | null;
  readonly heightCm: number | null;
  readonly weightKg: number | null;
  /** Daily macro targets; any field is null when the user has not set it. */
  readonly targets: {
    readonly calories: number | null;
    readonly proteinG: number | null;
    readonly carbsG: number | null;
    readonly fatG: number | null;
  };
}

// -----------------------------------------------------------------------------
// A single meal item the user logged today (already scaled by quantity).
// -----------------------------------------------------------------------------
export interface CoachMealItem {
  readonly foodNameVi: string;
  readonly mealType: MealType;
  readonly quantity: number;
  readonly unit: string;
  /** Macros for this item AFTER scaling by quantity. */
  readonly contributed: MacroBundle;
}

// -----------------------------------------------------------------------------
// Today slice — nutrition consumed vs targets + the meals behind the numbers.
// -----------------------------------------------------------------------------
export interface CoachToday {
  /** ISO yyyy-mm-dd (the user's "today"). */
  readonly date: string;
  readonly hasLog: boolean;
  readonly consumed: MacroBundle;
  readonly remaining: MacroRemaining;
  readonly meals: readonly CoachMealItem[];
}

// -----------------------------------------------------------------------------
// Today's workout slice.
// -----------------------------------------------------------------------------
export interface CoachWorkoutExercise {
  readonly nameVi: string;
  readonly muscleGroup: string;
  readonly sets: number;
  /** Total reps across the logged sets, when available. */
  readonly totalReps: number | null;
  /** Heaviest weight (kg) logged for this exercise today, when available. */
  readonly topWeightKg: number | null;
}

export interface CoachTodayWorkout {
  readonly sessionId: string;
  readonly durationMin: number | null;
  readonly notes: string | null;
  readonly exercises: readonly CoachWorkoutExercise[];
}

// -----------------------------------------------------------------------------
// 7-day history — one compact summary per day, newest first.
// -----------------------------------------------------------------------------
export interface CoachDaySummary {
  readonly date: string; // ISO yyyy-mm-dd
  readonly calories: number;
  readonly proteinG: number;
  readonly didWorkout: boolean;
  /** Body weight logged that day, if any. */
  readonly weightKg: number | null;
}

// -----------------------------------------------------------------------------
// The full context object handed to the prompt builder.
// -----------------------------------------------------------------------------
export interface CoachContext {
  readonly profile: CoachProfile;
  readonly today: CoachToday;
  readonly todayWorkout: CoachTodayWorkout | null;
  /** Last 7 days (may include today), newest first. */
  readonly history7d: readonly CoachDaySummary[];
}
