"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Droplet,
  Dumbbell,
  Flame,
  HeartPulse,
  LineChart,
  Minus,
  Plus,
  Ruler,
  Scale,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { BrandHero } from "@/components/nav/BrandHero";
import { WeeklyNutrition } from "@/components/progress/WeeklyNutrition";
import { WeeklyWorkouts } from "@/components/progress/WeeklyWorkouts";
import { MeasurementTrendCard } from "@/components/progress/MeasurementTrend";
import { HealthMarkers } from "@/components/progress/HealthMarkers";
import { ShareProgress } from "@/components/progress/ShareProgress";
import { Card, EmptyState, IconBadge, Pill, SectionHeader, Sparkline, StatTile, Sheet } from "@/components/ui";
import { shortDateVi, todayIso } from "@/lib/date";
import type { Achievement } from "@/lib/fitness/achievements";
import {
  addMeasurement,
  removeMeasurement,
  updateMeasurement,
  useMeasurements,
} from "@/lib/store/progress-store";
import { useStats } from "@/lib/store/stats-store";
import { useProfile } from "@/lib/store/profile-store";
import type { Measurement } from "@/lib/store/types";

/** "70,5" — one decimal, comma separator (vi-VN). */
const fmtKg = (n: number) => n.toFixed(1).replace(".", ",");

