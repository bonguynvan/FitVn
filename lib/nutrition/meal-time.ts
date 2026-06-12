import type { MealType } from "@/lib/store/types";

/** Best-guess meal slot from the current local hour (for one-tap logging). */
export function defaultMealByHour(): MealType {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}
