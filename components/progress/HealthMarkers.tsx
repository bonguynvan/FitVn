"use client";

import { useMemo, useState } from "react";
import { Activity, HeartPulse, Plus, Trash2 } from "lucide-react";

import { Card, EmptyState, Pill, SectionHeader, Sheet, Sparkline } from "@/components/ui";
import { todayIso, shortDateVi } from "@/lib/date";
import { MARKERS, MARKER_ORDER, type MarkerKey } from "@/lib/health/markers";
import {
  addReading,
  latestByMarker,
  removeReading,
  useHealthReadings,
  type HealthReading,
} from "@/lib/store/health-store";
import { useProfile } from "@/lib/store/profile-store";

const fmtNum = (n: number) => (Math.round(n * 10) / 10).toLocaleString("vi-VN");

/** "Chỉ số sức khỏe" — log blood/biomarker readings with reference-range checks. */
export function HealthMarkers() {
  const readings = useHealthReadings();
  const profile = useProfile();
  const sex = profile?.sex ?? "male";
  const [adding, setAdding] = useState(false);

  const latest = useMemo(() => latestByMarker(readings), [readings]);
  const seriesByMarker = useMemo(() => {
    const map = new Map<MarkerKey, number[]>();
    // oldest → newest for sparklines
    for (const r of [...readings].reverse()) {
      const arr = map.get(r.marker) ?? [];
      arr.push(r.value);
      map.set(r.marker, arr);
    }
    return map;
  }, [readings]);

  const shown = MARKER_ORDER.filter((k) => latest[k]);

  return (
    <section aria-labelledby="health-markers-heading" className="flex flex-col gap-3">
      <SectionHeader
        id="health-markers-heading"
        action={
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary active:scale-95"
          >
            <Plus size={16} aria-hidden /> Ghi chỉ số
          </button>
        }
      >
        Chỉ số sức khỏe
      </SectionHeader>

      {shown.length === 0 ? (
        <EmptyState
          size="sm"
          icon={HeartPulse}
          description="Ghi acid uric, huyết áp, đường huyết, mỡ máu… để theo dõi và nhận tư vấn."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((key) => {
            const def = MARKERS[key];
            const r = latest[key]!;
            const ev = def.evaluate(r.value, r.value2, sex);
            const series = seriesByMarker.get(key) ?? [];
            const valueText = def.hasSecond
              ? `${fmtNum(r.value)}/${r.value2 != null ? fmtNum(r.value2) : "—"}`
              : fmtNum(r.value);
            return (
              <Card key={key} padding="md" className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">{def.name}</p>
                    <p className="text-xs text-muted">
                      {shortDateVi(r.measuredOn)} · {def.rangeText}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-lg font-bold tabular-nums text-text">{valueText}</span>{" "}
                      <span className="text-xs text-muted">{def.unit}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReading(r.id)}
                      aria-label={`Xóa ${def.name}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Pill tone={ev.tone}>{ev.label}</Pill>
                  {series.length >= 2 ? (
                    <div className="w-24">
                      <Sparkline points={series} height={28} ariaLabel={`Xu hướng ${def.name}`} />
                    </div>
                  ) : null}
                </div>

                {ev.status !== "normal" ? (
                  <p className="text-xs leading-snug text-muted">{ev.advice}</p>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <p className="px-1 text-[11px] leading-snug text-muted">
        Chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ.
      </p>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Ghi chỉ số sức khỏe">
        <AddReadingForm
          onSave={(r) => {
            addReading(r);
            setAdding(false);
          }}
        />
      </Sheet>
    </section>
  );
}

function AddReadingForm({
  onSave,
}: {
  onSave: (r: Omit<HealthReading, "id" | "createdAt">) => void;
}) {
  const [marker, setMarker] = useState<MarkerKey>("uric_acid");
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");
  const [date, setDate] = useState(todayIso());

  const def = MARKERS[marker];
  const num = (s: string) => {
    const n = Number.parseFloat(s.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const v = num(value);
  const v2 = num(value2);
  const valid = v != null && v > 0 && (!def.hasSecond || (v2 != null && v2 > 0));

  const inputClass =
    "w-full rounded-btn border border-border bg-surface px-3 py-2.5 text-base font-semibold text-text outline-none placeholder:font-normal placeholder:text-muted focus:border-primary";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {MARKER_ORDER.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setMarker(k)}
            className={`rounded-btn border px-3 py-2 text-left text-xs font-semibold transition-colors ${
              marker === k
                ? "border-primary bg-primary/10 text-text"
                : "border-border bg-surface text-muted hover:border-primary/40"
            }`}
          >
            {MARKERS[k].name}
          </button>
        ))}
      </div>

      <div className="rounded-card bg-surface-raised p-3 text-xs text-muted">
        Ngưỡng bình thường: <span className="font-semibold text-text">{def.rangeText}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {def.hasSecond ? "Tâm thu (systolic)" : `Giá trị (${def.unit})`}
          <input
            type="number"
            inputMode="decimal"
            step={def.step}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </label>
        {def.hasSecond ? (
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Tâm trương (diastolic)
            <input
              type="number"
              inputMode="decimal"
              step={def.step}
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Ngày đo
            <input
              type="date"
              value={date}
              max={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
      </div>

      {def.hasSecond ? (
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Ngày đo
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
      ) : null}

      <button
        type="button"
        disabled={!valid}
        onClick={() =>
          valid &&
          onSave({ marker, value: v!, value2: def.hasSecond ? v2 : null, measuredOn: date })
        }
        className="inline-flex h-12 items-center justify-center gap-2 rounded-btn bg-primary text-sm font-semibold text-primary-fg shadow-glow transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        <Activity size={16} /> Lưu chỉ số
      </button>
    </div>
  );
}
