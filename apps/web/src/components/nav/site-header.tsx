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
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <>
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
                <div className="hidden md:block">
                  <WelcomeButton firstName={user.firstName} />
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:inline-flex h-9 items-center justify-center px-3 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors md:px-4 md:py-2 md:text-[15px]"
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
    </>
  );
}
