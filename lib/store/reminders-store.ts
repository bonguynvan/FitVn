"use client";

import { readLocal, updateLocal, useLocalValue } from "./local-store";

const KEY = "fitvn:reminders:v1";
const DISMISS_KEY = "fitvn:reminders-dismissed:v1";

export interface ReminderSettings {
  water: { enabled: boolean; time: string };
  mealLog: { enabled: boolean; time: string };
  markerRecheck: { enabled: boolean; everyDays: number };
  measurement: { enabled: boolean; everyDays: number };
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  water: { enabled: false, time: "16:00" },
  mealLog: { enabled: false, time: "20:00" },
  markerRecheck: { enabled: false, everyDays: 30 },
  measurement: { enabled: false, everyDays: 7 },
};

function mergeSettings(stored: Partial<ReminderSettings>): ReminderSettings {
  return {
    water: { ...DEFAULT_REMINDERS.water, ...stored.water },
    mealLog: { ...DEFAULT_REMINDERS.mealLog, ...stored.mealLog },
    markerRecheck: { ...DEFAULT_REMINDERS.markerRecheck, ...stored.markerRecheck },
    measurement: { ...DEFAULT_REMINDERS.measurement, ...stored.measurement },
  };
}

export function useReminderSettings(): ReminderSettings {
  return mergeSettings(useLocalValue<Partial<ReminderSettings>>(KEY, {}));
}

export function getReminderSettings(): ReminderSettings {
  return mergeSettings(readLocal<Partial<ReminderSettings>>(KEY, {}));
}

export function setReminder<K extends keyof ReminderSettings>(
  key: K,
  patch: Partial<ReminderSettings[K]>,
): void {
  updateLocal<ReminderSettings>(KEY, DEFAULT_REMINDERS, (s) => ({
    ...s,
    [key]: { ...s[key], ...patch },
  }));
}

// --- Per-day dismissals (so a dismissed reminder doesn't nag again today) ---
type DismissMap = Record<string, string[]>;

export function useDismissed(dateIso: string): string[] {
  const map = useLocalValue<DismissMap>(DISMISS_KEY, {});
  return map[dateIso] ?? [];
}

export function dismissReminder(dateIso: string, key: string): void {
  updateLocal<DismissMap>(DISMISS_KEY, {}, (m) => ({
    ...m,
    [dateIso]: [...new Set([...(m[dateIso] ?? []), key])],
  }));
}
