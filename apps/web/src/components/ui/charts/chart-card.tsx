// apps/web/src/components/ui/charts/chart-card.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Optional element rendered on the right of the header (badge, total, etc.). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/** Consistent framed container for a chart with a header row. */
export function ChartCard({ title, subtitle, action, children, className, delay = 0 }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn('rounded-2xl border border-border bg-surface p-5 sm:p-6', className)}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-text">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </motion.div>
  );
}

/** Skeleton placeholder used while a lazily-loaded chart is being fetched. */
export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg bg-surface-raised"
      style={{ height }}
      aria-hidden="true"
    />
  );
}
