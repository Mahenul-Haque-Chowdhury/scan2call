import ContactClient from './contact-client';
import { createMetadata } from '@/lib/seo';

export const metadata = createMetadata({
  title: 'Contact',
  description: 'Contact the Scan2Call team for support, partnerships, or product questions.',
  path: '/contact',
  keywords: ['scan2call contact', 'qr tag support', 'contact scan2call'],
});

export default function ContactPage() {
  return <ContactClient />;
}
