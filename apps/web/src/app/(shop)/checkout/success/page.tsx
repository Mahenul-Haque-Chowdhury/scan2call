'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCart } from '@/providers/cart-provider';
import { CheckCircle, Package, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CheckoutSuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  }, [clearCart]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      className="mx-auto max-w-lg text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
        className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary-muted"
      >
        <CheckCircle className="h-8 w-8 text-primary" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-3xl font-bold tracking-tight text-text"
      >
        Order Confirmed!
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-3 text-text-muted"
      >
        Thank you for your purchase. Your payment was successful.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 space-y-3 rounded-2xl border border-border bg-surface/60 p-5 text-left"
      >
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-text">We are preparing your order</p>
            <p className="text-sm text-text-muted">
              Your tags will be shipped shortly. You can track progress from your Orders page.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-text">Confirmation on its way</p>
            <p className="text-sm text-text-muted">
              A receipt has been sent to your registered email address.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex justify-center gap-4"
      >
        <Link href={orderId ? `/orders/${orderId}` : '/orders'}>
          <Button variant="secondary">View Order</Button>
        </Link>
        <Link href="/store"><Button>Continue Shopping</Button></Link>
      </motion.div>
    </motion.div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
