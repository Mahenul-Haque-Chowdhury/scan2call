'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { fetchWithAuth } from '@/lib/auth';
import { getApiOrigin } from '@/lib/api-origin';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check } from 'lucide-react';

const TAG_TYPES = [
  { value: 'PET_COLLAR', label: 'Pet Collar Tag' },
  { value: 'CAR_STICKER', label: 'Car Windshield Sticker' },
  { value: 'LUGGAGE_TAG', label: 'Luggage Tag' },
  { value: 'KEYCHAIN', label: 'Keychain Tag' },
  { value: 'MEDICAL_BAND', label: 'Medical / ID Band' },
  { value: 'GENERIC', label: 'Generic Tag' },
];

const FRAME_STYLES = [
  {
    value: 'SCAN2CALL_TOP',
    label: 'Scan2Call on top',
    description: 'Scan2Call at top, contact text at bottom',
  },
  {
    value: 'SCAN2CALL_BOTTOM',
    label: 'Scan2Call on bottom',
    description: 'Contact text at top, Scan2Call at bottom',
  },
];

type FrameStyle = (typeof FRAME_STYLES)[number]['value'];

interface GenerateResult {
  batchId: string;
  batchName: string;
  quantity: number;
  tagType: string;
  tokens: string[];
}

export default function AdminGenerateTagsPage() {
  const [quantity, setQuantity] = useState(100);
  const [tagType, setTagType] = useState('KEYCHAIN');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [storeQrAssets, setStoreQrAssets] = useState(false);
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('SCAN2CALL_TOP');
  const [framePreviewUrl, setFramePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    let objectUrl: string | null = null;

    async function loadPreview() {
      try {
        const apiOrigin = getApiOrigin();
        const res = await fetchWithAuth(
          `${apiOrigin}/api/v1/admin/tags/qr-frame/preview?format=svg&frameStyle=${frameStyle}`,
          { method: 'GET' },
        );
        if (!res.ok) return;
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setFramePreviewUrl(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setFramePreviewUrl(null);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [frameStyle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, unknown> = { quantity, tagType, storeQrAssets, qrFrameStyle: frameStyle };
      if (name.trim()) body.batchName = name.trim();
      if (notes.trim()) body.notes = notes.trim();

      const response = await apiClient.post<{ data: GenerateResult }>('/admin/tags/generate', body);
      setResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tokens.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = result.tokens.join('\n');
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <Link href="/admin/tags" className="inline-flex items-center gap-1.5 text-sm text-text-dim transition-colors hover:text-text">
        <ArrowLeft className="h-4 w-4" />
        Back to Tags
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight font-display">Generate Tags</h1>
        <p className="mt-2 text-text-muted">
          Generate a batch of unique 12-character base62 tag tokens. Each token is
          cryptographically random and non-sequential.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-6">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-text-muted">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            min={1}
            max={10000}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-text-dim">Maximum 10,000 tags per batch.</p>
        </div>

        <div>
          <label htmlFor="tagType" className="block text-sm font-medium text-text-muted">
            Tag Type
          </label>
          <select
            id="tagType"
            value={tagType}
            onChange={(e) => setTagType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {TAG_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="batchName" className="block text-sm font-medium text-text-muted">
            Batch Name (optional)
          </label>
          <input
            type="text"
            id="batchName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., March 2026 Production Run"
            className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="qrFrame" className="block text-sm font-medium text-text-muted">
            Frames
          </label>
          <select
            id="qrFrame"
            value={frameStyle}
            onChange={(e) => setFrameStyle(e.target.value as FrameStyle)}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {FRAME_STYLES.map((frame) => (
              <option key={frame.value} value={frame.value}>
                {frame.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-text-dim">
            {FRAME_STYLES.find((frame) => frame.value === frameStyle)?.description}
          </p>
        </div>

        {framePreviewUrl && (
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-dim">Frame Preview</p>
            <img src={framePreviewUrl} alt="QR frame preview" className="mt-2 w-44 rounded bg-white p-2" />
          </div>
        )}

        <label className="flex items-center gap-3 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={storeQrAssets}
            onChange={(e) => setStoreQrAssets(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary"
          />
          Store PNG + SVG assets in R2
        </label>
        {storeQrAssets && (
          <p className="text-xs text-text-dim">
            QR asset generation is limited to 1,000 tags per request.
          </p>
        )}

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text-muted">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any internal notes about this batch..."
            className="mt-1 block w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <Button
          type="submit"
          disabled={quantity < 1 || quantity > 10000}
          loading={loading}
        >
          {loading ? 'Generating...' : 'Generate Batch'}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <Alert variant="error" className="mt-6 max-w-md">
          {error}
        </Alert>
      )}

      {/* Result */}
      {result && (
        <div className="mt-8 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text">
                Generated {result.tokens.length} Tokens
              </h2>
              <p className="mt-1 text-sm text-text-dim">
                Batch ID: <span className="font-mono">{result.batchId}</span>
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleCopyAll}
              icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied!' : 'Copy All Tokens'}
            </Button>
          </div>

          <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-border bg-surface p-4">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
              {result.tokens.map((token, index) => (
                <span
                  key={index}
                  className="rounded-md bg-surface-raised px-2 py-1 font-mono text-sm text-primary"
                >
                  {token}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
