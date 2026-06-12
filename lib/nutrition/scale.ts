import type { FoodItem } from "@/lib/data/foods-db";

/** Round to one decimal place. */
export const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Scaled, absolute nutrients of `food` for `edibleGrams` (per 100 g × g/100).
 *  `null` micronutrients stay null (unknown), excluded from adequacy math. */
export function scaleFood(food: FoodItem, edibleGrams: number) {
  const k = edibleGrams / 100;
  const p = food.per100g;
  const opt = (v: number | null) => (v == null ? null : round1(v * k));
  return {
    calories: Math.round(p.calories * k),
    protein: round1(p.protein * k),
    carbs: round1(p.carbs * k),
    fat: round1(p.fat * k),
    fiber: opt(p.fiber),
    sodiumMg: opt(p.sodiumMg),
    calciumMg: opt(p.calciumMg),
    ironMg: opt(p.ironMg),
    purineMg: opt(p.purineMg),
  };
}
