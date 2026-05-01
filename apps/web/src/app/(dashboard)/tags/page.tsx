'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, ApiError } from '@/lib/api-client';
import { Camera, ScanLine, Tag, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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

        return null;
    }
  } catch {
    return null;
  }

  return null;
}

export default function TagsPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActivateScanner, setShowActivateScanner] = useState(false);
  const [activateLabel, setActivateLabel] = useState('');
  const [activateToken, setActivateToken] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [scannerOpening, setScannerOpening] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
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

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopScanner = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  }, []);

  useEffect(() => {
    if (!scannerActive || !videoRef.current) {
      return;
    }

    const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!Detector) {
      setScannerError('Camera scanning is not supported on this device.');
      stopScanner();
      return;
    }

    const detector = new Detector({ formats: ['qr_code'] });
    let cancelled = false;

    const intervalId = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        return;
      }

      try {
        const barcodes = await detector.detect(video);
        const rawValue = barcodes[0]?.rawValue;
        if (!rawValue) {
          return;
        }

        const token = extractTagTokenFromScan(rawValue);
        if (!token) {
          setScannerError('The QR code does not contain a valid Scan2Call tag link.');
          return;
        }

        if (!cancelled) {
          setActivateToken(token);
          setScannerStatus('QR code captured. Ready to activate.');
          setScannerError(null);
          stopScanner();
        }
      } catch {
        if (!cancelled) {
          setScannerError('Unable to read the QR code. Try moving closer or improving the lighting.');
        }
      }
    }, 650);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [scannerActive, stopScanner]);

  const handleStartScanner = useCallback(async () => {
    setScannerOpening(true);
    setScannerError(null);
    setScannerStatus('Opening camera...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      setScannerReady(true);
      setScannerActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScannerStatus('Point your camera at the QR code on the tag.');
    } catch {
      setScannerError('Could not open the camera. Check browser permissions and try again.');
      setScannerStatus('');
      stopScanner();
    } finally {
      setScannerOpening(false);
    }
  }, [stopScanner]);

  const closeActivateScanner = useCallback(() => {
    stopScanner();
    setShowActivateScanner(false);
    setScannerStatus('');
    setScannerError(null);
    setActivateError(null);
    setActivateToken(null);
    setActivateLabel('');
  }, [stopScanner]);

  const handleActivate = useCallback(async () => {
    if (!activateToken) {
      setActivateError('Scan the QR code first to capture the tag token.');
      return;
    }

    if (!activateLabel.trim()) {
      setActivateError('Please give your tag a name.');
      return;
    }

    setActivateLoading(true);
    setActivateError(null);

    try {
      await apiClient.post('/tags/activate', {
        token: activateToken,
        label: activateLabel.trim(),
      });
      closeActivateScanner();
      await fetchTags();
    } catch (err) {
      setActivateError(err instanceof ApiError ? err.message : 'Failed to activate tag. Please try again.');
    } finally {
      setActivateLoading(false);
    }
  }, [activateLabel, activateToken, closeActivateScanner, fetchTags]);

  return (
    <div>
      <PageHeader
        title="My Tags"
        description="Manage and monitor your QR identity tags."
        actions={
          <Button variant="secondary" size="sm" icon={<ScanLine className="h-4 w-4" />} onClick={() => setShowActivateScanner(true)}>
            Scan QR to Activate
          </Button>
        }
      />

      <AnimatePresence>
        {showActivateScanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="overflow-hidden"
          >
            <Card className="mt-6 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-text">Activate a Tag</h2>
                  <p className="mt-1 text-sm text-text-muted">Scan the QR code on your tag. We will extract the token from the Scan2Call link automatically.</p>
                </div>
                <Button variant="ghost" size="sm" icon={<X className="h-4 w-4" />} onClick={closeActivateScanner}>
                  Close
                </Button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-border bg-black/95">
                    <div className="relative aspect-4/3 w-full">
                      <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
                      {!scannerActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-6 text-center text-white">
                          <Camera className="h-8 w-8" />
                          <p className="text-sm text-white/80">Open the camera and point it at your tag&apos;s QR code.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleStartScanner} loading={scannerOpening} icon={<Camera className="h-4 w-4" />}>
                      {scannerOpening ? 'Opening Camera...' : scannerReady ? 'Scan Again' : 'Open Camera'}
                    </Button>
                    {scannerActive && (
                      <Button variant="ghost" onClick={stopScanner}>
                        Stop Camera
                      </Button>
                    )}
                  </div>

                  {scannerStatus && (
                    <Alert variant="info">{scannerStatus}</Alert>
                  )}

                  {scannerError && (
                    <Alert variant="error">{scannerError}</Alert>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-dim">Tag name</label>
                    <input
                      value={activateLabel}
                      onChange={(e) => setActivateLabel(e.target.value)}
                      className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder='e.g. "My car keys"'
                      maxLength={200}
                      disabled={activateLoading}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-surface-raised p-4 text-sm">
                    <div className="text-xs font-semibold uppercase tracking-widest text-text-dim">Scanned token</div>
                    <div className="mt-2 font-mono tracking-widest text-text">
                      {activateToken ?? 'Waiting for QR scan'}
                    </div>
                  </div>

                  <p className="text-xs text-text-dim">Lost mode will be enabled automatically once activation succeeds.</p>

                  {activateError && (
                    <Alert variant="error">{activateError}</Alert>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleActivate} loading={activateLoading} disabled={!activateToken || !activateLabel.trim()}>
                      {activateLoading ? 'Activating...' : 'Activate Tag'}
                    </Button>
                    <Button variant="ghost" onClick={closeActivateScanner}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
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
                <Button variant="secondary" icon={<ScanLine className="h-4 w-4" />} onClick={() => setShowActivateScanner(true)}>
                  Scan QR to Activate
                </Button>
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
