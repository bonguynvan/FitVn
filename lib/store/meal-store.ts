"use client";

import { newId, updateLocal, useLocalValue } from "./local-store";
import type { LoggedFood } from "./types";

const KEY = "fitvn:meals:v1";

/** One food inside a saved meal — a logged-food without its diary identity. */
export type SavedMealItem = Omit<LoggedFood, "id" | "mealType">;

/** A reusable, user-composed meal (e.g. "Bữa sáng của tôi"). */
export interface SavedMeal {
  id: string;
  name: string;
  items: SavedMealItem[];
  createdAt: number;
}

/** Reactive list of saved meals, newest first. */
export function useSavedMeals(): SavedMeal[] {
  return useLocalValue<SavedMeal[]>(KEY, []);
}

export function addSavedMeal(name: string, items: SavedMealItem[]): SavedMeal {
  const meal: SavedMeal = { id: `meal-${newId()}`, name, items, createdAt: Date.now() };
  updateLocal<SavedMeal[]>(KEY, [], (list) => [meal, ...list]);
  return meal;
}

export function removeSavedMeal(id: string): void {
  updateLocal<SavedMeal[]>(KEY, [], (list) => list.filter((m) => m.id !== id));
}

/** Sum a meal's calories (for list display). */
export function mealCalories(meal: SavedMeal): number {
  return Math.round(meal.items.reduce((a, i) => a + i.calories, 0));
}
