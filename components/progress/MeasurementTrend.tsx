"use client";

import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Card, IconBadge, Pill, Sparkline } from "@/components/ui";

export interface MetricPoint {
  readonly date: string; // yyyy-mm-dd
  readonly value: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const fmt1 = (n: number) => round1(n).toString().replace(".", ",");

function fmtDelta(n: number): string {
  const r = round1(n);
  const sign = r > 0 ? "+" : r < 0 ? "−" : "";
  return `${sign}${Math.abs(r).toString().replace(".", ",")}`;
}

/**
 * Trend card for an optional body metric (body-fat %, waist cm…). Mirrors the
 * weight card: current value, signed change since the first entry, and a
 * sparkline. Renders nothing with fewer than two data points (the latest value
 * already shows in the bento). `lowerIsBetter` colors the delta semantically.
 */
export function MeasurementTrendCard({
  title,
  unit,
  icon: Icon,
  points,
  lowerIsBetter = true,
}: {
  title: string;
  unit: string;
  icon: LucideIcon;
  points: readonly MetricPoint[];
  lowerIsBetter?: boolean;
}) {
  if (points.length < 2) return null;

  const first = points[0];
  const latest = points[points.length - 1];
  const delta = latest.value - first.value;
  const improving = lowerIsBetter ? delta < 0 : delta > 0;
  const flat = round1(delta) === 0;

  return (
    <Card raised padding="lg" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconBadge tone="primary" size="md">
            <Icon size={18} aria-hidden />
          </IconBadge>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted">{title}</p>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold leading-none text-text">
                {fmt1(latest.value)}
              </span>
              <span className="text-sm font-semibold text-muted">{unit}</span>
            </div>
          </div>
        </div>
        <Pill
          tone={flat ? "muted" : improving ? "success" : "muted"}
          icon={
            flat ? (
              <Minus size={14} aria-hidden />
            ) : delta < 0 ? (
              <ArrowDownRight size={14} aria-hidden />
            ) : (
              <ArrowUpRight size={14} aria-hidden />
            )
          }
        >
          {fmtDelta(delta)} {unit}
        </Pill>
      </div>

      <div className="-mx-1">
        <Sparkline
          points={points.map((p) => p.value)}
          height={72}
          ariaLabel={`Xu hướng ${title.toLowerCase()}, từ ${fmt1(first.value)} đến ${fmt1(latest.value)} ${unit}`}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted">
          Bắt đầu <span className="font-bold text-text">{fmt1(first.value)} {unit}</span>
        </span>
        <span className="text-muted">{points.length} lần đo</span>
      </div>
    </Card>
  );
}
