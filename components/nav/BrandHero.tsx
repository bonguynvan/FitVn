import type { ReactNode } from "react";

/**
 * BrandHero — the shared gradient header band for landing-style screens
 * (home greeting, coach). One treatment so every branded header is identical:
 * emerald `bg-hero` gradient, soft highlight, eyebrow + title + subtitle, with
 * an optional leading icon and trailing action. Interior tool screens use
 * PageHeader instead; both share the same eyebrow language.
 */

interface BrandHeroProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  /** Leading element (e.g. an IconBadge). */
  icon?: ReactNode;
  /** Trailing element (e.g. a profile link). */
  action?: ReactNode;
  className?: string;
}

export function BrandHero({
  title,
  eyebrow,
  subtitle,
  icon,
  action,
  className = "",
}: BrandHeroProps) {
  return (
    <header
      className={`relative overflow-hidden rounded-card bg-hero px-5 pb-6 pt-7 text-primary-fg shadow-glow ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/20 blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-black/10 blur-2xl"
      />
      <div className="relative flex items-start gap-3">
        {icon ? <div className="shrink-0">{icon}</div> : null}
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="text-eyebrow opacity-90">{eyebrow}</p> : null}
          <h1 className="mt-1 text-[1.7rem] font-extrabold leading-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-[34ch] text-sm leading-relaxed opacity-95">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
