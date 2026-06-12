"use client";

import { Minus, Plus } from "lucide-react";

/**
 * Stepper — a compact numeric +/- control used across the app's forms
 * (quantities, sleep hours, water goal, body measurements). One source of truth
 * for the look + clamping behavior so every stepper matches.
 */

const round1 = (n: number) => Math.round(n * 10) / 10;

interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Accessible noun, used in the +/- button labels (e.g. "số lượng"). */
  ariaLabel: string;
  /** Render the value (e.g. add a unit). Defaults to a vi-VN number. */
  format?: (n: number) => string;
  /** Width class for the value readout. */
  valueClassName?: string;
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  ariaLabel,
  format,
  valueClassName = "w-12",
}: StepperProps) {
  const clamp = (n: number) => {
    const r = round1(n);
    if (r < min) return min;
    if (max != null && r > max) return max;
    return r;
  };
  const label = ariaLabel.toLowerCase();
  const display = format ? format(value) : value.toLocaleString("vi-VN");

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Giảm ${label}`}
        onClick={() => onChange(clamp(value - step))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-surface text-text active:scale-95"
      >
        <Minus size={16} />
      </button>
      <span className={`text-center text-base font-semibold tabular-nums text-text ${valueClassName}`}>
        {display}
      </span>
      <button
        type="button"
        aria-label={`Tăng ${label}`}
        onClick={() => onChange(clamp(value + step))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-btn border border-border bg-surface text-text active:scale-95"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
