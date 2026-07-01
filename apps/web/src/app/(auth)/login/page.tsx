import { createMetadata } from '@/lib/seo';
import LoginPage from './login-client';

export const metadata = createMetadata({
  title: 'Sign In',
  description: 'Sign in to your Scan2Call account to manage your QR tags.',
  path: '/login',
  noindex: true,
});

export default function Page() {
  return <LoginPage />;
}
