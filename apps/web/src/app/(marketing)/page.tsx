import type { Metadata } from 'next';
import HomePageClient from './_components/home-page-client';

export const metadata: Metadata = {
  title: 'Scan2Call - Privacy-First QR Identity Tags',
  description:
    'Protect your valuables with anonymous QR tags. When someone finds your lost item, they can contact you without ever seeing your personal details.',
};

export default function HomePage() {
  return <HomePageClient />;
}
