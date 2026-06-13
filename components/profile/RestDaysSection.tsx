"use client";

import { CalendarOff } from "lucide-react";

import { Card } from "@/components/ui";
import { toggleRestDay, useRestDays } from "@/lib/store/preferences-store";

/** Weekday labels indexed by JS getDay (0=Sun … 6=Sat). */
const WEEKDAYS = [
  { day: 1, label: "T2" },
  { day: 2, label: "T3" },
  { day: 3, label: "T4" },
  { day: 4, label: "T5" },
  { day: 5, label: "T6" },
  { day: 6, label: "T7" },
  { day: 0, label: "CN" },
] as const;

/** Pick planned rest weekdays — these don't break the workout streak. */
export function RestDaysSection() {
  const restDays = useRestDays();
  const restSet = new Set(restDays);

  return (
    <Card padding="md" className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-primary/10 text-primary">
            <CalendarOff size={18} aria-hidden />
          </span>
          <p className="text-xs leading-relaxed text-muted">
            Chọn ngày nghỉ cố định trong tuần. Những ngày này sẽ không làm mất chuỗi
            tập luyện của bạn.
          </p>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map(({ day, label }) => {
            const active = restSet.has(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                onClick={() => toggleRestDay(day)}
                className={`inline-flex h-10 items-center justify-center rounded-btn border text-xs font-bold transition-colors active:scale-95 ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted hover:border-primary/40"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
    </Card>
  );
}
