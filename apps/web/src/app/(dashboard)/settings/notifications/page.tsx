'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiClient, ApiError } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';

interface NotificationSettings { notifyOnScan: boolean; notifyViaSms: boolean; notifyViaEmail: boolean; notifyViaPush: boolean; }

function Toggle({ id, checked, onChange, disabled }: { id: string; checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) {
  return (
    <motion.button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-surface-raised'}`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({ notifyOnScan: true, notifyViaSms: false, notifyViaEmail: true, notifyViaPush: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiClient.get<{ data: NotificationSettings & Record<string, unknown> }>('/users/me');
        if (!cancelled) {
          const d = result.data;
          setSettings({ notifyOnScan: d.notifyOnScan ?? true, notifyViaSms: d.notifyViaSms ?? false, notifyViaEmail: d.notifyViaEmail ?? true, notifyViaPush: d.notifyViaPush ?? false });
        }
      } catch { if (!cancelled) setFetchError('Failed to load notification settings.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true); setError(null); setSuccess(false);
    try { await apiClient.patch('/users/me/notifications', settings); setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to save notification settings.'); }
    finally { setSaving(false); }
  }, [settings]);

  const updateSetting = useCallback((key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value })); setSuccess(false);
  }, []);

  const options: { key: keyof NotificationSettings; title: string; description: string }[] = [
    { key: 'notifyOnScan', title: 'Scan notifications', description: 'Receive a notification whenever one of your tags is scanned.' },
    { key: 'notifyViaEmail', title: 'Email notifications', description: 'Receive scan alerts and account updates via email.' },
    { key: 'notifyViaSms', title: 'SMS notifications', description: 'Receive scan alerts via SMS to your registered phone number.' },
    { key: 'notifyViaPush', title: 'Push notifications', description: 'Receive real-time browser push notifications for tag scans.' },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"><ArrowLeft className="h-4 w-4" />Back to Settings</Link>
      </motion.div>

      <div className="mt-6">
        <PageHeader title="Notifications" description="Choose how you want to be notified about tag scans and account activity." />
      </div>

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-text-muted"><Spinner size="sm" />Loading settings...</div>
      ) : fetchError ? (
        <Alert variant="error" className="mt-8">{fetchError}</Alert>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="mt-8 space-y-6"
        >
          <Card className="rounded-2xl overflow-hidden">
            {options.map((opt, idx) => (
              <motion.div
                key={opt.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className={`flex items-center justify-between p-5 ${idx < options.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="pr-4">
                  <label htmlFor={`toggle-${opt.key}`} className="text-sm font-medium text-text cursor-pointer">{opt.title}</label>
                  <p className="mt-0.5 text-xs text-text-muted">{opt.description}</p>
                </div>
                <Toggle id={`toggle-${opt.key}`} checked={settings[opt.key]} onChange={(val) => updateSetting(opt.key, val)} disabled={saving} />
              </motion.div>
            ))}
          </Card>

          {error && <p className="text-sm text-error">{error}</p>}
          {success && <p className="text-sm text-success">Notification preferences saved.</p>}

          <Button onClick={handleSave} loading={saving}>{saving ? 'Saving...' : 'Save Preferences'}</Button>
        </motion.div>
      )}
    </div>
  );
}
