'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AuditActor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  admin: AuditActor;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

const TARGET_FILTERS = [
  { label: 'All targets', value: '' },
  { label: 'Users', value: 'User' },
  { label: 'Tags', value: 'Tag' },
  { label: 'Orders', value: 'Order' },
  { label: 'Products', value: 'Product' },
  { label: 'Tag Batches', value: 'TagBatch' },
];

function formatMetadata(metadata?: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return 'No extra details';
  }

  return JSON.stringify(metadata);
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [targetType, setTargetType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (page: number, selectedTarget: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (selectedTarget) params.set('targetType', selectedTarget);

      const result = await apiClient.get<{ data: AuditLogEntry[]; meta: PaginationMeta }>(
        `/admin/audit-log?${params.toString()}`,
      );

      setLogs(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1, targetType);
  }, [fetchLogs, targetType]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((log) => {
      const actor = `${log.admin.firstName} ${log.admin.lastName} ${log.admin.email}`.toLowerCase();
      return (
        log.action.toLowerCase().includes(query) ||
        log.targetType.toLowerCase().includes(query) ||
        log.targetId.toLowerCase().includes(query) ||
        actor.includes(query) ||
        formatMetadata(log.metadata).toLowerCase().includes(query)
      );
    });
  }, [logs, search]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.pageSize));

  return (
    <div>
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-text-dim" />
        <h1 className="text-3xl font-bold tracking-tight font-display text-text">Audit Log</h1>
      </div>
      <p className="mt-2 text-text-muted">
        Track administrative actions, security events, and system changes.
      </p>

      <div className="mt-8 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, actor, target, or metadata..."
            className="w-full rounded-md border border-border bg-surface pl-10 pr-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text"
        >
          {TARGET_FILTERS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <Alert variant="error" className="mt-6">
          {error}
          <button
            onClick={() => fetchLogs(meta.page, targetType)}
            className="ml-2 underline hover:opacity-80"
          >
            Retry
          </button>
        </Alert>
      )}

      {!error && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-6 py-3">
            <div className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_1.6fr] gap-4 text-sm font-medium text-text-dim">
              <span>Timestamp</span>
              <span>Actor</span>
              <span>Action</span>
              <span>Target</span>
              <span>Details</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-dim">
              {meta.total === 0
                ? 'No audit log entries have been recorded yet.'
                : 'No audit log entries match the current filters.'}
            </div>
          ) : (
            <div>
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_1.6fr] gap-4 border-b border-border px-6 py-4 text-sm last:border-b-0"
                >
                  <span className="text-text-muted">
                    {new Date(log.createdAt).toLocaleString('en-AU')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">
                      {log.admin.firstName} {log.admin.lastName}
                    </p>
                    <p className="truncate text-text-dim">{log.admin.email}</p>
                  </div>
                  <span className="font-medium text-text">{log.action}</span>
                  <div className="min-w-0 text-text-muted">
                    <p>{log.targetType}</p>
                    <p className="truncate text-xs text-text-dim">{log.targetId}</p>
                  </div>
                  <p className="truncate text-text-muted" title={formatMetadata(log.metadata)}>
                    {formatMetadata(log.metadata)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!loading && meta.total > meta.pageSize && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-text-dim">
                Page {meta.page} of {totalPages} ({meta.total} total entries)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => fetchLogs(meta.page - 1, targetType)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page >= totalPages}
                  onClick={() => fetchLogs(meta.page + 1, targetType)}
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
