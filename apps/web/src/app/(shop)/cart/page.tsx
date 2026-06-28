'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, ImageIcon, Minus, Plus, Trash2, RefreshCw, Clock, ArrowRight, Tag,
} from 'lucide-react';
import { useCart } from '@/providers/cart-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import {
  TAG_MAX_DURATION_YEARS,
  TAG_MIN_DURATION_YEARS,
} from '@scan2call/shared';

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

const DURATION_OPTIONS = Array.from(
  { length: TAG_MAX_DURATION_YEARS - TAG_MIN_DURATION_YEARS + 1 },
  (_, i) => TAG_MIN_DURATION_YEARS + i,
);

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    updateDuration,
    updateAutoRenew,
    updateTagDetails,
    getTotal,
    getLineTotal,
    itemCount,
  } = useCart();

  const [expandedCustomize, setExpandedCustomize] = useState<Set<string>>(new Set());

  function toggleCustomize(productId: string) {
    setExpandedCustomize((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  const total = getTotal();

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Your Cart" description="Items you have added will appear here." />
        <Card className="mt-8">
          <EmptyState
            icon={<ShoppingCart className="h-6 w-6" />}
            title="Your cart is empty"
            description="Browse the store and add tags to get started."
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
        title="Your Cart"
        description={`${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready for checkout.`}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* ── Item list ── */}
        <div className="space-y-4 lg:col-span-2">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <Link href={`/store/${item.slug}`} className="shrink-0">
                        <div className="h-24 w-24 overflow-hidden rounded-xl bg-surface-raised border border-border">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-text-dim">
                              <ImageIcon className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex flex-1 flex-col gap-3 min-w-0">
                        {/* Name + price row */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/store/${item.slug}`}
                              className="font-semibold text-text hover:text-primary transition-colors"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-0.5 text-sm text-text-muted">
                              {item.hasFindMy
                                ? `$${formatPrice(item.devicePriceInCents ?? 0)} device + $${formatPrice(item.priceInCents)}/yr QR`
                                : `$${formatPrice(item.priceInCents)}/yr`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-text">
                              ${formatPrice(getLineTotal(item))}
                            </p>
                            <p className="text-xs text-text-dim">AUD</p>
                          </div>
                        </div>

                        {/* QR Duration + Auto-renew */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-text-dim shrink-0" />
                            <label
                              htmlFor={`duration-${item.productId}`}
                              className="text-xs text-text-muted whitespace-nowrap"
                            >
                              QR active for
                            </label>
                            <select
                              id={`duration-${item.productId}`}
                              value={item.durationYears}
                              onChange={(e) => updateDuration(item.productId, Number(e.target.value))}
                              className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {DURATION_OPTIONS.map((years) => (
                                <option key={years} value={years}>
                                  {years} {years === 1 ? 'year' : 'years'}
                                </option>
                              ))}
                            </select>
                          </div>

                          <label
                            htmlFor={`autorenew-${item.productId}`}
                            className="flex cursor-pointer items-center gap-1.5 text-xs text-text-muted"
                          >
                            <input
                              id={`autorenew-${item.productId}`}
                              type="checkbox"
                              checked={item.autoRenew}
                              onChange={(e) => updateAutoRenew(item.productId, e.target.checked)}
                              className="h-3.5 w-3.5 rounded border-border bg-surface text-primary focus:ring-primary"
                            />
                            <RefreshCw className="h-3 w-3 text-primary" />
                            Auto-renew (+1 yr)
                          </label>
                        </div>

                        {/* Qty + Remove */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center rounded-lg border border-border">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-l-lg text-text-muted hover:bg-surface-raised hover:text-text transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[2.5rem] text-center text-sm font-semibold text-text">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-r-lg text-text-muted hover:bg-surface-raised hover:text-text transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleCustomize(item.productId)}
                              className="flex items-center gap-1 text-xs text-text-dim hover:text-primary transition-colors"
                            >
                              <Tag className="h-3 w-3" />
                              {expandedCustomize.has(item.productId) ? 'Hide label' : 'Add label'}
                            </button>
                            <button
                              onClick={() => removeItem(item.productId)}
                              className="flex items-center gap-1 text-xs text-error hover:underline"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Tag customization (expandable) */}
                        <AnimatePresence>
                          {expandedCustomize.has(item.productId) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 rounded-lg border border-border bg-surface-raised p-3">
                                <p className="text-xs font-medium text-text-muted">
                                  Tag label <span className="text-text-dim font-normal">(optional - shown on your tag page)</span>
                                </p>
                                <input
                                  type="text"
                                  placeholder="e.g. Max the Dog, Blue Suitcase"
                                  value={item.tagLabel ?? ''}
                                  onChange={(e) =>
                                    updateTagDetails(item.productId, e.target.value, item.tagDescription ?? '')
                                  }
                                  className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                  maxLength={200}
                                />
                                <textarea
                                  placeholder="Short description (e.g. If found, please call. Reward offered.)"
                                  value={item.tagDescription ?? ''}
                                  onChange={(e) =>
                                    updateTagDetails(item.productId, item.tagLabel ?? '', e.target.value)
                                  }
                                  rows={2}
                                  className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                  maxLength={1000}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
          >
            &larr; Continue Shopping
          </Link>
        </div>

        {/* ── Order Summary sidebar ── */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-8"
          >
            <Card>
              <CardContent className="py-6">
                <h2 className="font-semibold text-text">Order Summary</h2>

                <div className="mt-4 divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-medium text-text truncate">{item.name}</p>
                        <p className="text-xs text-text-dim">
                          x{item.quantity} &middot; {item.durationYears}yr
                          {item.autoRenew ? ' &middot; auto-renew' : ''}
                        </p>
                      </div>
                      <span className="shrink-0 font-medium text-text">
                        ${formatPrice(getLineTotal(item))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="font-medium text-text">${formatPrice(total)} AUD</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Shipping</span>
                    <span className="text-text-dim">Calculated at checkout</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-semibold text-text">Estimated Total</span>
                  <span className="text-xl font-bold text-primary">${formatPrice(total)} AUD</span>
                </div>

                <Button
                  onClick={() => router.push('/checkout')}
                  className="mt-6 w-full"
                  size="lg"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
