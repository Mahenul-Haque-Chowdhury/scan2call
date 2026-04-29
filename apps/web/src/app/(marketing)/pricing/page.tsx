import type { Metadata } from 'next';
import PricingClient from './_components/pricing-client';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Scan2Call pricing: $2.99/month, $14.49/year, $79.49 for 5 years, plus enterprise and bulk order proposals for businesses.',
};

export default function PricingPage() {
  return <PricingClient />;
}
