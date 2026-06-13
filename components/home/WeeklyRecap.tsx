"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Dumbbell,
  Salad,
  Target,
  Weight,
} from "lucide-react";

import { Card, IconBadge, Pill, SectionHeader, StatTile } from "@/components/ui";
import { todayIso } from "@/lib/date";
import { computeWeeklyRecap } from "@/lib/fitness/weekly-recap";
import { sodiumLimitFor } from "@/lib/health/conditions";
import { useSessions } from "@/lib/store/workout-store";
import { useNutritionHistory } from "@/lib/store/nutrition-store";
import { useMeasurements } from "@/lib/store/progress-store";
import { useDailyTargets, useProfile } from "@/lib/store/profile-store";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
const fmtDelta = (n: number) => {
  const r = Math.round(n * 10) / 10;
  const sign = r > 0 ? "+" : r < 0 ? "−" : "";
  return `${sign}${Math.abs(r).toString().replace(".", ",")}`;
};

/**
 * Home "Tuần này" card: a 7-day recap of training + nutrition + weight, linking
 * to the full Progress screen. Hidden until there's something to summarize.
 */
export function WeeklyRecap() {
  const today = todayIso();
  const sessions = useSessions();
  const nutritionByDay = useNutritionHistory();
  const measurements = useMeasurements();
  const profile = useProfile();
  const targets = useDailyTargets();

  const recap = computeWeeklyRecap({
    today,
    sessions,
    nutritionByDay,
    measurements,
    proteinTargetG: Number.isFinite(targets.proteinG) ? targets.proteinG : null,
    sodiumLimitMg: sodiumLimitFor(profile?.conditions),
    goutMode: profile?.goutMode ?? false,
  });

  if (!recap.hasAny) return null;

  const weightDown = recap.weightDeltaKg != null && recap.weightDeltaKg < 0;

  return (
    <section aria-labelledby="weekly-recap-heading" className="flex flex-col gap-3">
      <SectionHeader id="weekly-recap-heading">Tuần này</SectionHeader>
      <Link
        href="/progress"
        className="lift flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card hover:border-primary/50"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted">7 ngày qua</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Chi tiết <ChevronRight size={14} aria-hidden />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Ngày tập"
            value={`${recap.daysTrained}/7`}
            unit="ngày"
            icon={<Dumbbell size={16} aria-hidden />}
          />
          <StatTile
            label="Khối lượng"
            value={fmt(recap.totalVolumeKg)}
            unit="kg"
            icon={<Weight size={16} aria-hidden />}
          />
          <StatTile
            label="Ngày ghi ăn"
            value={`${recap.daysLogged}/7`}
            unit="ngày"
            icon={<Salad size={16} aria-hidden />}
          />
          <StatTile
            label="Ngày đủ đạm"
            value={recap.proteinGoalDays}
            unit="ngày"
            icon={<Target size={16} aria-hidden />}
          />
        </div>

        {(recap.weightDeltaKg != null || recap.topExercise) ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {recap.weightDeltaKg != null ? (
              <Pill
                tone={weightDown ? "success" : "muted"}
                icon={
                  weightDown ? (
                    <ArrowDownRight size={14} aria-hidden />
                  ) : (
                    <ArrowUpRight size={14} aria-hidden />
                  )
                }
              >
                {fmtDelta(recap.weightDeltaKg)} kg
              </Pill>
            ) : null}
            {recap.topExercise ? (
              <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted">
                <IconBadge tone="primary" size="sm">
                  <Dumbbell size={12} aria-hidden />
                </IconBadge>
                <span className="truncate">
                  Nổi bật: <span className="font-semibold text-text">{recap.topExercise}</span>
                </span>
              </span>
            ) : null}
          </div>
        ) : null}
      </Link>
    </section>
  );
}
