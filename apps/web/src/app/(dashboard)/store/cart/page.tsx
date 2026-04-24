'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCart } from '@/providers/cart-provider';
import { ShoppingCart, ImageIcon, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, itemCount } = useCart();

  const total = getTotal();

  if (items.length === 0) {
    return (
      <div>
        <PageHeader
          title="Shopping Cart"
          description="Review your items before checkout."
        />

        <Card className="mt-8">
          <EmptyState
            icon={<ShoppingCart className="h-6 w-6" />}
            title="Your cart is empty"
            description="Browse the store to find tags and accessories."
            action={
              <Link href="/store">
                <Button variant="outline">Browse the Store</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Shopping Cart"
        description={`Review your items before checkout. (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item, i) => (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <Card className="flex gap-4 p-4">
                <Link href={`/store/${item.slug}`} className="shrink-0">
                  <div className="h-24 w-24 overflow-hidden rounded-lg bg-surface-raised">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-text-dim">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/store/${item.slug}`}
                        className="font-semibold text-text hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-text-muted">
                        ${formatPrice(item.priceInCents)} AUD each
                      </p>
                    </div>
                    <p className="font-semibold text-text">
                      ${formatPrice(item.priceInCents * item.quantity)} AUD
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-border">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-medium text-text">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-sm text-error hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="sticky top-8"
          >
            <Card>
              <CardContent className="py-6">
                <h2 className="font-semibold text-text">Order Summary</h2>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">
                      Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                    </span>
                    <span className="font-medium text-text">
                      ${formatPrice(total)} AUD
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Shipping</span>
                    <span className="font-medium text-text-dim">
                      Calculated at checkout
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-semibold text-text">Total</span>
                  <span className="text-xl font-bold text-text">
                    ${formatPrice(total)} AUD
                  </span>
                </div>

                <Button
                  onClick={() => router.push('/store/checkout')}
                  className="mt-6 w-full"
                  size="lg"
                >
                  Proceed to Checkout
                </Button>

                <Link
                  href="/store"
                  className="mt-3 block text-center text-sm text-text-muted hover:text-text transition-colors"
                >
                  Continue Shopping
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
