'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { ArrowLeft } from 'lucide-react';

interface OrderItemDetail { productName: string; productSku: string; quantity: number; unitPriceInCents: number; totalPriceInCents: number; }
interface OrderPayment { id: string; status: string; amountInCents: number; paidAt: string | null; }
interface OrderDetail {
  id: string; orderNumber: string; status: string; subtotalInCents: number; shippingInCents: number; taxInCents: number; totalInCents: number; createdAt: string;
  shippingFirstName: string; shippingLastName: string; shippingAddress1: string; shippingAddress2: string | null; shippingCity: string; shippingState: string; shippingPostcode: string;
  trackingNumber: string | null; items: OrderItemDetail[]; payment: OrderPayment | null;
}

function formatPrice(cents: number): string { return `$${(cents / 100).toFixed(2)}`; }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  pending: 'warning', confirmed: 'info', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'error', refunded: 'neutral', paid: 'success', failed: 'error',
};

function OrderDetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-6 h-8 w-48" />
      <div className="mt-8 grid gap-6 md:grid-cols-2"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
      <Skeleton className="mt-6 h-64 rounded-xl" />
    </div>
  );
}

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
});

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    async function fetchOrder() {
      try {
        const res = await apiClient.get<{ data: OrderDetail }>(`/orders/${orderId}`);
        if (!cancelled) setOrder(res.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchOrder();
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) return <OrderDetailSkeleton />;

  if (error || !order) {
    return (
      <div>
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"><ArrowLeft className="h-4 w-4" />Back to Orders</Link>
        <Alert variant="error" title="Something went wrong" className="mt-6">{error ?? 'Order not found'}</Alert>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"><ArrowLeft className="h-4 w-4" />Back to Orders</Link>
      </motion.div>

      <motion.div {...cardAnim(0.05)} className="mt-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-text-muted">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={statusVariant[order.status.toLowerCase()] ?? 'neutral'}>{order.status}</Badge>
      </motion.div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <motion.div {...cardAnim(0.1)} className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-semibold text-text">Order Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-muted">Subtotal</dt><dd className="font-medium text-text">{formatPrice(order.subtotalInCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Shipping</dt><dd className="font-medium text-text">{formatPrice(order.shippingInCents)}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Tax</dt><dd className="font-medium text-text">{formatPrice(order.taxInCents)}</dd></div>
            <div className="flex justify-between border-t border-border pt-3"><dt className="font-medium text-text">Total</dt><dd className="font-bold text-primary">{formatPrice(order.totalInCents)} AUD</dd></div>
          </dl>
        </motion.div>

        <motion.div {...cardAnim(0.15)} className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-semibold text-text">Payment</h2>
          {order.payment ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-text-muted">Status</dt><dd><Badge variant={statusVariant[order.payment.status.toLowerCase()] ?? 'neutral'}>{order.payment.status}</Badge></dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Card</dt><dd className="font-medium text-text">--</dd></div>
              {order.payment.paidAt && <div className="flex justify-between"><dt className="text-text-muted">Paid at</dt><dd className="font-medium text-text">{formatDate(order.payment.paidAt)}</dd></div>}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-text-muted">No payment information available.</p>
          )}
        </motion.div>
      </div>

      <motion.div {...cardAnim(0.2)} className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border bg-surface-raised px-6 py-3"><h2 className="text-sm font-semibold text-text">Items</h2></div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-text-dim">
              <th className="px-6 py-3">Product</th><th className="px-6 py-3">SKU</th><th className="px-6 py-3 text-right">Qty</th><th className="px-6 py-3 text-right">Unit Price</th><th className="px-6 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((item, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + idx * 0.04, duration: 0.3 }}
                className="transition-colors hover:bg-surface-raised"
              >
                <td className="px-6 py-4 font-medium text-text">{item.productName}</td>
                <td className="px-6 py-4 font-mono text-xs text-text-dim">{item.productSku}</td>
                <td className="px-6 py-4 text-right text-text-muted">{item.quantity}</td>
                <td className="px-6 py-4 text-right text-text-muted">{formatPrice(item.unitPriceInCents)}</td>
                <td className="px-6 py-4 text-right font-medium text-text">{formatPrice(item.totalPriceInCents)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <motion.div {...cardAnim(0.25)} className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-semibold text-text">Shipping</h2>
        <div className="mt-4 text-sm text-text-muted">
          <p className="font-medium text-text">{order.shippingFirstName} {order.shippingLastName}</p>
          <p className="mt-1">{order.shippingAddress1}</p>
          <p>{order.shippingCity}, {order.shippingState} {order.shippingPostcode}</p>
        </div>
        {order.trackingNumber && (
          <div className="mt-4 rounded-xl bg-surface-raised p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-text-dim">Tracking</p>
            <p className="mt-1 font-mono text-sm text-text">{order.trackingNumber}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
