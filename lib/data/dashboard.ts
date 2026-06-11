import "server-only";
// import { createClient } from "@/lib/supabase/server"; // TODO(data): real queries
// import { getCoachContext } from "@/lib/coach/context-fetcher";

/**
 * Home dashboard data.
 *
 * Returns the signed-in user's "today" snapshot. The real Supabase reads are
 * written below but COMMENTED — the app currently has no backend, so this
 * returns an empty snapshot (`hasData: false`) and the home screen shows its
 * welcome / get-started state. Wire up Supabase to light up the dashboard.
 */

export interface DashboardMacro {
  readonly label: string;
  readonly value: number;
  readonly target: number;
  readonly unit: string;
}

export interface DashboardData {
  readonly hasData: boolean;
  readonly calories: { readonly consumed: number; readonly goal: number } | null;
  readonly macros: ReadonlyArray<DashboardMacro>;
  readonly todayWorkout: {
    readonly title: string;
    readonly focus: string;
    readonly exercises: number;
    readonly minutes: number;
  } | null;
  readonly stats: {
    readonly streakDays: number;
    readonly weekSessions: number;
    readonly weightKg: number | null;
  };
}

const EMPTY_DASHBOARD: DashboardData = {
  hasData: false,
  calories: null,
  macros: [],
  todayWorkout: null,
  stats: { streakDays: 0, weekSessions: 0, weightKg: null },
};

export async function getDashboard(): Promise<DashboardData> {
  // --- Supabase (integrate later) -------------------------------------------
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return EMPTY_DASHBOARD;
  //
  // // Reuse the coach context fetcher — it already assembles today's nutrition,
  // // workout, targets and the weekly trend from the schema.
  // const ctx = await getCoachContext(user.id, supabase);
  // const consumed = ctx.today.consumed;
  // const targets = ctx.profile.targets;
  // return {
  //   hasData: ctx.today.hasLog || ctx.todayWorkout != null,
  //   calories: targets.calories
  //     ? { consumed: consumed.calories, goal: targets.calories }
  //     : null,
  //   macros: [
  //     { label: "Đạm", value: consumed.proteinG, target: targets.proteinG ?? 0, unit: "g" },
  //     { label: "Tinh bột", value: consumed.carbsG, target: targets.carbsG ?? 0, unit: "g" },
  //     { label: "Chất béo", value: consumed.fatG, target: targets.fatG ?? 0, unit: "g" },
  //   ],
  //   todayWorkout: ctx.todayWorkout
  //     ? { title: "Buổi tập hôm nay", focus: "", exercises: ctx.todayWorkout.exercises.length, minutes: ctx.todayWorkout.durationMin ?? 0 }
  //     : null,
  //   stats: {
  //     streakDays: 0, // derive from session history
  //     weekSessions: ctx.history7d.filter((d) => d.didWorkout).length,
  //     weightKg: ctx.profile.weightKg,
  //   },
  // };
  // --------------------------------------------------------------------------

  return EMPTY_DASHBOARD;
}
