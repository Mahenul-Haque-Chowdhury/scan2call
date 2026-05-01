'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';
import { Tag, ShoppingCart, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

interface UserStats {
  totalTags: number;
  activeTags: number;
  lostTags: number;
  totalScans: number;
  recentScans: number;
}

interface ScanItem {
  id: string;
  tagId: string;
  city: string;
  country: string;
  createdAt: string;
  tag: { label: string; type: string };
}

function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-5 w-96" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </Card>
        ))}
      </div>
    </div>
  );
}

const quickActionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#redeem-gifts') {
      router.replace('/redeem-gifts');
    }
  }, [router]);

  async function handleResendVerification() {
    if (!user?.email) return;
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await apiClient.post('/auth/resend-verification', { email: user.email });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch { /* silent */ } finally {
      setResendLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [statsRes, scansRes] = await Promise.all([
          apiClient.get<{ data: UserStats }>('/users/me/stats'),
          apiClient.get<{ data: ScanItem[]; meta: { page: number; pageSize: number; total: number } }>('/users/me/scans?page=1&pageSize=5'),
        ]);
        if (!cancelled) { setStats(statsRes.data); setScans(scansRes.data); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <Alert variant="error" title="Something went wrong" className="mt-6">{error}</Alert>
      </div>
    );
  }

  const statItems = [
    { label: 'Total Tags', value: stats?.totalTags ?? 0 },
    { label: 'Active Tags', value: stats?.activeTags ?? 0 },
    { label: 'Lost Tags', value: stats?.lostTags ?? 0 },
    { label: 'Total Scans', value: stats?.totalScans ?? 0 },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome${user?.firstName ? `, ${user.firstName}` : ''}! Here is an overview of your tags and recent activity.`}
      />

      {user && !user.emailVerified && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-4"
        >
          <Alert variant="warning" title="Email not verified">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p>Your email address has not been verified. Please check your inbox for the verification link.</p>
                {resendSuccess && <p className="mt-1 text-xs text-success">Verification email sent!</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={handleResendVerification} loading={resendLoading}>Resend</Button>
            </div>
          </Alert>
        </motion.div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statItems.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} delay={i * 0.08} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="mt-8"
      >
        <h2 className="text-lg font-semibold text-text">Recent Scans</h2>
        {scans.length === 0 ? (
          <Card className="mt-4 p-8 text-center">
            <p className="text-sm text-text-muted">No scan activity yet. Activate a tag to get started.</p>
          </Card>
        ) : (
          <Card className="mt-4 divide-y divide-border">
            {scans.map((scan, i) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-text">{scan.tag.label || 'Unnamed Tag'}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {scan.tag.type}
                    {scan.city || scan.country ? ` · ${[scan.city, scan.country].filter(Boolean).join(', ')}` : ''}
                  </p>
                </div>
                <time className="text-xs text-text-dim" dateTime={scan.createdAt}>
                  {new Date(scan.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </time>
              </motion.div>
            ))}
          </Card>
        )}
      </motion.div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text">Quick Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { href: '/tags', icon: Tag, color: 'text-accent', label: 'Add New Tag', desc: 'Register a new tag to your account' },
            { href: '/store/cart', icon: ShoppingCart, color: 'text-primary', label: 'Browse Store', desc: 'Purchase new tags and accessories' },
            { href: '/subscription', icon: Crown, color: 'text-primary', label: 'Manage Subscription', desc: 'View or update your plan' },
          ].map((item, i) => (
            <motion.div key={item.href} custom={i} variants={quickActionVariants} initial="hidden" animate="visible">
              <Link
                href={item.href}
                className="block bg-surface border border-border rounded-2xl p-6 text-center transition-all duration-200 hover:border-primary/25 hover:bg-surface-raised hover:-translate-y-1 hover:shadow-lg hover:shadow-shadow"
              >
                <item.icon className={`mx-auto h-6 w-6 ${item.color}`} />
                <p className="mt-3 text-sm font-medium text-text">{item.label}</p>
                <p className="mt-1 text-xs text-text-muted">{item.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
