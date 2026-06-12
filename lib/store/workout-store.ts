"use client";

import { newId, updateLocal, useLocalValue } from "./local-store";
import type { WorkoutSession } from "./types";

const KEY = "fitvn:workouts:v1";

/** Reactive list of logged workout sessions, newest first. */
export function useSessions(): WorkoutSession[] {
  return useLocalValue<WorkoutSession[]>(KEY, []);
}

export function addSession(
  session: Omit<WorkoutSession, "id" | "createdAt">,
): void {
  updateLocal<WorkoutSession[]>(KEY, [], (list) => [
    { ...session, id: newId(), createdAt: Date.now() },
    ...list,
  ]);
}

export function removeSession(id: string): void {
  updateLocal<WorkoutSession[]>(KEY, [], (list) =>
    list.filter((s) => s.id !== id),
  );
}

export function updateSession(
  id: string,
  patch: Partial<Omit<WorkoutSession, "id" | "createdAt">>,
): void {
  updateLocal<WorkoutSession[]>(KEY, [], (list) =>
    list.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  );
}
