import { cn } from '@/lib/utils';

interface DividerProps {
  text?: string;
  className?: string;
}

export function Divider({ text, className }: DividerProps) {
  if (!text) {
    return <hr className={cn('border-border', className)} />;
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-text-dim font-medium uppercase tracking-wider">
        {text}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
