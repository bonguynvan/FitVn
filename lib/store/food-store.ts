"use client";

import { useEffect, useState } from "react";

import { newId, updateLocal, useLocalValue } from "./local-store";
import type { FoodItem } from "@/lib/data/foods-db";
import { loadFoodLibrary } from "@/lib/data/food-repository";
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

/** Update a user-created food in place, preserving its id + custom flag. */
export function updateCustomFood(
  id: string,
  food: Omit<FoodItem, "id" | "custom">,
): void {
  updateLocal<FoodItem[]>(CUSTOM_KEY, [], (list) =>
    list.map((f) => (f.id === id ? { ...food, id, custom: true } : f)),
  );
}

export function removeCustomFood(id: string): void {
  updateLocal<FoodItem[]>(CUSTOM_KEY, [], (list) =>
    list.filter((f) => f.id !== id),
  );
}

/**
 * The food library: the bundled FCT foods, upgraded after mount to the Dexie
 * cache / Supabase remote when available. Starts with {@link FOODS} so the UI
 * never waits on the network and works fully offline.
 */
export function useLibraryFoods(): FoodItem[] {
  // Starts empty; the bundled catalog (~126 KB) is loaded lazily after mount via
  // a dynamic import inside loadFoodLibrary, so it stays out of the initial
  // nutrition bundle. The picker lives in a sheet, so data is ready by open.
  const [library, setLibrary] = useState<FoodItem[]>([]);

  useEffect(() => {
    let active = true;
    loadFoodLibrary()
      .then((foods) => {
        if (active && foods.length > 0) setLibrary(foods);
      })
      .catch(() => {
        /* leave empty — search simply shows no results until retry */
      });
    return () => {
      active = false;
    };
  }, []);

  return library;
}

/** Custom foods first, then the food library (remote/cache/bundle). */
export function useAllFoods(): FoodItem[] {
  const custom = useCustomFoods();
  const library = useLibraryFoods();
  return [...custom, ...library];
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
