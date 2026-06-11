import type { ReactNode } from "react";

/**
 * ProgressRing — pure-SVG circular progress indicator.
 *
 * Draws a muted track with a primary arc representing value/max. Center content
 * (label/children) is layered via absolute positioning. Accessible: the wrapper
 * is role="img" with an aria-label so the value is announced. No dependencies.
 */

interface ProgressRingProps {
  /** Current value. */
  value: number;
  /** Maximum value (full ring). Defaults to 100. */
  max?: number;
  /** Outer diameter in px. Defaults to 120. */
  size?: number;
  /** Stroke width in px. Defaults to 12. */
  stroke?: number;
  /** Accessible description, e.g. "1.450 trên 2.200 kcal". */
  label: string;
  /** Center content rendered over the ring. */
  children?: ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  stroke = 12,
  label,
  children,
  className = "",
}: ProgressRingProps) {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(Math.max(value / safeMax, 0), 1);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);
  const center = size / 2;

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
