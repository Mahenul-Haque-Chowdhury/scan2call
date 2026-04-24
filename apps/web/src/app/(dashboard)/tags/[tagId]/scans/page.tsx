'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

interface Scan { id: string; ipAddress: string; city: string | null; country: string | null; latitude: number | null; longitude: number | null; contactInitiated: boolean; createdAt: string; }
interface ScansResponse { data: Scan[]; meta: { page: number; pageSize: number; total: number }; }

const PAGE_SIZE = 20;
function formatDate(dateStr: string): string { return new Date(dateStr).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

export default function TagScansPage() {
  const params = useParams<{ tagId: string }>();
  const tagId = params.tagId;
  const [scans, setScans] = useState<Scan[]>([]);
  const [meta, setMeta] = useState<ScansResponse['meta'] | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async (p: number) => {
    setIsLoading(true); setError(null);
    try {
      const result = await apiClient.get<ScansResponse>(`/tags/${tagId}/scans?page=${p}&pageSize=${PAGE_SIZE}`);
      setScans(result.data); setMeta(result.meta);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load scans.'); }
    finally { setIsLoading(false); }
  }, [tagId]);

  useEffect(() => { fetchScans(page); }, [fetchScans, page]);

  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 0;

  return (
    <div>
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link href={`/tags/${tagId}`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"><ArrowLeft className="h-4 w-4" />Back to Tag Details</Link>
      </motion.div>

      <div className="mt-6">
        <PageHeader
          title="Scan History"
          description={meta ? `All scans recorded for this tag. (${meta.total} total)` : 'All scans recorded for this tag.'}
        />
      </div>

      {isLoading && (
        <div className="mt-12 flex justify-center"><div className="flex flex-col items-center gap-3"><Spinner size="lg" className="text-text-dim" /><p className="text-sm text-text-muted">Loading scans...</p></div></div>
      )}

      {!isLoading && error && (
        <Alert variant="error" className="mt-8"><div className="text-center"><p>{error}</p><button onClick={() => fetchScans(page)} className="mt-3 text-sm font-medium text-error underline hover:opacity-80">Try again</button></div></Alert>
      )}

      {!isLoading && !error && scans.length === 0 && (
        <Card className="mt-8 p-12 text-center rounded-2xl"><p className="text-sm text-text-muted">No scans recorded yet for this tag.</p></Card>
      )}

      {!isLoading && !error && scans.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="mt-8 overflow-hidden rounded-2xl">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-raised">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Coordinates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Contact Initiated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scans.map((scan, i) => (
                    <motion.tr
                      key={scan.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      className="hover:bg-surface-raised transition-colors"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-text">{formatDate(scan.createdAt)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-text-muted">
                        {scan.city && scan.country ? `${scan.city}, ${scan.country}` : scan.country || <span className="text-text-dim">Unknown</span>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-text-muted">
                        {scan.latitude != null && scan.longitude != null ? `${scan.latitude.toFixed(4)}, ${scan.longitude.toFixed(4)}` : <span className="text-text-dim">--</span>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm"><Badge variant={scan.contactInitiated ? 'success' : 'neutral'}>{scan.contactInitiated ? 'Yes' : 'No'}</Badge></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-text-muted">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
