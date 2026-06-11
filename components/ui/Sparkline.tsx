/**
 * Sparkline — pure-SVG line/area trend.
 *
 * Compact trend visual for series like weight or weekly volume. Draws a smooth
 * primary stroke with an optional translucent fill area beneath. Auto-scales to
 * the min/max of the provided points. No chart library.
 */

interface SparklineProps {
  /** Series values in chronological order. */
  points: ReadonlyArray<number>;
  /** Render width in px (viewBox). Defaults to 240. */
  width?: number;
  /** Render height in px (viewBox). Defaults to 64. */
  height?: number;
  /** Stroke width in px. Defaults to 2.5. */
  stroke?: number;
  /** Fill the area under the line with a translucent tint. Defaults to true. */
  area?: boolean;
  /** Accessible description of the trend. */
  ariaLabel?: string;
  className?: string;
}

export function Sparkline({
  points,
  width = 240,
  height = 64,
  stroke = 2.5,
  area = true,
  ariaLabel,
  className = "",
}: SparklineProps) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pad = stroke; // keep the stroke inside the viewBox
  const stepX = width / (points.length - 1);

  const coords = points.map((value, i) => {
    const x = i * stepX;
    const y = pad + (1 - (value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel ?? "Biểu đồ xu hướng"}
      className={`block ${className}`}
    >
      {area && (
        <path d={areaPath} fill="var(--color-primary)" opacity={0.12} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
