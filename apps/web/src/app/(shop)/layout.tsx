'use client';

import Link from 'next/link';
import { Lock, ShoppingCart } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { Logo } from '@/components/nav/logo';
import { useCart } from '@/providers/cart-provider';

function ShopHeader() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo size="sm" align="center" />

        <div className="flex items-center gap-2 text-xs text-text-dim">
          <Lock className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Secure Checkout</span>
        </div>

        <Link
          href="/cart"
          className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
        >
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg">
        <ShopHeader />
        <main className="mx-auto max-w-6xl px-6 py-10">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
