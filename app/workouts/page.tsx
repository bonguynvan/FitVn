import type { Metadata } from "next";

import { WorkoutsScreen } from "@/components/workouts/WorkoutsScreen";

/**
 * Workouts — the training log screen.
 *
 * Thin Server Component wrapper: sets the route metadata and renders the
 * interactive client screen, which reads/writes logged sessions from local
 * persistence (lib/store/workout-store). The legacy plan data layer
 * (lib/data/workouts.ts) is kept on disk for the future Supabase path.
 */

export const metadata: Metadata = {
  title: "Lịch tập",
};

export default function WorkoutsPage() {
  return <WorkoutsScreen />;
}
