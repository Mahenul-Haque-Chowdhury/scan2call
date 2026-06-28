import PricingClient from './_components/pricing-client';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'QR Tag Pricing - Plans from $7.25/year',
  description:
    'Scan2Call pricing: QR tags from $7.25/year, Medical ID Band $14.49/year, and Find My devices from $29.99. Choose 1 to 5 years, optional auto-renewal, no subscription.',
  path: '/pricing',
  keywords: [
    'QR tag price',
    'QR tag cost Australia',
    'pet tag price',
    'Find My QR tag price',
    'medical ID band price',
    'lost item protection',
    'no subscription QR tag',
  ],
});

export default function PricingPage() {
  return <PricingClient />;
}
