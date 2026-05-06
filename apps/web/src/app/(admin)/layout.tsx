'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Logo } from '@/components/nav/logo';
import { SidebarLink } from '@/components/nav/sidebar-link';
import { Spinner } from '@/components/ui/spinner';
import {
  LayoutGrid,
  Users,
  Tag,
  Package,
  Store,
  BarChart3,
  Activity,
  FileText,
  Mail,
  Gift,
  QrCode,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const adminLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/tags', label: 'Tags', icon: Tag },
  { href: '/admin/qr-templates', label: 'QR Designs', icon: QrCode },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/products', label: 'Products', icon: Store },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/contact-messages', label: 'Contact Inbox', icon: Mail },
  { href: '/admin/subscription-gifts', label: 'Subscription Gifts', icon: Gift },
  { href: '/admin/audit-log', label: 'Audit Log', icon: FileText },
  { href: '/admin/system-status', label: 'System Status', icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER'))) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" className="mx-auto text-primary" />
          <p className="text-sm text-text-muted">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-overlay z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col bg-surface border-r border-border transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <div className="flex items-baseline gap-2">
            <Logo size="sm" linkTo="/admin" />
            <span className="text-xs font-medium text-text-dim bg-surface-raised px-1.5 py-0.5 rounded-sm">
              Admin
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md hover:bg-surface-raised text-text-muted"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between px-2">
            <p className="truncate text-xs text-text-dim">
              {user.firstName} {user.lastName}
            </p>
            <ThemeToggle />
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-raised rounded-md transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {adminLinks.map((link) => (
            <SidebarLink key={link.href} href={link.href} icon={<link.icon className="h-5 w-5" />}>
              {link.label}
            </SidebarLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-border bg-bg/80 backdrop-blur-lg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-surface-raised text-text-muted"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo size="sm" linkTo="/admin" />
          <span className="text-xs font-medium text-text-dim bg-surface-raised px-1.5 py-0.5 rounded-sm">
            Admin
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 sm:px-8 py-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
