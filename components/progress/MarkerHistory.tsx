"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";

import { Pill, Sparkline } from "@/components/ui";
import { shortDateVi } from "@/lib/date";
import { MARKERS, type MarkerKey } from "@/lib/health/markers";
import { removeReading, type HealthReading } from "@/lib/store/health-store";
import type { SexType } from "@/types/database.types";

const fmtNum = (n: number) => (Math.round(n * 10) / 10).toLocaleString("vi-VN");

/** Full timeline for one marker: range, trend, and every reading (deletable). */
export function MarkerHistory({
  marker,
  readings,
  sex,
}: {
  marker: MarkerKey;
  readings: ReadonlyArray<HealthReading>;
  sex: SexType;
}) {
  const def = MARKERS[marker];

  const rows = useMemo(
    () =>
      readings
        .filter((r) => r.marker === marker)
        .sort((a, b) => b.measuredOn.localeCompare(a.measuredOn)),
    [readings, marker],
  );

  // Oldest → newest for the trend line.
  const series = useMemo(() => [...rows].reverse().map((r) => r.value), [rows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card bg-surface-raised px-4 py-3 text-xs text-muted">
        Ngưỡng bình thường:{" "}
        <span className="font-semibold text-text">{def.rangeText}</span>
      </div>

      {series.length >= 2 ? (
        <div className="-mx-1">
          <Sparkline points={series} height={64} ariaLabel={`Xu hướng ${def.name}`} />
        </div>
      ) : null}

      <ul className="flex flex-col divide-y divide-border">
        {rows.map((r) => {
          const ev = def.evaluate(r.value, r.value2, sex);
          const valueText = def.hasSecond
            ? `${fmtNum(r.value)}/${r.value2 != null ? fmtNum(r.value2) : "—"}`
            : fmtNum(r.value);
          return (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">
                  {valueText}{" "}
                  <span className="text-xs font-normal text-muted">{def.unit}</span>
                </p>
                <p className="text-xs text-muted">{shortDateVi(r.measuredOn)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={ev.tone}>{ev.label}</Pill>
                <button
                  type="button"
                  onClick={() => removeReading(r.id)}
                  aria-label={`Xóa số đo ${shortDateVi(r.measuredOn)}`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-btn text-muted transition hover:bg-surface-raised hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          );
        })}
        {rows.length === 0 ? (
          <li className="py-3 text-center text-sm text-muted">Chưa có số đo.</li>
        ) : null}
      </ul>
    </div>
  );
}
