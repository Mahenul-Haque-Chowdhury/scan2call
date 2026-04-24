export interface SubscriptionInfo {
  id: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
}

export interface SubscriptionPlan {
  priceMonthlyAudCents: number;
  priceAnnualAudCents: number;
  annualDiscountPercent: number;
  features: string[];
}
