import { createMetadata } from '@/lib/seo';
import RegisterPage from './register-client';

export const metadata = createMetadata({
  title: 'Create Account',
  description: 'Create a free Scan2Call account to start protecting your belongings with privacy-first QR tags.',
  path: '/register',
  noindex: true,
});

export default function Page() {
  return <RegisterPage />;
}
