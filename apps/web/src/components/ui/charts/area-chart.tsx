// apps/web/src/components/ui/charts/area-chart.tsx
'use client';

import { useId, useRef, useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  buildSmoothPath,
  scaleSeries,
  niceTicks,
  formatCompact,
  tokenColor,
  type ChartColor,
  type Point,
} from './chart-utils';

export interface AreaChartDatum {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaChartDatum[];
  height?: number;
  color?: ChartColor;
  /** Formats the value shown in the hover tooltip + Y axis. */
  formatValue?: (value: number) => string;
  /** Show the filled gradient area (true) or just the line (false). */
  area?: boolean;
  className?: string;
  ariaLabel?: string;
}

const M = { top: 16, right: 16, bottom: 28, left: 44 };

/**
 * Responsive area/line chart with a grid, Y-axis labels, X-axis ticks and an
 * interactive hover crosshair + tooltip. Pure SVG, theme-token aware, animated.
 */
export function AreaChart({
  data,
  height = 280,
  color = 'primary',
  formatValue = (v) => formatCompact(v),
  area = true,
  className,
  ariaLabel = 'Trend chart',
}: AreaChartProps) {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  // Fixed internal viewBox width; SVG scales to container via width=100%.
  const width = 720;
  const innerW = width - M.left - M.right;
  const innerH = height - M.top - M.bottom;

  const stroke = tokenColor(color);
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const ticks = useMemo(() => niceTicks(max, 4), [max]);
  const tickMax = ticks[ticks.length - 1] || 1;

  const points: Point[] = useMemo(
    () =>
      scaleSeries(values, innerW, innerH, { min: 0, max: tickMax }).map((p) => ({
        x: p.x + M.left,
        y: p.y + M.top,
      })),
    [values, innerW, innerH, tickMax],
  );

  const linePath = useMemo(() => buildSmoothPath(points), [points]);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaPath =
    points.length > 1 && firstPoint && lastPoint
      ? `${linePath} L ${lastPoint.x} ${M.top + innerH} L ${firstPoint.x} ${M.top + innerH} Z`
      : '';

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    // Find nearest point index.
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setHover(nearest);
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={className}
        style={{ height }}
        role="img"
        aria-label={`${ariaLabel}: no data`}
      >
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-dim">
          No data for this period.
        </div>
      </div>
    );
  }

  const hp = hover !== null ? points[hover] : null;
  const hoverDatum = hover !== null ? data[hover] : null;
  // X-axis labels: show a sensible subset to avoid crowding.
  const labelEvery = Math.ceil(data.length / 7);

  return (
    <div className={className}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
        style={{ touchAction: 'none' }}
      >
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Horizontal grid + Y labels */}
        {ticks.map((t) => {
          const y = M.top + innerH - (t / tickMax) * innerH;
          return (
            <g key={t}>
              <line
                x1={M.left}
                y1={y}
                x2={width - M.right}
                y2={y}
                stroke={tokenColor('text-muted')}
                strokeOpacity={0.12}
                strokeDasharray={t === 0 ? undefined : '3 4'}
              />
              <text
                x={M.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill={tokenColor('text-muted')}
              >
                {formatValue(t)}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {data.map((d, i) => {
          if (i % labelEvery !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={`xl-${i}`}
              x={points[i]?.x}
              y={height - 8}
              textAnchor="middle"
              fontSize={11}
              fill={tokenColor('text-muted')}
            >
              {d.label}
            </text>
          );
        })}

        {area && areaPath && (
          <motion.path
            d={areaPath}
            fill={`url(#area-${id})`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )}

        <motion.path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Hover crosshair + marker */}
        {hp && (
          <g>
            <line
              x1={hp.x}
              y1={M.top}
              x2={hp.x}
              y2={M.top + innerH}
              stroke={stroke}
              strokeOpacity={0.4}
              strokeDasharray="3 3"
            />
            <circle cx={hp.x} cy={hp.y} r={5} fill={stroke} stroke="var(--color-bg)" strokeWidth={2} />
          </g>
        )}
      </svg>

      {/* Tooltip (HTML overlay positioned by percentage) */}
      {hp && hoverDatum && (
        <div className="pointer-events-none relative">
          <div
            className="absolute -translate-x-1/2 rounded-lg border border-border bg-surface-overlay px-3 py-2 text-xs shadow-lg shadow-shadow"
            style={{
              left: `${(hp.x / width) * 100}%`,
              bottom: 8,
            }}
          >
            <div className="font-medium text-text">{formatValue(hoverDatum.value)}</div>
            <div className="mt-0.5 text-text-muted">{hoverDatum.label}</div>
          </div>
        </div>
      )}
    </div>
  );
}
