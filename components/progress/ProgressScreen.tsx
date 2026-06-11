"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  HeartPulse,
  LineChart,
  Minus,
  Plus,
  Ruler,
  Scale,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/nav/PageHeader";
import { Card, IconBadge, Pill, SectionHeader, Sparkline, StatTile, Sheet } from "@/components/ui";
import { shortDateVi, todayIso } from "@/lib/date";
import {
  addMeasurement,
  removeMeasurement,
  useMeasurements,
} from "@/lib/store/progress-store";
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
  const [adding, setAdding] = useState(false);

  const hasData = measurements.length > 0;
  const latest = hasData ? measurements[measurements.length - 1] : null;
  const first = hasData ? measurements[0] : null;

  // Weights in chronological order drive the trend chart.
  const weights = useMemo(
    () => measurements.map((m) => m.weightKg),
    [measurements],
  );

  // Delta vs the first ever entry; negative = weight lost (the desired direction).
  const delta = latest && first ? latest.weightKg - first.weightKg : 0;
  const lostOrFlat = delta <= 0;

  return (
    <main className="flex flex-1 flex-col gap-6 pt-safe">
      <div className="pt-6">
        <PageHeader
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-btn bg-primary text-primary-fg shadow-glow transition-transform active:scale-95"
            >
              <Plus size={22} />
            </button>
          }
        />
      </div>

      {!hasData ? (
        <Card
          padding="lg"
          className="flex flex-col items-center gap-3 border-dashed text-center"
        >
          <IconBadge tone="primary" size="lg">
            <LineChart size={26} aria-hidden />
          </IconBadge>
          <div>
            <p className="text-base font-bold text-text">Chưa có số đo nào</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Ghi cân nặng đầu tiên để FitVN vẽ biểu đồ xu hướng cho bạn.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-95"
          >
            <Plus size={16} aria-hidden /> Ghi số đo
          </button>
        </Card>
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
            </Card>
          </section>

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
                  <HistoryRow key={m.id} measurement={m} />
                ))}
              </ul>
            </Card>
          </section>
        </>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Ghi số đo">
        <AddMeasurementForm
          onAdd={(payload) => {
            addMeasurement(payload);
            setAdding(false);
          }}
        />
      </Sheet>
    </main>
  );
}

function HistoryRow({ measurement }: { measurement: Measurement }) {
  const { id, measuredOn, weightKg, bodyFatPct, waistCm } = measurement;
  const extras = [
    bodyFatPct != null ? `Mỡ ${fmtOptional(bodyFatPct)}%` : null,
    waistCm != null ? `Eo ${fmtOptional(waistCm)} cm` : null,
  ].filter(Boolean);

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text">
          {fmtKg(weightKg)} kg
        </p>
        <p className="text-xs text-muted">
          {shortDateVi(measuredOn)}
          {extras.length > 0 ? ` · ${extras.join(" · ")}` : ""}
        </p>
      </div>
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
  onAdd,
}: {
  onAdd: (payload: Omit<Measurement, "id" | "createdAt">) => void;
}) {
  const today = todayIso();
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [waist, setWaist] = useState("");

  const weightNum = Number.parseFloat(weight);
  const isWeightValid = Number.isFinite(weightNum) && weightNum > 0;

  const parseOptional = (raw: string): number | null => {
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : null;
  };

  function submit() {
    if (!isWeightValid) return;
    onAdd({
      measuredOn: today,
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
          Hôm nay · {shortDateVi(today)}
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
        Lưu
      </button>
    </div>
  );
}
