/**
 * Quick-add suggestions — the foods a user logs most often, at the exact portion
 * they usually log them, so a repeat meal is a single tap. Derived purely from
 * the local diary history; no backend.
 */

import type { LoggedFood } from "@/lib/store/types";

type DayFoods = Record<string, LoggedFood[]>;

/** A re-loggable entry: everything addFood needs except the diary identity. */
export type QuickAddTemplate = Omit<LoggedFood, "id" | "mealType">;

export interface QuickAddSuggestion {
  /** Stable signature (food + portion) for React keys & dedup. */
  readonly key: string;
  /** How many times this exact food+portion has been logged. */
  readonly count: number;
  /** The entry to re-log (macros from the most recent occurrence). */
  readonly template: QuickAddTemplate;
}

/** Identity for "the same food at the same portion". */
function signature(food: LoggedFood): string {
  const id = food.foodId ?? `name:${food.name.trim().toLowerCase()}`;
  const qty = Math.round((food.quantity ?? 0) * 100) / 100;
  return `${id}|${qty}|${food.unit}`;
}

function toTemplate(food: LoggedFood): QuickAddTemplate {
  // Drop diary identity; keep everything needed to re-log identically.
  const { id: _id, mealType: _mealType, ...rest } = food;
  void _id;
  void _mealType;
  return rest;
}

/**
 * Rank logged entries by frequency (then recency) and return the top `limit`
 * distinct food+portion combinations as re-loggable templates.
 */
export function computeQuickAddSuggestions(
  history: DayFoods,
  limit = 6,
): QuickAddSuggestion[] {
  const agg = new Map<
    string,
    { count: number; order: number; template: QuickAddTemplate }
  >();

  // Oldest → newest so the last write wins as the representative template,
  // and `order` increases with recency.
  const dates = Object.keys(history).sort((a, b) => a.localeCompare(b));
  let order = 0;
  for (const date of dates) {
    const items = history[date] ?? [];
    for (const food of items) {
      order += 1;
      const sig = signature(food);
      const prev = agg.get(sig);
      if (prev) {
        prev.count += 1;
        prev.order = order;
        prev.template = toTemplate(food);
      } else {
        agg.set(sig, { count: 1, order, template: toTemplate(food) });
      }
    }
  }

  return [...agg.entries()]
    .sort((a, b) =>
      b[1].count === a[1].count ? b[1].order - a[1].order : b[1].count - a[1].count,
    )
    .slice(0, limit)
    .map(([key, v]) => ({ key, count: v.count, template: v.template }));
}
