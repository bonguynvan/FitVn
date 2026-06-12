"use client";

import { newId, updateLocal, useLocalValue } from "./local-store";
import type { LoggedFood } from "./types";

const FOODS_KEY = "fitvn:nutrition:v1";
const WATER_KEY = "fitvn:water:v1";

type DayFoods = Record<string, LoggedFood[]>;
type DayWater = Record<string, number>;

/** Reactive list of foods logged on a given day. */
export function useDayFoods(dateIso: string): LoggedFood[] {
  const map = useLocalValue<DayFoods>(FOODS_KEY, {});
  return map[dateIso] ?? [];
}

export function addFood(dateIso: string, food: Omit<LoggedFood, "id">): void {
  updateLocal<DayFoods>(FOODS_KEY, {}, (m) => ({
    ...m,
    [dateIso]: [...(m[dateIso] ?? []), { ...food, id: newId() }],
  }));
}

/** Append several foods to a day in a single write (e.g. logging a saved meal). */
export function addManyFoods(
  dateIso: string,
  foods: ReadonlyArray<Omit<LoggedFood, "id">>,
): void {
  if (foods.length === 0) return;
  updateLocal<DayFoods>(FOODS_KEY, {}, (m) => ({
    ...m,
    [dateIso]: [
      ...(m[dateIso] ?? []),
      ...foods.map((f) => ({ ...f, id: newId() })),
    ],
  }));
}

export function removeFood(dateIso: string, id: string): void {
  updateLocal<DayFoods>(FOODS_KEY, {}, (m) => ({
    ...m,
    [dateIso]: (m[dateIso] ?? []).filter((f) => f.id !== id),
  }));
}

export function updateFood(
  dateIso: string,
  id: string,
  patch: Partial<Omit<LoggedFood, "id">>,
): void {
  updateLocal<DayFoods>(FOODS_KEY, {}, (m) => ({
    ...m,
    [dateIso]: (m[dateIso] ?? []).map((f) =>
      f.id === id ? { ...f, ...patch } : f,
    ),
  }));
}

/** Reactive water intake (cups) for a given day. */
export function useWater(dateIso: string): number {
  const map = useLocalValue<DayWater>(WATER_KEY, {});
  return map[dateIso] ?? 0;
}

export function setWater(dateIso: string, cups: number): void {
  updateLocal<DayWater>(WATER_KEY, {}, (m) => ({
    ...m,
    [dateIso]: Math.max(0, cups),
  }));
}

/** Full per-day food history (for stats, streaks, recent foods). */
export function useNutritionHistory(): DayFoods {
  return useLocalValue<DayFoods>(FOODS_KEY, {});
}

/** Full per-day water history (for stats / achievements). */
export function useWaterHistory(): DayWater {
  return useLocalValue<DayWater>(WATER_KEY, {});
}
