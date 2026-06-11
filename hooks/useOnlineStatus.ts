"use client";

import { useEffect, useState } from "react";

/**
 * Reactive online/offline status.
 *
 * Starts from `navigator.onLine`, then tracks the window `online`/`offline`
 * events. SSR-safe: defaults to `true` on the server and reconciles on mount
 * (avoids a hydration flash of the offline UI).
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Reconcile with the real value once mounted in the browser.
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
