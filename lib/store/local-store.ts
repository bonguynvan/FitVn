"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tiny reactive localStorage store.
 *
 * TEMPORARY persistence so features (logging meals, workouts, measurements)
 * actually work before Supabase is wired up. Updates are reactive across every
 * component in the tab (manual listener registry) and across tabs (storage
 * event). When Supabase lands, swap these reads/writes for server data + the
 * existing offline sync queue (lib/db/sync.ts).
 */

const listeners = new Map<string, Set<() => void>>();

function notify(key: string): void {
  listeners.get(key)?.forEach((l) => l());
}

function subscribe(key: string, cb: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    set?.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    notify(key);
  } catch {
    // Quota / private mode — ignore; the in-memory render still updates.
  }
}

export function updateLocal<T>(
  key: string,
  fallback: T,
  updater: (prev: T) => T,
): void {
  writeLocal(key, updater(readLocal(key, fallback)));
}

/**
 * Reactive read of a JSON value in localStorage. Re-renders when the value
 * changes anywhere. SSR returns `fallback` (no window); the client snapshot
 * takes over after hydration.
 */
export function useLocalValue<T>(key: string, fallback: T): T {
  const sub = useCallback((cb: () => void) => subscribe(key, cb), [key]);
  const getSnapshot = useCallback(
    () => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
    [key],
  );
  const raw = useSyncExternalStore(sub, getSnapshot, () => null);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Stable client-side id. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
