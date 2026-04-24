'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: string | number;
}

export function SidebarLink({ href, icon, children, badge }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-all duration-200 group relative',
        isActive
          ? 'bg-primary-muted text-primary font-medium'
          : 'text-text-muted hover:text-text hover:bg-surface-raised',
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <span className={cn('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-text-dim group-hover:text-text-muted')}>
        {icon}
      </span>
      <span className="flex-1">{children}</span>
      {badge !== undefined && (
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full font-medium transition-colors',
            isActive
              ? 'bg-primary/20 text-primary'
              : 'bg-surface-overlay text-text-dim',
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
