'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { fetchWithAuth } from '@/lib/auth';
import { getApiOrigin } from '@/lib/api-origin';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Power, PowerOff, Trash2, Maximize2 } from 'lucide-react';

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

interface TagBatch {
  id: string;
  name: string;
  quantity: number;
  tagType: string;
  createdAt: string;
  _count: { tags: number };
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
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
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

  useEffect(() => {
    setSelectedTagIds((current) => current.filter((id) => tags.some((tag) => tag.id === id)));
  }, [tags]);

  useEffect(() => {
    let cancelled = false;

    async function loadBatches() {
      setBatchesLoading(true);
      try {
        const response = await apiClient.get<{ data: TagBatch[] }>(
          '/admin/tags/batches?page=1&pageSize=10',
        );
        if (!cancelled) {
          setBatches(response.data);
        }
      } catch {
        if (!cancelled) {
          setBatches([]);
        }
      } finally {
        if (!cancelled) {
          setBatchesLoading(false);
        }
      }
    }

    loadBatches();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviews() {
      const nextUrls: Record<string, string> = {};
      await Promise.all(
        tags.map(async (tag) => {
          try {
            const res = await fetchWithAuth(
              `${apiOrigin}/api/v1/admin/tags/${tag.id}/qr-code?format=png&size=140`,
              { method: 'GET' },
            );
            if (!res.ok) return;
            const blob = await res.blob();
            nextUrls[tag.id] = URL.createObjectURL(blob);
          } catch {
            // ignore preview load errors
          }
        }),
      );

      if (cancelled) {
        Object.values(nextUrls).forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = nextUrls;
      setPreviewUrls(nextUrls);
    }

    if (tags.length > 0) {
      loadPreviews();
    } else {
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = {};
      setPreviewUrls({});
    }

    return () => {
      cancelled = true;
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [apiOrigin, tags]);

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
      setTags((current) => current.filter((tag) => tag.id !== deleteTarget.id));
      await fetchTags(meta.page, statusFilter, typeFilter);
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
      await fetchTags(meta.page, statusFilter, typeFilter);
      setDeleteSelectedOpen(false);
    } finally {
      setDeletingSelected(false);
    }
  };

  const openPreview = async (tag: AdminTag) => {
    setPreviewTag(tag);
    setLargePreviewLoading(true);
    if (largePreviewUrl) {
      URL.revokeObjectURL(largePreviewUrl);
    }
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
    if (largePreviewUrl) {
      URL.revokeObjectURL(largePreviewUrl);
    }
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
      if (!res.ok) {
        throw new Error('Download failed');
      }
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
    await downloadZip(`/api/v1/admin/tags/batches/${batch.id}/qr-assets/download`, undefined,
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
      setBatches((current) => current.filter((batch) => batch.id !== deleteBatchTarget.id));
      setDeleteBatchTarget(null);
      setDeleteBatchConfirmA(false);
      setDeleteBatchConfirmB(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
    } finally {
      setDeletingBatch(false);
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={selectedTagIds.length === 0 || downloading}
                onClick={handleDownloadSelected}
              >
                {downloading ? 'Preparing ZIP...' : `Download Selected (${selectedTagIds.length})`}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={selectedTagIds.length === 0 || deletingSelected}
                onClick={() => setDeleteSelectedOpen(true)}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Delete Selected ({selectedTagIds.length})
              </Button>
              <span className="text-xs text-text-dim">Includes PNG + SVG per tag.</span>
            </div>
          </div>

          <div className="border-b border-border px-6 py-3">
            <div className="grid grid-cols-[0.4fr_1.1fr_0.9fr_0.8fr_1.1fr_0.9fr_0.7fr_1.6fr] text-sm font-medium text-text-dim">
              <span>
                <input
                  type="checkbox"
                  checked={tags.length > 0 && selectedTagIds.length === tags.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
                  aria-label="Select all tags"
                />
              </span>
              <span>Token</span>
              <span>Type</span>
              <span>Status</span>
              <span>Owner</span>
              <span>Created</span>
              <span className="text-center">QR</span>
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
                  className="grid grid-cols-[0.4fr_1.1fr_0.9fr_0.8fr_1.1fr_0.9fr_0.7fr_1.6fr] border-b border-border px-6 py-3 text-sm last:border-b-0 hover:bg-surface-raised items-center"
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
                  <span className="flex justify-center">
                    {(() => {
                      const previewUrl = previewUrls[tag.id];
                      if (!previewUrl) {
                        return <span className="text-xs text-text-dim">Loading...</span>;
                      }
                      return (
                      <button
                        type="button"
                        onClick={() => void openPreview(tag)}
                        className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-bg"
                      >
                        <Image
                          src={previewUrl}
                          alt={`QR preview for ${tag.token}`}
                          width={48}
                          height={48}
                          className="h-10 w-10 object-cover"
                          unoptimized
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Maximize2 className="h-4 w-4 text-white" />
                        </span>
                      </button>
                      );
                    })()}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerateQr(tag)}
                      loading={regeneratingId === tag.id}
                    >
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

      {previewTag && previewUrls[previewTag.id] && (
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
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadBatch(batch)}
                      disabled={downloading}
                    >
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
              <button
                type="button"
                onClick={() => setDeleteBatchTarget(null)}
                className="text-xs text-text-dim hover:text-text"
              >
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
              <button
                type="button"
                onClick={() => setDeleteSelectedOpen(false)}
                className="text-xs text-text-dim hover:text-text"
              >
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
              <Button
                variant="danger"
                size="sm"
                loading={deletingSelected}
                onClick={handleDeleteSelected}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
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
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-xs text-text-dim hover:text-text"
              >
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
              <Button
                variant="danger"
                size="sm"
                loading={deletingId === deleteTarget.id}
                onClick={handleDeleteTag}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Delete Tag
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
