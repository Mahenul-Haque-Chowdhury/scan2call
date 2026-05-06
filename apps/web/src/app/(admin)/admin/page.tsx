'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Users, Tag, ScanLine, ShoppingCart, DollarSign, Crown, ArrowRight } from 'lucide-react';

interface OverviewStats {
  totalUsers: number;
  totalTags: number;
  totalScans: number;
  totalOrders: number;
  totalRevenueCents: number;
  activeSubscriptions: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const result = await apiClient.get<{ data: OverviewStats }>('/admin/analytics/overview');
        setStats(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load overview');
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

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
        <p className="font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline hover:opacity-80"
        >
          Retry
        </button>
      </Alert>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users },
    { label: 'Total Tags', value: stats?.totalTags ?? 0, icon: Tag },
    { label: 'Total Scans', value: stats?.totalScans ?? 0, icon: ScanLine },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: ShoppingCart },
    {
      label: 'Revenue (AUD)',
      value: `$${((stats?.totalRevenueCents ?? 0) / 100).toFixed(2)}`,
      icon: DollarSign,
    },
    { label: 'Active Subscriptions', value: stats?.activeSubscriptions ?? 0, icon: Crown },
  ];

  const quickLinks = [
    { href: '/admin/users', label: 'Manage Users', description: 'View and manage registered users' },
    { href: '/admin/tags', label: 'Manage Tags', description: 'Browse and filter tag inventory' },
    { href: '/admin/qr-templates', label: 'QR Templates', description: 'Design and manage QR styles' },
    { href: '/admin/orders', label: 'Manage Orders', description: 'Track and update customer orders' },
    { href: '/admin/tags/generate', label: 'Generate Tags', description: 'Create new batches of tag tokens' },
    { href: '/admin/products', label: 'Manage Products', description: 'View the store product catalog' },
    { href: '/admin/analytics', label: 'View Analytics', description: 'Detailed trends and reporting' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-display">Admin Overview</h1>
      <p className="mt-2 text-text-muted">Platform analytics and key metrics at a glance.</p>

      {/* Stat Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isRevenue = card.label === 'Revenue (AUD)';
          return (
            <div key={card.label} className="rounded-lg border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-dim">{card.label}</p>
                <Icon className="h-5 w-5 text-text-dim" />
              </div>
              <p className={`mt-2 text-3xl font-bold ${isRevenue ? 'text-primary' : 'text-text'}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-text">Quick Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/30"
            >
              <div>
                <p className="font-semibold text-text">{link.label}</p>
                <p className="mt-1 text-sm text-text-dim">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-text-dim transition-colors group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
