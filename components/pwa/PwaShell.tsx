"use client";

import { usePathname } from "next/navigation";

import { useOfflineSync } from "@/hooks/useOfflineSync";
import { InstallPrompt } from "./InstallPrompt";

/**
 * PwaShell — single client-side mount point for app-wide PWA behavior.
 *
 * Rendered once from the root layout so the install affordance and the
 * offline → Supabase sync lifecycle are actually live across the whole app
 * (these were previously implemented but never mounted).
 *
 * - `useOfflineSync()` drains the IndexedDB sync queue on mount and on the
 *   offline → online reconnect edge.
 * - `<InstallPrompt />` renders its own fixed, dismissible banner.
 */
export function PwaShell() {
  const pathname = usePathname();
  useOfflineSync();
  // No install banner on the auth screen.
  if (pathname === "/login") return null;
  return <InstallPrompt />;
}
