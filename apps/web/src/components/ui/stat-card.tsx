'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CountUp } from './motion';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
  delay?: number;
}

export function StatCard({ label, value, icon, trend, className, delay = 0 }: StatCardProps) {
  const isNumber = typeof value === 'number';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'bg-surface border border-border rounded-2xl p-5 transition-colors hover:border-border-hover',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-muted">{label}</span>
        {icon && (
          <div className="h-9 w-9 rounded-xl bg-accent-subtle flex items-center justify-center text-accent">
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold font-display text-text">
        {isNumber ? <CountUp value={value} /> : value}
      </div>
      {trend && (
        <p
          className={cn(
            'text-xs mt-1.5',
            trend.positive ? 'text-success' : 'text-error',
          )}
        >
          {trend.positive ? '+' : ''}{trend.value}
        </p>
      )}
    </motion.div>
  );
}
