import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg p-8 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-text">
        Page Not Found
      </h1>
      <p className="mt-2 text-text-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Go Home</Link>
      </Button>
    </main>
  );
}
