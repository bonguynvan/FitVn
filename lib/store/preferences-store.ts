"use client";

import { useLocalValue, writeLocal } from "./local-store";
import { WATER_GOAL_CUPS } from "@/lib/config/targets";

const WATER_GOAL_KEY = "fitvn:prefs:water-goal:v1";

const MIN_WATER = 1;
const MAX_WATER = 20;

/** Reactive daily water goal (cups); defaults to the app constant. */
export function useWaterGoal(): number {
  const v = useLocalValue<number>(WATER_GOAL_KEY, WATER_GOAL_CUPS);
  return Number.isFinite(v) && v > 0 ? v : WATER_GOAL_CUPS;
}

export function setWaterGoal(cups: number): void {
  const clamped = Math.min(MAX_WATER, Math.max(MIN_WATER, Math.round(cups)));
  writeLocal(WATER_GOAL_KEY, clamped);
}
