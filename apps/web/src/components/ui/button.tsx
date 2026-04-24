'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactElement, cloneElement } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground font-semibold hover:bg-primary-hover active:scale-[0.98] glow-sm hover:glow-md',
  secondary:
    'bg-surface-raised text-text border border-border hover:bg-surface-overlay hover:border-border-hover active:scale-[0.98]',
  ghost:
    'bg-transparent text-text-muted hover:text-text hover:bg-surface-raised active:scale-[0.98]',
  danger:
    'bg-error-muted text-error border border-transparent hover:bg-error hover:text-white active:scale-[0.98]',
  outline:
    'bg-transparent text-primary border border-primary/40 hover:bg-primary-muted hover:border-primary/60 active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, icon, children, asChild, ...props }, ref) => {
    const classes = cn(
      'inline-flex items-center justify-center font-medium transition-all duration-200 whitespace-nowrap',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
      variantStyles[variant],
      sizeStyles[size],
      (disabled || loading) && 'opacity-50 !cursor-not-allowed pointer-events-none',
      className,
    );

    if (asChild && children && typeof children === 'object' && 'props' in children) {
      return cloneElement(children as ReactElement<Record<string, unknown>>, {
        className: cn(classes, (children as ReactElement<{ className?: string }>).props.className),
        ref,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : icon}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
