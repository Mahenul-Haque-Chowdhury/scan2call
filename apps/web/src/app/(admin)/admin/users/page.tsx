'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isSuspended: boolean;
  createdAt: string;
  _count?: { tags: number };
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-400',
  MANAGER: 'bg-purple-500/20 text-purple-400',
  CUSTOMER: 'bg-blue-500/20 text-blue-400',
  FINDER: 'bg-surface-raised text-text-dim',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page: number, searchTerm: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (searchTerm) params.set('search', searchTerm);
      if (role) params.set('role', role);

      const result = await apiClient.get<{ data: AdminUser[]; meta: PaginationMeta }>(
        `/admin/users?${params.toString()}`
      );
      setUsers(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, search, roleFilter);
    // Search is intentionally submit-driven to avoid refetching on every keystroke.
  }, [fetchUsers, roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    fetchUsers(1, search, roleFilter);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const totalPages = Math.ceil(meta.total / meta.pageSize);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-display">Users</h1>
      <p className="mt-2 text-text-muted">Manage registered users and their subscriptions.</p>

      {/* Search / Filters */}
      <div className="mt-8 flex gap-4">
        <input
          type="text"
          placeholder="Search users by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-md border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button onClick={handleSearch} icon={<Search className="h-4 w-4" />}>
          Search
        </Button>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="CUSTOMER">Customer</option>
          <option value="FINDER">Finder</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="error" className="mt-6">
          {error}
          <button
            onClick={() => fetchUsers(meta.page, search, roleFilter)}
            className="ml-2 underline hover:opacity-80"
          >
            Retry
          </button>
        </Alert>
      )}

      {/* Users Table */}
      {!error && (
        <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-6 py-3">
            <div className="grid grid-cols-6 text-sm font-medium text-text-dim">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Joined</span>
              <span className="text-right">Tags</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-dim">No users found.</div>
          ) : (
            <div>
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                  className="grid cursor-pointer grid-cols-6 border-b border-border px-6 py-3 text-sm transition-colors last:border-b-0 hover:bg-surface-raised"
                >
                  <span className="font-medium text-text">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="truncate text-text-muted">{user.email}</span>
                  <span>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        ROLE_BADGE_COLORS[user.role] || 'bg-surface-raised text-text-dim'
                      }`}
                    >
                      {user.role}
                    </span>
                  </span>
                  <span>
                    {user.isSuspended ? (
                      <Badge variant="error">Suspended</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </span>
                  <span className="text-text-muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-right text-text-muted">{user._count?.tags ?? 0}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-text-dim">
                Page {meta.page} of {totalPages} ({meta.total} total users)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => fetchUsers(meta.page - 1, search, roleFilter)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={meta.page >= totalPages}
                  onClick={() => fetchUsers(meta.page + 1, search, roleFilter)}
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
