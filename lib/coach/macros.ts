/**
 * FitVN — pure macro math helpers for the AI Coach.
 *
 * Kept separate from the data-fetching layer so the arithmetic is trivially
 * unit-testable and side-effect free. All functions are pure and never throw.
 */

import type { MacroBundle, MacroRemaining } from './types';

/** Foods store macros per 100g; quantities are logged in grams (unit 'g'). */
const GRAMS_PER_REFERENCE = 100;

/** A zeroed macro bundle — used as a fold seed and an empty-state default. */
export const ZERO_MACROS: MacroBundle = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
};

/** Round to one decimal place to keep prompt numbers compact and readable. */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Scale a per-100g macro profile by a logged quantity in grams.
 *
 * Only gram-based units are scaled by mass; for any non-gram unit we treat
 * `quantity` as the gram amount as a best-effort fallback (the schema
 * defaults `unit` to 'g', so this is the dominant path). Returns ZERO_MACROS
 * for non-positive quantities to stay defensive against bad data.
 */
export function scaleMacros(
  per100g: MacroBundle,
  quantityGrams: number,
): MacroBundle {
  if (!Number.isFinite(quantityGrams) || quantityGrams <= 0) {
    return ZERO_MACROS;
  }
  const factor = quantityGrams / GRAMS_PER_REFERENCE;
  return {
    calories: round1(per100g.calories * factor),
    proteinG: round1(per100g.proteinG * factor),
    carbsG: round1(per100g.carbsG * factor),
    fatG: round1(per100g.fatG * factor),
  };
}

/** Sum two macro bundles, rounding the result for stable display. */
export function addMacros(a: MacroBundle, b: MacroBundle): MacroBundle {
  return {
    calories: round1(a.calories + b.calories),
    proteinG: round1(a.proteinG + b.proteinG),
    carbsG: round1(a.carbsG + b.carbsG),
    fatG: round1(a.fatG + b.fatG),
  };
}

/**
 * Compute remaining macros vs targets. A null target yields a null
 * remaining (target not set), so the coach never invents a goal the user
 * didn't choose. Remaining may be negative when the user is over target.
 */
export function computeRemaining(
  consumed: MacroBundle,
  targets: {
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  },
): MacroRemaining {
  const diff = (target: number | null, used: number): number | null =>
    target == null ? null : round1(target - used);

  return {
    calories: diff(targets.calories, consumed.calories),
    proteinG: diff(targets.proteinG, consumed.proteinG),
    carbsG: diff(targets.carbsG, consumed.carbsG),
    fatG: diff(targets.fatG, consumed.fatG),
  };
}
