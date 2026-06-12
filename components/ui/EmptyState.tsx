import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { IconBadge } from "./IconBadge";

/**
 * EmptyState — friendly "no data yet" block used while real data hasn't been
 * logged (or synced from Supabase). Centered icon + title + hint + optional CTA.
 */
interface EmptyStateProps {
  icon: LucideIcon;
  /** Optional heading. When omitted (compact section empties), the description
   *  becomes the main line. */
  title?: string;
  description?: string;
  /** Optional call-to-action (button/link). */
  action?: ReactNode;
  tone?: "primary" | "accent" | "muted";
  /** "lg" for full-screen empties (default); "sm" for compact section empties. */
  size?: "sm" | "lg";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "primary",
  size = "lg",
  className = "",
}: EmptyStateProps) {
  const sm = size === "sm";
  return (
    <div
      className={`flex flex-col items-center rounded-card border border-dashed border-border bg-surface text-center ${
        sm ? "gap-2 px-4 py-6" : "gap-3 px-6 py-10"
      } ${className}`}
    >
      <IconBadge tone={tone} size={sm ? "md" : "lg"}>
        <Icon size={sm ? 20 : 26} aria-hidden />
      </IconBadge>
      <div className="flex flex-col gap-1">
        {title ? (
          <h3 className={`font-semibold text-text ${sm ? "text-sm" : "text-base"}`}>
            {title}
          </h3>
        ) : null}
        {description ? (
          <p
            className={`mx-auto max-w-[34ch] leading-relaxed text-muted ${
              sm ? "text-sm" : "text-sm"
            }`}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
