// apps/web/src/components/ui/charts/chart-utils.ts
// Shared geometry + scale helpers for the lightweight SVG chart primitives.

export type ChartColor =
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'text-muted';

/** Resolve a design-token color name to its CSS custom property. */
export function tokenColor(color: ChartColor): string {
  return `var(--color-${color})`;
}

export interface Point {
  x: number;
  y: number;
}

/** Linear interpolation between two numbers. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Build a smooth (monotone-ish cubic) SVG path through a set of points.
 * Falls back to straight segments when there are fewer than 3 points.
 */
export function buildSmoothPath(points: Point[]): string {
  const first = points[0];
  if (!first) return '';
  if (points.length === 1) {
    return `M ${first.x} ${first.y}`;
  }
  if (points.length === 2) {
    const second = points[1]!;
    return `M ${first.x} ${first.y} L ${second.x} ${second.y}`;
  }

  const smoothing = 0.18;
  const line = (a: Point, b: Point) => {
    const lengthX = b.x - a.x;
    const lengthY = b.y - a.y;
    return {
      length: Math.sqrt(lengthX ** 2 + lengthY ** 2),
      angle: Math.atan2(lengthY, lengthX),
    };
  };

  const controlPoint = (
    current: Point,
    previous: Point | undefined,
    next: Point | undefined,
    reverse?: boolean,
  ): [number, number] => {
    const p = previous ?? current;
    const n = next ?? current;
    const o = line(p, n);
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;
    const x = current.x + Math.cos(angle) * length;
    const y = current.y + Math.sin(angle) * length;
    return [x, y];
  };

  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const [cpsX, cpsY] = controlPoint(prev, points[i - 2], curr);
    const [cpeX, cpeY] = controlPoint(curr, prev, points[i + 1], true);
    d += ` C ${cpsX} ${cpsY}, ${cpeX} ${cpeY}, ${curr.x} ${curr.y}`;
  }
  return d;
}

/** Build a straight-segment line path. */
export function buildLinePath(points: Point[]): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

/** Map an array of values to SVG coordinates inside the given box. */
export function scaleSeries(
  values: number[],
  width: number,
  height: number,
  opts: { padding?: number; min?: number; max?: number } = {},
): Point[] {
  const { padding = 0 } = opts;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const max = opts.max ?? Math.max(...values, 0);
  const min = opts.min ?? Math.min(...values, 0);
  const range = max - min || 1;

  if (values.length === 1) {
    return [{ x: padding + innerW / 2, y: padding + innerH / 2 }];
  }

  return values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * innerW;
    const y = padding + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });
}

/** Produce up to `count` evenly distributed, human-friendly tick values. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(Math.round(lerp(0, max, i / count)));
  }
  return Array.from(new Set(ticks));
}

/** Describe an SVG arc segment for donut/pie charts. */
export function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const polar = (angle: number) => ({
    x: cx + radius * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + radius * Math.sin((angle - 90) * (Math.PI / 180)),
  });
  const start = polar(endAngle);
  const end = polar(startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/** Compact number formatting: 1234 -> 1.2k, 1_500_000 -> 1.5M. */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}
