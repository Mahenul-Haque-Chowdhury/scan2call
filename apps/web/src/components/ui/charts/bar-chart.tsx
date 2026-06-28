// apps/web/src/components/ui/charts/bar-chart.tsx
'use client';

import { useId, useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  niceTicks,
  formatCompact,
  tokenColor,
  type ChartColor,
} from './chart-utils';

export interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  color?: ChartColor;
  formatValue?: (value: number) => string;
  className?: string;
  ariaLabel?: string;
}

const M = { top: 16, right: 16, bottom: 28, left: 44 };

/** Vertical bar chart with grid, axis labels, hover highlight + tooltip. */
export function BarChart({
  data,
  height = 280,
  color = 'accent',
  formatValue = (v) => formatCompact(v),
  className,
  ariaLabel = 'Bar chart',
}: BarChartProps) {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  const width = 720;
  const innerW = width - M.left - M.right;
  const innerH = height - M.top - M.bottom;

  const stroke = tokenColor(color);
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const ticks = useMemo(() => niceTicks(max, 4), [max]);
  const tickMax = ticks[ticks.length - 1] || 1;

  if (!data || data.length === 0) {
    return (
      <div className={className} style={{ height }} role="img" aria-label={`${ariaLabel}: no data`}>
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-dim">
          No data for this period.
        </div>
      </div>
    );
  }

  const slot = innerW / data.length;
  const barW = Math.min(slot * 0.6, 48);
  const labelEvery = Math.ceil(data.length / 9);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={ariaLabel}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`bar-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.95} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.45} />
          </linearGradient>
        </defs>

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
              <text x={M.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill={tokenColor('text-muted')}>
                {formatValue(t)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const cx = M.left + slot * i + slot / 2;
          const barH = (d.value / tickMax) * innerH;
          const y = M.top + innerH - barH;
          const active = hover === i;
          return (
            <g
              key={`${d.label}-${i}`}
              onPointerEnter={() => setHover(i)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hit area */}
              <rect x={cx - slot / 2} y={M.top} width={slot} height={innerH} fill="transparent" />
              <motion.rect
                x={cx - barW / 2}
                width={barW}
                rx={4}
                fill={`url(#bar-${id})`}
                opacity={hover === null || active ? 1 : 0.45}
                initial={reduce ? false : { height: 0, y: M.top + innerH }}
                animate={{ height: Math.max(barH, 0), y }}
                transition={{ duration: 0.7, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
              />
              {i % labelEvery === 0 && (
                <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill={tokenColor('text-muted')}>
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover !== null && data[hover] && (
        <div className="pointer-events-none relative">
          <div
            className="absolute -translate-x-1/2 rounded-lg border border-border bg-surface-overlay px-3 py-2 text-xs shadow-lg shadow-shadow"
            style={{ left: `${((M.left + slot * hover + slot / 2) / width) * 100}%`, bottom: 8 }}
          >
            <div className="font-medium text-text">{formatValue(data[hover]!.value)}</div>
            <div className="mt-0.5 text-text-muted">{data[hover]!.label}</div>
          </div>
        </div>
      )}
    </div>
  );
}
