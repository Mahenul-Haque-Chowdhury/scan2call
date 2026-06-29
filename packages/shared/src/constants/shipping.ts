// Flat shipping fees. Australia is the default destination; everywhere else is a
// single worldwide rate for now (real per-region rates can be added later).
// We always charge in AUD; the worldwide rate is denominated as ~$5 USD and stored
// here as its fixed AUD equivalent (with a small buffer for FX drift).

/** Flat shipping fee for Australian addresses, in AUD cents. ($5 AUD) */
export const SHIPPING_AUSTRALIA_IN_CENTS = 500;
/** Flat shipping fee for all non-Australian addresses, in AUD cents.
 *  Represents ~$5 USD charged in AUD (1 USD ~= 1.5 AUD). */
export const SHIPPING_WORLDWIDE_IN_CENTS = 750;
/** Default destination country code applied when none is provided. */
export const DEFAULT_SHIPPING_COUNTRY = 'AU';

/** Flat shipping fee in AUD cents based on the destination country code. */
export function calculateShippingInCents(country?: string | null): number {
  return (country ?? DEFAULT_SHIPPING_COUNTRY).toUpperCase() === 'AU'
    ? SHIPPING_AUSTRALIA_IN_CENTS
    : SHIPPING_WORLDWIDE_IN_CENTS;
}
