import type { ReactNode } from "react";

import { Card } from "./Card";

/**
 * StatTile — compact metric tile.
 *
 * Big bold value contrasted against a small muted label, with an optional unit,
 * leading lucide icon, and a colored delta (e.g. "+2.1kg"). Built on Card so it
 * inherits the surface/elevation tokens. Used in bento rows on the home and
 * progress screens.
 */

type DeltaTone = "success" | "danger" | "muted";

const DELTA_TONES: Record<DeltaTone, string> = {
  success: "text-success",
  danger: "text-danger",
  muted: "text-muted",
};

interface StatTileProps {
  /** Small descriptive label, e.g. "Chuỗi ngày". */
  label: string;
  /** Headline value, e.g. 70.5 or "12". */
  value: ReactNode;
  /** Optional unit suffix, e.g. "kg" or "ngày". */
  unit?: string;
  /** Optional leading lucide icon. */
  icon?: ReactNode;
  /** Optional trend text, e.g. "+0.5kg" or "2 buổi". */
  delta?: string;
  /** Tone for the delta text. Defaults to "muted". */
  deltaTone?: DeltaTone;
  className?: string;
}

export function StatTile({
  label,
  value,
  unit,
  icon,
  delta,
  deltaTone = "muted",
  className = "",
}: StatTileProps) {
  return (
    <Card padding="md" className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted">
          {label}
        </span>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold leading-none text-text">
          {value}
        </span>
        {unit ? (
          <span className="text-sm font-semibold text-muted">{unit}</span>
        ) : null}
      </div>
      {delta ? (
        <span className={`text-xs font-semibold ${DELTA_TONES[deltaTone]}`}>
          {delta}
        </span>
      ) : null}
    </Card>
  );
}
