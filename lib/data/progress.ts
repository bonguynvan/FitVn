import "server-only";
// import { createClient } from "@/lib/supabase/server"; // TODO(data): real queries

/**
 * Progress page data.
 *
 * Returns the signed-in user's body-composition trend, latest measurements,
 * weekly workout consistency and an achievements roll-up. The real Supabase
 * reads are written below but COMMENTED — the app currently has no backend, so
 * this returns an empty snapshot (`hasData: false`) and the Progress screen
 * shows its "log your first measurement" empty state. Wire up Supabase to light
 * up the charts.
 *
 * Icons are intentionally NOT carried here (this module is `server-only` data,
 * not UI): measurements and achievements are keyed by a stable string id that
 * the page maps to a lucide icon, mirroring the home dashboard's data layer.
 */

/** A single point in the body-weight trend (oldest → newest). */
export interface WeightPoint {
  /** ISO yyyy-mm-dd the weight was measured on. */
  readonly date: string;
  readonly weightKg: number;
}

/** Body-weight trend plus the headline current value and delta vs the start. */
export interface WeightTrend {
  /** Chronological series for the sparkline; empty when no data. */
  readonly series: ReadonlyArray<WeightPoint>;
  /** Latest measured weight (kg), or null when none logged. */
  readonly currentKg: number | null;
  /** First measured weight (kg) in the window, or null when none logged. */
  readonly startKg: number | null;
  /** currentKg − startKg (negative = lost weight), or null when not derivable. */
  readonly deltaKg: number | null;
  /** Optional user goal weight (kg) from the profile. */
  readonly goalKg: number | null;
}

/** Stable identifiers for the body measurements shown as bento StatTiles. */
export type MeasurementId = "weight" | "body_fat" | "waist" | "chest";

/** One body-measurement tile. The page maps `id` → icon + display label. */
export interface MeasurementStat {
  readonly id: MeasurementId;
  /** Formatted value, e.g. "70,5" (Vietnamese decimal comma), or "—". */
  readonly value: string;
  readonly unit: string;
  /** Change copy, e.g. "-1,5kg so với 8 tuần". Empty when no comparison. */
  readonly delta: string;
  readonly deltaTone: "success" | "danger" | "muted";
}

/** Workouts completed in a single week of the consistency chart. */
export interface WeeklyConsistencyPoint {
  /** Short label under the bar, e.g. "T1". */
  readonly label: string;
  readonly value: number;
}

/** Streak + per-week workout consistency. */
export interface Consistency {
  readonly currentStreakDays: number;
  readonly bestStreakDays: number;
  /** One entry per recent week, oldest → newest. */
  readonly weekly: ReadonlyArray<WeeklyConsistencyPoint>;
  /** Target workouts per week (goal line on the chart). */
  readonly weeklyGoal: number;
}

/** Stable identifiers for the achievement badges. */
export type AchievementId =
  | "streak_7"
  | "protein_goal"
  | "first_kg"
  | "streak_30";

/**
 * An achievement badge. The catalog is a fixed list (the page maps `id` → icon
 * + tone + Vietnamese copy); only `earned` / `meta` are data-driven.
 */
export interface AchievementStatus {
  readonly id: AchievementId;
  readonly earned: boolean;
  /** Earned date or progress label, e.g. "10/06" or "12/30 ngày". */
  readonly meta?: string;
}

export interface ProgressData {
  readonly hasData: boolean;
  readonly weight: WeightTrend;
  readonly measurements: ReadonlyArray<MeasurementStat>;
  readonly consistency: Consistency;
  readonly achievements: ReadonlyArray<AchievementStatus>;
}

/**
 * Empty snapshot used until Supabase is wired up. Achievements are kept as a
 * fully-locked catalog so the page can still render the badge list (all locked,
 * 0/4) instead of hiding the section.
 */
const EMPTY_PROGRESS: ProgressData = {
  hasData: false,
  weight: {
    series: [],
    currentKg: null,
    startKg: null,
    deltaKg: null,
    goalKg: null,
  },
  measurements: [],
  consistency: {
    currentStreakDays: 0,
    bestStreakDays: 0,
    weekly: [],
    weeklyGoal: 4,
  },
  achievements: [
    { id: "streak_7", earned: false },
    { id: "protein_goal", earned: false },
    { id: "first_kg", earned: false },
    { id: "streak_30", earned: false },
  ],
};

