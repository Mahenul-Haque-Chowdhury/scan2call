'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full min-h-24 px-3.5 py-2.5 rounded-xl text-sm resize-y',
            'bg-surface-raised text-text placeholder:text-text-dim',
            'border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
            'hover:border-border-hover',
            error
              ? 'border-error/50 focus:ring-error/30 focus:border-error/50'
              : 'border-border',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-error mt-1">{error}</p>}
        {hint && !error && <p className="text-xs text-text-dim mt-1">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
