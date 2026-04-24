import type { Metadata } from 'next';
import PricingClient from './_components/pricing-client';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing. $9.99/mo or $99.99/year (save 17%). All Scan2Call features included.',
};

export default function PricingPage() {
  return <PricingClient />;
}
