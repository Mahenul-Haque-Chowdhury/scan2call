// apps/web/src/components/ui/charts/sparkline.tsx
'use client';

import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  buildSmoothPath,
  scaleSeries,
  tokenColor,
  type ChartColor,
} from './chart-utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: ChartColor;
  /** Render a soft gradient area beneath the line. */
  fill?: boolean;
  className?: string;
  strokeWidth?: number;
}

/**
 * A compact, axis-less trend line. Designed to sit inside stat cards or
 * table rows. Pure SVG, no dependencies, theme-token aware.
 */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = 'primary',
  fill = true,
  className,
  strokeWidth = 2,
}: SparklineProps) {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const pad = strokeWidth + 1;

  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height} className={className} aria-hidden="true">
        <line
          x1={pad}
          y1={height / 2}
          x2={width - pad}
          y2={height / 2}
          stroke={tokenColor('text-muted')}
          strokeOpacity={0.3}
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  const points = scaleSeries(data, width, height, { padding: pad });
  const linePath = buildSmoothPath(points);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaPath =
    firstPoint && lastPoint
      ? `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`
      : '';
  const stroke = tokenColor(color);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Trend sparkline"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && points.length > 1 && (
        <motion.path
          d={areaPath}
          fill={`url(#spark-${id})`}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
      <motion.path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
      {lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={strokeWidth + 0.5}
          fill={stroke}
        />
      )}
    </svg>
  );
}
