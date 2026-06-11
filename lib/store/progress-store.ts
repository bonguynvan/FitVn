"use client";

import { newId, updateLocal, useLocalValue } from "./local-store";
import type { Measurement } from "./types";

const KEY = "fitvn:measurements:v1";

/** Reactive measurements, sorted oldest → newest (for trend charts). */
export function useMeasurements(): Measurement[] {
  const list = useLocalValue<Measurement[]>(KEY, []);
  return [...list].sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
}

export function addMeasurement(
  measurement: Omit<Measurement, "id" | "createdAt">,
): void {
  updateLocal<Measurement[]>(KEY, [], (list) => {
    // One entry per day — replace any existing same-day record.
    const rest = list.filter((m) => m.measuredOn !== measurement.measuredOn);
    return [...rest, { ...measurement, id: newId(), createdAt: Date.now() }];
  });
}

export function removeMeasurement(id: string): void {
  updateLocal<Measurement[]>(KEY, [], (list) =>
    list.filter((m) => m.id !== id),
  );
}
