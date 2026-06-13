"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { IconBadge } from "./IconBadge";

/**
 * CollapsibleSection — a disclosure with a section-header-styled toggle and a
 * smoothly animated body (grid-rows trick, CSS-only). Used to group long
 * settings screens without losing the app's quiet section-label hierarchy.
 */
interface CollapsibleSectionProps {
  title: string;
  /** Optional leading lucide icon. */
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center justify-between gap-3 rounded-btn px-1 py-1.5 text-left transition-colors hover:bg-surface-raised/60"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <IconBadge tone="muted" size="sm">
              {icon}
            </IconBadge>
          ) : null}
          <span className="truncate text-sm font-semibold tracking-tight text-text">
            {title}
          </span>
        </span>
        <ChevronDown
          size={18}
          aria-hidden
          className={`shrink-0 text-muted transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </section>
  );
}
