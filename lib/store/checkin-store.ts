"use client";

import { updateLocal, useLocalValue } from "./local-store";

const KEY = "fitvn:checkin:v1";

/** A daily wellbeing check-in. mood/energy on a 1–5 scale; sleep in hours. */
export interface DailyCheckIn {
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
}

type CheckInMap = Record<string, DailyCheckIn>;

const EMPTY: DailyCheckIn = { mood: null, energy: null, sleepHours: null };

export function useCheckIn(dateIso: string): DailyCheckIn {
  const map = useLocalValue<CheckInMap>(KEY, {});
  return map[dateIso] ?? EMPTY;
}

export function useCheckInHistory(): CheckInMap {
  return useLocalValue<CheckInMap>(KEY, {});
}

export function setCheckIn(dateIso: string, patch: Partial<DailyCheckIn>): void {
  updateLocal<CheckInMap>(KEY, {}, (m) => ({
    ...m,
    [dateIso]: { ...EMPTY, ...m[dateIso], ...patch },
  }));
}

export const MOOD_LABELS = ["Rất tệ", "Tệ", "Ổn", "Tốt", "Rất tốt"] as const;
export const ENERGY_LABELS = ["Kiệt sức", "Mệt", "Ổn", "Khỏe", "Sung sức"] as const;
