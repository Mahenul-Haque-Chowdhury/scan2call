// Tag (QR) duration + pricing rules. The QR is the paid product and expires.

/** Minimum duration a customer can purchase, in years. */
export const TAG_MIN_DURATION_YEARS = 1;
/** Maximum duration a customer can purchase, in years. */
export const TAG_MAX_DURATION_YEARS = 5;
/** Default duration applied when none is specified (retail claim, gifts, admin assign). */
export const TAG_DEFAULT_DURATION_YEARS = 1;

export interface TagPriceInput {
  /** Per-year (QR yearly) price in AUD cents. */
  priceInCents: number;
  /** Whether this product is a Find My device (Pet Collar, Keychain). */
  hasFindMy: boolean;
  /** Flat device price (AUD cents) that INCLUDES year 1. Required when hasFindMy. */
  devicePriceInCents?: number | null;
  /** Number of years purchased (1-5). */
  years: number;
}

/**
 * Compute the price for a single unit of a tag product for the chosen duration, in AUD cents.
 *
 * - Find My device: devicePriceInCents (includes year 1) + priceInCents * (years - 1)
 * - Otherwise:      priceInCents * years
 */
export function calculateTagUnitPriceInCents({
  priceInCents,
  hasFindMy,
  devicePriceInCents,
  years,
}: TagPriceInput): number {
  const clampedYears = Math.max(
    TAG_MIN_DURATION_YEARS,
    Math.min(TAG_MAX_DURATION_YEARS, Math.floor(years)),
  );

  if (hasFindMy) {
    const base = devicePriceInCents ?? 0;
    return base + priceInCents * (clampedYears - 1);
  }

  return priceInCents * clampedYears;
}
