import { Droplet } from "lucide-react";

import { Card, Pill } from "@/components/ui";

/**
 * WaterTracker — 8-cup hydration row.
 *
 * Renders a fixed row of Droplet glyphs, filled (primary tint) up to `filled`
 * and empty (muted) for the rest, with a "x/y ly" count. Presentational only —
 * the cups are non-interactive in this UI pass. Built on the shared Card.
 */

interface WaterTrackerProps {
  /** Number of cups consumed. */
  filled: number;
  /** Daily target in cups. Defaults to 8. */
  goal?: number;
}

export function WaterTracker({ filled, goal = 8 }: WaterTrackerProps) {
  const safeFilled = Math.min(Math.max(filled, 0), goal);
  const cups = Array.from({ length: goal }, (_, index) => index < safeFilled);
  const reachedGoal = safeFilled >= goal;

  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">Uống nước</p>
          <p className="text-xs text-muted">Mục tiêu {goal} ly mỗi ngày</p>
        </div>
        <Pill tone={reachedGoal ? "success" : "accent"}>
          {safeFilled}/{goal} ly
        </Pill>
      </div>

      <div className="flex items-center justify-between gap-1">
        {cups.map((isFilled, index) => (
          <span
            key={index}
            aria-hidden
            className={`inline-flex h-10 flex-1 items-center justify-center rounded-xl transition-colors ${
              isFilled ? "bg-primary/12 text-primary" : "bg-surface-raised text-muted"
            }`}
          >
            <Droplet
              size={18}
              fill={isFilled ? "currentColor" : "none"}
              strokeWidth={2}
            />
          </span>
        ))}
      </div>
    </Card>
  );
}
