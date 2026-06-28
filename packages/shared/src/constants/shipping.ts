// Flat shipping fees. Australia is the default destination; everywhere else is a
// single worldwide rate for now (real per-region rates can be added later).

/** Flat shipping fee for Australian addresses, in AUD cents. */
export const SHIPPING_AUSTRALIA_IN_CENTS = 500;
/** Flat shipping fee for all non-Australian addresses, in AUD cents. */
export const SHIPPING_WORLDWIDE_IN_CENTS = 1000;
/** Default destination country code applied when none is provided. */
export const DEFAULT_SHIPPING_COUNTRY = 'AU';

/** Flat shipping fee in AUD cents based on the destination country code. */
export function calculateShippingInCents(country?: string | null): number {
  return (country ?? DEFAULT_SHIPPING_COUNTRY).toUpperCase() === 'AU'
    ? SHIPPING_AUSTRALIA_IN_CENTS
    : SHIPPING_WORLDWIDE_IN_CENTS;
}
