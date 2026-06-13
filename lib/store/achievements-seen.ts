"use client";

import { readLocal, writeLocal } from "./local-store";

const SEEN_KEY = "fitvn:achievements:seen:v1";

interface SeenState {
  /** Achievement ids the user has already been shown as earned. */
  ids: string[];
  /** Whether the baseline has been set (so we don't celebrate pre-existing). */
  initialized: boolean;
}

const EMPTY: SeenState = { ids: [], initialized: false };

export function readSeen(): SeenState {
  const v = readLocal<SeenState | null>(SEEN_KEY, null);
  if (!v || !Array.isArray(v.ids)) return EMPTY;
  return { ids: v.ids, initialized: Boolean(v.initialized) };
}

/** Baseline: mark the currently-earned set as seen without celebrating. */
export function initSeen(earnedIds: readonly string[]): void {
  writeLocal<SeenState>(SEEN_KEY, { ids: [...earnedIds], initialized: true });
}

/** Add newly-celebrated ids to the seen set. */
export function markSeen(ids: readonly string[]): void {
  const prev = readSeen();
  const merged = new Set([...prev.ids, ...ids]);
  writeLocal<SeenState>(SEEN_KEY, { ids: [...merged], initialized: true });
}
