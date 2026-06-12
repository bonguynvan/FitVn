"use client";

import { newId, updateLocal, useLocalValue } from "./local-store";
import type { MarkerKey } from "@/lib/health/markers";

const KEY = "fitvn:health:v1";

/** A single biomarker reading. `value2` is used only by blood pressure (diastolic). */
export interface HealthReading {
  id: string;
  marker: MarkerKey;
  value: number;
  value2: number | null;
  /** yyyy-mm-dd */
  measuredOn: string;
  createdAt: number;
}

/** All readings, newest first. */
export function useHealthReadings(): HealthReading[] {
  return useLocalValue<HealthReading[]>(KEY, []);
}

export function addReading(r: Omit<HealthReading, "id" | "createdAt">): void {
  updateLocal<HealthReading[]>(KEY, [], (list) =>
    [{ ...r, id: newId(), createdAt: Date.now() }, ...list].sort((a, b) =>
      b.measuredOn.localeCompare(a.measuredOn),
    ),
  );
}

export function removeReading(id: string): void {
  updateLocal<HealthReading[]>(KEY, [], (list) => list.filter((r) => r.id !== id));
}

/** Latest reading per marker (by measured date), keyed by marker. */
export function latestByMarker(
  readings: ReadonlyArray<HealthReading>,
): Partial<Record<MarkerKey, HealthReading>> {
  const out: Partial<Record<MarkerKey, HealthReading>> = {};
  for (const r of readings) {
    const cur = out[r.marker];
    if (!cur || r.measuredOn > cur.measuredOn) out[r.marker] = r;
  }
  return out;
}
