'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function RedeemGiftsPage() {
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<string | null>(null);
  const [redeemType, setRedeemType] = useState<'SUBSCRIPTION' | 'TAG' | null>(null);

  const handleRedeem = useCallback(async () => {
    if (!redeemCode.trim()) {
      setRedeemResult('Please enter a redeem code.');
      setRedeemType(null);
      return;
    }
    setRedeeming(true);
    setRedeemResult(null);
    setRedeemType(null);
    try {
      const result = await apiClient.post<{ data: { type: 'SUBSCRIPTION' | 'TAG' } }>(
        '/gifts/redeem',
        { code: redeemCode.trim() },
      );
      if (result.data.type === 'TAG') {
        setRedeemResult('Tag gift applied. Your new tag is ready in your Tags list.');
      } else {
        setRedeemResult('Subscription gift applied successfully.');
      }
      setRedeemType(result.data.type);
      setRedeemCode('');
    } catch (err) {
      setRedeemResult(err instanceof ApiError ? err.message : 'Failed to redeem code.');
      setRedeemType(null);
    } finally {
      setRedeeming(false);
    }
  }, [redeemCode]);

  return (
    <div>
      <PageHeader title="Redeem Gifts" description="Apply a gift code to your account." />

      <Card className="mt-6 p-6">
        <p className="text-sm text-text-muted">Have a gift code? Apply it here to unlock access.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            className="flex-1 min-w-55 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Scan2Call-Gift-XXXX"
          />
          <Button onClick={handleRedeem} loading={redeeming}>
            {redeeming ? 'Applying...' : 'Redeem Code'}
          </Button>
        </div>
        {redeemResult && (
          <Alert variant={redeemResult.includes('Failed') ? 'error' : 'success'} className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{redeemResult}</span>
              {redeemType === 'TAG' && (
                <Link href="/tags" className="text-sm font-medium text-primary hover:text-primary-hover">
                  View tags
                </Link>
              )}
            </div>
          </Alert>
        )}
      </Card>
    </div>
  );
}
