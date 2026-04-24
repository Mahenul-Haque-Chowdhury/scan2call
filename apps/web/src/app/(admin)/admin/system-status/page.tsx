'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unconfigured';
  responseMs: number | null;
  message: string;
  details?: Record<string, unknown>;
}

interface MemoryUsage {
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  externalMB: number;
}

interface DatabaseStats {
  users: number;
  tags: number;
  scans: number;
  orders: number;
  activeSubscriptions: number;
}

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'down';
  uptime: string;
  environment: string;
  version: string;
  node: string;
  memory: MemoryUsage;
  timestamp: string;
  summary: {
    healthy: number;
    degraded: number;
    down: number;
    unconfigured: number;
    total: number;
  };
  services: ServiceCheck[];
  database: DatabaseStats | null;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const statusConfig = {
  healthy: { label: 'Healthy', color: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  degraded: { label: 'Degraded', color: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  down: { label: 'Down', color: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', dot: 'bg-red-400' },
  unconfigured: { label: 'Not Configured', color: 'bg-gray-500', text: 'text-text-dim', bg: 'bg-surface-raised', border: 'border-border', dot: 'bg-gray-500' },
};

function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function OverallBanner({ status, uptime, environment }: { status: string; uptime: string; environment: string }) {
  const isHealthy = status === 'healthy';
  const isDegraded = status === 'degraded';

  return (
    <div className={`rounded-lg border-2 p-6 ${
      isHealthy ? 'border-emerald-500/30 bg-emerald-500/10' :
      isDegraded ? 'border-amber-500/30 bg-amber-500/10' :
      'border-red-500/30 bg-red-500/10'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isHealthy ? 'bg-emerald-500/20' : isDegraded ? 'bg-amber-500/20' : 'bg-red-500/20'
          }`}>
            {isHealthy ? (
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            ) : isDegraded ? (
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            ) : (
              <XCircle className="h-6 w-6 text-red-400" />
            )}
          </div>
          <div>
            <h2 className={`text-xl font-bold ${
              isHealthy ? 'text-emerald-400' : isDegraded ? 'text-amber-400' : 'text-red-400'
            }`}>
              {isHealthy ? 'All Systems Operational' : isDegraded ? 'Some Services Degraded' : 'System Issues Detected'}
            </h2>
            <p className={`text-sm ${
              isHealthy ? 'text-emerald-400/70' : isDegraded ? 'text-amber-400/70' : 'text-red-400/70'
            }`}>
              Uptime: {uptime} - Environment: {environment}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const result = await apiClient.get<{ data: SystemStatus }>('/admin/system/status');
      setStatus(result.data);
      setError(null);
      setLastRefresh(new Date());
    } catch {
      setError('Failed to load system status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchStatus(), 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display text-text">System Status</h1>
        <div className="mt-8 flex items-center gap-2 text-sm text-text-dim">
          <Spinner size="sm" />
          Running health checks...
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display text-text">System Status</h1>
        <div className="mt-8">
          <Alert variant="error">
            <p className="text-sm">{error}</p>
            <button onClick={() => fetchStatus(true)} className="mt-2 text-sm font-medium underline">
              Retry
            </button>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display text-text">System Status</h1>
          <p className="mt-1 text-sm text-text-dim">
            Real-time health overview of all services and integrations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-text-dim">
              Last checked: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="secondary"
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            icon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            {refreshing ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className="mt-6">
        <OverallBanner status={status.overall} uptime={status.uptime} environment={status.environment} />
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <SummaryCard label="Healthy" value={status.summary.healthy} total={status.summary.total} color="emerald" />
        <SummaryCard label="Degraded" value={status.summary.degraded} total={status.summary.total} color="amber" />
        <SummaryCard label="Down" value={status.summary.down} total={status.summary.total} color="red" />
        <SummaryCard label="Not Configured" value={status.summary.unconfigured} total={status.summary.total} color="gray" />
      </div>

      {/* Service Checks */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-text">Service Health</h3>
        <div className="mt-4 space-y-3">
          {status.services.map((svc) => (
            <ServiceCard key={svc.name} service={svc} />
          ))}
        </div>
      </div>

      {/* Server Info + Database Stats side by side */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Server Info */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h3 className="text-lg font-semibold text-text">Server Info</h3>
          <dl className="mt-4 space-y-3">
            <InfoRow label="Node.js" value={status.node} />
            <InfoRow label="Version" value={`v${status.version}`} />
            <InfoRow label="Environment" value={status.environment} />
            <InfoRow label="Uptime" value={status.uptime} />
          </dl>
        </div>

        {/* Memory Usage */}
        <div className="rounded-lg border border-border bg-surface p-6">
          <h3 className="text-lg font-semibold text-text">Memory Usage</h3>
          <dl className="mt-4 space-y-3">
            <MemoryBar label="Heap Used" used={status.memory.heapUsedMB} total={status.memory.heapTotalMB} />
            <InfoRow label="Heap Total" value={`${status.memory.heapTotalMB} MB`} />
            <InfoRow label="RSS" value={`${status.memory.rssMB} MB`} />
            <InfoRow label="External" value={`${status.memory.externalMB} MB`} />
          </dl>
        </div>
      </div>

      {/* Database Stats */}
      {status.database && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-text">Database Records</h3>
          <div className="mt-4 grid grid-cols-5 gap-4">
            <StatCard label="Users" value={status.database.users} />
            <StatCard label="Tags" value={status.database.tags} />
            <StatCard label="Scans" value={status.database.scans} />
            <StatCard label="Orders" value={status.database.orders} />
            <StatCard label="Active Subs" value={status.database.activeSubscriptions} />
          </div>
        </div>
      )}

      {/* Auto-refresh notice */}
      <p className="mt-8 text-center text-xs text-text-dim">
        Auto-refreshes every 30 seconds
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30',
    gray: 'text-text-dim bg-surface border-border',
  };
  return (
    <div className={`rounded-lg border p-4 text-center ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs font-medium">{label}</p>
      <p className="text-[10px] opacity-60">{value}/{total} services</p>
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceCheck }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = service.details && Object.keys(service.details).length > 0;

  return (
    <div className="rounded-lg border border-border bg-surface transition-shadow hover:border-border-hover">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`flex w-full items-center justify-between p-4 text-left ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${statusConfig[service.status].color}`} />
          <div>
            <p className="text-sm font-semibold text-text">{service.name}</p>
            <p className="text-xs text-text-dim">{service.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {service.responseMs !== null && (
            <span className={`text-xs font-mono ${
              service.responseMs < 100 ? 'text-emerald-400' :
              service.responseMs < 500 ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {service.responseMs}ms
            </span>
          )}
          <StatusBadge status={service.status} />
          {hasDetails && (
            <ChevronDown
              className={`h-4 w-4 text-text-dim transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>
      {expanded && service.details && (
        <div className="border-t border-border bg-surface-raised px-4 py-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {Object.entries(service.details).map(([key, val]) => (
              <div key={key}>
                <dt className="text-[10px] font-medium uppercase tracking-wider text-text-dim">{key}</dt>
                <dd className="text-xs text-text-muted">{String(val)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-text-dim">{label}</dt>
      <dd className="text-sm font-medium text-text">{value}</dd>
    </div>
  );
}

function MemoryBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-dim">{label}</span>
        <span className="font-medium text-text">{used} / {total} MB ({pct}%)</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-raised">
        <div
          className={`h-full rounded-full transition-all ${
            pct < 60 ? 'bg-emerald-500' : pct < 85 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-center">
      <p className="text-2xl font-bold text-text">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-text-dim">{label}</p>
    </div>
  );
}
