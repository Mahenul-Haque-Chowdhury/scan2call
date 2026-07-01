import { createMetadata } from '@/lib/seo';
import ResetPasswordPage from './reset-password-client';

export const metadata = createMetadata({
  title: 'Reset Password',
  description: 'Choose a new password for your Scan2Call account.',
  path: '/reset-password',
  noindex: true,
});

export default function Page() {
  return <ResetPasswordPage />;
}
