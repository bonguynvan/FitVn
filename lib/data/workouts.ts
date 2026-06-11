import "server-only";
import type { LucideIcon } from "lucide-react";
// import { createClient } from "@/lib/supabase/server"; // TODO(data): real queries
// import { Dumbbell, Flame } from "lucide-react"; // icons for the mapped result
// import type { MuscleGroup } from "@/types/database.types";

import type { PlannedDay } from "@/components/workouts/DayChip";
import type { Exercise } from "@/components/workouts/ExerciseRow";

/**
 * Workouts screen data.
 *
 * Returns the signed-in user's training plan snapshot: the weekly day strip,
 * today's session + its exercises, the weekly volume series, recent sessions
 * and the week summary tiles. The real Supabase reads are written below but
 * COMMENTED — the app currently has no backend, so this returns an empty
 * snapshot (`hasData: false`) and the workouts screen shows its "no plan yet"
 * empty state. Wire up Supabase to light up the plan.
 */

type Tone = "primary" | "accent" | "success" | "muted";

/** Today's training session header (the gradient hero on the page). */
export interface TodaySession {
  readonly title: string;
  readonly focus: string;
  readonly minutes: number;
  /** Number of exercises in the session. */
  readonly exercises: number;
  /** Total-sets label, e.g. "16 hiệp". */
  readonly volume: string;
}

/** A completed session shown in the "recent" list. */
export interface RecentSession {
  readonly id: string;
  readonly name: string;
  readonly focus: string;
  /** Human date label, e.g. "Hôm qua, 11/06". */
  readonly date: string;
  readonly minutes: number;
  /** Total volume in kg; 0 means a cardio / no-load session. */
  readonly volumeKg: number;
  readonly icon: LucideIcon;
  readonly tone: Tone;
}

/** One bar in the weekly training-volume chart (minutes per day). */
export interface VolumeBar {
  readonly label: string;
  readonly value: number;
}

/** Tone for a StatTile delta (matches StatTile's accepted union). */
type DeltaTone = "success" | "danger" | "muted";

/** A labelled value for the week-summary bento tiles. */
export interface WeekStat {
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly delta?: string;
  readonly deltaTone?: DeltaTone;
}

export interface WorkoutsData {
  readonly hasData: boolean;
  /** Header copy, e.g. "Tuần này · 4/5 buổi". */
  readonly weekLabel: string;
  /** Date range under the plan strip, e.g. "6 - 12/06". */
  readonly weekRange: string;
  /** Completion of this week's plan, 0–100. */
  readonly completionPct: number;
  /** Seven day chips (T2..CN). */
  readonly weekPlan: ReadonlyArray<PlannedDay>;
  /** Today's session, or null on a rest / unplanned day. */
  readonly todaySession: TodaySession | null;
  /** Exercises for today's session. */
  readonly todayExercises: ReadonlyArray<Exercise>;
  /** Minutes trained per day this week. */
  readonly weeklyVolume: ReadonlyArray<VolumeBar>;
  /** Daily-minutes goal drawn as the dashed line on the chart. */
  readonly volumeGoalMin: number;
  /** Count of days that reached the goal, e.g. "3/5 đạt". */
  readonly volumeGoalLabel: string;
  /** Week-summary tiles. */
  readonly weekStats: ReadonlyArray<WeekStat>;
  /** Recently completed sessions, newest first. */
  readonly recentSessions: ReadonlyArray<RecentSession>;
}

const EMPTY_WORKOUTS: WorkoutsData = {
  hasData: false,
  weekLabel: "",
  weekRange: "",
  completionPct: 0,
  weekPlan: [],
  todaySession: null,
  todayExercises: [],
  weeklyVolume: [],
  volumeGoalMin: 0,
  volumeGoalLabel: "",
  weekStats: [],
  recentSessions: [],
};

export async function getWorkouts(): Promise<WorkoutsData> {
  // --- Supabase (integrate later) -------------------------------------------
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return EMPTY_WORKOUTS;
  //
  // // Resolve "today" in Vietnam time (DATE columns default to the local day),
  // // plus the Monday-anchored week window for the plan strip / volume chart.
  // const tz = "Asia/Ho_Chi_Minh";
  // const isoDate = (d: Date) =>
  //   new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  // const now = new Date();
  // const todayIso = isoDate(now);
  // // ISO weekday 1..7 (Mon..Sun) — also the plan_exercises.day_of_week value.
  // const dow = ((now.getUTCDay() + 6) % 7) + 1;
  // const monday = new Date(now);
  // monday.setDate(monday.getDate() - (dow - 1));
  // const mondayIso = isoDate(monday);
  //
  // // 1) Active weekly template + its per-day exercises (joined to the library).
  // const { data: plan } = await supabase
  //   .from("workout_plans")
  //   .select("id, name, description, days_per_week")
  //   .eq("user_id", user.id)
  //   .eq("is_active", true)
  //   .order("created_at", { ascending: false })
  //   .limit(1)
  //   .maybeSingle();
  //
  // if (!plan) return EMPTY_WORKOUTS;
  //
  // const { data: planRows } = await supabase
  //   .from("plan_exercises")
  //   .select(
  //     "day_of_week, target_sets, target_reps, order_index, exercises ( name_vi, muscle_group )",
  //   )
  //   .eq("plan_id", plan.id)
  //   .order("day_of_week", { ascending: true })
  //   .order("order_index", { ascending: true });
  //
  // // 2) This week's performed sessions (drives the day strip "done" state and
  // //    the weekly-volume chart) + a few recent ones for the list.
  // const [{ data: weekSessions }, { data: recent }] = await Promise.all([
  //   supabase
  //     .from("workout_sessions")
  //     .select("id, performed_on, duration_min")
  //     .eq("user_id", user.id)
  //     .gte("performed_on", mondayIso),
  //   supabase
  //     .from("workout_sessions")
  //     .select("id, performed_on, duration_min, notes, plan_id")
  //     .eq("user_id", user.id)
  //     .order("performed_on", { ascending: false })
  //     .limit(4),
  // ]);
  //
  // // 3) Per-set rows for today's session + the recent sessions, to derive
  // //    exercise targets (sets × reps) and total volume (Σ reps × weight_kg).
  // const todaySession = (weekSessions ?? []).find(
  //   (s) => s.performed_on === todayIso,
  // );
  // const { data: todaySets } = todaySession
  //   ? await supabase
  //       .from("session_exercises")
  //       .select(
  //         "exercise_id, set_number, reps, weight_kg, order_index, exercises ( name_vi, muscle_group )",
  //       )
  //       .eq("session_id", todaySession.id)
  //       .order("order_index", { ascending: true })
  //   : { data: [] };
  //
  // // Map the rows above into PlannedDay[] / Exercise[] / RecentSession[] /
  // // VolumeBar[] (muscle_group → icon + tone via MUSCLE_TONE, performed_on →
  // // day chip state, Σ reps×weight_kg → volumeKg) and build the WorkoutsData.
  // return { hasData: true, weekLabel: plan.name, /* …mapped fields… */ } as WorkoutsData;
  // --------------------------------------------------------------------------

  return EMPTY_WORKOUTS;
}
