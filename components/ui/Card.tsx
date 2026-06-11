import type { ElementType, ReactNode } from "react";

/**
 * Card — the base surface primitive for FitVN.
 *
 * Token-driven surface (rounded-card + shadow-card + border) used to group
 * related content. Polymorphic via `as` so it can render as a section, article,
 * or any element without losing styling. Padding is configurable to keep the
 * spacing rhythm intentional rather than uniform.
 */

type Padding = "none" | "sm" | "md" | "lg";

const PADDING: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

interface CardProps {
  /** Element/component to render as. Defaults to a div. */
  as?: ElementType;
  /** Inner padding scale. Defaults to "md". */
  padding?: Padding;
  /** Use the raised elevation + soft gradient for hero-adjacent surfaces. */
  raised?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({
  as: Tag = "div",
  padding = "md",
  raised = false,
  className = "",
  children,
  ...rest
}: CardProps & Record<string, unknown>) {
  const elevation = raised
    ? "bg-surface-gradient shadow-raised"
    : "bg-surface shadow-card";

  return (
    <Tag
      className={`rounded-card border border-border ${elevation} ${PADDING[padding]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
