import type { ReactNode } from "react";

/**
 * IconBadge — rounded container for a single lucide icon.
 *
 * Gives icons a tinted, tonal surface so they read as deliberate UI markers
 * (section glyphs, quick-link tiles) rather than floating strokes. Pass a
 * lucide icon as children; size controls both the box and is exposed via the
 * `iconSize` helper for the caller.
 */

type Tone = "primary" | "accent" | "muted" | "success" | "warning" | "danger";
type Size = "sm" | "md" | "lg";
type Shape = "square" | "pill";

const TONES: Record<Tone, string> = {
  primary: "bg-primary/12 text-primary",
  accent: "bg-accent/20 text-accent-fg",
  muted: "bg-surface-raised text-text",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-text",
  danger: "bg-danger/12 text-danger",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
};

/** Recommended lucide `size` (px) to pair with each badge size. */
export const ICON_BADGE_GLYPH_SIZE: Record<Size, number> = {
  sm: 18,
  md: 22,
  lg: 26,
};

interface IconBadgeProps {
  tone?: Tone;
  size?: Size;
  shape?: Shape;
  className?: string;
  /** A lucide-react icon element. */
  children: ReactNode;
}

export function IconBadge({
  tone = "primary",
  size = "md",
  shape = "square",
  className = "",
  children,
}: IconBadgeProps) {
  const radius = shape === "pill" ? "rounded-pill" : "rounded-2xl";

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center ${radius} ${SIZES[size]} ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
