import StorePageClient from './_components/store-page-client';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Shop QR Tags - Pet, Luggage, Car, Passport & Medical',
  description:
    'Buy privacy-first QR tags for pets, luggage, cars, passports, keys, and medical IDs. Finders contact you anonymously with no app required. Ships across Australia and worldwide.',
  path: '/store',
  keywords: [
    'buy QR pet tag',
    'QR luggage tag',
    'car windshield QR sticker',
    'passport QR sticker',
    'keychain QR tag',
    'medical ID QR band',
    'QR tag store Australia',
  ],
});

export default function StorePage() {
  return <StorePageClient />;
}
