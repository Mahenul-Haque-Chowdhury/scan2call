import type { Metadata } from 'next';
import StorePageClient from './_components/store-page-client';

export const metadata: Metadata = {
  title: 'Store',
  description:
    'Browse Scan2Call QR identity tags - keychain tags, adhesive stickers, luggage tags, and more.',
};

export default function StorePage() {
  return <StorePageClient />;
}
