/**
 * FitVN — AI Coach context fetcher.
 *
 * `getCoachContext` assembles a `CoachContext` snapshot from Supabase using
 * the caller's RLS-scoped server client. It reads:
 *   - the user's profile (goal, targets, body stats),
 *   - today's nutrition_logs + log_items joined to foods (macros scaled),
 *   - today's workout_sessions + session_exercises (joined to exercises),
 *   - a 7-day rollup of calories / protein / workout / weight.
 *
 * Everything degrades gracefully: missing log, no targets, no workout, and
 * partial history all resolve to well-typed empty/null states rather than
 * throwing. Hard failures (auth/connection) surface as a thrown error for
 * the route handler to translate into a clean JSON response.
 *
 * Queries are kept flat (a handful of batched selects) to avoid N+1 round
 * trips; per-day rollups are computed in-memory from two ranged selects.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';
import type {
  CoachContext,
  CoachDaySummary,
  CoachMealItem,
  CoachProfile,
  CoachToday,
  CoachTodayWorkout,
  CoachWorkoutExercise,
  MacroBundle,
} from './types';
import {
  ZERO_MACROS,
  addMacros,
  computeRemaining,
  scaleMacros,
} from './macros';

type Db = SupabaseClient<Database>;

/** Number of days (inclusive of today) summarized in the weekly trend. */
const HISTORY_DAYS = 7;

// -----------------------------------------------------------------------------
// Date helpers — resolve "today" in the user's timezone (Vietnam, UTC+7, no DST)
// rather than UTC. nutrition_logs.logged_on / workout_sessions.performed_on are
// plain DATE columns defaulted to the local calendar day, so formatting the
// instant in Asia/Ho_Chi_Minh avoids the midnight–07:00 off-by-one where a raw
// UTC date would still read as "yesterday" for a Vietnamese user.
// -----------------------------------------------------------------------------
const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function toIsoDate(d: Date): string {
  // en-CA formats as yyyy-mm-dd, matching the Postgres DATE text format.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function daysAgoIso(days: number, from: Date): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return toIsoDate(d);
}

