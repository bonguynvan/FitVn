"use client";

import { Minus, Moon, Plus, Smile, Zap } from "lucide-react";

import { Card, IconBadge, SectionHeader } from "@/components/ui";
import { todayIso } from "@/lib/date";
import {
  ENERGY_LABELS,
  MOOD_LABELS,
  setCheckIn,
  useCheckIn,
} from "@/lib/store/checkin-store";

/** Quick daily wellbeing check-in (mood / energy / sleep) on the home screen. */
export function DailyCheckIn() {
  const today = todayIso();
  const c = useCheckIn(today);

  return (
    <section aria-labelledby="checkin-heading" className="flex flex-col gap-3">
      <SectionHeader id="checkin-heading">Hôm nay bạn thế nào?</SectionHeader>
      <Card padding="md" className="flex flex-col gap-4">
        <Scale
          icon={<Smile size={16} aria-hidden />}
          label="Tâm trạng"
          labels={MOOD_LABELS}
          value={c.mood}
          onChange={(v) => setCheckIn(today, { mood: v })}
        />
        <Scale
          icon={<Zap size={16} aria-hidden />}
          label="Năng lượng"
          labels={ENERGY_LABELS}
          value={c.energy}
          onChange={(v) => setCheckIn(today, { energy: v })}
        />
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-text">
            <IconBadge tone="muted" size="sm">
              <Moon size={16} aria-hidden />
            </IconBadge>
            Giấc ngủ
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Giảm giờ ngủ"
              onClick={() => setCheckIn(today, { sleepHours: Math.max(0, (c.sleepHours ?? 7) - 0.5) })}
              className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-surface text-text active:scale-95"
            >
              <Minus size={16} />
            </button>
            <span className="w-16 text-center text-sm font-semibold tabular-nums text-text">
              {c.sleepHours != null ? `${c.sleepHours} giờ` : "—"}
            </span>
            <button
              type="button"
              aria-label="Tăng giờ ngủ"
              onClick={() => setCheckIn(today, { sleepHours: Math.min(14, (c.sleepHours ?? 7) + 0.5) })}
              className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-surface text-text active:scale-95"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}

function Scale({
  icon,
  label,
  labels,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  labels: readonly string[];
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-text">
          <IconBadge tone="muted" size="sm">
            {icon}
          </IconBadge>
          {label}
        </span>
        <span className="text-xs text-muted">
          {value != null ? labels[value - 1] : "Chưa ghi"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {labels.map((_, i) => {
          const score = i + 1;
          const active = value != null && score <= value;
          return (
            <button
              key={score}
              type="button"
              aria-label={`${label}: ${labels[i]}`}
              aria-pressed={value === score}
              onClick={() => onChange(score)}
              className={`h-9 rounded-btn text-xs font-semibold transition-colors ${
                active ? "bg-primary text-primary-fg" : "bg-surface-raised text-muted"
              }`}
            >
              {score}
            </button>
          );
        })}
      </div>
    </div>
  );
}
