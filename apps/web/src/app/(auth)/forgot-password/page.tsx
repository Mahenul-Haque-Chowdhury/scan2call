import { createMetadata } from '@/lib/seo';
import ForgotPasswordPage from './forgot-password-client';

export const metadata = createMetadata({
  title: 'Forgot Password',
  description: 'Reset your Scan2Call account password.',
  path: '/forgot-password',
  noindex: true,
});

export default function Page() {
  return <ForgotPasswordPage />;
}
