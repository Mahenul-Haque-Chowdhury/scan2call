'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/nav/logo';
import { MobileMenu, MenuButton } from '@/components/nav/mobile-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/providers/auth-provider';
import { WelcomeButton } from '@/components/nav/welcome-button';
import { CartDropdown } from '@/components/nav/cart-dropdown';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/store', label: 'Store' },
  { href: '/faq', label: 'FAQ' },
];

const footerColumns = [
  {
    title: 'Product',
    links: [
      { href: '/how-it-works', label: 'How it Works' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/store', label: 'Store' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header - floating pill nav */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-7xl rounded-2xl border border-border/50 bg-bg/60 backdrop-blur-lg shadow-lg shadow-shadow">
        <nav className="relative flex items-center justify-between px-6 h-14">
          <div className="-translate-y-1">
            <Logo />
          </div>

          {/* Desktop nav - absolutely centered */}
          <ul className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
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
            <CartDropdown />
            {!isLoading && (
              isAuthenticated && user ? (
                <WelcomeButton firstName={user.firstName} />
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center justify-center px-3 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors md:px-4 md:py-2 md:text-[15px]"
                >
                  Sign in
                </Link>
              )
            )}
            <MenuButton onClick={() => setMenuOpen(true)} />
          </div>
        </nav>
      </header>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={navLinks}
        cta={!isLoading ? (
          isAuthenticated ? { href: '/dashboard', label: 'Profile' } : { href: '/login', label: 'Sign in' }
        ) : undefined}
      />

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Logo size="lg" align="center" />
              <p className="mt-3 text-sm text-text-muted max-w-xs">
                Privacy-first QR identity tags. Protect your valuables with anonymous contact relay.
              </p>
            </div>

            {/* Link columns */}
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-text mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-text-muted hover:text-text transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-accent/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-text-dim">
              &copy; {new Date().getFullYear()} Scan2Call is a product of ZTAC Group. All rights reserved.
            </p>
            <p className="text-xs text-text-dim">
              Designed & Developed by{' '}
              <a href="https://grayvally.tech" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                GrayVally
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
