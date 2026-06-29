// Postcode validation across all countries. We ship worldwide but only charge AUD.
// Three tiers (kept deliberately low-maintenance):
//   1. AU (home market)      -> strict 4-digit.
//   2. No-postcode countries -> field optional/empty allowed.
//   3. Everyone else         -> lenient 2-12 alphanumeric/space/hyphen sanity check.

/** Countries that do NOT use a postal code system. Postcode is optional for these. */
export const COUNTRIES_WITHOUT_POSTCODE = new Set<string>([
  'AE', 'AG', 'AO', 'AW', 'BS', 'BZ', 'BJ', 'BO', 'BW', 'BF', 'BI', 'CM', 'CF',
  'KM', 'CG', 'CD', 'CI', 'DJ', 'DM', 'GQ', 'ER', 'FJ', 'TF', 'GM', 'GH', 'GD',
  'GN', 'GY', 'HK', 'IE', 'JM', 'KE', 'KI', 'KP', 'LY', 'MO', 'MW', 'ML', 'MR',
  'NR', 'QA', 'RW', 'KN', 'LC', 'ST', 'SC', 'SL', 'SB', 'SO', 'SR', 'SY', 'TZ',
  'TL', 'TG', 'TO', 'TV', 'UG', 'VU', 'YE', 'ZW',
]);

/** Whether a country uses postal codes at all. */
export function countryUsesPostcode(code?: string | null): boolean {
  if (!code) return true;
  return !COUNTRIES_WITHOUT_POSTCODE.has(code.toUpperCase());
}

const AU_POSTCODE = /^\d{4}$/;
const GENERIC_POSTCODE = /^[A-Za-z0-9][A-Za-z0-9 -]{0,10}[A-Za-z0-9]$/;

export interface PostcodeCheck {
  valid: boolean;
  /** Error message when invalid; undefined when valid. */
  message?: string;
}

/**
 * Validate a postcode for a destination country using the 3-tier rule.
 * `postcode` may be empty/undefined; that is only valid for no-postcode countries.
 */
export function validatePostcode(
  postcode: string | null | undefined,
  country?: string | null,
): PostcodeCheck {
  const code = (country ?? 'AU').toUpperCase();
  const value = (postcode ?? '').trim();

  // Tier 2: countries without a postal system. Empty is fine.
  if (!countryUsesPostcode(code)) {
    return { valid: true };
  }

  // Tier 1: Australia, strict.
  if (code === 'AU') {
    return AU_POSTCODE.test(value)
      ? { valid: true }
      : { valid: false, message: 'Must be a valid 4-digit Australian postcode' };
  }

  // Tier 3: everyone else, lenient sanity check (must be present).
  if (!value) {
    return { valid: false, message: 'Postcode is required' };
  }
  return GENERIC_POSTCODE.test(value)
    ? { valid: true }
    : { valid: false, message: 'Enter a valid postal code' };
}
