'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiClient, ApiError } from '@/lib/api-client';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  giftExpiresAt?: string | null;
  isLifetime?: boolean;
  isGiftActive?: boolean;
}

function formatDate(dateStr: string): string { return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }); }

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 16 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
});

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [noSubscription, setNoSubscription] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiClient.get<{ data: Subscription }>('/subscriptions/me');
        if (!cancelled) setSubscription(result.data);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) { if (!cancelled) setNoSubscription(true); }
        else { if (!cancelled) setFetchError('Failed to load billing information.'); }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleBillingPortal = useCallback(async () => {
    setPortalLoading(true); setActionError(null);
    try {
      const result = await apiClient.post<{ data: { portalUrl: string } }>('/subscriptions/billing-portal');
      window.location.href = result.data.portalUrl;
    } catch (err) { setActionError(err instanceof ApiError ? err.message : 'Failed to open billing portal.'); setPortalLoading(false); }
  }, []);

  return (
    <div>
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"><ArrowLeft className="h-4 w-4" />Back to Settings</Link>
      </motion.div>

      <div className="mt-6"><PageHeader title="Billing" description="Manage payment methods and view your billing details." /></div>

      {loading && <div className="mt-8 flex items-center gap-2 text-sm text-text-muted"><Spinner size="sm" />Loading billing information...</div>}
      {fetchError && <Alert variant="error" className="mt-8">{fetchError}</Alert>}

      {!loading && noSubscription && (
        <div className="mt-8 space-y-6">
          <motion.div {...cardAnim(0)}>
            <Card><CardContent className="py-6">
              <h2 className="font-semibold text-text">Subscription Status</h2>
              <p className="mt-2 text-sm text-text-muted">You do not have an active subscription.</p>
              <Link href="/subscription"><Button className="mt-4">View Plans</Button></Link>
            </CardContent></Card>
          </motion.div>
          <motion.div {...cardAnim(0.08)}>
            <Card><CardContent className="py-6">
              <h2 className="font-semibold text-text">Payment History</h2>
              <p className="mt-2 text-sm text-text-muted">No payment history available.</p>
            </CardContent></Card>
          </motion.div>
        </div>
      )}

      {!loading && subscription && (
        <div className="mt-8 space-y-6">
          <motion.div {...cardAnim(0)}>
            <Card><CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-text">Subscription Status</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={subscription.cancelAtPeriodEnd ? 'warning' : subscription.status === 'active' ? 'success' : 'neutral'}>
                      {subscription.cancelAtPeriodEnd ? 'Cancelling' : subscription.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-text-muted">Scan2Call - $9.99/mo AUD</span>
                    {subscription.isLifetime && (
                      <Badge variant="success">Lifetime Gift</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Current period</span>
                  <span className="font-medium text-text">
                    {subscription.currentPeriodStart && subscription.currentPeriodEnd
                      ? `${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">{subscription.cancelAtPeriodEnd ? 'Access until' : 'Next payment'}</span>
                  <span className="font-medium text-text">
                    {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : '—'}
                  </span>
                </div>
                {subscription.giftExpiresAt && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Gift access</span>
                    <span className="font-medium text-text">{formatDate(subscription.giftExpiresAt)}</span>
                  </div>
                )}
                {subscription.isLifetime && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Gift access</span>
                    <span className="font-medium text-text">Lifetime</span>
                  </div>
                )}
              </div>
              {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
                <Alert variant="warning" className="mt-4">
                  Your subscription is cancelled and will end on <span className="font-semibold">{formatDate(subscription.currentPeriodEnd)}</span>. Visit the <Link href="/subscription" className="font-medium underline hover:opacity-80">subscription page</Link> to resume.
                </Alert>
              )}
            </CardContent></Card>
          </motion.div>

          <motion.div {...cardAnim(0.08)}>
            <Card><CardContent className="py-6">
              <h2 className="font-semibold text-text">Payment Method &amp; Invoices</h2>
              <p className="mt-2 text-sm text-text-muted">Manage your payment method, view invoices, and download receipts through the Stripe billing portal.</p>
              {actionError && <p className="mt-3 text-sm text-error">{actionError}</p>}
              <Button onClick={handleBillingPortal} loading={portalLoading} icon={!portalLoading ? <ExternalLink className="h-4 w-4" /> : undefined} className="mt-4">{portalLoading ? 'Opening...' : 'Manage Billing'}</Button>
            </CardContent></Card>
          </motion.div>

          <motion.div {...cardAnim(0.12)}>
            <Card><CardContent className="py-6">
              <h2 className="font-semibold text-text">Subscription Management</h2>
              <p className="mt-2 text-sm text-text-muted">Cancel, resume, or change your subscription from the subscription page.</p>
              <Link href="/subscription" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Go to Subscription &rarr;</Link>
            </CardContent></Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
