"use client";

import { newId, updateLocal, useLocalValue } from "./local-store";

const KEY = "fitvn:templates:v1";

/** A workout template saved by the user (local persistence). */
export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: { name: string; setCount: number }[];
  createdAt: number;
}

/** Reactive list of user-saved templates, newest first. */
export function useTemplates(): WorkoutTemplate[] {
  return useLocalValue<WorkoutTemplate[]>(KEY, []);
}

export function addTemplate(template: {
  name: string;
  exercises: { name: string; setCount: number }[];
}): void {
  updateLocal<WorkoutTemplate[]>(KEY, [], (list) => [
    { ...template, id: newId(), createdAt: Date.now() },
    ...list,
  ]);
}

export function removeTemplate(id: string): void {
  updateLocal<WorkoutTemplate[]>(KEY, [], (list) =>
    list.filter((t) => t.id !== id),
  );
}
