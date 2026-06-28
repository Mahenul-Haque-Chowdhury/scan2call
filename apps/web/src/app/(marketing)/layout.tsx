'use client';

import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Logo } from '@/components/nav/logo';
import { SiteHeader } from '@/components/nav/site-header';
import { SmoothScroll } from '@/components/smooth-scroll';
import { SOCIAL_LINKS } from '@/lib/seo';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.74v20.52C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

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
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <div className="flex min-h-screen flex-col">
      <SmoothScroll />

      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-60 h-0.5 origin-left bg-primary"
        aria-hidden="true"
      />

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
              <div className="mt-5 flex items-center gap-3">
                <a
                  href={SOCIAL_LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Scan2Call on LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised text-text-muted transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <LinkedInIcon className="h-4 w-4" />
                </a>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Scan2Call on Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised text-text-muted transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <FacebookIcon className="h-4 w-4" />
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
