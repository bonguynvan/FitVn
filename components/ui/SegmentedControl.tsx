"use client";

/**
 * SegmentedControl — a row/grid of mutually-exclusive options (meal type,
 * portion mode, etc.). One look for every segmented picker in the app.
 */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Columns; defaults to one per option. */
  columns?: number;
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns,
  ariaLabel,
  className = "",
}: SegmentedControlProps<T>) {
  const cols = columns ?? options.length;
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`grid gap-1.5 ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-btn py-2 text-xs font-semibold transition-colors ${
              active ? "bg-primary text-primary-fg" : "bg-surface-raised text-muted"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
