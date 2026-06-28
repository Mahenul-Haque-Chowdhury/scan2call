'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { fetchWithAuth } from '@/lib/auth';
import { getApiOrigin } from '@/lib/api-origin';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import {
  Power, PowerOff, Trash2, Maximize2, Search, ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw,
} from 'lucide-react';

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
  expiresAt: string | null;
  autoRenew: boolean;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

interface TagBatch {
  id: string;
  name: string;
  quantity: number;
  tagType: string;
  createdAt: string;
  _count: { tags: number };
}

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'error' | 'neutral' | 'info' | 'warning'> = {
  ACTIVE: 'success',
  LOST: 'error',
  INACTIVE: 'neutral',
  FOUND: 'info',
  DEACTIVATED: 'neutral',
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
const PAGE_SIZES = [20, 50, 100];

const ROW_GRID =
  'grid-cols-[0.3fr_1fr_0.85fr_0.8fr_1fr_0.6fr_1.3fr_0.8fr_0.5fr_1.5fr]';

const DAY_MS = 1000 * 60 * 60 * 24;

function formatExpiry(
  expiresAt: string | null,
): { label: string; variant: 'success' | 'error' | 'warning' | 'neutral' } | null {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return null;

  const dateStr = expiry.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / DAY_MS);

  if (daysLeft < 0) return { label: 'Expired', variant: 'error' };
  if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, variant: 'warning' };
  return { label: dateStr, variant: 'neutral' };
}

// --- Lazy-loaded QR thumbnail: fetches only when the row scrolls into view ---
function TagQrThumb({
  tagId,
  token,
  apiOrigin,
  onOpen,
}: {
  tagId: string;
  token: string;
  apiOrigin: string;
  onOpen: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          (async () => {
            try {
              const res = await fetchWithAuth(
                `${apiOrigin}/api/v1/admin/tags/${tagId}/qr-code?format=png&size=140`,
                { method: 'GET' },
              );
              if (!res.ok) return;
              const blob = await res.blob();
              if (cancelled) return;
              objectUrl = URL.createObjectURL(blob);
              setUrl(objectUrl);
            } catch {
              // ignore preview load errors
            }
          })();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [tagId, apiOrigin]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg"
      aria-label={`Preview QR for ${token}`}
    >
      {url ? (
        <>
          <Image src={url} alt={`QR preview for ${token}`} width={48} height={48} className="h-10 w-10 object-cover" unoptimized />
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-4 w-4 text-white" />
          </span>
        </>
      ) : (
        <Spinner size="sm" />
      )}
    </button>
  );
}

