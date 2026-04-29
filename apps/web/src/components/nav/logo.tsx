import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  align?: 'baseline' | 'center';
  className?: string;
  linkTo?: string;
}

const sizeStyles = {
  sm: 'text-xl',
  md: 'text-[1.85rem]',
  lg: 'text-3xl',
};

const iconSizes = {
  sm: 26,
  md: 32,
  lg: 42,
};

export function Logo({ size = 'md', align = 'baseline', className, linkTo = '/' }: LogoProps) {
  const iconSize = iconSizes[size];
  const alignment = align === 'center' ? 'items-center' : 'items-end';
  const textOffset = align === 'center' ? '' : 'relative top-3';

  return (
    <Link href={linkTo} className={`inline-flex ${alignment} gap-1.5 hover:opacity-90 transition-opacity`}>
      <Image
        src="/sca2call-logo.png"
        alt="Scan2Call logo"
        width={iconSize}
        height={iconSize}
        className="block shrink-0 object-contain"
      />
      <span
        className={cn(
          'font-bold tracking-tight font-display',
          textOffset,
          sizeStyles[size],
          className
        )}
      >
        Scan<span className="text-primary">2</span>Call
      </span>
    </Link>
  );
}
