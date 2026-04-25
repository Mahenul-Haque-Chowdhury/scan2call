import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  linkTo?: string;
}

const sizeStyles = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

const iconSizes = {
  sm: 26,
  md: 32,
  lg: 42,
};

export function Logo({ size = 'md', className, linkTo = '/' }: LogoProps) {
  const iconSize = iconSizes[size];

  return (
    <Link href={linkTo} className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity">
      <Image
        src="/sca2call-logo.png"
        alt="Scan2Call logo"
        width={iconSize}
        height={iconSize}
        className="block shrink-0 object-contain"
      />
      <span className={cn('font-bold tracking-tight font-display', sizeStyles[size], className)}>
        Scan<span className="text-primary">2</span>Call
      </span>
    </Link>
  );
}
