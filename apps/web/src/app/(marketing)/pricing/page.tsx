import PricingClient from './_components/pricing-client';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Pricing',
  description:
    'Scan2Call pricing: $2.99/month, $14.49/year, $79.49 for 5 years, plus enterprise and bulk order proposals for businesses.',
  path: '/pricing',
  keywords: ['scan2call pricing', 'qr tag subscription', 'lost item protection plans'],
});

export default function PricingPage() {
  return <PricingClient />;
}
