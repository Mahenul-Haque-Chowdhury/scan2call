// Local-currency DISPLAY. We always charge in AUD; converted prices shown to visitors
// are approximate (the exact charge is the AUD amount on the Stripe page). Conversion
// rates come from a daily-cached FX feed keyed on AUD (see /api/fx and the
// CurrencyProvider). All money values in the app are AUD cents.

export interface CurrencyMeta {
  /** ISO 4217 code, e.g. 'AUD'. */
  code: string;
  /** BCP-47 locale used for Intl formatting, e.g. 'en-AU'. */
  locale: string;
  /** Human label for the switcher, e.g. 'Australian Dollar'. */
  label: string;
}

// Base currency the whole system is priced and charged in.
export const BASE_CURRENCY = 'AUD';

// Currencies we offer for display. Symbols and decimal handling come from Intl, so we
// only track the code + a locale that renders it nicely + a label.
export const SUPPORTED_CURRENCIES = {
  AUD: { code: 'AUD', locale: 'en-AU', label: 'Australian Dollar' },
  USD: { code: 'USD', locale: 'en-US', label: 'US Dollar' },
  EUR: { code: 'EUR', locale: 'en-IE', label: 'Euro' },
  GBP: { code: 'GBP', locale: 'en-GB', label: 'British Pound' },
  CAD: { code: 'CAD', locale: 'en-CA', label: 'Canadian Dollar' },
  NZD: { code: 'NZD', locale: 'en-NZ', label: 'New Zealand Dollar' },
  JPY: { code: 'JPY', locale: 'ja-JP', label: 'Japanese Yen' },
  CNY: { code: 'CNY', locale: 'zh-CN', label: 'Chinese Yuan' },
  INR: { code: 'INR', locale: 'en-IN', label: 'Indian Rupee' },
  SGD: { code: 'SGD', locale: 'en-SG', label: 'Singapore Dollar' },
  HKD: { code: 'HKD', locale: 'en-HK', label: 'Hong Kong Dollar' },
  CHF: { code: 'CHF', locale: 'de-CH', label: 'Swiss Franc' },
  AED: { code: 'AED', locale: 'ar-AE', label: 'UAE Dirham' },
  ZAR: { code: 'ZAR', locale: 'en-ZA', label: 'South African Rand' },
  BRL: { code: 'BRL', locale: 'pt-BR', label: 'Brazilian Real' },
  MXN: { code: 'MXN', locale: 'es-MX', label: 'Mexican Peso' },
  SEK: { code: 'SEK', locale: 'sv-SE', label: 'Swedish Krona' },
  NOK: { code: 'NOK', locale: 'nb-NO', label: 'Norwegian Krone' },
  DKK: { code: 'DKK', locale: 'da-DK', label: 'Danish Krone' },
  PLN: { code: 'PLN', locale: 'pl-PL', label: 'Polish Zloty' },
  // --- Expanded coverage (major customer markets) ---
  KRW: { code: 'KRW', locale: 'ko-KR', label: 'South Korean Won' },
  THB: { code: 'THB', locale: 'th-TH', label: 'Thai Baht' },
  MYR: { code: 'MYR', locale: 'ms-MY', label: 'Malaysian Ringgit' },
  IDR: { code: 'IDR', locale: 'id-ID', label: 'Indonesian Rupiah' },
  PHP: { code: 'PHP', locale: 'en-PH', label: 'Philippine Peso' },
  VND: { code: 'VND', locale: 'vi-VN', label: 'Vietnamese Dong' },
  TWD: { code: 'TWD', locale: 'zh-TW', label: 'New Taiwan Dollar' },
  SAR: { code: 'SAR', locale: 'ar-SA', label: 'Saudi Riyal' },
  QAR: { code: 'QAR', locale: 'ar-QA', label: 'Qatari Riyal' },
  KWD: { code: 'KWD', locale: 'ar-KW', label: 'Kuwaiti Dinar' },
  BHD: { code: 'BHD', locale: 'ar-BH', label: 'Bahraini Dinar' },
  OMR: { code: 'OMR', locale: 'ar-OM', label: 'Omani Rial' },
  ILS: { code: 'ILS', locale: 'he-IL', label: 'Israeli Shekel' },
  TRY: { code: 'TRY', locale: 'tr-TR', label: 'Turkish Lira' },
  EGP: { code: 'EGP', locale: 'ar-EG', label: 'Egyptian Pound' },
  NGN: { code: 'NGN', locale: 'en-NG', label: 'Nigerian Naira' },
  KES: { code: 'KES', locale: 'en-KE', label: 'Kenyan Shilling' },
  PKR: { code: 'PKR', locale: 'en-PK', label: 'Pakistani Rupee' },
  BDT: { code: 'BDT', locale: 'bn-BD', label: 'Bangladeshi Taka' },
  LKR: { code: 'LKR', locale: 'si-LK', label: 'Sri Lankan Rupee' },
  CZK: { code: 'CZK', locale: 'cs-CZ', label: 'Czech Koruna' },
  HUF: { code: 'HUF', locale: 'hu-HU', label: 'Hungarian Forint' },
  RON: { code: 'RON', locale: 'ro-RO', label: 'Romanian Leu' },
  BGN: { code: 'BGN', locale: 'bg-BG', label: 'Bulgarian Lev' },
  ISK: { code: 'ISK', locale: 'is-IS', label: 'Icelandic Krona' },
  CLP: { code: 'CLP', locale: 'es-CL', label: 'Chilean Peso' },
  COP: { code: 'COP', locale: 'es-CO', label: 'Colombian Peso' },
  ARS: { code: 'ARS', locale: 'es-AR', label: 'Argentine Peso' },
  PEN: { code: 'PEN', locale: 'es-PE', label: 'Peruvian Sol' },
} satisfies Record<string, CurrencyMeta>;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

