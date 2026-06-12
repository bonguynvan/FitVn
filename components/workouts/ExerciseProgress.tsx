"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Dumbbell, Trophy, TrendingUp } from "lucide-react";

import { Card, IconBadge, Pill, SectionHeader, Sheet, Sparkline } from "@/components/ui";
import { shortDateVi } from "@/lib/date";
import {
  computeExerciseHistories,
  type ExerciseHistory,
} from "@/lib/fitness/exercise-history";
import type { WorkoutSession } from "@/lib/store/types";

const fmt1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString("vi-VN");
const fmt0 = (n: number) => Math.round(n).toLocaleString("vi-VN");

const setLabel = (s: { reps: number; weightKg: number }) =>
  `${fmt0(s.reps)} × ${fmt1(s.weightKg)}kg`;

/**
 * Per-exercise progress section: each exercise the user has logged with weights,
 * ranked by recency, showing estimated 1RM, a PR badge, and a strength trend.
 * Tapping a row opens a detailed history sheet.
 */
export function ExerciseProgress({
  sessions,
}: {
  sessions: readonly WorkoutSession[];
}) {
  const histories = useMemo(
    () => computeExerciseHistories(sessions),
    [sessions],
  );
  const [openName, setOpenName] = useState<string | null>(null);

  if (histories.length === 0) return null;

  const open = histories.find((h) => h.name === openName) ?? null;

  return (
    <section aria-labelledby="exercise-progress-heading" className="flex flex-col gap-3">
      <SectionHeader id="exercise-progress-heading">Tiến bộ bài tập</SectionHeader>
      <ul className="flex flex-col gap-3">
        {histories.map((h) => (
          <li key={h.name}>
            <ExerciseRow history={h} onOpen={() => setOpenName(h.name)} />
          </li>
        ))}
      </ul>

      <Sheet
        open={open != null}
        onClose={() => setOpenName(null)}
        title={open?.name ?? "Bài tập"}
      >
        {open ? <ExerciseDetail history={open} /> : null}
      </Sheet>
    </section>
  );
}

function ExerciseRow({
  history,
  onOpen,
}: {
  history: ExerciseHistory;
  onOpen: () => void;
}) {
  return (
    <Card padding="md" className="flex items-center gap-3">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Xem tiến bộ ${history.name}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-btn px-1 py-1 text-left transition-colors hover:bg-surface-raised"
      >
        <IconBadge tone="primary" size="md">
          <Dumbbell size={20} aria-hidden />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-text">{history.name}</p>
            {history.prJustSet ? (
              <Pill tone="primary" icon={<Trophy size={11} aria-hidden />}>
                PR
              </Pill>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] font-semibold text-muted">
            1RM ~{fmt1(history.bestOneRepMax)}kg · {history.sessionCount} buổi
          </p>
        </div>
        {/* Compact strength trend */}
        {history.oneRepMaxTrend.length >= 2 ? (
          <div className="w-14 shrink-0">
            <Sparkline
              points={history.oneRepMaxTrend}
              height={36}
              ariaLabel={`Xu hướng 1RM của ${history.name}`}
            />
          </div>
        ) : null}
        <ChevronRight size={18} aria-hidden className="shrink-0 text-muted" />
      </button>
    </Card>
  );
}

function ExerciseDetail({ history }: { history: ExerciseHistory }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Headline records */}
      <div className="grid grid-cols-2 gap-2">
        <RecordTile
          icon={<TrendingUp size={15} aria-hidden />}
          label="1RM ước tính"
          value={`${fmt1(history.bestOneRepMax)} kg`}
          hint={`${setLabel(history.bestOneRepMaxSet)} · ${shortDateVi(history.bestOneRepMaxDate)}`}
        />
        <RecordTile
          icon={<Dumbbell size={15} aria-hidden />}
          label="Tạ nặng nhất"
          value={`${fmt1(history.heaviestWeightKg)} kg`}
          hint={`${history.sessionCount} buổi đã tập`}
        />
      </div>

      {/* 1RM trend */}
      {history.oneRepMaxTrend.length >= 2 ? (
        <Card raised padding="lg" className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted">
            Xu hướng sức mạnh (1RM ước tính, kg)
          </p>
          <Sparkline
            points={history.oneRepMaxTrend}
            height={88}
            ariaLabel={`Biểu đồ 1RM ước tính của ${history.name} theo thời gian`}
          />
        </Card>
      ) : null}

      {/* Per-session history */}
      <div className="flex flex-col gap-2">
        <p className="px-0.5 text-xs font-semibold text-muted">Lịch sử</p>
        {history.points.map((p, i) => (
          <Card key={`${p.date}-${i}`} padding="md" className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-text">{shortDateVi(p.date)}</p>
                {p.isPr ? (
                  <Pill tone="primary" icon={<Trophy size={11} aria-hidden />}>
                    PR
                  </Pill>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-muted">
                Set tốt nhất {setLabel(p.bestSet)} · {fmt0(p.volumeKg)} kg tổng
              </p>
            </div>
            <span className="shrink-0 text-right text-sm font-bold tabular-nums text-text">
              {fmt1(p.bestOneRepMax)}
              <span className="ml-0.5 text-[10px] font-medium text-muted">kg</span>
            </span>
          </Card>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        1RM ước tính theo công thức Epley (tạ × (1 + số lần / 30)). Chỉ mang tính
        tham khảo để theo dõi xu hướng.
      </p>
    </div>
  );
}

function RecordTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-card bg-surface-raised p-3">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
        {icon} {label}
      </span>
      <span className="text-lg font-bold tabular-nums text-text">{value}</span>
      <span className="truncate text-[11px] text-muted">{hint}</span>
    </div>
  );
}
