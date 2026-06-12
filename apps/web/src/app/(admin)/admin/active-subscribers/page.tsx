'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Search } from 'lucide-react';

interface ActiveSubscriber {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuspended: boolean;
  subscriptionId: string;
  status: string;
  source: 'STRIPE' | 'GIFT';
  plan: string;
  currentPeriodEnd: string | null;
  giftExpiresAt: string | null;
  isLifetime: boolean;
  cancelAtPeriodEnd: boolean;
  accessType: 'Stripe' | 'Gift' | 'Lifetime';
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400',
  PAST_DUE: 'bg-amber-500/20 text-amber-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
  UNPAID: 'bg-red-500/20 text-red-400',
  INCOMPLETE: 'bg-surface-raised text-text-dim',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function formatAccessDate(subscriber: ActiveSubscriber) {
  if (subscriber.isLifetime) return 'Lifetime';
  if (subscriber.accessType === 'Gift') return formatDate(subscriber.giftExpiresAt);
  return formatDate(subscriber.currentPeriodEnd);
}

export default function AdminActiveSubscribersPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<ActiveSubscriber[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscribers = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (searchTerm) params.set('search', searchTerm);

      const result = await apiClient.get<{ data: ActiveSubscriber[]; meta: PaginationMeta }>(
        `/admin/subscribers/active?${params.toString()}`,
      );
      setSubscribers(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active subscribers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers(1, search);
    // Search is intentionally submit-driven to match the users page.
  }, [fetchSubscribers]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    fetchSubscribers(1, search);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const totalPages = Math.ceil(meta.total / meta.pageSize);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-display">Active Subscribers</h1>
      <p className="mt-2 text-text-muted">
        View users with active Stripe, gift, or lifetime subscription access.
      </p>

      <div className="mt-8 flex gap-4">
        <input
          type="text"
          placeholder="Search subscribers by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-md border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button onClick={handleSearch} icon={<Search className="h-4 w-4" />}>
          Search
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mt-6">
          {error}
          <button
            onClick={() => fetchSubscribers(meta.page, search)}
            className="ml-2 underline hover:opacity-80"
          >
            Retry
          </button>
        </Alert>
      )}

      {!error && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-6 py-3">
            <div className="grid grid-cols-8 text-sm font-medium text-text-dim">
              <span>Name</span>
              <span className="col-span-2">Email</span>
              <span>Source</span>
              <span>Plan</span>
              <span>Status</span>
              <span>Renews/Expires</span>
              <span className="text-right">Actions</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-dim">No active subscribers found.</div>
          ) : (
            <div>
              {subscribers.map((subscriber) => (
                <div
                  key={subscriber.subscriptionId}
                  className="grid grid-cols-8 items-center border-b border-border px-6 py-3 text-sm transition-colors last:border-b-0 hover:bg-surface-raised"
                >
                  <span className="font-medium text-text">
                    {subscriber.firstName} {subscriber.lastName}
                    {subscriber.isSuspended && (
                      <span className="mt-1 block text-xs text-error">Suspended</span>
                    )}
                  </span>
                  <span className="col-span-2 truncate text-text-muted">{subscriber.email}</span>
                  <span className="text-text-muted">{subscriber.accessType}</span>
                  <span className="text-text-muted">{subscriber.plan || '—'}</span>
                  <span>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[subscriber.status] || 'bg-surface-raised text-text-dim'}`}>
                      {subscriber.status}
                    </span>
                  </span>
                  <span className="text-text-muted">
                    {formatAccessDate(subscriber)}
                    {subscriber.cancelAtPeriodEnd && (
                      <span className="mt-1 block text-xs text-amber-400">Cancels at period end</span>
                    )}
                  </span>
                  <span className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/admin/users/${subscriber.userId}`)}
                    >
                      View User
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-text-dim">
                Page {meta.page} of {totalPages} ({meta.total} total subscribers)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => fetchSubscribers(meta.page - 1, search)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page >= totalPages}
                  onClick={() => fetchSubscribers(meta.page + 1, search)}
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
