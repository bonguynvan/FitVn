/**
 * Per-exercise progress & personal records — a pure rollup over every logged
 * session, grouped by exercise name. Surfaces the single most motivating view in
 * a training log: "am I getting stronger on this lift?".
 *
 * Strength is compared via estimated one-rep max (Epley: w × (1 + reps/30)),
 * which lets sets at different rep ranges be ranked on one scale. All data comes
 * from local sessions — no backend.
 */

import type { LoggedSet, WorkoutSession } from "@/lib/store/types";

/** Epley estimated 1RM for a single set; null when reps/weight are missing. */
export function estimateOneRepMax(set: LoggedSet): number | null {
  if (set.reps == null || set.weightKg == null) return null;
  if (set.reps <= 0 || set.weightKg <= 0) return null;
  return set.weightKg * (1 + set.reps / 30);
}

/** A set that carries both reps and weight. */
export interface ScoredSet {
  reps: number;
  weightKg: number;
  oneRepMax: number;
}

/** One session's contribution to an exercise's history. */
export interface ExerciseSessionPoint {
  readonly date: string; // yyyy-mm-dd
  /** Best estimated 1RM achieved in this session. */
  readonly bestOneRepMax: number;
  /** The set behind `bestOneRepMax`. */
  readonly bestSet: ScoredSet;
  /** Σ reps × weight across the exercise's scored sets this session. */
  readonly volumeKg: number;
  /** True when this session set a new all-time 1RM at the time it happened. */
  readonly isPr: boolean;
}

export interface ExerciseHistory {
  readonly name: string;
  readonly sessionCount: number;
  /** yyyy-mm-dd of the most recent session featuring this exercise. */
  readonly lastPerformed: string;
  /** All-time best estimated 1RM and the set + date behind it. */
  readonly bestOneRepMax: number;
  readonly bestOneRepMaxSet: ScoredSet;
  readonly bestOneRepMaxDate: string;
  /** Heaviest weight ever moved on this exercise (any rep count). */
  readonly heaviestWeightKg: number;
  /** Best-1RM per session, chronological — drives the trend sparkline. */
  readonly oneRepMaxTrend: readonly number[];
  /** Per-session points, most recent first. */
  readonly points: readonly ExerciseSessionPoint[];
  /** True when the most recent session set a new all-time 1RM PR. */
  readonly prJustSet: boolean;
}

