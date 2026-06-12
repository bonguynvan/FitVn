"use client";

import { Dumbbell, Layers, Timer, TrendingUp } from "lucide-react";

import { Card, IconBadge, Pill, SectionHeader, Sparkline, StatTile } from "@/components/ui";
import { useWeeklyWorkouts } from "@/lib/store/workout-insights-store";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

/**
 * 7-day training rollup on the Progress screen: a daily-volume sparkline plus
 * sessions, sets, total volume and duration — derived from logged sessions.
 */
export function WeeklyWorkouts() {
  const w = useWeeklyWorkouts();

  return (
    <section aria-labelledby="workout7-heading" className="flex flex-col gap-3">
      <SectionHeader
        id="workout7-heading"
        action={<Pill tone="muted">{w.daysTrained}/7 ngày</Pill>}
      >
        Tập luyện 7 ngày
      </SectionHeader>

      {w.totalSessions === 0 ? (
        <Card padding="lg" className="flex flex-col items-center gap-2 border-dashed text-center">
          <IconBadge tone="primary" size="md">
            <Dumbbell size={20} aria-hidden />
          </IconBadge>
          <p className="text-sm text-muted">
            Ghi buổi tập để FitVN tổng hợp khối lượng và tần suất tuần này.
          </p>
        </Card>
      ) : (
        <>
          <Card raised padding="lg" className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-muted">
                  Tổng khối lượng tuần
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold leading-none text-text">
                    {fmt(w.totalVolumeKg)}
                  </span>
                  <span className="text-sm font-semibold text-muted">kg</span>
                </div>
              </div>
              {w.topExercise ? (
                <Pill tone="muted" icon={<TrendingUp size={14} aria-hidden />}>
                  {w.topExercise}
                </Pill>
              ) : null}
            </div>

            {w.totalVolumeKg > 0 ? (
              <div className="-mx-1">
                <Sparkline
                  points={w.days.map((d) => d.volumeKg)}
                  height={80}
                  ariaLabel={`Khối lượng tập mỗi ngày trong 7 ngày, tổng ${fmt(w.totalVolumeKg)} kg`}
                />
              </div>
            ) : (
              <p className="text-sm text-muted">
                Ghi số rep và mức tạ để xem biểu đồ khối lượng.
              </p>
            )}
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <StatTile
              label="Buổi tập"
              value={w.totalSessions}
              unit="buổi"
              icon={<Dumbbell size={18} aria-hidden />}
            />
            <StatTile
              label="Tổng set"
              value={w.totalSets}
              unit="set"
              icon={<Layers size={18} aria-hidden />}
            />
            <StatTile
              label="Thời lượng"
              value={w.totalDurationMin}
              unit="phút"
              icon={<Timer size={18} aria-hidden />}
            />
          </div>
        </>
      )}
    </section>
  );
}
