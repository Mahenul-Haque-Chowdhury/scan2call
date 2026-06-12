import type { Metadata } from 'next';
import { Phone, MessageSquare, Radio } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Communications',
  description: 'Admin communications - monitor relay sessions, Twilio usage, and messaging logs.',
};

export default function AdminCommunicationsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-display text-text">Communications</h1>
      <p className="mt-2 text-text-muted">
        Monitor Twilio relay sessions, messaging logs, and communication metrics.
      </p>

      {/* Summary Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-text-dim" />
            <p className="text-sm font-medium text-text-dim">Active Relay Sessions</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-text">0</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-text-dim" />
            <p className="text-sm font-medium text-text-dim">Total Calls (30d)</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-text">0</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-text-dim" />
            <p className="text-sm font-medium text-text-dim">Total Messages (30d)</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-text">0</p>
        </div>
      </div>

      {/* Session Log */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text">Recent Relay Sessions</h2>
        <div className="mt-4 rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-6 py-3">
            <div className="grid grid-cols-5 text-sm font-medium text-text-dim">
              <span>Session ID</span>
              <span>Tag</span>
              <span>Type</span>
              <span>Duration</span>
              <span>Date</span>
            </div>
          </div>
          <div className="p-8 text-center text-sm text-text-dim">
            No relay sessions recorded.
          </div>
        </div>
      </div>
    </div>
  );
}
