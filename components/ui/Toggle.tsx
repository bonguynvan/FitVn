"use client";

/**
 * Toggle — the app's standard pill switch. One source of truth for the on/off
 * control used in profile conditions, reminders, and form options.
 */

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

export function Toggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-block h-6 w-10 shrink-0 rounded-pill transition-colors ${
        checked ? "bg-primary" : "bg-surface-raised"
      }`}
    >
      <span
        aria-hidden
        className="absolute top-0.5 h-5 w-5 rounded-pill bg-surface shadow-card transition-all"
        style={{ left: checked ? "1.125rem" : "0.125rem" }}
      />
    </button>
  );
}
