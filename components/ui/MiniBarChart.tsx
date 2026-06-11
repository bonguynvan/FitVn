/**
 * MiniBarChart — pure-SVG weekly bar chart.
 *
 * Renders one bar per data point with muted labels beneath, scaled to the
 * series max (or an explicit goal line, whichever is larger). The optional
 * goal line is drawn as a dashed accent rule so the user can read "above/below
 * target" at a glance. No chart library.
 */

interface BarDatum {
  /** Short label under the bar, e.g. "T2". */
  label: string;
  /** Bar value. */
  value: number;
}

interface MiniBarChartProps {
  data: ReadonlyArray<BarDatum>;
  /** Optional goal line drawn across the chart. */
  goal?: number;
  /** Chart height in px (bars area, excludes labels). Defaults to 96. */
  height?: number;
  /** Accessible summary of the chart. */
  ariaLabel?: string;
  className?: string;
}

const VIEW_WIDTH = 280;

export function MiniBarChart({
  data,
  goal,
  height = 96,
  ariaLabel,
  className = "",
}: MiniBarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), goal ?? 0, 1);
  const slot = VIEW_WIDTH / data.length;
  const barWidth = slot * 0.5;
  const goalY = goal ? height - (goal / maxValue) * height : null;

  return (
    <figure
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Biểu đồ cột theo tuần"}
    >
      <svg
        width="100%"
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        preserveAspectRatio="none"
        className="block"
        aria-hidden
      >
        {data.map((d, i) => {
          const barHeight = Math.max((d.value / maxValue) * height, 2);
          const x = i * slot + (slot - barWidth) / 2;
          const y = height - barHeight;
          const reachedGoal = goal != null && d.value >= goal;
          return (
            <rect
              key={d.label}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={
                reachedGoal ? "var(--color-accent)" : "var(--color-primary)"
              }
            />
          );
        })}

        {goalY != null && (
          <line
            x1={0}
            y1={goalY}
            x2={VIEW_WIDTH}
            y2={goalY}
            stroke="var(--color-accent-fg)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.7}
          />
        )}
      </svg>

      <div className="mt-1.5 flex">
        {data.map((d) => (
          <span
            key={d.label}
            className="flex-1 text-center text-[10px] font-medium tracking-wide text-muted"
          >
            {d.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
