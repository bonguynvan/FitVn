"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useOnlineStatus } from "./useOnlineStatus";
import {
  getPendingCount,
  pushPendingToSupabase,
  type SyncSummary,
} from "@/lib/db/sync";

/**
 * Drives the offline → Supabase sync lifecycle for a Client Component tree.
 *
 * - Triggers a sync when the app comes back online (offline → online edge).
 * - Triggers a sync once on mount if already online.
 * - Exposes `pendingCount`, `isSyncing`, the last summary/error, and a manual
 *   `syncNow()` for "Sync now" buttons.
 *
 * The underlying push is single-flight (see lib/db/sync), so overlapping
 * triggers coalesce safely.
 */
export interface UseOfflineSync {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSummary: SyncSummary | null;
  error: string | null;
  syncNow: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSync {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSummary, setLastSummary] = useState<SyncSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track previous online state to detect the offline→online reconnect edge.
  const wasOnline = useRef<boolean>(isOnline);

  const refreshPendingCount = useCallback(async () => {
    try {
      setPendingCount(await getPendingCount());
    } catch {
      // Dexie unavailable (e.g. private mode); ignore for the badge.
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setIsSyncing(true);
    setError(null);
    try {
      const summary = await pushPendingToSupabase();
      setLastSummary(summary);
      await refreshPendingCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đồng bộ thất bại.");
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  // Initial: load pending count, and sync once if already online.
  useEffect(() => {
    void refreshPendingCount();
    if (isOnline) void syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconnect edge: offline → online ⇒ sync.
  useEffect(() => {
    if (isOnline && !wasOnline.current) {
      void syncNow();
    }
    wasOnline.current = isOnline;
  }, [isOnline, syncNow]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSummary,
    error,
    syncNow,
    refreshPendingCount,
  };
}
