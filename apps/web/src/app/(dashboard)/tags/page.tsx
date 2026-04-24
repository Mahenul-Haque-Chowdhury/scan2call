'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, ApiError } from '@/lib/api-client';
import { Tag } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';

interface TagItem {
  id: string;
  token: string;
  type: string;
  status: string;
  label: string | null;
  description: string | null;
  isLostMode: boolean;
  lostModeMessage: string | null;
  allowVoiceCall: boolean;
  allowSms: boolean;
  allowWhatsApp: boolean;
  photoUrl: string | null;
  createdAt: string;
  activatedAt: string | null;
  scanCount: number;
}

interface TagsResponse {
  data: TagItem[];
  meta: { page: number; pageSize: number; total: number };
}

const TAG_TYPE_LABELS: Record<string, string> = {
  PET_COLLAR: 'Pet Collar',
  CAR_STICKER: 'Car Sticker',
  LUGGAGE_TAG: 'Luggage Tag',
  KEYCHAIN: 'Keychain',
  MEDICAL_BAND: 'Medical Band',
  GENERIC: 'Generic',
};

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'error' | 'neutral' | 'info' | 'warning'> = {
  ACTIVE: 'success',
  LOST: 'error',
  INACTIVE: 'neutral',
  FOUND: 'info',
  DEACTIVATED: 'neutral',
};

function formatTagType(type: string): string {
  return TAG_TYPE_LABELS[type] || type;
}

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActivateForm, setShowActivateForm] = useState(false);
  const [activateToken, setActivateToken] = useState('');
  const [activateLabel, setActivateLabel] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<TagsResponse>('/tags');
      setTags(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (activateToken.length !== 12) { setActivateError('Token must be exactly 12 characters.'); return; }
    if (!activateLabel.trim()) { setActivateError('Please give your tag a name.'); return; }
    setActivateLoading(true);
    setActivateError(null);
    try {
      await apiClient.post('/tags/activate', { token: activateToken, label: activateLabel.trim() });
      setActivateToken('');
      setActivateLabel('');
      setShowActivateForm(false);
      await fetchTags();
    } catch (err) {
      setActivateError(err instanceof ApiError ? err.message : 'Failed to activate tag. Please try again.');
    } finally {
      setActivateLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="My Tags"
        description="Manage and monitor your QR identity tags."
        actions={
          <Button variant="secondary" size="sm" onClick={() => { setShowActivateForm(!showActivateForm); setActivateError(null); setActivateToken(''); }}>
            Activate Existing Tag
          </Button>
        }
      />

      <AnimatePresence>
        {showActivateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="overflow-hidden"
          >
            <Card className="mt-6 p-5">
              <h2 className="text-lg font-semibold text-text">Activate a Tag</h2>
              <p className="mt-1 text-sm text-text-muted">Enter the 12-character token printed on your physical tag and give it a name.</p>
              <form onSubmit={handleActivate} className="mt-4 space-y-4">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Input label="Tag Token" id="activate-token" value={activateToken} onChange={(e) => setActivateToken(e.target.value.replace(/\s/g, ''))} maxLength={12} className="font-mono uppercase tracking-widest" placeholder="XXXXXXXXXXXX" disabled={activateLoading} />
                  </div>
                  <div className="flex-1">
                    <Input label="Tag Name" id="activate-label" value={activateLabel} onChange={(e) => setActivateLabel(e.target.value)} maxLength={200} placeholder='e.g. "My car keys"' disabled={activateLoading} />
                  </div>
                </div>
                <p className="text-xs text-text-dim">Lost mode will be enabled automatically - anyone who scans your tag can contact you.</p>
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={activateLoading || activateToken.length !== 12 || !activateLabel.trim()} loading={activateLoading}>{activateLoading ? 'Activating...' : 'Activate'}</Button>
                  <Button type="button" variant="ghost" onClick={() => { setShowActivateForm(false); setActivateError(null); setActivateToken(''); setActivateLabel(''); }}>Cancel</Button>
                </div>
              </form>
              {activateError && <p className="mt-3 text-sm text-error">{activateError}</p>}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="mt-12 flex justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" className="text-text-dim" />
            <p className="text-sm text-text-muted">Loading tags...</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <Alert variant="error" className="mt-8">
          <div className="text-center">
            <p>{error}</p>
            <button onClick={fetchTags} className="mt-3 text-sm font-medium text-error underline hover:opacity-80">Try again</button>
          </div>
        </Alert>
      )}

      {!isLoading && !error && tags.length === 0 && (
        <Card className="mt-8">
          <EmptyState
            icon={<Tag className="h-6 w-6" />}
            title="No tags yet"
            description="Your tags will appear here after your orders are delivered. Browse our store to order your first tag."
            action={
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setShowActivateForm(true)}>Activate Existing Tag</Button>
                <Link href="/store"><Button>Browse Store</Button></Link>
              </div>
            }
          />
        </Card>
      )}

      {!isLoading && !error && tags.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag, i) => (
            <motion.button
              key={tag.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => router.push(`/tags/${tag.id}`)}
              className="bg-surface border border-border rounded-2xl p-5 text-left transition-all duration-200 hover:border-primary/25 hover:shadow-lg hover:shadow-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold text-text">{tag.label || 'Unnamed Tag'}</h3>
                  <p className="mt-0.5 text-sm text-text-muted">{formatTagType(tag.type)}</p>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[tag.status] || 'neutral'}>{tag.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
                <span className="font-mono text-xs tracking-wide">{tag.token.slice(0, 4)}...{tag.token.slice(-4)}</span>
                <span>{tag.scanCount} {tag.scanCount === 1 ? 'scan' : 'scans'}</span>
              </div>
              {tag.isLostMode && (
                <div className="mt-3">
                  <Badge variant="error">Lost Mode Active</Badge>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
