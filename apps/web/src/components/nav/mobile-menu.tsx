'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
  cta?: { href: string; label: string };
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      damping: 28,
      stiffness: 300,
      mass: 0.8,
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    filter: 'blur(4px)',
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1] as [number, number, number, number],
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, damping: 24, stiffness: 260 },
  },
  exit: {
    opacity: 0,
    x: -8,
    filter: 'blur(4px)',
    transition: { duration: 0.15 },
  },
};

const ctaVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, damping: 22, stiffness: 240, delay: 0.05 },
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.97,
    transition: { duration: 0.15 },
  },
};

export function MobileMenu({ isOpen, onClose, links, cta }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mobile-backdrop"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-overlay backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />

          {/* Dropdown panel - anchored below the floating nav */}
          <motion.div
            key="mobile-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl md:hidden"
          >
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-surface/95 backdrop-blur-xl shadow-2xl shadow-shadow">
              {/* Close button row */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="text-xs font-medium uppercase tracking-widest text-text-dim">
                  Menu
                </span>
                <motion.button
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface-raised/80 hover:bg-surface-overlay text-text-muted hover:text-text transition-colors"
                  aria-label="Close menu"
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Divider */}
              <div className="mx-5 h-px bg-border/50" />

              {/* Nav links */}
              <nav className="px-3 py-3 space-y-0.5">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div key={link.href} variants={itemVariants}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={`group flex items-center justify-between px-3 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                          isActive
                            ? 'text-primary bg-primary/8'
                            : 'text-text-muted hover:text-text hover:bg-surface-raised/70'
                        }`}
                      >
                        <span>{link.label}</span>
                        <ChevronRight
                          className={`h-4 w-4 transition-all duration-200 ${
                            isActive
                              ? 'text-primary/60 translate-x-0'
                              : 'text-text-dim -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                          }`}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* CTA button */}
              {cta && (
                <motion.div variants={ctaVariants} className="px-4 pb-4 pt-1">
                  <div className="h-px bg-border/50 mb-3" />
                  <Link
                    href={cta.href}
                    onClick={onClose}
                    className="flex items-center justify-center w-full py-3 px-4 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary-hover transition-all duration-200 glow-md hover:glow-lg"
                  >
                    {cta.label}
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-surface-raised text-text-muted hover:text-text transition-colors"
      aria-label="Open menu"
      whileTap={{ scale: 0.9 }}
    >
      <Menu className="h-5 w-5" />
    </motion.button>
  );
}