/** Normalize an exercise name for grouping (case/space-insensitive). */
function key(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Scored sets (reps + weight present) for an exercise within one session. */
function scoredSets(sets: readonly LoggedSet[]): ScoredSet[] {
  const out: ScoredSet[] = [];
  for (const set of sets) {
    const oneRepMax = estimateOneRepMax(set);
    if (oneRepMax != null && set.reps != null && set.weightKg != null) {
      out.push({ reps: set.reps, weightKg: set.weightKg, oneRepMax });
    }
  }
  return out;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

interface RawSession {
  date: string;
  createdAt: number;
  bestSet: ScoredSet;
  bestOneRepMax: number;
  volumeKg: number;
  heaviestWeightKg: number;
}

/**
 * Build per-exercise histories from all sessions. Only exercises with at least
 * one scored set (reps + weight) are included. Sorted by most recent first.
 */
export function computeExerciseHistories(
  sessions: readonly WorkoutSession[],
): ExerciseHistory[] {
  // Group raw per-session bests by normalized exercise name.
  const groups = new Map<string, { name: string; raw: RawSession[] }>();

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const scored = scoredSets(exercise.sets);
      if (scored.length === 0) continue;

      let bestSet = scored[0];
      let volumeKg = 0;
      let heaviestWeightKg = 0;
      for (const s of scored) {
        if (s.oneRepMax > bestSet.oneRepMax) bestSet = s;
        volumeKg += s.reps * s.weightKg;
        if (s.weightKg > heaviestWeightKg) heaviestWeightKg = s.weightKg;
      }

      const k = key(exercise.name);
      const group = groups.get(k) ?? { name: exercise.name.trim(), raw: [] };
      group.raw.push({
        date: session.performedOn,
        createdAt: session.createdAt,
        bestSet,
        bestOneRepMax: bestSet.oneRepMax,
        volumeKg,
        heaviestWeightKg,
      });
      groups.set(k, group);
    }
  }

  const histories: ExerciseHistory[] = [];

  for (const { name, raw } of groups.values()) {
    // Chronological (oldest → newest) for PR detection & the trend line.
    const chrono = [...raw].sort((a, b) =>
      a.date === b.date ? a.createdAt - b.createdAt : a.date.localeCompare(b.date),
    );

    let runningBest = 0;
    let bestOneRepMax = 0;
    let bestSet = chrono[0].bestSet;
    let bestDate = chrono[0].date;
    let heaviestWeightKg = 0;

    const pointsChrono: ExerciseSessionPoint[] = chrono.map((r) => {
      const isPr = r.bestOneRepMax > runningBest;
      if (isPr) runningBest = r.bestOneRepMax;
      if (r.bestOneRepMax > bestOneRepMax) {
        bestOneRepMax = r.bestOneRepMax;
        bestSet = r.bestSet;
        bestDate = r.date;
      }
      if (r.heaviestWeightKg > heaviestWeightKg) heaviestWeightKg = r.heaviestWeightKg;
      return {
        date: r.date,
        bestOneRepMax: round1(r.bestOneRepMax),
        bestSet: r.bestSet,
        volumeKg: Math.round(r.volumeKg),
        isPr,
      };
    });

    const lastPoint = pointsChrono[pointsChrono.length - 1];

    histories.push({
      name,
      sessionCount: chrono.length,
      lastPerformed: lastPoint.date,
      bestOneRepMax: round1(bestOneRepMax),
      bestOneRepMaxSet: bestSet,
      bestOneRepMaxDate: bestDate,
      heaviestWeightKg: round1(heaviestWeightKg),
      oneRepMaxTrend: pointsChrono.map((p) => p.bestOneRepMax),
      points: [...pointsChrono].reverse(),
      prJustSet: lastPoint.isPr && pointsChrono.length > 1,
    });
  }

  // Most recently trained first; ties broken by total sessions.
  histories.sort((a, b) =>
    a.lastPerformed === b.lastPerformed
      ? b.sessionCount - a.sessionCount
      : b.lastPerformed.localeCompare(a.lastPerformed),
  );

  return histories;
}

/**
 * Names of exercises in `session` that set a NEW all-time 1RM PR, considering
 * only sessions strictly before this one (by date, then createdAt). Used to
 * badge a session's PRs.
 */
export function prsInSession(
  session: WorkoutSession,
  allSessions: readonly WorkoutSession[],
): Set<string> {
  const prs = new Set<string>();

  for (const exercise of session.exercises) {
    const scored = scoredSets(exercise.sets);
    if (scored.length === 0) continue;
    const sessionBest = Math.max(...scored.map((s) => s.oneRepMax));

    const k = key(exercise.name);
    let priorBest = 0;
    for (const other of allSessions) {
      const isBefore =
        other.performedOn < session.performedOn ||
        (other.performedOn === session.performedOn && other.createdAt < session.createdAt);
      if (!isBefore) continue;
      for (const ex of other.exercises) {
        if (key(ex.name) !== k) continue;
        for (const s of scoredSets(ex.sets)) {
          if (s.oneRepMax > priorBest) priorBest = s.oneRepMax;
        }
      }
    }

    if (sessionBest > priorBest && priorBest > 0) prs.add(exercise.name.trim());
    // First-ever time with data also counts as a PR (a new best from zero).
    else if (priorBest === 0) prs.add(exercise.name.trim());
  }

  return prs;
}
