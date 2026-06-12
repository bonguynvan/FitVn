import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

/**
 * PageHeader — reusable page title block (Server Component).
 *
 * Establishes a strong type hierarchy: a tiny uppercase eyebrow, a large bold
 * title, and an optional muted subtitle. Supports an optional back link and a
 * right-side action node (e.g. a button or pill). For the branded gradient hero
 * treatment, compose your own band on the page; this is the standard header for
 * interior screens.
 */

interface PageHeaderProps {
  title: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  /** Supporting line under the title. */
  subtitle?: string;
  /** Right-aligned action element (button, link, pill, etc.). */
  action?: ReactNode;
  /** When set, renders a back chevron link to this href. */
  backHref?: string;
  /** Accessible label for the back link. Defaults to "Quay lại". */
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  action,
  backHref,
  backLabel = "Quay lại",
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`flex flex-col gap-2 ${className}`}>
      {backHref ? (
        <Link
          href={backHref}
          aria-label={backLabel}
          className="-ml-1 inline-flex w-fit items-center gap-1 rounded-pill py-1 pl-1 pr-2.5 text-sm font-semibold text-muted transition-colors hover:text-text active:scale-95"
        >
          <ChevronLeft size={18} strokeWidth={2.4} />
          {backLabel}
        </Link>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-eyebrow text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1 text-[1.7rem] font-extrabold leading-tight text-text">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-[42ch] text-sm leading-relaxed text-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
