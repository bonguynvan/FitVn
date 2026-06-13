/**
 * "Today's standout" — the single most celebration-worthy thing that happened
 * today, picked by priority from logged data. Returns null when nothing notable
 * happened, so the home card only appears when there's a genuine win to show.
 */

import type { GoalType } from "@/types/database.types";
import { estimateOneRepMax } from "@/lib/fitness/exercise-history";
import { computeWorkoutStreak } from "@/lib/fitness/streak";
import type { LoggedFood, Measurement, WorkoutSession } from "@/lib/store/types";

export type HighlightKind = "pr" | "weight" | "streak" | "protein" | "water";

export interface TodayHighlight {
  readonly kind: HighlightKind;
  readonly title: string;
  readonly text: string;
  readonly href: string;
  readonly tone: "primary" | "success" | "accent";
}

export interface HighlightInput {
  readonly today: string;
  readonly sessions: readonly WorkoutSession[];
  readonly foodsToday: readonly LoggedFood[];
  /** Sorted oldest → newest. */
  readonly measurements: readonly Measurement[];
  readonly proteinTargetG: number;
  readonly waterToday: number;
  readonly waterGoal: number;
  readonly goal?: GoalType;
  readonly restWeekdays?: ReadonlyArray<number>;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const fmt0 = (n: number) => Math.round(n).toLocaleString("vi-VN");
const exKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

/** Best estimated 1RM for an exercise across a set of sessions; 0 if none. */
function bestOneRepMax(
  sessions: readonly WorkoutSession[],
  key: string,
): number {
  let best = 0;
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (exKey(ex.name) !== key) continue;
      for (const set of ex.sets) {
        const orm = estimateOneRepMax(set);
        if (orm != null && orm > best) best = orm;
      }
    }
  }
  return best;
}

/** A genuine 1RM PR set today (beats a prior best > 0), the heaviest such. */
function prToday(
  sessions: readonly WorkoutSession[],
  today: string,
): { name: string; oneRepMax: number } | null {
  const todaySessions = sessions.filter((s) => s.performedOn === today);
  if (todaySessions.length === 0) return null;
  const earlier = sessions.filter((s) => s.performedOn < today);

  let best: { name: string; oneRepMax: number } | null = null;
  const seen = new Set<string>();
  for (const s of todaySessions) {
    for (const ex of s.exercises) {
      const key = exKey(ex.name);
      if (seen.has(key)) continue;
      seen.add(key);
      const todayBest = bestOneRepMax(todaySessions, key);
      const priorBest = bestOneRepMax(earlier, key);
      if (todayBest > priorBest && priorBest > 0) {
        if (!best || todayBest > best.oneRepMax) {
          best = { name: ex.name.trim(), oneRepMax: todayBest };
        }
      }
    }
  }
  return best;
}

/**
 * Pick today's standout by priority: a new strength PR, a fresh all-time weight
 * low, a workout streak (≥3, advanced today), protein goal met, then water goal.
 */
export function computeTodayHighlight(input: HighlightInput): TodayHighlight | null {
  const { today, sessions, foodsToday, measurements, proteinTargetG, waterToday, waterGoal, goal, restWeekdays = [] } = input;

  // 1) Strength PR set today.
  const pr = prToday(sessions, today);
  if (pr) {
    return {
      kind: "pr",
      title: "Kỷ lục mới!",
      text: `${pr.name} — 1RM ước tính ${round1(pr.oneRepMax)}kg. Tuyệt vời!`,
      href: "/workouts",
      tone: "primary",
    };
  }

  // 2) All-time weight low recorded today (when not bulking).
  if (measurements.length >= 2 && goal !== "gain_muscle") {
    const latest = measurements[measurements.length - 1];
    const min = Math.min(...measurements.map((m) => m.weightKg));
    if (latest.measuredOn === today && latest.weightKg <= min) {
      return {
        kind: "weight",
        title: "Cân nặng thấp nhất!",
        text: `Bạn đạt ${round1(latest.weightKg)}kg — thấp nhất từ trước đến nay.`,
        href: "/progress",
        tone: "success",
      };
    }
  }

  // 3) Workout streak advanced today (requires a workout logged today).
  const workoutDays = new Set(sessions.map((s) => s.performedOn));
  const streak = workoutDays.has(today)
    ? computeWorkoutStreak(workoutDays, today, new Set(restWeekdays))
    : 0;
  if (streak >= 3) {
    return {
      kind: "streak",
      title: `Chuỗi ${streak} ngày!`,
      text: `Bạn đã tập ${streak} ngày liên tiếp. Giữ vững phong độ nhé!`,
      href: "/workouts",
      tone: "accent",
    };
  }

  // 4) Protein goal met today.
  const proteinToday = foodsToday.reduce((a, f) => a + (f.protein ?? 0), 0);
  if (proteinTargetG > 0 && proteinToday >= proteinTargetG) {
    return {
      kind: "protein",
      title: "Đủ đạm hôm nay!",
      text: `Đã đạt ${fmt0(proteinToday)}g đạm — đúng mục tiêu. Cơ bắp cảm ơn bạn!`,
      href: "/nutrition",
      tone: "success",
    };
  }

  // 5) Water goal met today.
  if (waterGoal > 0 && waterToday >= waterGoal) {
    return {
      kind: "water",
      title: "Đủ nước hôm nay!",
      text: `Bạn đã uống đủ ${waterToday}/${waterGoal} ly nước. Cơ thể đủ nước rồi!`,
      href: "/nutrition",
      tone: "accent",
    };
  }

  return null;
}
