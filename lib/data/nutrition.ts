import "server-only";
// import { createClient } from "@/lib/supabase/server"; // TODO(data): real queries

/**
 * Nutrition page data.
 *
 * Returns the signed-in user's food diary for "today": the calorie target vs
 * consumed, macro targets vs consumed, water intake, and the day's logged
 * foods grouped by meal type. The real Supabase reads are written below but
 * COMMENTED — the app currently has no backend, so this returns an empty
 * snapshot (`hasData: false`) and the nutrition screen shows its "no meals
 * logged yet" empty state. Wire up Supabase to light up the diary.
 */

import type { MealType } from "@/types/database.types";

/** A single logged food inside a meal. */
export interface NutritionFoodItem {
  /** Dish name in Vietnamese, e.g. "Phở bò tái". */
  readonly name: string;
  /** Human portion description, e.g. "1 tô" or "150g". */
  readonly portion: string;
  /** Energy contributed by this entry, in kilocalories. */
  readonly kcal: number;
}

/** Macro line for the day (consumed vs target). */
export interface NutritionMacro {
  readonly label: string;
  readonly value: number;
  readonly target: number;
  readonly unit: string;
  /** Bar tone — accent for the "go" macro, primary for the rest. */
  readonly tone: "primary" | "accent";
}

/** Foods logged for one meal type (breakfast / lunch / dinner / snack). */
export interface NutritionMeal {
  readonly mealType: MealType;
  readonly items: ReadonlyArray<NutritionFoodItem>;
}

export interface NutritionData {
  readonly hasData: boolean;
  /** Calories consumed vs the profile's daily target. Null until a target is set. */
  readonly calories: { readonly consumed: number; readonly goal: number } | null;
  readonly macros: ReadonlyArray<NutritionMacro>;
  /** Water intake in cups (ly) vs the daily goal. */
  readonly water: { readonly filled: number; readonly goal: number };
  /** Logged foods keyed by meal type; empty arrays when nothing is logged. */
  readonly meals: ReadonlyArray<NutritionMeal>;
}

/** Default hydration goal in cups when the profile carries no override. */
const DEFAULT_WATER_GOAL = 8;

const EMPTY_NUTRITION: NutritionData = {
  hasData: false,
  calories: null,
  macros: [],
  water: { filled: 0, goal: DEFAULT_WATER_GOAL },
  meals: [],
};

export async function getNutrition(): Promise<NutritionData> {
  // --- Supabase (integrate later) -------------------------------------------
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return EMPTY_NUTRITION;
  //
  // // Resolve "today" in the user's timezone (Vietnam, UTC+7, no DST). The
  // // logged_on column is a plain DATE defaulted to the local calendar day.
  // const todayIso = new Intl.DateTimeFormat("en-CA", {
  //   timeZone: "Asia/Ho_Chi_Minh",
  //   year: "numeric",
  //   month: "2-digit",
  //   day: "2-digit",
  // }).format(new Date());
  //
  // // Targets live on the profile.
  // const { data: profile } = await supabase
  //   .from("profiles")
  //   .select(
  //     "daily_calorie_target, protein_target_g, carbs_target_g, fat_target_g",
  //   )
  //   .eq("id", user.id)
  //   .maybeSingle();
  //
  // // The diary is unique per (user, day); resolve it, then its items joined
  // // to the foods library (macros are stored per 100g).
  // const { data: log } = await supabase
  //   .from("nutrition_logs")
  //   .select("id")
  //   .eq("user_id", user.id)
  //   .eq("logged_on", todayIso)
  //   .maybeSingle();
  //
  // if (!log) return EMPTY_NUTRITION;
  //
  // const { data: items } = await supabase
  //   .from("log_items")
  //   .select(
  //     "meal_type, quantity, unit, foods ( name_vi, serving_desc, calories_per_100g, protein_g, carbs_g, fat_g )",
  //   )
  //   .eq("log_id", log.id);
  //
  // type LogItemRow = {
  //   meal_type: MealType;
  //   quantity: number;
  //   unit: string;
  //   foods: {
  //     name_vi: string;
  //     serving_desc: string | null;
  //     calories_per_100g: number;
  //     protein_g: number;
  //     carbs_g: number;
  //     fat_g: number;
  //   } | null;
  // };
  //
  // const rows = ((items ?? []) as unknown as LogItemRow[]).filter(
  //   (r): r is LogItemRow & { foods: NonNullable<LogItemRow["foods"]> } =>
  //     r.foods != null,
  // );
  //
  // // Macros are per 100g; quantity is in grams (unit defaults to 'g').
  // const scale = (per100g: number, quantity: number) =>
  //   Math.round(per100g * (quantity / 100));
  //
  // // Group foods by meal type, preserving the breakfast→snack order.
  // const MEAL_ORDER: ReadonlyArray<MealType> = [
  //   "breakfast",
  //   "lunch",
  //   "dinner",
  //   "snack",
  // ];
  // const meals: NutritionMeal[] = MEAL_ORDER.map((mealType) => ({
  //   mealType,
  //   items: rows
  //     .filter((r) => r.meal_type === mealType)
  //     .map((r) => ({
  //       name: r.foods.name_vi,
  //       portion: r.foods.serving_desc ?? `${r.quantity}${r.unit}`,
  //       kcal: scale(r.foods.calories_per_100g, r.quantity),
  //     })),
  // })).filter((meal) => meal.items.length > 0);
  //
  // // Day totals, summed from the scaled rows.
  // const consumed = rows.reduce(
  //   (acc, r) => ({
  //     calories: acc.calories + scale(r.foods.calories_per_100g, r.quantity),
  //     proteinG: acc.proteinG + scale(r.foods.protein_g, r.quantity),
  //     carbsG: acc.carbsG + scale(r.foods.carbs_g, r.quantity),
  //     fatG: acc.fatG + scale(r.foods.fat_g, r.quantity),
  //   }),
  //   { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  // );
  //
  // return {
  //   hasData: meals.length > 0,
  //   calories: profile?.daily_calorie_target
  //     ? { consumed: consumed.calories, goal: profile.daily_calorie_target }
  //     : null,
  //   macros: [
  //     { label: "Đạm", value: consumed.proteinG, target: profile?.protein_target_g ?? 0, unit: "g", tone: "accent" },
  //     { label: "Tinh bột", value: consumed.carbsG, target: profile?.carbs_target_g ?? 0, unit: "g", tone: "primary" },
  //     { label: "Chất béo", value: consumed.fatG, target: profile?.fat_target_g ?? 0, unit: "g", tone: "primary" },
  //   ],
  //   water: { filled: 0, goal: DEFAULT_WATER_GOAL }, // no water table yet
  //   meals,
  // };
  // --------------------------------------------------------------------------

  return EMPTY_NUTRITION;
}
