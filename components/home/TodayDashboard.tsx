"use client";

import Link from "next/link";
import { Dumbbell, Flame, Salad, Scale, Sparkles } from "lucide-react";

import {
  Card,
  EmptyState,
  Pill,
  ProgressRing,
  SectionHeader,
  StatTile,
} from "@/components/ui";
import { useDailyTargets } from "@/lib/store/profile-store";
import { todayIso } from "@/lib/date";
import { fmtNum } from "@/lib/format";
import { useDayFoods } from "@/lib/store/nutrition-store";
import { useSessions } from "@/lib/store/workout-store";
import { useMeasurements } from "@/lib/store/progress-store";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
const round1 = (n: number) => Math.round(n * 10) / 10;

function isoNDaysAgo(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() - n);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function workoutStreak(dates: Set<string>, today: string): number {
  let streak = 0;
  while (dates.has(isoNDaysAgo(today, streak))) streak += 1;
  return streak;
}

/**
 * Reactive home dashboard, driven by the local stores so it reflects whatever
 * the user has logged today (meals, workouts, measurements). Shows a welcome
 * call-to-action until there's anything to summarize.
 */
export function TodayDashboard() {
  const today = todayIso();
  const foods = useDayFoods(today);
  const sessions = useSessions();
  const measurements = useMeasurements();
  const targets = useDailyTargets();

  const hasData =
    foods.length > 0 || sessions.length > 0 || measurements.length > 0;

  if (!hasData) {
    return (
      <section aria-labelledby="start-heading" className="flex flex-col gap-3">
        <SectionHeader id="start-heading">Bắt đầu</SectionHeader>
        <EmptyState
          icon={Sparkles}
          title="Bắt đầu hành trình của bạn"
          description="Ghi buổi tập và bữa ăn đầu tiên để FitVN theo dõi calo, macro và tiến độ cho bạn."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/workouts"
                className="inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
              >
                <Dumbbell size={16} aria-hidden />
                Ghi buổi tập
              </Link>
              <Link
                href="/nutrition"
                className="inline-flex items-center gap-2 rounded-btn border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary/50 active:scale-95"
              >
                <Salad size={16} aria-hidden />
                Ghi bữa ăn
              </Link>
            </div>
          }
        />
      </section>
    );
  }

  const totals = foods.reduce(
    (a, f) => ({
      cal: a.cal + f.calories,
      protein: a.protein + f.protein,
      carbs: a.carbs + f.carbs,
      fat: a.fat + f.fat,
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const remaining = Math.max(targets.calories - totals.cal, 0);
  const macros = [
    { label: "Đạm", value: totals.protein, target: targets.proteinG },
    { label: "Tinh bột", value: totals.carbs, target: targets.carbsG },
    { label: "Chất béo", value: totals.fat, target: targets.fatG },
  ];

  const sessionDates = new Set(sessions.map((s) => s.performedOn));
  const streak = workoutStreak(sessionDates, today);
  const weekStart = isoNDaysAgo(today, 6);
  const weekSessions = sessions.filter((s) => s.performedOn >= weekStart).length;
  const latestWeight =
    measurements.length > 0 ? measurements[measurements.length - 1].weightKg : null;

  return (
    <section aria-labelledby="today-heading" className="flex flex-col gap-3">
      <SectionHeader id="today-heading">Hôm nay</SectionHeader>

      <Card raised padding="lg" className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <ProgressRing
            value={totals.cal}
            max={targets.calories}
            size={116}
            stroke={12}
            label={`${fmt(totals.cal)} trên ${fmt(targets.calories)} kcal`}
          >
            <Flame size={20} className="text-primary" aria-hidden />
            <span className="mt-0.5 text-xl font-semibold leading-none text-text">
              {fmt(totals.cal)}
            </span>
            <span className="text-[11px] font-medium text-muted">
              / {fmt(targets.calories)} kcal
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <Pill tone={remaining > 0 ? "accent" : "success"}>
              {remaining > 0 ? `Còn ${fmt(remaining)} kcal` : "Đã đạt mục tiêu"}
            </Pill>
            <p className="mt-2 text-sm leading-snug text-muted">
              {foods.length > 0
                ? "Tiếp tục giữ phong độ — ghi bữa ăn để cập nhật macro."
                : "Chưa ghi món nào hôm nay. Ghi bữa ăn để theo dõi calo."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {macros.map((m) => {
            const ratio = m.target > 0 ? Math.min(m.value / m.target, 1) : 0;
            return (
              <div key={m.label} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-text">{m.label}</span>
                  <span className="text-muted">
                    <span className="font-semibold text-text">{fmtNum(m.value)}</span>
                    {" / "}
                    {m.target}g
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-pill bg-surface-raised">
                  <div
                    className="h-full rounded-pill bg-primary"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Chuỗi ngày" value={streak} unit="ngày" icon={<Flame size={16} />} />
        <StatTile label="Buổi / tuần" value={weekSessions} unit="buổi" icon={<Dumbbell size={16} />} />
        <StatTile
          label="Cân nặng"
          value={latestWeight ?? "—"}
          unit={latestWeight ? "kg" : undefined}
          icon={<Scale size={16} />}
        />
      </div>
    </section>
  );
}
