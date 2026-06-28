'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';
import { Tag, ShoppingCart, Package, Tags, CheckCircle2, AlertTriangle, ScanLine } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ChartCard, ChartSkeleton, DonutChart } from '@/components/ui/charts';

const AreaChart = dynamic(
  () => import('@/components/ui/charts').then((m) => m.AreaChart),
  { ssr: false, loading: () => <ChartSkeleton height={220} /> },
);

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
          apiClient.get<{ data: ScanItem[]; meta: { page: number; pageSize: number; total: number } }>('/users/me/scans?page=1&pageSize=100'),
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

  // Bucket scans into a daily series for the last 14 days (client-side, no extra API).
  const scanSeries = useMemo(() => {
    const days = 14;
    const buckets = new Map<string, number>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const scan of scans) {
      const key = new Date(scan.createdAt).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([date, value]) => ({
      label: new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      value,
    }));
  }, [scans]);

  const hasScanActivity = scanSeries.some((d) => d.value > 0);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <Alert variant="error" title="Something went wrong" className="mt-6">{error}</Alert>
      </div>
    );
  }

  const totalTags = stats?.totalTags ?? 0;
  const activeTags = stats?.activeTags ?? 0;
  const lostTags = stats?.lostTags ?? 0;
  const otherTags = Math.max(totalTags - activeTags - lostTags, 0);

  const statItems = [
    { label: 'Total Tags', value: totalTags, icon: <Tags className="h-4.5 w-4.5" /> },
    { label: 'Active Tags', value: activeTags, icon: <CheckCircle2 className="h-4.5 w-4.5" /> },
    { label: 'Lost Tags', value: lostTags, icon: <AlertTriangle className="h-4.5 w-4.5" /> },
    { label: 'Total Scans', value: stats?.totalScans ?? 0, icon: <ScanLine className="h-4.5 w-4.5" /> },
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
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} delay={i * 0.08} />
        ))}
      </div>

      {/* Visual overview: scan trend + tag status */}
      {totalTags > 0 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <ChartCard
            title="Scan Activity"
            subtitle="Last 14 days"
            className="lg:col-span-2"
            delay={0.15}
          >
            {hasScanActivity ? (
              <AreaChart data={scanSeries} height={220} color="primary" ariaLabel="Your scan activity over the last 14 days" />
            ) : (
              <div className="flex h-55 items-center justify-center rounded-lg border border-dashed border-border text-sm text-text-dim">
                No scans in the last 14 days yet.
              </div>
            )}
          </ChartCard>

          <ChartCard title="Tag Status" subtitle="Current breakdown" delay={0.2}>
            <DonutChart
              segments={[
                { label: 'Active', value: activeTags, color: 'success' },
                { label: 'Lost', value: lostTags, color: 'error' },
                { label: 'Other', value: otherTags, color: 'text-muted' },
              ]}
              size={160}
              centerLabel={totalTags.toLocaleString()}
              centerSublabel="tags"
            />
          </ChartCard>
        </div>
      )}

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
            {scans.slice(0, 5).map((scan, i) => (
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
            { href: '/store', icon: ShoppingCart, color: 'text-primary', label: 'Browse Store', desc: 'Buy new tags and accessories' },
            { href: '/orders', icon: Package, color: 'text-primary', label: 'My Orders', desc: 'Track orders and tag renewals' },
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
