/**
 * Weekly workout insights — a pure 7-day rollup of training, mirroring the
 * nutrition rollup. Aggregates sessions, sets, volume (Σ reps × weight) and
 * duration from the locally-logged sessions so trends surface without a backend.
 */

import { addDaysIso } from "@/lib/date";
import type { WorkoutSession } from "@/lib/store/types";

export interface DayWorkout {
  readonly date: string; // yyyy-mm-dd
  readonly sessions: number;
  /** Σ reps × weightKg across all sets logged that day (kg). */
  readonly volumeKg: number;
  readonly trained: boolean;
}

export interface WeeklyWorkouts {
  /** 7 days, oldest → newest (left → right for a sparkline). */
  readonly days: readonly DayWorkout[];
  readonly daysTrained: number;
  readonly totalSessions: number;
  readonly totalSets: number;
  readonly totalVolumeKg: number;
  readonly totalDurationMin: number;
  /** Most-trained muscle/exercise label by volume this week, if any. */
  readonly topExercise: string | null;
}

const round = (n: number) => Math.round(n);

/** Σ reps × weight for one session (sets missing a value contribute 0). */
function sessionVolume(s: WorkoutSession): number {
  let vol = 0;
  for (const ex of s.exercises) {
    for (const set of ex.sets) {
      if (set.reps != null && set.weightKg != null) vol += set.reps * set.weightKg;
    }
  }
  return vol;
}

function sessionSets(s: WorkoutSession): number {
  return s.exercises.reduce((a, ex) => a + ex.sets.length, 0);
}

export function computeWeeklyWorkouts(
  today: string,
  sessions: ReadonlyArray<WorkoutSession>,
): WeeklyWorkouts {
  const windowDates = new Set<string>();
  for (let i = 0; i < 7; i += 1) windowDates.add(addDaysIso(today, -i));
  const inWeek = sessions.filter((s) => windowDates.has(s.performedOn));

  const days: DayWorkout[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = addDaysIso(today, -i);
    const daySessions = inWeek.filter((s) => s.performedOn === date);
    days.push({
      date,
      sessions: daySessions.length,
      volumeKg: round(daySessions.reduce((a, s) => a + sessionVolume(s), 0)),
      trained: daySessions.length > 0,
    });
  }

  // Top exercise by total volume across the week.
  const volByExercise = new Map<string, number>();
  for (const s of inWeek) {
    for (const ex of s.exercises) {
      let vol = 0;
      for (const set of ex.sets) {
        if (set.reps != null && set.weightKg != null) vol += set.reps * set.weightKg;
      }
      if (vol > 0) volByExercise.set(ex.name, (volByExercise.get(ex.name) ?? 0) + vol);
    }
  }
  let topExercise: string | null = null;
  let topVol = 0;
  for (const [name, vol] of volByExercise) {
    if (vol > topVol) {
      topVol = vol;
      topExercise = name;
    }
  }

  return {
    days,
    daysTrained: days.filter((d) => d.trained).length,
    totalSessions: inWeek.length,
    totalSets: inWeek.reduce((a, s) => a + sessionSets(s), 0),
    totalVolumeKg: round(inWeek.reduce((a, s) => a + sessionVolume(s), 0)),
    totalDurationMin: inWeek.reduce((a, s) => a + (s.durationMin ?? 0), 0),
    topExercise,
  };
}
