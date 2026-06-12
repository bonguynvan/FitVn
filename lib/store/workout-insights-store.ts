"use client";

import { useMemo } from "react";

import { todayIso } from "@/lib/date";
import {
  computeWeeklyWorkouts,
  type WeeklyWorkouts,
} from "@/lib/fitness/workout-insights";
import { useSessions } from "./workout-store";

/** Reactive 7-day workout rollup for the Progress screen. */
export function useWeeklyWorkouts(): WeeklyWorkouts {
  const sessions = useSessions();
  const today = todayIso();
  return useMemo(() => computeWeeklyWorkouts(today, sessions), [today, sessions]);
}
