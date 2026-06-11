import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { IconBadge } from "./IconBadge";

/**
 * EmptyState — friendly "no data yet" block used while real data hasn't been
 * logged (or synced from Supabase). Centered icon + title + hint + optional CTA.
 */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional call-to-action (button/link). */
  action?: ReactNode;
  tone?: "primary" | "accent" | "muted";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "primary",
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center ${className}`}
    >
      <IconBadge tone={tone} size="lg">
        <Icon size={26} aria-hidden />
      </IconBadge>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-text">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-[34ch] text-sm leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
