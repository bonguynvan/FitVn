/**
 * Weekly nutrition insights — a pure 7-day rollup of the diary used by the
 * Progress screen. Aggregates calories, protein, fiber and the health markers
 * (sodium, purine) the app already logs, so trends surface without any backend.
 */

import { addDaysIso } from "@/lib/date";
import { purineLimit } from "@/lib/config/targets";
import type { LoggedFood } from "@/lib/store/types";

export interface DayNutrition {
  readonly date: string; // yyyy-mm-dd
  readonly hasLog: boolean;
  readonly calories: number;
  readonly protein: number;
  readonly fiber: number;
  readonly sodium: number;
  readonly purine: number;
}

export interface WeeklyNutrition {
  /** 7 days, oldest → newest (left → right for a sparkline). */
  readonly days: readonly DayNutrition[];
  readonly daysLogged: number;
  /** Averages over LOGGED days only (0 when nothing logged). */
  readonly avgCalories: number;
  readonly avgProtein: number;
  readonly avgFiber: number;
  /** Days that met the protein target (null target → 0). */
  readonly proteinGoalDays: number;
  readonly sodiumOverDays: number;
  readonly purineOverDays: number;
  readonly purineLimitMg: number;
}

const round = (n: number) => Math.round(n);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const optSum = (foods: LoggedFood[], key: keyof LoggedFood) =>
  sum(foods.map((f) => (f[key] as number | null | undefined) ?? 0));

export interface WeeklyInput {
  readonly today: string;
  readonly nutritionByDay: Record<string, LoggedFood[]>;
  readonly proteinTargetG: number | null;
  readonly sodiumLimitMg: number;
  readonly goutMode: boolean;
}

export function computeWeeklyNutrition(input: WeeklyInput): WeeklyNutrition {
  const { today, nutritionByDay, proteinTargetG, sodiumLimitMg, goutMode } = input;
  const purineLimitMg = purineLimit(goutMode);

  const days: DayNutrition[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = addDaysIso(today, -i);
    const foods = nutritionByDay[date] ?? [];
    days.push({
      date,
      hasLog: foods.length > 0,
      calories: round(sum(foods.map((f) => f.calories))),
      protein: round(sum(foods.map((f) => f.protein))),
      fiber: round(optSum(foods, "fiber")),
      sodium: round(optSum(foods, "sodiumMg")),
      purine: round(optSum(foods, "purineMg")),
    });
  }

  const logged = days.filter((d) => d.hasLog);
  const avg = (pick: (d: DayNutrition) => number) =>
    logged.length === 0 ? 0 : round(sum(logged.map(pick)) / logged.length);

  return {
    days,
    daysLogged: logged.length,
    avgCalories: avg((d) => d.calories),
    avgProtein: avg((d) => d.protein),
    avgFiber: avg((d) => d.fiber),
    proteinGoalDays:
      proteinTargetG == null
        ? 0
        : logged.filter((d) => d.protein >= proteinTargetG).length,
    sodiumOverDays: logged.filter((d) => d.sodium > sodiumLimitMg).length,
    purineOverDays: logged.filter((d) => d.purine > purineLimitMg).length,
    purineLimitMg,
  };
}
