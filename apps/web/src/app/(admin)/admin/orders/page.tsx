'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalInCents: number;
  currency: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  PAID: 'bg-blue-500/20 text-blue-400',
  PROCESSING: 'bg-indigo-500/20 text-indigo-400',
  SHIPPED: 'bg-purple-500/20 text-purple-400',
  DELIVERED: 'bg-emerald-500/20 text-emerald-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

const ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (page: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status) params.set('status', status);

      const result = await apiClient.get<{ data: AdminOrder[]; meta: PaginationMeta }>(
        `/admin/orders?${params.toString()}`
      );
      setOrders(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1, statusFilter);
  }, [fetchOrders, statusFilter]);

  const totalPages = Math.ceil(meta.total / meta.pageSize);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-text font-display">
        Orders
      </h1>
      <p className="mt-2 text-text-muted">View and manage all customer orders.</p>

      {/* Filters */}
      <div className="mt-8 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="error" className="mt-6">
          {error}
          <button
            onClick={() => fetchOrders(meta.page, statusFilter)}
            className="ml-2 underline hover:opacity-80"
          >
            Retry
          </button>
        </Alert>
      )}

      {/* Orders Table */}
      {!error && (
        <div className="mt-6 rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-6 py-3">
            <div className="grid grid-cols-5 text-sm font-medium text-text-dim">
              <span>Order #</span>
              <span>Customer</span>
              <span>Status</span>
              <span>Total</span>
              <span>Date</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-dim">No orders found.</div>
          ) : (
            <div>
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="grid cursor-pointer grid-cols-5 border-b border-border px-6 py-3 text-sm transition-colors last:border-b-0 hover:bg-surface-raised"
                >
                  <span className="font-mono font-medium text-primary">{order.orderNumber}</span>
                  <span className="truncate text-text-muted">
                    {order.user
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : 'Unknown'}
                  </span>
                  <span>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        ORDER_STATUS_COLORS[order.status] || 'bg-surface-raised text-text-dim'
                      }`}
                    >
                      {order.status}
                    </span>
                  </span>
                  <span className="font-medium text-text">
                    ${(order.totalInCents / 100).toFixed(2)} {order.currency}
                  </span>
                  <span className="text-text-muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-text-dim">
                Page {meta.page} of {totalPages} ({meta.total} total orders)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => fetchOrders(meta.page - 1, statusFilter)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page >= totalPages}
                  onClick={() => fetchOrders(meta.page + 1, statusFilter)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
