'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Power, PowerOff } from 'lucide-react';

interface AdminTag {
  id: string;
  token: string;
  type: string;
  status: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

const TAG_STATUS_COLORS: Record<string, string> = {
  INACTIVE: 'bg-surface-raised text-text-dim',
  ACTIVE: 'bg-emerald-500/20 text-emerald-400',
  LOST: 'bg-red-500/20 text-red-400',
  FOUND: 'bg-blue-500/20 text-blue-400',
  DEACTIVATED: 'bg-surface-raised text-text-dim',
};

const TAG_TYPE_LABELS: Record<string, string> = {
  PET_COLLAR: 'Pet Collar',
  CAR_STICKER: 'Car Sticker',
  LUGGAGE_TAG: 'Luggage Tag',
  KEYCHAIN: 'Keychain',
  MEDICAL_BAND: 'Medical Band',
  GENERIC: 'Generic',
};

const TAG_STATUSES = ['INACTIVE', 'ACTIVE', 'LOST', 'FOUND', 'DEACTIVATED'];
const TAG_TYPES = ['PET_COLLAR', 'CAR_STICKER', 'LUGGAGE_TAG', 'KEYCHAIN', 'MEDICAL_BAND', 'GENERIC'];

export default function AdminTagsPage() {
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTags = useCallback(async (page: number, status: string, type: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status) params.set('status', status);
      if (type) params.set('type', type);

      const result = await apiClient.get<{ data: AdminTag[]; meta: PaginationMeta }>(
        `/admin/tags?${params.toString()}`
      );
      setTags(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags(1, statusFilter, typeFilter);
  }, [fetchTags, statusFilter, typeFilter]);

  const totalPages = Math.ceil(meta.total / meta.pageSize);

  const handleToggleStatus = async (tag: AdminTag) => {
    const newStatus = tag.status === 'DEACTIVATED' || tag.status === 'INACTIVE' ? 'ACTIVE' : 'DEACTIVATED';
    setTogglingId(tag.id);
    try {
      await apiClient.patch(`/admin/tags/${tag.id}`, { status: newStatus });
      await fetchTags(meta.page, statusFilter, typeFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display">Tags</h1>
          <p className="mt-2 text-text-muted">Manage QR identity tags across the platform.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/tags/generate">
            <Button>Generate Tags</Button>
          </Link>
          <Link href="/admin/tags/import">
            <Button variant="secondary">Import Tags</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All statuses</option>
          {TAG_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All types</option>
          {TAG_TYPES.map((t) => (
            <option key={t} value={t}>
              {TAG_TYPE_LABELS[t] || t}
            </option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="error" className="mt-6">
          {error}
          <button
            onClick={() => fetchTags(meta.page, statusFilter, typeFilter)}
            className="ml-2 underline hover:opacity-80"
          >
            Retry
          </button>
        </Alert>
      )}

      {/* Tags Table */}
      {!error && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-6 py-3">
            <div className="grid grid-cols-6 text-sm font-medium text-text-dim">
              <span>Token</span>
              <span>Type</span>
              <span>Status</span>
              <span>Owner</span>
              <span>Created</span>
              <span className="text-right">Actions</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : tags.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-dim">No tags found.</div>
          ) : (
            <div>
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="grid grid-cols-6 border-b border-border px-6 py-3 text-sm last:border-b-0 hover:bg-surface-raised items-center"
                >
                  <span className="font-mono font-medium text-primary">{tag.token}</span>
                  <span className="text-text-muted">
                    {TAG_TYPE_LABELS[tag.type] || tag.type}
                  </span>
                  <span>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        TAG_STATUS_COLORS[tag.status] || 'bg-surface-raised text-text-dim'
                      }`}
                    >
                      {tag.status}
                    </span>
                  </span>
                  <span className="truncate text-text-muted">
                    {tag.owner
                      ? `${tag.owner.firstName} ${tag.owner.lastName}`
                      : 'Unassigned'}
                  </span>
                  <span className="text-text-muted">
                    {new Date(tag.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-right">
                    {(tag.status === 'DEACTIVATED' || tag.status === 'INACTIVE') ? (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={togglingId === tag.id}
                        onClick={() => handleToggleStatus(tag)}
                        icon={<Power className="h-3.5 w-3.5" />}
                      >
                        Activate
                      </Button>
                    ) : tag.status === 'ACTIVE' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={togglingId === tag.id}
                        onClick={() => handleToggleStatus(tag)}
                        icon={<PowerOff className="h-3.5 w-3.5" />}
                      >
                        Deactivate
                      </Button>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-text-dim">
                Page {meta.page} of {totalPages} ({meta.total} total tags)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => fetchTags(meta.page - 1, statusFilter, typeFilter)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page >= totalPages}
                  onClick={() => fetchTags(meta.page + 1, statusFilter, typeFilter)}
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
