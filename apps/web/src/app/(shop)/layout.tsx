'use client';

import { Lock } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { SiteHeader } from '@/components/nav/site-header';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-bg">
        <SiteHeader />

        {/* Secure-payment trust strip */}
        <div className="mt-24 border-y border-border/60 bg-surface/40">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 py-2.5 text-xs text-text-muted">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>Secure payment - SSL encrypted, processed by Stripe</span>
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
