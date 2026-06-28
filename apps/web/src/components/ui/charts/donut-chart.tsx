// apps/web/src/components/ui/charts/donut-chart.tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { describeArc, tokenColor, type ChartColor } from './chart-utils';

export interface DonutSegment {
  label: string;
  value: number;
  color: ChartColor;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  /** Large number shown in the center. Defaults to the total. */
  centerLabel?: string;
  centerSublabel?: string;
  className?: string;
}

/** Donut chart for categorical breakdowns, with a center label + legend. */
export function DonutChart({
  segments,
  size = 180,
  thickness = 22,
  centerLabel,
  centerSublabel,
  className,
}: DonutChartProps) {
  const reduce = useReducedMotion();
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const denom = Math.max(total, 1);
  const visible = segments.filter((s) => s.value > 0);
  const arcs = visible.map((s, i) => {
    const offset = visible.slice(0, i).reduce((sum, prev) => sum + prev.value, 0);
    return {
      ...s,
      startAngle: (offset / denom) * 360,
      endAngle: ((offset + s.value) / denom) * 360,
    };
  });

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Breakdown donut chart">
            {/* Track */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={tokenColor('text-muted')}
              strokeOpacity={0.1}
              strokeWidth={thickness}
            />
            {total === 0 && (
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={tokenColor('text-muted')}
                strokeOpacity={0.2}
                strokeWidth={thickness}
                strokeDasharray="2 6"
              />
            )}
            {arcs.map((a, i) => (
              <motion.path
                key={a.label}
                d={describeArc(cx, cy, radius, a.startAngle, a.endAngle)}
                fill="none"
                stroke={tokenColor(a.color)}
                strokeWidth={thickness}
                strokeLinecap="round"
                initial={reduce ? false : { opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-2xl font-bold text-text">
              {centerLabel ?? total.toLocaleString()}
            </span>
            {centerSublabel && (
              <span className="text-xs text-text-muted">{centerSublabel}</span>
            )}
          </div>
        </div>

        <ul className="space-y-2">
          {segments.map((s) => {
            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
            return (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tokenColor(s.color) }}
                  aria-hidden="true"
                />
                <span className="text-text-muted">{s.label}</span>
                <span className="ml-auto font-medium text-text">{s.value.toLocaleString()}</span>
                <span className="w-9 text-right text-xs text-text-dim">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
