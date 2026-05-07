import HowItWorksClient from './_components/how-it-works-client';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'How it Works',
  description:
    'Discover how Scan2Call QR tags protect your privacy while making it easy for finders to contact you.',
  path: '/how-it-works',
  keywords: ['how scan2call works', 'qr tag privacy', 'anonymous contact relay'],
});

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
