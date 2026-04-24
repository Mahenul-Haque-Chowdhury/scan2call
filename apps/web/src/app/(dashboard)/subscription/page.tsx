'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { Sparkles, Check, Crown, CreditCard } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getStatusBadge(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) return <Badge variant="warning">Cancelling</Badge>;
  const variants: Record<string, 'success' | 'error' | 'info' | 'neutral'> = { active: 'success', past_due: 'error', trialing: 'info', unpaid: 'error' };
  return <Badge variant={variants[status] ?? 'neutral'}>{status.replace('_', ' ')}</Badge>;
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const FEATURES = [
  'Unlimited tags and scans',
  'Anonymous voice call relay',
  'SMS and WhatsApp messaging',
  'Location sharing on scan',
  'Access to the Scan2Call store',
  'Priority email support',
];

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiClient.get<{ data: Subscription }>('/subscriptions/me');
        if (!cancelled) setSubscription(result.data);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          if (!cancelled) setSubscription(null);
        } else {
          if (!cancelled) setFetchError('Failed to load subscription details.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubscribe = useCallback(async () => {
    setSubscribing(true); setActionError(null);
    try {
      const result = await apiClient.post<{ data: { sessionUrl: string } }>('/subscriptions');
      window.location.href = result.data.sessionUrl;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to start checkout.');
      setSubscribing(false);
    }
  }, []);

  const handleCancel = useCallback(async () => {
    setCancelling(true); setActionError(null);
    try {
      await apiClient.post('/subscriptions/me/cancel');
      setSubscription((prev) => (prev ? { ...prev, cancelAtPeriodEnd: true } : null));
      setShowCancelConfirm(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to cancel subscription.');
    } finally { setCancelling(false); }
  }, []);

  const handleResume = useCallback(async () => {
    setResuming(true); setActionError(null);
    try {
      await apiClient.post('/subscriptions/me/resume');
      setSubscription((prev) => (prev ? { ...prev, cancelAtPeriodEnd: false } : null));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to resume subscription.');
    } finally { setResuming(false); }
  }, []);

  const handleBillingPortal = useCallback(async () => {
    setPortalLoading(true); setActionError(null);
    try {
      const result = await apiClient.post<{ data: { portalUrl: string } }>('/subscriptions/billing-portal');
      window.location.href = result.data.portalUrl;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to open billing portal.');
      setPortalLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Subscription" description="Manage your Scan2Call plan and billing." />
        <div className="mt-8 flex items-center gap-2 text-sm text-text-muted"><Spinner size="sm" />Loading subscription...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div>
        <PageHeader title="Subscription" description="Manage your Scan2Call plan and billing." />
        <Alert variant="error" className="mt-8">{fetchError}</Alert>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div>
        <PageHeader title="Subscription" description="Manage your Scan2Call plan and billing." />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="glow-primary mt-8 rounded-2xl border border-border bg-surface p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-muted"
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-4 text-xl font-bold text-text"
          >
            Unlock the full Scan2Call experience
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-2 max-w-sm text-sm text-text-muted"
          >
            Get unlimited tags, unlimited scans, WhatsApp messaging, location sharing, and access to the Scan2Call store.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 20 }}
            className="mt-6"
          >
            <p className="text-3xl font-bold text-primary">$9.99<span className="text-base font-normal text-text-dim">/mo AUD</span></p>
          </motion.div>

          <motion.ul variants={stagger} initial="hidden" animate="visible" className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm text-text-muted">
            {FEATURES.map((feature, i) => (
              <motion.li key={feature} variants={fadeUp} custom={i} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {feature}
              </motion.li>
            ))}
          </motion.ul>

          {actionError && <p className="mt-4 text-sm text-error">{actionError}</p>}

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Button onClick={handleSubscribe} loading={subscribing} size="lg" className="mt-6 w-full max-w-xs">
              {subscribing ? 'Redirecting to checkout...' : 'Subscribe for $9.99/mo'}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const isCancelled = subscription.cancelAtPeriodEnd;

  return (
    <div>
      <PageHeader title="Subscription" description="Manage your Scan2Call plan and billing." />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="mt-8 rounded-2xl border border-border bg-surface p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-text">Scan2Call Subscription</h2>
              {getStatusBadge(subscription.status, isCancelled)}
            </div>
            <p className="mt-1 text-2xl font-bold text-primary">$9.99<span className="text-sm font-normal text-text-dim">/mo AUD</span></p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Current period started</span>
            <span className="font-medium text-text">{formatDate(subscription.currentPeriodStart)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">{isCancelled ? 'Access until' : 'Next billing date'}</span>
            <span className="font-medium text-text">{formatDate(subscription.currentPeriodEnd)}</span>
          </div>
        </div>

        <AnimatePresence>
          {isCancelled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Alert variant="warning" className="mt-4">
                Your subscription has been cancelled and will end on <span className="font-semibold">{formatDate(subscription.currentPeriodEnd)}</span>. You can resume at any time before then.
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {actionError && <p className="mt-4 text-sm text-error">{actionError}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          {isCancelled ? (
            <Button onClick={handleResume} loading={resuming}>{resuming ? 'Resuming...' : 'Resume Subscription'}</Button>
          ) : (
            <>
              {!showCancelConfirm ? (
                <Button variant="danger" onClick={() => setShowCancelConfirm(true)}>Cancel Subscription</Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full rounded-xl border border-error/20 bg-error-muted p-4"
                >
                  <p className="text-sm font-medium text-error">Are you sure you want to cancel? You will retain access until {formatDate(subscription.currentPeriodEnd)}.</p>
                  <div className="mt-3 flex gap-3">
                    <Button variant="danger" onClick={handleCancel} loading={cancelling}>{cancelling ? 'Cancelling...' : 'Confirm Cancellation'}</Button>
                    <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>Keep Subscription</Button>
                  </div>
                </motion.div>
              )}
            </>
          )}
          <Button variant="secondary" onClick={handleBillingPortal} loading={portalLoading} icon={<CreditCard className="h-4 w-4" />}>
            {portalLoading ? 'Opening...' : 'Manage Billing'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
