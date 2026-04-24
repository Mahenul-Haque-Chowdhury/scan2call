'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ShoppingBag } from 'lucide-react';

interface OrderItem { productName: string; quantity: number; }
interface Order { id: string; orderNumber: string; status: string; totalInCents: number; createdAt: string; items: OrderItem[]; }
interface OrdersMeta { page: number; pageSize: number; total: number; }

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  pending: 'warning', confirmed: 'info', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'error', refunded: 'neutral',
};

function formatPrice(cents: number): string { return `$${(cents / 100).toFixed(2)} AUD`; }
function formatDate(iso: string): string { return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }

function OrdersSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-5 w-72" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<OrdersMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      setLoading(true); setError(null);
      try {
        const res = await apiClient.get<{ data: Order[]; meta: OrdersMeta }>(`/orders?page=${page}&pageSize=${pageSize}`);
        if (!cancelled) { setOrders(res.data); setMeta(res.meta); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchOrders();
    return () => { cancelled = true; };
  }, [page]);

  if (loading) return <OrdersSkeleton />;

  if (error) {
    return (
      <div>
        <PageHeader title="Orders" />
        <Alert variant="error" title="Something went wrong" className="mt-6">{error}</Alert>
      </div>
    );
  }

  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;

  return (
    <div>
      <PageHeader title="Orders" description="View your order history and track deliveries." />

      {orders.length === 0 ? (
        <Card className="mt-8">
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6" />}
            title="No orders yet"
            description="Browse our store to get started."
            action={<Link href="/store/cart"><Button>Browse Store</Button></Link>}
          />
        </Card>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <div className="border-b border-border bg-surface-raised px-6 py-3">
              <div className="grid grid-cols-4 gap-4 text-xs font-medium uppercase tracking-wide text-text-dim">
                <span>Order</span><span>Date</span><span>Total</span><span>Status</span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                >
                  <Link href={`/orders/${order.id}`} className="block transition-colors hover:bg-surface-raised">
                    <div className="grid grid-cols-4 gap-4 px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-text">{order.orderNumber}</p>
                        <p className="mt-0.5 text-xs text-text-dim">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                      </div>
                      <p className="self-center text-sm text-text-muted">{formatDate(order.createdAt)}</p>
                      <p className="self-center text-sm font-medium text-text">{formatPrice(order.totalInCents)}</p>
                      <div className="self-center"><Badge variant={statusVariant[order.status.toLowerCase()] ?? 'neutral'}>{order.status}</Badge></div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-text-muted">Page {page} of {totalPages} ({meta?.total} orders)</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
