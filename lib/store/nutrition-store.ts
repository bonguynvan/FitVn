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

export function removeFood(dateIso: string, id: string): void {
  updateLocal<DayFoods>(FOODS_KEY, {}, (m) => ({
    ...m,
    [dateIso]: (m[dateIso] ?? []).filter((f) => f.id !== id),
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
