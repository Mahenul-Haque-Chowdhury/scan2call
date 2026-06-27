import PricingClient from './_components/pricing-client';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Pricing',
  description:
    'Scan2Call pricing: QR tags from $7.25/year, Medical ID Band $14.49/year, Find My devices $29.99 plus $7.25/year. Choose 1 to 5 years, no subscription.',
  path: '/pricing',
  keywords: ['scan2call pricing', 'qr tag price', 'lost item protection', 'find my tag'],
});

export default function PricingPage() {
  return <PricingClient />;
}
