'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';

interface OverviewStats {
  totalUsers: number;
  totalTags: number;
  totalScans: number;
  totalOrders: number;
  totalRevenueCents: number;
  activeSubscriptions: number;
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
        <button
          onClick={fetchAnalytics}
          className="mt-3 text-sm underline hover:opacity-80"
        >
          Retry
        </button>
      </Alert>
    );
  }

  const overviewCards = [
    { label: 'Total Users', value: overview?.totalUsers ?? 0 },
    { label: 'Total Tags', value: overview?.totalTags ?? 0 },
    { label: 'Total Scans', value: overview?.totalScans ?? 0 },
    { label: 'Total Orders', value: overview?.totalOrders ?? 0 },
    {
      label: 'Total Revenue (AUD)',
      value: `$${((overview?.totalRevenueCents ?? 0) / 100).toFixed(2)}`,
      isRevenue: true,
    },
    { label: 'Active Subscriptions', value: overview?.activeSubscriptions ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-display text-text">Analytics</h1>
      <p className="mt-2 text-text-muted">Platform-wide analytics, trends, and reporting.</p>

      {/* Overview Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviewCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-surface p-6">
            <p className="text-sm font-medium text-text-dim">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${'isRevenue' in card && card.isRevenue ? 'text-primary' : 'text-text'}`}>
              {card.value}
            </p>
          </div>
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

      {/* Scan Volume Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text">Scan Volume</h2>
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <div className="grid grid-cols-2 border-b border-border px-6 py-3 text-sm font-medium text-text-dim">
            <span>Date</span>
            <span className="text-right">Scans</span>
          </div>
          {scansData.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-dim">
              No scan data for this period.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {scansData.map((entry, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 border-b border-border px-6 py-2 text-sm last:border-b-0"
                >
                  <span className="text-text-muted">{entry.date}</span>
                  <span className="text-right font-medium text-text">{entry.count ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text">Revenue</h2>
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <div className="grid grid-cols-2 border-b border-border px-6 py-3 text-sm font-medium text-text-dim">
            <span>Date</span>
            <span className="text-right">Amount (AUD)</span>
          </div>
          {revenueData.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-dim">
              No revenue data for this period.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {revenueData.map((entry, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 border-b border-border px-6 py-2 text-sm last:border-b-0"
                >
                  <span className="text-text-muted">{entry.date}</span>
                  <span className="text-right font-medium text-primary">
                    ${((entry.amountCents ?? 0) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tag Creation Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text">Tag Registrations</h2>
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <div className="grid grid-cols-2 border-b border-border px-6 py-3 text-sm font-medium text-text-dim">
            <span>Date</span>
            <span className="text-right">Tags Created</span>
          </div>
          {tagsData.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-dim">
              No tag data for this period.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {tagsData.map((entry, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 border-b border-border px-6 py-2 text-sm last:border-b-0"
                >
                  <span className="text-text-muted">{entry.date}</span>
                  <span className="text-right font-medium text-text">{entry.count ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
