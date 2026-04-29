'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Search, Inbox } from 'lucide-react';

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'NEW' | 'REPLIED' | 'ARCHIVED';
  createdAt: string;
  repliedAt: string | null;
  _count?: { replies: number };
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

const STATUS_BADGE: Record<ContactMessageRow['status'], string> = {
  NEW: 'bg-blue-500/20 text-blue-400',
  REPLIED: 'bg-emerald-500/20 text-emerald-400',
  ARCHIVED: 'bg-surface-raised text-text-dim',
};

export default function AdminContactMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async (page: number, searchTerm: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (searchTerm) params.set('search', searchTerm);
      if (status) params.set('status', status);

      const result = await apiClient.get<{ data: ContactMessageRow[]; meta: PaginationMeta }>(
        `/admin/contact-messages?${params.toString()}`
      );
      setMessages(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages(1, search, statusFilter);
    // Search is submit-driven.
  }, [fetchMessages, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    fetchMessages(1, search, statusFilter);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const totalPages = Math.ceil(meta.total / meta.pageSize);

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display text-text">Contact Inbox</h1>
          <p className="mt-2 text-text-muted">Read and reply to contact form submissions.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-text-dim">
          <Inbox className="h-5 w-5" />
          <span className="text-sm">{meta.total} total messages</span>
        </div>
      </div>

      {/* Search / Filters */}
      <div className="mt-8 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-55 rounded-md border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button onClick={handleSearch} icon={<Search className="h-4 w-4" />}>
          Search
        </Button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="REPLIED">Replied</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="error" className="mt-6">
          {error}
          <button
            onClick={() => fetchMessages(meta.page, search, statusFilter)}
            className="ml-2 underline hover:opacity-80"
          >
            Retry
          </button>
        </Alert>
      )}

      {/* Table */}
      {!error && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-6 py-3">
            <div className="grid grid-cols-6 text-sm font-medium text-text-dim">
              <span className="col-span-2">Sender</span>
              <span>Email</span>
              <span>Status</span>
              <span>Received</span>
              <span className="text-right">Replies</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-dim">No messages found.</div>
          ) : (
            <div>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => router.push(`/admin/contact-messages/${msg.id}`)}
                  className="grid cursor-pointer grid-cols-6 gap-2 border-b border-border px-6 py-4 text-sm transition-colors last:border-b-0 hover:bg-surface-raised"
                >
                  <div className="col-span-2">
                    <div className="font-medium text-text">{msg.name}</div>
                    <div className="text-xs text-text-dim line-clamp-1">{msg.message}</div>
                  </div>
                  <div className="truncate text-text-muted">{msg.email}</div>
                  <div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[msg.status] || 'bg-surface-raised text-text-dim'
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <div className="text-text-muted">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-right text-text-muted">{msg._count?.replies ?? 0}</div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-text-dim">
                Page {meta.page} of {totalPages} ({meta.total} total messages)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => fetchMessages(meta.page - 1, search, statusFilter)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page >= totalPages}
                  onClick={() => fetchMessages(meta.page + 1, search, statusFilter)}
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
