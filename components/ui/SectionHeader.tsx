import type { ReactNode } from "react";

/**
 * SectionHeader — small, soft, sentence-case muted label that opens a content
 * section, with an optional trailing action (link or icon button).
 *
 * Establishes the type hierarchy contrast used across FitVN: quiet section
 * labels above larger content. Keep the label short, in Vietnamese, and in
 * sentence case (no all-caps).
 */

interface SectionHeaderProps {
  /** Section label (sentence case). */
  children: ReactNode;
  /** Optional trailing element (e.g. a "Xem tất cả" link or icon button). */
  action?: ReactNode;
  /** Optional id so the section can be aria-labelledby this header. */
  id?: string;
  className?: string;
}

export function SectionHeader({
  children,
  action,
  id,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-3 px-1 ${className}`}>
      <h2
        id={id}
        className="text-sm font-semibold tracking-tight text-text"
      >
        {children}
      </h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
