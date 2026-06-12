"use client";

import { Clock, Hash, Pencil, Weight } from "lucide-react";

import { Card, IconBadge } from "@/components/ui";
import { shortDateVi } from "@/lib/date";
import type { WorkoutSession } from "@/lib/store/types";

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN");
const fmtNum = (n: number) => (Math.round(n * 10) / 10).toLocaleString("vi-VN");

function exerciseVolume(sets: { reps: number | null; weightKg: number | null }[]): number {
  return sets.reduce((a, s) => a + (s.reps ?? 0) * (s.weightKg ?? 0), 0);
}

/** Read-only breakdown of a logged workout session, with an edit affordance. */
export function SessionDetail({
  session,
  onEdit,
}: {
  session: WorkoutSession;
  onEdit: () => void;
}) {
  const totalVolume = session.exercises.reduce((a, ex) => a + exerciseVolume(ex.sets), 0);
  const totalSets = session.exercises.reduce((a, ex) => a + ex.sets.length, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat icon={<Clock size={15} aria-hidden />} value={`${fmt(session.durationMin ?? 0)}`} unit="phút" />
        <Stat icon={<Hash size={15} aria-hidden />} value={`${totalSets}`} unit="set" />
        <Stat icon={<Weight size={15} aria-hidden />} value={fmt(totalVolume)} unit="kg" />
      </div>
      <p className="-mt-1 text-center text-xs text-muted">{shortDateVi(session.performedOn)}</p>

      {/* Exercises */}
      <div className="flex flex-col gap-2">
        {session.exercises.map((ex) => {
          const vol = exerciseVolume(ex.sets);
          return (
            <Card key={ex.id} padding="md" className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-semibold text-text">{ex.name}</p>
                {vol > 0 ? (
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
                    {fmt(vol)} kg
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ex.sets.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-pill bg-surface-raised px-2.5 py-1 text-xs font-semibold tabular-nums text-text"
                  >
                    {s.reps ?? "—"}
                    {s.weightKg != null ? ` × ${fmtNum(s.weightKg)}kg` : ""}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
        {session.exercises.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted">Buổi tập chưa ghi bài nào.</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-btn border border-border bg-surface text-sm font-semibold text-text transition-colors hover:border-primary/40 active:scale-[0.98]"
      >
        <Pencil size={16} aria-hidden /> Sửa buổi tập
      </button>
    </div>
  );
}

function Stat({ icon, value, unit }: { icon: React.ReactNode; value: string; unit: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-card bg-surface-raised py-3">
      <IconBadge tone="primary" size="sm">
        {icon}
      </IconBadge>
      <span className="text-base font-bold tabular-nums text-text">{value}</span>
      <span className="text-[11px] text-muted">{unit}</span>
    </div>
  );
}
