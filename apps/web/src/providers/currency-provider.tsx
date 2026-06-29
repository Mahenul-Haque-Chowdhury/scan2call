'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  formatMoney,
  isSupportedCurrency,
  type CurrencyCode,
  type FxRates,
} from '@/lib/currency';

// Cookie the geo middleware sets (default currency) and the user override is persisted
// to. One cookie, last write wins; a manual choice simply overwrites the geo default.
const CURRENCY_COOKIE = 's2c_currency';

interface CurrencyContextValue {
  /** Active display currency. */
  currency: CurrencyCode;
  /** Change the display currency (persists to cookie). */
  setCurrency: (code: CurrencyCode) => void;
  /** Whether the active currency is the base (AUD) - i.e. exact, not converted. */
  isBase: boolean;
  /** Format with the "≈ ... approx." label. Use where totals matter (cart/checkout). */
  format: (audCents: number) => string;
  /** Format the converted value WITHOUT the verbose "approx." suffix. Use in dense
   *  UI like product cards; pair with a single shared disclaimer line. */
  formatCompact: (audCents: number) => string;
  /** All currencies offered in the switcher. */
  options: typeof SUPPORTED_CURRENCIES;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}

function writeCookie(code: string) {
  // 1 year, site-wide. Display-only preference; no sensitive data.
  document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
}

export function CurrencyProvider({
  children,
  initialCurrency,
}: {
  children: ReactNode;
  /** Server-resolved default (from the geo cookie) to avoid a flash of AUD. */
  initialCurrency?: string;
}) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(
    isSupportedCurrency(initialCurrency)
      ? (initialCurrency.toUpperCase() as CurrencyCode)
      : (BASE_CURRENCY as CurrencyCode),
  );
  const [rates, setRates] = useState<FxRates | null>(null);

  // Fetch the daily-cached FX rates once on mount (display only).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/fx')
      .then((r) => r.json())
      .then((json: { rates?: FxRates }) => {
        if (!cancelled && json?.rates) setRates(json.rates);
      })
      .catch(() => {
        /* keep null - formatMoney falls back to AUD value */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    writeCookie(code);
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      isBase: currency === BASE_CURRENCY,
      format: (audCents: number) =>
        formatMoney(audCents, currency, rates, { approximate: true }),
      formatCompact: (audCents: number) =>
        formatMoney(audCents, currency, rates),
      options: SUPPORTED_CURRENCIES,
    }),
    [currency, setCurrency, rates],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}
