import {
  Droplet,
  Dumbbell,
  Flame,
  Medal,
  Target,
  TrendingDown,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import type { DailyTargets } from "@/lib/fitness/targets";
import { addDaysIso } from "@/lib/date";
import { computeWorkoutStreak } from "@/lib/fitness/streak";
import type { LoggedFood, Measurement, WorkoutSession } from "@/lib/store/types";

export interface FitnessStats {
  /** Consecutive days (ending today or yesterday) with a logged workout. */
  workoutStreak: number;
  totalWorkouts: number;
  /** Days where logged protein met the target. */
  proteinGoalDays: number;
  /** Days where water intake met the goal. */
  waterGoalDays: number;
  /** Consecutive days (ending today or yesterday) with any food logged. */
  loggingStreak: number;
  /** Kilograms lost since the first measurement (positive = lost). */
  weightLostKg: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  earned: boolean;
  current: number;
  target: number;
  unit?: string;
}

export interface StatsInput {
  today: string;
  sessions: WorkoutSession[];
  /** Sorted oldest → newest. */
  measurements: Measurement[];
  nutritionByDay: Record<string, LoggedFood[]>;
  waterByDay: Record<string, number>;
  /** Daily water goal in cups (configurable in preferences). */
  waterGoal: number;
  targets: DailyTargets;
  /** Planned rest weekdays (0=Sun … 6=Sat) that don't break the streak. */
  restWeekdays?: ReadonlyArray<number>;
}

/** Count consecutive days present in `days`, allowing the streak to end on
 *  today OR yesterday (so it isn't "broken" before today is logged). */
function streakFrom(days: Set<string>, today: string): number {
  let cursor = today;
  if (!days.has(cursor)) {
    const yesterday = addDaysIso(today, -1);
    if (!days.has(yesterday)) return 0;
    cursor = yesterday;
  }
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDaysIso(cursor, -1);
  }
  return streak;
}

export function computeStats(input: StatsInput): FitnessStats {
  const {
    today,
    sessions,
    measurements,
    nutritionByDay,
    waterByDay,
    waterGoal,
    targets,
    restWeekdays = [],
  } = input;

  const workoutDays = new Set(sessions.map((s) => s.performedOn));
  const workoutStreak = computeWorkoutStreak(
    workoutDays,
    today,
    new Set(restWeekdays),
  );

  const loggedDays = new Set<string>();
  let proteinGoalDays = 0;
  for (const [date, items] of Object.entries(nutritionByDay)) {
    if (!items || items.length === 0) continue;
    loggedDays.add(date);
    const protein = items.reduce((a, f) => a + (f.protein ?? 0), 0);
    if (targets.proteinG > 0 && protein >= targets.proteinG) proteinGoalDays += 1;
  }
  const loggingStreak = streakFrom(loggedDays, today);

  let waterGoalDays = 0;
  for (const cups of Object.values(waterByDay)) {
    if (cups >= waterGoal) waterGoalDays += 1;
  }

  const weightLostKg =
    measurements.length >= 2
      ? measurements[0].weightKg - measurements[measurements.length - 1].weightKg
      : 0;

  return {
    workoutStreak,
    totalWorkouts: sessions.length,
    proteinGoalDays,
    waterGoalDays,
    loggingStreak,
    weightLostKg,
  };
}

function make(
  id: string,
  title: string,
  description: string,
  icon: LucideIcon,
  current: number,
  target: number,
  unit?: string,
): Achievement {
  return {
    id,
    title,
    description,
    icon,
    current: Math.max(0, current),
    target,
    earned: current >= target,
    unit,
  };
}

export function computeAchievements(stats: FitnessStats): Achievement[] {
  const lost = Math.round(Math.max(0, stats.weightLostKg) * 10) / 10;
  return [
    make("first-workout", "Buổi tập đầu tiên", "Hoàn thành buổi tập đầu tiên", Dumbbell, stats.totalWorkouts, 1),
    make("streak-3", "Chuỗi 3 ngày", "Tập 3 ngày liên tiếp", Flame, stats.workoutStreak, 3),
    make("streak-7", "Chuỗi 7 ngày", "Tập 7 ngày liên tiếp", Flame, stats.workoutStreak, 7),
    make("workouts-10", "10 buổi tập", "Tích lũy 10 buổi tập", Trophy, stats.totalWorkouts, 10),
    make("protein-1", "Đủ đạm", "Đạt mục tiêu đạm trong 1 ngày", Target, stats.proteinGoalDays, 1),
    make("protein-5", "5 ngày đủ đạm", "Đạt mục tiêu đạm trong 5 ngày", Medal, stats.proteinGoalDays, 5),
    make("water-3", "Đủ nước 3 ngày", "Uống đủ nước trong 3 ngày", Droplet, stats.waterGoalDays, 3),
    make("weight-loss", "Giảm cân", "Giảm được 1 kg đầu tiên", TrendingDown, lost, 1, " kg"),
  ];
}
