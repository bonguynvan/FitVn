import type { ReactNode } from "react";

/**
 * Pill — small status/tag chip with semantic tone variants.
 *
 * Tones map to design tokens so a status reads at a glance (e.g. success for
 * "Đạt mục tiêu", warning for "Gần đủ"). Tinted background + matching text,
 * never a hardcoded color.
 */

type Tone = "primary" | "accent" | "muted" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  primary: "bg-primary/12 text-primary",
  accent: "bg-accent/20 text-accent-fg",
  muted: "bg-surface-raised text-muted",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-text",
  danger: "bg-danger/12 text-danger",
};

interface PillProps {
  tone?: Tone;
  /** Optional leading element, typically a small lucide icon. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Pill({
  tone = "muted",
  icon,
  className = "",
  children,
}: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
