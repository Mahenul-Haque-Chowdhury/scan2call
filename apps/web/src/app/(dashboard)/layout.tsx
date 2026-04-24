'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/providers/auth-provider';
import { Logo } from '@/components/nav/logo';
import { SidebarLink } from '@/components/nav/sidebar-link';
import { MobileMenu, MenuButton } from '@/components/nav/mobile-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  LayoutDashboard,
  Tag,
  Package,
  Crown,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const headerLinks = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/store', label: 'Store' },
  { href: '/faq', label: 'FAQ' },
];

const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tags', label: 'Tags', icon: Tag },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/subscription', label: 'Subscription', icon: Crown },
  { href: '/store/cart', label: 'Store', icon: ShoppingCart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-7xl rounded-2xl border border-border/50 bg-bg/60 backdrop-blur-lg shadow-lg shadow-shadow">
        <nav className="flex items-center justify-between px-6 h-14">
          <Logo />

          <ul className="hidden md:flex items-center gap-1">
            {headerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === link.href
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text hover:bg-surface-raised'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <div className="relative hidden md:block">
                <motion.button
                  onClick={() => setShowSignOutConfirm(!showSignOutConfirm)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-error hover:text-white hover:bg-error rounded-lg transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </motion.button>

                <AnimatePresence>
                  {showSignOutConfirm && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setShowSignOutConfirm(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
                        className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border bg-surface p-4 shadow-lg shadow-shadow"
                      >
                        <p className="text-sm text-text">
                          Are you sure you want to sign out, <span className="font-semibold">{user.firstName}</span>?
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <motion.button
                            onClick={() => { setShowSignOutConfirm(false); logout(); }}
                            className="flex-1 rounded-lg bg-error px-3 py-2 text-sm font-medium text-white hover:bg-error/90 transition-colors"
                            whileTap={{ scale: 0.97 }}
                          >
                            Yes, sign out
                          </motion.button>
                          <motion.button
                            onClick={() => setShowSignOutConfirm(false)}
                            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-raised transition-colors"
                            whileTap={{ scale: 0.97 }}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            <MenuButton onClick={() => setMenuOpen(true)} />
          </div>
        </nav>
      </header>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={headerLinks}
        cta={{ href: '/dashboard', label: 'Dashboard' }}
      />

      <div className="flex flex-1 pt-24 justify-center">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-overlay z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <div className="flex w-full max-w-6xl">
          <aside
            className={`fixed lg:sticky lg:top-24 inset-y-0 left-0 z-50 lg:z-10 w-56 shrink-0 flex flex-col bg-surface border border-border lg:rounded-xl lg:h-[calc(100vh-10rem)] lg:my-1 transition-transform duration-200 lg:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between px-5 h-14 border-b border-border lg:hidden">
              <span className="text-sm font-semibold text-text-muted">Navigation</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-surface-raised text-text-muted"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-accent/10 px-4 py-4">
              {user && (
                <Link href="/settings" className="block px-1 rounded-md hover:bg-surface-raised transition-colors">
                  <p className="truncate text-sm font-medium text-text">{user.firstName} {user.lastName}</p>
                  <p className="truncate text-xs text-text-dim">{user.email}</p>
                </Link>
              )}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {sidebarLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                >
                  <SidebarLink href={link.href} icon={<link.icon className="h-5 w-5" />}>
                    {link.label}
                  </SidebarLink>
                </motion.div>
              ))}
            </nav>
          </aside>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="lg:hidden sticky top-[88px] z-20 h-12 flex items-center gap-3 px-4 border-b border-border bg-bg/80 backdrop-blur-lg">
              <button
                onClick={() => setSidebarOpen(true)}
                className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-surface-raised text-text-muted"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-text-muted">
                {sidebarLinks.find((l) => l.href === '/dashboard' && pathname === '/dashboard')?.label ||
                  sidebarLinks.find((l) => l.href !== '/dashboard' && pathname.startsWith(l.href))?.label ||
                  'Dashboard'}
              </span>
            </div>

            <main className="flex-1">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
                className="px-4 sm:px-8 py-6 sm:py-8"
              >
                {children}
              </motion.div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
