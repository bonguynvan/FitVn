import type { LucideIcon } from "lucide-react";
import { Check, Lock } from "lucide-react";

import { Card, IconBadge, Pill } from "@/components/ui";

/**
 * AchievementRow — a single badge row on the Progress screen.
 *
 * Renders an icon badge, a Vietnamese title + description, and an earned/locked
 * state. Earned rows use a solid tonal badge + a success "Đạt được" pill; locked
 * rows mute the whole row and show a lock affordance so progress reads clearly.
 * Server-safe: presentational, no client state.
 */

export type AchievementTone = "primary" | "accent" | "success" | "warning";

export interface Achievement {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  /** Tonal color used for the badge when earned. */
  readonly tone: AchievementTone;
  /** Whether the user has unlocked this badge. */
  readonly earned: boolean;
  /** Optional earned date / progress label, e.g. "10/06" or "5/7 ngày". */
  readonly meta?: string;
}

interface AchievementRowProps {
  achievement: Achievement;
}

export function AchievementRow({ achievement }: AchievementRowProps) {
  const { icon: Icon, title, description, tone, earned, meta } = achievement;

  return (
    <Card
      padding="md"
      className={`flex items-center gap-3.5 transition-colors ${
        earned ? "border-border" : "border-dashed opacity-70"
      }`}
    >
      <IconBadge tone={earned ? tone : "muted"} size="md">
        <Icon size={22} aria-hidden />
      </IconBadge>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text">{title}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted">{description}</p>
      </div>

      <div className="shrink-0">
        {earned ? (
          <Pill tone="success" icon={<Check size={12} aria-hidden />}>
            {meta ?? "Đạt được"}
          </Pill>
        ) : (
          <Pill tone="muted" icon={<Lock size={12} aria-hidden />}>
            {meta ?? "Chưa mở"}
          </Pill>
        )}
      </div>
    </Card>
  );
}
