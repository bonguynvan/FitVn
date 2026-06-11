import type { LucideIcon } from "lucide-react";

import { IconBadge, Pill } from "@/components/ui";

/**
 * ExerciseRow — a single exercise line inside the today-session card.
 *
 * Presentational Server Component: a tonal IconBadge glyph, the exercise name
 * with its target sets×reps, and a muscle-group Pill. Kept small and pure so
 * the page composes a list of these without repeating markup.
 */

type MuscleTone = "primary" | "accent" | "success" | "muted";

export interface Exercise {
  readonly name: string;
  /** Target volume, e.g. "4 × 8-10". */
  readonly target: string;
  /** Muscle group label shown as a Pill. */
  readonly muscle: string;
  readonly muscleTone: MuscleTone;
  readonly icon: LucideIcon;
}

interface ExerciseRowProps {
  exercise: Exercise;
  /** 1-based position shown as a quiet ordinal. */
  index: number;
}

export function ExerciseRow({ exercise, index }: ExerciseRowProps) {
  const Icon = exercise.icon;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-surface-raised/60">
      <span className="w-4 shrink-0 text-center text-xs font-bold tabular-nums text-muted">
        {index}
      </span>
      <IconBadge tone="muted" size="sm">
        <Icon size={18} aria-hidden />
      </IconBadge>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">
          {exercise.name}
        </p>
        <p className="text-xs font-medium tabular-nums text-muted">
          {exercise.target}
        </p>
      </div>
      <Pill tone={exercise.muscleTone}>{exercise.muscle}</Pill>
    </li>
  );
}
