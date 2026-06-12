"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { buildProgressSummary } from "@/lib/progress/share";
import { useMeasurements } from "@/lib/store/progress-store";
import { useProfile } from "@/lib/store/profile-store";
import { useStats } from "@/lib/store/stats-store";
import { useWeeklyWorkouts } from "@/lib/store/workout-insights-store";
import { useWeeklyNutrition } from "@/lib/store/nutrition-insights-store";

/** Share / copy a short progress summary (Web Share API → clipboard fallback). */
export function ShareProgress() {
  const profile = useProfile();
  const measurements = useMeasurements();
  const { stats } = useStats();
  const ww = useWeeklyWorkouts();
  const wn = useWeeklyNutrition();
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const summary = buildProgressSummary({
      name: profile?.name ?? null,
      currentWeightKg: measurements.length ? measurements[measurements.length - 1].weightKg : null,
      startWeightKg: measurements.length ? measurements[0].weightKg : null,
      targetWeightKg: profile?.targetWeightKg ?? null,
      workoutStreak: stats.workoutStreak,
      weekSessions: ww.totalSessions,
      weekVolumeKg: ww.totalVolumeKg,
      daysLogged: wn.daysLogged,
      avgCalories: wn.avgCalories,
    });
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "FitVN", text: summary });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user cancelled the share sheet / permission denied — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-btn border border-border bg-surface text-sm font-semibold text-text transition-colors hover:border-primary/40 active:scale-[0.98]"
    >
      {copied ? (
        <>
          <Check size={16} aria-hidden /> Đã sao chép
        </>
      ) : (
        <>
          <Share2 size={16} aria-hidden /> Chia sẻ tiến độ
        </>
      )}
    </button>
  );
}
