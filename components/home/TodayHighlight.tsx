"use client";

import Link from "next/link";
import {
  ChevronRight,
  Droplet,
  Flame,
  Beef,
  Trophy,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

import { IconBadge } from "@/components/ui";
import { todayIso } from "@/lib/date";
import {
  computeTodayHighlight,
  type HighlightKind,
} from "@/lib/fitness/today-highlight";
import { useDayFoods, useWater } from "@/lib/store/nutrition-store";
import { useSessions } from "@/lib/store/workout-store";
import { useMeasurements } from "@/lib/store/progress-store";
import { useDailyTargets, useProfile } from "@/lib/store/profile-store";
import { useWaterGoal } from "@/lib/store/preferences-store";

const ICON: Record<HighlightKind, LucideIcon> = {
  pr: Trophy,
  weight: TrendingDown,
  streak: Flame,
  protein: Beef,
  water: Droplet,
};

type Tone = "primary" | "success" | "accent";
const TONE_CARD: Record<Tone, string> = {
  primary: "border-primary/30 bg-primary/5 hover:border-primary/50",
  success: "border-success/30 bg-success/10 hover:border-success/50",
  accent: "border-accent/40 bg-accent/15 hover:border-accent/60",
};
const TONE_BADGE: Record<Tone, "primary" | "success" | "accent"> = {
  primary: "primary",
  success: "success",
  accent: "accent",
};

/**
 * "Today's standout" — a celebratory card surfacing the single best thing that
 * happened today (a strength PR, weight low, streak, or goal met). Reactive to
 * the local stores; renders nothing when there's nothing notable to celebrate.
 */
export function TodayHighlight() {
  const today = todayIso();
  const sessions = useSessions();
  const foodsToday = useDayFoods(today);
  const measurements = useMeasurements();
  const profile = useProfile();
  const targets = useDailyTargets();
  const waterToday = useWater(today);
  const waterGoal = useWaterGoal();

  const highlight = computeTodayHighlight({
    today,
    sessions,
    foodsToday,
    measurements,
    proteinTargetG: targets.proteinG,
    waterToday,
    waterGoal,
    goal: profile?.goal,
  });

  if (!highlight) return null;

  const Icon = ICON[highlight.kind];

  return (
    <Link
      href={highlight.href}
      className={`lift flex items-center gap-3 rounded-card border p-4 shadow-card transition-colors ${TONE_CARD[highlight.tone]}`}
    >
      <IconBadge tone={TONE_BADGE[highlight.tone]} size="md">
        <Icon size={20} aria-hidden />
      </IconBadge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-text">{highlight.title}</p>
        <p className="text-xs leading-snug text-muted">{highlight.text}</p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
