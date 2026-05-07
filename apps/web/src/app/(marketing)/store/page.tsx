import StorePageClient from './_components/store-page-client';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Store',
  description:
    'Browse Scan2Call QR identity tags - keychain tags, adhesive stickers, luggage tags, and more.',
  path: '/store',
  keywords: ['scan2call store', 'qr tag shop', 'luggage tag qr', 'pet tag qr'],
});

export default function StorePage() {
  return <StorePageClient />;
}
