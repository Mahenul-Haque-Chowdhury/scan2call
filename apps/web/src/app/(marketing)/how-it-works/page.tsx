import type { Metadata } from 'next';
import HowItWorksClient from './_components/how-it-works-client';

export const metadata: Metadata = {
  title: 'How it Works',
  description:
    'Discover how Scan2Call QR tags protect your privacy while making it easy for finders to contact you.',
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
