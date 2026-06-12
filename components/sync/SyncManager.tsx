"use client";

import { useEffect, useRef } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DATA_KEYS, hasLocalData } from "@/lib/store/backup";
import { subscribeChanges } from "@/lib/store/local-store";
import { onAuthedUser, pullFromCloud, pushToCloud } from "@/lib/sync/cloud";

/** Wait this long after the last edit before pushing, to batch rapid changes. */
const PUSH_DEBOUNCE_MS = 5_000;

/**
 * Headless cloud auto-sync. Mounted app-wide; only acts when Supabase is
 * configured and there is an authenticated session.
 *
 * - On a fresh device (no local data yet) it pulls the cloud snapshot once.
 * - Otherwise it leaves local data untouched (manual "Khôi phục" stays explicit
 *   to avoid last-write-wins clobbering unsynced edits) and keeps the cloud
 *   backup fresh by debounce-pushing after each change.
 *
 * Auth readiness comes from onAuthStateChange (INITIAL_SESSION), not a one-shot
 * getUser() — the browser client may hydrate the session after first mount.
 */
export function SyncManager() {
  const armed = useRef(false);
  const pushing = useRef(false);
  const didInit = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    const dataKeys = new Set<string>(DATA_KEYS);

    async function doPush() {
      if (pushing.current || cancelled) return;
      pushing.current = true;
      try {
        await pushToCloud();
      } finally {
        pushing.current = false;
      }
    }

    async function initOnce() {
      if (didInit.current || cancelled) return;
      didInit.current = true;

      // Fresh device: adopt the cloud snapshot, then reload so the UI reflects it.
      if (!hasLocalData()) {
        const res = await pullFromCloud();
        if (cancelled) return;
        if (res.ok && !res.empty && (res.applied ?? 0) > 0) {
          window.location.reload();
          return;
        }
      }

      armed.current = true;
      // Sync current state once (covers edits made before arming).
      void doPush();
    }

    const unsubscribeAuth = onAuthedUser(() => void initOnce());

    const unsubscribeChanges = subscribeChanges((key) => {
      if (!armed.current || !dataKeys.has(key)) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void doPush(), PUSH_DEBOUNCE_MS);
    });

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      unsubscribeAuth();
      unsubscribeChanges();
    };
  }, []);

  return null;
}
