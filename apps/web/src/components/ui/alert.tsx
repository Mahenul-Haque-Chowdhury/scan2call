'use client';

import { cn } from '@/lib/utils';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  className?: string;
}

const config: Record<AlertVariant, { icon: typeof AlertCircle; bg: string; border: string; text: string }> = {
  error: {
    icon: AlertCircle,
    bg: 'bg-error-muted',
    border: 'border-error/20',
    text: 'text-error',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-success-muted',
    border: 'border-success/20',
    text: 'text-success',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-muted',
    border: 'border-warning/20',
    text: 'text-warning',
  },
  info: {
    icon: Info,
    bg: 'bg-info-muted',
    border: 'border-info/20',
    text: 'text-info',
  },
};

export function Alert({ variant = 'info', title, children, dismissible, className }: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const { icon: Icon, bg, border, text } = config[variant];

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 p-3.5 rounded-lg border',
        bg,
        border,
        className,
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', text)} />
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-sm font-semibold mb-0.5', text)}>{title}</p>}
        <div className="text-sm text-text-secondary">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 h-5 w-5 text-text-dim hover:text-text transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
