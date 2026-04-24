import { cn } from '@/lib/utils';

interface CardProps {
  variant?: 'default' | 'raised' | 'glass';
  className?: string;
  children: React.ReactNode;
}

interface CardSectionProps {
  className?: string;
  children: React.ReactNode;
}

const cardVariants = {
  default: 'bg-surface border border-border rounded-xl',
  raised:
    'bg-surface border border-border rounded-xl shadow-lg shadow-shadow',
  glass: 'glass-card',
};

export function Card({ variant = 'default', className, children }: CardProps) {
  return (
    <div className={cn(cardVariants[variant], className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardSectionProps) {
  return (
    <div className={cn('px-5 py-4 border-b border-border', className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }: CardSectionProps) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function CardFooter({ className, children }: CardSectionProps) {
  return (
    <div className={cn('px-5 py-4 border-t border-border', className)}>
      {children}
    </div>
  );
}
