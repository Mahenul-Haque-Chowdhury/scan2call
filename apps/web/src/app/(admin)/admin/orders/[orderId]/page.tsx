'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, QrCode, Power, PowerOff } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = `${API_BASE}/api/v1`;

interface OrderItemTag {
  id: string;
  token: string;
  status: string;
  label: string | null;
}

interface OrderItemProduct {
  id: string;
  name: string;
  slug: string;
  tagType: string | null;
  includesTagCount: number;
}

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceInCents: number;
  totalPriceInCents: number;
  tags?: OrderItemTag[];
  product?: OrderItemProduct;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  totalInCents: number;
  subtotalInCents: number;
  shippingInCents: number;
  taxInCents: number;
  discountInCents: number;
  currency: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: OrderItem[];
  payment: {
    id: string;
    status: string;
    method: string;
    paidAt: string | null;
  } | null;
}

const ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  PAID: 'bg-blue-500/20 text-blue-400',
  PROCESSING: 'bg-indigo-500/20 text-indigo-400',
  SHIPPED: 'bg-purple-500/20 text-purple-400',
  DELIVERED: 'bg-emerald-500/20 text-emerald-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [status, setStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [generatingItem, setGeneratingItem] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [togglingTagId, setTogglingTagId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const result = await apiClient.get<{ data: OrderDetail }>(
          `/admin/orders/${params.orderId}`
        );
        const o = result.data;
        setOrder(o);
        setStatus(o.status);
        setTrackingNumber(o.trackingNumber || '');
        setTrackingCarrier(o.trackingCarrier || '');
        setInternalNotes(o.internalNotes || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    if (params.orderId) fetchOrder();
  }, [params.orderId]);

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const body: Record<string, unknown> = {};
      if (status !== order.status) body.status = status;
      if (trackingNumber !== (order.trackingNumber || '')) body.trackingNumber = trackingNumber;
      if (trackingCarrier !== (order.trackingCarrier || '')) body.trackingCarrier = trackingCarrier;
      if (internalNotes !== (order.internalNotes || '')) body.internalNotes = internalNotes;

      if (Object.keys(body).length === 0) {
        setSaveMessage('No changes to save.');
        setSaving(false);
        return;
      }

      const result = await apiClient.patch<{ data: OrderDetail }>(
        `/admin/orders/${order.id}`,
        body
      );
      setOrder(result.data);
      setSaveMessage('Order updated successfully.');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    if (
      !window.confirm(
        `Are you sure you want to issue a refund for order ${order.orderNumber}? This action cannot be undone.`
      )
    ) {
      return;
    }
    setRefunding(true);
    setSaveMessage(null);
    try {
      await apiClient.post(`/admin/orders/${order.id}/refund`);
      setSaveMessage('Refund issued successfully.');
      // Refresh order data
      const result = await apiClient.get<{ data: OrderDetail }>(
        `/admin/orders/${order.id}`
      );
      const o = result.data;
      setOrder(o);
      setStatus(o.status);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Failed to issue refund');
    } finally {
      setRefunding(false);
    }
  };

  const handleGenerateTags = async (itemId: string) => {
    setGeneratingItem(itemId);
    setQrError(null);
    try {
      await apiClient.post(`/admin/orders/${params.orderId}/items/${itemId}/generate-tags`);
      // Refresh order data
      const result = await apiClient.get<{ data: OrderDetail }>(
        `/admin/orders/${params.orderId}`
      );
      setOrder(result.data);
    } catch (err) {
      setQrError(err instanceof ApiError ? err.message : 'Failed to generate tags');
    } finally {
      setGeneratingItem(null);
    }
  };

  const handleDownloadQr = async (tagId: string, token: string, format: 'png' | 'svg') => {
    try {
      const response = await fetch(
        `${API_PREFIX}/admin/tags/${tagId}/qr-code?format=${format}`,
        {
          credentials: 'include',
          headers: {
            ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
          },
        }
      );
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan2call-${token}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silent fail for download errors
    }
  };

  const handleToggleTagStatus = async (tag: OrderItemTag) => {
    const newStatus = tag.status === 'DEACTIVATED' || tag.status === 'INACTIVE' ? 'ACTIVE' : 'DEACTIVATED';
    setTogglingTagId(tag.id);
    try {
      await apiClient.patch(`/admin/tags/${tag.id}`, { status: newStatus });
      // Refresh order data
      const result = await apiClient.get<{ data: OrderDetail }>(
        `/admin/orders/${params.orderId}`,
      );
      setOrder(result.data);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'Failed to update tag status');
    } finally {
      setTogglingTagId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <Alert variant="error" className="mt-6">
          {error || 'Order not found'}
        </Alert>
      </div>
    );
  }

  const isPaid = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="mt-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text font-display">
            Order Details
          </h1>
          <p className="mt-1 font-mono text-sm text-text-dim">
            {order.orderNumber}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            ORDER_STATUS_COLORS[order.status] || 'bg-surface-raised text-text-dim'
          }`}
        >
          {order.status}
        </span>
      </div>

      {/* Action Message */}
      {saveMessage && (
        <Alert variant="info" className="mt-4">
          {saveMessage}
        </Alert>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Order Info */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-semibold text-text">Order Info</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-dim">Customer</span>
              <Link
                href={`/admin/users/${order.user.id}`}
                className="font-medium text-primary hover:underline"
              >
                {order.user.firstName} {order.user.lastName}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Email</span>
              <span className="font-medium text-text">{order.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Subtotal</span>
              <span className="font-medium text-text">
                ${(order.subtotalInCents / 100).toFixed(2)} {order.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Shipping</span>
              <span className="font-medium text-text">
                ${(order.shippingInCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Tax</span>
              <span className="font-medium text-text">
                ${(order.taxInCents / 100).toFixed(2)}
              </span>
            </div>
            {order.discountInCents > 0 && (
              <div className="flex justify-between">
                <span className="text-text-dim">Discount</span>
                <span className="font-medium text-emerald-400">
                  -${(order.discountInCents / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold text-text">Total</span>
              <span className="font-bold text-primary">
                ${(order.totalInCents / 100).toFixed(2)} {order.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Date</span>
              <span className="font-medium text-text">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-semibold text-text">Payment</h2>
          {order.payment ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-dim">Payment Status</span>
                <span className="font-medium text-text">{order.payment.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Method</span>
                <span className="font-medium text-text">{order.payment.method}</span>
              </div>
              {order.payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-text-dim">Paid At</span>
                  <span className="font-medium text-text">
                    {new Date(order.payment.paidAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-dim">No payment information available.</p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-semibold text-text">Items</h2>
        {qrError && (
          <Alert variant="error" className="mt-3">
            {qrError}
          </Alert>
        )}
        {order.items.length === 0 ? (
          <p className="mt-4 text-sm text-text-dim">No items in this order.</p>
        ) : (
          <div className="mt-4">
            <div className="grid grid-cols-5 border-b border-border pb-2 text-sm font-medium text-text-dim">
              <span className="col-span-2">Product</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Total</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="border-b border-border last:border-b-0">
                <div className="grid grid-cols-5 py-2 text-sm">
                  <span className="col-span-2">
                    <p className="font-medium text-text">{item.productName}</p>
                    <p className="text-xs text-text-dim">SKU: {item.productSku}</p>
                  </span>
                  <span className="text-right text-text">{item.quantity}</span>
                  <span className="text-right text-text">
                    ${(item.unitPriceInCents / 100).toFixed(2)}
                  </span>
                  <span className="text-right font-medium text-text">
                    ${(item.totalPriceInCents / 100).toFixed(2)}
                  </span>
                </div>

                {/* Tag product QR section */}
                {item.product?.tagType && (
                  <div className="mb-3 ml-4 rounded-md border border-border bg-surface-raised p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-text">
                      <QrCode className="h-4 w-4" />
                      QR Codes
                      <span className="text-xs font-normal text-text-dim">
                        ({item.product.tagType} tag - {item.quantity * item.product.includesTagCount} total)
                      </span>
                    </div>

                    {(!item.tags || item.tags.length === 0) ? (
                      <div className="mt-3">
                        <Button
                          onClick={() => handleGenerateTags(item.id)}
                          loading={generatingItem === item.id}
                        >
                          {generatingItem === item.id ? 'Generating...' : 'Generate QR Codes'}
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {item.tags.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center justify-between rounded-md border border-border bg-bg px-3 py-2"
                          >
                            <div className="flex items-center gap-3">
                              <code className="rounded bg-bg px-2 py-0.5 font-mono text-sm text-primary">
                                {tag.token}
                              </code>
                              {tag.label && (
                                <span className="text-xs text-text-dim">{tag.label}</span>
                              )}
                              <Badge
                                variant={
                                  tag.status === 'ACTIVE'
                                    ? 'success'
                                    : tag.status === 'INACTIVE'
                                    ? 'warning'
                                    : 'neutral'
                                }
                              >
                                {tag.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {tag.status === 'DEACTIVATED' || tag.status === 'INACTIVE' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  loading={togglingTagId === tag.id}
                                  onClick={() => handleToggleTagStatus(tag)}
                                  icon={<Power className="h-3.5 w-3.5" />}
                                >
                                  Activate
                                </Button>
                              ) : tag.status === 'ACTIVE' ? (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  loading={togglingTagId === tag.id}
                                  onClick={() => handleToggleTagStatus(tag)}
                                  icon={<PowerOff className="h-3.5 w-3.5" />}
                                >
                                  Deactivate
                                </Button>
                              ) : null}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleDownloadQr(tag.id, tag.token, 'png')}
                              >
                                PNG
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleDownloadQr(tag.id, tag.token, 'svg')}
                              >
                                SVG
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Order */}
      <div className="mt-6 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-semibold text-text">Update Order</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-text-muted">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full max-w-xs rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {status === 'DELIVERED' && status !== order.status && (
              <p className="mt-2 text-sm bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-md px-3 py-2">
                Tags will be automatically activated when order is delivered.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="trackingNumber" className="block text-sm font-medium text-text-muted">
              Tracking Number
            </label>
            <input
              type="text"
              id="trackingNumber"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g., AU123456789"
              className="mt-1 block w-full max-w-md rounded-md border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="trackingCarrier" className="block text-sm font-medium text-text-muted">
              Tracking Carrier
            </label>
            <input
              type="text"
              id="trackingCarrier"
              value={trackingCarrier}
              onChange={(e) => setTrackingCarrier(e.target.value)}
              placeholder="e.g., Australia Post, DHL"
              className="mt-1 block w-full max-w-md rounded-md border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="internalNotes" className="block text-sm font-medium text-text-muted">
              Internal Notes
            </label>
            <textarea
              id="internalNotes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this order..."
              className="mt-1 block w-full max-w-md rounded-md border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              loading={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            {isPaid && (
              <Button
                variant="danger"
                onClick={handleRefund}
                loading={refunding}
              >
                {refunding ? 'Processing Refund...' : 'Issue Refund'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