export function isSupportedCurrency(code?: string | null): code is CurrencyCode {
  return !!code && code.toUpperCase() in SUPPORTED_CURRENCIES;
}

// Country (ISO 3166-1 alpha-2) -> display currency. Only countries whose currency we
// support are listed; everything else falls back to USD (handled by countryToCurrency).
const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  AU: 'AUD',
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  NZ: 'NZD',
  JP: 'JPY',
  CN: 'CNY',
  IN: 'INR',
  SG: 'SGD',
  HK: 'HKD',
  CH: 'CHF',
  AE: 'AED',
  ZA: 'ZAR',
  BR: 'BRL',
  MX: 'MXN',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  KR: 'KRW',
  TH: 'THB',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  TW: 'TWD',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
  IL: 'ILS',
  TR: 'TRY',
  EG: 'EGP',
  NG: 'NGN',
  KE: 'KES',
  PK: 'PKR',
  BD: 'BDT',
  LK: 'LKR',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  BG: 'BGN',
  IS: 'ISK',
  CL: 'CLP',
  CO: 'COP',
  AR: 'ARS',
  PE: 'PEN',
  // Eurozone members -> EUR
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR',
  GR: 'EUR', IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR',
  NL: 'EUR', PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR', HR: 'EUR',
};

/** Map a visitor country to the currency we display. Defaults to USD for the world. */
export function countryToCurrency(country?: string | null): CurrencyCode {
  if (!country) return 'USD';
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? 'USD';
}

/** FX rates keyed by currency code, expressed as units of that currency per 1 AUD. */
export type FxRates = Record<string, number>;

/**
 * Convert an AUD-cents amount into the target currency's minor-unit-aware NUMBER
 * (not cents). Returns a float in major units (e.g. dollars), ready for Intl.
 * If no rate is available, falls back to the AUD amount (rate = 1).
 */
export function convertFromAud(
  audCents: number,
  currency: CurrencyCode,
  rates: FxRates | null | undefined,
): number {
  const aud = audCents / 100;
  if (currency === BASE_CURRENCY) return aud;
  const rate = rates?.[currency];
  if (!rate || rate <= 0) return aud; // graceful fallback: show AUD value
  return aud * rate;
}

interface FormatOptions {
  /** Prefix with "≈" and append " approx." to signal an indicative price. */
  approximate?: boolean;
}

/**
 * Format an AUD-cents amount in the given display currency using Intl.NumberFormat.
 * Pass `approximate` for any non-base currency that was FX-converted.
 */
export function formatMoney(
  audCents: number,
  currency: CurrencyCode,
  rates: FxRates | null | undefined,
  opts: FormatOptions = {},
): string {
  const meta = SUPPORTED_CURRENCIES[currency] ?? SUPPORTED_CURRENCIES.AUD;
  const value = convertFromAud(audCents, currency, rates);

  const formatted = new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: meta.code,
    // Force ASCII digits: our fonts only ship the latin glyph subset, so
    // locales with native numbering systems (bn-BD, ar-AE, etc.) would
    // otherwise render as tofu boxes.
    numberingSystem: 'latn',
  }).format(value);

  // Only label as approximate when we actually converted away from the base currency.
  const isApprox = opts.approximate && currency !== BASE_CURRENCY;
  return isApprox ? `≈ ${formatted} approx.` : formatted;
}
