'use client';

import { motion } from 'framer-motion';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-6"
    >
      <h2 className="font-display text-2xl font-bold">
        Something went wrong
      </h2>
      <div className="mt-4 w-full max-w-md">
        <Alert variant="error">{error.message || 'An unexpected error occurred.'}</Alert>
      </div>
      <Button onClick={reset} className="mt-6">
        Try Again
      </Button>
    </motion.div>
  );
}
