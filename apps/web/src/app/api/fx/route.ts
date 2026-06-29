import { NextResponse } from 'next/server';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

// Daily-cached FX rates with AUD as the base, for APPROXIMATE display only (we always
// charge in AUD). Source: open.er-api.com (free, no key). Cached for 24h via the
// fetch revalidate option, with a static fallback so the site never shows broken
// prices if the feed is down.

export const revalidate = 86400; // 24 hours

// Conservative static fallback (units per 1 AUD). Only used if the live feed fails.
const FALLBACK_RATES: Record<string, number> = {
  AUD: 1, USD: 0.66, EUR: 0.61, GBP: 0.52, CAD: 0.9, NZD: 1.08, JPY: 99,
  CNY: 4.7, INR: 55, SGD: 0.88, HKD: 5.1, CHF: 0.58, AED: 2.4, ZAR: 12,
  BRL: 3.6, MXN: 12, SEK: 7, NOK: 7, DKK: 4.5, PLN: 2.6,
};

export async function GET() {
  const codes = Object.keys(SUPPORTED_CURRENCIES);

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/AUD', {
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`FX feed ${res.status}`);
    const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (json.result !== 'success' || !json.rates) throw new Error('FX feed bad payload');

    const rates: Record<string, number> = {};
    for (const code of codes) {
      rates[code] = json.rates[code] ?? FALLBACK_RATES[code] ?? 1;
    }
    return NextResponse.json({ base: 'AUD', rates });
  } catch {
    // Graceful fallback - display still works, just with stale-ish rates.
    return NextResponse.json({ base: 'AUD', rates: FALLBACK_RATES, stale: true });
  }
}
