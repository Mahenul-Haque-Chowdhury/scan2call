'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isSuspended: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    tags: number;
    orders: number;
    scans: number;
  };
}

const ROLE_OPTIONS = ['CUSTOMER', 'MANAGER', 'ADMIN'];

const ROLE_BADGE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-400',
  MANAGER: 'bg-purple-500/20 text-purple-400',
  CUSTOMER: 'bg-blue-500/20 text-blue-400',
  FINDER: 'bg-surface-raised text-text-dim',
};

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const result = await apiClient.get<{ data: UserDetail }>(`/admin/users/${params.userId}`);
        setUser(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    }
    if (params.userId) fetchUser();
  }, [params.userId]);

  const handleRoleChange = async (newRole: string) => {
    if (!user) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await apiClient.patch(`/admin/users/${user.id}`, { role: newRole });
      setUser({ ...user, role: newRole });
      setActionMessage(`Role updated to ${newRole}`);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!user) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const newSuspended = !user.isSuspended;
      await apiClient.patch(`/admin/users/${user.id}`, { isSuspended: newSuspended });
      setUser({ ...user, isSuspended: newSuspended });
      setActionMessage(newSuspended ? 'User suspended' : 'User unsuspended');
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to update suspension status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async (field: 'emailVerified' | 'phoneVerified') => {
    if (!user) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await apiClient.post(`/admin/users/${user.id}/verify`, { [field]: true });
      setUser({ ...user, [field]: true });
      setActionMessage(field === 'emailVerified' ? 'Email marked as verified' : 'Phone marked as verified');
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to verify user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to delete user "${user.firstName} ${user.lastName}"? This action cannot be undone.`)) {
      return;
    }
    setActionLoading(true);
    setActionMessage(null);
    try {
      await apiClient.delete(`/admin/users/${user.id}`);
      setActionMessage('User deleted. Redirecting...');
      setTimeout(() => router.push('/admin/users'), 1500);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to delete user');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div>
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-text-dim transition-colors hover:text-text">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <Alert variant="error" className="mt-6">
          {error || 'User not found'}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-text-dim transition-colors hover:text-text">
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      <div className="mt-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display">
            {user.firstName} {user.lastName}
          </h1>
          <p className="mt-1 text-sm text-text-dim">{user.email}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            ROLE_BADGE_COLORS[user.role] || 'bg-surface-raised text-text-dim'
          }`}
        >
          {user.role}
        </span>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <Alert variant="info" className="mt-4">{actionMessage}</Alert>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Account Info */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-semibold text-text">Account Info</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-dim">Name</span>
              <span className="font-medium text-text">{user.firstName} {user.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Email</span>
              <span className="font-medium text-text">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Phone</span>
              <span className="font-medium text-text">{user.phone || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Email Verified</span>
              <span className="font-medium text-text">{user.emailVerified ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Phone Verified</span>
              <span className="font-medium text-text">{user.phoneVerified ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Status</span>
              <span>
                {user.isSuspended ? (
                  <Badge variant="error">Suspended</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Joined</span>
              <span className="font-medium text-text">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Last Updated</span>
              <span className="font-medium text-text">{new Date(user.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-semibold text-text">Activity Counts</h2>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-md bg-surface-raised p-4">
              <p className="text-2xl font-bold text-text">{user._count?.tags ?? 0}</p>
              <p className="text-xs text-text-dim">Tags</p>
            </div>
            <div className="rounded-md bg-surface-raised p-4">
              <p className="text-2xl font-bold text-text">{user._count?.orders ?? 0}</p>
              <p className="text-xs text-text-dim">Orders</p>
            </div>
            <div className="rounded-md bg-surface-raised p-4">
              <p className="text-2xl font-bold text-text">{user._count?.scans ?? 0}</p>
              <p className="text-xs text-text-dim">Scans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-semibold text-text">Actions</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {/* Role Change */}
          <div className="flex items-center gap-2">
            <label htmlFor="role-select" className="text-sm text-text-muted">
              Change role:
            </label>
            <select
              id="role-select"
              value={user.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={actionLoading}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Verify Email */}
          {!user.emailVerified && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleVerify('emailVerified')}
              disabled={actionLoading}
            >
              Verify Email
            </Button>
          )}

          {/* Verify Phone */}
          {!user.phoneVerified && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleVerify('phoneVerified')}
              disabled={actionLoading}
            >
              Verify Phone
            </Button>
          )}

          {/* Suspend / Unsuspend */}
          <button
            onClick={handleSuspendToggle}
            disabled={actionLoading}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              user.isSuspended
                ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            {user.isSuspended ? 'Unsuspend' : 'Suspend'}
          </button>

          {/* Delete */}
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={actionLoading}
          >
            Delete User
          </Button>
        </div>
      </div>
    </div>
  );
}
