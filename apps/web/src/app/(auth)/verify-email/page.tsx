import { createMetadata } from '@/lib/seo';
import VerifyEmailPage from './verify-email-client';

export const metadata = createMetadata({
  title: 'Verify Email',
  description: 'Verify your email address to activate your Scan2Call account.',
  path: '/verify-email',
  noindex: true,
});

export default function Page() {
  return <VerifyEmailPage />;
}