function SortHeader({
  field,
  label,
  sort,
  order,
  onSort,
}: {
  field: string;
  label: string;
  sort: string;
  order: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const active = sort === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-left transition-colors hover:text-text ${active ? 'text-text' : ''}`}
    >
      {label}
      {active ? (
        order === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0 });

  // Controls
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [autoRenewFilter, setAutoRenewFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewTag, setPreviewTag] = useState<AdminTag | null>(null);
  const [largePreviewUrl, setLargePreviewUrl] = useState<string | null>(null);
  const [largePreviewLoading, setLargePreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminTag | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [batches, setBatches] = useState<TagBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [deleteBatchTarget, setDeleteBatchTarget] = useState<TagBatch | null>(null);
  const [deleteBatchConfirmA, setDeleteBatchConfirmA] = useState(false);
  const [deleteBatchConfirmB, setDeleteBatchConfirmB] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const apiOrigin = useMemo(() => getApiOrigin(), []);

  // Debounce the search box and reset to page 1 when it changes.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (assignedFilter) params.set('assigned', assignedFilter);
      if (autoRenewFilter) params.set('autoRenew', autoRenewFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('sort', sort);
      params.set('order', order);

      const result = await apiClient.get<{ data: AdminTag[]; meta: PaginationMeta }>(
        `/admin/tags?${params.toString()}`,
      );
      setTags(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, typeFilter, assignedFilter, autoRenewFilter, debouncedSearch, sort, order]);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    setSelectedTagIds((current) => current.filter((id) => tags.some((tag) => tag.id === id)));
  }, [tags]);

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const response = await apiClient.get<{ data: TagBatch[] }>('/admin/tags/batches?page=1&pageSize=10');
      setBatches(response.data);
    } catch {
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const totalPages = Math.ceil(meta.total / meta.pageSize) || 1;

  // Reset to page 1 whenever a non-search filter/sort/pageSize changes.
  function resetPage() {
    setPage(1);
  }

  function toggleSort(field: string) {
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder('desc');
    }
    resetPage();
  }

  const handleToggleStatus = async (tag: AdminTag) => {
    const newStatus = tag.status === 'DEACTIVATED' || tag.status === 'INACTIVE' ? 'ACTIVE' : 'DEACTIVATED';
    setTogglingId(tag.id);
    try {
      await apiClient.patch(`/admin/tags/${tag.id}`, { status: newStatus });
      await fetchTags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRegenerateQr = async (tag: AdminTag) => {
    setRegeneratingId(tag.id);
    setError(null);
    try {
      await apiClient.post(`/admin/tags/${tag.id}/qr-assets/regenerate`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate QR assets');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDeleteTag = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setError(null);
    try {
      await apiClient.delete(`/admin/tags/${deleteTarget.id}`);
      await fetchTags();
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTagIds.length === 0) return;
    setDeletingSelected(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        selectedTagIds.map((id) => apiClient.delete(`/admin/tags/${id}`)),
      );
      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length > 0) {
        setError(`Failed to delete ${failures.length} tag(s).`);
      }
      setSelectedTagIds([]);
      await fetchTags();
      setDeleteSelectedOpen(false);
    } finally {
      setDeletingSelected(false);
    }
  };

  const openPreview = async (tag: AdminTag) => {
    setPreviewTag(tag);
    setLargePreviewLoading(true);
    if (largePreviewUrl) URL.revokeObjectURL(largePreviewUrl);
    setLargePreviewUrl(null);
    try {
      const res = await fetchWithAuth(
        `${apiOrigin}/api/v1/admin/tags/${tag.id}/qr-code?format=png&size=600`,
        { method: 'GET' },
      );
      if (!res.ok) return;
      const blob = await res.blob();
      setLargePreviewUrl(URL.createObjectURL(blob));
    } catch {
      // ignore preview load errors
    } finally {
      setLargePreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewTag(null);
    if (largePreviewUrl) URL.revokeObjectURL(largePreviewUrl);
    setLargePreviewUrl(null);
  };

  const toggleSelectAll = () => {
    if (selectedTagIds.length === tags.length) {
      setSelectedTagIds([]);
      return;
    }
    setSelectedTagIds(tags.map((tag) => tag.id));
  };

  const toggleSelectTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  };

  const downloadZip = async (url: string, body?: Record<string, unknown>, filename?: string) => {
    setDownloading(true);
    try {
      const res = await fetchWithAuth(`${apiOrigin}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename || 'scan2call-qr-assets.zip';
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download QR assets');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedTagIds.length === 0) return;
    await downloadZip('/api/v1/admin/tags/qr-assets/download', { tagIds: selectedTagIds });
  };

  const handleDownloadBatch = async (batch: TagBatch) => {
    await downloadZip(
      `/api/v1/admin/tags/batches/${batch.id}/qr-assets/download`,
      undefined,
      `scan2call-${batch.name.replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase() || batch.id}.zip`,
    );
  };

  const handleDeleteBatch = async () => {
    if (!deleteBatchTarget) return;
    if (!deleteBatchConfirmA || !deleteBatchConfirmB) return;
    setDeletingBatch(true);
    setError(null);
    try {
      await apiClient.delete(`/admin/tags/batches/${deleteBatchTarget.id}`);
      await loadBatches();
      setDeleteBatchTarget(null);
      setDeleteBatchConfirmA(false);
      setDeleteBatchConfirmB(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
    } finally {
      setDeletingBatch(false);
    }
  };

  const selectClass =
    'h-9 rounded-md border border-border bg-surface px-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Manage QR identity tags across the platform."
        actions={
          <>
            <Link href="/office/tags/generate">
              <Button>Generate Tags</Button>
            </Link>
            <Link href="/office/tags/import">
              <Button variant="secondary">Import Tags</Button>
            </Link>
          </>
        }
      />

      {/* Controls */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search token, label, or owner email..."
            className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }} className={selectClass}>
          <option value="">All statuses</option>
          {TAG_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); resetPage(); }} className={selectClass}>
          <option value="">All types</option>
          {TAG_TYPES.map((t) => (
            <option key={t} value={t}>{TAG_TYPE_LABELS[t] || t}</option>
          ))}
        </select>

        <select value={assignedFilter} onChange={(e) => { setAssignedFilter(e.target.value); resetPage(); }} className={selectClass}>
          <option value="">All owners</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>

        <select value={autoRenewFilter} onChange={(e) => { setAutoRenewFilter(e.target.value); resetPage(); }} className={selectClass}>
          <option value="">Auto-renew: any</option>
          <option value="true">Auto-renew on</option>
          <option value="false">Auto-renew off</option>
        </select>

        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); resetPage(); }}
          className={selectClass}
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>

      {error && (
        <Alert variant="error" className="mt-6">
          {error}
          <button onClick={() => void fetchTags()} className="ml-2 underline hover:opacity-80">
            Retry
          </button>
        </Alert>
      )}

      {!error && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          {/* Bulk action bar (only when something is selected) */}
          {selectedTagIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface-raised/50 px-6 py-3">
              <span className="text-sm font-medium text-text">{selectedTagIds.length} selected</span>
              <Button variant="secondary" size="sm" disabled={downloading} onClick={handleDownloadSelected}>
                {downloading ? 'Preparing ZIP...' : 'Download Selected'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={deletingSelected}
                onClick={() => setDeleteSelectedOpen(true)}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Delete Selected
              </Button>
              <span className="text-xs text-text-dim">ZIP includes PNG + SVG per tag.</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="min-w-295">
              {/* Header */}
              <div className={`grid ${ROW_GRID} border-b border-border px-6 py-3 text-sm font-medium text-text-dim`}>
                <span>
                  <input
                    type="checkbox"
                    checked={tags.length > 0 && selectedTagIds.length === tags.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
                    aria-label="Select all tags"
                  />
                </span>
                <SortHeader field="token" label="Token" sort={sort} order={order} onSort={toggleSort} />
                <SortHeader field="type" label="Type" sort={sort} order={order} onSort={toggleSort} />
                <SortHeader field="status" label="Status" sort={sort} order={order} onSort={toggleSort} />
                <SortHeader field="expiresAt" label="Expiry" sort={sort} order={order} onSort={toggleSort} />
                <span>Auto-renew</span>
                <span>Owner</span>
                <SortHeader field="createdAt" label="Created" sort={sort} order={order} onSort={toggleSort} />
                <span className="text-center">QR</span>
                <span className="text-right">Actions</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="md" />
                </div>
              ) : tags.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-dim">No tags found.</div>
              ) : (
                <div>
                  {tags.map((tag) => {
                    const expiry = formatExpiry(tag.expiresAt);
                    return (
                      <div
                        key={tag.id}
                        className={`grid ${ROW_GRID} items-center border-b border-border px-6 py-3 text-sm last:border-b-0 hover:bg-surface-raised`}
                      >
                        <span>
                          <input
                            type="checkbox"
                            checked={selectedTagIds.includes(tag.id)}
                            onChange={() => toggleSelectTag(tag.id)}
                            className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
                            aria-label={`Select tag ${tag.token}`}
                          />
                        </span>
                        <span className="font-mono font-medium text-primary">{tag.token}</span>
                        <span className="text-text-muted">{TAG_TYPE_LABELS[tag.type] || tag.type}</span>
                        <span>
                          <Badge variant={STATUS_BADGE_VARIANT[tag.status] || 'neutral'}>{tag.status}</Badge>
                        </span>
                        <span>
                          {expiry ? (
                            <Badge variant={expiry.variant}>{expiry.label}</Badge>
                          ) : (
                            <span className="text-text-dim">-</span>
                          )}
                        </span>
                        <span>
                          {tag.autoRenew ? (
                            <Badge variant="primary">
                              <RefreshCw className="mr-1 h-3 w-3" />
                              On
                            </Badge>
                          ) : (
                            <span className="text-text-dim">Off</span>
                          )}
                        </span>
                        <span className="min-w-0">
                          {tag.owner ? (
                            <Link href={`/office/users/${tag.owner.id}`} className="block truncate hover:text-primary">
                              <span className="block truncate text-text">
                                {tag.owner.firstName} {tag.owner.lastName}
                              </span>
                              <span className="block truncate text-xs text-text-dim">{tag.owner.email}</span>
                            </Link>
                          ) : (
                            <span className="text-text-dim">Unassigned</span>
                          )}
                        </span>
                        <span className="text-text-muted">{new Date(tag.createdAt).toLocaleDateString()}</span>
                        <span className="flex justify-center">
                          <TagQrThumb tagId={tag.id} token={tag.token} apiOrigin={apiOrigin} onOpen={() => void openPreview(tag)} />
                        </span>
                        <span className="flex justify-end gap-2">
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
                          <Button variant="ghost" size="sm" onClick={() => handleRegenerateQr(tag)} loading={regeneratingId === tag.id}>
                            Regenerate QR
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(tag)}
                            loading={deletingId === tag.id}
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                          >
                            Delete
                          </Button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {!loading && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-text-dim">
                Page {meta.page} of {totalPages} ({meta.total} total tags)
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button variant="secondary" size="sm" disabled={meta.page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {previewTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text">QR Preview</h3>
                <p className="text-xs text-text-dim">{previewTag.token}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={closePreview}>
                Close
              </Button>
            </div>
            <div className="mt-5 flex items-center justify-center rounded-xl border border-border bg-white p-6">
              {largePreviewLoading ? (
                <span className="text-sm text-text-dim">Loading QR...</span>
              ) : largePreviewUrl ? (
                <Image
                  src={largePreviewUrl}
                  alt={`QR preview for ${previewTag.token}`}
                  width={420}
                  height={420}
                  className="h-auto w-full max-w-sm"
                  unoptimized
                />
              ) : (
                <span className="text-sm text-text-dim">Preview unavailable.</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text">Generated Tag Batches</h2>
          <p className="mt-1 text-sm text-text-dim">Download full QR sets for production runs.</p>
        </div>
        {batchesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : batches.length === 0 ? (
          <div className="p-6 text-sm text-text-dim">No batches yet.</div>
        ) : (
          <div>
            <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.9fr_1fr] px-6 py-3 text-sm font-medium text-text-dim">
              <span>Batch</span>
              <span>Type</span>
              <span>Qty</span>
              <span>Created</span>
              <span className="text-right">Actions</span>
            </div>
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.9fr_1fr] items-center border-t border-border px-6 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-text">{batch.name}</p>
                  <p className="text-xs text-text-dim">{batch._count.tags} tags</p>
                </div>
                <span className="text-text-muted">{TAG_TYPE_LABELS[batch.tagType] || batch.tagType}</span>
                <span className="text-text-muted">{batch.quantity}</span>
                <span className="text-text-muted">{new Date(batch.createdAt).toLocaleDateString()}</span>
                <div className="flex justify-end">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleDownloadBatch(batch)} disabled={downloading}>
                      Download All QR
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setDeleteBatchTarget(batch);
                        setDeleteBatchConfirmA(false);
                        setDeleteBatchConfirmB(false);
                      }}
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Delete Batch
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteBatchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text">Delete Tag Batch</h3>
                <p className="mt-1 text-sm text-text-dim">
                  Batch: <span className="font-medium text-text">{deleteBatchTarget.name}</span>
                </p>
              </div>
              <button type="button" onClick={() => setDeleteBatchTarget(null)} className="text-xs text-text-dim hover:text-text">
                Close
              </button>
            </div>

            <div className="mt-5 space-y-3 rounded-lg border border-border bg-surface-raised p-4 text-sm text-text-dim">
              <p>This will permanently delete the batch and all tags created in it.</p>
              <p>QR assets associated with those tags will also be removed.</p>
            </div>

            <label className="mt-4 flex items-start gap-3 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={deleteBatchConfirmA}
                onChange={(e) => setDeleteBatchConfirmA(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
              />
              I understand this will delete all tags in the batch.
            </label>
            <label className="mt-3 flex items-start gap-3 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={deleteBatchConfirmB}
                onChange={(e) => setDeleteBatchConfirmB(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
              />
              I understand this action cannot be undone.
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setDeleteBatchTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deletingBatch}
                onClick={handleDeleteBatch}
                disabled={!deleteBatchConfirmA || !deleteBatchConfirmB}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Delete Batch
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteSelectedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text">Delete Selected Tags</h3>
                <p className="mt-1 text-sm text-text-dim">
                  This will permanently delete {selectedTagIds.length} tag(s).
                </p>
              </div>
              <button type="button" onClick={() => setDeleteSelectedOpen(false)} className="text-xs text-text-dim hover:text-text">
                Close
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-surface-raised p-4 text-sm text-text-dim">
              This action cannot be undone.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setDeleteSelectedOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" loading={deletingSelected} onClick={handleDeleteSelected} icon={<Trash2 className="h-3.5 w-3.5" />}>
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-text">Delete Tag</h3>
                <p className="mt-1 text-sm text-text-dim">
                  This will permanently delete tag <span className="font-mono text-text">{deleteTarget.token}</span>.
                </p>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} className="text-xs text-text-dim hover:text-text">
                Close
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-surface-raised p-4 text-sm text-text-dim">
              This action cannot be undone.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" loading={deletingId === deleteTarget.id} onClick={handleDeleteTag} icon={<Trash2 className="h-3.5 w-3.5" />}>
                Delete Tag
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
