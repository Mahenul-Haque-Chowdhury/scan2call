'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart, type CartItem } from '@/providers/cart-provider';

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1] as const,
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] as const } },
  exit: {
    opacity: 0,
    x: 12,
    height: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
  },
};

export function CartDropdown() {
  const { items, itemCount, getTotal, removeItem, updateQuantity } = useCart();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function handleLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  }

  // Close on outside click (mobile safety)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Cart trigger */}
      <Link
        href="/store/cart"
        className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg text-text-secondary hover:text-text hover:bg-surface-raised transition-colors"
        aria-label="Shopping cart"
        onFocus={handleEnter}
        onBlur={handleLeave}
      >
        <ShoppingCart className="h-4.5 w-4.5" />
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border/60 bg-surface/95 backdrop-blur-xl shadow-2xl shadow-shadow/50 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
              <h3 className="text-sm font-semibold text-text">
                Cart{itemCount > 0 && <span className="ml-1 text-text-dim">({itemCount})</span>}
              </h3>
              {itemCount > 0 && (
                <Link
                  href="/store/cart"
                  className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                  onClick={() => setOpen(false)}
                >
                  View full cart
                </Link>
              )}
            </div>

            <div className="h-px bg-border/50 mx-3" />

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center py-8 px-4">
                <ShoppingBag className="h-10 w-10 text-text-dim/30" />
                <p className="mt-2 text-sm text-text-dim">Your cart is empty</p>
                <Link
                  href="/store"
                  className="mt-3 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Browse Store
                </Link>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto py-2 px-3 space-y-1">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartDropdownItem
                        key={item.productId}
                        item={item}
                        onRemove={() => removeItem(item.productId)}
                        onUpdateQty={(qty) => updateQuantity(item.productId, qty)}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                <div className="h-px bg-border/50 mx-3" />

                {/* Footer */}
                <div className="p-3 space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-text-muted">Subtotal</span>
                    <span className="text-sm font-bold text-text">
                      ${formatPrice(getTotal())} <span className="text-xs font-normal text-text-dim">AUD</span>
                    </span>
                  </div>
                  <Link
                    href="/store/cart"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors glow-sm"
                  >
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Individual cart item row ───

function CartDropdownItem({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  return (
    <motion.div
      layout
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-raised/60 transition-colors"
    >
      {/* Thumbnail */}
      <div className="h-11 w-11 rounded-md border border-border bg-surface-raised overflow-hidden shrink-0">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-dim/40">
            <ShoppingBag className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text truncate">{item.name}</p>
        <p className="text-xs text-primary font-semibold mt-0.5">
          ${formatPrice(item.priceInCents)}
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQty(item.quantity - 1)}
          className="h-5 w-5 flex items-center justify-center rounded text-text-dim hover:text-text hover:bg-surface-overlay transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="text-xs font-medium text-text w-5 text-center">{item.quantity}</span>
        <button
          onClick={() => onUpdateQty(item.quantity + 1)}
          className="h-5 w-5 flex items-center justify-center rounded text-text-dim hover:text-text hover:bg-surface-overlay transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="h-6 w-6 flex items-center justify-center rounded text-text-dim hover:text-error hover:bg-error/10 transition-colors shrink-0"
        aria-label="Remove item"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </motion.div>
  );
}
