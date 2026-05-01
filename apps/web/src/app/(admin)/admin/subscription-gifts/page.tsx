'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TagType, TAG_TYPE_LABELS } from '@scan2call/shared';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Search, Gift, Copy, UserPlus, Tag } from 'lucide-react';

interface GiftCodeRow {
  id: string;
  code: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'REVOKED';
  durationMonths: number | null;
  lifetime: boolean;
  expiresAt: string | null;
  maxRedemptions: number;
  redeemedCount: number;
  createdAt: string;
  createdBy?: { firstName: string; lastName: string; email: string } | null;
}

interface TagGiftCodeRow {
  id: string;
  code: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'REVOKED';
  tagType: TagType;
  expiresAt: string | null;
  maxRedemptions: number;
  redeemedCount: number;
  createdAt: string;
  createdBy?: { firstName: string; lastName: string; email: string } | null;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

const STATUS_BADGE: Record<GiftCodeRow['status'], string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400',
  REDEEMED: 'bg-blue-500/20 text-blue-400',
  EXPIRED: 'bg-surface-raised text-text-dim',
  REVOKED: 'bg-red-500/20 text-red-400',
};

export default function AdminSubscriptionGiftsPage() {
  const [codes, setCodes] = useState<GiftCodeRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [durationMonths, setDurationMonths] = useState('12');
  const [lifetime, setLifetime] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('1');
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<string | null>(null);

  const [assignCodeId, setAssignCodeId] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string | null>(null);

  const [tagCodes, setTagCodes] = useState<TagGiftCodeRow[]>([]);
  const [tagMeta, setTagMeta] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0 });
  const [tagStatusFilter, setTagStatusFilter] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [tagLoading, setTagLoading] = useState(true);
  const [tagError, setTagError] = useState<string | null>(null);

  const [tagType, setTagType] = useState<TagType>('GENERIC');
  const [tagExpiresAt, setTagExpiresAt] = useState('');
  const [tagMaxRedemptions, setTagMaxRedemptions] = useState('1');
  const [tagCreating, setTagCreating] = useState(false);
  const [tagCreateResult, setTagCreateResult] = useState<string | null>(null);

  const [tagAssignCodeId, setTagAssignCodeId] = useState('');
  const [tagUserQuery, setTagUserQuery] = useState('');
  const [tagUserResults, setTagUserResults] = useState<AdminUser[]>([]);
  const [tagSelectedUser, setTagSelectedUser] = useState<AdminUser | null>(null);
  const [tagAssigning, setTagAssigning] = useState(false);
  const [tagAssignResult, setTagAssignResult] = useState<string | null>(null);

  const fetchCodes = useCallback(async (page: number, status: string, searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status) params.set('status', status);
      if (searchTerm) params.set('search', searchTerm);
      const result = await apiClient.get<{ data: GiftCodeRow[]; meta: PaginationMeta }>(
        `/admin/gift-codes?${params.toString()}`
      );
      setCodes(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gift codes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTagCodes = useCallback(async (page: number, status: string, searchTerm: string) => {
    setTagLoading(true);
    setTagError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status) params.set('status', status);
      if (searchTerm) params.set('search', searchTerm);
      const result = await apiClient.get<{ data: TagGiftCodeRow[]; meta: PaginationMeta }>(
        `/admin/tag-gift-codes?${params.toString()}`
      );
      setTagCodes(result.data);
      setTagMeta(result.meta);
    } catch (err) {
      setTagError(err instanceof Error ? err.message : 'Failed to load tag gift codes');
    } finally {
      setTagLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes(1, statusFilter, search);
  }, [fetchCodes, statusFilter, search]);

  useEffect(() => {
    fetchTagCodes(1, tagStatusFilter, tagSearch);
  }, [fetchTagCodes, tagStatusFilter, tagSearch]);

  const handleSearch = () => {
    fetchCodes(1, statusFilter, search);
  };

  const handleTagSearch = () => {
    fetchTagCodes(1, tagStatusFilter, tagSearch);
  };

  const handleCreate = async () => {
    setCreating(true);
    setCreateResult(null);
    try {
      const body: Record<string, unknown> = {
        lifetime,
      };
      if (!lifetime) body.durationMonths = Number(durationMonths);
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();
      if (maxRedemptions) body.maxRedemptions = Number(maxRedemptions);

      const result = await apiClient.post<{ data: GiftCodeRow }>(
        '/admin/gift-codes',
        body
      );
      setCreateResult(result.data.code);
      await fetchCodes(1, statusFilter, search);
    } catch (err) {
      setCreateResult(err instanceof Error ? err.message : 'Failed to create code');
    } finally {
      setCreating(false);
    }
  };

  const handleTagCreate = async () => {
    setTagCreating(true);
    setTagCreateResult(null);
    try {
      const body: Record<string, unknown> = {
        tagType,
      };
      if (tagExpiresAt) body.expiresAt = new Date(tagExpiresAt).toISOString();
      if (tagMaxRedemptions) body.maxRedemptions = Number(tagMaxRedemptions);

      const result = await apiClient.post<{ data: TagGiftCodeRow }>(
        '/admin/tag-gift-codes',
        body
      );
      setTagCreateResult(result.data.code);
      await fetchTagCodes(1, tagStatusFilter, tagSearch);
    } catch (err) {
      setTagCreateResult(err instanceof Error ? err.message : 'Failed to create tag gift code');
    } finally {
      setTagCreating(false);
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // no-op
    }
  };

  const activeCodes = useMemo(
    () => codes.filter((c) => c.status === 'ACTIVE'),
    [codes]
  );

  const activeTagCodes = useMemo(
    () => tagCodes.filter((c) => c.status === 'ACTIVE'),
    [tagCodes]
  );

  const handleUserSearch = async () => {
    if (!userQuery.trim()) return;
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '5', search: userQuery.trim() });
      const result = await apiClient.get<{ data: AdminUser[] }>(`/admin/users?${params.toString()}`);
      setUserResults(result.data);
    } catch {
      setUserResults([]);
    }
  };

  const handleTagUserSearch = async () => {
    if (!tagUserQuery.trim()) return;
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '5', search: tagUserQuery.trim() });
      const result = await apiClient.get<{ data: AdminUser[] }>(`/admin/users?${params.toString()}`);
      setTagUserResults(result.data);
    } catch {
      setTagUserResults([]);
    }
  };

  const handleAssign = async () => {
    if (!assignCodeId || !selectedUser) {
      setAssignResult('Select a gift code and user first.');
      return;
    }
    setAssigning(true);
    setAssignResult(null);
    try {
      await apiClient.post(`/admin/gift-codes/${assignCodeId}/assign`, {
        userId: selectedUser.id,
      });
      setAssignResult('Gift code assigned successfully.');
      setSelectedUser(null);
      setUserResults([]);
      await fetchCodes(meta.page, statusFilter, search);
    } catch (err) {
      setAssignResult(err instanceof Error ? err.message : 'Failed to assign gift code');
    } finally {
      setAssigning(false);
    }
  };

  const handleTagAssign = async () => {
    if (!tagAssignCodeId || !tagSelectedUser) {
      setTagAssignResult('Select a tag gift code and user first.');
      return;
    }
    setTagAssigning(true);
    setTagAssignResult(null);
    try {
      await apiClient.post(`/admin/tag-gift-codes/${tagAssignCodeId}/assign`, {
        userId: tagSelectedUser.id,
      });
      setTagAssignResult('Tag gift code assigned successfully.');
      setTagSelectedUser(null);
      setTagUserResults([]);
      await fetchTagCodes(tagMeta.page, tagStatusFilter, tagSearch);
    } catch (err) {
      setTagAssignResult(err instanceof Error ? err.message : 'Failed to assign tag gift code');
    } finally {
      setTagAssigning(false);
    }
  };

  const totalPages = Math.ceil(meta.total / meta.pageSize);
  const tagTotalPages = Math.ceil(tagMeta.total / tagMeta.pageSize);

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display text-text">Subscription Gifts</h1>
          <p className="mt-2 text-text-muted">Generate and manage gift codes for subscription access.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-text-dim">
          <Gift className="h-5 w-5" />
          <span className="text-sm">{meta.total} total codes</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Create Gift Code</h2>
          <p className="mt-1 text-sm text-text-muted">Generate a one-time redeem code for a custom duration.</p>

          <div className="mt-5 grid gap-4">
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={lifetime}
                onChange={(e) => setLifetime(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Lifetime access
            </label>

            {!lifetime && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Duration (months)</label>
                <input
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="12"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Expires at (optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Max redemptions</label>
              <input
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="1"
              />
            </div>

            {createResult && (
              <Alert variant={createResult.startsWith('Scan2Call-Gift') ? 'success' : 'error'}>
                {createResult.startsWith('Scan2Call-Gift')
                  ? `Code created: ${createResult}`
                  : createResult}
              </Alert>
            )}

            <Button onClick={handleCreate} loading={creating}>
              {creating ? 'Creating...' : 'Create Code'}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">Assign to User</h2>
          <p className="mt-1 text-sm text-text-muted">Redeem a code on behalf of a user.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Gift code</label>
              <select
                value={assignCodeId}
                onChange={(e) => setAssignCodeId(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select an active code</option>
                {activeCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Search user</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Email or name"
                />
                <Button variant="secondary" onClick={handleUserSearch} icon={<Search className="h-4 w-4" />}>
                  Find
                </Button>
              </div>
            </div>

            {userResults.length > 0 && (
              <div className="rounded-md border border-border bg-bg/40">
                {userResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surface-raised ${
                      selectedUser?.id === user.id ? 'bg-surface-raised' : ''
                    }`}
                  >
                    <div className="font-medium text-text">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-text-dim">{user.email}</div>
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <Alert variant="info">
                Selected: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
              </Alert>
            )}

            {assignResult && (
              <Alert variant={assignResult.includes('successfully') ? 'success' : 'error'}>
                {assignResult}
              </Alert>
            )}

            <Button onClick={handleAssign} loading={assigning} icon={<UserPlus className="h-4 w-4" />}>
              {assigning ? 'Assigning...' : 'Assign Gift'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
          <option value="ACTIVE">Active</option>
          <option value="REDEEMED">Redeemed</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>

      {error && (
        <Alert variant="error" className="mt-6">
          {error}
          <button
            onClick={() => fetchCodes(meta.page, statusFilter, search)}
            className="ml-2 underline hover:opacity-80"
          >
            Retry
          </button>
        </Alert>
      )}

      {!error && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-6 py-3">
            <div className="grid grid-cols-7 text-sm font-medium text-text-dim">
              <span className="col-span-2">Code</span>
              <span>Status</span>
              <span>Duration</span>
              <span>Expires</span>
              <span>Redeemed</span>
              <span className="text-right">Actions</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : codes.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-dim">No gift codes found.</div>
          ) : (
            <div>
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="grid grid-cols-7 items-center border-b border-border px-6 py-3 text-sm last:border-b-0 hover:bg-surface-raised"
                >
                  <div className="col-span-2">
                    <div className="font-mono text-primary">{code.code}</div>
                    <div className="text-xs text-text-dim">
                      Created {new Date(code.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[code.status]}`}>
                      {code.status}
                    </span>
                  </div>
                  <div className="text-text-muted">
                    {code.lifetime ? 'Lifetime' : `${code.durationMonths || 0} mo`}
                  </div>
                  <div className="text-text-muted">
                    {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : '—'}
                  </div>
                  <div className="text-text-muted">
                    {code.redeemedCount}/{code.maxRedemptions}
                  </div>
                  <div className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(code.code)}
                      icon={<Copy className="h-3.5 w-3.5" />}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-text-dim">
                Page {meta.page} of {totalPages} ({meta.total} total codes)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => fetchCodes(meta.page - 1, statusFilter, search)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page >= totalPages}
                  onClick={() => fetchCodes(meta.page + 1, statusFilter, search)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-12 flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-display text-text">Tag Gifts</h2>
          <p className="mt-2 text-text-muted">Generate and manage gift codes that add tags to user accounts.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-text-dim">
          <Tag className="h-5 w-5" />
          <span className="text-sm">{tagMeta.total} total codes</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h3 className="text-lg font-semibold text-text">Create Tag Gift Code</h3>
          <p className="mt-1 text-sm text-text-muted">Issue a redeem code that creates an inactive tag for the user.</p>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Tag type</label>
              <select
                value={tagType}
                onChange={(e) => setTagType(e.target.value as TagType)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Object.values(TagType).map((type) => (
                  <option key={type} value={type}>
                    {TAG_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Expires at (optional)</label>
              <input
                type="date"
                value={tagExpiresAt}
                onChange={(e) => setTagExpiresAt(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Max redemptions</label>
              <input
                value={tagMaxRedemptions}
                onChange={(e) => setTagMaxRedemptions(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="1"
              />
            </div>

            {tagCreateResult && (
              <Alert variant={tagCreateResult.startsWith('Scan2Call-Gift') ? 'success' : 'error'}>
                {tagCreateResult.startsWith('Scan2Call-Gift')
                  ? `Code created: ${tagCreateResult}`
                  : tagCreateResult}
              </Alert>
            )}

            <Button onClick={handleTagCreate} loading={tagCreating}>
              {tagCreating ? 'Creating...' : 'Create Tag Code'}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h3 className="text-lg font-semibold text-text">Assign Tag Gift</h3>
          <p className="mt-1 text-sm text-text-muted">Redeem a tag gift code on behalf of a user.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Gift code</label>
              <select
                value={tagAssignCodeId}
                onChange={(e) => setTagAssignCodeId(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select an active code</option>
                {activeTagCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Search user</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={tagUserQuery}
                  onChange={(e) => setTagUserQuery(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Email or name"
                />
                <Button variant="secondary" onClick={handleTagUserSearch} icon={<Search className="h-4 w-4" />}>
                  Find
                </Button>
              </div>
            </div>

            {tagUserResults.length > 0 && (
              <div className="rounded-md border border-border bg-bg/40">
                {tagUserResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setTagSelectedUser(user)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surface-raised ${
                      tagSelectedUser?.id === user.id ? 'bg-surface-raised' : ''
                    }`}
                  >
                    <div className="font-medium text-text">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-text-dim">{user.email}</div>
                  </button>
                ))}
              </div>
            )}

            {tagSelectedUser && (
              <Alert variant="info">
                Selected: {tagSelectedUser.firstName} {tagSelectedUser.lastName} ({tagSelectedUser.email})
              </Alert>
            )}

            {tagAssignResult && (
              <Alert variant={tagAssignResult.includes('successfully') ? 'success' : 'error'}>
                {tagAssignResult}
              </Alert>
            )}

            <Button onClick={handleTagAssign} loading={tagAssigning} icon={<UserPlus className="h-4 w-4" />}>
              {tagAssigning ? 'Assigning...' : 'Assign Tag Gift'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search code..."
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value)}
          className="flex-1 min-w-55 rounded-md border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button onClick={handleTagSearch} icon={<Search className="h-4 w-4" />}>
          Search
        </Button>
        <select
          value={tagStatusFilter}
          onChange={(e) => setTagStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="REDEEMED">Redeemed</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>

      {tagError && (
        <Alert variant="error" className="mt-6">
          {tagError}
          <button
            onClick={() => fetchTagCodes(tagMeta.page, tagStatusFilter, tagSearch)}
            className="ml-2 underline hover:opacity-80"
          >
            Retry
          </button>
        </Alert>
      )}

      {!tagError && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-6 py-3">
            <div className="grid grid-cols-7 text-sm font-medium text-text-dim">
              <span className="col-span-2">Code</span>
              <span>Status</span>
              <span>Tag type</span>
              <span>Expires</span>
              <span>Redeemed</span>
              <span className="text-right">Actions</span>
            </div>
          </div>

          {tagLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : tagCodes.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-dim">No tag gift codes found.</div>
          ) : (
            <div>
              {tagCodes.map((code) => (
                <div
                  key={code.id}
                  className="grid grid-cols-7 items-center border-b border-border px-6 py-3 text-sm last:border-b-0 hover:bg-surface-raised"
                >
                  <div className="col-span-2">
                    <div className="font-mono text-primary">{code.code}</div>
                    <div className="text-xs text-text-dim">
                      Created {new Date(code.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[code.status]}`}>
                      {code.status}
                    </span>
                  </div>
                  <div className="text-text-muted">
                    {TAG_TYPE_LABELS[code.tagType]}
                  </div>
                  <div className="text-text-muted">
                    {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : '—'}
                  </div>
                  <div className="text-text-muted">
                    {code.redeemedCount}/{code.maxRedemptions}
                  </div>
                  <div className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(code.code)}
                      icon={<Copy className="h-3.5 w-3.5" />}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!tagLoading && tagTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-text-dim">
                Page {tagMeta.page} of {tagTotalPages} ({tagMeta.total} total codes)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={tagMeta.page <= 1}
                  onClick={() => fetchTagCodes(tagMeta.page - 1, tagStatusFilter, tagSearch)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={tagMeta.page >= tagTotalPages}
                  onClick={() => fetchTagCodes(tagMeta.page + 1, tagStatusFilter, tagSearch)}
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
