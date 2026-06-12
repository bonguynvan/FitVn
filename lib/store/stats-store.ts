"use client";

import { useMemo } from "react";

import { todayIso } from "@/lib/date";
import {
  computeAchievements,
  computeStats,
  type Achievement,
  type FitnessStats,
} from "@/lib/fitness/achievements";
import { useNutritionHistory, useWaterHistory } from "./nutrition-store";
import { useMeasurements } from "./progress-store";
import { useDailyTargets } from "./profile-store";
import { useWaterGoal } from "./preferences-store";
import { useSessions } from "./workout-store";

/** Reactive fitness stats + achievements derived from every local store. */
export function useStats(): { stats: FitnessStats; achievements: Achievement[] } {
  const sessions = useSessions();
  const measurements = useMeasurements();
  const nutritionByDay = useNutritionHistory();
  const waterByDay = useWaterHistory();
  const waterGoal = useWaterGoal();
  const targets = useDailyTargets();
  const today = todayIso();

  return useMemo(() => {
    const stats = computeStats({
      today,
      sessions,
      measurements,
      nutritionByDay,
      waterByDay,
      waterGoal,
      targets,
    });
    return { stats, achievements: computeAchievements(stats) };
  }, [today, sessions, measurements, nutritionByDay, waterByDay, waterGoal, targets]);
}
