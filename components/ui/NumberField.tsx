"use client";

import { useEffect, useState } from "react";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Advisory only — surfaced to the browser, NOT enforced while typing. */
  min?: number;
  max?: number;
  inputMode?: "numeric" | "decimal";
  className?: string;
}

const INPUT_CLASS =
  "w-full rounded-btn border border-border bg-surface px-3 py-3 text-center text-base font-semibold text-text outline-none focus:border-primary";

/**
 * Numeric input that lets the user type freely.
 *
 * It deliberately does NOT clamp or validate mid-keystroke — partial entries
 * like "1" on the way to "15" are left untouched. While focused it keeps a
 * local draft so the cursor is never yanked around, and it propagates the raw
 * (unclamped) number upward so live previews stay in sync.
 *
 * On blur, if `min`/`max` are given the value snaps into range — a gentle
 * reconcile once the user is done with the field. The caller still validates
 * on confirm (see `clampProfileMetrics`) as the source of truth.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  inputMode = "numeric",
  className,
}: NumberFieldProps) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);

  // Mirror external value changes (e.g. clamping applied on save) while the
  // user isn't actively editing the field.
  useEffect(() => {
    if (!focused) setDraft(Number.isFinite(value) ? String(value) : "");
  }, [value, focused]);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input
        type="number"
        inputMode={inputMode}
        min={min}
        max={max}
        value={draft}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const n = Number(raw);
          // Propagate unclamped; the caller validates on confirm.
          if (raw !== "" && Number.isFinite(n)) onChange(n);
        }}
        onBlur={() => {
          // Snap into range now that the user has left the field. Empty or
          // non-numeric drafts are left to revert to the last committed value.
          const n = Number(draft);
          if (draft !== "" && Number.isFinite(n)) {
            const lo = min ?? n;
            const hi = max ?? n;
            const snapped = Math.min(hi, Math.max(lo, n));
            if (snapped !== value) onChange(snapped);
            setDraft(String(snapped));
          }
          setFocused(false);
        }}
        className={className ?? INPUT_CLASS}
      />
    </label>
  );
}
