'use client';

import Link from 'next/link';
import { Logo } from '@/components/nav/logo';
import { SiteHeader } from '@/components/nav/site-header';

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
      { href: 'https://ztecgroup.au/privacy-policy', label: 'Privacy Policy', external: true },
      { href: 'https://ztecgroup.au/terms-of-service', label: 'Terms of Service', external: true },
    ],
  },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

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
              <div className="mt-4 space-y-2 text-sm text-text-muted">
                <p>1 Silas Street, East Fremantle, Perth WA 6158, Australia</p>
                <a href="mailto:contact@scan2call.com.au" className="inline-flex text-primary hover:underline">
                  contact@scan2call.com.au
                </a>
              </div>
            </div>

            {/* Link columns */}
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-text mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      {'external' in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-text-muted hover:text-text transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-text-muted hover:text-text transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-accent/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-text-dim">
              &copy; 2026 Scan2Call is a product of{' '}
              <a
                href="https://ztecgroup.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ZTEC Group Pty Ltd
              </a>
              {' '}(ABN: 82 697 931 445). All rights reserved.
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
