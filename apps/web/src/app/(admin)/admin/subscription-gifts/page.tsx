'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TagType, TAG_TYPE_LABELS } from '@scan2call/shared';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Search, Gift, Copy, UserPlus, Tag, Camera, ScanLine } from 'lucide-react';

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
  reservedTag?: {
    id: string;
    token: string;
    status: string;
    type: TagType;
  } | null;
  createdBy?: { firstName: string; lastName: string; email: string } | null;
}

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function extractTagTokenFromScan(value: string): string | null {
  const trimmedValue = value.trim();
  if (/^[A-Za-z0-9]{12}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[parts.length - 2] === 'scan') {
      const token = parts[parts.length - 1];
      if (typeof token === 'string' && /^[A-Za-z0-9]{12}$/.test(token)) {
        return token;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Camera permission denied. On iOS: Settings > Safari > Camera > Allow, then reload.';
      case 'NotFoundError':
        return 'No camera was found on this device.';
      case 'NotReadableError':
        return 'The camera is already in use by another app. Close it and try again.';
      case 'OverconstrainedError':
        return 'Unable to access the rear camera. Try switching cameras or using a different device.';
      default:
        return 'Could not open the camera. Check browser permissions and try again.';
    }
  }

  return 'Could not open the camera. Check browser permissions and try again.';
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
  const reserveVideoRef = useRef<HTMLVideoElement | null>(null);
  const reserveStreamRef = useRef<MediaStream | null>(null);
  const reserveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const reserveJsQrRef = useRef<((data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) | null>(null);

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
  const [tagCreating, setTagCreating] = useState(false);
  const [tagCreateResult, setTagCreateResult] = useState<string | null>(null);

  const [tagReserveCodeId, setTagReserveCodeId] = useState('');
  const [tagReserveToken, setTagReserveToken] = useState('');
  const [tagReserveStatus, setTagReserveStatus] = useState('');
  const [tagReserveResult, setTagReserveResult] = useState<string | null>(null);
  const [tagReserveError, setTagReserveError] = useState<string | null>(null);
  const [tagReserving, setTagReserving] = useState(false);
  const [tagScannerActive, setTagScannerActive] = useState(false);
  const [tagScannerOpening, setTagScannerOpening] = useState(false);

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

  useEffect(() => {
    return () => {
      reserveStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
        maxRedemptions: 1,
      };
      if (tagExpiresAt) body.expiresAt = new Date(tagExpiresAt).toISOString();

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
    () => tagCodes.filter((c) => c.status === 'ACTIVE' && !c.reservedTag),
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

  const stopTagScanner = useCallback(() => {
    reserveStreamRef.current?.getTracks().forEach((track) => track.stop());
    reserveStreamRef.current = null;
    if (reserveVideoRef.current) {
      reserveVideoRef.current.pause();
      reserveVideoRef.current.srcObject = null;
      reserveVideoRef.current.load();
    }
    setTagScannerActive(false);
  }, []);

  useEffect(() => {
    if (!tagScannerActive || !reserveVideoRef.current) {
      return;
    }

    const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
    let cancelled = false;

    const intervalId = window.setInterval(async () => {
      const video = reserveVideoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        return;
      }

      try {
        let rawValue: string | undefined;

        if (detector) {
          const barcodes = await detector.detect(video);
          rawValue = barcodes[0]?.rawValue;
        } else {
          if (!reserveJsQrRef.current) {
            const jsQrModule = await import('jsqr');
            reserveJsQrRef.current = jsQrModule.default;
          }

          const jsQr = reserveJsQrRef.current;
          if (!jsQr) {
            throw new Error('QR fallback unavailable');
          }

          const canvas = reserveCanvasRef.current || document.createElement('canvas');
          reserveCanvasRef.current = canvas;
          const width = video.videoWidth;
          const height = video.videoHeight;
          if (!width || !height) {
            return;
          }

          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (!context) {
            return;
          }

          context.drawImage(video, 0, 0, width, height);
          const imageData = context.getImageData(0, 0, width, height);
          const code = jsQr(imageData.data, imageData.width, imageData.height);
          rawValue = code?.data;
        }

        if (!rawValue) {
          return;
        }

        const token = extractTagTokenFromScan(rawValue);
        if (!token) {
          setTagReserveError('The QR code does not contain a valid Scan2Call tag link.');
          return;
        }

        if (!cancelled) {
          setTagReserveToken(token);
          setTagReserveStatus('QR code captured. Ready to reserve this tag.');
          setTagReserveError(null);
          stopTagScanner();
        }
      } catch {
        if (!cancelled) {
          setTagReserveError('Unable to read the QR code. Try moving closer or improving the lighting.');
        }
      }
    }, 650);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [stopTagScanner, tagScannerActive]);

  const handleStartTagScanner = useCallback(async () => {
    setTagScannerOpening(true);
    setTagReserveError(null);
    setTagReserveStatus('Opening camera...');

    if (!navigator.mediaDevices?.getUserMedia) {
      setTagReserveError('Camera access is not supported in this browser.');
      setTagReserveStatus('');
      setTagScannerOpening(false);
      return;
    }

    stopTagScanner();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      reserveStreamRef.current = stream;
      setTagScannerActive(true);

      if (reserveVideoRef.current) {
        const video = reserveVideoRef.current;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.autoplay = true;
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // Autoplay may be blocked on iOS; scanning can still proceed.
        }
      }

      setTagReserveStatus(
        'BarcodeDetector' in window
          ? 'Point your camera at the QR code on the physical tag.'
          : 'Camera ready. Using a fallback QR reader for this device.',
      );
    } catch (err) {
      setTagReserveError(getCameraErrorMessage(err));
      setTagReserveStatus('');
      stopTagScanner();
    } finally {
      setTagScannerOpening(false);
    }
  }, [stopTagScanner]);

  const handleReserveTag = async () => {
    if (!tagReserveCodeId) {
      setTagReserveResult('Select a tag gift code first.');
      return;
    }

    const normalizedToken = extractTagTokenFromScan(tagReserveToken) ?? tagReserveToken.trim();
    if (!/^[A-Za-z0-9]{12}$/.test(normalizedToken)) {
      setTagReserveResult('Scan a valid tag QR code or enter a 12-character tag token.');
      return;
    }

    setTagReserving(true);
    setTagReserveResult(null);
    try {
      const result = await apiClient.post<{ data: TagGiftCodeRow }>(`/admin/tag-gift-codes/${tagReserveCodeId}/reserve-tag`, {
        tagToken: normalizedToken,
      });
      setTagReserveToken(result.data.reservedTag?.token ?? normalizedToken);
      setTagReserveStatus('Physical tag reserved to this gift code.');
      setTagReserveResult(`Reserved ${result.data.reservedTag?.token ?? normalizedToken} to ${result.data.code}.`);
      await fetchTagCodes(tagMeta.page, tagStatusFilter, tagSearch);
      setTagReserveCodeId('');
    } catch (err) {
      setTagReserveResult(err instanceof Error ? err.message : 'Failed to reserve tag gift code');
    } finally {
      setTagReserving(false);
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
          <p className="mt-1 text-sm text-text-muted">Create a one-time tag gift code, then reserve a physical tag to it by scanning.</p>

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

            <Alert variant="info">Scanner-based tag gifts reserve one physical tag per code.</Alert>

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
          <h3 className="text-lg font-semibold text-text">Reserve Physical Tag</h3>
          <p className="mt-1 text-sm text-text-muted">Bind an inactive, unowned physical tag to an active gift code.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Gift code</label>
              <select
                value={tagReserveCodeId}
                onChange={(e) => setTagReserveCodeId(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select an unreserved active code</option>
                {activeTagCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Scanned tag token</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={tagReserveToken}
                  onChange={(e) => setTagReserveToken(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="12-character token or Scan2Call URL"
                />
                <Button variant="secondary" onClick={handleStartTagScanner} loading={tagScannerOpening} icon={<Camera className="h-4 w-4" />}>
                  {tagScannerOpening ? 'Opening...' : 'Scan'}
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-border bg-bg/40">
              <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-text-dim">
                <span>Camera capture</span>
                {tagScannerActive && (
                  <button onClick={stopTagScanner} className="text-text-muted transition hover:text-text">
                    Stop
                  </button>
                )}
              </div>
              <div className="relative aspect-video bg-black/80">
                {tagScannerActive ? (
                  <video ref={reserveVideoRef} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-text-dim">
                    <div>
                      <ScanLine className="mx-auto mb-3 h-8 w-8 text-text-muted" />
                      Open the camera and point it at the physical tag QR code.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {tagReserveStatus && (
              <Alert variant="info">
                {tagReserveStatus}
              </Alert>
            )}

            {tagReserveError && (
              <Alert variant="error">
                {tagReserveError}
              </Alert>
            )}

            {tagReserveResult && (
              <Alert variant={tagReserveResult.startsWith('Reserved ') ? 'success' : 'error'}>
                {tagReserveResult}
              </Alert>
            )}

            <Button onClick={handleReserveTag} loading={tagReserving} icon={<Tag className="h-4 w-4" />}>
              {tagReserving ? 'Reserving...' : 'Reserve Physical Tag'}
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
            <div className="grid grid-cols-8 text-sm font-medium text-text-dim">
              <span className="col-span-2">Code</span>
              <span>Status</span>
              <span>Tag type</span>
              <span>Reserved tag</span>
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
                  className="grid grid-cols-8 items-center border-b border-border px-6 py-3 text-sm last:border-b-0 hover:bg-surface-raised"
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
                    {code.reservedTag ? (
                      <div>
                        <div className="font-mono text-xs text-text">{code.reservedTag.token}</div>
                        <div className="text-xs text-text-dim">{code.reservedTag.status}</div>
                      </div>
                    ) : (
                      'Unreserved'
                    )}
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
