"use client";

import { useMemo } from "react";

import { todayIso } from "@/lib/date";
import { sodiumLimitFor } from "@/lib/health/conditions";
import {
  computeWeeklyNutrition,
  type WeeklyNutrition,
} from "@/lib/fitness/nutrition-insights";
import { useNutritionHistory } from "./nutrition-store";
import { useDailyTargets, useProfile } from "./profile-store";

/** Reactive 7-day nutrition rollup for the Progress screen. */
export function useWeeklyNutrition(): WeeklyNutrition {
  const nutritionByDay = useNutritionHistory();
  const targets = useDailyTargets();
  const profile = useProfile();
  const today = todayIso();

  return useMemo(
    () =>
      computeWeeklyNutrition({
        today,
        nutritionByDay,
        proteinTargetG: targets.proteinG ?? null,
        sodiumLimitMg: sodiumLimitFor(profile?.conditions),
        goutMode: profile?.goutMode ?? false,
      }),
    [today, nutritionByDay, targets.proteinG, profile?.goutMode, profile?.conditions],
  );
}
