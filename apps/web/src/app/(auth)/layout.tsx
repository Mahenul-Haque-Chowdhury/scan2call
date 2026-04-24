'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/nav/logo';
import { Shield } from 'lucide-react';
import { MorphBlob } from '@/components/ui/motion';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen gradient-mesh">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border/50 p-10 lg:flex lg:w-105 xl:w-120">
        <div className="absolute -top-20 -left-20 w-80 h-80 pointer-events-none">
          <MorphBlob className="w-full h-full bg-primary/5 blur-3xl" />
        </div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 pointer-events-none">
          <MorphBlob className="w-full h-full bg-accent/4 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="relative"
        >
          <Logo size="lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
          className="relative space-y-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted border border-primary/25">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <blockquote>
            <p className="text-lg font-medium leading-relaxed text-text">
              &ldquo;My dog escaped while I was at work. A stranger scanned his collar tag and called me within minutes. Absolute lifesaver.&rdquo;
            </p>
            <footer className="mt-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary-muted flex items-center justify-center text-xs font-bold text-primary">
                SM
              </div>
              <div>
                <div className="text-sm font-semibold">Sarah M.</div>
                <div className="text-xs text-text-dim">Melbourne, VIC</div>
              </div>
            </footer>
          </blockquote>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative text-xs text-text-dim"
        >
          Privacy-first · AU Data Residency · Cancel anytime
        </motion.div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="mb-8 text-center lg:hidden"
          >
            <Logo size="lg" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
            className="rounded-2xl border border-border/60 bg-surface/80 backdrop-blur-xl p-8 shadow-2xl shadow-shadow"
          >
            {children}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-5 text-center text-sm text-text-dim"
          >
            <Link href="/" className="hover:text-text-muted transition-colors">
              &larr; Back to home
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
