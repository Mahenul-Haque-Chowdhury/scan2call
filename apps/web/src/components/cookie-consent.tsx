'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { Cookie, Settings2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CONSENT_STORAGE_KEY = 'scan2call-cookie-consent';
const GA_MEASUREMENT_ID = 'G-DC31KTLS5P';

type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = ConsentPreferences & {
  savedAt: string;
};

const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function readStoredConsent(): StoredConsent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value ? (JSON.parse(value) as StoredConsent) : null;
  } catch {
    return null;
  }
}

function saveConsent(preferences: ConsentPreferences) {
  window.localStorage.setItem(
    CONSENT_STORAGE_KEY,
    JSON.stringify({
      ...preferences,
      necessary: true,
      savedAt: new Date().toISOString(),
    } satisfies StoredConsent),
  );
}

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(defaultPreferences);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();

    setMounted(true);
    if (stored) {
      setPreferences({
        necessary: true,
        analytics: Boolean(stored.analytics),
        marketing: Boolean(stored.marketing),
      });
      setAnalyticsEnabled(Boolean(stored.analytics));
      return;
    }

    setVisible(true);
  }, []);

  const confirmConsent = (nextPreferences: ConsentPreferences) => {
    const normalized: ConsentPreferences = { ...nextPreferences, necessary: true };
    saveConsent(normalized);
    setPreferences(normalized);
    setAnalyticsEnabled(normalized.analytics);
    setVisible(false);
    setCustomizing(false);
  };

  if (!mounted) return null;

  return (
    <>
      {analyticsEnabled ? (
        <>
          <Script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      ) : null}

      {visible ? (
        <section
          aria-labelledby="cookie-consent-title"
          className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5"
        >
          <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-border bg-surface/95 shadow-2xl shadow-black/35 backdrop-blur-xl">
            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary-subtle text-primary">
                    <Cookie aria-hidden="true" className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 id="cookie-consent-title" className="text-lg font-semibold text-text">
                        Cookie preferences
                      </h2>
                      <button
                        type="button"
                        aria-label="Close cookie preferences"
                        className="rounded-lg p-1.5 text-text-muted transition hover:bg-surface-overlay hover:text-text lg:hidden"
                        onClick={() => confirmConsent(defaultPreferences)}
                      >
                        <X aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-text-muted">
                      Scan2Call uses necessary cookies for sign-in, security, and checkout. With your permission, we
                      also use analytics cookies to understand site performance. You can accept all, keep only necessary
                      cookies, or choose specific optional categories.
                    </p>
                    <Link href="/privacy" className="mt-2 inline-flex text-sm font-medium text-primary hover:text-primary-hover">
                      Read our privacy policy
                    </Link>
                  </div>
                </div>

                {customizing ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <PreferenceItem
                      icon={<ShieldCheck aria-hidden="true" className="size-4" />}
                      title="Necessary"
                      description="Required for login, account security, checkout, and saved preferences."
                      checked
                      disabled
                    />
                    <PreferenceItem
                      icon={<Settings2 aria-hidden="true" className="size-4" />}
                      title="Analytics"
                      description="Helps us measure traffic and improve pages."
                      checked={preferences.analytics}
                      onChange={(checked) => setPreferences((current) => ({ ...current, analytics: checked }))}
                    />
                    <PreferenceItem
                      icon={<Cookie aria-hidden="true" className="size-4" />}
                      title="Marketing"
                      description="Reserved for future advertising or campaign measurement."
                      checked={preferences.marketing}
                      onChange={(checked) => setPreferences((current) => ({ ...current, marketing: checked }))}
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-3 lg:w-72 lg:grid-cols-1">
                {customizing ? (
                  <Button type="button" size="sm" onClick={() => confirmConsent(preferences)}>
                    Save choices
                  </Button>
                ) : (
                  <Button type="button" size="sm" onClick={() => confirmConsent({ necessary: true, analytics: true, marketing: true })}>
                    Accept all
                  </Button>
                )}
                <Button type="button" variant="secondary" size="sm" onClick={() => confirmConsent(defaultPreferences)}>
                  Necessary only
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustomizing((current) => !current)}
                >
                  {customizing ? 'Hide choices' : 'Customize'}
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function PreferenceItem({
  icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'flex min-h-28 flex-col justify-between rounded-lg border border-border bg-surface-raised p-3 text-sm',
        disabled ? 'cursor-not-allowed opacity-80' : 'hover:border-border-hover',
      )}
    >
      <span className="flex items-center gap-2 font-semibold text-text">
        <span className="text-primary">{icon}</span>
        {title}
      </span>
      <span className="mt-2 text-xs leading-5 text-text-muted">{description}</span>
      <span className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-text-dim">{checked ? 'Enabled' : 'Disabled'}</span>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.checked)}
          className="size-4 accent-primary"
        />
      </span>
    </label>
  );
}
