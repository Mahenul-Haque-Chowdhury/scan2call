'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Users, Tags, ScanLine, ShoppingBag, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard, ChartSkeleton, DonutChart, Sparkline } from '@/components/ui/charts';

// Charts are code-split so the (heavier, interactive) SVG components only load
// once analytics is opened, keeping the admin bundle lean.
const AreaChart = dynamic(
  () => import('@/components/ui/charts').then((m) => m.AreaChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const BarChart = dynamic(
  () => import('@/components/ui/charts').then((m) => m.BarChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

interface OverviewStats {
  totalUsers: number;
  totalTags: number;
  totalScans: number;
  totalOrders: number;
  totalRevenueCents: number;
  activeTags: number;
  expiringSoon: number;
}

interface TimeSeriesEntry {
  date: string;
  count?: number;
  amountCents?: number;
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

/** Shorten an ISO-ish date/bucket label for chart axes. */
function formatLabel(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [scansData, setScansData] = useState<TimeSeriesEntry[]>([]);
  const [revenueData, setRevenueData] = useState<TimeSeriesEntry[]>([]);
  const [tagsData, setTagsData] = useState<TimeSeriesEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [startDate, setStartDate] = useState(getDefaultDateRange().startDate);
  const [endDate, setEndDate] = useState(getDefaultDateRange().endDate);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, scansRes, revenueRes, tagsRes] = await Promise.all([
        apiClient.get<{ data: OverviewStats }>('/admin/analytics/overview'),
        apiClient.get<{ data: TimeSeriesEntry[] }>(
          `/admin/analytics/scans?granularity=${granularity}&startDate=${startDate}&endDate=${endDate}`
        ),
        apiClient.get<{ data: TimeSeriesEntry[] }>(
          `/admin/analytics/revenue?granularity=${granularity}&startDate=${startDate}&endDate=${endDate}`
        ),
        apiClient.get<{ data: TimeSeriesEntry[] }>(
          `/admin/analytics/tags?granularity=${granularity}&startDate=${startDate}&endDate=${endDate}`
        ),
      ]);
      setOverview(overviewRes.data);
      setScansData(Array.isArray(scansRes.data) ? scansRes.data : []);
      setRevenueData(Array.isArray(revenueRes.data) ? revenueRes.data : []);
      setTagsData(Array.isArray(tagsRes.data) ? tagsRes.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [granularity, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const scanSeries = useMemo(
    () => scansData.map((e) => ({ label: formatLabel(e.date), value: e.count ?? 0 })),
    [scansData],
  );
  const revenueSeries = useMemo(
    () => revenueData.map((e) => ({ label: formatLabel(e.date), value: (e.amountCents ?? 0) / 100 })),
    [revenueData],
  );
  const tagSeries = useMemo(
    () => tagsData.map((e) => ({ label: formatLabel(e.date), value: e.count ?? 0 })),
    [tagsData],
  );

  const scanSpark = useMemo(() => scansData.map((e) => e.count ?? 0), [scansData]);
  const revenueSpark = useMemo(() => revenueData.map((e) => (e.amountCents ?? 0) / 100), [revenueData]);
  const tagSpark = useMemo(() => tagsData.map((e) => e.count ?? 0), [tagsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <p className="text-sm font-medium">{error}</p>
        <button onClick={fetchAnalytics} className="mt-3 text-sm underline hover:opacity-80">
          Retry
        </button>
      </Alert>
    );
  }

  const revenueDollars = (overview?.totalRevenueCents ?? 0) / 100;
  const activeTags = overview?.activeTags ?? 0;
  const expiringSoon = overview?.expiringSoon ?? 0;
  const otherTags = Math.max((overview?.totalTags ?? 0) - activeTags - expiringSoon, 0);

  const kpis = [
    { label: 'Total Users', value: overview?.totalUsers ?? 0, icon: <Users className="h-4.5 w-4.5" />, spark: null, color: 'accent' as const },
    { label: 'Total Scans', value: overview?.totalScans ?? 0, icon: <ScanLine className="h-4.5 w-4.5" />, spark: scanSpark, color: 'primary' as const },
    { label: 'Revenue (AUD)', value: `$${revenueDollars.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <DollarSign className="h-4.5 w-4.5" />, spark: revenueSpark, color: 'success' as const },
    { label: 'Total Orders', value: overview?.totalOrders ?? 0, icon: <ShoppingBag className="h-4.5 w-4.5" />, spark: null, color: 'accent' as const },
    { label: 'Total Tags', value: overview?.totalTags ?? 0, icon: <Tags className="h-4.5 w-4.5" />, spark: tagSpark, color: 'primary' as const },
    { label: 'Active Tags', value: activeTags, icon: <CheckCircle2 className="h-4.5 w-4.5" />, spark: null, color: 'success' as const },
    { label: 'Expiring (30d)', value: expiringSoon, icon: <Clock className="h-4.5 w-4.5" />, spark: null, color: 'warning' as const },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-display text-text">Analytics</h1>
      <p className="mt-2 text-text-muted">Platform-wide analytics, trends, and reporting.</p>

      {/* KPI cards with inline sparklines */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            delay={i * 0.05}
          >
            {kpi.spark && kpi.spark.some((v) => v > 0) && (
              <div className="mt-3">
                <Sparkline data={kpi.spark} color={kpi.color} width={200} height={32} className="w-full" />
              </div>
            )}
          </StatCard>
        ))}
      </div>

      {/* Date Range Controls */}
      <div className="mt-10 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-text-muted">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-4 py-2 text-sm text-text scheme-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-text-muted">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-4 py-2 text-sm text-text scheme-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="granularity" className="block text-sm font-medium text-text-muted">
            Granularity
          </label>
          <select
            id="granularity"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as 'day' | 'week' | 'month')}
            className="mt-1 rounded-md border border-border bg-surface px-4 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Scan Volume"
          subtitle="Total QR scans over time"
          className="lg:col-span-2"
        >
          <AreaChart data={scanSeries} color="primary" ariaLabel="Scan volume over time" />
        </ChartCard>

        <ChartCard title="Revenue" subtitle="Order revenue (AUD)">
          <BarChart
            data={revenueSeries}
            color="success"
            ariaLabel="Revenue over time"
            formatValue={(v) => `$${v.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`}
          />
        </ChartCard>

        <ChartCard title="Tag Registrations" subtitle="New tags created">
          <AreaChart data={tagSeries} color="accent" ariaLabel="Tag registrations over time" />
        </ChartCard>

        <ChartCard title="Tag Health" subtitle="Current status breakdown" className="lg:col-span-2">
          <DonutChart
            segments={[
              { label: 'Active', value: activeTags, color: 'success' },
              { label: 'Expiring (30d)', value: expiringSoon, color: 'warning' },
              { label: 'Other', value: otherTags, color: 'text-muted' },
            ]}
            centerLabel={(overview?.totalTags ?? 0).toLocaleString()}
            centerSublabel="total tags"
          />
        </ChartCard>
      </div>
    </div>
  );
}
