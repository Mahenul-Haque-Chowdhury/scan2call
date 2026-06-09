export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    priceInCents: 299,
    currency: 'AUD',
    interval: 'month',
    intervalCount: 1,
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly',
    priceInCents: 1449,
    currency: 'AUD',
    interval: 'year',
    intervalCount: 1,
  },
  three_year: {
    id: 'three_year',
    name: '3 Years',
    priceInCents: 4347,
    currency: 'AUD',
    interval: 'year',
    intervalCount: 3,
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

export const DEFAULT_SUBSCRIPTION_PLAN_ID: SubscriptionPlanId = 'monthly';

export const SUBSCRIPTION_PRICE_AUD_CENTS =
  SUBSCRIPTION_PLANS.monthly.priceInCents;
export const SUBSCRIPTION_ANNUAL_PRICE_AUD_CENTS =
  SUBSCRIPTION_PLANS.yearly.priceInCents;

export const SUBSCRIPTION_FEATURES = {
  unlimitedTags: true,
  unlimitedScans: true,
  whatsAppRelay: true,
  locationTracking: true,
  customLostMessage: true,
  tagPhotos: true,
  storePurchasing: true,
} as const;
