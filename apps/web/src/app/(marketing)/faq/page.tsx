import type { Metadata } from 'next';
import FaqClient from './_components/faq-client';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Scan2Call QR identity tags and privacy-first lost item recovery.',
};

export default function FAQPage() {
  return <FaqClient />;
}