// -----------------------------------------------------------------------------
// Profile
// -----------------------------------------------------------------------------
async function fetchProfile(supabase: Db, userId: string): Promise<CoachProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'full_name, goal, activity_level, height_cm, weight_kg, daily_calorie_target, protein_target_g, carbs_target_g, fat_target_g',
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Không tải được hồ sơ người dùng: ${error.message}`);
  }

  // No profile row yet (rare; trigger creates one) → all-null profile.
  return {
    fullName: data?.full_name ?? null,
    goal: data?.goal ?? null,
    activityLevel: data?.activity_level ?? null,
    heightCm: data?.height_cm ?? null,
    weightKg: data?.weight_kg ?? null,
    targets: {
      calories: data?.daily_calorie_target ?? null,
      proteinG: data?.protein_target_g ?? null,
      carbsG: data?.carbs_target_g ?? null,
      fatG: data?.fat_target_g ?? null,
    },
  };
}

// -----------------------------------------------------------------------------
// Today's nutrition — log_items joined to foods, scaled by quantity.
// -----------------------------------------------------------------------------

/** Row shape returned by the nested log_items → foods select. */
interface LogItemWithFood {
  meal_type: Database['public']['Tables']['log_items']['Row']['meal_type'];
  quantity: number;
  unit: string;
  foods: {
    name_vi: string;
    calories_per_100g: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  } | null;
}

function foodToPer100g(food: NonNullable<LogItemWithFood['foods']>): MacroBundle {
  return {
    calories: food.calories_per_100g,
    proteinG: food.protein_g,
    carbsG: food.carbs_g,
    fatG: food.fat_g,
  };
}

async function fetchToday(
  supabase: Db,
  userId: string,
  todayIso: string,
  profile: CoachProfile,
): Promise<CoachToday> {
  // The diary is unique per (user, day). Resolve it, then its items.
  const { data: log, error: logErr } = await supabase
    .from('nutrition_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('logged_on', todayIso)
    .maybeSingle();

  if (logErr) {
    throw new Error(`Không tải được nhật ký ăn uống: ${logErr.message}`);
  }

  if (!log) {
    return {
      date: todayIso,
      hasLog: false,
      consumed: ZERO_MACROS,
      remaining: computeRemaining(ZERO_MACROS, profile.targets),
      meals: [],
    };
  }

  const { data: items, error: itemsErr } = await supabase
    .from('log_items')
    .select(
      'meal_type, quantity, unit, foods ( name_vi, calories_per_100g, protein_g, carbs_g, fat_g )',
    )
    .eq('log_id', log.id);

  if (itemsErr) {
    throw new Error(`Không tải được món ăn đã ghi: ${itemsErr.message}`);
  }

  const rows = (items ?? []) as unknown as LogItemWithFood[];

  const meals: CoachMealItem[] = rows
    .filter((r): r is LogItemWithFood & { foods: NonNullable<LogItemWithFood['foods']> } =>
      r.foods != null,
    )
    .map((r) => {
      const contributed = scaleMacros(foodToPer100g(r.foods), r.quantity);
      return {
        foodNameVi: r.foods.name_vi,
        mealType: r.meal_type,
        quantity: r.quantity,
        unit: r.unit,
        contributed,
      };
    });

  const consumed = meals.reduce(
    (acc, m) => addMacros(acc, m.contributed),
    ZERO_MACROS,
  );

  return {
    date: todayIso,
    hasLog: meals.length > 0,
    consumed,
    remaining: computeRemaining(consumed, profile.targets),
    meals,
  };
}

// -----------------------------------------------------------------------------
// Today's workout — session + per-set rows aggregated per exercise.
// -----------------------------------------------------------------------------

interface SessionExerciseRow {
  exercise_id: string;
  reps: number | null;
  weight_kg: number | null;
  exercises: { name_vi: string; muscle_group: string } | null;
}

function aggregateExercises(
  rows: readonly SessionExerciseRow[],
): CoachWorkoutExercise[] {
  // Group per-set rows by exercise; each set row contributes one set.
  const byExercise = new Map<
    string,
    {
      nameVi: string;
      muscleGroup: string;
      sets: number;
      totalReps: number | null;
      topWeightKg: number | null;
    }
  >();

  for (const row of rows) {
    if (!row.exercises) continue;
    const key = row.exercise_id;
    const existing = byExercise.get(key) ?? {
      nameVi: row.exercises.name_vi,
      muscleGroup: row.exercises.muscle_group,
      sets: 0,
      totalReps: null,
      topWeightKg: null,
    };

    const totalReps =
      row.reps == null
        ? existing.totalReps
        : (existing.totalReps ?? 0) + row.reps;

    const topWeightKg =
      row.weight_kg == null
        ? existing.topWeightKg
        : Math.max(existing.topWeightKg ?? 0, row.weight_kg);

    byExercise.set(key, {
      ...existing,
      sets: existing.sets + 1,
      totalReps,
      topWeightKg,
    });
  }

  return Array.from(byExercise.values());
}

async function fetchTodayWorkout(
  supabase: Db,
  userId: string,
  todayIso: string,
): Promise<CoachTodayWorkout | null> {
  const { data: session, error: sessErr } = await supabase
    .from('workout_sessions')
    .select('id, duration_min, notes')
    .eq('user_id', userId)
    .eq('performed_on', todayIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessErr) {
    throw new Error(`Không tải được buổi tập hôm nay: ${sessErr.message}`);
  }
  if (!session) return null;

  const { data: setRows, error: setErr } = await supabase
    .from('session_exercises')
    .select('exercise_id, reps, weight_kg, exercises ( name_vi, muscle_group )')
    .eq('session_id', session.id)
    .order('order_index', { ascending: true });

  if (setErr) {
    throw new Error(`Không tải được bài tập trong buổi: ${setErr.message}`);
  }

  const rows = (setRows ?? []) as unknown as SessionExerciseRow[];

  return {
    sessionId: session.id,
    durationMin: session.duration_min ?? null,
    notes: session.notes ?? null,
    exercises: aggregateExercises(rows),
  };
}

// -----------------------------------------------------------------------------
// 7-day history — ranged selects, rolled up in-memory per day.
// -----------------------------------------------------------------------------

interface DailyNutritionRow {
  logged_on: string;
  log_items: Array<{
    quantity: number;
    foods: { calories_per_100g: number; protein_g: number } | null;
  }>;
}

function rollupNutritionByDay(
  rows: readonly DailyNutritionRow[],
): Map<string, { calories: number; proteinG: number }> {
  const byDay = new Map<string, { calories: number; proteinG: number }>();

  for (const log of rows) {
    let calories = 0;
    let proteinG = 0;
    for (const item of log.log_items ?? []) {
      if (!item.foods) continue;
      const factor = item.quantity / 100;
      calories += item.foods.calories_per_100g * factor;
      proteinG += item.foods.protein_g * factor;
    }
    const prev = byDay.get(log.logged_on) ?? { calories: 0, proteinG: 0 };
    byDay.set(log.logged_on, {
      calories: prev.calories + calories,
      proteinG: prev.proteinG + proteinG,
    });
  }

  return byDay;
}

async function fetchHistory7d(
  supabase: Db,
  userId: string,
  today: Date,
): Promise<CoachDaySummary[]> {
  const sinceIso = daysAgoIso(HISTORY_DAYS - 1, today);

  // Three independent ranged reads, run in parallel.
  const [nutritionRes, sessionsRes, measurementsRes] = await Promise.all([
    supabase
      .from('nutrition_logs')
      .select(
        'logged_on, log_items ( quantity, foods ( calories_per_100g, protein_g ) )',
      )
      .eq('user_id', userId)
      .gte('logged_on', sinceIso),
    supabase
      .from('workout_sessions')
      .select('performed_on')
      .eq('user_id', userId)
      .gte('performed_on', sinceIso),
    supabase
      .from('body_measurements')
      .select('measured_on, weight_kg')
      .eq('user_id', userId)
      .gte('measured_on', sinceIso)
      .order('measured_on', { ascending: true }),
  ]);

  if (nutritionRes.error) {
    throw new Error(`Không tải được lịch sử dinh dưỡng: ${nutritionRes.error.message}`);
  }
  if (sessionsRes.error) {
    throw new Error(`Không tải được lịch sử tập luyện: ${sessionsRes.error.message}`);
  }
  if (measurementsRes.error) {
    throw new Error(`Không tải được lịch sử cân nặng: ${measurementsRes.error.message}`);
  }

  const nutritionByDay = rollupNutritionByDay(
    (nutritionRes.data ?? []) as unknown as DailyNutritionRow[],
  );

  const workoutDays = new Set(
    (sessionsRes.data ?? []).map((s) => s.performed_on),
  );

  // Latest weight wins per day (rows already sorted ascending).
  const weightByDay = new Map<string, number>();
  for (const m of measurementsRes.data ?? []) {
    if (m.weight_kg != null) weightByDay.set(m.measured_on, m.weight_kg);
  }

  // Emit one summary per calendar day, newest first.
  const summaries: CoachDaySummary[] = [];
  for (let i = 0; i < HISTORY_DAYS; i += 1) {
    const dateIso = daysAgoIso(i, today);
    const nutrition = nutritionByDay.get(dateIso);
    summaries.push({
      date: dateIso,
      calories: Math.round(nutrition?.calories ?? 0),
      proteinG: Math.round((nutrition?.proteinG ?? 0) * 10) / 10,
      didWorkout: workoutDays.has(dateIso),
      weightKg: weightByDay.get(dateIso) ?? null,
    });
  }

  return summaries;
}

// -----------------------------------------------------------------------------
// Public entry point
// -----------------------------------------------------------------------------
export async function getCoachContext(
  userId: string,
  supabase: Db,
): Promise<CoachContext> {
  if (!userId) {
    throw new Error('getCoachContext: thiếu userId.');
  }

  const today = new Date();
  const todayIso = toIsoDate(today);

  // Profile is needed for target math, so fetch it first; the remaining
  // reads are independent and run in parallel.
  const profile = await fetchProfile(supabase, userId);

  const [todaySlice, todayWorkout, history7d] = await Promise.all([
    fetchToday(supabase, userId, todayIso, profile),
    fetchTodayWorkout(supabase, userId, todayIso),
    fetchHistory7d(supabase, userId, today),
  ]);

  return {
    profile,
    today: todaySlice,
    todayWorkout,
    history7d,
  };
}
