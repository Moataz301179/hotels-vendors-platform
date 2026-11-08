/**
 * Sparkline — a compact trend inside a KPI card.
 * Benchmark: SmoothUI metric card (sparkline 32px tall); Precoro chart-level AI.
 * Pure SVG: no chart library, no network.
 */
export function Sparkline({
  values,
  label,
}: {
  values: number[];
  label: string;
}) {
  const safe = values.length > 0 ? values : [0];
  const max = Math.max(...safe, 1);
  const width = 100;
  const height = 32;
  const pad = 3;
  const step = safe.length > 1 ? width / (safe.length - 1) : width;
  const points = safe.map(
    (value, index) => `${(index * step).toFixed(2)},${(height - pad - (value / max) * (height - pad * 2)).toFixed(2)}`,
  );
  const area = `0,${height} ${points.join(' ')} ${width},${height}`;
  const id = `spark-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${label} trend over the last ${safe.length} months`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} stroke="none" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
