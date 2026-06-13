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

const REST_DURATION_KEY = "fitvn:prefs:rest-duration:v1";

/** Default rest-timer duration in seconds. */
export const DEFAULT_REST_SECONDS = 90;
const MIN_REST = 10;
const MAX_REST = 600;

/** Reactive default rest duration (seconds) for the workout rest timer. */
export function useRestDuration(): number {
  const v = useLocalValue<number>(REST_DURATION_KEY, DEFAULT_REST_SECONDS);
  return Number.isFinite(v) && v >= MIN_REST ? v : DEFAULT_REST_SECONDS;
}

export function setRestDuration(seconds: number): void {
  const clamped = Math.min(MAX_REST, Math.max(MIN_REST, Math.round(seconds)));
  writeLocal(REST_DURATION_KEY, clamped);
}
