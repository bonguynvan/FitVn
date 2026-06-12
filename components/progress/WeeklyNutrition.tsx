"use client";

import { Flame, Leaf, Salad, Target } from "lucide-react";

import { Card, IconBadge, Pill, SectionHeader, Sparkline, StatTile } from "@/components/ui";
import { useWeeklyNutrition } from "@/lib/store/nutrition-insights-store";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");

/**
 * 7-day nutrition rollup on the Progress screen: a daily-calorie sparkline plus
 * averages and the health flags (sodium / purine over-limit days) the app logs.
 */
export function WeeklyNutrition() {
  const w = useWeeklyNutrition();

  return (
    <section aria-labelledby="nutri7-heading" className="flex flex-col gap-3">
      <SectionHeader
        id="nutri7-heading"
        action={<Pill tone="muted">{w.daysLogged}/7 ngày</Pill>}
      >
        Dinh dưỡng 7 ngày
      </SectionHeader>

      {w.daysLogged === 0 ? (
        <Card padding="lg" className="flex flex-col items-center gap-2 border-dashed text-center">
          <IconBadge tone="primary" size="md">
            <Salad size={20} aria-hidden />
          </IconBadge>
          <p className="text-sm text-muted">
            Ghi bữa ăn để FitVN tổng hợp xu hướng dinh dưỡng tuần này.
          </p>
        </Card>
      ) : (
        <>
          <Card raised padding="lg" className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-muted">
                  Calo trung bình / ngày
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold leading-none text-text">
                    {fmt(w.avgCalories)}
                  </span>
                  <span className="text-sm font-semibold text-muted">kcal</span>
                </div>
              </div>
              <Pill tone="muted" icon={<Flame size={14} aria-hidden />}>
                {w.daysLogged} ngày ghi
              </Pill>
            </div>

            <div className="-mx-1">
              <Sparkline
                points={w.days.map((d) => d.calories)}
                height={80}
                ariaLabel={`Calo mỗi ngày trong 7 ngày, trung bình ${fmt(w.avgCalories)} kcal`}
              />
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Đạm TB / ngày"
              value={fmt(w.avgProtein)}
              unit="g"
              icon={<Target size={18} aria-hidden />}
            />
            <StatTile
              label="Ngày đủ đạm"
              value={w.proteinGoalDays}
              unit="ngày"
              icon={<Target size={18} aria-hidden />}
            />
            <StatTile
              label="Chất xơ TB"
              value={fmt(w.avgFiber)}
              unit="g"
              icon={<Leaf size={18} aria-hidden />}
            />
            <StatTile
              label="Calo TB"
              value={fmt(w.avgCalories)}
              unit="kcal"
              icon={<Flame size={18} aria-hidden />}
            />
          </div>

          {w.sodiumOverDays > 0 || w.purineOverDays > 0 ? (
            <div className="flex flex-wrap gap-2">
              {w.sodiumOverDays > 0 ? (
                <Pill tone="danger">Vượt natri {w.sodiumOverDays} ngày</Pill>
              ) : null}
              {w.purineOverDays > 0 ? (
                <Pill tone="danger">Vượt purin {w.purineOverDays} ngày</Pill>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
