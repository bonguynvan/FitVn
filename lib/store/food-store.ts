"use client";

import { newId, updateLocal, useLocalValue } from "./local-store";
import { FOODS, type FoodItem } from "@/lib/data/foods-db";
import type { LoggedFood } from "./types";

const CUSTOM_KEY = "fitvn:custom-foods:v2";
const NUTRITION_KEY = "fitvn:nutrition:v1";

type DayFoods = Record<string, LoggedFood[]>;

/** Reactive list of user-created foods (FCT FoodItem shape). */
export function useCustomFoods(): FoodItem[] {
  return useLocalValue<FoodItem[]>(CUSTOM_KEY, []);
}

export function addCustomFood(food: Omit<FoodItem, "id" | "custom">): FoodItem {
  const created: FoodItem = { ...food, id: `custom-${newId()}`, custom: true };
  updateLocal<FoodItem[]>(CUSTOM_KEY, [], (list) => [created, ...list]);
  return created;
}

export function removeCustomFood(id: string): void {
  updateLocal<FoodItem[]>(CUSTOM_KEY, [], (list) =>
    list.filter((f) => f.id !== id),
  );
}

/** Custom foods first, then the built-in FCT database. */
export function useAllFoods(): FoodItem[] {
  const custom = useCustomFoods();
  return [...custom, ...FOODS];
}

/** Recently-logged foods (most recent first), resolved to FoodItem. */
export function useRecentFoods(limit = 6): FoodItem[] {
  const all = useAllFoods();
  const history = useLocalValue<DayFoods>(NUTRITION_KEY, {});

  const byId = new Map(all.map((f) => [f.id, f]));
  const seen = new Set<string>();
  const recent: FoodItem[] = [];

  const dates = Object.keys(history).sort((a, b) => b.localeCompare(a));
  for (const date of dates) {
    const items = history[date] ?? [];
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const fid = items[i].foodId;
      if (!fid || seen.has(fid)) continue;
      seen.add(fid);
      const food = byId.get(fid);
      if (food) recent.push(food);
      if (recent.length >= limit) return recent;
    }
  }
  return recent;
}