/** Signed weight delta, e.g. "-1,2" / "+0,5". */
function fmtDelta(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${Math.abs(rounded).toFixed(1).replace(".", ",")}`;
}

/** "—" for nulls, otherwise the value rounded to one decimal (vi-VN). */
const fmtOptional = (n: number | null) =>
  n == null ? "—" : (Math.round(n * 10) / 10).toString().replace(".", ",");

export function ProgressScreen() {
  const measurements = useMeasurements();
  const { stats, achievements } = useStats();
  const profile = useProfile();
  const targetWeight = profile?.targetWeightKg ?? null;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Measurement | null>(null);

  const earnedCount = achievements.filter((a) => a.earned).length;
  const hasData = measurements.length > 0;
  const latest = hasData ? measurements[measurements.length - 1] : null;
  const first = hasData ? measurements[0] : null;

  // Weights in chronological order drive the trend chart.
  const weights = useMemo(
    () => measurements.map((m) => m.weightKg),
    [measurements],
  );

  // Optional-metric series (only entries where the value was recorded).
  const bodyFatSeries = useMemo(
    () =>
      measurements
        .filter((m) => m.bodyFatPct != null)
        .map((m) => ({ date: m.measuredOn, value: m.bodyFatPct as number })),
    [measurements],
  );
  const waistSeries = useMemo(
    () =>
      measurements
        .filter((m) => m.waistCm != null)
        .map((m) => ({ date: m.measuredOn, value: m.waistCm as number })),
    [measurements],
  );
  const hasMetricTrend = bodyFatSeries.length >= 2 || waistSeries.length >= 2;

  // Delta vs the first ever entry; negative = weight lost (the desired direction).
  const delta = latest && first ? latest.weightKg - first.weightKg : 0;
  const lostOrFlat = delta <= 0;

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <BrandHero
        eyebrow="Tiến độ"
        title="Hành trình của bạn"
        subtitle={
          hasData
            ? "Theo dõi cân nặng và số đo cơ thể theo thời gian."
            : "Ghi số đo đầu tiên để bắt đầu theo dõi tiến độ."
        }
        action={
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Ghi số đo"
            className="inline-flex h-11 w-11 items-center justify-center rounded-btn bg-white/20 text-primary-fg active:scale-95"
          >
            <Plus size={22} />
          </button>
        }
      />

      {/* Streak highlight + key stats */}
      <section aria-labelledby="streak-heading" className="flex flex-col gap-3">
        <SectionHeader id="streak-heading">Chuỗi tập luyện</SectionHeader>
        <Card raised padding="lg">
          <div className="flex items-center gap-4">
            <IconBadge tone="primary" size="lg">
              <Flame size={26} aria-hidden />
            </IconBadge>
            <div className="min-w-0">
              <p className="text-3xl font-extrabold leading-none text-text">
                {stats.workoutStreak}{" "}
                <span className="text-base font-semibold text-muted">ngày</span>
              </p>
              <p className="mt-1.5 text-sm leading-snug text-muted">
                {stats.workoutStreak > 0
                  ? "Chuỗi ngày tập liên tiếp — giữ vững nhé!"
                  : "Tập hôm nay để bắt đầu chuỗi của bạn."}
              </p>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            label="Tổng buổi"
            value={stats.totalWorkouts}
            unit="buổi"
            icon={<Dumbbell size={16} aria-hidden />}
          />
          <StatTile
            label="Ngày đủ đạm"
            value={stats.proteinGoalDays}
            unit="ngày"
            icon={<Target size={16} aria-hidden />}
          />
          <StatTile
            label="Ngày đủ nước"
            value={stats.waterGoalDays}
            unit="ngày"
            icon={<Droplet size={16} aria-hidden />}
          />
        </div>
      </section>

      {/* Share progress summary */}
      <ShareProgress />

      {/* Weekly nutrition rollup */}
      <WeeklyNutrition />

      {/* Weekly workout rollup */}
      <WeeklyWorkouts />

      {/* Health markers (blood / biomarkers) */}
      <HealthMarkers />

      {/* Achievements */}
      <section aria-labelledby="ach-heading" className="flex flex-col gap-3">
        <SectionHeader
          id="ach-heading"
          action={
            <Pill tone="muted">
              {earnedCount}/{achievements.length}
            </Pill>
          }
        >
          Thành tích
        </SectionHeader>
        <Card padding="md">
          <ul className="flex flex-col divide-y divide-border">
            {achievements.map((a) => (
              <AchievementRow key={a.id} achievement={a} />
            ))}
          </ul>
        </Card>
      </section>

      {!hasData ? (
        <EmptyState
          icon={LineChart}
          title="Chưa có số đo nào"
          description="Ghi cân nặng đầu tiên để FitVN vẽ biểu đồ xu hướng cho bạn."
          action={
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
            >
              <Plus size={16} aria-hidden /> Ghi số đo
            </button>
          }
        />
      ) : (
        <>
          {/* Weight trend */}
          <section aria-labelledby="weight-heading" className="flex flex-col gap-3">
            <SectionHeader id="weight-heading">Cân nặng</SectionHeader>
            <Card raised padding="lg" className="flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-wide text-muted">
                    Hiện tại
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold leading-none text-text">
                      {fmtKg(latest!.weightKg)}
                    </span>
                    <span className="text-base font-semibold text-muted">kg</span>
                  </div>
                </div>
                {measurements.length >= 2 ? (
                  <Pill
                    tone={lostOrFlat ? "success" : "muted"}
                    icon={
                      lostOrFlat ? (
                        <ArrowDownRight size={14} aria-hidden />
                      ) : (
                        <ArrowUpRight size={14} aria-hidden />
                      )
                    }
                  >
                    {fmtDelta(delta)} kg
                  </Pill>
                ) : null}
              </div>

              {weights.length >= 2 ? (
                <div className="-mx-1">
                  <Sparkline
                    points={weights}
                    height={88}
                    ariaLabel={`Xu hướng cân nặng, từ ${fmtKg(
                      first!.weightKg,
                    )} đến ${fmtKg(latest!.weightKg)} kg`}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Ghi thêm một số đo nữa để xem biểu đồ xu hướng.
                </p>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="text-muted">
                  Bắt đầu{" "}
                  <span className="font-bold text-text">
                    {fmtKg(first!.weightKg)} kg
                  </span>
                </span>
                <span className="text-muted">
                  {measurements.length} lần đo
                </span>
              </div>

              {targetWeight != null && latest && first ? (
                <TargetWeightBar
                  start={first.weightKg}
                  current={latest.weightKg}
                  target={targetWeight}
                />
              ) : null}
            </Card>
          </section>

          {/* Body-composition trends (fat % / waist) — only when there's history */}
          {hasMetricTrend ? (
            <section aria-labelledby="metric-trend-heading" className="flex flex-col gap-3">
              <SectionHeader id="metric-trend-heading">Xu hướng số đo</SectionHeader>
              <MeasurementTrendCard
                title="Tỷ lệ mỡ"
                unit="%"
                icon={HeartPulse}
                points={bodyFatSeries}
              />
              <MeasurementTrendCard
                title="Vòng eo"
                unit="cm"
                icon={Ruler}
                points={waistSeries}
              />
            </section>
          ) : null}

          {/* Latest values — bento */}
          <section aria-labelledby="measure-heading" className="flex flex-col gap-3">
            <SectionHeader id="measure-heading">Số đo mới nhất</SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Cân nặng"
                value={fmtKg(latest!.weightKg)}
                unit="kg"
                icon={<Scale size={18} aria-hidden />}
                className="col-span-2"
              />
              <StatTile
                label="Tỷ lệ mỡ"
                value={fmtOptional(latest!.bodyFatPct)}
                unit={latest!.bodyFatPct == null ? undefined : "%"}
                icon={<HeartPulse size={18} aria-hidden />}
              />
              <StatTile
                label="Vòng eo"
                value={fmtOptional(latest!.waistCm)}
                unit={latest!.waistCm == null ? undefined : "cm"}
                icon={<Ruler size={18} aria-hidden />}
              />
            </div>
          </section>

          {/* History */}
          <section aria-labelledby="history-heading" className="flex flex-col gap-3">
            <SectionHeader id="history-heading">Lịch sử</SectionHeader>
            <Card padding="md">
              <ul className="flex flex-col divide-y divide-border">
                {[...measurements].reverse().map((m) => (
                  <HistoryRow key={m.id} measurement={m} onEdit={setEditing} />
                ))}
              </ul>
            </Card>
          </section>
        </>
      )}

      <Sheet
        open={adding || editing != null}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        title={editing ? "Sửa số đo" : "Ghi số đo"}
      >
        <AddMeasurementForm
          key={editing?.id ?? "new"}
          editing={editing}
          onSubmit={(payload) => {
            if (editing) updateMeasurement(editing.id, payload);
            else addMeasurement(payload);
            setAdding(false);
            setEditing(null);
          }}
        />
      </Sheet>
    </main>
  );
}

function TargetWeightBar({
  start,
  current,
  target,
}: {
  start: number;
  current: number;
  target: number;
}) {
  const total = start - target; // signed total change needed
  const done = start - current; // signed change so far
  const pct =
    total !== 0 ? Math.min(Math.max(done / total, 0), 1) : current === target ? 1 : 0;
  // Reached when current is at/past the target in the goal direction.
  const reached = total === 0 ? current === target : done / total >= 1;
  const remaining = Math.abs(current - target);

  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-3">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">
          Mục tiêu <span className="font-bold text-text">{fmtKg(target)} kg</span>
        </span>
        <span className={`font-semibold ${reached ? "text-success" : "text-text"}`}>
          {reached ? "Đã đạt mục tiêu" : `còn ${fmtKg(remaining)} kg`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-surface-raised">
        <div
          className={`h-full rounded-pill ${reached ? "bg-success" : "bg-primary"}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

function AchievementRow({ achievement }: { achievement: Achievement }) {
  const { icon: Icon, title, description, earned, current, target, unit } =
    achievement;
  const progress = `${Math.round(current * 10) / 10}/${target}${unit ?? ""}`;
  return (
    <li className="flex items-center gap-3 py-3">
      <IconBadge tone={earned ? "primary" : "muted"} size="md">
        <Icon size={18} aria-hidden />
      </IconBadge>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold ${earned ? "text-text" : "text-muted"}`}
        >
          {title}
        </p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      {earned ? (
        <Pill tone="success" icon={<Check size={14} aria-hidden />}>
          Đạt
        </Pill>
      ) : (
        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
          {progress}
        </span>
      )}
    </li>
  );
}

function HistoryRow({
  measurement,
  onEdit,
}: {
  measurement: Measurement;
  onEdit: (measurement: Measurement) => void;
}) {
  const { id, measuredOn, weightKg, bodyFatPct, waistCm } = measurement;
  const extras = [
    bodyFatPct != null ? `Mỡ ${fmtOptional(bodyFatPct)}%` : null,
    waistCm != null ? `Eo ${fmtOptional(waistCm)} cm` : null,
  ].filter(Boolean);

  return (
    <li className="flex items-center justify-between gap-2 py-2.5">
      <button
        type="button"
        onClick={() => onEdit(measurement)}
        aria-label={`Sửa số đo ngày ${shortDateVi(measuredOn)}`}
        className="min-w-0 flex-1 rounded-btn px-1 py-1 text-left transition-colors hover:bg-surface-raised"
      >
        <p className="text-sm font-semibold text-text">
          {fmtKg(weightKg)} kg
        </p>
        <p className="text-xs text-muted">
          {shortDateVi(measuredOn)}
          {extras.length > 0 ? ` · ${extras.join(" · ")}` : ""}
        </p>
      </button>
      <button
        type="button"
        onClick={() => removeMeasurement(id)}
        aria-label={`Xóa số đo ngày ${shortDateVi(measuredOn)}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-danger"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}

/** Numeric field with +/- steppers (mirrors the nutrition qty control). */
function StepperField({
  label,
  unit,
  value,
  onChange,
  step,
  min = 0,
  placeholder,
  required = false,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (next: string) => void;
  step: number;
  min?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const round1 = (n: number) => Math.round(n * 10) / 10;

  function nudge(direction: 1 | -1) {
    const current = Number.parseFloat(value);
    const base = Number.isFinite(current) ? current : 0;
    const next = Math.max(min, round1(base + direction * step));
    onChange(String(next));
  }

  return (
    <div className="flex flex-col gap-2 rounded-card bg-surface-raised p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">
          {label}{" "}
          <span className="font-medium text-muted">
            ({unit}
            {required ? "" : ", tùy chọn"})
          </span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Giảm ${label.toLowerCase()}`}
            onClick={() => nudge(-1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-surface text-text active:scale-95"
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            inputMode="decimal"
            value={value}
            min={min}
            step={step}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} (${unit})`}
            className="w-20 rounded-btn border border-border bg-surface px-2 py-2 text-center text-base font-semibold text-text outline-none placeholder:font-normal placeholder:text-muted focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label={`Tăng ${label.toLowerCase()}`}
            onClick={() => nudge(1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-surface text-text active:scale-95"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMeasurementForm({
  editing,
  onSubmit,
}: {
  editing?: Measurement | null;
  onSubmit: (payload: Omit<Measurement, "id" | "createdAt">) => void;
}) {
  const today = todayIso();
  const dateIso = editing?.measuredOn ?? today;
  const [weight, setWeight] = useState(editing ? String(editing.weightKg) : "");
  const [bodyFat, setBodyFat] = useState(
    editing?.bodyFatPct != null ? String(editing.bodyFatPct) : "",
  );
  const [waist, setWaist] = useState(
    editing?.waistCm != null ? String(editing.waistCm) : "",
  );

  const weightNum = Number.parseFloat(weight);
  const isWeightValid = Number.isFinite(weightNum) && weightNum > 0;

  const parseOptional = (raw: string): number | null => {
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : null;
  };

  function submit() {
    if (!isWeightValid) return;
    onSubmit({
      measuredOn: dateIso,
      weightKg: Math.round(weightNum * 10) / 10,
      bodyFatPct: parseOptional(bodyFat),
      waistCm: parseOptional(waist),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-card bg-surface-raised px-3 py-2.5">
        <span className="text-sm font-medium text-muted">Ngày đo</span>
        <span className="text-sm font-semibold text-text">
          {editing ? shortDateVi(dateIso) : `Hôm nay · ${shortDateVi(today)}`}
        </span>
      </div>

      <StepperField
        label="Cân nặng"
        unit="kg"
        value={weight}
        onChange={setWeight}
        step={0.1}
        min={0}
        placeholder="0,0"
        required
      />
      <StepperField
        label="Tỷ lệ mỡ"
        unit="%"
        value={bodyFat}
        onChange={setBodyFat}
        step={0.5}
        min={0}
        placeholder="—"
      />
      <StepperField
        label="Vòng eo"
        unit="cm"
        value={waist}
        onChange={setWaist}
        step={0.5}
        min={0}
        placeholder="—"
      />

      <button
        type="button"
        onClick={submit}
        disabled={!isWeightValid}
        className="inline-flex h-12 items-center justify-center rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {editing ? "Lưu thay đổi" : "Lưu"}
      </button>
    </div>
  );
}
