"use client";

import { SEED_FOODS, type SeedFood } from "@/lib/data/foods-seed";
import { newId, updateLocal, useLocalValue } from "./local-store";
import type { LoggedFood } from "./types";

const CUSTOM_FOODS_KEY = "fitvn:custom-foods:v1";
const FOODS_KEY = "fitvn:nutrition:v1";

type DayFoods = Record<string, LoggedFood[]>;

/** Reactive list of user-created custom foods. */
export function useCustomFoods(): SeedFood[] {
  return useLocalValue<SeedFood[]>(CUSTOM_FOODS_KEY, []);
}

/** Create a custom food and return the persisted record (with generated id). */
export function addCustomFood(food: Omit<SeedFood, "id">): SeedFood {
  const created: SeedFood = { ...food, id: newId() };
  updateLocal<SeedFood[]>(CUSTOM_FOODS_KEY, [], (list) => [created, ...list]);
  return created;
}

export function removeCustomFood(id: string): void {
  updateLocal<SeedFood[]>(CUSTOM_FOODS_KEY, [], (list) =>
    list.filter((f) => f.id !== id),
  );
}

/** Combined picker list: custom foods first, then the built-in seeds. */
export function useAllFoods(): SeedFood[] {
  const custom = useCustomFoods();
  return [...custom, ...SEED_FOODS];
}

/**
 * Recently logged foods for one-tap re-selection.
 *
 * Ordering: walk day keys newest-first; within a day walk entries in reverse
 * (last-logged first), so the result is strictly most-recent-first. Dedupe by
 * `foodId` (null = ad-hoc, skipped), resolve each id against the combined
 * custom+seed list, drop anything unresolved, and cap at `limit`.
 */
export function useRecentFoods(limit = 6): SeedFood[] {
  const custom = useCustomFoods();
  const dayMap = useLocalValue<DayFoods>(FOODS_KEY, {});

  const byId = new Map<string, SeedFood>();
  for (const f of custom) byId.set(f.id, f);
  for (const f of SEED_FOODS) if (!byId.has(f.id)) byId.set(f.id, f);

  const dates = Object.keys(dayMap).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  const seen = new Set<string>();
  const result: SeedFood[] = [];
  for (const date of dates) {
    const entries = dayMap[date] ?? [];
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const foodId = entries[i].foodId;
      if (!foodId || seen.has(foodId)) continue;
      const resolved = byId.get(foodId);
      if (!resolved) continue;
      seen.add(foodId);
      result.push(resolved);
      if (result.length >= limit) return result;
    }
  }
  return result;
}