export async function getProgress(): Promise<ProgressData> {
  // --- Supabase (integrate later) -------------------------------------------
  // const supabase = await createClient();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();
  // if (!user) return EMPTY_PROGRESS;
  //
  // // Resolve "today" in Vietnam time (UTC+7, no DST) so the ~8-week window and
  // // weekly buckets line up with the user's calendar, not UTC.
  // const TZ = "Asia/Ho_Chi_Minh";
  // const isoDate = (d: Date) =>
  //   new Intl.DateTimeFormat("en-CA", {
  //     timeZone: TZ,
  //     year: "numeric",
  //     month: "2-digit",
  //     day: "2-digit",
  //   }).format(d);
  // const today = new Date();
  // const WINDOW_DAYS = 56; // ~8 weeks
  // const since = new Date(today);
  // since.setDate(since.getDate() - (WINDOW_DAYS - 1));
  // const sinceIso = isoDate(since);
  //
  // // 1) Body measurements over the window — drives the weight sparkline and the
  // //    measurement tiles (latest snapshot + delta vs the oldest in-window row).
  // // 2) Workout sessions over the window — drives the weekly consistency bars
  // //    and the current/best streak.
  // const [measurementsRes, profileRes, sessionsRes] = await Promise.all([
  //   supabase
  //     .from("body_measurements")
  //     .select(
  //       "measured_on, weight_kg, body_fat_pct, waist_cm, chest_cm",
  //     )
  //     .eq("user_id", user.id)
  //     .gte("measured_on", sinceIso)
  //     .order("measured_on", { ascending: true }),
  //   supabase
  //     .from("profiles")
  //     .select("weight_kg")
  //     .eq("id", user.id)
  //     .maybeSingle(),
  //   supabase
  //     .from("workout_sessions")
  //     .select("performed_on")
  //     .eq("user_id", user.id)
  //     .gte("performed_on", sinceIso)
  //     .order("performed_on", { ascending: true }),
  // ]);
  //
  // if (measurementsRes.error || profileRes.error || sessionsRes.error) {
  //   return EMPTY_PROGRESS;
  // }
  //
  // const rows = measurementsRes.data ?? [];
  // const sessions = sessionsRes.data ?? [];
  // const hasData = rows.length > 0 || sessions.length > 0;
  // if (!hasData) return EMPTY_PROGRESS;
  //
  // // --- Weight trend -------------------------------------------------------
  // const weighed = rows.filter((r) => r.weight_kg != null);
  // const series = weighed.map((r) => ({
  //   date: r.measured_on,
  //   weightKg: r.weight_kg as number,
  // }));
  // const firstW = weighed[0]?.weight_kg ?? null;
  // const lastW = weighed[weighed.length - 1]?.weight_kg ?? null;
  // const deltaKg = firstW != null && lastW != null ? lastW - firstW : null;
  //
  // // --- Latest snapshot for the measurement tiles --------------------------
  // const latest = rows[rows.length - 1] ?? null;
  // const fmt1 = (n: number) => n.toFixed(1).replace(".", ",");
  // const fmt0 = (n: number) => Math.round(n).toString();
  // const measurements: MeasurementStat[] = [
  //   {
  //     id: "weight",
  //     value: lastW != null ? fmt1(lastW) : "—",
  //     unit: "kg",
  //     delta: deltaKg != null ? `${fmt1(deltaKg)}kg so với 8 tuần` : "",
  //     deltaTone: deltaKg != null && deltaKg < 0 ? "success" : "muted",
  //   },
  //   {
  //     id: "body_fat",
  //     value: latest?.body_fat_pct != null ? fmt1(latest.body_fat_pct) : "—",
  //     unit: "%",
  //     delta: "",
  //     deltaTone: "muted",
  //   },
  //   {
  //     id: "waist",
  //     value: latest?.waist_cm != null ? fmt0(latest.waist_cm) : "—",
  //     unit: "cm",
  //     delta: "",
  //     deltaTone: "muted",
  //   },
  //   {
  //     id: "chest",
  //     value: latest?.chest_cm != null ? fmt0(latest.chest_cm) : "—",
  //     unit: "cm",
  //     delta: "",
  //     deltaTone: "muted",
  //   },
  // ];
  //
  // // --- Weekly consistency + streaks ---------------------------------------
  // const workoutDays = new Set(sessions.map((s) => s.performed_on));
  // const WEEKS = 6;
  // const weekly: WeeklyConsistencyPoint[] = [];
  // for (let w = WEEKS - 1; w >= 0; w -= 1) {
  //   let count = 0;
  //   for (let d = 0; d < 7; d += 1) {
  //     const day = new Date(today);
  //     day.setDate(day.getDate() - (w * 7 + d));
  //     if (workoutDays.has(isoDate(day))) count += 1;
  //   }
  //   weekly.push({ label: `T${WEEKS - w}`, value: count });
  // }
  // // Current streak: consecutive days up to today with a session.
  // let currentStreakDays = 0;
  // for (let d = 0; ; d += 1) {
  //   const day = new Date(today);
  //   day.setDate(day.getDate() - d);
  //   if (!workoutDays.has(isoDate(day))) break;
  //   currentStreakDays += 1;
  // }
  //
  // return {
  //   hasData: true,
  //   weight: {
  //     series,
  //     currentKg: lastW,
  //     startKg: firstW,
  //     deltaKg,
  //     goalKg: null, // set from a dedicated goal column when one exists
  //   },
  //   measurements,
  //   consistency: {
  //     currentStreakDays,
  //     bestStreakDays: currentStreakDays, // derive true best from full history later
  //     weekly,
  //     weeklyGoal: 4,
  //   },
  //   achievements: [
  //     { id: "streak_7", earned: currentStreakDays >= 7, meta: undefined },
  //     { id: "protein_goal", earned: false },
  //     { id: "first_kg", earned: deltaKg != null && deltaKg <= -1 },
  //     {
  //       id: "streak_30",
  //       earned: currentStreakDays >= 30,
  //       meta: `${Math.min(currentStreakDays, 30)}/30 ngày`,
  //     },
  //   ],
  // };
  // --------------------------------------------------------------------------

  return EMPTY_PROGRESS;
}
